export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d).replace(".", ",")}%`;
export const num = (v: number, d = 3) => v.toFixed(d).replace(".", ",");
export const int = (v: number) => v.toLocaleString("id-ID");

export const FEATURE_LABELS: Record<string, string> = {
  age: "Umur", job: "Pekerjaan", marital: "Status pernikahan", education: "Pendidikan",
  default: "Kredit macet", housing: "Kredit rumah", loan: "Pinjaman pribadi", contact: "Jenis kontak",
  month: "Bulan kontak", day_of_week: "Hari kontak", campaign: "Jumlah kontak kampanye ini",
  pdays: "Hari sejak kontak terakhir", previous: "Kontak kampanye sebelumnya", poutcome: "Hasil kampanye sebelumnya",
  "emp.var.rate": "Employment variation rate", "cons.price.idx": "Consumer price index",
  "cons.conf.idx": "Consumer confidence index", euribor3m: "Euribor 3 bulan", "nr.employed": "Jumlah tenaga kerja",
};
export const label = (f: string) => FEATURE_LABELS[f] ?? f;
