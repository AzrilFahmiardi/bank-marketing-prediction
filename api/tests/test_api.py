import io
import sys
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ml" / "src"))
sys.path.insert(0, str(ROOT / "api"))

from app.main import app  # noqa: E402

SAMPLE = {"age": 41, "job": "technician", "marital": "married", "education": "university.degree", "default": "no",
          "housing": "yes", "loan": "no", "contact": "cellular", "month": "may", "day_of_week": "thu",
          "campaign": 2, "pdays": 999, "previous": 0, "poutcome": "nonexistent", "emp.var.rate": 1.1,
          "cons.price.idx": 93.994, "cons.conf.idx": -36.4, "euribor3m": 4.857, "nr.employed": 5191.0}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_metadata(client):
    m = client.get("/metadata").json()
    assert len(m["features"]) == 19 and m["models"]


def test_predict(client):
    r = client.post("/predict", json=SAMPLE)
    assert r.status_code == 200
    j = r.json()
    assert 0 <= j["probability"] <= 1 and 0 <= j["percentile"] <= 100
    assert isinstance(j["predicted_yes"], bool) and isinstance(j["factors"], list)


def test_predict_rejects_bad_category(client):
    assert client.post("/predict", json={**SAMPLE, "job": "astronaut"}).status_code == 422


def test_predict_rejects_out_of_range(client):
    assert client.post("/predict", json={**SAMPLE, "age": 5}).status_code == 422


def test_batch(client):
    df = pd.DataFrame([SAMPLE, {**SAMPLE, "age": 30, "poutcome": "success", "pdays": 3, "previous": 1}])
    buf = io.BytesIO(df.to_csv(index=False).encode())
    r = client.post("/predict/batch", files={"file": ("x.csv", buf, "text/csv")})
    assert r.status_code == 200 and r.json()["n_rows"] == 2


def test_batch_missing_columns(client):
    buf = io.BytesIO(b"age,job\n30,admin.\n")
    r = client.post("/predict/batch", files={"file": ("x.csv", buf, "text/csv")})
    assert r.status_code == 422


def test_history_without_db(client, monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert client.get("/history").json() == {"enabled": False, "items": []}
