"use client";
import clsx from "clsx";
import { BarChart3, Database, FileUp, Gauge, History, LayoutDashboard, UserSearch } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/predict", label: "Prediksi", icon: UserSearch },
  { href: "/batch", label: "Batch CSV", icon: FileUp },
  { href: "/models", label: "Performa model", icon: Gauge },
  { href: "/insights", label: "Insight data", icon: BarChart3 },
  { href: "/history", label: "Riwayat", icon: History },
];

export function Nav() {
  const path = usePathname();
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-0 flex h-screen flex-col p-4">
          <Link href="/" className="mb-6 flex items-center gap-2.5 px-2 pt-1">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white"><Database size={17} /></span>
            <span className="leading-tight"><span className="block text-sm font-semibold">Bank Marketing</span><span className="block text-xs text-muted">Prediksi deposito</span></span>
          </Link>
          <nav className="flex flex-col gap-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? path === "/" : path.startsWith(href);
              return (
                <Link key={href} href={href} className={clsx("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-accentsoft font-medium text-accent" : "text-muted hover:bg-surface2 hover:text-text")}>
                  <Icon size={17} />{label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-auto px-2 text-xs leading-relaxed text-muted">UAS Penambangan Data<br />D-IV TRPL, Sekolah Vokasi UGM</p>
        </div>
      </aside>
      <nav className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden" aria-label="Navigasi utama">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={clsx("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm",
              active ? "bg-accentsoft font-medium text-accent" : "text-muted")}>
              <Icon size={16} />{label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
