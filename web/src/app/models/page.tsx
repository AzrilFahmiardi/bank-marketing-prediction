"use client";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { CurveChart, FoldChart, HBar } from "@/components/charts";
import { Card, PageHeader, Tag, th } from "@/components/ui";
import { int, label, num, pct } from "@/lib/format";
import { meta, selectedModel } from "@/lib/meta";

const OTHERS = ["#2563eb", "#71717a", "#a1a1aa", "#60a5fa", "#52525b", "#d4d4d8"];
const colorOf = (name: string) => (name === selectedModel.name ? "#18181b" : OTHERS[meta.models.filter((m) => !m.selected).findIndex((m) => m.name === name) % OTHERS.length]);
type Key = "AUC" | "ALIFT" | "PR-AUC" | "Capture@20%" | "Capture@50%";

export default function ModelsPage() {
  const byAuc = [...meta.models].sort((a, b) => b.holdout.AUC - a.holdout.AUC);
  const [shown, setShown] = useState<string[]>(() => Array.from(new Set([selectedModel.name, ...byAuc.slice(0, 2).map((m) => m.name)])));
  const [k, setK] = useState(meta.operating_point.default_top_k);
  const toggle = (n: string) => setShown((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  const visible = useMemo(() => meta.models.filter((m) => shown.includes(m.name)), [shown]);
  const cap = meta.capacity.find((c) => c.k === k)!;
  const best = (key: Key) => Math.max(...meta.models.map((m) => m.holdout[key]));
  const cell = (v: number, key: Key, f: (x: number) => string) => (
    <td className={clsx("num pr-3 text-right", v === best(key) && "font-semibold")}>{f(v)}</td>
  );

  return (
    <>
      <PageHeader title="Performa model" note={`Latih ${int(meta.validation.train_rows)} baris, uji ${int(meta.validation.holdout_rows)} baris terakhir (berurutan waktu).`} />

      <Card title="Perbandingan model">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Model</th><th className={`${th} text-right`}>AUC</th><th className={`${th} text-right`}>ALIFT</th><th className={`${th} text-right`}>PR-AUC</th>
                <th className={`${th} text-right`}>Capture 20%</th><th className={`${th} text-right`}>Capture 50%</th><th className={`${th} text-right`}>Rolling AUC</th><th className={`${th} text-right`}>Split acak</th>
              </tr>
            </thead>
            <tbody>
              {meta.models.map((m) => (
                <tr key={m.name} className={clsx("border-b border-border/60 last:border-0", m.selected && "bg-soft")}>
                  <td className="py-2 pr-3">{m.name} {m.selected && <Tag strong>dipakai</Tag>}</td>
                  {cell(m.holdout.AUC, "AUC", num)}{cell(m.holdout.ALIFT, "ALIFT", num)}{cell(m.holdout["PR-AUC"], "PR-AUC", num)}
                  {cell(m.holdout["Capture@20%"], "Capture@20%", (v) => pct(v))}{cell(m.holdout["Capture@50%"], "Capture@50%", (v) => pct(v))}
                  <td className="num pr-3 text-right">{num(m.rolling_auc_mean)} <span className="text-muted">±{num(m.rolling_auc_std, 2)}</span></td>
                  <td className="num text-right">{num(m.random_split_auc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">Rolling AUC: rata-rata 6 lipatan sepanjang timeline. Split acak hanya pembanding.</p>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {meta.models.map((m) => (
          <button key={m.name} onClick={() => toggle(m.name)} aria-pressed={shown.includes(m.name)}
            className={clsx("rounded border px-2.5 py-1 text-xs", shown.includes(m.name) ? "border-text bg-text text-white" : "border-border bg-surface text-muted hover:text-text")}>{m.name}</button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <Card title="Kurva ROC"><CurveChart curves={visible.map((m) => ({ name: m.name, points: m.roc, color: colorOf(m.name) }))} xLabel="False positive rate" yLabel="True positive rate" /></Card>
        <Card title="Cumulative gains"><CurveChart curves={visible.map((m) => ({ name: m.name, points: m.gains, color: colorOf(m.name) }))} xLabel="Nasabah ditelepon" yLabel="Nasabah yes terjangkau" /></Card>
      </div>

      <Card className="mt-4" title="AUC per lipatan rolling window">
        <FoldChart series={visible.map((m) => ({ name: m.name, values: m.rolling_auc, color: colorOf(m.name) }))} />
      </Card>

      <Card className="mt-4" title={`Simulasi kapasitas telepon (${selectedModel.name})`}>
        <div className="flex items-center gap-4">
          <input aria-label="Persentase nasabah ditelepon" type="range" min={1} max={100} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-full" />
          <span className="num w-12 text-right text-sm font-medium">{k}%</span>
        </div>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <table className="w-full max-w-xs text-sm">
            <thead><tr className="border-b border-border"><th className={th}></th><th className={`${th} text-right`}>Aktual yes</th><th className={`${th} text-right`}>Aktual no</th></tr></thead>
            <tbody>
              <tr className="border-b border-border/60"><td className="py-2 pr-3 text-muted">Ditelepon</td><td className="num pr-3 text-right">{int(cap.tp)}</td><td className="num text-right">{int(cap.fp)}</td></tr>
              <tr><td className="py-2 pr-3 text-muted">Dilewati</td><td className="num pr-3 text-right">{int(cap.fn)}</td><td className="num text-right">{int(cap.tn)}</td></tr>
            </tbody>
          </table>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Precision</dt><dd className="num">{pct(cap.precision)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Recall</dt><dd className="num">{pct(cap.recall)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Lift</dt><dd className="num">{cap.lift.toFixed(2).replace(".", ",")}x</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Rasio yes dasar</dt><dd className="num">{pct(meta.validation.holdout_yes_rate)}</dd></div>
          </dl>
        </div>
      </Card>

      <div className="mt-4">
        <Card title="Fitur paling berpengaruh (penurunan AUC)">
          <HBar data={meta.importance.slice(0, 10).map((i) => ({ name: label(i.feature), value: i.auc_drop })).reverse()} />
        </Card>
      </div>
    </>
  );
}
