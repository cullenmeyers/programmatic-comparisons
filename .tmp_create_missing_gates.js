const fs = require("fs");
const path = require("path");

const PAGES_DIR = path.join(process.cwd(), "content", "pages");
const GATES_DIR = path.join(process.cwd(), "content", "categoryGates");

const CONSTRAINT_LABELS = {
  "setup-tolerance": "low tolerance for setup/configuration",
  "maintenance-load": "zero tolerance for ongoing maintenance",
  "switching-cost": "short-term use + low switching cost",
  "time-scarcity": "time scarcity / cognitive overload",
  "ceiling-check": "ceiling matters",
  "fear-of-breaking": "fear of breaking things",
  "feature-aversion": "feature aversion",
};

const UI_CONSTRAINT_NAMES = {
  "setup-tolerance": "Publish fast",
  "maintenance-load": "Works without upkeep",
  "switching-cost": "Easy to quit later",
  "time-scarcity": "Fast to use daily",
  "ceiling-check": "Doesn't cap you",
  "fear-of-breaking": "Hard to mess up",
  "feature-aversion": "Keeps it simple",
};

const CANONICAL_NAME_OVERRIDES = {
  onenote: "OneNote",
  github: "GitHub",
  youtube: "YouTube",
  clickup: "ClickUp",
  todoist: "Todoist",
  icloud: "iCloud",
};

const ALIAS_TO_CANONICAL = {
  "Microsoft OneNote": "OneNote",
  "MS OneNote": "OneNote",
  "Google Calendar": "Google Calendar",
  "Google Cal": "Google Calendar",
  Outlook: "Outlook Calendar",
  "Microsoft Outlook Calendar": "Outlook Calendar",
  "Apple Calendar": "Apple Calendar",
  "iCloud Calendar": "Apple Calendar",
  "Reclaim.ai": "Reclaim",
  "Notion Calendar": "Notion Calendar",
  Cron: "Cron",
  GCal: "Google Calendar",
};

const NOTE_RULES = {
  "setup-tolerance": [
    ["A", "F", "Too much setup"],
    ["G", "L", "Setup is fiddly"],
    ["M", "R", "Setup slows you down"],
    ["S", "Z", "Too many setup steps"],
  ],
  "maintenance-load": [
    ["A", "F", "Needs frequent upkeep"],
    ["G", "L", "Maintenance adds friction"],
    ["M", "R", "Needs regular tending"],
    ["S", "Z", "Too much to maintain"],
  ],
  "switching-cost": [
    ["A", "F", "Hard to leave later"],
    ["G", "L", "Locks in your setup"],
    ["M", "R", "Switching gets sticky"],
    ["S", "Z", "Hard to unwind later"],
  ],
  "time-scarcity": [
    ["A", "F", "Too slow day to day"],
    ["G", "L", "Adds daily friction"],
    ["M", "R", "Takes too much attention"],
    ["S", "Z", "Too much daily overhead"],
  ],
  "ceiling-check": [
    ["A", "F", "Runs out of room"],
    ["G", "L", "Starts to feel limiting"],
    ["M", "R", "Ceiling shows up early"],
    ["S", "Z", "Caps you too soon"],
  ],
  "fear-of-breaking": [
    ["A", "F", "Too many knobs"],
    ["G", "L", "Easy to misconfigure"],
    ["M", "R", "Structure feels fragile"],
    ["S", "Z", "Hard to keep simple"],
  ],
  "feature-aversion": [
    ["A", "F", "Feels too feature-heavy"],
    ["G", "L", "More features than needed"],
    ["M", "R", "Too much built in"],
    ["S", "Z", "Feels busier than needed"],
  ],
};

const ELIGIBLE_MISSING = [
  ["password-managers", "ceiling-check"],
  ["password-managers", "fear-of-breaking"],
  ["password-managers", "feature-aversion"],
  ["calendar-scheduling-tools", "ceiling-check"],
  ["email-inbox-tools", "feature-aversion"],
  ["email-inbox-tools", "time-scarcity"],
  ["email-inbox-tools", "setup-tolerance"],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function titleCaseFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeToolName(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "";
  if (Object.prototype.hasOwnProperty.call(ALIAS_TO_CANONICAL, trimmed)) {
    return ALIAS_TO_CANONICAL[trimmed];
  }

  const compactKey = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (Object.prototype.hasOwnProperty.call(CANONICAL_NAME_OVERRIDES, compactKey)) {
    return CANONICAL_NAME_OVERRIDES[compactKey];
  }

  return trimmed;
}

function slugSegmentToTitleCase(segment) {
  const raw = segment
    .split("-")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(CANONICAL_NAME_OVERRIDES, lower)) {
        return CANONICAL_NAME_OVERRIDES[lower];
      }
      if (lower === "ai") return "AI";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");

  return normalizeToolName(raw);
}

