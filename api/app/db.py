"""Optional Supabase Postgres logging. Everything is a no-op when DATABASE_URL is not set."""
import json
import logging
import os

import psycopg
from psycopg.rows import dict_row

log = logging.getLogger("bank-api.db")


def enabled() -> bool:
    return bool(os.environ.get("DATABASE_URL"))


def _conn():
    return psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=5, autocommit=True, row_factory=dict_row,
                           prepare_threshold=None)


def log_prediction(source: str, payload: dict, probability: float, predicted_yes: bool, threshold: float, version: str):
    if not enabled():
        return
    try:
        with _conn() as c:
            c.execute("insert into predictions (source, input, probability, predicted_yes, threshold, model_version) "
                      "values (%s, %s::jsonb, %s, %s, %s, %s)",
                      (source, json.dumps(payload), probability, predicted_yes, threshold, version))
    except Exception as e:  # logging must never break a prediction
        log.warning("log_prediction failed: %s", e)


def log_batch(filename: str, n_rows: int, n_positive: int, version: str):
    if not enabled():
        return
    try:
        with _conn() as c:
            c.execute("insert into batch_jobs (filename, n_rows, n_positive, model_version) values (%s, %s, %s, %s)",
                      (filename, n_rows, n_positive, version))
    except Exception as e:
        log.warning("log_batch failed: %s", e)


def history(limit: int = 50) -> list[dict]:
    if not enabled():
        return []
    with _conn() as c:
        rows = c.execute("select id, created_at, source, input, probability, predicted_yes, model_version "
                         "from predictions order by created_at desc limit %s", (limit,)).fetchall()
    for r in rows:
        r["created_at"] = r["created_at"].isoformat()
    return rows


def stats() -> dict:
    if not enabled():
        return {"enabled": False}
    with _conn() as c:
        tot = c.execute("select count(*) n, coalesce(avg(probability),0) avg_p, "
                        "count(*) filter (where predicted_yes) n_yes from predictions").fetchone()
        daily = c.execute("select date_trunc('day', created_at)::date d, count(*) n, avg(probability) avg_p "
                          "from predictions where created_at > now() - interval '30 days' group by 1 order by 1").fetchall()
        bins = c.execute("select width_bucket(probability, 0, 1, 10) b, count(*) n from predictions group by 1 order by 1").fetchall()
        batches = c.execute("select count(*) n, coalesce(sum(n_rows),0) rows from batch_jobs").fetchone()
    return {"enabled": True, "total": int(tot["n"]), "avg_probability": float(tot["avg_p"]), "predicted_yes": int(tot["n_yes"]),
            "daily": [{"date": str(r["d"]), "count": int(r["n"]), "avg_probability": float(r["avg_p"])} for r in daily],
            "score_histogram": [{"bucket": int(r["b"]), "count": int(r["n"])} for r in bins],
            "batch_jobs": int(batches["n"]), "batch_rows": int(batches["rows"])}
