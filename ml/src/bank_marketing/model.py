"""Probability calibration wrapper and out-of-fold scoring."""
import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.linear_model import LogisticRegression


def raw_score(model, X):
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X)[:, 1]
    return model.decision_function(X)


def oof_scores(factory, X, y, splits):
    """Score each fold's test block with a model trained on that fold's window only."""
    idx, scores = [], []
    for tr, te in splits:
        m = factory().fit(X.iloc[tr], y.iloc[tr])
        idx.append(te)
        scores.append(raw_score(m, X.iloc[te]))
    return np.concatenate(idx), np.concatenate(scores)


class PlattCalibrated(ClassifierMixin, BaseEstimator):
    """Fitted base model + sigmoid (Platt) calibrator on its raw scores.

    The calibrator is fitted on out-of-fold scores from rolling windows, so the
    probabilities reflect how the model behaves on *later* periods.
    """

    def __init__(self, base=None, calibrator=None):
        self.base = base
        self.calibrator = calibrator
        self.classes_ = np.array([0, 1])

    @classmethod
    def from_oof(cls, base, oof_y, oof_s):
        cal = LogisticRegression(C=1e6).fit(np.asarray(oof_s).reshape(-1, 1), oof_y)
        return cls(base, cal)

    def predict_proba(self, X):
        p = self.calibrator.predict_proba(raw_score(self.base, X).reshape(-1, 1))
        return p

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X)[:, 1] >= threshold).astype(int)
