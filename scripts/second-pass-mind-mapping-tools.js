/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "mind-mapping-tools-second-pass-report.md");
const ALLOWED_SECTIONS = new Set(["persona_fit", "x_wins", "y_wins", "failure_modes", "edge_case", "quick_rules"]);

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function writeJson(filePath, doc) { fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`); }
function lower(v) { return String(v || "").toLowerCase(); }
function sentence(v) { return String(v || "").replace(/\s+/g, " ").trim().replace(/[.!?]+$/g, "") + "."; }
function parsePair(title) {
  const [pair = ""] = String(title || "").split(" for ");
  const [xName = "", yName = ""] = pair.split(" vs ");
  return { xName: xName.trim(), yName: yName.trim() };
}
function personaNoun(persona) {
  const map = { "Solo user": "solo user", "Busy professional": "busy professional", "Power user": "power user", Beginner: "beginner", Minimalist: "minimalist", "Non-technical user": "non-technical user", Student: "student" };
  return map[persona] || lower(persona || "user");
}

function detectMode(rule) {
  const v = lower(rule);
  if (/different diagram types requires switching tools outside the platform/.test(v)) return "diagram_suite";
  if (/multiple relationship views and panels/.test(v)) return "interface_overhead";
  if (/structured presentation mode/.test(v)) return "presentation_mode";
  if (/ai-assisted suggestions/.test(v)) return "ai_assist";
  if (/local files and markdown structure/.test(v)) return "file_markdown_burden";
  if (/rigid node hierarchies without flexible layout and mixed media/.test(v)) return "flexible_mixed_media";
  if (/manual dragging across a fixed canvas instead of zoom-based navigation/.test(v)) return "zoom_navigation";
  if (/freeform boards without enforced hierarchy/.test(v)) return "enforced_hierarchy";
  if (/manually sharing and syncing local files/.test(v)) return "collaboration_sync";
  if (/connecting ideas across contexts is limited to static tree hierarchies/.test(v)) return "cross_context_links";
  return "general";
}

const MODE = {
  diagram_suite: {
    orientation: "strength",
    axis: "keeping several diagram types in one platform",
    winnerNoun: "a broader diagram workspace",
    loserNoun: "a narrower mind-mapping surface",
    winnerDims: ["setup stays inside one tool", "format shifts do not interrupt daily work", "the project can grow across several visual structures"],
    loserDims: ["a focused mind map can feel lighter", "a narrower interface can be easier to scan", "it works when diagram variety is not part of the job"],
  },
  interface_overhead: {
    orientation: "burden",
    axis: "managing several panels and relationship views",
    winnerNoun: "a simpler mapping surface",
    loserNoun: "a denser multi-panel interface",
    winnerDims: ["the first map starts with less interface learning", "daily editing needs less panel switching", "mental load stays lower over time"],
    loserDims: ["extra relationship views pay back", "the tool supports deeper exploration later", "the heavier interface makes sense when complexity is intentional"],
  },
  presentation_mode: {
    orientation: "strength",
    axis: "turning a map into a guided presentation",
    winnerNoun: "a presentation-ready map workflow",
    loserNoun: "manual node-by-node walkthroughs",
    winnerDims: ["prep is shorter before a meeting", "live walkthroughs move more cleanly", "large maps gain a clearer explanation layer"],
    loserDims: ["a simpler map is fine for private planning", "less presentation tooling can feel lighter", "manual navigation is acceptable on small maps"],
  },
  ai_assist: {
    orientation: "strength",
    axis: "using AI help to start and expand a map",
    winnerNoun: "assisted map scaffolding",
    loserNoun: "fully manual node creation",
    winnerDims: ["blank-canvas setup friction drops", "daily expansion keeps moving", "the map gets a stronger first draft structure"],
    loserDims: ["manual building can feel cleaner", "explicit control over each node can matter", "it works when idea generation is not the bottleneck"],
  },
  file_markdown_burden: {
    orientation: "burden",
    axis: "managing local files and markdown structure",
    winnerNoun: "a map-first visual tool",
    loserNoun: "a vault-backed note system",
    winnerDims: ["setup avoids file-system learning", "daily edits stay separate from vault mechanics", "the tool feels safer to change"],
    loserDims: ["local note ownership matters", "the canvas supports a broader knowledge workflow", "the file layer pays back when technical control is a goal"],
  },
  flexible_mixed_media: {
    orientation: "strength",
    axis: "supporting flexible layout and mixed media",
    winnerNoun: "a mixed-content visual board",
    loserNoun: "a rigid node tree",
    winnerDims: ["setup can begin from notes images and links together", "daily layout changes do not require rebuilding the map", "the workspace can hold richer project material over time"],
    loserDims: ["a pure hierarchy can feel cleaner", "less layout freedom can reduce mess", "it works when mixed media is not part of the project"],
  },
  zoom_navigation: {
    orientation: "strength",
    axis: "moving through large maps with zoom instead of dragging",
    winnerNoun: "zoom-based navigation",
    loserNoun: "manual canvas dragging",
    winnerDims: ["overview and detail are easier to enter", "daily travel between branches is faster", "orientation holds better as maps grow"],
    loserDims: ["small maps can tolerate manual movement", "free placement may matter more in early brainstorming", "it works when navigation speed is not the real bottleneck"],
  },
  enforced_hierarchy: {
    orientation: "strength",
    axis: "keeping ideas inside an explicit hierarchy",
    winnerNoun: "a disciplined branch structure",
    loserNoun: "a freeform ideation board",
    winnerDims: ["new ideas get a clearer starting place", "daily review becomes more predictable", "the map stays orderly as it grows"],
    loserDims: ["open boards can help early ideation", "free capture can feel easier before structure exists", "it works when later review matters less than initial freedom"],
  },
  collaboration_sync: {
    orientation: "strength",
    axis: "collaborating without manual file sharing",
    winnerNoun: "live shared mapping",
    loserNoun: "local file handoffs",
    winnerDims: ["sharing starts without export steps", "daily team edits stay current in one place", "the map gets a cleaner collaborative operating model"],
    loserDims: ["solo work may not need live sharing", "a local tool can feel more self-contained", "it works when teamwork is only occasional"],
  },
  cross_context_links: {
    orientation: "strength",
    axis: "linking one idea across several contexts",
    winnerNoun: "networked idea relationships",
    loserNoun: "a single-path hierarchy",
    winnerDims: ["setup can reflect overlap instead of forcing one branch", "daily exploration moves across related contexts faster", "the system models networked thinking better over time"],
    loserDims: ["a tree can feel easier to follow", "one path per idea can reduce complexity", "it works when cross-context links are not doing real work"],
  },
  general: {
    orientation: "strength",
    axis: "handling the winning mapping mechanism directly",
    winnerNoun: "the winning approach",
    loserNoun: "the losing tradeoff",
    winnerDims: ["setup friction drops", "daily use stays smoother", "the structure scales better"],
    loserDims: ["the simpler tradeoff can still fit", "a lighter interface may be enough", "it works until the named friction repeats often"],
  },
};

function buildContext(doc) {
  const { xName, yName } = parsePair(doc.title);
  const winnerSide = doc.verdict?.winner === "x" ? "x" : "y";
  const mode = detectMode(doc.verdict?.decision_rule || "");
  const cfg = MODE[mode] || MODE.general;
  return {
    xName,
    yName,
    winnerSide,
    loserSide: winnerSide === "x" ? "y" : "x",
    winnerName: winnerSide === "x" ? xName : yName,
    loserName: winnerSide === "x" ? yName : xName,
    persona: doc.persona,
    personaNoun: personaNoun(doc.persona),
    mode,
    ...cfg,
  };
}

function bulletsFor(side, context) {
  const name = side === context.winnerSide ? context.winnerName : context.loserName;
  const dims = side === context.winnerSide ? context.winnerDims : context.loserDims;
  const starts = side === context.winnerSide
    ? [`${name} helps at setup because ${dims[0]}`, `${name} is better in day-to-day use because ${dims[1]}`, `${name} scales better because ${dims[2]}`]
    : [`${name} can still win when ${dims[0]}`, `${name} is still useful because ${dims[1]}`, `${name} remains reasonable when ${dims[2]}`];
  const why = side === context.winnerSide
    ? [
      `That matters when the decisive mechanism is ${context.axis}.`,
      `The user feels the gain during normal mapping rather than only in edge cases.`,
      `It keeps the map aligned with ${context.winnerNoun} instead of drifting toward ${context.loserNoun}.`,
    ]
    : [
      `This is a narrower benefit that does not claim ${context.axis}.`,
      `It helps in a simpler situation without taking over the winner's decisive mechanism.`,
      `The fit only holds while the main friction in the rule is still minor.`,
    ];
  return starts.map((point, i) => ({ point: sentence(point), why_it_matters: sentence(why[i]) }));
}

