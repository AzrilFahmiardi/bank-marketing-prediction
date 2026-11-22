"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CurvePoint } from "@/lib/types";

export const SERIES = ["#18181b", "#2563eb", "#71717a", "#a1a1aa", "#3f3f46", "#93c5fd", "#d4d4d8"];
const axis = { stroke: "var(--muted)", fontSize: 12 } as const;
const tip = { contentStyle: { background: "#fff", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }, labelStyle: { color: "var(--text)" } } as const;

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
        <CartesianGrid stroke="#ececee" />
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
        <CartesianGrid stroke="#ececee" />
        <XAxis dataKey="fold" {...axis} />
        <YAxis domain={[0.35, 0.85]} {...axis} />
        <Tooltip {...tip} formatter={(v) => Number(v).toFixed(3)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => <Line key={s.name} dataKey={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HBar({ data, color = "#18181b", height, format = (v: number) => v.toFixed(3) }: { data: { name: string; value: number }[]; color?: string; height?: number; format?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(200, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="#ececee" horizontal={false} />
        <XAxis type="number" {...axis} tickFormatter={format} />
        <YAxis type="category" dataKey="name" width={170} {...axis} interval={0} />
        <Tooltip {...tip} formatter={(v) => format(Number(v))} cursor={{ fill: "#f4f4f5" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? "#a1a1aa" : color} />)}
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
        <CartesianGrid stroke="#ececee" />
        <XAxis dataKey="block" {...axis} label={{ value: "Blok waktu (1 = terlama)", position: "insideBottom", offset: -10, fill: "var(--muted)", fontSize: 12 }} />
        <YAxis yAxisId="l" {...axis} unit="%" />
        <YAxis yAxisId="r" orientation="right" {...axis} />
        <Tooltip {...tip} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="l" dataKey="yes" name="Rasio yes (%)" fill="#d4d4d8" radius={[2, 2, 0, 0]} />
        <Line yAxisId="r" dataKey="euribor" name="Euribor 3 bulan" stroke="#18181b" strokeWidth={2} dot={{ r: 2.5 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function RateBars({ data, base, height }: { data: { name: string; rate: number; count: number }[]; base: number; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(220, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="#ececee" horizontal={false} />
        <XAxis type="number" {...axis} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" width={118} {...axis} interval={0} />
        <Tooltip {...tip} formatter={(v, _n, p) => [`${v}% (${(p.payload as { count: number }).count.toLocaleString("id-ID")} nasabah)`, "Rasio yes"]} cursor={{ fill: "#f4f4f5" }} />
        <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.rate >= base * 100 ? "#18181b" : "#c4c4cc"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Histogram({ data, height = 220 }: { data: { label: string; count: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#ececee" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tip} />
        <Area dataKey="count" name="Jumlah" stroke="#18181b" fill="#18181b" fillOpacity={0.12} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MeterBar({ value }: { value: number }) {
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-soft" role="img" aria-label={`Probabilitas ${(v * 100).toFixed(1)}%`}>
      <div className="h-full rounded-full bg-text" style={{ width: `${v * 100}%` }} />
    </div>
  );
}
