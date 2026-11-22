"""Helpers that build the JSON metadata consumed by the API and the dashboard."""
import numpy as np
import pandas as pd

from .evaluation import gains_curve

CAT_ORDER = {
    "month": ["mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
    "day_of_week": ["mon", "tue", "wed", "thu", "fri"],
}
DEFAULTS = {"age": 40, "job": "admin.", "marital": "married", "education": "university.degree",
            "default": "no", "housing": "yes", "loan": "no", "contact": "cellular", "month": "may",
            "day_of_week": "thu", "campaign": 2, "pdays": 999, "previous": 0, "poutcome": "nonexistent",
            "emp.var.rate": 1.1, "cons.price.idx": 93.5, "cons.conf.idx": -40.0, "euribor3m": 4.8,
            "nr.employed": 5191.0}


def feature_schema(X):
    """Input form schema: categorical options or numeric ranges, plus a default value."""
    out = []
    for c in X.columns:
        if not pd.api.types.is_numeric_dtype(X[c]):
            opts = CAT_ORDER.get(c) or sorted(X[c].unique().tolist())
            out.append({"name": c, "type": "categorical", "options": opts, "default": DEFAULTS[c]})
        else:
            out.append({"name": c, "type": "numeric", "min": float(X[c].min()), "max": float(X[c].max()),
                        "default": DEFAULTS[c]})
    return out


def sample_points(x, y, n=101):
    """Downsample a monotone curve to n evenly spaced x positions."""
    grid = np.linspace(0, 1, n)
    return [[round(float(a), 4), round(float(b), 4)] for a, b in zip(grid, np.interp(grid, x, y))]


def roc_points(fpr, tpr, n=101):
    return sample_points(fpr, tpr, n)


def lift_points(y, s, n=101):
    x, g = gains_curve(y, s)
    return sample_points(x, g, n)


def capacity_table(y, s, ks=range(1, 101)):
    """For each share k% of customers contacted (highest score first): confusion counts and rates."""
    y = np.asarray(y)
    order = np.argsort(-np.asarray(s), kind="mergesort")
    ys = y[order]
    pos, n = int(y.sum()), len(y)
    rows = []
    for k in ks:
        m = int(np.ceil(k / 100 * n))
        tp = int(ys[:m].sum())
        fp, fn = m - tp, pos - tp
        rows.append({"k": k, "tp": tp, "fp": fp, "fn": fn, "tn": n - m - fn,
                     "precision": round(tp / m, 4), "recall": round(tp / pos, 4),
                     "lift": round((tp / m) / (pos / n), 3)})
    return rows


def eda_summary(X, y, n_blocks=10):
    d = X.copy()
    d["y"] = y.values
    cats = ["job", "marital", "education", "default", "housing", "loan", "contact", "month", "day_of_week", "poutcome"]
    by_cat = {}
    for c in cats:
        g = d.groupby(c)["y"].agg(["size", "mean"]).reset_index()
        if c in CAT_ORDER:
            g[c] = pd.Categorical(g[c], CAT_ORDER[c], ordered=True)
            g = g.sort_values(c)
        else:
            g = g.sort_values("size", ascending=False)
        by_cat[c] = [{"value": str(r[c]), "count": int(r["size"]), "yes_rate": round(float(r["mean"]), 4)}
                     for _, r in g.iterrows()]
    num = ["age", "campaign", "previous", "emp.var.rate", "cons.price.idx", "cons.conf.idx", "euribor3m", "nr.employed"]
    corr = {c: round(float(d[c].corr(d["y"])), 3) for c in num}
    age_bins = pd.cut(d["age"], [16, 25, 35, 45, 55, 65, 100])
    by_age = [{"value": str(k), "count": int(v["size"]), "yes_rate": round(float(v["mean"]), 4)}
              for k, v in d.groupby(age_bins, observed=True)["y"].agg(["size", "mean"]).iterrows()]
    block = len(d) // n_blocks
    timeline = []
    for i in range(n_blocks):
        b = d.iloc[i * block:(i + 1) * block]
        timeline.append({"block": i + 1, "yes_rate": round(float(b["y"].mean()), 4),
                         "euribor3m": round(float(b["euribor3m"].mean()), 3),
                         "nr_employed": round(float(b["nr.employed"].mean()), 1)})
    return {"n_rows": int(len(d)), "n_yes": int(d["y"].sum()), "yes_rate": round(float(d["y"].mean()), 4),
            "by_category": by_cat, "by_age": by_age, "numeric_corr_with_target": corr, "timeline": timeline}
