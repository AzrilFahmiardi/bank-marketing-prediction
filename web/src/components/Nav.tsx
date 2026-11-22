"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Ringkasan" },
  { href: "/predict", label: "Prediksi" },
  { href: "/batch", label: "Batch" },
  { href: "/models", label: "Model" },
  { href: "/insights", label: "Data" },
  { href: "/history", label: "Riwayat" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-1 px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold">Bank Marketing</Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto" aria-label="Navigasi utama">
          {items.map(({ href, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href} className={clsx("rounded px-2.5 py-1.5 text-sm", active ? "bg-soft font-medium text-text" : "text-muted hover:text-text")}>{label}</Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
