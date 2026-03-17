/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "related-comparisons-repair-report.md");

function toSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifyCompare(xName, yName, persona) {
  return `${toSlug(xName)}-vs-${toSlug(yName)}-for-${toSlug(persona)}`;
}

function canonicalizePair(xName, yName) {
  return [String(xName || "").trim(), String(yName || "").trim()].sort((a, b) =>
    toSlug(a).localeCompare(toSlug(b))
  );
}

function loadPageEntries() {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const filePath = path.join(PAGES_DIR, file);
      const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return { file, filePath, doc };
    });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatTitle(xName, yName, persona) {
  return `${xName} vs ${yName} for ${persona}`;
}

function formatComparePath(slug) {
  return `/compare/${slug}`;
}

function entriesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function buildReport(report) {
  const lines = [
    "# Related Comparisons Repair Report",
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total pages scanned: ${report.totalPagesScanned}`,
    `- Total related comparison references updated: ${report.totalReferencesUpdated}`,
    `- Total mirrored related references removed: ${report.totalMirroredReferencesRemoved}`,
    `- Total broken or unresolved references found: ${report.totalBrokenOrUnresolvedReferencesFound}`,
    `- Entries flagged for manual review: ${report.manualReview.length}`,
    "",
    "## Changed References",
    "",
  ];

  if (report.changedReferences.length === 0) {
    lines.push("- None");
  } else {
    for (const change of report.changedReferences) {
      lines.push(`- Source page: ${change.sourcePage}`);
      lines.push(`  Old related title: ${change.oldTitle}`);
      lines.push(`  New related title: ${change.newTitle}`);
      lines.push(`  Old slug/path: ${change.oldPath}`);
      lines.push(`  New slug/path: ${change.newPath}`);
    }
  }

  lines.push("", "## Removed Mirrored Duplicates", "");

  if (report.removedReferences.length === 0) {
    lines.push("- None");
  } else {
    for (const removed of report.removedReferences) {
      lines.push(`- Source page: ${removed.sourcePage}`);
      lines.push(`  Removed title: ${removed.oldTitle}`);
      lines.push(`  Removed slug/path: ${removed.oldPath}`);
      lines.push(`  Kept canonical title: ${removed.keptTitle}`);
      lines.push(`  Kept canonical slug/path: ${removed.keptPath}`);
    }
  }

  lines.push("", "## Broken Or Unresolved References", "");

  if (report.unresolvedReferences.length === 0) {
    lines.push("- None");
  } else {
    for (const unresolved of report.unresolvedReferences) {
      lines.push(`- Source page: ${unresolved.sourcePage}`);
      lines.push(`  Related title: ${unresolved.title}`);
      lines.push(`  Related slug/path: ${unresolved.path}`);
      lines.push(`  Issue: ${unresolved.issue}`);
    }
  }

  lines.push("", "## Manual Review", "");

  if (report.manualReview.length === 0) {
    lines.push("- None");
  } else {
    for (const item of report.manualReview) {
      lines.push(`- ${item}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const pageEntries = loadPageEntries();
  const existingSlugs = new Set(pageEntries.map(({ doc }) => doc.slug).filter(Boolean));

  const report = {
    totalPagesScanned: pageEntries.length,
    totalReferencesUpdated: 0,
    totalMirroredReferencesRemoved: 0,
    totalBrokenOrUnresolvedReferencesFound: 0,
    changedReferences: [],
    removedReferences: [],
    unresolvedReferences: [],
    manualReview: [],
  };

  for (const { filePath, doc } of pageEntries) {
    const sourcePage = formatComparePath(doc.slug);

    if (!Array.isArray(doc.related_pages)) {
      report.manualReview.push(`${sourcePage}: related_pages is missing or not an array`);
      continue;
    }

    const seenCanonicalTargets = new Map();
    const nextRelatedPages = [];

    for (let index = 0; index < doc.related_pages.length; index += 1) {
      const item = doc.related_pages[index];
      const rawX = typeof item?.x_name === "string" ? item.x_name.trim() : "";
      const rawY = typeof item?.y_name === "string" ? item.y_name.trim() : "";
      const persona = typeof item?.persona === "string" ? item.persona.trim() : "";

      if (!rawX || !rawY || !persona) {
        report.totalBrokenOrUnresolvedReferencesFound += 1;
        report.unresolvedReferences.push({
          sourcePage,
          title: formatTitle(rawX || "[missing x_name]", rawY || "[missing y_name]", persona || "[missing persona]"),
          path: formatComparePath(slugifyCompare(rawX || "missing-x-name", rawY || "missing-y-name", persona || "missing-persona")),
          issue: `Malformed related_pages entry at index ${index}`,
        });
        report.manualReview.push(
          `${sourcePage}: malformed related_pages entry at index ${index}`
        );
        nextRelatedPages.push(item);
        continue;
      }

      const [canonicalX, canonicalY] = canonicalizePair(rawX, rawY);
      const oldSlug = slugifyCompare(rawX, rawY, persona);
      const newSlug = slugifyCompare(canonicalX, canonicalY, persona);
      const oldTitle = formatTitle(rawX, rawY, persona);
      const newTitle = formatTitle(canonicalX, canonicalY, persona);
      const dedupeKey = newSlug;

      if (seenCanonicalTargets.has(dedupeKey)) {
        report.totalMirroredReferencesRemoved += 1;
        report.removedReferences.push({
          sourcePage,
          oldTitle,
          oldPath: formatComparePath(oldSlug),
          keptTitle: seenCanonicalTargets.get(dedupeKey).title,
          keptPath: seenCanonicalTargets.get(dedupeKey).path,
        });
        continue;
      }

      const nextItem = {
        ...item,
        x_name: canonicalX,
        y_name: canonicalY,
        persona,
      };

      if (oldTitle !== newTitle || oldSlug !== newSlug) {
        report.totalReferencesUpdated += 1;
        report.changedReferences.push({
          sourcePage,
          oldTitle,
          newTitle,
          oldPath: formatComparePath(oldSlug),
          newPath: formatComparePath(newSlug),
        });
      }

      if (!existingSlugs.has(newSlug)) {
        report.totalBrokenOrUnresolvedReferencesFound += 1;
        report.unresolvedReferences.push({
          sourcePage,
          title: newTitle,
          path: formatComparePath(newSlug),
          issue: "Canonical target page does not exist",
        });
        report.manualReview.push(
          `${sourcePage}: unresolved canonical target ${formatComparePath(newSlug)}`
        );
      }

      seenCanonicalTargets.set(dedupeKey, {
        title: newTitle,
        path: formatComparePath(newSlug),
      });
      nextRelatedPages.push(nextItem);
    }

    if (!entriesEqual(doc.related_pages, nextRelatedPages)) {
      const nextDoc = {
        ...doc,
        related_pages: nextRelatedPages,
      };
      fs.writeFileSync(filePath, `${JSON.stringify(nextDoc, null, 2)}\n`);
    }
  }

  ensureDir(REPORTS_DIR);
  fs.writeFileSync(REPORT_PATH, buildReport(report));
  console.log(JSON.stringify(report, null, 2));
}

main();
