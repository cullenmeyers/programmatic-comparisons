/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "related-comparisons-rebuild-report.md");
const MAX_RELATED = 6;
const DEBUG_SAMPLE_LIMIT = 5;

function toSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalizePair(left, right) {
  return [String(left || "").trim(), String(right || "").trim()].sort((a, b) =>
    toSlug(a).localeCompare(toSlug(b))
  );
}

function parseTitle(title) {
  const [pairPart = "", ...rest] = String(title || "").split(" for ");
  const [rawLeft = "", rawRight = ""] = pairPart.split(" vs ");
  const [toolA, toolB] = canonicalizePair(rawLeft, rawRight);

  return {
    rawLeft: rawLeft.trim(),
    rawRight: rawRight.trim(),
    toolA,
    toolB,
    persona: rest.join(" for ").trim(),
  };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatComparePath(slug) {
  return `/compare/${slug}`;
}

function buildRelatedEntry(doc, toolA, toolB) {
  return {
    title: doc.title,
    slug: doc.slug,
    exists: true,
    x_name: toolA,
    y_name: toolB,
    persona: doc.persona,
  };
}

function entriesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function loadPageEntries() {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const filePath = path.join(PAGES_DIR, file);
      const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const parsed = parseTitle(doc.title);

      return {
        file,
        filePath,
        doc,
        rawXName: parsed.rawLeft,
        rawYName: parsed.rawRight,
        toolA: parsed.toolA,
        toolB: parsed.toolB,
        categorySlug: String(doc.categorySlug || "").trim(),
        persona: String(doc.persona || parsed.persona || "").trim(),
        sourcePath: formatComparePath(doc.slug),
      };
    });
}

function compareStrings(a, b) {
  return String(a).localeCompare(String(b));
}

function pushUnique(target, seen, candidate) {
  if (!candidate || seen.has(candidate.doc.slug)) {
    return false;
  }

  target.push(candidate);
  seen.add(candidate.doc.slug);
  return true;
}

function getWinnerTool(entry) {
  if (entry.doc.verdict?.winner === "x") {
    return entry.rawXName || entry.toolA;
  }
  if (entry.doc.verdict?.winner === "y") {
    return entry.rawYName || entry.toolB;
  }
  return null;
}

function getLoserTool(entry) {
  if (entry.doc.verdict?.winner === "x") {
    return entry.rawYName || entry.toolB;
  }
  if (entry.doc.verdict?.winner === "y") {
    return entry.rawXName || entry.toolA;
  }
  return null;
}

function buildCandidate(entry, source, toolFrequency) {
  const tools = [entry.toolA, entry.toolB];
  const sharesSourceA = tools.includes(source.toolA);
  const sharesSourceB = tools.includes(source.toolB);
  const sharedToolCount = Number(sharesSourceA) + Number(sharesSourceB);
  const winningTool = getWinnerTool(source);
  const losingTool = getLoserTool(source);
  const sharedWinningTool = Boolean(winningTool && tools.includes(winningTool));
  const sharedLosingTool = Boolean(losingTool && tools.includes(losingTool));
  const otherTools = tools.filter(
    (tool) => tool !== source.toolA && tool !== source.toolB
  );
  const secondaryToolFrequency = otherTools.reduce(
    (max, tool) => Math.max(max, toolFrequency.get(tool) || 0),
    0
  );
  const totalToolFrequency = tools.reduce(
    (sum, tool) => sum + (toolFrequency.get(tool) || 0),
    0
  );

  return {
    entry,
    doc: entry.doc,
    toolA: entry.toolA,
    toolB: entry.toolB,
    sharedToolCount,
    sharesSourceA,
    sharesSourceB,
    sharedWinningTool,
    sharedLosingTool,
    secondaryToolFrequency,
    totalToolFrequency,
    title: entry.doc.title,
    slug: entry.doc.slug,
  };
}

function compareBucketACandidates(a, b) {
  if (a.secondaryToolFrequency !== b.secondaryToolFrequency) {
    return b.secondaryToolFrequency - a.secondaryToolFrequency;
  }

  if (a.totalToolFrequency !== b.totalToolFrequency) {
    return b.totalToolFrequency - a.totalToolFrequency;
  }

  const titleResult = compareStrings(a.title, b.title);
  if (titleResult !== 0) {
    return titleResult;
  }

  return compareStrings(a.slug, b.slug);
}

function compareBucketBCandidates(a, b) {
  if (a.totalToolFrequency !== b.totalToolFrequency) {
    return b.totalToolFrequency - a.totalToolFrequency;
  }

  if (a.secondaryToolFrequency !== b.secondaryToolFrequency) {
    return b.secondaryToolFrequency - a.secondaryToolFrequency;
  }

  const titleResult = compareStrings(a.title, b.title);
  if (titleResult !== 0) {
    return titleResult;
  }

  return compareStrings(a.slug, b.slug);
}

