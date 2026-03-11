import "server-only";
import fs from "fs";
import path from "path";

export type PageDoc = {
  // NEW (optional for now; required going forward)
  category?: string;
  categorySlug?: string;
  constraintSlug?: string;
  oneSecondVerdict?: {
    winnerLabel: string;
    summary: string;
    reason: string;
  };
  one_second_verdict?: {
    winner_label: string;
    summary: string;
    reason: string;
  };

  title: string;
  slug: string;
  meta_description: string;
  persona: string;
  constraint_lens: string;

  verdict: {
    winner: "x" | "y" | "depends";
    summary: string;
    decision_rule: string;
  };

  sections: Array<
    | { type: "persona_fit"; heading: string; content: string }
    | {
        type: "x_wins";
        heading: string;
        bullets: Array<{ point: string; why_it_matters: string }>;
      }
    | {
        type: "y_wins";
        heading: string;
        bullets: Array<{ point: string; why_it_matters: string }>;
      }
    | {
        type: "failure_modes";
        heading: string;
        items: Array<{
          tool: "x" | "y";
          fails_when: string;
          what_to_do_instead: string;
        }>;
      }
    | { type: "edge_case"; heading: string; content: string }
    | { type: "quick_rules"; heading: string; rules: string[] }
  >;

  faqs: Array<{ q: string; a: string }>;
  related_pages: Array<{ x_name: string; y_name: string; persona: string }>;
};

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export function listPageSlugs(): string[] {
  if (!fs.existsSync(PAGES_DIR)) return [];
  return fs
    .readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function loadPageBySlug(slug: string): PageDoc | null {
  const filePath = path.join(PAGES_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

const raw = fs.readFileSync(filePath, "utf8");
let parsed: PageDoc;

try {
  parsed = JSON.parse(raw) as PageDoc;
} catch (err) {
  console.error("❌ Invalid JSON in file:", filePath);
  console.error("First 200 chars:", raw.slice(0, 200));
  console.error("Last 200 chars:", raw.slice(-200));
  throw err;
}

  if (!parsed?.title || !parsed?.slug || parsed.slug !== slug) {
    throw new Error(`Invalid page doc for slug "${slug}" (title/slug mismatch).`);
  }
  if (!parsed?.verdict?.winner || !parsed?.verdict?.summary) {
    throw new Error(`Invalid verdict for slug "${slug}".`);
  }

  // Backwards compatible:
  // category is optional for old pages, but we normalize whitespace if present.
  if (typeof parsed.category === "string") {
    parsed.category = parsed.category.trim() || undefined;
  }
  if (typeof parsed.categorySlug === "string") {
    parsed.categorySlug = parsed.categorySlug.trim() || undefined;
  }
  if (typeof parsed.constraintSlug === "string") {
    parsed.constraintSlug = parsed.constraintSlug.trim() || undefined;
  }
  if (parsed.one_second_verdict) {
    const winnerLabel = parsed.one_second_verdict.winner_label?.trim() || "";
    const summary = parsed.one_second_verdict.summary?.trim() || "";
    const reason = parsed.one_second_verdict.reason?.trim() || "";

    parsed.oneSecondVerdict =
      winnerLabel && summary && reason
        ? { winnerLabel, summary, reason }
        : parsed.oneSecondVerdict;
  }
  if (parsed.oneSecondVerdict) {
    const winnerLabel = parsed.oneSecondVerdict.winnerLabel?.trim() || "";
    const summary = parsed.oneSecondVerdict.summary?.trim() || "";
    const reason = parsed.oneSecondVerdict.reason?.trim() || "";

    parsed.oneSecondVerdict =
      winnerLabel && summary && reason
        ? { winnerLabel, summary, reason }
        : undefined;
  }

  return parsed;
}

export function listPageDocs(): PageDoc[] {
  return listPageSlugs()
    .map((slug) => loadPageBySlug(slug))
    .filter((doc): doc is PageDoc => doc !== null);
}

export function getToolNamesFromDoc(doc: PageDoc): { xName: string; yName: string } {
  const maybe = doc as unknown as {
    x_name?: string;
    y_name?: string;
    title: string;
  };

  if (maybe.x_name?.trim() && maybe.y_name?.trim()) {
    return { xName: maybe.x_name.trim(), yName: maybe.y_name.trim() };
  }

  const title = doc.title || "";
  const beforeFor = title.split(" for ")[0] ?? title;
  const parts = beforeFor.split(" vs ");

  const xName = (parts[0] ?? "Option X").trim() || "Option X";
  const yName = (parts[1] ?? "Option Y").trim() || "Option Y";

  return { xName, yName };
}

export function listComparisonsForGate(
  categorySlug: string,
  constraintSlug: string
): string[] {
  return listPageDocs()
    .filter(
      (doc) =>
        doc.categorySlug === categorySlug &&
        doc.constraintSlug === constraintSlug
    )
    .map((doc) => doc.slug)
    .sort((a, b) => a.localeCompare(b));
}

export function slugifyCompare(xName: string, yName: string, persona: string) {
  const toSlug = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return `${toSlug(xName)}-vs-${toSlug(yName)}-for-${toSlug(persona)}`;
}