function buildPersonaFit(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const p = context.personaNoun;
  if (context.orientation === "burden") {
    return sentence(`${w} fits this ${p} because ${l} is the tool introducing the burden in the rule, not ${w}. That extra weight shows up in first-use setup, in the amount of interface or technical structure that has to be managed during normal mapping, and in how safe the tool feels to change later. ${w} wins by keeping the work closer to ${context.winnerNoun}`);
  }
  return sentence(`${w} fits this ${p} because ${context.axis} changes more than one part of the workflow. It affects how quickly the user can get started, how smoothly the map works during normal use, and whether the structure still fits once the project gets larger or messier. ${w} wins by giving this user ${context.winnerNoun} instead of ${context.loserNoun}`);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    return [
      { tool: context.winnerSide, fails_when: sentence(`${w} becomes the wrong fit when the user now wants the heavier model because it is finally doing real work`), what_to_do_instead: sentence(`Choose ${l} if the added complexity around ${context.axis} is now intentional`) },
      { tool: context.loserSide, fails_when: sentence(`${l} breaks down when a simple mapping task keeps turning into the exact burden named in the rule`), what_to_do_instead: sentence(`Choose ${w} when the map should work before that overhead appears`) },
    ];
  }
  return [
    { tool: context.winnerSide, fails_when: sentence(`${w} becomes too much when the project no longer needs ${context.axis} and would be fine with a narrower tool`), what_to_do_instead: sentence(`Choose ${l} if the lighter tradeoff now fits better`) },
    { tool: context.loserSide, fails_when: sentence(`${l} breaks down when the user repeatedly needs ${context.axis} but the tool only offers ${context.loserNoun}`), what_to_do_instead: sentence(`Choose ${w} when that mechanism matters in everyday use`) },
  ];
}

