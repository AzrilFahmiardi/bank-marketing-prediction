import Link from "next/link";
import { ApiStatus } from "@/components/ApiStatus";
import { CurveChart, Donut, SERIES, TimelineChart } from "@/components/charts";
import { Card, PageHeader, Stat } from "@/components/ui";
import { int, num, pct } from "@/lib/format";
import { meta, selectedModel } from "@/lib/meta";

export default function Home() {
  const top = meta.capacity.find((c) => c.k === meta.operating_point.default_top_k)!;
  const uts = meta.uts_baseline.find((m) => m.name.startsWith("Logistic"))!;
  return (
    <>
      <PageHeader title="Prediksi keberhasilan telemarketing bank"
        subtitle="Model machine learning memperkirakan nasabah mana yang berpeluang berlangganan deposito berjangka, sehingga panggilan bisa difokuskan ke nasabah dengan peluang tertinggi." />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <ApiStatus />
        <span>Model: <b className="text-text">{selectedModel.name}</b></span>
        <span>· versi {meta.model_version}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Data nasabah" value={int(meta.eda.n_rows)} note="setelah duplikat dibuang" />
        <Stat label="Rasio berlangganan" value={pct(meta.eda.yes_rate)} note={`${int(meta.eda.n_yes)} nasabah yes`} />
        <Stat label="AUC data uji" value={num(selectedModel.holdout.AUC)} note={`UTS terbaik: ${num(uts.AUC)}`} tone="accent" />
        <Stat label={`Telepon ${top.k}% teratas`} value={pct(top.recall, 0)} note={`nasabah yes terjangkau, lift ${top.lift.toFixed(2).replace(".", ",")}x`} tone="accent" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Kurva cumulative gains (data uji)" hint="Semakin melengkung di atas garis acak, semakin sedikit panggilan yang dibutuhkan untuk menjangkau nasabah yes.">
          <CurveChart curves={[{ name: selectedModel.name, points: selectedModel.gains, color: SERIES[1] }]} xLabel="Nasabah yang ditelepon (skor tertinggi dulu)" yLabel="Nasabah yes terjangkau" />
        </Card>
        <Card className="lg:col-span-2" title="Distribusi target">
          <div className="flex flex-col items-center gap-3 py-2 sm:flex-row sm:justify-around">
            <DonutWrap />
            <p className="max-w-[210px] text-sm leading-relaxed text-muted">
              Sekitar 9 dari 10 panggilan tidak berujung langganan. Data sangat tidak seimbang, sehingga akurasi biasa tidak cocok dipakai sebagai ukuran utama.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-4" title="Mengapa evaluasi dibuat berurutan waktu" hint="Rasio yes dan suku bunga euribor berubah tajam dari 2008 sampai 2010, sehingga model harus diuji pada periode yang datang setelah data latih.">
        <TimelineChart data={meta.eda.timeline} />
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/predict", t: "Prediksi satu nasabah", d: "Isi profil nasabah dan lihat probabilitas serta faktor pendorongnya." },
          { href: "/batch", t: "Skoring file CSV", d: "Unggah daftar nasabah, urutkan, dan tentukan berapa persen yang ditelepon." },
          { href: "/models", t: "Bandingkan model", d: "Tabel metrik, kurva ROC, hasil rolling window, dan simulasi kapasitas telepon." },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="rounded-xl border border-border bg-surface p-4 transition hover:border-accent">
            <div className="text-sm font-semibold">{x.t}</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{x.d}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function DonutWrap() {
  return <Donut yes={meta.eda.n_yes} total={meta.eda.n_rows} />;
}
