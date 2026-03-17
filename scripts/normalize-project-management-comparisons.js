/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REDIRECTS_PATH = path.join(
  ROOT,
  "content",
  "system",
  "legacy-comparison-redirects.json"
);
const TARGET_CATEGORY = process.argv[2] || "project-management-tools";
const REPORT_BASENAME = `${TARGET_CATEGORY}-canonicalization-report.md`;
const REPORT_PATH = path.join(REPORTS_DIR, REPORT_BASENAME);

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifyCompare(xName, yName, persona) {
  return `${toSlug(xName)}-vs-${toSlug(yName)}-for-${toSlug(persona)}`;
}

function normalizedToolName(name) {
  return toSlug(name);
}

function parsePairFromTitle(title) {
  const [pairPart, ...rest] = String(title || "").split(" for ");
  const [xName = "", yName = ""] = pairPart.split(" vs ");

  return {
    xName: xName.trim(),
    yName: yName.trim(),
    suffix: rest.length ? ` for ${rest.join(" for ")}` : "",
  };
}

function canonicalizePair(xName, yName) {
  return [xName, yName].sort((a, b) =>
    normalizedToolName(a).localeCompare(normalizedToolName(b))
  );
}

function flipWinner(winner) {
  if (winner === "x") return "y";
  if (winner === "y") return "x";
  return winner;
}

function flipSectionType(type) {
  if (type === "x_wins") return "y_wins";
  if (type === "y_wins") return "x_wins";
  return type;
}

function flipFailureTool(tool) {
  if (tool === "x") return "y";
  if (tool === "y") return "x";
  return tool;
}

function replacePairText(text, oldX, oldY, newX, newY) {
  if (typeof text !== "string" || !text) return text;

  const direct = `${oldX} vs ${oldY}`;
  const swapped = `${newX} vs ${newY}`;

  return text.replaceAll(direct, swapped);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function titleCaseCategorySlug(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function loadPageEntries() {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const filePath = path.join(PAGES_DIR, file);
      const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));

      return { file, filePath, doc };
    });
}

function loadRedirects() {
  if (!fs.existsSync(REDIRECTS_PATH)) return [];
  return JSON.parse(fs.readFileSync(REDIRECTS_PATH, "utf8"));
}

function saveRedirects(redirects) {
  ensureDir(path.dirname(REDIRECTS_PATH));
  fs.writeFileSync(REDIRECTS_PATH, `${JSON.stringify(redirects, null, 2)}\n`);
}

function canonicalizeRelatedPages(doc) {
  if (!Array.isArray(doc.related_pages)) return { changed: false, items: doc.related_pages };

  let changed = false;
  const items = doc.related_pages.map((item) => {
    const originalX = item.x_name;
    const originalY = item.y_name;
    const [xName, yName] = canonicalizePair(originalX, originalY);

    if (xName !== originalX || yName !== originalY) {
      changed = true;
    }

    return {
      ...item,
      x_name: xName,
      y_name: yName,
    };
  });

  return { changed, items };
}

