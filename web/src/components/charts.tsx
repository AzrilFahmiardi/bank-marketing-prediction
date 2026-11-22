"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CurvePoint } from "@/lib/types";

export const SERIES = ["#3f78b8", "#1f8a7e", "#8e7dbe", "#d9605d", "#c8962a", "#e08a45", "#6a9f4f"];
const axis = { stroke: "var(--muted)", fontSize: 12 } as const;
const tip = { contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "var(--text)" } } as const;

type Curve = { name: string; points: CurvePoint[]; color: string; width?: number };

export function CurveChart({ curves, xLabel, yLabel, height = 320 }: { curves: Curve[]; xLabel: string; yLabel: string; height?: number }) {
  const data = curves[0].points.map((p, i) => {
    const row: Record<string, number> = { x: p[0] };
    curves.forEach((c) => (row[c.name] = c.points[i][1]));
    row["Acak"] = p[0];
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" />
        <XAxis dataKey="x" type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} label={{ value: xLabel, position: "insideBottom", offset: -12, fill: "var(--muted)", fontSize: 12 }} {...axis} />
        <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 12 }} {...axis} />
        <Tooltip {...tip} formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} labelFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
        <Line dataKey="Acak" stroke="var(--muted)" strokeDasharray="5 4" dot={false} strokeWidth={1.5} />
        {curves.map((c) => <Line key={c.name} dataKey={c.name} stroke={c.color} dot={false} strokeWidth={c.width ?? 2.2} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FoldChart({ series, height = 300 }: { series: { name: string; values: number[]; color: string }[]; height?: number }) {
  const n = series[0].values.length;
  const data = Array.from({ length: n }, (_, i) => {
    const row: Record<string, number | string> = { fold: `Fold ${i + 1}` };
    series.forEach((s) => (row[s.name] = s.values[i]));
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" />
        <XAxis dataKey="fold" {...axis} />
        <YAxis domain={[0.35, 0.85]} {...axis} />
        <Tooltip {...tip} formatter={(v) => Number(v).toFixed(3)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => <Line key={s.name} dataKey={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HBar({ data, color = "var(--accent)", height, format = (v: number) => v.toFixed(3) }: { data: { name: string; value: number }[]; color?: string; height?: number; format?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(200, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="var(--grid)" horizontal={false} />
        <XAxis type="number" {...axis} tickFormatter={format} />
        <YAxis type="category" dataKey="name" width={170} {...axis} interval={0} />
        <Tooltip {...tip} formatter={(v) => format(Number(v))} cursor={{ fill: "var(--surface-2)" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? "var(--coral)" : color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TimelineChart({ data, height = 280 }: { data: { block: number; yes_rate: number; euribor3m: number }[]; height?: number }) {
  const rows = data.map((d) => ({ block: `${d.block}`, yes: +(d.yes_rate * 100).toFixed(1), euribor: d.euribor3m }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 16, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" />
        <XAxis dataKey="block" {...axis} label={{ value: "Blok waktu (1 = terlama)", position: "insideBottom", offset: -10, fill: "var(--muted)", fontSize: 12 }} />
        <YAxis yAxisId="l" {...axis} unit="%" />
        <YAxis yAxisId="r" orientation="right" {...axis} />
        <Tooltip {...tip} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="l" dataKey="yes" name="Rasio yes (%)" fill="var(--blue)" radius={[4, 4, 0, 0]} />
        <Line yAxisId="r" dataKey="euribor" name="Euribor 3 bulan" stroke="var(--coral)" strokeWidth={2.2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function RateBars({ data, base, height }: { data: { name: string; rate: number; count: number }[]; base: number; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(220, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="var(--grid)" horizontal={false} />
        <XAxis type="number" {...axis} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" width={118} {...axis} interval={0} />
        <Tooltip {...tip} formatter={(v, _n, p) => [`${v}% (${(p.payload as { count: number }).count.toLocaleString("id-ID")} nasabah)`, "Rasio yes"]} cursor={{ fill: "var(--surface-2)" }} />
        <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.rate >= base * 100 ? "var(--accent)" : "var(--blue)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Histogram({ data, height = 220 }: { data: { label: string; count: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--grid)" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tip} />
        <Area dataKey="count" name="Jumlah" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Donut({ yes, total }: { yes: number; total: number }) {
  const r = 52, c = 2 * Math.PI * r, share = yes / total;
  return (
    <svg viewBox="0 0 140 140" className="h-40 w-40" role="img" aria-label={`Rasio yes ${(share * 100).toFixed(1)}%`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="16" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--accent)" strokeWidth="16" strokeDasharray={`${c * share} ${c}`} transform="rotate(-90 70 70)" strokeLinecap="butt" />
      <text x="70" y="68" textAnchor="middle" className="num" fontSize="22" fontWeight="600" fill="var(--text)">{(share * 100).toFixed(1).replace(".", ",")}%</text>
      <text x="70" y="86" textAnchor="middle" fontSize="10" fill="var(--muted)">berlangganan</text>
    </svg>
  );
}

export function Gauge({ value }: { value: number }) {
  const v = Math.min(1, Math.max(0, value));
  const r = 80, c = Math.PI * r;
  return (
    <svg viewBox="0 0 200 118" className="w-full max-w-[260px]" role="img" aria-label={`Probabilitas ${(v * 100).toFixed(1)}%`}>
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--surface-2)" strokeWidth="16" strokeLinecap="round" />
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--accent)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} />
      <text x="100" y="92" textAnchor="middle" className="num" fontSize="32" fontWeight="650" fill="var(--text)">{(v * 100).toFixed(1).replace(".", ",")}%</text>
    </svg>
  );
}
