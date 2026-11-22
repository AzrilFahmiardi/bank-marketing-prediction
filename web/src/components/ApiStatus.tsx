"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function ApiStatus() {
  const [state, setState] = useState<"loading" | "up" | "down">("loading");
  useEffect(() => { api.health().then(() => setState("up")).catch(() => setState("down")); }, []);
  const text = state === "loading" ? "Memeriksa API" : state === "up" ? "API aktif" : "API tidak terjangkau";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${state === "up" ? "bg-text" : "bg-border"}`} />{text}
    </span>
  );
}
