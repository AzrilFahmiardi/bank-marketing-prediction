import clsx from "clsx";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>}
    </header>
  );
}

export function Card({ title, hint, children, className }: { title?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-xl border border-border bg-surface p-4 sm:p-5", className)}>
      {(title || hint) && (
        <div className="mb-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "accent" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={clsx("num mt-1 text-2xl font-semibold tracking-tight", tone === "accent" && "text-accent")}>{value}</div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      tone === "good" && "bg-accentsoft text-accent", tone === "bad" && "bg-coral/15 text-coral",
      tone === "neutral" && "bg-surface2 text-muted")}>{children}</span>
  );
}

export function Button({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const { variant = "primary", ...rest } = p;
  return (
    <button {...rest} className={clsx("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
      variant === "primary" ? "bg-accent text-white hover:opacity-90" : "border border-border bg-surface hover:bg-surface2", className)} />
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <div role="alert" className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{children}</div>;
}

export const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
