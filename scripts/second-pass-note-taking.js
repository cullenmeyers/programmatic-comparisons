/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "note-taking-second-pass-report.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, doc) {
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`);
}

function parsePair(title) {
  const [pairPart = ""] = String(title || "").split(" for ");
  const [xName = "", yName = ""] = pairPart.split(" vs ");
  return { xName: xName.trim(), yName: yName.trim() };
}

function sentence(value) {
  return String(value || "").replace(/\s+/g, " ").trim().replace(/[.!?]+$/g, "") + ".";
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function personaNoun(persona) {
  const map = {
    "Solo user": "solo user",
    "Busy professional": "busy professional",
    "Power user": "power user",
    "Beginner": "beginner",
    "Minimalist": "minimalist",
    "Non-technical user": "non-technical user",
    Student: "student",
  };
  return map[persona] || lower(persona || "user");
}

function detectArchetype(rule) {
  const value = lower(rule);
  if (/database|page structure|pages|workspace|table|formula|database block|notebooks and tagging|multi-level notebooks/.test(value)) return "database_structure";
  if (/block|layout choices|blank-page complexity|editor|writing model|options unrelated to writing|organize before capturing|structure before content/.test(value)) return "editor_model";
  if (/graph|backlink|plugin extensibility|plugins|system-building|link or structure ideas|local file|local files|markdown|vault|second brain|folder.*sync service/.test(value)) return "knowledge_system";
  if (/boolean search|smart groups|advanced search|query|rule-based|cross-document linking|excerpt management|binder-level hierarchy|compilation control|extension-based customization/.test(value)) return "retrieval_depth";
  if (/plan limits|sync behavior|where data lives|how it syncs|risky|confusing|anxiety|security|encrypted|encryption|vault options|unlocking|note types/.test(value)) return "trust_clarity";
  if (/semester|course|learning the system|learning the tool|semester length|semester value|short-term|academic payoff/.test(value)) return "short_horizon";
  if (/re-organization|cleanups|periodic cleanups|runs quietly|upkeep/.test(value)) return "maintenance_burden";
  if (/switch|switching|leave later|submission|export|document files|full document files|easy to quit/.test(value)) return "portability";
  if (/capturing a thought takes more than a few seconds|quick lightweight text entries|simply writing a note instantly|immediate writing|before writing/.test(value)) return "capture_speed";
  if (/visual freedom|board-style layout|spatial arrangement|canvas/.test(value)) return "visual_canvas";
  if (/live code cells|execution environments/.test(value)) return "coding_notebook";
  return "general";
}

function detectOrientation(constraintSlug, rule, archetype) {
  const value = lower(rule);
  if (constraintSlug === "ceiling-check") return "depth";
  if (["retrieval_depth", "coding_notebook"].includes(archetype)) return "depth";
  if (archetype === "knowledge_system") return /constrained/.test(value) ? "depth" : "simplicity";
  if (archetype === "database_structure") return /must be understood before writing|before writing|default writing model|organize before capturing|structure before content/.test(value) ? "simplicity" : "depth";
  return "simplicity";
}

function buildContext(doc) {
  const { xName, yName } = parsePair(doc.title);
  const winnerSide = doc.verdict?.winner === "x" ? "x" : "y";
  const loserSide = winnerSide === "x" ? "y" : "x";
  const rule = doc.verdict?.decision_rule || "";
  const archetype = detectArchetype(rule);
  return {
    doc,
    xName,
    yName,
    winnerSide,
    loserSide,
    winnerName: winnerSide === "x" ? xName : yName,
    loserName: winnerSide === "x" ? yName : xName,
    persona: doc.persona,
    personaNoun: personaNoun(doc.persona),
    rule,
    archetype,
    orientation: detectOrientation(doc.constraintSlug, rule, archetype),
  };
}

function winnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    knowledge_system: [
      { point: `${w} gives the note system a stronger structural backbone`, why_it_matters: `Links, local files, or vault-level control let the knowledge base grow without collapsing into isolated pages.` },
      { point: `${w} makes daily retrieval more connected`, why_it_matters: `Backlinks, graph behavior, or linked references shorten the path between one note and the next relevant idea.` },
      { point: `${w} leaves room to evolve the workflow later`, why_it_matters: `Plugins or open files keep the note system from topping out once the user wants a more specialized setup.` },
    ],
    retrieval_depth: [
      { point: `${w} finds the right note with more precision`, why_it_matters: `Better queries, smart groups, or search logic reduce the amount of archive scanning you have to do by hand.` },
      { point: `${w} keeps large note libraries usable in daily work`, why_it_matters: `The system can surface slices of information instead of making you browse folder by folder.` },
      { point: `${w} supports a more deliberate long-term structure`, why_it_matters: `Advanced retrieval lets the archive keep growing without forcing a full reorganization every time it gets larger.` },
    ],
    coding_notebook: [
      { point: `${w} makes executable notes native instead of bolted on`, why_it_matters: `The user can write and run code in the same place without adapting the workflow around a missing runtime.` },
      { point: `${w} shortens the loop between thought and test`, why_it_matters: `Daily work moves faster when examples and outputs stay next to the explanation.` },
      { point: `${w} keeps technical notes closer to the real artifact`, why_it_matters: `That matters when the notebook is supposed to be an active workspace rather than static reference text.` },
    ],
    database_structure: [
      { point: `${w} gives notes more structure when the content actually needs it`, why_it_matters: `Pages, databases, or stronger hierarchy help once the archive must organize more than plain text.` },
      { point: `${w} supports richer day-to-day sorting and grouping`, why_it_matters: `Structured notes can be filtered, arranged, and revisited with less manual browsing.` },
      { point: `${w} scales better when notes become part of a larger system`, why_it_matters: `The same structure that feels heavier early can pay off once projects, references, and records need to live together.` },
    ],
    general: [
      { point: `${w} gives the user more control where the rule says it matters most`, why_it_matters: `The stronger mechanism keeps the note system from hitting the same limit over and over.` },
      { point: `${w} improves daily note handling in a practical way`, why_it_matters: `The archive becomes easier to navigate and use instead of staying static.` },
      { point: `${w} leaves more room for the workflow to expand`, why_it_matters: `That helps when the user is choosing for a system they expect to lean on heavily.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function loserBullets(context) {
  const l = context.loserName;
  const sets = {
    knowledge_system: [
      { point: `${l} keeps capture calmer when you do not need a full knowledge system`, why_it_matters: `A simpler note model can be faster when linking depth would mostly stay unused.` },
      { point: `${l} reduces navigation choices during routine writing`, why_it_matters: `The user spends less time deciding how notes should connect before the note itself is finished.` },
      { point: `${l} asks for less upkeep around the system layer`, why_it_matters: `That can be better if the goal is dependable notes rather than a customizable second brain.` },
    ],
    retrieval_depth: [
      { point: `${l} stays easier when the archive is still small enough to browse directly`, why_it_matters: `A simpler search model can be enough before advanced queries become a real time saver.` },
      { point: `${l} keeps daily writing less technical`, why_it_matters: `You can work without carrying smart groups, query syntax, or retrieval rules in your head.` },
      { point: `${l} favors a lighter note structure over a more query-driven one`, why_it_matters: `That tradeoff can be fine when the archive is not yet large enough to justify extra search depth.` },
    ],
    coding_notebook: [
      { point: `${l} can still be better for plain narrative notes`, why_it_matters: `A simpler editor may feel cleaner when code execution is not central to the job.` },
      { point: `${l} reduces setup around the writing surface`, why_it_matters: `The user is not choosing a heavier technical environment just to capture text and ideas.` },
      { point: `${l} keeps the note format easier to share as static content`, why_it_matters: `That matters when the goal is readable notes rather than an interactive notebook.` },
    ],
    database_structure: [
      { point: `${l} keeps first capture closer to plain writing`, why_it_matters: `The user can start with the note itself instead of designing containers or properties first.` },
      { point: `${l} makes daily navigation feel less system-heavy`, why_it_matters: `There are fewer structural layers between opening the app and finding the note you want.` },
      { point: `${l} lowers the amount of organization you have to remember`, why_it_matters: `That can be the better tradeoff when the archive is simple and writing speed matters more than structure.` },
    ],
    general: [
      { point: `${l} keeps the workflow lighter in a narrower use case`, why_it_matters: `The losing tool can still win when the deeper mechanism is not doing much real work yet.` },
      { point: `${l} favors direct writing over more system behavior`, why_it_matters: `That matters when the note job is simple and the richer setup would mostly stay idle.` },
      { point: `${l} asks for less commitment up front`, why_it_matters: `The simpler surface can be better when the user wants notes to stay straightforward.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function simplicityWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    database_structure: [
      { point: `${w} gets you writing before structure becomes a project`, why_it_matters: `The first note appears quickly because pages, databases, or hierarchies do not have to be designed first.` },
      { point: `${w} keeps daily note work closer to plain text handling`, why_it_matters: `Routine edits and note retrieval take fewer structural decisions once the archive is in motion.` },
      { point: `${w} lowers the mental map required to stay organized`, why_it_matters: `You can remember where notes live without carrying a broader page model in your head.` },
    ],
    editor_model: [
      { point: `${w} keeps the editor focused on writing instead of tool choices`, why_it_matters: `The user can stay with sentences and headings without block menus or layout decisions interrupting the start.` },
      { point: `${w} makes routine editing faster`, why_it_matters: `Daily note work feels more direct when every paragraph is not also a configuration surface.` },
      { point: `${w} reduces visual and cognitive clutter`, why_it_matters: `A calmer screen leaves less to interpret when the real goal is simply to think and write.` },
    ],
    knowledge_system: [
      { point: `${w} keeps note capture ahead of system-building`, why_it_matters: `The user can record the idea before deciding how files, links, or plugins should behave.` },
      { point: `${w} makes daily writing easier to sustain`, why_it_matters: `There are fewer moments where the system itself asks for attention before the note is done.` },
      { point: `${w} lowers the upkeep around staying organized`, why_it_matters: `That helps when the note tool should support thinking without becoming a side project.` },
    ],
    trust_clarity: [
      { point: `${w} feels easier to trust from the first session`, why_it_matters: `Sync, security, or storage behavior do not demand as much interpretation before the note feels safe.` },
      { point: `${w} keeps daily use more predictable`, why_it_matters: `The user spends less time wondering what a setting, limit, or sync state means in practice.` },
      { point: `${w} reduces the background anxiety around the archive`, why_it_matters: `That matters because uncertainty about the system can slow writing and retrieval even when the features are fine.` },
    ],
    short_horizon: [
      { point: `${w} becomes useful fast enough for a short academic window`, why_it_matters: `The user gets value now instead of burning a semester on learning note structure.` },
      { point: `${w} keeps day-to-day course work lighter`, why_it_matters: `Notes, studying, and submissions move faster when the tool does not add its own learning track.` },
      { point: `${w} asks for less long-term commitment to its model`, why_it_matters: `That matters when the course may end before a heavier note system has time to pay back.` },
    ],
    maintenance_burden: [
      { point: `${w} avoids turning note storage into a recurring maintenance job`, why_it_matters: `The archive stays useful without frequent cleanup sessions or plan decisions.` },
      { point: `${w} keeps daily note use separate from account management`, why_it_matters: `Writing and finding notes feels steadier when tiers, limits, or reorganizing rituals stay out of the way.` },
      { point: `${w} lowers the long-term care burden of the system`, why_it_matters: `The note tool can fade into the background instead of asking for periodic intervention.` },
    ],
    portability: [
      { point: `${w} fits short-lived or transitional work with less lock-in`, why_it_matters: `The user can write now without also buying into a heavier workflow they may need to leave soon.` },
      { point: `${w} supports daily sharing or submission more directly`, why_it_matters: `The path from note to class handoff, export, or common format is shorter.` },
      { point: `${w} keeps switching cost lower later`, why_it_matters: `That matters when the tool is supposed to solve this phase of work, not become a permanent dependency.` },
    ],
    capture_speed: [
      { point: `${w} gets a thought onto the page with fewer opening moves`, why_it_matters: `The user can capture the note before momentum disappears.` },
      { point: `${w} keeps routine note entry fast`, why_it_matters: `Daily capture does not require waiting through document setup or a heavier editor model.` },
      { point: `${w} makes the path back to a quick note more obvious`, why_it_matters: `That reduces friction when the user is jumping in and out of notes throughout the day.` },
    ],
    visual_canvas: [
      { point: `${w} removes layout choices from the first writing step`, why_it_matters: `The user can begin with content instead of deciding how to place or arrange it.` },
      { point: `${w} keeps daily editing less spatially interpretive`, why_it_matters: `Notes stay easier to scan when the tool is not constantly asking how the canvas should be used.` },
      { point: `${w} lowers the mental overhead of organization`, why_it_matters: `That helps when visual freedom is turning simple notes into extra design work.` },
    ],
    general: [
      { point: `${w} lowers setup friction in a way that changes real use`, why_it_matters: `The user gets to meaningful writing sooner.` },
      { point: `${w} keeps daily note handling lighter`, why_it_matters: `Routine capture and retrieval take less thought.` },
      { point: `${w} makes the archive easier to understand`, why_it_matters: `The tool supports the note instead of becoming another thing to manage.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function simplicityLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    database_structure: [
      { point: `${l} gives stronger structure once notes need to be organized like a system`, why_it_matters: `Pages, databases, or deeper hierarchy can help once plain note lists stop being enough.` },
      { point: `${l} supports richer grouping and sorting later`, why_it_matters: `The extra structure may pay off when the archive has to do more than hold text.` },
      { point: `${l} scales better when notes become part of a broader workspace`, why_it_matters: `The same structure that slows beginners can help once connected projects and records are the real goal.` },
    ],
    editor_model: [
      { point: `${l} can still help when mixed media and layout matter`, why_it_matters: `Blocks or richer content options become useful when the note needs more than continuous text.` },
      { point: `${l} supports more elaborate page building`, why_it_matters: `That matters when the workflow really does benefit from embeds, panels, or structured sections.` },
      { point: `${l} may suit users who want one workspace for many content types`, why_it_matters: `The extra surface is not pointless if the note system is intentionally broader than writing.` },
    ],
    knowledge_system: [
      { point: `${l} gives deeper linking once the archive is meant to behave like a knowledge system`, why_it_matters: `That added structure can become valuable when relationships between notes matter as much as the notes themselves.` },
      { point: `${l} can improve retrieval through connected notes later`, why_it_matters: `Backlinks and stronger note relationships pay back when the archive gets large enough to need them.` },
      { point: `${l} leaves more room for customization if that becomes the job`, why_it_matters: `Plugins or open files help when the user genuinely wants to shape the system over time.` },
    ],
    trust_clarity: [
      { point: `${l} can still be the better choice once its security model is understood`, why_it_matters: `The extra concepts may be worth it when stronger privacy or control is the real priority.` },
      { point: `${l} may offer more deliberate protection or flexibility`, why_it_matters: `That tradeoff can matter when the user is willing to carry a little more complexity for stronger control.` },
      { point: `${l} can feel safer after the learning curve is paid`, why_it_matters: `The issue here is the upfront interpretive burden, not that the tool has no security value.` },
    ],
    short_horizon: [
      { point: `${l} can still pay off if the same note system will last beyond the current term`, why_it_matters: `A heavier setup makes more sense when the user is really investing in a longer timeline.` },
      { point: `${l} may support deeper study structure later`, why_it_matters: `The extra features can be worth it when notes are expected to grow into a long-term knowledge base.` },
      { point: `${l} becomes more reasonable when long-run depth matters more than fast adoption`, why_it_matters: `The problem here is timing, not that the losing tool lacks value.` },
    ],
    maintenance_burden: [
      { point: `${l} can still help if the archive needs more deliberate organization`, why_it_matters: `The added systems may be worth occasional upkeep when the note library is large and cross-platform.` },
      { point: `${l} may fit users who accept periodic cleanup for more control`, why_it_matters: `Some people would rather tune the archive than keep a looser structure.` },
      { point: `${l} can offer broader portability or document features`, why_it_matters: `That can justify more maintenance when the richer environment is doing real work.` },
    ],
    portability: [
      { point: `${l} can still win if you are willing to invest in its model for deeper capability`, why_it_matters: `The higher switching cost may be worth it when the tool is also solving a more ambitious note problem.` },
      { point: `${l} may support richer knowledge work than the simpler option`, why_it_matters: `That matters when leaving later is less important than deeper structure now.` },
      { point: `${l} becomes more attractive when long-term fit outweighs easy exit`, why_it_matters: `The tradeoff only breaks once the user values flexibility later more than depth today.` },
    ],
    capture_speed: [
      { point: `${l} can still be better once quick capture is no longer the main concern`, why_it_matters: `A slower start may be acceptable when richer structure pays back after the note is created.` },
      { point: `${l} may support more organized notes after entry`, why_it_matters: `The extra steps can be justified when the archive needs more than instant capture.` },
      { point: `${l} becomes more attractive if the note is meant to grow into a larger system`, why_it_matters: `The losing tool's friction is less painful when speed is not the decisive job.` },
    ],
    visual_canvas: [
      { point: `${l} can still be better when spatial thinking is the point`, why_it_matters: `A freer canvas helps if arranging ideas visually is part of how the user actually works.` },
      { point: `${l} supports broader layout expression`, why_it_matters: `That matters when notes need mood boards, clusters, or visual grouping instead of simple text flow.` },
      { point: `${l} may feel more natural for users who think in space`, why_it_matters: `The extra decisions are not wasted if visual arrangement is genuinely useful.` },
    ],
    general: [
      { point: `${l} can still win in a narrower case`, why_it_matters: `The extra layers may pay back when complexity is intentional rather than accidental.` },
      { point: `${l} offers more capability if the workflow grows into it`, why_it_matters: `That matters once the user wants more than the winner is built to provide.` },
      { point: `${l} becomes more compelling when depth matters more than simplicity`, why_it_matters: `The losing tool is not wrong, just earlier or heavier than this use case needs.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function buildPersonaFit(context) {
  const w = context.winnerName;
  const p = context.personaNoun;
  if (context.orientation === "simplicity") {
    const simple = {
      database_structure: `${w} fits this ${p} because the same structure problem shows up in several places at once. It slows the first note, adds more organization to keep track of during daily use, and makes retrieval depend on remembering a broader page model than the writing actually needs. ${w} wins by letting content arrive before system design.`,
      editor_model: `${w} fits this ${p} because extra interface options do not only affect the first screen. They also slow routine editing, split attention during writing, and make the note tool feel busier than the note itself. ${w} wins by keeping the editor closer to writing than to page construction.`,
      knowledge_system: `${w} fits this ${p} because a note app can become a project before it becomes a habit. When links, plugins, or vault concepts show up too early, the cost appears in setup, daily momentum, and the amount of system thinking required to stay organized. ${w} keeps note capture ahead of system-building.`,
      trust_clarity: `${w} fits this ${p} because uncertainty around sync, security, or storage is a real operating cost. It slows first adoption, creates hesitation during daily use, and makes the archive feel less dependable than it should. ${w} wins by making normal note behavior easier to trust.`,
      short_horizon: `${w} fits this ${p} because the payoff window is short enough that setup and learning count more. The wrong tool burns time during onboarding, keeps adding friction in day-to-day note work, and may never recover its cost before the class or short project ends. ${w} becomes useful quickly enough to justify itself.`,
      maintenance_burden: `${w} fits this ${p} because upkeep is not one isolated annoyance. It affects long-term storage, the steadiness of daily writing, and how often the user has to think about the system instead of the notes. ${w} wins by letting the archive run quietly.`,
      portability: `${w} fits this ${p} because easy exit changes what good note-taking looks like. It affects how fast you can share work now, how much rework is needed later, and whether the tool feels like a temporary help or a sticky dependency. ${w} wins by keeping the switching cost lower.`,
      capture_speed: `${w} fits this ${p} because speed matters more than the first tap. It changes whether fleeting thoughts get captured at all, how often note-taking stays part of the day, and whether the tool feels worth reopening for a quick line. ${w} wins by shortening that loop.`,
      visual_canvas: `${w} fits this ${p} because too much layout freedom creates several kinds of drag. It adds decisions before writing, makes scanning notes slower later, and increases the amount of organization thinking required for simple content. ${w} keeps the note focused on the text instead of the canvas.`,
      general: `${w} fits this ${p} because it keeps the same friction from appearing during setup, daily use, and retrieval all at once.`,
    };
    return sentence(simple[context.archetype] || simple.general);
  }
  const depth = {
    knowledge_system: `${w} fits this ${p} because the same linking mechanism improves more than one moment in the workflow. It shapes how notes are connected at capture time, how quickly related ideas can be rediscovered later, and how well the archive keeps scaling once it becomes a serious knowledge base. That makes this a structural decision, not just a feature checklist.`,
    retrieval_depth: `${w} fits this ${p} because retrieval depth changes setup, daily work, and long-term organization together. It affects how much structure has to be rebuilt by hand, how fast the right note can be found under pressure, and whether a growing archive remains usable without repeated cleanup. The better tool wins by making search and grouping carry more of the load.`,
    coding_notebook: `${w} fits this ${p} because the execution model changes how the notes behave day to day. It affects how quickly experiments can be run, whether code and explanation stay connected, and whether the notebook remains an active workspace instead of static reference text. That is a workflow boundary, not just one extra feature.`,
    database_structure: `${w} fits this ${p} because stronger note structure affects more than initial organization. It changes how notes can be grouped, how much manual browsing is needed during daily work, and whether the archive can expand into a larger system without losing coherence.`,
    general: `${w} fits this ${p} because the winning mechanism improves setup, daily retrieval, and long-term note structure rather than solving only one narrow problem.`,
  };
  return sentence(depth[context.archetype] || depth.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "simplicity") {
    const simple = {
      database_structure: [
        { tool: context.winnerSide, fails_when: `${w} becomes too shallow when notes genuinely need stronger hierarchy, richer grouping, or a more structured page system to stay usable.`, what_to_do_instead: `Choose ${l} if plain note flow is no longer enough to carry the archive.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the user keeps paying structure cost before the note itself is even written.`, what_to_do_instead: `Choose ${w} when immediate writing matters more than a heavier note system.` },
      ],
      editor_model: [
        { tool: context.winnerSide, fails_when: `${w} becomes limiting when the note has to hold richer layouts or mixed content that plain writing cannot represent well.`, what_to_do_instead: `Choose ${l} if page-building depth is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when interface choices keep interrupting straightforward writing and editing.`, what_to_do_instead: `Choose ${w} when a calmer editor is the real advantage.` },
      ],
      knowledge_system: [
        { tool: context.winnerSide, fails_when: `${w} becomes too narrow when the archive truly needs backlinks, deeper link behavior, or custom workflow extensions to stay useful.`, what_to_do_instead: `Choose ${l} if the notes are now meant to behave like a full knowledge system.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when system-building keeps outrunning actual note-taking.`, what_to_do_instead: `Choose ${w} when capture speed and lower overhead matter more than extensibility.` },
      ],
      trust_clarity: [
        { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user genuinely needs the stronger privacy or control model that the losing tool provides.`, what_to_do_instead: `Choose ${l} if the extra concepts are now worth carrying.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when uncertainty about sync, storage, or security keeps surfacing during normal use.`, what_to_do_instead: `Choose ${w} when predictable note behavior matters more.` },
      ],
      short_horizon: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited if the same note system is expected to last well beyond the short course or temporary project.`, what_to_do_instead: `Choose ${l} if long-term depth now matters more than fast adoption.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when learning and setup consume too much of the short payoff window.`, what_to_do_instead: `Choose ${w} when the tool needs to start helping immediately.` },
      ],
      maintenance_burden: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when the archive truly needs the broader cross-platform control or document features of the losing tool.`, what_to_do_instead: `Choose ${l} if that added environment is earning its upkeep.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when plan choices, cleanup rituals, or system care keep becoming part of the note workflow.`, what_to_do_instead: `Choose ${w} when the archive should run more quietly.` },
      ],
      portability: [
        { tool: context.winnerSide, fails_when: `${w} becomes too plain if the user is ready to commit to a heavier note model for deeper capability.`, what_to_do_instead: `Choose ${l} if easy exit is no longer the main constraint.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when exporting, sharing, or leaving later becomes harder than the note problem itself.`, what_to_do_instead: `Choose ${w} when lower switching cost matters more.` },
      ],
      capture_speed: [
        { tool: context.winnerSide, fails_when: `${w} becomes too light when notes need more post-capture structure than quick entry can provide.`, what_to_do_instead: `Choose ${l} if slower entry now buys useful organization later.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the idea is gone before the note is ready to receive it.`, what_to_do_instead: `Choose ${w} when capture speed is the decisive need.` },
      ],
      visual_canvas: [
        { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the work really depends on spatial layout and freeform visual grouping.`, what_to_do_instead: `Choose ${l} if the canvas is doing real thinking work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when layout choices keep slowing ordinary note capture and review.`, what_to_do_instead: `Choose ${w} when text-first clarity matters more.` },
      ],
      general: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited once the deeper system the loser offers is genuinely necessary.`, what_to_do_instead: `Choose ${l} if the added structure is now worth the cost.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when its extra layers keep showing up before the note itself can do useful work.`, what_to_do_instead: `Choose ${w} when lower friction is the real gain.` },
      ],
    };
    return simple[context.archetype] || simple.general;
  }
  const depth = {
    knowledge_system: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the archive does not actually need deep links, plugin expansion, or a customizable note system.`, what_to_do_instead: `Choose ${l} if calmer note capture matters more than extensibility.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when notes need to behave like a connected system and the user keeps running into isolated pages or closed limits.`, what_to_do_instead: `Choose ${w} when deeper linking and extensibility are central.` },
    ],
    retrieval_depth: [
      { tool: context.winnerSide, fails_when: `${w} becomes more system than the archive requires when direct browsing is still faster than advanced search logic.`, what_to_do_instead: `Choose ${l} if the library is still small enough to navigate simply.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the archive grows and the user keeps doing manual retrieval work that search and smart grouping should absorb.`, what_to_do_instead: `Choose ${w} when advanced retrieval has become a real operating need.` },
    ],
    coding_notebook: [
      { tool: context.winnerSide, fails_when: `${w} becomes unnecessary overhead when the work no longer needs executable notes and would be better served by a simpler writing surface.`, what_to_do_instead: `Choose ${l} if static narrative notes are enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when code and explanation have to stay together in one live environment.`, what_to_do_instead: `Choose ${w} when native execution is part of the note job.` },
    ],
    database_structure: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the notes never grow beyond straightforward pages and light organization.`, what_to_do_instead: `Choose ${l} if simpler writing flow matters more than structure.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the archive needs stronger organization than plain folders or loose pages can provide.`, what_to_do_instead: `Choose ${w} when structure has become a real advantage.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the deeper mechanism is not doing enough real work yet.`, what_to_do_instead: `Choose ${l} if the simpler note model is still sufficient.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the archive keeps hitting the exact limit named in the rule.`, what_to_do_instead: `Choose ${w} once that deeper capability matters daily.` },
    ],
  };
  return depth[context.archetype] || depth.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  if (context.orientation === "depth") {
    const depthCases = {
      knowledge_system: `This can flip if the archive stays small enough that calmer note capture matters more than backlinks, plugins, or a deeper knowledge graph. Then ${l} may be the better fit.`,
      retrieval_depth: `This can flip if direct browsing stays faster than advanced search and smart grouping because the archive never grows large enough to need them. Then ${l} may be enough.`,
      coding_notebook: `This can flip if the work shifts back toward mostly prose and static reference notes rather than executable notebooks. Then ${l} may be the better choice.`,
      database_structure: `This can flip if the archive remains simple enough that stronger note structure never pays back its added setup and navigation cost. Then ${l} may feel better.`,
      general: `This can flip if the deeper mechanism stops doing enough daily work to justify its added complexity. Then ${l} may be the better tradeoff.`,
    };
    return sentence(depthCases[context.archetype] || depthCases.general);
  }
  const cases = {
    database_structure: `This can flip if the note archive genuinely needs stronger page structure, databases, or hierarchy and the extra setup is doing real daily work. Then ${l} may be worth the added complexity.`,
    editor_model: `This can flip if the user wants notes to double as richer pages with mixed content, layouts, or embeds rather than mostly text. Then ${l} may fit better.`,
    knowledge_system: `This can flip if the notes are explicitly becoming a long-term knowledge system and deeper linking or customization is now central. Then ${l} may make more sense.`,
    retrieval_depth: `This can flip if the archive grows large enough that advanced search, smart groups, or stronger retrieval logic save real time every day. Then ${l} may be easier to justify.`,
    trust_clarity: `This can flip if the user is willing to learn the more complex trust model because stronger privacy or control is now the main goal. Then ${l} may be worth it.`,
    short_horizon: `This can flip if the same note system will continue well beyond the short course or temporary need. Then ${l} may justify its longer learning curve.`,
    maintenance_burden: `This can flip if broader cross-platform access or heavier document features matter enough to justify more ongoing upkeep. Then ${l} may be the better tradeoff.`,
    portability: `This can flip if easy exit stops being important and the user is ready to commit to a deeper note system for the long haul. Then ${l} may be the better fit.`,
    capture_speed: `This can flip if quick note capture is no longer the main constraint and richer post-capture structure starts paying back the slower start. Then ${l} may be worth it.`,
    visual_canvas: `This can flip if freeform spatial arrangement is not a distraction but the reason the notes become useful. Then ${l} may be the better tool.`,
    coding_notebook: `This can flip if the work turns back into mostly prose and code execution is no longer part of the note-taking job. Then ${l} may be sufficient.`,
    general: `This can flip if the extra depth the losing tool provides starts doing real work instead of just adding more surface area. Then ${l} may be worth the tradeoff.`,
  };
  return sentence(cases[context.archetype] || cases.general);
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "depth") {
    const depthRules = {
      knowledge_system: [
        `Choose ${w} if notes need links, plugins, or a deeper knowledge graph now.`,
        `Choose ${l} if calmer note capture matters more than extensibility.`,
        `Avoid ${l} when isolated notes keep limiting a growing knowledge system.`,
      ],
      retrieval_depth: [
        `Choose ${w} if advanced search or smart grouping now saves real time.`,
        `Choose ${l} if the archive is still small enough to browse directly.`,
        `Avoid ${l} when manual retrieval is becoming a daily tax.`,
      ],
      coding_notebook: [
        `Choose ${w} if code execution belongs inside the note.`,
        `Choose ${l} if a simpler writing surface is enough.`,
        `Avoid ${l} when static notes keep splitting code from explanation.`,
      ],
      database_structure: [
        `Choose ${w} if the archive needs stronger structure right now.`,
        `Choose ${l} if faster writing matters more than deeper organization.`,
        `Avoid ${l} when simple pages keep forcing manual workarounds.`,
      ],
      general: [
        `Choose ${w} when the deeper mechanism in the rule is already doing real work.`,
        `Choose ${l} when the simpler alternative is still enough.`,
        `Avoid ${l} when the same limit keeps repeating across daily note use.`,
      ],
    };
    return depthRules[context.archetype] || depthRules.general;
  }
  const rules = {
    database_structure: [
      `Choose ${w} if writing should start before note structure becomes a project.`,
      `Choose ${l} if pages, databases, or hierarchy are doing real organization work.`,
      `Avoid ${l} when structure is arriving earlier than the note needs it.`,
    ],
    editor_model: [
      `Choose ${w} if the editor should stay focused on text.`,
      `Choose ${l} if richer page building matters more than a calmer writing surface.`,
      `Avoid ${l} when interface choices keep interrupting writing momentum.`,
    ],
    knowledge_system: [
      `Choose ${w} if the main job is dependable note-taking without building a system first.`,
      `Choose ${l} if links, plugins, or a deeper knowledge graph are central now.`,
      `Avoid ${l} when system-building is outrunning actual writing.`,
    ],
    retrieval_depth: [
      `Choose ${w} if advanced search or smart grouping now saves real time.`,
      `Choose ${l} if the archive is still small enough to browse directly.`,
      `Avoid ${l} when manual retrieval is becoming a daily tax.`,
    ],
    trust_clarity: [
      `Choose ${w} if note behavior should feel predictable from the start.`,
      `Choose ${l} if stronger privacy or control is worth more complexity.`,
      `Avoid ${l} when sync or security concepts keep creating hesitation.`,
    ],
    short_horizon: [
      `Choose ${w} if the tool has to pay back within one term or short project.`,
      `Choose ${l} if you are really investing in a longer note system.`,
      `Avoid ${l} when the learning curve is longer than the useful window.`,
    ],
    maintenance_burden: [
      `Choose ${w} if notes should run quietly for years.`,
      `Choose ${l} if broader access or features are worth periodic upkeep.`,
      `Avoid ${l} when plans, limits, or cleanup rituals keep surfacing.`,
    ],
    portability: [
      `Choose ${w} if easy sharing or leaving later matters now.`,
      `Choose ${l} if long-term depth matters more than switching cost.`,
      `Avoid ${l} when lock-in is becoming part of the problem.`,
    ],
    capture_speed: [
      `Choose ${w} if ideas have to land in seconds.`,
      `Choose ${l} if slower entry buys structure you genuinely use later.`,
      `Avoid ${l} when the note takes too long to begin.`,
    ],
    visual_canvas: [
      `Choose ${w} if notes should stay text-first.`,
      `Choose ${l} if spatial arrangement is part of how you think.`,
      `Avoid ${l} when layout choices keep replacing writing choices.`,
    ],
    coding_notebook: [
      `Choose ${w} if code execution belongs inside the note.`,
      `Choose ${l} if a simpler writing surface is enough.`,
      `Avoid ${l} when static notes keep splitting code from explanation.`,
    ],
    general: [
      `Choose ${w} when the friction in the rule is already affecting daily note work.`,
      `Choose ${l} when the simpler or deeper alternative is clearly doing real work now.`,
      `Avoid ${l} when the same limit keeps repeating across setup and use.`,
    ],
  };
  return rules[context.archetype] || rules.general;
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "simplicity") {
    const simple = {
      database_structure: [
        { q: `Why does ${w} win on more than setup`, a: `${w} also reduces the daily navigation and mental load that come from carrying a heavier page structure than the writing actually needs.` },
        { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when notes need stronger hierarchy, databases, or a broader workspace right now.` },
        { q: `What usually makes ${l} feel too heavy`, a: `The user keeps organizing pages and containers before the note itself becomes useful.` },
        { q: `Is this only about beginner friendliness`, a: `No. Even experienced users can lose momentum when structure arrives earlier than the writing needs it.` },
      ],
      editor_model: [
        { q: `Why does a busier editor change the recommendation`, a: `Because the same interface choices slow the start, interrupt routine editing, and raise the amount of visual clutter the user has to ignore.` },
        { q: `When is ${l} still the better fit`, a: `${l} is better when the note truly needs richer layout, embeds, or mixed content instead of mostly text.` },
        { q: `What usually makes ${l} fail first`, a: `The user keeps seeing and managing page-building options that are unrelated to the sentence they are trying to write.` },
        { q: `Does ${w} only win by being basic`, a: `No. It wins by keeping the writing path shorter and calmer.` },
      ],
      knowledge_system: [
        { q: `Why can a lighter note tool win here`, a: `Because links, plugins, and vault concepts can create setup and cognitive overhead before they improve the actual note-taking habit.` },
        { q: `When is ${l} still the better choice`, a: `${l} is the better choice once the archive is intentionally becoming a connected knowledge system.` },
        { q: `What usually makes ${l} the wrong fit`, a: `System-building keeps taking attention that should have gone to capturing and using the notes.` },
        { q: `Does ${w} block future growth`, a: `Not necessarily. It mainly avoids paying for deep system behavior before it is truly needed.` },
      ],
      trust_clarity: [
        { q: `Why does trust matter so much in this comparison`, a: `Because uncertainty around sync, privacy, or storage becomes part of the writing experience if the user does not feel confident about what the tool is doing.` },
        { q: `When is ${l} still worth the complexity`, a: `${l} is still worth it when the user specifically wants the stronger privacy or control model it provides.` },
        { q: `What usually makes ${l} fail first`, a: `The user keeps hesitating because note safety or sync behavior never feels fully clear.` },
        { q: `Is this only about features`, a: `No. It is also about how safe the archive feels to operate day to day.` },
      ],
      short_horizon: [
        { q: `Why does time horizon matter this much`, a: `Because learning and setup only make sense if there is enough time left for the note system to pay back its cost.` },
        { q: `When is ${l} still worth it`, a: `${l} is still worth it when the same system will continue beyond the current class or temporary project.` },
        { q: `What usually makes ${l} the wrong call`, a: `The term ends before the user has recovered the time spent learning the heavier tool.` },
        { q: `Does ${w} only win by being simpler`, a: `It also wins by matching the real payoff window.` },
      ],
      maintenance_burden: [
        { q: `Why does upkeep change the recommendation`, a: `Because the hidden work of plans, limits, or cleanup becomes part of the note system even when the editor itself is fine.` },
        { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when broader access or heavier document features are worth periodic maintenance.` },
        { q: `What usually signals ${l} is too much`, a: `The user keeps making account or organization decisions that are unrelated to the notes themselves.` },
        { q: `Is this only about subscriptions`, a: `No. It is about ongoing care load more broadly.` },
      ],
      portability: [
        { q: `Why is easy exit part of note quality here`, a: `Because the same tool has to work now without creating unnecessary rework later when the need changes.` },
        { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when deeper capability matters more than easy export, sharing, or switching.` },
        { q: `What usually makes ${l} feel sticky`, a: `Leaving or handing off notes starts requiring more adaptation than the original use case justified.` },
        { q: `Is this verdict anti-depth`, a: `No. It is about when commitment is worth it.` },
      ],
      capture_speed: [
        { q: `Why does note capture speed matter beyond convenience`, a: `Because slower note entry changes whether quick thoughts get recorded at all and whether the tool stays usable in real moments of interruption.` },
        { q: `When is ${l} still worth choosing`, a: `${l} is worth choosing when richer structure after entry matters more than immediate capture speed.` },
        { q: `What usually makes ${l} fail first`, a: `The thought is ready before the note is.` },
        { q: `Does ${w} only win for casual use`, a: `No. Fast capture can matter just as much for professionals and students under time pressure.` },
      ],
      visual_canvas: [
        { q: `Why can visual freedom be a problem`, a: `Because it can add layout decisions during setup, scanning, and reorganization even when the note itself is simple.` },
        { q: `When is ${l} still worth it`, a: `${l} is worth it when spatial arrangement is genuinely part of how the user thinks through the material.` },
        { q: `What usually makes ${l} the wrong fit`, a: `The user spends more time arranging notes than writing them.` },
        { q: `Does ${w} only win by being plain`, a: `No. It wins by keeping the note path more direct.` },
      ],
      general: [
        { q: `Why does ${w} fit the rule better`, a: `${w} keeps the same friction from spreading across setup, daily writing, and retrieval all at once.` },
        { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when its extra structure is already doing real work instead of only adding overhead.` },
        { q: `What usually signals it is time to switch`, a: `The heavier system stops feeling optional and starts repeating the same friction every day.` },
        { q: `Is this only about simplicity`, a: `No. It is about where the real operating cost shows up in note-taking.` },
      ],
    };
    return (simple[context.archetype] || simple.general).map((item) => ({
      q: sentence(item.q).slice(0, -1) + "?",
      a: sentence(item.a),
    }));
  }
  const depth = {
    knowledge_system: [
      { q: `Why do links and extensibility matter so much here`, a: `Because they affect how notes connect, how quickly related ideas can be rediscovered, and how well the system scales over time.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the archive is mostly straightforward notes and deeper system behavior would stay unused.` },
      { q: `What usually pushes someone toward ${w}`, a: `The user keeps wanting notes to relate, surface, and evolve in ways the simpler tool cannot support cleanly.` },
      { q: `Does ${w} automatically mean more complexity`, a: `Yes, some, but that complexity can remove manual workaround work once the archive is large enough.` },
    ],
    retrieval_depth: [
      { q: `Why does stronger search change the recommendation`, a: `Because the same retrieval mechanism affects daily speed, archive scale, and how much manual reorganization the user has to keep doing.` },
      { q: `When is ${l} still the better choice`, a: `${l} is still better when the archive is small enough that direct browsing is faster than advanced queries.` },
      { q: `What usually makes ${l} feel too shallow`, a: `The user keeps losing time to repeated manual searching that a better retrieval layer should absorb.` },
      { q: `Is this only about power features`, a: `No. It is about whether a growing note library remains usable.` },
    ],
    coding_notebook: [
      { q: `Why do native code cells matter here`, a: `Because they keep explanation and execution in one workflow instead of splitting notes from experiments.` },
      { q: `When is ${l} still sufficient`, a: `${l} is still sufficient when the notes are mainly static explanation rather than live technical work.` },
      { q: `What usually pushes someone toward ${w}`, a: `The user needs to test ideas in place instead of only describing them.` },
      { q: `Does ${w} only help programmers`, a: `It mainly helps anyone whose notes need to behave like an executable workspace.` },
    ],
    database_structure: [
      { q: `Why does stronger note structure matter beyond setup`, a: `Because it changes how notes are grouped, revisited, and expanded once the archive grows.` },
      { q: `When is ${l} still better`, a: `${l} is still better when notes remain mostly straightforward text and faster writing matters more than extra structure.` },
      { q: `What usually makes ${l} the wrong fit`, a: `The archive needs more organization than a simpler note model can keep handling cleanly.` },
      { q: `Does ${w} always mean more overhead`, a: `Yes, some, but it can pay back if the structure removes repeated browsing and workarounds.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} turns the mechanism in the decision rule into gains across setup, daily retrieval, and long-term note structure instead of only one narrow feature win.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when the deeper capability is not yet doing enough work to justify itself.` },
      { q: `What usually signals it is time to switch`, a: `The same limit keeps appearing in more than one part of the note workflow.` },
      { q: `Is this only about complexity`, a: `No. It is about whether the deeper mechanism is now operationally useful.` },
    ],
  };
  return (depth[context.archetype] || depth.general).map((item) => ({
    q: sentence(item.q).slice(0, -1) + "?",
    a: sentence(item.a),
  }));
}

