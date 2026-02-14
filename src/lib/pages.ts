import "server-only";
import fs from "fs";
import path from "path";

export type PageDoc = {
  // NEW (optional for now; required going forward)
  category?: string;

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
  const parsed = JSON.parse(raw) as PageDoc;

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

  return parsed;
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


