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
  const link = (href: string, label: string, side: boolean) => {
    const active = href === "/" ? path === "/" : path.startsWith(href);
    return (
      <Link key={href} href={href} className={clsx("rounded-md px-2.5 py-1.5 text-sm", side && "block", active ? "bg-soft font-medium text-text" : "text-muted hover:bg-soft/60 hover:text-text")}>{label}</Link>
    );
  };
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
        <Link href="/" className="mb-6 px-2.5 text-sm font-semibold">Bank Marketing</Link>
        <nav className="flex flex-col gap-0.5" aria-label="Navigasi utama">{items.map((i) => link(i.href, i.label, true))}</nav>
      </aside>
      <header className="border-b border-border bg-surface lg:hidden">
        <div className="px-4 pt-3 text-sm font-semibold">Bank Marketing</div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2" aria-label="Navigasi utama">{items.map((i) => link(i.href, i.label, false))}</nav>
      </header>
    </>
  );
}
