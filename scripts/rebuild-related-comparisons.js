/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "related-comparisons-rebuild-report.md");
const MAX_RELATED = 6;

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

function buildTitle(xName, yName, persona) {
  return `${xName} vs ${yName} for ${persona}`;
}

function parsePairFromTitle(title) {
  const [pairPart = "", ...rest] = String(title || "").split(" for ");
  const [xName = "", yName = ""] = pairPart.split(" vs ");

  return {
    xName: xName.trim(),
    yName: yName.trim(),
    persona: rest.join(" for ").trim(),
  };
}

function parseRelatedItem(raw) {
  const titleBits = parsePairFromTitle(String(raw?.title || ""));
  const xName = String(raw?.x_name || titleBits.xName || "").trim();
  const yName = String(raw?.y_name || titleBits.yName || "").trim();
  const persona = String(raw?.persona || titleBits.persona || "").trim();

  if (!xName || !yName || !persona) {
    return null;
  }

  const [canonicalX, canonicalY] = canonicalizePair(xName, yName);
  const slug =
    String(raw?.slug || "").trim() ||
    slugifyCompare(canonicalX, canonicalY, persona);

  return {
    x_name: canonicalX,
    y_name: canonicalY,
    persona,
    slug,
    title: buildTitle(canonicalX, canonicalY, persona),
    exists: typeof raw?.exists === "boolean" ? raw.exists : false,
  };
}

function loadPageEntries() {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const filePath = path.join(PAGES_DIR, file);
      const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const { xName, yName } = parsePairFromTitle(doc.title);

      return {
        filePath,
        doc,
        xName,
        yName,
      };
    });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function entriesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatComparePath(slug) {
  return `/compare/${slug}`;
}

function buildCandidate(xName, yName, persona, exists) {
  const [canonicalX, canonicalY] = canonicalizePair(xName, yName);
  const slug = slugifyCompare(canonicalX, canonicalY, persona);

  return {
    title: buildTitle(canonicalX, canonicalY, persona),
    slug,
    exists,
    x_name: canonicalX,
    y_name: canonicalY,
    persona,
  };
}

function sharedSourceToolCount(candidate, sourceX, sourceY) {
  let count = 0;
  if (candidate.x_name === sourceX || candidate.y_name === sourceX) count += 1;
  if (candidate.x_name === sourceY || candidate.y_name === sourceY) count += 1;
  return count;
}

