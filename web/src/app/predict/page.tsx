"use client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Gauge } from "@/components/charts";
import { Badge, Button, Card, ErrorNote, PageHeader, inputCls } from "@/components/ui";
import { api } from "@/lib/api";
import { label, pct } from "@/lib/format";
import { meta } from "@/lib/meta";
import type { PredictResult } from "@/lib/types";

type Form = Record<string, string | number>;
const defaults: Form = Object.fromEntries(meta.features.map((f) => [f.name, f.default]));

const GROUPS: { title: string; fields: string[] }[] = [
  { title: "Profil nasabah", fields: ["age", "job", "marital", "education"] },
  { title: "Status kredit", fields: ["default", "housing", "loan"] },
  { title: "Riwayat kontak", fields: ["contact", "month", "day_of_week", "campaign", "pdays", "previous", "poutcome"] },
  { title: "Kondisi ekonomi", fields: ["emp.var.rate", "cons.price.idx", "cons.conf.idx", "euribor3m", "nr.employed"] },
];

const PRESETS: { name: string; patch: Form }[] = [
  { name: "Nasabah umum", patch: {} },
  { name: "Prospek kuat", patch: { age: 29, job: "student", education: "university.degree", contact: "cellular", month: "mar", campaign: 1, pdays: 4, previous: 1, poutcome: "success", "emp.var.rate": -1.8, "cons.price.idx": 92.9, "cons.conf.idx": -46.2, euribor3m: 1.05, "nr.employed": 5099.1 } },
  { name: "Prospek lemah", patch: { age: 45, job: "blue-collar", education: "basic.9y", contact: "telephone", month: "may", campaign: 6, "emp.var.rate": 1.4, euribor3m: 4.96, "nr.employed": 5228.1 } },
];

export default function PredictPage() {
  const [form, setForm] = useState<Form>(defaults);
  const [res, setRes] = useState<PredictResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { setRes(await api.predict(form)); }
    catch (x) { setErr(x instanceof TypeError ? "API tidak terjangkau. Jika server baru bangun dari tidur, coba lagi beberapa detik lagi." : (x as Error).message); }
    finally { setBusy(false); }
  }

  const spec = (n: string) => meta.features.find((f) => f.name === n)!;

  return (
    <>
      <PageHeader title="Prediksi satu nasabah" subtitle="Isi data nasabah sebelum ditelepon. Durasi panggilan tidak dipakai karena baru diketahui setelah telepon selesai." />
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
                    <label key={n} className="block text-sm">
                      <span className="mb-1 block text-xs text-muted">{label(n)}</span>
                      {f.type === "categorical" ? (
                        <select className={inputCls} value={String(form[n])} onChange={(e) => set(n, e.target.value)}>
                          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className={inputCls} type="number" step="any" min={f.min}
                          value={form[n]} onChange={(e) => set(n, e.target.value === "" ? "" : Number(e.target.value))} required />
                      )}
                      {n === "pdays" && <span className="mt-1 block text-xs text-muted">999 = belum pernah dikontak</span>}
                    </label>
                  );
                })}
              </div>
            </Card>
          ))}
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Menghitung..." : "Hitung prediksi"}
          </Button>
          {err && <ErrorNote>{err}</ErrorNote>}
        </form>

        <div className="lg:col-span-2">
          <div className="sticky top-4 space-y-4">
            <Card title="Hasil prediksi">
              {!res ? <p className="text-sm text-muted">Hasil muncul di sini setelah data dikirim.</p> : (
                <div className="flex flex-col items-center gap-3">
                  <Gauge value={res.probability} />
                  <Badge tone={res.predicted_yes ? "good" : "neutral"}>{res.predicted_yes ? "Layak ditelepon" : "Prioritas rendah"}</Badge>
                  <p className="text-center text-sm leading-relaxed text-muted">
                    Skor nasabah ini berada di <b className="text-text">{res.top_percent.toFixed(0)}% teratas</b> dari seluruh data historis.
                    Batas default: {meta.operating_point.default_top_k}% teratas (probabilitas ≥ {pct(res.threshold)}).
                  </p>
                </div>
              )}
            </Card>
            {res && (
              <Card title="Faktor pendorong" hint="Perubahan probabilitas bila hanya fitur itu diganti dengan nasabah acuan (nilai umum).">
                {res.factors.length === 0 ? <p className="text-sm text-muted">Semua nilai sama dengan nasabah acuan.</p> : (
                  <ul className="space-y-2">
                    {res.factors.map((f) => (
                      <li key={f.feature} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">{label(f.feature)} <span className="text-muted">({f.value})</span></span>
                        <span className={`num shrink-0 font-medium ${f.effect >= 0 ? "text-accent" : "text-coral"}`}>{f.effect >= 0 ? "+" : ""}{(f.effect * 100).toFixed(1).replace(".", ",")} poin</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
            <p className="text-xs leading-relaxed text-muted">Model dilatih dari data 2008-2010. Hasil ini adalah perkiraan statistik, bukan jaminan.</p>
          </div>
        </div>
      </div>
    </>
  );
}
