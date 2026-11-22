# Bank Marketing Prediction

Predicts whether a bank customer will subscribe to a term deposit after a telemarketing call. The project covers model development, a prediction API, and a web dashboard.

Dataset: [UCI Bank Marketing](https://archive.ics.uci.edu/dataset/222/bank+marketing) (`bank-additional-full.csv`, 41,188 rows). The `duration` column is excluded because it is only known after the call.

## Structure

| Path | Content |
| --- | --- |
| `ml/` | Dataset, notebooks, shared training code, and exported model artifacts |
| `api/` | FastAPI service that serves the model |
| `web/` | Next.js dashboard |
| `supabase/` | SQL migration for the prediction log |
| `scripts/` | Helper scripts for staging the API and syncing metadata |

## Model development

`ml/notebooks/01_uts_baseline.ipynb` is the midterm baseline. `ml/notebooks/02_uas_improved.ipynb` is the final version:

- Chronological split (first 80% train, last 20% test) and rolling-window validation
- Random Forest, HistGradientBoosting, LightGBM, and a soft-voting ensemble added to the baseline models
- Evaluation by AUC, ALIFT, PR-AUC, and share of positives reached when only the top-k% of customers are called
- Permutation importance, Platt calibration, and export of `model.joblib` and `metadata.json`

Selected model: Random Forest, out-of-time AUC 0.728 and ALIFT 0.658. Calling the top 30% of customers by score reaches 51.3% of the customers who subscribe.

```bash
conda activate ml
pip install -r ml/requirements.txt
cd ml/notebooks && jupyter nbconvert --to notebook --execute --inplace 02_uas_improved.ipynb
scripts/sync_metadata.sh
```

## API

```bash
pip install -r api/requirements.txt
PYTHONPATH=ml/src:api uvicorn app.main:app --port 8010
pytest api/tests
```

Endpoints: `GET /health`, `GET /metadata`, `POST /predict`, `POST /predict/batch` (CSV upload), `GET /history`, `GET /stats`. Interactive docs are served at `/docs`.

Environment variables: `DATABASE_URL` (optional Postgres connection string for prediction logging), `CORS_ORIGINS` (comma-separated allowed origins), `CORS_ORIGIN_REGEX`.

The API is deployed as a Python function on Vercel from a staged folder (`scripts/stage_api.sh <dir>`, then `vercel deploy --prod`). The same folder also builds with `api/Dockerfile`.

## Web

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` must point to the API.

## Live

- Dashboard: https://bank-marketing-web.vercel.app
- API: https://bank-marketing-api.vercel.app (docs at `/docs`)
- Database: Supabase Postgres (schema in `supabase/migrations`)
