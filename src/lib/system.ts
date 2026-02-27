import fs from "node:fs";
import path from "node:path";

export type SystemDocType = "architecture" | "delta";

export type SystemDoc = {
  slug: string;
  title: string;
  type: SystemDocType; // "architecture" | "delta"
  date?: string; // ISO string for deltas (optional)
  updated?: string; // ISO string (optional)
  summary?: string;

  // Template fields (keep rigid)
  what_this_is?: string;     // for architecture pages
  what_changed?: string;     // for deltas
  structural_problem: string;
  rule: string;
  tradeoff: string;
  failure_mode: string;
  structural_impact: string;
};

const SYSTEM_DIR = path.join(process.cwd(), "content", "system");

function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export function listSystemSlugs(): string[] {
  if (!fs.existsSync(SYSTEM_DIR)) return [];
  return fs
    .readdirSync(SYSTEM_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function loadSystemDocBySlug(slug: string): SystemDoc | null {
  const filePath = path.join(SYSTEM_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  const data = readJsonFile(filePath) as Partial<SystemDoc>;

  // Basic shape enforcement (fail fast but safely)
  if (!data.title || !data.type || !data.structural_problem || !data.rule || !data.tradeoff || !data.failure_mode || !data.structural_impact) {
    // You can throw instead if you prefer hard failures during build.
    return null;
  }

  return {
    slug,
    title: data.title,
    type: data.type,
    date: data.date,
    updated: data.updated,
    summary: data.summary,
    what_this_is: data.what_this_is,
    what_changed: data.what_changed,
    structural_problem: data.structural_problem,
    rule: data.rule,
    tradeoff: data.tradeoff,
    failure_mode: data.failure_mode,
    structural_impact: data.structural_impact,
  };
}

export function loadAllSystemDocs(): SystemDoc[] {
  return listSystemSlugs()
    .map((slug) => loadSystemDocBySlug(slug))
    .filter((d): d is SystemDoc => Boolean(d))
    .sort((a, b) => {
      // Architecture first, then deltas newest first
      if (a.type !== b.type) return a.type === "architecture" ? -1 : 1;
      const ad = a.date ?? a.updated ?? "1970-01-01";
      const bd = b.date ?? b.updated ?? "1970-01-01";
      return bd.localeCompare(ad);
    });
}