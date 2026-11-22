import type { BatchResult, HistoryItem, PredictResult, Stats } from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Permintaan gagal (${res.status})`;
    try {
      const j = await res.json();
      if (typeof j.detail === "string") detail = j.detail;
      else if (Array.isArray(j.detail)) detail = j.detail.map((d: { loc?: string[]; msg: string }) => `${d.loc?.slice(1).join(".")}: ${d.msg}`).join("; ");
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  health: () => fetch(`${API_URL}/health`).then((r) => parse<{ status: string; model: string; model_version: string; database: boolean }>(r)),
  predict: (body: Record<string, string | number>) =>
    fetch(`${API_URL}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => parse<PredictResult>(r)),
  batch: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${API_URL}/predict/batch`, { method: "POST", body: fd }).then((r) => parse<BatchResult>(r));
  },
  history: (limit = 50) => fetch(`${API_URL}/history?limit=${limit}`).then((r) => parse<{ enabled: boolean; items: HistoryItem[] }>(r)),
  stats: () => fetch(`${API_URL}/stats`).then((r) => parse<Stats>(r)),
};
