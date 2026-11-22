"use client";
import { Download, FileUp, Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Badge, Button, Card, ErrorNote, PageHeader, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { download, parseCsv, toCsv } from "@/lib/csv";
import { int, pct } from "@/lib/format";
import { meta } from "@/lib/meta";
import type { BatchResult } from "@/lib/types";

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [res, setRes] = useState<BatchResult | null>(null);
  const [topK, setTopK] = useState(meta.operating_point.default_top_k);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function run(f: File) {
    setFile(f); setRes(null); setErr(null); setBusy(true);
    try {
      setRows(parseCsv(await f.text()));
      setRes(await api.batch(f));
    } catch (x) {
      setErr(x instanceof TypeError ? "API tidak terjangkau. Jika server baru bangun dari tidur, coba lagi beberapa detik lagi." : (x as Error).message);
    } finally { setBusy(false); }
  }

  const ranked = useMemo(() => {
    if (!res) return [];
    return [...res.rows].sort((a, b) => b.probability - a.probability).map((r, i) => ({ ...r, rank: i + 1, src: rows[r.row] ?? {} }));
  }, [res, rows]);
  const nCall = res ? Math.ceil((topK / 100) * res.n_rows) : 0;
  const avgSel = ranked.length ? ranked.slice(0, nCall).reduce((s, r) => s + r.probability, 0) / Math.max(nCall, 1) : 0;

  function template() {
    const row = Object.fromEntries(meta.features.map((f) => [f.name, f.default]));
    download("template_nasabah.csv", toCsv([row, { ...row, age: 30 }]));
  }
  function exportResult() {
    download("hasil_skoring.csv", toCsv(ranked.map((r) => ({ rank: r.rank, baris_asli: r.row + 2, probabilitas: r.probability.toFixed(4), ditelepon: r.rank <= nCall ? "ya" : "tidak", ...r.src }))));
  }

  return (
    <>
      <PageHeader title="Skoring file CSV" subtitle="Unggah daftar nasabah, lalu tentukan berapa persen nasabah dengan skor tertinggi yang akan ditelepon sesuai kapasitas tim." />
      <Card>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) run(f); }}
          className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <FileUp className="text-muted" />
          <p className="text-sm">{file ? file.name : "Seret file CSV ke sini atau pilih dari komputer"}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => input.current?.click()} disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}Pilih file</Button>
            <Button variant="ghost" onClick={template}><Download size={16} />Unduh template</Button>
          </div>
          <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f); e.target.value = ""; }} />
          <p className="max-w-xl text-xs leading-relaxed text-muted">Kolom wajib: {meta.features.map((f) => f.name).join(", ")}. Kolom lain (mis. duration, y, id) diabaikan. Maksimal 20.000 baris.</p>
        </div>
        {err && <div className="mt-3"><ErrorNote>{err}</ErrorNote></div>}
      </Card>

      {res && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Nasabah dinilai" value={int(res.n_rows)} />
            <Stat label="Akan ditelepon" value={int(nCall)} note={`${topK}% teratas`} tone="accent" />
            <Stat label="Rata-rata probabilitas terpilih" value={pct(avgSel)} />
            <Stat label="Di atas batas default" value={int(res.n_predicted_yes)} note={`probabilitas ≥ ${pct(res.threshold)}`} />
          </div>
          <Card className="mt-4" title="Kapasitas telepon">
            <div className="flex items-center gap-4">
              <input aria-label="Persentase nasabah yang ditelepon" type="range" min={1} max={100} value={topK} onChange={(e) => setTopK(Number(e.target.value))} className="w-full" />
              <span className="num w-14 text-right text-sm font-medium">{topK}%</span>
            </div>
          </Card>
          <Card className="mt-4" title="Daftar nasabah terurut skor" hint={ranked.length > 100 ? "Menampilkan 100 teratas. Unduh CSV untuk daftar lengkap." : undefined}>
            <div className="mb-3"><Button variant="ghost" onClick={exportResult}><Download size={16} />Unduh hasil</Button></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-border"><th className="py-2 pr-3">#</th><th className="pr-3">Baris</th><th className="pr-3">Umur</th><th className="pr-3">Pekerjaan</th><th className="pr-3">Bulan</th><th className="pr-3 text-right">Probabilitas</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {ranked.slice(0, 100).map((r) => (
                    <tr key={r.row} className="border-b border-border/60">
                      <td className="num py-2 pr-3">{r.rank}</td><td className="num pr-3">{r.row + 2}</td>
                      <td className="pr-3">{r.src.age}</td><td className="pr-3">{r.src.job}</td><td className="pr-3">{r.src.month}</td>
                      <td className="num pr-3 text-right">{pct(r.probability)}</td>
                      <td>{r.rank <= nCall ? <Badge tone="good">Telepon</Badge> : <Badge>Lewati</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