function bulletBucket(text) {
  return /setup|before writing|understood first|learning|onboarding|start|blank page|capture the note|first note|project/i.test(text) ? "setup"
    : /daily|routine|write|writing|editing|capture|workflow|study|submission|day-to-day/i.test(text) ? "workflow"
      : /find|retriev|search|query|smart group|backlink|graph|related|navigate|path|browse/i.test(text) ? "navigation"
        : /database|page|workspace|folder|hierarchy|link|plugin|vault|structure|organize|canvas|block/i.test(text) ? "structure"
          : /mental|clutter|anxiety|confusing|trust|hesitation|overhead|calm|predictable/i.test(text) ? "cognitive"
            : /sync|export|share|submission|switch|portability|privacy|security|encrypt/i.test(text) ? "integration"
              : "general";
}

function repeatedPage(doc) {
  const persona = (doc.sections || []).find((section) => section.type === "persona_fit")?.content || "";
  const xBullets = ((doc.sections || []).find((section) => section.type === "x_wins")?.bullets) || [];
  const yBullets = ((doc.sections || []).find((section) => section.type === "y_wins")?.bullets) || [];
  const xBuckets = new Set(xBullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
  const yBuckets = new Set(yBullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
  return xBuckets.size < 3 || yBuckets.size < 3 || /the right tool should|anything that|you just want|you dislike multifunction tools|you build a long-term knowledge system/i.test(persona);
}

function shouldRewriteSection(doc, section) {
  if (section.type === "persona_fit") return /the right tool should|anything that|you just want|you dislike multifunction tools|you build a long-term knowledge system|best fit/i.test(section.content || "") || repeatedPage(doc);
  if (section.type === "x_wins" || section.type === "y_wins") {
    const bullets = section.bullets || [];
    const buckets = new Set(bullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
    return buckets.size < 3 || bullets.some((bullet) => /however|though|this is useful, but|while powerful|can feel|introduce.*decisions/i.test(`${bullet.point} ${bullet.why_it_matters}`));
  }
  if (section.type === "failure_modes") return repeatedPage(doc) || (section.items || []).some((item) => /you want|you must decide|if you need|if you are/i.test(`${item.fails_when} ${item.what_to_do_instead}`));
  if (section.type === "edge_case") return repeatedPage(doc);
  if (section.type === "quick_rules") return repeatedPage(doc) || (section.rules || []).some((rule) => /one tap|blank page|quick lightweight|avoid .* systems/i.test(rule));
  return false;
}

function shouldRewriteFaqs(doc) {
  const faqs = doc.faqs || [];
  return faqs.length !== 4 || faqs.some((item) => /easier for beginners|only for simple notes|grow into|used for essays/i.test(`${item.q} ${item.a}`)) || repeatedPage(doc);
}

function rewritePage(doc) {
  const context = buildContext(doc);
  const rewrittenSections = [];
  const sections = (doc.sections || []).map((section) => {
    if (section.type === "persona_fit" && shouldRewriteSection(doc, section)) {
      rewrittenSections.push("persona_fit");
      return { ...section, heading: `Why ${context.winnerName} fits ${context.persona}s better`, content: buildPersonaFit(context) };
    }
    if (section.type === "x_wins" && shouldRewriteSection(doc, section)) {
      const bullets = context.winnerSide === "x"
        ? (context.orientation === "depth" ? winnerBullets(context) : simplicityWinnerBullets(context))
        : (context.orientation === "depth" ? loserBullets(context) : simplicityLoserBullets(context));
      rewrittenSections.push("x_wins");
      return { ...section, heading: `Where ${context.xName} wins`, bullets };
    }
    if (section.type === "y_wins" && shouldRewriteSection(doc, section)) {
      const bullets = context.winnerSide === "y"
        ? (context.orientation === "depth" ? winnerBullets(context) : simplicityWinnerBullets(context))
        : (context.orientation === "depth" ? loserBullets(context) : simplicityLoserBullets(context));
      rewrittenSections.push("y_wins");
      return { ...section, heading: `Where ${context.yName} wins`, bullets };
    }
    if (section.type === "failure_modes" && shouldRewriteSection(doc, section)) {
      rewrittenSections.push("failure_modes");
      return { ...section, heading: "Where each tool can break down", items: buildFailureModes(context) };
    }
    if (section.type === "edge_case" && shouldRewriteSection(doc, section)) {
      rewrittenSections.push("edge_case");
      return { ...section, heading: "When this verdict might flip", content: buildEdgeCase(context) };
    }
    if (section.type === "quick_rules" && shouldRewriteSection(doc, section)) {
      rewrittenSections.push("quick_rules");
      return { ...section, heading: "Quick decision rules", rules: buildQuickRules(context) };
    }
    return section;
  });

  let nextDoc = { ...doc, sections, related_pages: [] };
  if (shouldRewriteFaqs(doc)) {
    nextDoc = { ...nextDoc, faqs: buildFaqs(context) };
    rewrittenSections.push("faqs");
  }
  return { nextDoc, rewrittenSections };
}

function main() {
  const files = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith(".json"));
  const changed = [];
  const skipped = [];
  let totalScanned = 0;

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const doc = readJson(filePath);
    if (doc.categorySlug !== "note-taking-apps") continue;
    totalScanned += 1;

    const { nextDoc, rewrittenSections } = rewritePage(doc);
    if (JSON.stringify(nextDoc) !== JSON.stringify(doc)) {
      writeJson(filePath, nextDoc);
      changed.push({
        filePath: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        title: doc.title,
        sections: rewrittenSections.length ? rewrittenSections : ["related_pages"],
      });
    } else {
      skipped.push(path.relative(ROOT, filePath).replace(/\\/g, "/"));
    }
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const reportLines = [
    "# Note-taking Apps Second Pass Report",
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    `- Pages scanned: ${totalScanned}`,
    `- Pages expanded: ${changed.length}`,
    `- Sections rewritten: ${changed.reduce((sum, page) => sum + page.sections.length, 0)}`,
    `- Pages skipped: ${skipped.length}`,
    "",
    "## Expanded Pages",
    "",
    ...changed.flatMap((page) => [
      `- File path: ${page.filePath}`,
      `  Title: ${page.title}`,
      `  Sections rewritten: ${page.sections.join(", ")}`,
    ]),
    "",
    "## Skipped Pages",
    "",
    ...(skipped.length ? skipped.map((file) => `- ${file}`) : ["- None"]),
    "",
  ];
  fs.writeFileSync(REPORT_PATH, `${reportLines.join("\n")}\n`);
  console.log(JSON.stringify({
    reportPath: REPORT_PATH,
    pagesScanned: totalScanned,
    pagesExpanded: changed.length,
    sectionsRewritten: changed.reduce((sum, page) => sum + page.sections.length, 0),
    pagesSkipped: skipped.length,
  }, null, 2));
}

main();
