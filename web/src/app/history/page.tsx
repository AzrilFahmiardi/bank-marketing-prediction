"use client";
import { useEffect, useState } from "react";
import { Histogram } from "@/components/charts";
import { Card, ErrorNote, PageHeader, Stat, Tag, th } from "@/components/ui";
import { api } from "@/lib/api";
import { int, pct } from "@/lib/format";
import type { HistoryItem, Stats } from "@/lib/types";

export default function HistoryPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stats(), api.history(30)])
      .then(([s, h]) => { setStats(s); setItems(h.items); })
      .catch((e) => setErr(e instanceof TypeError ? "API tidak terjangkau. Muat ulang beberapa detik lagi." : e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Riwayat prediksi" />
      {loading && <p className="text-sm text-muted">Memuat...</p>}
      {err && <ErrorNote>{err}</ErrorNote>}
      {stats && !stats.enabled && <p className="text-sm text-muted">Database belum terhubung.</p>}
      {stats?.enabled && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Total prediksi" value={int(stats.total ?? 0)} />
            <Stat label="Rata-rata probabilitas" value={pct(stats.avg_probability ?? 0)} />
            <Stat label="Di atas batas" value={int(stats.predicted_yes ?? 0)} />
            <Stat label="File batch" value={int(stats.batch_jobs ?? 0)} note={`${int(stats.batch_rows ?? 0)} baris`} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Sebaran probabilitas">
              <Histogram data={Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}`, count: stats.score_histogram?.find((b) => b.bucket === i + 1)?.count ?? 0 }))} />
            </Card>
            <Card title="Prediksi per hari">
              <Histogram data={(stats.daily ?? []).map((d) => ({ label: d.date.slice(5), count: d.count }))} />
            </Card>
          </div>
          <Card className="mt-4" title="Terbaru">
            {items.length === 0 ? <p className="text-sm text-muted">Belum ada data.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead><tr className="border-b border-border"><th className={th}>Waktu</th><th className={th}>Sumber</th><th className={th}>Input</th><th className={`${th} text-right`}>Probabilitas</th><th className={th}>Hasil</th></tr></thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id} className="border-b border-border/60 last:border-0">
                        <td className="num whitespace-nowrap py-2 pr-3">{new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</td>
                        <td className="pr-3">{r.source === "single" ? "Satu" : "Batch"}</td>
                        <td className="pr-3 text-muted">{String(r.input.job)}, {String(r.input.age)} th, {String(r.input.month)}</td>
                        <td className="num pr-3 text-right">{pct(r.probability)}</td>
                        <td>{r.predicted_yes ? <Tag strong>Telepon</Tag> : <Tag>Lewati</Tag>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
