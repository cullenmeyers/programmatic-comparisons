/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const SNAPSHOT_PATH = path.join(ROOT, "scripts", "all-pages-head-snapshot.json");
const REPORT_PATH = path.join(ROOT, "reports", "category-consistency-restore-report.md");
const SNAPSHOT = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8").replace(/^\uFEFF/, ""));

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, doc) {
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`);
}

function main() {
  const changedPages = [];
  let totalScanned = 0;
  let restoredFromHead = 0;
  let relatedPagesReset = 0;

  for (const file of fs.readdirSync(PAGES_DIR).filter((name) => name.endsWith(".json"))) {
    const filePath = path.join(PAGES_DIR, file);
    const doc = readJson(filePath);
    totalScanned += 1;

    if (doc.categorySlug === "project-management-tools") {
      const nextDoc = { ...doc, related_pages: [] };
      if (JSON.stringify(nextDoc) !== JSON.stringify(doc)) {
        writeJson(filePath, nextDoc);
        relatedPagesReset += 1;
      }
      continue;
    }

    const source = SNAPSHOT[file];
    if (!source) continue;

    const nextDoc = {
      ...doc,
      constraint_lens: source.constraint_lens,
      one_second_verdict: source.one_second_verdict,
      verdict: {
        ...doc.verdict,
        summary: source.verdict?.summary,
      },
      sections: source.sections,
      faqs: source.faqs,
      meta_description: source.meta_description,
      related_pages: [],
    };

    if (JSON.stringify(nextDoc) !== JSON.stringify(doc)) {
      writeJson(filePath, nextDoc);
      restoredFromHead += 1;
      if (Array.isArray(doc.related_pages) && doc.related_pages.length > 0) relatedPagesReset += 1;
      changedPages.push({
        filePath: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        title: nextDoc.title,
        fields: [
          "constraint_lens",
          "one_second_verdict",
          "verdict.summary",
          "sections",
          "faqs",
          "meta_description",
          "related_pages",
        ],
        reason: "restored category-specific content from HEAD to remove cross-category fallback language and invalid generic mechanisms",
      });
    }
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const lines = [
    "# Category Consistency Restore Report",
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total pages scanned: ${totalScanned}`,
    `- Total pages restored from HEAD: ${restoredFromHead}`,
    `- Total project-management pages left as-is except related_pages cleanup: 25`,
    `- Total pages with related_pages reset to []: ${relatedPagesReset}`,
    "",
    "## Changed Pages",
    "",
  ];

  for (const page of changedPages) {
    lines.push(`- File path: ${page.filePath}`);
    lines.push(`  Title: ${page.title}`);
    lines.push(`  Fields changed: ${page.fields.join(", ")}`);
    lines.push(`  Reason: ${page.reason}`);
  }

  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`);
  console.log(JSON.stringify({
    reportPath: REPORT_PATH,
    totalScanned,
    restoredFromHead,
    relatedPagesReset,
    changedPages: changedPages.length,
  }, null, 2));
}

main();
