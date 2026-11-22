"use client";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { CurveChart, FoldChart, HBar, SERIES } from "@/components/charts";
import { Badge, Card, PageHeader } from "@/components/ui";
import { int, label, num, pct } from "@/lib/format";
import { meta, selectedModel } from "@/lib/meta";

const colorOf = (name: string) => SERIES[meta.models.findIndex((m) => m.name === name) % SERIES.length];

export default function ModelsPage() {
  const byAuc = [...meta.models].sort((a, b) => b.holdout.AUC - a.holdout.AUC);
  const [shown, setShown] = useState<string[]>(() => Array.from(new Set([selectedModel.name, ...byAuc.slice(0, 3).map((m) => m.name)])));
  const [k, setK] = useState(meta.operating_point.default_top_k);
  const toggle = (n: string) => setShown((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  const visible = useMemo(() => meta.models.filter((m) => shown.includes(m.name)), [shown]);
  const cap = meta.capacity.find((c) => c.k === k)!;
  const maxIn = (key: "AUC" | "ALIFT" | "PR-AUC" | "Capture@20%" | "Capture@50%") => Math.max(...meta.models.map((m) => m.holdout[key]));

  return (
    <>
      <PageHeader title="Performa model"
        subtitle={`Semua model dilatih pada ${int(meta.validation.train_rows)} baris pertama dan diuji pada ${int(meta.validation.holdout_rows)} baris terakhir (out-of-time). Rasio yes naik dari ${pct(meta.validation.train_yes_rate)} di data latih menjadi ${pct(meta.validation.holdout_yes_rate)} di data uji.`} />

      <Card title="Perbandingan model" hint="Metrik tidak bergantung threshold. Rolling window = rata-rata AUC dari 6 lipatan yang menggeser seluruh timeline. Split acak hanya pembanding (cenderung terlalu optimis).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border"><th className="py-2 pr-3">Model</th><th className="pr-3 text-right">AUC</th><th className="pr-3 text-right">ALIFT</th><th className="pr-3 text-right">PR-AUC</th><th className="pr-3 text-right">Capture@20%</th><th className="pr-3 text-right">Capture@50%</th><th className="pr-3 text-right">Rolling AUC</th><th className="text-right">Split acak</th></tr>
            </thead>
            <tbody>
              {meta.models.map((m) => {
                const cell = (v: number, key: Parameters<typeof maxIn>[0], f: (x: number) => string) => (
                  <td className={clsx("num pr-3 text-right", v === maxIn(key) && "font-semibold text-accent")}>{f(v)}</td>
                );
                return (
                  <tr key={m.name} className={clsx("border-b border-border/60", m.selected && "bg-accentsoft/50")}>
                    <td className="py-2 pr-3 font-medium">{m.name} {m.selected && <Badge tone="good">dipakai</Badge>}</td>
                    {cell(m.holdout.AUC, "AUC", num)}{cell(m.holdout.ALIFT, "ALIFT", num)}{cell(m.holdout["PR-AUC"], "PR-AUC", num)}
                    {cell(m.holdout["Capture@20%"], "Capture@20%", (v) => pct(v))}{cell(m.holdout["Capture@50%"], "Capture@50%", (v) => pct(v))}
                    <td className="num pr-3 text-right">{num(m.rolling_auc_mean)} <span className="text-muted">±{num(m.rolling_auc_std, 2)}</span></td>
                    <td className="num text-right">{num(m.random_split_auc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Tampilkan di grafik:</span>
        {meta.models.map((m) => (
          <button key={m.name} onClick={() => toggle(m.name)} aria-pressed={shown.includes(m.name)}
            className={clsx("rounded-full border px-3 py-1 text-xs transition", shown.includes(m.name) ? "border-transparent text-white" : "border-border bg-surface text-muted")}
            style={shown.includes(m.name) ? { background: colorOf(m.name) } : undefined}>{m.name}</button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <Card title="Kurva ROC"><CurveChart curves={visible.map((m) => ({ name: m.name, points: m.roc, color: colorOf(m.name) }))} xLabel="False positive rate" yLabel="True positive rate" /></Card>
        <Card title="Cumulative gains"><CurveChart curves={visible.map((m) => ({ name: m.name, points: m.gains, color: colorOf(m.name) }))} xLabel="Nasabah yang ditelepon" yLabel="Nasabah yes terjangkau" /></Card>
      </div>

      <Card className="mt-4" title="AUC per lipatan rolling window" hint="Lipatan makin ke kanan makin baru. Garis yang naik turun tajam menandakan model peka terhadap perubahan periode.">
        <FoldChart series={visible.map((m) => ({ name: m.name, values: m.rolling_auc, color: colorOf(m.name) }))} />
      </Card>

      <Card className="mt-4" title={`Simulasi kapasitas telepon - ${selectedModel.name}`} hint="Pada data uji, nasabah diurutkan dari skor tertinggi lalu hanya sebagian teratas yang ditelepon.">
        <div className="flex items-center gap-4">
          <input aria-label="Persentase nasabah yang ditelepon" type="range" min={1} max={100} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-full" />
          <span className="num w-14 text-right text-sm font-medium">{k}%</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            {[["Benar yes (TP)", cap.tp, "accent"], ["Salah tebak yes (FP)", cap.fp, ""], ["Terlewat (FN)", cap.fn, ""], ["Benar no (TN)", cap.tn, ""]].map(([t, v, tone]) => (
              <div key={t as string} className={clsx("rounded-lg border border-border p-3", tone && "bg-accentsoft")}>
                <div className="num text-xl font-semibold">{int(v as number)}</div><div className="text-xs text-muted">{t}</div>
              </div>
            ))}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Precision</dt><dd className="num font-medium">{pct(cap.precision)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Recall (yes terjangkau)</dt><dd className="num font-medium">{pct(cap.recall)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Lift terhadap panggilan acak</dt><dd className="num font-medium">{cap.lift.toFixed(2).replace(".", ",")}x</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Rasio yes dasar (acak)</dt><dd className="num font-medium">{pct(meta.validation.holdout_yes_rate)}</dd></div>
          </dl>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Fitur paling berpengaruh" hint="Penurunan AUC data uji saat fitur diacak (permutation importance).">
          <HBar data={meta.importance.slice(0, 10).map((i) => ({ name: label(i.feature), value: i.auc_drop })).reverse()} format={(v) => v.toFixed(3)} />
        </Card>
        <Card title="Dibandingkan hasil UTS" hint="Data uji yang sama. Angka UTS diambil dari laporan UTS.">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted"><tr className="border-b border-border"><th className="py-2 text-left">Model</th><th className="text-right">AUC UTS</th><th className="text-right">AUC sekarang</th></tr></thead>
            <tbody>
              {meta.uts_baseline.map((u) => {
                const now = meta.models.find((m) => m.name.startsWith(u.name.split(" ")[0]));
                return (
                  <tr key={u.name} className="border-b border-border/60"><td className="py-2">{u.name}</td><td className="num text-right">{num(u.AUC)}</td><td className="num text-right">{now ? num(now.holdout.AUC) : "-"}</td></tr>
                );
              })}
              <tr><td className="py-2 font-medium">{selectedModel.name}</td><td className="num text-right text-muted">-</td><td className="num text-right font-semibold text-accent">{num(selectedModel.holdout.AUC)}</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-relaxed text-muted">Hyperparameter dicari ulang dengan rolling window, jadi selisih angka pada model yang sama berasal dari pencarian tersebut.</p>
        </Card>
      </div>
    </>
  );
}
