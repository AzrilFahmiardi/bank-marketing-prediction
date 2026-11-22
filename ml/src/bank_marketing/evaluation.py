"""Splitting schemes and evaluation metrics."""
import numpy as np
from sklearn.metrics import (auc, average_precision_score, balanced_accuracy_score, f1_score,
                             matthews_corrcoef, precision_score, recall_score, roc_auc_score)


def chronological_split(n, test_size=0.2):
    """Out-of-time holdout: first (1 - test_size) rows train, the rest test."""
    cut = int(n * (1 - test_size))
    return np.arange(cut), np.arange(cut, n)


def rolling_window_splits(n, n_folds=3, train_blocks=5):
    """Rolling-window folds over time-ordered rows.

    Rows are cut into (train_blocks + n_folds) equal blocks. Fold i trains on a fixed
    window of `train_blocks` blocks and tests on the block right after it, then the
    window slides forward by one block.
    """
    block = n // (train_blocks + n_folds)
    splits = []
    for i in range(n_folds):
        tr = np.arange(i * block, (i + train_blocks) * block)
        te = np.arange((i + train_blocks) * block, (i + train_blocks + 1) * block)
        splits.append((tr, te))
    return splits


def get_scores(model, X):
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X)[:, 1]
    return model.decision_function(X)


def gains_curve(y_true, y_score):
    """Cumulative gains: share of positives captured vs share of customers contacted."""
    y_true = np.asarray(y_true)
    order = np.argsort(-np.asarray(y_score), kind="mergesort")
    gains = np.cumsum(y_true[order]) / y_true.sum()
    x = np.arange(1, len(gains) + 1) / len(gains)
    return np.r_[0, x], np.r_[0, gains]


def alift(y_true, y_score):
    x, g = gains_curve(y_true, y_score)
    return auc(x, g)


def capture_at(y_true, y_score, frac):
    y_true = np.asarray(y_true)
    order = np.argsort(-np.asarray(y_score), kind="mergesort")
    k = int(np.ceil(frac * len(y_true)))
    return y_true[order][:k].sum() / y_true.sum()


def rank_metrics(y, s):
    """Threshold-independent metrics."""
    return {"AUC": roc_auc_score(y, s), "ALIFT": alift(y, s),
            "PR-AUC": average_precision_score(y, s), "Capture@20%": capture_at(y, s, 0.2),
            "Capture@50%": capture_at(y, s, 0.5)}


def threshold_metrics(y, pred):
    return {"Precision": precision_score(y, pred, zero_division=0), "Recall": recall_score(y, pred),
            "F1": f1_score(y, pred), "Balanced Acc": balanced_accuracy_score(y, pred),
            "MCC": matthews_corrcoef(y, pred)}


def best_f1_threshold(y, s):
    """Threshold maximising F1 over the score range (works for probabilities and margins)."""
    cands = np.unique(np.quantile(s, np.linspace(0.01, 0.99, 197)))
    f1s = [f1_score(y, (s >= t).astype(int), zero_division=0) for t in cands]
    return float(cands[int(np.argmax(f1s))])
