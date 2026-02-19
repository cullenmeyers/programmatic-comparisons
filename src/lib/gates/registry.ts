// src/lib/gates/registry.ts
// This is the TOOLS registry (for /tools). It is NOT the per-page gate selection logic.

export type ToolDef = {
  id: string;          // internal stable id
  slug: string;        // URL slug under /tools/...
  name: string;        // display name
  description: string; // short 1–2 sentence description
  badge: string;       // small label like "Gate"
};

const TOOLS: ToolDef[] = [
  {
    id: "non_negotiable",
    slug: "non-negotiable-requirement-gate",
    name: "Non-Negotiable Requirement Gate",
    description:
      "Eliminate one option immediately if it violates a hard requirement.",
    badge: "Gate",
  },
  {
    id: "lens_scenario",
    slug: "lens-gate",
    name: "Lens Gate",
    description:
      "Pick your situation (short-term, long-term, not sure) and get the right next move.",
    badge: "Gate",
  },
  {
    id: "platform_ecosystem",
    slug: "platform-ecosystem-gate",
    name: "Platform / Ecosystem Gate",
    description:
      "If you’re already committed to Apple, Google, or Microsoft, eliminate the tool that doesn’t fit your ecosystem.",
    badge: "Gate",
  },
];

export function listTools(): ToolDef[] {
  return TOOLS;
}

export function getToolBySlug(slug: string): ToolDef | null {
  return TOOLS.find((t) => t.slug === slug) ?? null;
}

export function getToolById(id: string): ToolDef | null {
  return TOOLS.find((t) => t.id === id) ?? null;
}