function buildReport(report) {
  const lines = [
    `# ${titleCaseCategorySlug(report.categorySlug)} Canonicalization Report`,
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total mirrored pairs found: ${report.totalMirroredPairsFound}`,
    `- Total rows/pages rewritten: ${report.totalRowsRewritten}`,
    `- Total true duplicates found: ${report.totalTrueDuplicatesFound}`,
    `- Total rows/pages flagged for manual review: ${report.totalManualReviewFlags}`,
    "",
    "## Changed Rows/Pages",
    "",
  ];

  if (report.changedPages.length === 0) {
    lines.push("- None");
  } else {
    for (const page of report.changedPages) {
      lines.push(`- Original pair: ${page.originalPair}`);
      lines.push(`  Canonical pair: ${page.canonicalPair}`);
      lines.push(`  Persona: ${page.persona}`);
      lines.push(`  Winner flipped: ${page.winnerFlipped ? "Yes" : "No"}`);
      lines.push(`  Slug/path changed: ${page.slugPathChanged ? "Yes" : "No"}`);
    }
  }

  lines.push("", "## Removed Entries", "");

  if (report.removedEntries.length === 0) {
    lines.push("- None");
  } else {
    for (const entry of report.removedEntries) {
      lines.push(`- ${entry}`);
    }
  }

  lines.push("", "## Manual Review Flags", "");

  if (report.manualReviewFlags.length === 0) {
    lines.push("- None");
  } else {
    for (const entry of report.manualReviewFlags) {
      lines.push(`- ${entry}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const entries = loadPageEntries();
  const targetEntries = entries.filter(
    ({ doc }) => doc.categorySlug === TARGET_CATEGORY
  );
  const activePageSlugs = new Set(entries.map(({ doc }) => `/compare/${doc.slug}`));

  const groupByCanonicalPair = new Map();
  const filesByPlannedOutput = new Map();
  const changedPages = [];
  const manualReviewFlags = [];
  const removedEntries = [];
  const redirects = loadRedirects();
  const redirectsBySource = new Map(
    redirects.map((redirect) => [redirect.source, redirect])
  );
  let totalMirroredPairsFound = 0;
  let totalTrueDuplicatesFound = 0;

  for (const entry of targetEntries) {
    const { xName, yName } = parsePairFromTitle(entry.doc.title);
    const [canonicalX, canonicalY] = canonicalizePair(xName, yName);
    const directionKey = `${normalizedToolName(xName)}::${normalizedToolName(yName)}`;
    const canonicalKey = `${normalizedToolName(canonicalX)}::${normalizedToolName(canonicalY)}`;
    const plannedSlug = slugifyCompare(canonicalX, canonicalY, entry.doc.persona);
    const plannedFile = `${plannedSlug}.json`;

    if (!groupByCanonicalPair.has(canonicalKey)) {
      groupByCanonicalPair.set(canonicalKey, []);
    }

    groupByCanonicalPair.get(canonicalKey).push({
      file: entry.file,
      persona: entry.doc.persona,
      directionKey,
      title: entry.doc.title,
    });

    if (!filesByPlannedOutput.has(plannedFile)) {
      filesByPlannedOutput.set(plannedFile, []);
    }

    filesByPlannedOutput.get(plannedFile).push({
      file: entry.file,
      title: entry.doc.title,
      persona: entry.doc.persona,
    });
  }

  for (const entriesForPair of groupByCanonicalPair.values()) {
    const directions = new Set(entriesForPair.map((entry) => entry.directionKey));
    if (directions.size > 1) {
      totalMirroredPairsFound += 1;
    }

    const personaGroups = new Map();
    for (const entry of entriesForPair) {
      if (!personaGroups.has(entry.persona)) {
        personaGroups.set(entry.persona, []);
      }
      personaGroups.get(entry.persona).push(entry);
    }

    for (const [persona, personaEntries] of personaGroups) {
      if (personaEntries.length > 1) {
        totalTrueDuplicatesFound += personaEntries.length - 1;
        manualReviewFlags.push(
          `${persona}: ${personaEntries.map((entry) => entry.title).join(" | ")}`
        );
      }
    }
  }

  const blockedFiles = new Set();
  for (const [plannedFile, plannedEntries] of filesByPlannedOutput) {
    if (plannedEntries.length < 2) continue;
    totalTrueDuplicatesFound += plannedEntries.length - 1;
    manualReviewFlags.push(
      `Collision on ${plannedFile}: ${plannedEntries
        .map((entry) => `${entry.title} (${entry.file})`)
        .join(" | ")}`
    );
    for (const entry of plannedEntries) {
      blockedFiles.add(entry.file);
    }
  }

  for (const entry of targetEntries) {
    const { file, filePath, doc } = entry;
    if (blockedFiles.has(file)) {
      continue;
    }

    const { xName, yName, suffix } = parsePairFromTitle(doc.title);
    const [canonicalX, canonicalY] = canonicalizePair(xName, yName);
    const pageWasNonCanonical = xName !== canonicalX || yName !== canonicalY;
    const newSlug = slugifyCompare(canonicalX, canonicalY, doc.persona);
    const newFile = `${newSlug}.json`;
    const newFilePath = path.join(PAGES_DIR, newFile);
    const winnerFlipped = pageWasNonCanonical && (doc.verdict?.winner === "x" || doc.verdict?.winner === "y");
    const relatedPagesResult = canonicalizeRelatedPages(doc);

    let nextDoc = {
      ...doc,
      related_pages: relatedPagesResult.items,
    };

    if (pageWasNonCanonical) {
      nextDoc = {
        ...nextDoc,
        title: `${canonicalX} vs ${canonicalY}${suffix}`,
        slug: newSlug,
        meta_description: replacePairText(
          nextDoc.meta_description,
          xName,
          yName,
          canonicalX,
          canonicalY
        ),
        verdict: {
          ...nextDoc.verdict,
          winner: flipWinner(nextDoc.verdict?.winner),
        },
        sections: Array.isArray(nextDoc.sections)
          ? nextDoc.sections.map((section) => {
              if (section.type === "x_wins" || section.type === "y_wins") {
                return {
                  ...section,
                  type: flipSectionType(section.type),
                };
              }

              if (section.type === "failure_modes") {
                return {
                  ...section,
                  items: section.items.map((item) => ({
                    ...item,
                    tool: flipFailureTool(item.tool),
                  })),
                };
              }

              return section;
            })
          : nextDoc.sections,
      };
    } else if (nextDoc.slug !== newSlug) {
      nextDoc = {
        ...nextDoc,
        slug: newSlug,
      };
    }

    const contentChanged =
      JSON.stringify(doc) !== JSON.stringify(nextDoc) || file !== newFile;

    if (!contentChanged) {
      continue;
    }

    fs.writeFileSync(newFilePath, `${JSON.stringify(nextDoc, null, 2)}\n`);

    if (newFilePath !== filePath && fs.existsSync(filePath)) {
      redirectsBySource.set(`/compare/${doc.slug}`, {
        source: `/compare/${doc.slug}`,
        destination: `/compare/${newSlug}`,
      });
      fs.unlinkSync(filePath);
    }

    changedPages.push({
      originalPair: `${xName} vs ${yName}`,
      canonicalPair: `${canonicalX} vs ${canonicalY}`,
      persona: doc.persona,
      winnerFlipped,
      slugPathChanged: file !== newFile,
      file,
      newFile,
    });
  }

  ensureDir(REPORTS_DIR);

  const report = {
    totalMirroredPairsFound,
    totalRowsRewritten: changedPages.length,
    totalTrueDuplicatesFound,
    totalManualReviewFlags: manualReviewFlags.length,
    categorySlug: TARGET_CATEGORY,
    changedPages,
    removedEntries,
    manualReviewFlags,
  };

  fs.writeFileSync(REPORT_PATH, buildReport(report));
  saveRedirects(
    Array.from(redirectsBySource.values())
      .filter((redirect) => !activePageSlugs.has(redirect.source))
      .sort((a, b) => a.source.localeCompare(b.source))
  );

  console.log(JSON.stringify(report, null, 2));
}

main();
