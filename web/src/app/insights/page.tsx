"use client";
import { useState } from "react";
import { Donut, HBar, RateBars, TimelineChart } from "@/components/charts";
import { Card, PageHeader, inputCls } from "@/components/ui";
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
      <PageHeader title="Insight data" subtitle={`Ringkasan ${int(e.n_rows)} nasabah dari dataset UCI Bank Marketing (2008-2010). Durasi panggilan tidak disertakan karena tidak tersedia sebelum nasabah ditelepon.`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Distribusi target">
          <div className="flex flex-col items-center gap-2">
            <Donut yes={e.n_yes} total={e.n_rows} />
            <p className="text-center text-sm text-muted">{int(e.n_yes)} yes dari {int(e.n_rows)} nasabah. Rasio kelas 1 : {(e.n_rows / e.n_yes - 1).toFixed(1).replace(".", ",")}.</p>
          </div>
        </Card>
        <Card className="lg:col-span-2" title="Korelasi numerik dengan target" hint="Korelasi Pearson dengan yes = 1. Indikator ekonomi saling berkorelasi tinggi karena bergerak bersama waktu.">
          <HBar data={corr} format={(v) => v.toFixed(2)} />
        </Card>
      </div>

      <Card className="mt-4" title="Rasio berlangganan per kategori" hint={`Garis dasar rata-rata: ${pct(e.yes_rate)}. Batang hijau berada di atas rata-rata.`}>
        <label className="mb-3 block max-w-xs text-sm">
          <span className="mb-1 block text-xs text-muted">Pilih fitur</span>
          <select className={inputCls} value={cat} onChange={(ev) => setCat(ev.target.value)}>
            {CATS.map((c) => <option key={c} value={c}>{label(c)}</option>)}
          </select>
        </label>
        <RateBars data={rows} base={e.yes_rate} />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Rasio berlangganan per kelompok umur">
          <RateBars data={e.by_age.map((a) => ({ name: a.value, rate: +(a.yes_rate * 100).toFixed(1), count: a.count }))} base={e.yes_rate} />
        </Card>
        <Card title="Rasio yes dan euribor sepanjang waktu" hint="Data dibagi 10 blok kronologis.">
          <TimelineChart data={e.timeline} />
        </Card>
      </div>
    </>
  );
}