function selectBucketA(source, bucketA) {
  const winnerTool = getWinnerTool(source);
  const loserTool = getLoserTool(source);
  const seen = new Set();

  const winnerCandidates = bucketA
    .filter((candidate) => winnerTool && [candidate.toolA, candidate.toolB].includes(winnerTool))
    .sort(compareBucketACandidates);
  const loserCandidates = bucketA
    .filter((candidate) => loserTool && [candidate.toolA, candidate.toolB].includes(loserTool))
    .sort(compareBucketACandidates);

  const selected = [];

  if (winnerCandidates.length > 0 && loserCandidates.length > 0) {
    const maxPairs = Math.min(
      Math.min(winnerCandidates.length, loserCandidates.length),
      Math.floor(MAX_RELATED / 2)
    );

    for (let index = 0; index < maxPairs && selected.length < MAX_RELATED; index += 1) {
      pushUnique(selected, seen, winnerCandidates[index]);
      if (selected.length < MAX_RELATED) {
        pushUnique(selected, seen, loserCandidates[index]);
      }
    }
  }

  const remainingWinner = winnerCandidates.filter((candidate) => !seen.has(candidate.doc.slug));
  const remainingLoser = loserCandidates.filter((candidate) => !seen.has(candidate.doc.slug));

  for (const candidate of remainingWinner) {
    if (selected.length >= MAX_RELATED) {
      break;
    }
    pushUnique(selected, seen, candidate);
  }

  for (const candidate of remainingLoser) {
    if (selected.length >= MAX_RELATED) {
      break;
    }
    pushUnique(selected, seen, candidate);
  }

  const neutralCandidates = bucketA
    .filter((candidate) => !seen.has(candidate.doc.slug))
    .sort(compareBucketACandidates);

  for (const candidate of neutralCandidates) {
    if (selected.length >= MAX_RELATED) {
      break;
    }
    pushUnique(selected, seen, candidate);
  }

  return selected;
}

function buildReason(candidate, source) {
  const reasons = [];

  if (candidate.sharedToolCount === 1) {
    const sharedTool = candidate.sharesSourceA ? source.toolA : source.toolB;
    reasons.push(`shares exactly one source tool (${sharedTool})`);
  }

  if (candidate.sharedWinningTool) {
    reasons.push(`matches the winning tool (${getWinnerTool(source)})`);
  }

  if (candidate.sharedLosingTool) {
    reasons.push(`matches the losing tool (${getLoserTool(source)})`);
  }

  if (reasons.length === 0) {
    reasons.push("same category and persona fallback");
  }

  reasons.push(`secondary tool frequency ${candidate.secondaryToolFrequency}`);
  return reasons.join("; ");
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
    `- Average related_pages count: ${report.averageRelatedCount.toFixed(2)}`,
    `- Pages with 0 related pages: ${report.zeroRelatedPages.length}`,
    `- Pages with 1 related page: ${report.oneRelatedPage.length}`,
    `- Pages with fewer than 3 related pages: ${report.fewerThanThreeRelatedPages.length}`,
    "",
    "## Sparse Pages",
    "",
  ];

  const sparseSections = [
    ["Pages with 0 related pages", report.zeroRelatedPages],
    ["Pages with 1 related page", report.oneRelatedPage],
    ["Pages with fewer than 3 related pages", report.fewerThanThreeRelatedPages],
  ];

  for (const [heading, pages] of sparseSections) {
    lines.push(`### ${heading}`, "");
    if (pages.length === 0) {
      lines.push("- None", "");
      continue;
    }

    for (const page of pages) {
      lines.push(`- ${page}`);
    }
    lines.push("");
  }

  lines.push("## Sample Debug Output", "");

  if (report.debugSamples.length === 0) {
    lines.push("- None");
  } else {
    for (const sample of report.debugSamples) {
      lines.push(`### ${sample.sourcePage}`, "");
      lines.push(`- Selected related_pages: ${sample.selected.length}`);

      if (sample.selected.length === 0) {
        lines.push("- No valid published related pages in the same category and persona.");
      } else {
        for (const item of sample.selected) {
          lines.push(`- ${item.title} (${formatComparePath(item.slug)})`);
          lines.push(`  Why ranked highly: ${item.reason}`);
        }
      }

      lines.push("");
    }
  }

  lines.push("## Rerun", "");
  lines.push("- Run `npm run rebuild:related` after adding or publishing new comparison pages.");
  lines.push("- The script only rebuilds `related_pages` from existing published page data and is safe to rerun.");

  return `${lines.join("\n")}\n`;
}