function buildEdgeCase(context) {
  const l = context.loserName;
  return sentence(context.orientation === "burden"
    ? `This can flip if the heavier model on ${l} starts doing enough real work to justify its extra overhead`
    : `This can flip if the project stops needing ${context.axis} and the lighter tradeoff on ${l} becomes enough`);
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    return [
      sentence(`Choose ${w} if you want the map usable before the extra burden arrives`),
      sentence(`Choose ${l} if that heavier model is now worth the added complexity`),
      sentence(`Avoid ${l} when ${context.axis} is the exact source of friction`),
    ];
  }
  return [
    sentence(`Choose ${w} if you need ${context.axis}`),
    sentence(`Choose ${l} if a narrower or simpler mapping workflow is enough`),
    sentence(`Avoid ${l} when the project keeps running into the limit described by the rule`),
  ];
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const faqs = context.orientation === "burden"
    ? [
      { q: `Why does ${w} fit better here`, a: `${w} keeps the work closer to mapping and farther from the overhead named in the decision rule.` },
      { q: `When is ${l} still worth it`, a: `${l} is still worth it when the heavier structure is finally doing enough work to justify itself.` },
      { q: `What usually makes ${l} fail first`, a: `The user keeps hitting the same overhead before the map becomes useful.` },
      { q: `Is this only about simplicity`, a: `No. It is about where the operating burden actually lands during setup and daily use.` },
    ]
    : [
      { q: `Why does ${w} matter beyond one feature`, a: `${w} changes setup speed, day-to-day workflow, and how well the map structure holds once the project gets more demanding.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the project does not really need ${context.axis}.` },
      { q: `What usually makes ${l} fail first`, a: `The same mechanism in the decision rule keeps becoming a practical limit during normal mapping.` },
      { q: `Is ${w} always better`, a: `No. It is better when the user truly needs ${context.winnerNoun} instead of a narrower mapping workflow.` },
    ];
  return faqs.map((item) => ({ q: sentence(item.q).slice(0, -1) + "?", a: sentence(item.a) }));
}

