import clsx from "clsx";
import type { ReactNode } from "react";

export function PageHeader({ title, note }: { title: string; note?: string }) {
  return (
    <header className="mb-6 border-b border-border pb-4">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </header>
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-md border border-border bg-surface p-4", className)}>
      {title && <h2 className="mb-3 text-sm font-medium">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="num mt-0.5 text-xl font-semibold">{value}</div>
      {note && <div className="num mt-0.5 text-xs text-muted">{note}</div>}
    </div>
  );
}

export function Tag({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <span className={clsx("rounded px-1.5 py-0.5 text-xs", strong ? "bg-text text-white" : "bg-soft text-muted")}>{children}</span>;
}

export function Button({ className, variant = "primary", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button {...rest} className={clsx("inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
      variant === "primary" ? "bg-text text-white hover:bg-black/80" : "border border-border bg-surface hover:bg-soft", className)} />
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <div role="alert" className="rounded-md border border-border bg-soft px-3 py-2 text-sm">{children}</div>;
}

export const inputCls = "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-text";
export const th = "py-2 pr-3 text-left text-xs font-medium text-muted";
