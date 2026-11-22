import { ApiStatus } from "@/components/ApiStatus";
import { CurveChart, SERIES, TimelineChart } from "@/components/charts";
import { Card, PageHeader, Stat, th } from "@/components/ui";
import { int, num, pct } from "@/lib/format";
import { meta, selectedModel } from "@/lib/meta";

export default function Home() {
  const top = meta.capacity.find((c) => c.k === meta.operating_point.default_top_k)!;
  const rows = [10, 20, 30, 50].map((k) => meta.capacity.find((c) => c.k === k)!);
  return (
    <>
      <PageHeader title="Ringkasan" note="Prediksi nasabah yang berpeluang berlangganan deposito berjangka." />
      <div className="mb-4"><ApiStatus /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Data nasabah" value={int(meta.eda.n_rows)} />
        <Stat label="Rasio berlangganan" value={pct(meta.eda.yes_rate)} />
        <Stat label="AUC data uji" value={num(selectedModel.holdout.AUC)} note={selectedModel.name} />
        <Stat label={`Telepon ${top.k}% teratas`} value={pct(top.recall, 0)} note="nasabah yes terjangkau" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Cumulative gains">
          <CurveChart curves={[{ name: selectedModel.name, points: selectedModel.gains, color: SERIES[1] }]} xLabel="Nasabah ditelepon" yLabel="Nasabah yes terjangkau" />
        </Card>
        <Card className="lg:col-span-2" title="Hasil per kapasitas telepon">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className={th}>Ditelepon</th><th className={`${th} text-right`}>Precision</th><th className={`${th} text-right`}>Recall</th><th className={`${th} text-right`}>Lift</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k} className="border-b border-border/60 last:border-0">
                  <td className="num py-2 pr-3">{r.k}%</td><td className="num pr-3 text-right">{pct(r.precision)}</td>
                  <td className="num pr-3 text-right">{pct(r.recall)}</td><td className="num text-right">{r.lift.toFixed(2).replace(".", ",")}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <Card className="mt-4" title="Rasio yes dan euribor per periode">
        <TimelineChart data={meta.eda.timeline} />
      </Card>
    </>
  );
}
