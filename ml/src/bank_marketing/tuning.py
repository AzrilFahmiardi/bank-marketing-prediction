"""Hyperparameter search spaces and rolling-window tuning."""
import time

import numpy as np
import pandas as pd
from scipy.stats import loguniform, randint, uniform
from sklearn.model_selection import RandomizedSearchCV

from .evaluation import rolling_window_splits
from .features import SEED, build_models

PARAM_SPACES = {
    "Logistic Regression": {"clf__C": loguniform(1e-2, 1e1)},
    "Decision Tree": {"clf__max_depth": randint(3, 12), "clf__min_samples_leaf": randint(20, 200),
                      "clf__criterion": ["gini", "entropy"]},
    "SVM (RBF)": {"clf__C": loguniform(0.1, 10), "clf__gamma": loguniform(1e-4, 1e-1)},
    "Random Forest": {"clf__max_depth": randint(4, 14), "clf__min_samples_leaf": randint(10, 120),
                      "clf__max_features": ["sqrt", 0.3, 0.5]},
    "HistGradientBoosting": {"clf__learning_rate": loguniform(0.01, 0.2), "clf__max_depth": randint(2, 6),
                             "clf__max_iter": randint(50, 300), "clf__min_samples_leaf": randint(20, 200),
                             "clf__l2_regularization": loguniform(1e-3, 10)},
    "LightGBM": {"clf__learning_rate": loguniform(0.01, 0.2), "clf__n_estimators": randint(50, 400),
                 "clf__num_leaves": randint(4, 32), "clf__min_child_samples": randint(20, 200),
                 "clf__subsample": uniform(0.6, 0.4), "clf__subsample_freq": [1],
                 "clf__colsample_bytree": uniform(0.5, 0.5), "clf__reg_lambda": loguniform(1e-3, 10)},
}
N_ITER = {"Logistic Regression": 8, "Decision Tree": 20, "SVM (RBF)": 8,
          "Random Forest": 12, "HistGradientBoosting": 20, "LightGBM": 25}


def tune_models(X_train, y_train, names=None, n_folds=3, train_blocks=5, svm_step=6, verbose=True):
    """RandomizedSearchCV per model, scored by ROC-AUC on rolling-window folds.

    The SVM is searched on every `svm_step`-th row (kernel SVM is too slow on the full set).
    Returns (best_params, summary_df, cv_results dict).
    """
    names = names or list(PARAM_SPACES)
    best, rows, cvs = {}, [], {}
    t0 = time.time()
    for name in names:
        Xt, yt = (X_train.iloc[::svm_step], y_train.iloc[::svm_step]) if name.startswith("SVM") else (X_train, y_train)
        cv = rolling_window_splits(len(Xt), n_folds, train_blocks)
        rs = RandomizedSearchCV(build_models()[name], PARAM_SPACES[name], n_iter=N_ITER[name], scoring="roc_auc",
                                cv=cv, n_jobs=-1 if name != "Random Forest" else 4, refit=False,
                                random_state=SEED, error_score="raise")
        rs.fit(Xt, yt)
        res = pd.DataFrame(rs.cv_results_)
        i = int(res["mean_test_score"].idxmax())
        best[name] = {k.replace("clf__", ""): (v.item() if hasattr(v, "item") else v) for k, v in res.loc[i, "params"].items()}
        cvs[name] = res
        rows.append({"Model": name, "Rolling CV AUC (mean)": res.loc[i, "mean_test_score"],
                     "Rolling CV AUC (std)": res.loc[i, "std_test_score"], "Best params": best[name]})
        if verbose:
            print(f"{name:22s} CV AUC {res.loc[i, 'mean_test_score']:.3f} +/- {res.loc[i, 'std_test_score']:.3f}  ({time.time() - t0:.0f}s)")
    return best, pd.DataFrame(rows), cvs


def apply_params(model, params):
    return model.set_params(**{f"clf__{k}": v for k, v in params.items()})


VOTING_MEMBERS = {"lr": "Logistic Regression", "rf": "Random Forest", "lgbm": "LightGBM"}
VOTING_NAME = "Soft Voting (LR+RF+LGBM)"


def build_voting(best_params):
    """Soft-voting ensemble of the tuned LR, Random Forest, and LightGBM pipelines."""
    from sklearn.ensemble import VotingClassifier
    members = [(k, apply_params(build_models()[n], best_params[n])) for k, n in VOTING_MEMBERS.items()]
    return VotingClassifier(members, voting="soft", n_jobs=1)