function rewritePage(doc) {
  const context = buildContext(doc);
  const sections = (doc.sections || []).filter((section) => ALLOWED_SECTIONS.has(section.type)).map((section) => {
    if (section.type === "persona_fit") return { ...section, heading: `Why ${context.winnerName} fits ${context.persona}s better`, content: buildPersonaFit(context) };
    if (section.type === "x_wins") return { ...section, heading: `Where ${context.xName} wins`, bullets: bulletsFor("x", context) };
    if (section.type === "y_wins") return { ...section, heading: `Where ${context.yName} wins`, bullets: bulletsFor("y", context) };
    if (section.type === "failure_modes") return { ...section, heading: "Where each tool can break down", items: buildFailureModes(context) };
    if (section.type === "edge_case") return { ...section, heading: "When this verdict might flip", content: buildEdgeCase(context) };
    if (section.type === "quick_rules") return { ...section, heading: "Quick decision rules", rules: buildQuickRules(context) };
    return null;
  });
  return { nextDoc: { ...doc, sections, faqs: buildFaqs(context), related_pages: [] }, rewrittenSections: ["persona_fit", "x_wins", "y_wins", "failure_modes", "edge_case", "quick_rules", "faqs"] };
}

function main() {
  const files = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith(".json"));
  const changed = [];
  const skipped = [];
  let totalScanned = 0;
  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const doc = readJson(filePath);
    if (doc.categorySlug !== "mind-mapping-tools") continue;
    totalScanned += 1;
    const { nextDoc, rewrittenSections } = rewritePage(doc);
    if (JSON.stringify(nextDoc) !== JSON.stringify(doc)) {
      writeJson(filePath, nextDoc);
      changed.push({ filePath: path.relative(ROOT, filePath).replace(/\\/g, "/"), title: doc.title, sections: rewrittenSections });
    } else {
      skipped.push(path.relative(ROOT, filePath).replace(/\\/g, "/"));
    }
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const reportLines = ["# Mind Mapping Tools Second Pass Report", "", `Date: ${new Date().toISOString()}`, "", `- Pages scanned: ${totalScanned}`, `- Pages expanded: ${changed.length}`, `- Sections rewritten: ${changed.reduce((sum, page) => sum + page.sections.length, 0)}`, `- Pages skipped: ${skipped.length}`, "", "## Expanded Pages", "", ...changed.flatMap((page) => [`- File path: ${page.filePath}`, `  Title: ${page.title}`, `  Sections rewritten: ${page.sections.join(", ")}`]), "", "## Skipped Pages", "", ...(skipped.length ? skipped.map((file) => `- ${file}`) : ["- None"]), ""];
  fs.writeFileSync(REPORT_PATH, `${reportLines.join("\n")}\n`);
  console.log(JSON.stringify({ reportPath: REPORT_PATH, pagesScanned: totalScanned, pagesExpanded: changed.length, sectionsRewritten: changed.reduce((sum, page) => sum + page.sections.length, 0), pagesSkipped: skipped.length }, null, 2));
}

main();
