// src/lib/gates/selector.ts
import type { PageDoc } from "@/lib/pages";

export type GateId =
  | "non_negotiable"
  | "lens_scenario"
  | "platform_ecosystem";

type GateContext = {
  category: string;
  persona: string;
};

/**
 * Decide which gates to show for a given comparison page.
 * Keep this deterministic + simple.
 *
 * v1: always show the core gates everywhere.
 * v2: branch by persona/category when you have more gates.
 */
export function getGatesForPage(_ctx: GateContext): GateId[] {
  return ["non_negotiable", "lens_scenario", "platform_ecosystem"];
}

/**
 * Convenience helper if you want to pass the doc directly.
 * Uses backwards-compatible category (if missing, "Uncategorized").
 */
export function getGatesForDoc(doc: PageDoc): GateId[] {
  const maybe = doc as unknown as { category?: string };

  const category = (maybe.category ?? "").toString().trim() || "Uncategorized";
  const persona = (doc.persona ?? "").toString().trim() || "Unknown";

  return getGatesForPage({ category, persona });
}
