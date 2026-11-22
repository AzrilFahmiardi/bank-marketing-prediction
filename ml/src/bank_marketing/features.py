"""Data loading, feature engineering, and model definitions."""
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from lightgbm import LGBMClassifier

SEED = 42
TARGET = "y"
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "bank-additional-full.csv"

# Raw input columns the model expects (duration is dropped: unknown before the call)
CAT_COLS = ["job", "marital", "education", "default", "housing", "loan",
            "contact", "month", "day_of_week", "poutcome"]
NUM_COLS = ["age", "pdays", "emp.var.rate", "cons.price.idx",
            "cons.conf.idx", "euribor3m", "nr.employed"]
SKEW_COLS = ["campaign", "previous"]
BIN_COLS = ["was_contacted_before"]
RAW_FEATURES = ["age", "job", "marital", "education", "default", "housing", "loan",
                "contact", "month", "day_of_week", "campaign", "pdays", "previous",
                "poutcome", "emp.var.rate", "cons.price.idx", "cons.conf.idx",
                "euribor3m", "nr.employed"]


def load_data(path=DATA_PATH):
    """Load the dataset, drop duplicates, and return (X, y) in original (chronological) order."""
    df = pd.read_csv(path, delimiter=";").drop_duplicates().reset_index(drop=True)
    y = df[TARGET].map({"no": 0, "yes": 1}).astype(int)
    X = df.drop(columns=[TARGET, "duration"])
    return X, y


def add_features(d):
    """was_contacted_before flag, and pdays 999 (never contacted) -> 0."""
    d = d.copy()
    d["was_contacted_before"] = (d["pdays"] != 999).astype(int)
    d["pdays"] = d["pdays"].where(d["pdays"] != 999, 0)
    return d


def make_preprocessor(scale=True):
    num_steps = [("scaler", StandardScaler())] if scale else [("identity", FunctionTransformer(feature_names_out="one-to-one"))]
    skew_steps = [("log1p", FunctionTransformer(np.log1p, feature_names_out="one-to-one"))] + num_steps
    ct = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore", drop="if_binary", sparse_output=False), CAT_COLS),
        ("num", Pipeline(num_steps), NUM_COLS),
        ("skew", Pipeline(skew_steps), SKEW_COLS),
        ("bin", "passthrough", BIN_COLS),
    ])
    return Pipeline([("features", FunctionTransformer(add_features)), ("columns", ct)])


def _pipe(clf, scale):
    return Pipeline([("prep", make_preprocessor(scale)), ("clf", clf)])


def build_models():
    """Fresh, untuned pipelines on raw input columns."""
    return {
        "Logistic Regression": _pipe(LogisticRegression(max_iter=2000, class_weight="balanced", random_state=SEED), True),
        "Decision Tree": _pipe(DecisionTreeClassifier(class_weight="balanced", random_state=SEED), False),
        "SVM (RBF)": _pipe(SVC(kernel="rbf", C=3, gamma="scale", class_weight="balanced", random_state=SEED), True),
        "Random Forest": _pipe(RandomForestClassifier(n_estimators=300, class_weight="balanced_subsample",
                                                      n_jobs=-1, random_state=SEED), False),
        "HistGradientBoosting": _pipe(HistGradientBoostingClassifier(class_weight="balanced", random_state=SEED), False),
        "LightGBM": _pipe(LGBMClassifier(class_weight="balanced", n_jobs=-1, random_state=SEED, verbose=-1), False),
    }
