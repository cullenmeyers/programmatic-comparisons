/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(
  REPORTS_DIR,
  "related-comparisons-prune-report.md"
);
const BACKLOG_PATH = path.join(
  REPORTS_DIR,
  "related-comparisons-backlog-report.md"
);

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

function loadPageEntries() {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const filePath = path.join(PAGES_DIR, file);
      const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return { filePath, doc };
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

function buildPruneReport(report) {
  const lines = [
    "# Related Comparisons Prune Report",
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total pages scanned: ${report.totalPagesScanned}`,
    `- Total related_pages entries checked: ${report.totalEntriesChecked}`,
    `- Total valid entries preserved: ${report.totalValidEntriesPreserved}`,
    `- Total unresolved entries removed: ${report.totalUnresolvedEntriesRemoved}`,
    `- Total pages affected: ${report.totalPagesAffected}`,
    "",
    "## Removed Entries",
    "",
  ];

  if (report.removedEntries.length === 0) {
    lines.push("- None");
  } else {
    for (const entry of report.removedEntries) {
      lines.push(`- Source page: ${entry.sourcePage}`);
      lines.push(`  Related comparison title: ${entry.relatedTitle}`);
      lines.push(`  Expected target slug/path: ${entry.targetPath}`);
      lines.push(`  Reason removed: missing target page`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function buildBacklogReport(report) {
  const lines = [
    "# Related Comparisons Backlog Report",
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    "Removed unresolved related comparison references for possible future page creation.",
    "",
    "## Backlog Entries",
    "",
  ];

  if (report.removedEntries.length === 0) {
    lines.push("- None");
  } else {
    for (const entry of report.removedEntries) {
      lines.push(`- Source page: ${entry.sourcePage}`);
      lines.push(`  Related comparison title: ${entry.relatedTitle}`);
      lines.push(`  Expected target slug/path: ${entry.targetPath}`);
      lines.push(`  Reason removed: missing target page`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const pageEntries = loadPageEntries();
  const existingSlugs = new Set(pageEntries.map(({ doc }) => doc.slug).filter(Boolean));

  const report = {
    totalPagesScanned: pageEntries.length,
    totalEntriesChecked: 0,
    totalValidEntriesPreserved: 0,
    totalUnresolvedEntriesRemoved: 0,
    totalPagesAffected: 0,
    removedEntries: [],
  };

  for (const { filePath, doc } of pageEntries) {
    if (!Array.isArray(doc.related_pages)) {
      continue;
    }

    const sourcePage = formatComparePath(doc.slug);
    const nextRelatedPages = [];
    let pageChanged = false;

    for (const item of doc.related_pages) {
      report.totalEntriesChecked += 1;

      const xName = typeof item?.x_name === "string" ? item.x_name.trim() : "";
      const yName = typeof item?.y_name === "string" ? item.y_name.trim() : "";
      const persona = typeof item?.persona === "string" ? item.persona.trim() : "";
      const targetSlug = slugifyCompare(xName, yName, persona);

      if (xName && yName && persona && existingSlugs.has(targetSlug)) {
        report.totalValidEntriesPreserved += 1;
        nextRelatedPages.push(item);
        continue;
      }

      pageChanged = true;
      report.totalUnresolvedEntriesRemoved += 1;
      report.removedEntries.push({
        sourcePage,
        relatedTitle: formatTitle(
          xName || "[missing x_name]",
          yName || "[missing y_name]",
          persona || "[missing persona]"
        ),
        targetPath: formatComparePath(
          slugifyCompare(
            xName || "missing-x-name",
            yName || "missing-y-name",
            persona || "missing-persona"
          )
        ),
      });
    }

    if (pageChanged && !entriesEqual(doc.related_pages, nextRelatedPages)) {
      report.totalPagesAffected += 1;
      const nextDoc = {
        ...doc,
        related_pages: nextRelatedPages,
      };
      fs.writeFileSync(filePath, `${JSON.stringify(nextDoc, null, 2)}\n`);
    }
  }

  ensureDir(REPORTS_DIR);
  fs.writeFileSync(REPORT_PATH, buildPruneReport(report));
  fs.writeFileSync(BACKLOG_PATH, buildBacklogReport(report));
  console.log(JSON.stringify(report, null, 2));
}

main();
