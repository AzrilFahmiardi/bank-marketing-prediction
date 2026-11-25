import io
import os
from contextlib import asynccontextmanager
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from bank_marketing.features import RAW_FEATURES

from . import db
from .schemas import BatchResponse, Customer, PredictResponse
from .service import ModelService

# Local development: read api/.env if present. On Vercel there is no file, real env vars are used.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MAX_BATCH_ROWS = 20000
state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    state["svc"] = ModelService()
    yield


app = FastAPI(title="Bank Marketing Prediction API", version="1.0.0", lifespan=lifespan,
              description="Scores bank customers by their likelihood of subscribing to a term deposit.")

origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX"),
                   allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    svc: ModelService = state["svc"]
    return {"status": "ok", "model": svc.name, "model_version": svc.version, "database": db.enabled()}


@app.get("/metadata")
def metadata():
    return state["svc"].metadata


@app.post("/predict", response_model=PredictResponse)
def predict(customer: Customer, bg: BackgroundTasks):
    svc: ModelService = state["svc"]
    row = customer.to_row()
    res = svc.predict_one(row)
    bg.add_task(db.log_prediction, "single", row, res["probability"], res["predicted_yes"], res["threshold"], svc.version)
    return res


@app.post("/predict/batch", response_model=BatchResponse)
async def predict_batch(bg: BackgroundTasks, file: UploadFile = File(...)):
    svc: ModelService = state["svc"]
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
        sep = ";" if text.split("\n", 1)[0].count(";") > text.split("\n", 1)[0].count(",") else ","
        df = pd.read_csv(io.StringIO(text), sep=sep)
    except Exception:
        raise HTTPException(400, "File is not a readable CSV")
    missing = [c for c in RAW_FEATURES if c not in df.columns]
    if missing:
        raise HTTPException(422, f"Missing columns: {', '.join(missing)}")
    if len(df) == 0 or len(df) > MAX_BATCH_ROWS:
        raise HTTPException(422, f"CSV must have between 1 and {MAX_BATCH_ROWS} rows")
    for col, opts in svc.options.items():
        bad = sorted(set(df[col].astype(str)) - set(opts))
        if bad:
            raise HTTPException(422, f"Invalid values in '{col}': {', '.join(bad[:5])}")
    try:
        res = svc.predict_batch(df[RAW_FEATURES])
    except Exception as e:
        raise HTTPException(422, f"Could not score the file: {e}")
    bg.add_task(db.log_batch, file.filename or "upload.csv", res["n_rows"], res["n_predicted_yes"], svc.version)
    return res


@app.get("/history")
def history(limit: int = 50):
    if not db.enabled():
        return {"enabled": False, "items": []}
    try:
        return {"enabled": True, "items": db.history(min(max(limit, 1), 200))}
    except Exception as e:
        raise HTTPException(503, f"Database unavailable: {e}")


@app.get("/stats")
def stats():
    try:
        return db.stats()
    except Exception as e:
        raise HTTPException(503, f"Database unavailable: {e}")
