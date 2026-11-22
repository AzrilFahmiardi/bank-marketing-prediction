# Web dashboard

Next.js (App Router) dashboard for the Bank Marketing prediction project.

```bash
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL to the FastAPI service
npm install
npm run dev
```

Pages: overview, single prediction, CSV batch scoring, model performance, data insights, and prediction history.
`src/data/metadata.json` is a copy of `ml/artifacts/metadata.json` (run `scripts/sync_metadata.sh` after retraining).
