"use client";
import { useState } from "react";
import { MeterBar } from "@/components/charts";
import { Button, Card, ErrorNote, PageHeader, inputCls } from "@/components/ui";
import { api } from "@/lib/api";
import { label, pct } from "@/lib/format";
import { meta } from "@/lib/meta";
import type { PredictResult } from "@/lib/types";

type Form = Record<string, string | number>;
const defaults: Form = Object.fromEntries(meta.features.map((f) => [f.name, f.default]));

const GROUPS: { title: string; fields: string[] }[] = [
  { title: "Profil", fields: ["age", "job", "marital", "education"] },
  { title: "Kredit", fields: ["default", "housing", "loan"] },
  { title: "Kontak", fields: ["contact", "month", "day_of_week", "campaign", "pdays", "previous", "poutcome"] },
  { title: "Ekonomi", fields: ["emp.var.rate", "cons.price.idx", "cons.conf.idx", "euribor3m", "nr.employed"] },
];

const PRESETS: { name: string; patch: Form }[] = [
  { name: "Umum", patch: {} },
  { name: "Prospek kuat", patch: { age: 29, job: "student", education: "university.degree", contact: "cellular", month: "mar", campaign: 1, pdays: 4, previous: 1, poutcome: "success", "emp.var.rate": -1.8, "cons.price.idx": 92.9, "cons.conf.idx": -46.2, euribor3m: 1.05, "nr.employed": 5099.1 } },
  { name: "Prospek lemah", patch: { age: 45, job: "blue-collar", education: "basic.9y", contact: "telephone", month: "may", campaign: 6, "emp.var.rate": 1.4, euribor3m: 4.96, "nr.employed": 5228.1 } },
];

export default function PredictPage() {
  const [form, setForm] = useState<Form>(defaults);
  const [res, setRes] = useState<PredictResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const spec = (n: string) => meta.features.find((f) => f.name === n)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { setRes(await api.predict(form)); }
    catch (x) { setErr(x instanceof TypeError ? "API tidak terjangkau. Coba lagi beberapa detik lagi." : (x as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Prediksi satu nasabah" />
      <div className="grid gap-4 lg:grid-cols-5">
        <form onSubmit={submit} className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.name} type="button" variant="ghost" className="!px-3 !py-1.5" onClick={() => setForm({ ...defaults, ...p.patch })}>{p.name}</Button>
            ))}
          </div>
          {GROUPS.map((g) => (
            <Card key={g.title} title={g.title}>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.fields.map((n) => {
                  const f = spec(n);
                  return (
                    <label key={n} className="block">
                      <span className="mb-1 block text-xs text-muted">{label(n)}</span>
                      {f.type === "categorical" ? (
                        <select className={inputCls} value={String(form[n])} onChange={(e) => set(n, e.target.value)}>
                          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className={inputCls} type="number" step="any" value={form[n]} required
                          onChange={(e) => set(n, e.target.value === "" ? "" : Number(e.target.value))} />
                      )}
                    </label>
                  );
                })}
              </div>
            </Card>
          ))}
          <Button type="submit" disabled={busy}>{busy ? "Menghitung..." : "Hitung"}</Button>
          {err && <ErrorNote>{err}</ErrorNote>}
        </form>

        <div className="lg:col-span-2">
          <div className="sticky top-4 space-y-4">
            <Card title="Hasil">
              {!res ? <p className="text-sm text-muted">Belum ada hasil.</p> : (
                <div>
                  <div className="num text-4xl font-semibold tracking-tight">{pct(res.probability)}</div>
                  <div className="mb-3 mt-3"><MeterBar value={res.probability} /></div>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-muted">Peringkat skor</dt><dd className="num">{res.top_percent.toFixed(0)}% teratas</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Keputusan</dt><dd>{res.predicted_yes ? "Telepon" : "Lewati"}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted">Batas ({meta.operating_point.default_top_k}% teratas)</dt><dd className="num">≥ {pct(res.threshold)}</dd></div>
                  </dl>
                </div>
              )}
            </Card>
            {res && res.factors.length > 0 && (
              <Card title="Faktor pengaruh">
                <ul className="space-y-1.5 text-sm">
                  {res.factors.map((f) => (
                    <li key={f.feature} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">{label(f.feature)} <span className="text-muted">{f.value}</span></span>
                      <span className="num shrink-0">{f.effect >= 0 ? "+" : "-"}{Math.abs(f.effect * 100).toFixed(1).replace(".", ",")}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">Selisih poin probabilitas terhadap nasabah acuan.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
