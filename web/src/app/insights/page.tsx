"use client";
import { useState } from "react";
import { HBar, RateBars, TimelineChart } from "@/components/charts";
import { Card, PageHeader, Stat, inputCls } from "@/components/ui";
import { int, label, pct } from "@/lib/format";
import { meta } from "@/lib/meta";

const CATS = ["job", "education", "month", "poutcome", "contact", "marital", "day_of_week", "default", "housing", "loan"];

export default function InsightsPage() {
  const [cat, setCat] = useState("poutcome");
  const e = meta.eda;
  const rows = e.by_category[cat].map((r) => ({ name: r.value, rate: +(r.yes_rate * 100).toFixed(1), count: r.count }));
  const corr = Object.entries(e.numeric_corr_with_target).map(([k, v]) => ({ name: label(k), value: v })).sort((a, b) => Math.abs(a.value) - Math.abs(b.value));
  return (
    <>
      <PageHeader title="Data" note="UCI Bank Marketing, 2008-2010, tanpa kolom duration." />
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Nasabah" value={int(e.n_rows)} />
        <Stat label="Yes" value={int(e.n_yes)} />
        <Stat label="Rasio yes" value={pct(e.yes_rate)} />
      </div>
      <Card className="mt-4" title="Rasio yes per kategori">
        <label className="mb-3 block max-w-[220px]">
          <span className="sr-only">Fitur</span>
          <select className={inputCls} value={cat} onChange={(ev) => setCat(ev.target.value)}>
            {CATS.map((c) => <option key={c} value={c}>{label(c)}</option>)}
          </select>
        </label>
        <RateBars data={rows} base={e.yes_rate} />
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Rasio yes per kelompok umur">
          <RateBars data={e.by_age.map((a) => ({ name: a.value, rate: +(a.yes_rate * 100).toFixed(1), count: a.count }))} base={e.yes_rate} />
        </Card>
        <Card title="Korelasi numerik dengan target"><HBar data={corr} format={(v) => v.toFixed(2)} /></Card>
      </div>
      <Card className="mt-4" title="Rasio yes dan euribor per periode"><TimelineChart data={e.timeline} /></Card>
    </>
  );
}
