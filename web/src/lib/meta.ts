import raw from "@/data/metadata.json";
import type { Metadata } from "./types";

export const meta = raw as unknown as Metadata;
export const selectedModel = meta.models.find((m) => m.selected)!;