function extractToolsFromTitle(title) {
  if (typeof title !== "string") return null;
  const [beforeFor] = title.split(" for ");
  const parts = beforeFor.split(" vs ");
  if (parts.length !== 2) return null;

  const xName = normalizeToolName(parts[0]);
  const yName = normalizeToolName(parts[1]);
  if (!xName || !yName) return null;

  return { xName, yName };
}

function extractToolsFromSlug(slug) {
  if (typeof slug !== "string") return null;
  const match = slug.match(/^(.*)-vs-(.*)-for-/);
  if (!match) return null;
  const xName = slugSegmentToTitleCase(match[1]);
  const yName = slugSegmentToTitleCase(match[2]);
  if (!xName || !yName) return null;
  return { xName, yName };
}

function extractTools(doc) {
  return extractToolsFromTitle(doc.title) || extractToolsFromSlug(doc.slug);
}

function pickMostCommonCategoryLabel(docs, categorySlug) {
  const counts = new Map();
  for (const doc of docs) {
    const label = typeof doc.category === "string" ? doc.category.trim() : "";
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return (
    Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ||
    titleCaseFromSlug(categorySlug)
  );
}

function buildFailNote(constraintSlug, toolName) {
  const first = (toolName || "").trim().charAt(0).toUpperCase();
  const rules = NOTE_RULES[constraintSlug];
  for (const [from, to, note] of rules) {
    if (first >= from && first <= to) return note;
  }
  return rules[rules.length - 1][2];
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const pageFiles = fs
  .readdirSync(PAGES_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort((a, b) => a.localeCompare(b));

const docs = pageFiles.map((file) => readJson(path.join(PAGES_DIR, file)));

const results = [];

for (const [categorySlug, constraintSlug] of ELIGIBLE_MISSING) {
  const docsInCategory = docs.filter((doc) => doc.categorySlug === categorySlug);
  const docsInLens = docsInCategory.filter((doc) => doc.constraintSlug === constraintSlug);

  const categoryLabel = pickMostCommonCategoryLabel(docsInCategory, categorySlug);
  const constraintLabel = CONSTRAINT_LABELS[constraintSlug];
  const uiConstraintName = UI_CONSTRAINT_NAMES[constraintSlug];

  const toolsUniverse = Array.from(
    new Set(
      docsInCategory.flatMap((doc) => {
        const tools = extractTools(doc);
        return tools ? [tools.xName, tools.yName] : [];
      })
    )
  ).sort((a, b) => a.localeCompare(b));

  const failingTools = new Set();
  for (const doc of docsInLens) {
    const tools = extractTools(doc);
    if (!tools) continue;
    if (doc.verdict?.winner === "x") failingTools.add(tools.yName);
    if (doc.verdict?.winner === "y") failingTools.add(tools.xName);
  }

  const gate = {
    categoryLabel,
    categorySlug,
    constraintLabel,
    constraintSlug,
    uiConstraintName,
    title: `${uiConstraintName} - ${categoryLabel}`,
    description: [
      `Use this when you want ${categoryLabel.toLowerCase()} that are ${uiConstraintName.toLowerCase()}.`,
      "Tools flagged here tend to feel risky or confusing to use.",
      "Pick the option that stays obvious and dependable in daily use.",
    ],
    embedBlockTitle: `Quick Gate: ${uiConstraintName}`,
    tools: toolsUniverse.map((tool) => {
      const fails = failingTools.has(tool);
      return {
        name: tool,
        fails,
        note: fails ? buildFailNote(constraintSlug, tool) : "",
      };
    }),
    relatedComparisons: docsInLens
      .map((doc) => doc.slug)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 12),
  };

  const outDir = path.join(GATES_DIR, categorySlug);
  const outPath = path.join(outDir, `${constraintSlug}.json`);
  ensureDir(outDir);
  fs.writeFileSync(outPath, `${JSON.stringify(gate, null, 2)}\n`, "utf8");

  results.push({
    path: outPath,
    tools: gate.tools.length,
    relatedComparisons: gate.relatedComparisons.length,
    categoryLabel,
  });
}

console.log(JSON.stringify(results, null, 2));
