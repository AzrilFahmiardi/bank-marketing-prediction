"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "./ui";

export function ApiStatus() {
  const [state, setState] = useState<"loading" | "up" | "down">("loading");
  useEffect(() => {
    api.health().then(() => setState("up")).catch(() => setState("down"));
  }, []);
  if (state === "loading") return <Badge>Memeriksa API...</Badge>;
  return state === "up" ? <Badge tone="good">API aktif</Badge> : <Badge tone="bad">API tidak terjangkau</Badge>;
}
