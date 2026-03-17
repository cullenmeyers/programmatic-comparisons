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
  related_pages: RelatedPageDoc[];
};

export type RelatedPageDoc = {
  title: string;
  slug: string;
  exists: boolean;
  x_name: string;
  y_name: string;
  persona: string;
};

export type PublishedRelatedPage = {
  title: string;
  slug: string;
};

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export const LOCKED_PERSONA_ORDER = [
  "Beginner",
  "Solo user",
  "Student",
  "Busy professional",
  "Power user",
  "Non-technical user",
  "Minimalist",
] as const;

type LockedPersona = (typeof LOCKED_PERSONA_ORDER)[number];

export type CategoryIndex = {
  slug: string;
  label: string;
  pages: PageDoc[];
};

export function listPageSlugs(): string[] {
  if (!fs.existsSync(PAGES_DIR)) return [];
  return fs
    .readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function buildRelatedPageTitle(
  xName: string,
  yName: string,
  persona: string
) {
  return `${xName} vs ${yName} for ${persona}`;
}

function parseRelatedTitle(title: string) {
  const [pairPart, ...rest] = String(title || "").split(" for ");
  const [xName = "", yName = ""] = pairPart.split(" vs ");

  return {
    xName: xName.trim(),
    yName: yName.trim(),
    persona: rest.join(" for ").trim(),
  };
}

function normalizeRelatedPage(raw: unknown): RelatedPageDoc | null {
  const item =
    raw && typeof raw === "object" ? (raw as Partial<RelatedPageDoc>) : null;
  const titleBits = parseRelatedTitle(String(item?.title || ""));
  const xName = String(item?.x_name || titleBits.xName || "").trim();
  const yName = String(item?.y_name || titleBits.yName || "").trim();
  const persona = String(item?.persona || titleBits.persona || "").trim();

  if (!xName || !yName || !persona) {
    return null;
  }

  return {
    title:
      String(item?.title || "").trim() ||
      buildRelatedPageTitle(xName, yName, persona),
    slug:
      String(item?.slug || "").trim() || slugifyCompare(xName, yName, persona),
    exists: typeof item?.exists === "boolean" ? item.exists : false,
    x_name: xName,
    y_name: yName,
    persona,
  };
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

  if (Array.isArray(parsed.related_pages)) {
    parsed.related_pages = parsed.related_pages
      .map((item) => normalizeRelatedPage(item))
      .filter((item): item is RelatedPageDoc => item !== null);
  } else {
    parsed.related_pages = [];
  }

  return parsed;
}

export function listPageDocs(): PageDoc[] {
  return listPageSlugs()
    .map((slug) => loadPageBySlug(slug))
    .filter((doc): doc is PageDoc => doc !== null);
}

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getPageCategoryLabel(doc: PageDoc): string {
  const raw = (doc.category ?? "").toString().trim();
  if (raw) return raw;

  const slug = getPageCategorySlug(doc);
  return slug ? titleCaseSlug(slug) : "Uncategorized";
}

export function getPageCategorySlug(doc: PageDoc): string | null {
  const raw = (doc.categorySlug ?? "").toString().trim();
  return raw || null;
}

export function getPublishedRelatedPages(doc: PageDoc): PublishedRelatedPage[] {
  const currentCategorySlug = getPageCategorySlug(doc);

  return doc.related_pages.flatMap((relatedPage) => {
    const relatedSlug = relatedPage.slug?.trim();

    if (!relatedPage.exists || !relatedSlug || relatedSlug === doc.slug) {
      return [];
    }

    const relatedDoc = loadPageBySlug(relatedSlug);
    if (!relatedDoc) {
      return [];
    }

    if (relatedDoc.persona !== doc.persona) {
      return [];
    }

    if (currentCategorySlug && getPageCategorySlug(relatedDoc) !== currentCategorySlug) {
      return [];
    }

    return [
      {
        title: relatedDoc.title,
        slug: relatedDoc.slug,
      },
    ];
  });
}

export function isLockedPersona(persona: string): persona is LockedPersona {
  return (LOCKED_PERSONA_ORDER as readonly string[]).includes(persona);
}

export function listCategoryIndexes(): CategoryIndex[] {
  const groups = new Map<string, CategoryIndex>();

  for (const doc of listPageDocs()) {
    const slug = getPageCategorySlug(doc);
    if (!slug) continue;

    const existing = groups.get(slug);
    if (existing) {
      existing.pages.push(doc);
      if (existing.label === "Uncategorized" && doc.category?.trim()) {
        existing.label = doc.category.trim();
      }
      continue;
    }

    groups.set(slug, {
      slug,
      label: getPageCategoryLabel(doc),
      pages: [doc],
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      pages: group.pages.slice().sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getCategoryIndexBySlug(categorySlug: string): CategoryIndex | null {
  return (
    listCategoryIndexes().find((category) => category.slug === categorySlug) ?? null
  );
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

function firstSentence(text: string) {
  if (!text) return "";
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : trimmed;
}

function buildHubPreviewWinnerLabel(
  doc: PageDoc,
  xName: string,
  yName: string
) {
  const explicitWinner = doc.oneSecondVerdict?.winnerLabel?.trim();
  if (explicitWinner) return explicitWinner;

  if (doc.verdict.winner === "x") return xName;
  if (doc.verdict.winner === "y") return yName;
  return "Depends";
}

export function buildCategoryHubPreview(doc: PageDoc): string {
  const { xName, yName } = getToolNamesFromDoc(doc);
  const winnerLabel = buildHubPreviewWinnerLabel(doc, xName, yName);
  const summary = firstSentence(
    doc.oneSecondVerdict?.summary?.trim() || doc.verdict.summary?.trim() || ""
  );

  if (!summary) return "";

  if (/depends/i.test(winnerLabel)) {
    return `Verdict depends - ${summary}`;
  }

  return `${winnerLabel} wins - ${summary}`;
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