function buildReport(report) {
  const lines = [
    "# Related Comparisons Rebuild Report",
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total pages scanned: ${report.totalPagesScanned}`,
    `- Total pages updated: ${report.totalPagesUpdated}`,
    `- Total existing related comparisons preserved: ${report.totalExistingRelatedComparisonsPreserved}`,
    `- Total unpublished related comparisons added: ${report.totalUnpublishedRelatedComparisonsAdded}`,
    `- Total mirrored duplicates removed: ${report.totalMirroredDuplicatesRemoved}`,
    `- Total pages that still have fewer than 6 valid related comparisons after the pass: ${report.totalPagesUnderfilled}`,
    "",
    "## Updated Pages",
    "",
  ];

  if (report.updatedPages.length === 0) {
    lines.push("- None");
  } else {
    for (const page of report.updatedPages) {
      lines.push(`- Source page: ${page.sourcePage}`);
      lines.push(`  Total related_pages after update: ${page.totalRelatedPages}`);
      lines.push(`  exist=true: ${page.existsTrue}`);
      lines.push(`  exist=false: ${page.existsFalse}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const pageEntries = loadPageEntries();
  const bySlug = new Map(pageEntries.map((entry) => [entry.doc.slug, entry]));
  const groups = new Map();

  for (const entry of pageEntries) {
    const groupKey = `${entry.doc.categorySlug}::${entry.doc.persona}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        entries: [],
        tools: new Set(),
        toolDegree: new Map(),
      });
    }

    const group = groups.get(groupKey);
    group.entries.push(entry);
    group.tools.add(entry.xName);
    group.tools.add(entry.yName);
    group.toolDegree.set(entry.xName, (group.toolDegree.get(entry.xName) || 0) + 1);
    group.toolDegree.set(entry.yName, (group.toolDegree.get(entry.yName) || 0) + 1);
  }

  const report = {
    totalPagesScanned: pageEntries.length,
    totalPagesUpdated: 0,
    totalExistingRelatedComparisonsPreserved: 0,
    totalUnpublishedRelatedComparisonsAdded: 0,
    totalMirroredDuplicatesRemoved: 0,
    totalPagesUnderfilled: 0,
    updatedPages: [],
  };

  for (const entry of pageEntries) {
    const { doc, filePath, xName, yName } = entry;
    const sourceSlug = doc.slug;
    const sourcePage = formatComparePath(sourceSlug);
    const groupKey = `${doc.categorySlug}::${doc.persona}`;
    const group = groups.get(groupKey);
    const seenCurrent = new Set();
    const preservedCurrent = [];

    for (const rawItem of Array.isArray(doc.related_pages) ? doc.related_pages : []) {
      const item = parseRelatedItem(rawItem);
      if (!item) {
        continue;
      }

      if (item.slug === sourceSlug) {
        continue;
      }

      if (seenCurrent.has(item.slug)) {
        report.totalMirroredDuplicatesRemoved += 1;
        continue;
      }
      seenCurrent.add(item.slug);

      if (item.persona !== doc.persona) {
        continue;
      }

      const target = bySlug.get(item.slug);
      if (target) {
        if (target.doc.categorySlug !== doc.categorySlug || target.doc.persona !== doc.persona) {
          continue;
        }
        item.exists = true;
      } else {
        item.exists = false;
        const usesKnownTools =
          group.tools.has(item.x_name) && group.tools.has(item.y_name);
        const sharesSourceTool = sharedSourceToolCount(item, xName, yName) > 0;

        if (!usesKnownTools || !sharesSourceTool) {
          continue;
        }
      }

      preservedCurrent.push(item);
    }

    const selected = [];
    const selectedSlugs = new Set();

    const pushIfRoom = (candidate, options = {}) => {
      if (!candidate || selected.length >= MAX_RELATED) return false;
      if (candidate.slug === sourceSlug || selectedSlugs.has(candidate.slug)) return false;

      selected.push(candidate);
      selectedSlugs.add(candidate.slug);

      if (options.preservedExisting) {
        report.totalExistingRelatedComparisonsPreserved += 1;
      }
      if (options.addedUnpublished) {
        report.totalUnpublishedRelatedComparisonsAdded += 1;
      }

      return true;
    };

    for (const candidate of preservedCurrent) {
      pushIfRoom(candidate, { preservedExisting: candidate.exists });
    }

    const toolList = Array.from(group.tools).sort((a, b) => toSlug(a).localeCompare(toSlug(b)));
    const xCandidates = [];
    const yCandidates = [];

    for (const toolName of toolList) {
      if (toolName === xName || toolName === yName) continue;

      const xCandidate = buildCandidate(xName, toolName, doc.persona, false);
      const yCandidate = buildCandidate(yName, toolName, doc.persona, false);

      xCandidate.exists = bySlug.has(xCandidate.slug);
      yCandidate.exists = bySlug.has(yCandidate.slug);

      xCandidates.push(xCandidate);
      yCandidates.push(yCandidate);
    }

    const rankCandidates = (candidates, sourceTool) =>
      candidates.sort((a, b) => {
        if (a.exists !== b.exists) return a.exists ? -1 : 1;

        const aOtherTool = a.x_name === sourceTool ? a.y_name : a.x_name;
        const bOtherTool = b.x_name === sourceTool ? b.y_name : b.x_name;
        const aDegree = group.toolDegree.get(aOtherTool) || 0;
        const bDegree = group.toolDegree.get(bOtherTool) || 0;

        if (aDegree !== bDegree) return bDegree - aDegree;
        return a.title.localeCompare(b.title);
      });

    rankCandidates(xCandidates, xName);
    rankCandidates(yCandidates, yName);

    const xExisting = xCandidates.filter((candidate) => candidate.exists);
    const yExisting = yCandidates.filter((candidate) => candidate.exists);
    const xUnpublished = xCandidates.filter((candidate) => !candidate.exists);
    const yUnpublished = yCandidates.filter((candidate) => !candidate.exists);

    const mergeAlternating = (left, right, options = {}) => {
      let index = 0;
      while (selected.length < MAX_RELATED && (index < left.length || index < right.length)) {
        if (index < left.length) {
          pushIfRoom(left[index], options);
        }
        if (index < right.length) {
          pushIfRoom(right[index], options);
        }
        index += 1;
      }
    };

    mergeAlternating(xExisting, yExisting);
    mergeAlternating(xUnpublished, yUnpublished, { addedUnpublished: true });

    const nextRelatedPages = selected.slice(0, MAX_RELATED);

    if (nextRelatedPages.length < MAX_RELATED) {
      report.totalPagesUnderfilled += 1;
    }

    if (!entriesEqual(doc.related_pages, nextRelatedPages)) {
      report.totalPagesUpdated += 1;
      const nextDoc = {
        ...doc,
        related_pages: nextRelatedPages,
      };
      fs.writeFileSync(filePath, `${JSON.stringify(nextDoc, null, 2)}\n`);
      report.updatedPages.push({
        sourcePage,
        totalRelatedPages: nextRelatedPages.length,
        existsTrue: nextRelatedPages.filter((item) => item.exists).length,
        existsFalse: nextRelatedPages.filter((item) => !item.exists).length,
      });
    }
  }

  ensureDir(REPORTS_DIR);
  fs.writeFileSync(REPORT_PATH, buildReport(report));
  console.log(JSON.stringify(report, null, 2));
}

main();
