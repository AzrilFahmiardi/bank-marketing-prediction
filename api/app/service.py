"""Model loading and prediction logic."""
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from bank_marketing.features import RAW_FEATURES

import json


def _find_artifacts() -> Path:
    env = os.environ.get("MODEL_DIR")
    candidates = [Path(env)] if env else []
    here = Path(__file__).resolve()
    candidates += [here.parents[1] / "artifacts", here.parents[2] / "ml" / "artifacts"]
    for c in candidates:
        if (c / "model.joblib").exists():
            return c
    raise FileNotFoundError(f"model.joblib not found in {candidates}")


class ModelService:
    def __init__(self):
        d = _find_artifacts()
        self.model = joblib.load(d / "model.joblib")
        self.metadata = json.loads((d / "metadata.json").read_text())
        self.threshold = self.metadata["operating_point"]["threshold"]
        self.version = self.metadata["model_version"]
        self.name = self.metadata["model_name"]
        self.score_ref = np.array(self.metadata["score_reference"])
        self.reference = {f["name"]: f["default"] for f in self.metadata["features"]}
        self.options = {f["name"]: f["options"] for f in self.metadata["features"] if f["type"] == "categorical"}

    def score(self, rows: pd.DataFrame) -> np.ndarray:
        return self.model.predict_proba(rows[RAW_FEATURES])[:, 1]

    def percentile(self, p: np.ndarray) -> np.ndarray:
        # position of the probability inside the reference score distribution (101 quantile points)
        return np.interp(p, self.score_ref, np.linspace(0, 100, len(self.score_ref)))

    def predict_one(self, row: dict) -> dict:
        df = pd.DataFrame([row])[RAW_FEATURES]
        p = float(self.score(df)[0])
        pct = float(self.percentile(np.array([p]))[0])
        return {"probability": p, "percentile": pct, "top_percent": 100 - pct, "predicted_yes": p >= self.threshold,
                "threshold": self.threshold, "model_version": self.version, "model_name": self.name,
                "factors": self.factors(row, p)}

    def factors(self, row: dict, p: float, top: int = 6) -> list[dict]:
        """Occlusion: reset one feature at a time to the reference customer and see how the probability moves."""
        variants = []
        for f in RAW_FEATURES:
            v = dict(row)
            v[f] = self.reference[f]
            variants.append(v)
        probs = self.score(pd.DataFrame(variants)[RAW_FEATURES])
        out = [{"feature": f, "value": str(row[f]), "effect": float(p - q)}
               for f, q in zip(RAW_FEATURES, probs) if str(row[f]) != str(self.reference[f])]
        out.sort(key=lambda r: abs(r["effect"]), reverse=True)
        return out[:top]

    def predict_batch(self, df: pd.DataFrame) -> dict:
        p = self.score(df)
        pct = self.percentile(p)
        rows = [{"row": int(i), "probability": float(a), "percentile": float(b), "predicted_yes": bool(a >= self.threshold)}
                for i, (a, b) in enumerate(zip(p, pct))]
        return {"n_rows": len(rows), "n_predicted_yes": int(sum(r["predicted_yes"] for r in rows)),
                "threshold": self.threshold, "rows": rows, "model_version": self.version}