function main() {
  const pageEntries = loadPageEntries();
  const groupedEntries = new Map();
  const canonicalEntries = new Map();

  for (const entry of pageEntries) {
    const canonicalKey = [
      entry.categorySlug,
      entry.persona,
      entry.toolA,
      entry.toolB,
    ].join("::");
    const existingCanonical = canonicalEntries.get(canonicalKey);

    if (!existingCanonical || compareStrings(entry.doc.slug, existingCanonical.doc.slug) < 0) {
      canonicalEntries.set(canonicalKey, entry);
    }
  }

  for (const entry of canonicalEntries.values()) {
    const groupKey = `${entry.categorySlug}::${entry.persona}`;
    if (!groupedEntries.has(groupKey)) {
      groupedEntries.set(groupKey, []);
    }
    groupedEntries.get(groupKey).push(entry);
  }

  for (const entries of groupedEntries.values()) {
    entries.sort(
      (a, b) => compareStrings(a.doc.title, b.doc.title) || compareStrings(a.doc.slug, b.doc.slug)
    );
  }

  const report = {
    totalPagesScanned: pageEntries.length,
    totalPagesUpdated: 0,
    averageRelatedCount: 0,
    zeroRelatedPages: [],
    oneRelatedPage: [],
    fewerThanThreeRelatedPages: [],
    debugSamples: [],
  };

  let totalRelatedCount = 0;

  for (const entry of pageEntries) {
    const groupKey = `${entry.categorySlug}::${entry.persona}`;
    const group = groupedEntries.get(groupKey) || [];
    const toolFrequency = new Map();

    for (const groupEntry of group) {
      toolFrequency.set(groupEntry.toolA, (toolFrequency.get(groupEntry.toolA) || 0) + 1);
      toolFrequency.set(groupEntry.toolB, (toolFrequency.get(groupEntry.toolB) || 0) + 1);
    }

    const candidateMap = new Map();

    for (const candidateEntry of group) {
      if (candidateEntry.doc.slug === entry.doc.slug) {
        continue;
      }

      const samePair =
        candidateEntry.toolA === entry.toolA && candidateEntry.toolB === entry.toolB;

      if (samePair) {
        continue;
      }

      candidateMap.set(
        candidateEntry.doc.slug,
        buildCandidate(candidateEntry, entry, toolFrequency)
      );
    }

    const candidates = Array.from(candidateMap.values());
    const bucketA = candidates.filter((candidate) => candidate.sharedToolCount === 1);
    const bucketB = candidates
      .filter((candidate) => candidate.sharedToolCount === 0)
      .sort(compareBucketBCandidates);

    const selectedCandidates = selectBucketA(entry, bucketA);

    for (const candidate of bucketB) {
      if (selectedCandidates.length >= MAX_RELATED) {
        break;
      }
      selectedCandidates.push(candidate);
    }

    const finalCandidates = selectedCandidates.slice(0, MAX_RELATED);
    const nextRelatedPages = finalCandidates.map((candidate) =>
      buildRelatedEntry(candidate.doc, candidate.toolA, candidate.toolB)
    );

    totalRelatedCount += nextRelatedPages.length;

    if (nextRelatedPages.length === 0) {
      report.zeroRelatedPages.push(entry.sourcePath);
    }
    if (nextRelatedPages.length === 1) {
      report.oneRelatedPage.push(entry.sourcePath);
    }
    if (nextRelatedPages.length < 3) {
      report.fewerThanThreeRelatedPages.push(entry.sourcePath);
    }

    if (!entriesEqual(entry.doc.related_pages, nextRelatedPages)) {
      const nextDoc = {
        ...entry.doc,
        related_pages: nextRelatedPages,
      };
      fs.writeFileSync(entry.filePath, `${JSON.stringify(nextDoc, null, 2)}\n`);
      report.totalPagesUpdated += 1;
    }

    if (report.debugSamples.length < DEBUG_SAMPLE_LIMIT) {
      report.debugSamples.push({
        sourcePage: entry.sourcePath,
        selected: finalCandidates.map((candidate) => ({
          title: candidate.doc.title,
          slug: candidate.doc.slug,
          reason: buildReason(candidate, entry),
        })),
      });
    }
  }

  report.averageRelatedCount =
    report.totalPagesScanned === 0 ? 0 : totalRelatedCount / report.totalPagesScanned;

  ensureDir(REPORTS_DIR);
  fs.writeFileSync(REPORT_PATH, buildReport(report));
  console.log(JSON.stringify(report, null, 2));
}

main();
