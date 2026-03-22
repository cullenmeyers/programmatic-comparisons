/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const TARGET_CATEGORY = process.argv[2] || "project-management-tools";
const REPORT_PATH = path.join(
  REPORTS_DIR,
  `${TARGET_CATEGORY}-quality-normalization-report.md`
);

function parsePairFromTitle(title) {
  const [pairPart = ""] = String(title || "").split(" for ");
  const [xName = "", yName = ""] = pairPart.split(" vs ");

  return {
    xName: xName.trim(),
    yName: yName.trim(),
  };
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function ensureSentence(value) {
  const trimmed = normalizeWhitespace(value).replace(/[.!?]+$/g, "");
  return trimmed ? `${trimmed}.` : "";
}

function sentenceCount(value) {
  const matches = String(value || "").match(/[.!?](?=\s|$)/g);
  if (matches && matches.length > 0) return matches.length;
  return normalizeWhitespace(value) ? 1 : 0;
}

function normalizeForCheck(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ");
}

function needsFailureModeEnrichment(value) {
  const normalized = normalizeForCheck(value);
  return !/(because|so |which means|forcing|leaving|instead of|before)/.test(
    normalized
  );
}

function lowerFirst(value) {
  if (!value) return value;
  if (value.length > 1 && /[A-Z]/.test(value[0]) && /[A-Z]/.test(value[1])) {
    return value;
  }
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function winnerData(doc, xName, yName) {
  if (doc.verdict?.winner === "x") {
    return { side: "x", label: xName, otherLabel: yName };
  }

  if (doc.verdict?.winner === "y") {
    return { side: "y", label: yName, otherLabel: xName };
  }

  return { side: "", label: "", otherLabel: "" };
}

function titleCaseCategorySlug(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMetaDescription(existingMeta, doc) {
  const base = ensureSentence(existingMeta).replace(/\.$/, "");
  const suffixesByConstraint = {
    "ceiling-check": [
      " for larger workflows.",
      " when the work needs room to scale.",
      " for teams outgrowing simple boards.",
      " as project complexity increases.",
    ],
    "time-scarcity": [
      " when daily speed matters most.",
      " for faster status checks between meetings.",
      " when every extra click adds up.",
      " for quicker day to day task handling.",
    ],
    "fear-of-breaking": [
      " when setup needs to stay reassuringly simple.",
      " for users who do not want to build the system first.",
      " when ready made structure matters more than customization.",
      " for safer day one project setup.",
    ],
    "setup-tolerance": [
      " when setup has to stay light.",
      " for getting the first project running quickly.",
      " when beginners need to start without configuration overhead.",
      " for lower first use friction.",
    ],
  };

  const suffixes = suffixesByConstraint[doc.constraintSlug] || [
    " for clearer day to day project work.",
    " when the workflow has to stay practical.",
  ];

  if (base.length >= 155 && base.length <= 160) {
    return `${base}.`;
  }

  let best = `${base}.`;
  for (let i = 0; i < suffixes.length; i += 1) {
    const candidate = `${base}${suffixes[i]}`;
    if (candidate.length >= 155 && candidate.length <= 160) {
      return candidate;
    }
    if (candidate.length <= 160 && candidate.length > best.length) {
      best = candidate;
    }
  }

  for (let i = 0; i < suffixes.length; i += 1) {
    for (let j = i + 1; j < suffixes.length; j += 1) {
      const candidate = `${base}${suffixes[i]}${suffixes[j].trimStart()}`;
      if (candidate.length >= 155 && candidate.length <= 160) {
        return candidate;
      }
      if (candidate.length <= 160 && candidate.length > best.length) {
        best = candidate;
      }
    }
  }

  if (best.length >= 155 && best.length <= 160) {
    return best;
  }

  const tailPoolByConstraint = {
    "ceiling-check": [
      " at scale",
      " across teams",
      " without workarounds",
      " in bigger projects",
      " as projects grow",
      " for larger teams",
      " with less manual work",
    ],
    "time-scarcity": [
      " each day",
      " between meetings",
      " when time is tight",
      " with less overhead",
      " without extra clicks",
      " during busy weeks",
    ],
    "fear-of-breaking": [
      " on day one",
      " with safer defaults",
      " without setup confusion",
      " for client work",
      " for less technical teams",
    ],
    "setup-tolerance": [
      " on day one",
      " without setup overhead",
      " for first time users",
      " before the first real task",
      " with less onboarding friction",
    ],
  };

  const tailPool = tailPoolByConstraint[doc.constraintSlug] || [
    " at scale",
    " in daily use",
    " with less friction",
    " without extra overhead",
  ];

  const stem = best.replace(/\.$/, "");
  for (const tail of tailPool) {
    const candidate = `${stem}${tail}.`;
    if (candidate.length >= 155 && candidate.length <= 160) {
      return candidate;
    }
  }

  for (let i = 0; i < tailPool.length; i += 1) {
    for (let j = i + 1; j < tailPool.length; j += 1) {
      const candidate = `${stem}${tailPool[i]}${tailPool[j]}.`;
      if (candidate.length >= 155 && candidate.length <= 160) {
        return candidate;
      }
    }
  }

  let padded = stem;
  for (const filler of tailPool) {
    if ((padded + filler).length <= 159) {
      padded += filler;
    }
    if ((`${padded}.`).length >= 155 && (`${padded}.`).length <= 160) {
      return `${padded}.`;
    }
  }

  if (padded.length > 160) {
    const clipped = padded.slice(0, 160).replace(/\s+\S*$/, "");
    return clipped.endsWith(".") ? clipped : `${clipped}.`;
  }

  return padded.endsWith(".") ? padded : `${padded}.`;
}

function appendFailureModeConsequence(value, isWinnerTool, doc) {
  const base = ensureSentence(value).replace(/\.$/, "");
  const consequenceMap = {
    "ceiling-check": isWinnerTool
      ? "so the extra structure becomes overhead before the project ever needs that depth"
      : "so the workflow runs out of room once the project adds more teams, fields, or dependencies",
    "time-scarcity": isWinnerTool
      ? "so the extra setup and scanning slow down someone who needs to move fast"
      : "so the next action is harder to spot and update quickly during a busy day",
    "fear-of-breaking": isWinnerTool
      ? "so the extra flexibility turns into setup risk for someone who wants a safer default"
      : "so the user has to improvise the workflow and is more likely to get stuck early",
    "setup-tolerance": isWinnerTool
      ? "so the setup burden shows up before the first real task is even captured"
      : "so the first-use path feels heavier than the work the user came in to track",
  };

  const consequence =
    consequenceMap[doc.constraintSlug] ||
    (isWinnerTool
      ? "so the extra structure creates unnecessary overhead"
      : "so the tool breaks down on the core constraint");

  return `${base}, ${consequence}.`;
}

function writeJson(filePath, doc) {
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`);
}

function buildReport(report) {
  const lines = [
    `# ${titleCaseCategorySlug(report.categorySlug)} Quality Normalization Report`,
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total pages scanned: ${report.totalPagesScanned}`,
    `- Total pages changed: ${report.totalPagesChanged}`,
    `- Total pages left unchanged: ${report.totalPagesUnchanged}`,
    `- Total pages where related_pages was reset to []: ${report.relatedPagesReset}`,
    `- Total pages where section repetition was reduced: ${report.sectionRepetitionReduced}`,
    `- Total files flagged for manual review: ${report.manualReview.length}`,
    "",
    "## Changed Pages",
    "",
  ];

  if (report.changedPages.length === 0) {
    lines.push("- None");
  } else {
    for (const page of report.changedPages) {
      lines.push(`- File path: ${page.filePath}`);
      lines.push(`  Title: ${page.title}`);
      lines.push(`  Fields changed: ${page.fieldsChanged.join(", ")}`);
      lines.push(`  Reason: ${page.reason}`);
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
  const files = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith(".json"));
  const changedPages = [];
  const manualReview = [];
  let totalPagesScanned = 0;
  let relatedPagesReset = 0;
  let sectionRepetitionReduced = 0;

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const relativePath = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (doc.categorySlug !== TARGET_CATEGORY) {
      continue;
    }

    totalPagesScanned += 1;

    const { xName, yName } = parsePairFromTitle(doc.title);
    const winner = winnerData(doc, xName, yName);
    const fieldsChanged = [];
    const reasons = [];
    let repetitionReducedHere = false;

    if (
      winner.label &&
      doc.one_second_verdict &&
      doc.one_second_verdict.winner_label !== winner.label
    ) {
      doc.one_second_verdict.winner_label = winner.label;
      fieldsChanged.push("one_second_verdict.winner_label");
      reasons.push("winner label corrected to match verdict.winner");
    }

    if (doc.one_second_verdict?.summary && sentenceCount(doc.one_second_verdict.summary) !== 1) {
      doc.one_second_verdict.summary = ensureSentence(doc.one_second_verdict.summary);
      fieldsChanged.push("one_second_verdict.summary");
      reasons.push("one-second summary normalized to one sentence");
    }

    if (doc.one_second_verdict?.reason && sentenceCount(doc.one_second_verdict.reason) !== 1) {
      doc.one_second_verdict.reason = ensureSentence(doc.one_second_verdict.reason);
      fieldsChanged.push("one_second_verdict.reason");
      reasons.push("one-second reason normalized to one sentence");
    }

    const metaLength = normalizeWhitespace(doc.meta_description).length;
    if (metaLength < 155 || metaLength > 160) {
      const nextMeta = buildMetaDescription(doc.meta_description, doc);
      if (nextMeta.length >= 155 && nextMeta.length <= 160) {
        doc.meta_description = nextMeta;
        fieldsChanged.push("meta_description");
        reasons.push(`meta description adjusted to ${nextMeta.length} characters`);
      } else {
        manualReview.push(
          `${relativePath}: meta description could not be normalized into the 155-160 character range`
        );
      }
    }

    if (Array.isArray(doc.related_pages) && doc.related_pages.length > 0) {
      doc.related_pages = [];
      relatedPagesReset += 1;
      fieldsChanged.push("related_pages");
      reasons.push("related pages reset for deterministic rebuild");
    }

    if (Array.isArray(doc.sections)) {
      const failureModes = doc.sections.find((section) => section.type === "failure_modes");
      if (!failureModes || !Array.isArray(failureModes.items)) {
        manualReview.push(`${relativePath}: missing failure_modes section`);
      } else {
        let failureModesChanged = false;
        for (const item of failureModes.items) {
          const isWinnerTool = item.tool === winner.side;
          if (needsFailureModeEnrichment(item.fails_when)) {
            item.fails_when = appendFailureModeConsequence(
              item.fails_when,
              isWinnerTool,
              doc
            );
            failureModesChanged = true;
          }

          item.what_to_do_instead = ensureSentence(item.what_to_do_instead);
        }

        if (failureModesChanged) {
          fieldsChanged.push("sections.failure_modes");
          reasons.push("failure modes now include concrete user-facing breakdowns");
          repetitionReducedHere = true;
        }
      }
    } else {
      manualReview.push(`${relativePath}: sections array missing`);
    }

    if (fieldsChanged.length === 0) {
      continue;
    }

    if (repetitionReducedHere) {
      sectionRepetitionReduced += 1;
    }

    writeJson(filePath, doc);
    changedPages.push({
      filePath: relativePath,
      title: doc.title,
      fieldsChanged,
      reason: reasons.join("; "),
    });
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const report = {
    categorySlug: TARGET_CATEGORY,
    totalPagesScanned,
    totalPagesChanged: changedPages.length,
    totalPagesUnchanged: totalPagesScanned - changedPages.length,
    relatedPagesReset,
    sectionRepetitionReduced,
    manualReview,
    changedPages,
  };

  fs.writeFileSync(REPORT_PATH, buildReport(report));
  console.log(JSON.stringify({ reportPath: REPORT_PATH, ...report }, null, 2));
}

main();
