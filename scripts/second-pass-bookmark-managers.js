/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "bookmark-managers-second-pass-report.md");
const ALLOWED_SECTIONS = new Set(["persona_fit", "x_wins", "y_wins", "failure_modes", "edge_case", "quick_rules"]);

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

function detectMode(rule) {
  const value = lower(rule);
  if (/manual control over tags and folder structures/.test(value)) return "manual_structure";
  if (/collections|adding metadata during capture|learning collection systems|configuring layouts/.test(value)) return "capture_structure_burden";
  if (/full-page archival with local storage control|full-page archival|full local archival/.test(value)) return "local_archive";
  if (/sharing bookmarks requires manually formatting or explaining plain link lists/.test(value)) return "share_presentation";
  if (/local file storage and visual asset organization/.test(value)) return "local_visual_assets";
  if (/switching to a separate bookmarking app/.test(value)) return "in_workspace_access";
  if (/self-hosted system|self-hosted instance/.test(value)) return "self_host_burden";
  if (/manual tagging instead of automatic indexing for search/.test(value)) return "automatic_search";
  if (/visual mapping/.test(value)) return "visual_mapping";
  if (/visual previews/.test(value)) return "visual_scanning";
  if (/automatic resurfacing/.test(value)) return "resurfacing";
  if (/separate tools for notes and links/.test(value)) return "mixed_content_workspace";
  return "general";
}

function detectOrientation(mode) {
  if (["manual_structure", "local_archive", "share_presentation", "local_visual_assets", "in_workspace_access", "automatic_search", "visual_mapping", "visual_scanning", "resurfacing", "mixed_content_workspace"].includes(mode)) return "strength";
  if (["capture_structure_burden", "self_host_burden"].includes(mode)) return "burden";
  return "strength";
}

function buildContext(doc) {
  const { xName, yName } = parsePair(doc.title);
  const winnerSide = doc.verdict?.winner === "x" ? "x" : "y";
  const loserSide = winnerSide === "x" ? "y" : "x";
  const rule = doc.verdict?.decision_rule || "";
  const mode = detectMode(rule);
  return {
    xName,
    yName,
    winnerSide,
    loserSide,
    winnerName: winnerSide === "x" ? xName : yName,
    loserName: winnerSide === "x" ? yName : xName,
    persona: doc.persona,
    personaNoun: personaNoun(doc.persona),
    rule,
    mode,
    orientation: detectOrientation(mode),
  };
}

function strengthWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    manual_structure: [
      { point: `${w} lets the user decide exactly how tags and folders should work instead of hiding that structure behind automation`, why_it_matters: `Manual control makes the library easier to shape around a deliberate system instead of accepting whatever the app infers.` },
      { point: `${w} keeps day-to-day retrieval aligned with the structure the user actually trusts`, why_it_matters: `That matters when finding a bookmark quickly depends on a personally maintained organization model.` },
      { point: `${w} leaves more room for the bookmark system to evolve intentionally`, why_it_matters: `A power user can refine the taxonomy over time instead of relying on a fixed organizational approach.` },
    ],
    local_archive: [
      { point: `${w} stores more than bookmark references by keeping full page copies under local control`, why_it_matters: `The user is not relying on the original site or a hosted bookmark service to preserve access.` },
      { point: `${w} changes daily use from linking to pages into owning saved copies`, why_it_matters: `That matters when a bookmark system needs to preserve content instead of only pointing back to the web.` },
      { point: `${w} gives long-term storage strategy to the user instead of the service`, why_it_matters: `Local control becomes critical when the bookmark collection is really an archive.` },
    ],
    share_presentation: [
      { point: `${w} makes shared bookmark sets easier to understand without extra explanation`, why_it_matters: `Recipients can grasp the collection faster when the presentation does more than expose a raw link list.` },
      { point: `${w} reduces daily coordination overhead around sharing resources`, why_it_matters: `The user spends less time packaging or describing links before someone else can use them.` },
      { point: `${w} gives shared bookmarks a clearer structure for collaboration`, why_it_matters: `That matters when link collections are part of a client, team, or presentation workflow.` },
    ],
    local_visual_assets: [
      { point: `${w} supports a bookmark library that also behaves like a local asset system`, why_it_matters: `Files, images, and referenced material can live together instead of being split across separate tools.` },
      { point: `${w} keeps daily browsing more visual than a standard cloud bookmark list`, why_it_matters: `That matters when recognition by thumbnail or asset type is faster than reading titles alone.` },
      { point: `${w} gives the collection a richer data shape than ordinary web links`, why_it_matters: `The system scales better when saved items include local media and visual references rather than only URLs.` },
    ],
    in_workspace_access: [
      { point: `${w} keeps bookmarks inside the workspace where the user is already doing adjacent work`, why_it_matters: `The user does not have to break flow by jumping into a separate bookmarking app.` },
      { point: `${w} shortens the daily path between finding a link and using it in the current project`, why_it_matters: `That matters when bookmarks support planning or execution rather than acting as a separate library.` },
      { point: `${w} gives saved links a clearer place inside the broader work system`, why_it_matters: `The bookmark feature becomes part of the same operating surface instead of another tool to maintain.` },
    ],
    automatic_search: [
      { point: `${w} turns saved pages into something searchable without requiring a tag entry ritual`, why_it_matters: `The user can rely on page content instead of remembering exactly how an item was labeled.` },
      { point: `${w} keeps daily retrieval faster because search quality does not depend on tagging discipline`, why_it_matters: `That matters when bookmarks are captured quickly and organization should not slow them down.` },
      { point: `${w} gives the library a stronger discovery layer as it grows`, why_it_matters: `Automatic indexing scales better once the collection is too large to manage through manual labels alone.` },
    ],
    visual_mapping: [
      { point: `${w} gives bookmarks a spatial organization model instead of only folders and lists`, why_it_matters: `The user can understand relationships between items without flattening everything into collection trees.` },
      { point: `${w} changes daily navigation from searching down a folder path to moving through a visual map`, why_it_matters: `That matters when seeing context is faster than recalling a classification path.` },
      { point: `${w} leaves more room for exploratory organization as the system grows`, why_it_matters: `Visual mapping helps when the bookmark collection behaves more like an idea network than a filing cabinet.` },
    ],
    visual_scanning: [
      { point: `${w} makes bookmark review faster by giving visual cues instead of text-heavy lists alone`, why_it_matters: `Previews reduce the time spent re-parsing titles and URLs to remember what each saved item is.` },
      { point: `${w} keeps daily navigation lighter when many bookmarks need to be skimmed quickly`, why_it_matters: `That matters when recognition by preview is faster than keyword recall.` },
      { point: `${w} gives the collection a more browseable structure`, why_it_matters: `Visual scanning scales better when the library is used often during the day.` },
    ],
    resurfacing: [
      { point: `${w} brings old bookmarks back into view without requiring deliberate search every time`, why_it_matters: `Important links can reappear when they are relevant instead of staying buried in storage.` },
      { point: `${w} reduces daily recall work by making rediscovery part of the product`, why_it_matters: `That matters when the user wants saved material to return usefully, not just sit in a searchable archive.` },
      { point: `${w} gives the bookmark system a stronger re-engagement loop`, why_it_matters: `Automatic resurfacing helps the collection stay alive instead of becoming a static pile of links.` },
    ],
    mixed_content_workspace: [
      { point: `${w} keeps bookmarks, notes, and supporting material in one working surface`, why_it_matters: `The user can manage related context without switching between separate apps just to keep links useful.` },
      { point: `${w} shortens daily workflow by reducing handoffs between tools`, why_it_matters: `That matters when a saved link is only one part of the actual task or project.` },
      { point: `${w} gives the collection a richer structure than a link-only list`, why_it_matters: `The bookmark manager scales better when the real workflow includes notes and files alongside URLs.` },
    ],
    general: [
      { point: `${w} handles the winning bookmarking mechanism more directly`, why_it_matters: `The user spends less time compensating for the exact friction named in the decision rule.` },
      { point: `${w} keeps daily use smoother`, why_it_matters: `The workflow stays shorter and easier to repeat.` },
      { point: `${w} scales better once the bookmark system becomes more serious`, why_it_matters: `That matters when the mechanism in the rule affects setup, daily use, and long-term organization together.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function strengthLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    manual_structure: [
      { point: `${l} can still be better when the user prefers lighter automation over designing a manual taxonomy`, why_it_matters: `A simpler model may feel easier if explicit tag and folder control would mostly be overhead.` },
      { point: `${l} keeps daily organization lighter for users who do not want to tune the system by hand`, why_it_matters: `That matters when the bookmark library should work without much structural maintenance.` },
      { point: `${l} asks for less commitment to an explicitly curated organization model`, why_it_matters: `The lighter tradeoff can be better when deep structure control is not doing enough real work.` },
    ],
    local_archive: [
      { point: `${l} can still be better when the user mainly wants quick bookmarking rather than local archival ownership`, why_it_matters: `A hosted bookmark manager may feel easier when full-page preservation is not the actual goal.` },
      { point: `${l} keeps daily saving lighter than an archival workflow`, why_it_matters: `That matters when convenience matters more than preserving page content under local control.` },
      { point: `${l} may fit when the user values browseable bookmarks more than stored page copies`, why_it_matters: `The tradeoff only fails once archive control becomes central.` },
    ],
    share_presentation: [
      { point: `${l} can still be better when the collection is mainly for the owner's private use`, why_it_matters: `A plain link list may be enough if the bookmarks rarely need to be shared cleanly with others.` },
      { point: `${l} keeps the system lighter when presentation quality is not part of the job`, why_it_matters: `That matters when formatting shared resource lists would mostly be unnecessary overhead.` },
      { point: `${l} may fit when bookmarking is more about storage than communication`, why_it_matters: `The tradeoff only fails once shared presentation becomes important.` },
    ],
    local_visual_assets: [
      { point: `${l} can still be better when the user mainly wants a cloud bookmark manager rather than a local asset system`, why_it_matters: `A lighter web-first tool may be enough if local media organization is not part of the workflow.` },
      { point: `${l} keeps daily bookmarking narrower and easier to understand`, why_it_matters: `That matters when visual asset management would mostly be extra complexity.` },
      { point: `${l} asks for less commitment to a richer media-oriented library`, why_it_matters: `The simpler model can be better when links are the real job.` },
    ],
    in_workspace_access: [
      { point: `${l} can still be better when the user wants a dedicated bookmark library separate from work management`, why_it_matters: `A standalone app may feel cleaner if bookmarks do not need to live inside another workspace.` },
      { point: `${l} keeps bookmarking as its own focused job`, why_it_matters: `That matters when in-workspace access would mostly add coupling the user does not need.` },
      { point: `${l} may fit when the broader work system is not where bookmarks are actually used`, why_it_matters: `The tradeoff only fails once context switching becomes the real friction.` },
    ],
    automatic_search: [
      { point: `${l} can still be better when the user prefers explicit manual categorization`, why_it_matters: `A tag-driven model may feel more deliberate if search should reflect a chosen taxonomy rather than page indexing.` },
      { point: `${l} keeps the system simpler for users who trust their own labels more than automatic search`, why_it_matters: `That matters when indexing depth is not the actual reason for keeping bookmarks.` },
      { point: `${l} may fit when manual tag discipline is already part of the routine`, why_it_matters: `The tradeoff only fails once tagging becomes the bottleneck.` },
    ],
    visual_mapping: [
      { point: `${l} can still be better when the user wants conventional folders or collections instead of a spatial map`, why_it_matters: `List and folder structures may feel easier when visual relation mapping is not the goal.` },
      { point: `${l} keeps the library more traditional to navigate`, why_it_matters: `That matters when the user values predictable collection trees over exploratory visual arrangement.` },
      { point: `${l} may fit when visual mapping would mostly add complexity`, why_it_matters: `The tradeoff only fails once spatial organization is doing real work.` },
    ],
    visual_scanning: [
      { point: `${l} can still be better when the user prefers a lighter text-based system`, why_it_matters: `A minimal list may be enough if previews are not needed to recognize saved items.` },
      { point: `${l} keeps the interface narrower and less visually dense`, why_it_matters: `That matters when thumbnails and richer previews would mostly feel unnecessary.` },
      { point: `${l} may fit when bookmark review depends more on search than browsing`, why_it_matters: `The tradeoff only fails once visual scanning is the faster path.` },
    ],
    resurfacing: [
      { point: `${l} can still be better when the user wants a stable archive instead of automatic rediscovery`, why_it_matters: `A static bookmark store may feel more predictable if resurfacing is not part of the desired workflow.` },
      { point: `${l} keeps bookmarks under deliberate user control instead of app-driven reappearance`, why_it_matters: `That matters when rediscovery should happen through explicit search, not algorithmic prompting.` },
      { point: `${l} may fit when automatic resurfacing would mostly create noise`, why_it_matters: `The tradeoff only fails once remembering old links becomes the real problem.` },
    ],
    mixed_content_workspace: [
      { point: `${l} can still be better when the user only wants a simple bookmark archive`, why_it_matters: `A link-only tool may feel lighter if notes and files are not part of the actual workflow.` },
      { point: `${l} keeps the system narrower than a mixed-content workspace`, why_it_matters: `That matters when combining several content types would mostly add interface weight.` },
      { point: `${l} may fit when notes and files already live comfortably elsewhere`, why_it_matters: `The tradeoff only fails once switching between tools becomes the real drag.` },
    ],
    general: [
      { point: `${l} can still be better in a narrower bookmarking workflow`, why_it_matters: `The losing tool may fit when the winning mechanism is not doing much real work yet.` },
      { point: `${l} often offers a lighter tradeoff`, why_it_matters: `That can matter when the richer mechanism would mostly add overhead.` },
      { point: `${l} becomes more reasonable when complexity is not needed`, why_it_matters: `The friction only matters when it gets in the way of the actual bookmark job.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function burdenWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    capture_structure_burden: [
      { point: `${w} lets the user save first and organize later instead of demanding structure during capture`, why_it_matters: `The first action stays fast because collections, metadata, or layout choices are not interrupting the save moment.` },
      { point: `${w} keeps daily bookmarking on a shorter path`, why_it_matters: `Routine capture stays closer to one action instead of turning each link into a mini organization task.` },
      { point: `${w} lowers the cognitive load of building the library`, why_it_matters: `That matters when forced structure during capture is exactly what makes the tool feel heavier than it should.` },
    ],
    self_host_burden: [
      { point: `${w} gets bookmarking usable before hosting becomes a project`, why_it_matters: `The user can start saving links without dealing with servers, installs, or backend upkeep first.` },
      { point: `${w} keeps daily use separate from infrastructure maintenance`, why_it_matters: `Routine bookmarking stays focused on links instead of on keeping a service running.` },
      { point: `${w} lowers the technical overhead of adopting the tool`, why_it_matters: `That matters when self-hosting is exactly what is blocking a non-technical or beginner workflow.` },
    ],
    general: [
      { point: `${w} removes the burden introduced by the losing tool`, why_it_matters: `The user reaches useful bookmarking sooner.` },
      { point: `${w} keeps daily use more direct`, why_it_matters: `Routine saving and retrieval take fewer extra steps.` },
      { point: `${w} makes the system easier to operate without added overhead`, why_it_matters: `That matters when the burden named in the rule is the real source of friction.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function burdenLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    capture_structure_burden: [
      { point: `${l} can still be better when the user wants deliberate structure at the moment of saving`, why_it_matters: `Collections, metadata, or layout choices may be worth the extra step once organization quality matters more than capture speed.` },
      { point: `${l} supports a more explicit library shape from the start`, why_it_matters: `That matters when the user prefers to classify bookmarks immediately instead of deferring structure.` },
      { point: `${l} may scale better once front-loaded organization is doing real work`, why_it_matters: `The added capture burden only pays back when that structure is genuinely useful.` },
    ],
    self_host_burden: [
      { point: `${l} can still be better when the user wants hosting control and backend ownership`, why_it_matters: `The setup cost may be worth it once self-hosting is part of the reason for choosing the tool.` },
      { point: `${l} supports a more self-managed bookmark system later`, why_it_matters: `That matters when backend control becomes a real requirement instead of a blocker.` },
      { point: `${l} may fit when infrastructure decisions are intentional`, why_it_matters: `The extra setup only pays back when that backend control is part of the job.` },
    ],
    general: [
      { point: `${l} can still be better once the heavier model starts doing real work`, why_it_matters: `The added layer is not useless, just earlier than this use case needs.` },
      { point: `${l} may support a broader workflow later`, why_it_matters: `That matters once the winner's simpler path stops being enough.` },
      { point: `${l} becomes more reasonable when the extra complexity is intentional`, why_it_matters: `The friction only matters when it is not paying back.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function buildPersonaFit(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const p = context.personaNoun;
  if (context.orientation === "burden") {
    const text = {
      capture_structure_burden: `${w} fits this ${p} because ${l} is the tool introducing extra structure at the moment of capture, not ${w}. That adds more decisions before the bookmark is even saved, slows daily collection of links, and increases the amount of system thinking the user has to do while trying to move quickly. ${w} wins by keeping capture lighter before organization becomes a separate job.`,
      self_host_burden: `${w} fits this ${p} because ${l} is the tool asking for self-hosting or backend setup before the bookmark system feels ready, not ${w}. That front-loads technical decisions, keeps maintenance attached to normal use, and turns a simple link-saving tool into an infrastructure task. ${w} wins by making bookmarking useful before server work takes over.`,
      general: `${w} fits this ${p} because ${l} is the tool introducing the burden named in the decision rule, not ${w}. ${w} wins by keeping that same friction from showing up in setup, daily use, and long-term maintenance all at once.`,
    };
    return sentence(text[context.mode] || text.general);
  }
  const text = {
    manual_structure: `${w} fits this ${p} because direct control over tags and folders changes more than one organizational choice. It affects how the library is shaped up front, how confidently items can be retrieved later, and how much of the system is defined by the user instead of inferred by the app. ${w} wins by giving that structure to the person actually managing the collection.`,
    local_archive: `${w} fits this ${p} because local archival changes setup, daily trust, and long-term access together. It affects whether bookmarks are only references or preserved copies, whether the user depends on an external service for access, and how durable the collection feels over time. ${w} wins by keeping that archival control under the user's own storage system.`,
    share_presentation: `${w} fits this ${p} because shareable presentation changes both communication speed and coordination quality. It affects whether recipients can understand a bookmark set quickly, how much explanation the sender has to add, and whether shared resources feel like a usable collection instead of a raw dump of links. ${w} wins by packaging bookmarks in a form people can act on faster.`,
    local_visual_assets: `${w} fits this ${p} because local asset support changes the bookmark system into something broader than a link list. It affects what kinds of material can be stored, how quickly items can be recognized visually, and whether the collection can act like a working reference library instead of a pure URL archive. ${w} wins by giving visual and local assets a first-class place to live.`,
    in_workspace_access: `${w} fits this ${p} because keeping bookmarks inside the working environment changes both access speed and switching cost. It affects whether saved links are available where work is already happening, how many app jumps are required to use them, and whether bookmark retrieval feels like part of the task instead of a separate chore. ${w} wins by removing that extra app boundary.`,
    automatic_search: `${w} fits this ${p} because automatic indexing changes the retrieval model at several levels at once. It affects whether search depends on manual tags, how fast an item can be found later, and how well the bookmark library keeps working even when capture happens quickly. ${w} wins by letting search carry more of the retrieval burden.`,
    visual_mapping: `${w} fits this ${p} because visual mapping changes both organization and navigation. It affects whether relationships between bookmarks can be seen spatially, how much context is visible at once, and whether the collection behaves more like a map of ideas than a stack of folders. ${w} wins by giving that visual structure real operational value.`,
    visual_scanning: `${w} fits this ${p} because visual previews change daily retrieval speed and browsing effort together. They affect how quickly saved items can be recognized, how much title-reading is needed to reorient, and whether the library is easier to skim under time pressure. ${w} wins by making scanning part of the core workflow.`,
    resurfacing: `${w} fits this ${p} because automatic resurfacing changes what it means to save a bookmark in the first place. It affects whether old links have to be remembered explicitly, how often useful material returns to view, and whether the collection stays active instead of becoming a static archive. ${w} wins by making rediscovery part of the product rather than leaving it entirely to search.`,
    mixed_content_workspace: `${w} fits this ${p} because mixed-content organization changes both workflow speed and structural fit. It affects whether links, notes, and files stay together, how often the user has to switch tools for context, and whether the bookmark manager can support real project work instead of only storing URLs. ${w} wins by keeping those related materials in one place.`,
    general: `${w} fits this ${p} because the winning mechanism improves setup, daily bookmarking, and longer-term organization instead of solving only one narrow problem.`,
  };
  return sentence(text[context.mode] || text.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    const items = {
      capture_structure_burden: [
        { tool: context.winnerSide, fails_when: `${w} becomes too light when the user really wants collections, metadata, or layout choices locked in at the moment of capture.`, what_to_do_instead: `Choose ${l} if front-loaded organization is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when collection choice, metadata entry, or layout configuration keeps interrupting simple capture.`, what_to_do_instead: `Choose ${w} when fast saving matters more than immediate structure.` },
      ],
      self_host_burden: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when the user now wants backend control and self-hosted ownership badly enough to justify setup.`, what_to_do_instead: `Choose ${l} if infrastructure control has become part of the requirement.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when hosting and maintenance keep standing between the user and ordinary bookmarking.`, what_to_do_instead: `Choose ${w} when the tool has to work before server setup does.` },
      ],
      general: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited once the heavier mechanism is actually doing enough work to justify itself.`, what_to_do_instead: `Choose ${l} if the added layer is now worth carrying.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the same overhead keeps showing up before useful bookmarking can happen.`, what_to_do_instead: `Choose ${w} when the simpler path is the real gain.` },
      ],
    };
    return items[context.mode] || items.general;
  }
  const items = {
    manual_structure: [
      { tool: context.winnerSide, fails_when: `${w} becomes too demanding when the user would rather let the system stay lighter than manage a deliberate taxonomy by hand.`, what_to_do_instead: `Choose ${l} if looser organization now fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user needs explicit control over tags and folder structures instead of a more inferred model.`, what_to_do_instead: `Choose ${w} when manual structure matters daily.` },
    ],
    local_archive: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the user mainly wants a quick bookmark manager instead of full local page preservation.`, what_to_do_instead: `Choose ${l} if archival depth is not the real need.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when bookmarked pages need to be preserved under local control rather than left as external references.`, what_to_do_instead: `Choose ${w} when full archival control matters.` },
    ],
    share_presentation: [
      { tool: context.winnerSide, fails_when: `${w} becomes too elaborate when bookmark sets are mainly private and do not need polished sharing.`, what_to_do_instead: `Choose ${l} if a simple personal list is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when people keep needing extra explanation to understand and use a plain shared link list.`, what_to_do_instead: `Choose ${w} when shared presentation quality matters.` },
    ],
    local_visual_assets: [
      { tool: context.winnerSide, fails_when: `${w} becomes too broad when the user only wants a standard bookmark manager and not a local asset system.`, what_to_do_instead: `Choose ${l} if simple cloud-style bookmarking fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the collection needs local files and richer visual asset organization instead of only saved links.`, what_to_do_instead: `Choose ${w} when visual asset storage matters.` },
    ],
    in_workspace_access: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user wants bookmarks in a dedicated library rather than inside the working app.`, what_to_do_instead: `Choose ${l} if a separate bookmark app now fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when bookmark access keeps requiring a jump into a separate app before the link can be used in the current task.`, what_to_do_instead: `Choose ${w} when in-workspace access matters.` },
    ],
    automatic_search: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user prefers explicit tag-based organization over search-driven retrieval.`, what_to_do_instead: `Choose ${l} if manual categories are the actual preference.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when retrieval keeps depending on tags the user did not add or cannot remember later.`, what_to_do_instead: `Choose ${w} when automatic indexing matters more.` },
    ],
    visual_mapping: [
      { tool: context.winnerSide, fails_when: `${w} becomes too much when the user would rather navigate conventional collections than a visual map.`, what_to_do_instead: `Choose ${l} if folders and lists fit better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user needs to see relationships between saved items instead of flattening everything into collections.`, what_to_do_instead: `Choose ${w} when visual mapping is doing real work.` },
    ],
    visual_scanning: [
      { tool: context.winnerSide, fails_when: `${w} becomes too visually heavy when the user prefers a simple text-first bookmark system.`, what_to_do_instead: `Choose ${l} if text-based browsing is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when text-heavy lists slow down recognition and scanning under time pressure.`, what_to_do_instead: `Choose ${w} when preview-based browsing matters.` },
    ],
    resurfacing: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user wants a static archive rather than app-driven rediscovery.`, what_to_do_instead: `Choose ${l} if deliberate search is preferable.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when useful bookmarks stay buried unless the user remembers to search for them deliberately.`, what_to_do_instead: `Choose ${w} when automatic resurfacing matters.` },
    ],
    mixed_content_workspace: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the user only wants a simple bookmark archive and not a mixed-content workspace.`, what_to_do_instead: `Choose ${l} if link-only storage is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when links keep losing context because notes and supporting material live in other tools.`, what_to_do_instead: `Choose ${w} when mixed-content organization matters.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the winning mechanism is not doing enough real work yet.`, what_to_do_instead: `Choose ${l} if the simpler tradeoff still fits.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the exact friction named in the rule keeps recurring during normal bookmarking.`, what_to_do_instead: `Choose ${w} once that mechanism matters daily.` },
    ],
  };
  return items[context.mode] || items.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  const burdenCases = {
    capture_structure_burden: `This can flip if the user now wants organization choices made during capture because that front-loaded structure is doing real work. Then ${l} may be worth the extra step.`,
    self_host_burden: `This can flip if the user now wants self-hosted ownership badly enough to justify setup and maintenance. Then ${l} may be worth the heavier start.`,
    general: `This can flip if the heavier mechanism on the losing side starts doing more real work than the simpler path currently does. Then ${l} may be worth the tradeoff.`,
  };
  const strengthCases = {
    manual_structure: `This can flip if the user stops needing explicit manual control over tags and folders and would rather have a lighter system. Then ${l} may fit better.`,
    local_archive: `This can flip if the user no longer needs full local archival control and mainly wants a convenient bookmark manager. Then ${l} may be the better fit.`,
    share_presentation: `This can flip if bookmark sets are mostly private and no longer need clearer shared presentation. Then ${l} may be sufficient.`,
    local_visual_assets: `This can flip if the user no longer needs local file storage or richer visual asset organization and mostly wants a standard bookmark manager. Then ${l} may fit better.`,
    in_workspace_access: `This can flip if the user prefers bookmarks living in a dedicated app instead of inside the working environment. Then ${l} may be the better fit.`,
    automatic_search: `This can flip if the user prefers deliberate manual tagging over automatic indexing and search. Then ${l} may fit better.`,
    visual_mapping: `This can flip if the user would rather keep bookmarks in conventional folders and collections than inside a visual map. Then ${l} may feel simpler.`,
    visual_scanning: `This can flip if the user prefers a lighter text-based bookmark system over preview-driven browsing. Then ${l} may be the better fit.`,
    resurfacing: `This can flip if the user prefers a static bookmark archive and does not want automatic resurfacing to shape rediscovery. Then ${l} may fit better.`,
    mixed_content_workspace: `This can flip if the user only needs a simple bookmark archive and no longer needs notes and links kept together. Then ${l} may be the better fit.`,
    general: `This can flip if the tradeoff on the losing side starts doing more real work than the mechanism that currently wins. Then ${l} may be worth the switch.`,
  };
  return sentence((context.orientation === "burden" ? burdenCases : strengthCases)[context.mode] || (context.orientation === "burden" ? burdenCases.general : strengthCases.general));
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const burdenRules = {
    capture_structure_burden: [`Choose ${w} if bookmarks should save before collections, metadata, or layouts are decided.`, `Choose ${l} if front-loaded structure is now worth the slower capture.`, `Avoid ${l} when capture interruption is the actual friction.`],
    self_host_burden: [`Choose ${w} if the bookmark system should work before hosting becomes a project.`, `Choose ${l} if self-hosted control is now worth the setup.`, `Avoid ${l} when server maintenance is the actual blocker.`],
    general: [`Choose ${w} when the burden on the other side is the real source of friction.`, `Choose ${l} when that heavier model is now doing enough work to justify itself.`, `Avoid ${l} when extra setup keeps arriving before useful bookmarking.`],
  };
  const strengthRules = {
    manual_structure: [`Choose ${w} if you need explicit control over tags and folder structures.`, `Choose ${l} if you prefer a lighter system with less manual taxonomy work.`, `Avoid ${l} when inferred structure is the main limit.`],
    local_archive: [`Choose ${w} if bookmarked pages need full local archival control.`, `Choose ${l} if a standard bookmark manager is enough.`, `Avoid ${l} when links alone are not enough to preserve access.`],
    share_presentation: [`Choose ${w} if bookmark sets need to be understandable without extra explanation.`, `Choose ${l} if the collection is mainly private and presentation quality matters less.`, `Avoid ${l} when plain shared link lists keep causing friction.`],
    local_visual_assets: [`Choose ${w} if the collection needs local file storage and visual asset organization.`, `Choose ${l} if you mainly want a standard bookmark manager for links.`, `Avoid ${l} when visual asset handling is the real need.`],
    in_workspace_access: [`Choose ${w} if bookmarks should be available inside the workspace where work is already happening.`, `Choose ${l} if you prefer a separate dedicated bookmark app.`, `Avoid ${l} when app-switching is the actual drag.`],
    automatic_search: [`Choose ${w} if retrieval should work through automatic indexing instead of manual tags.`, `Choose ${l} if you prefer deliberate tag-based organization.`, `Avoid ${l} when forgotten tags are blocking retrieval.`],
    visual_mapping: [`Choose ${w} if bookmarks need visual mapping instead of only folders and collections.`, `Choose ${l} if conventional folder organization is enough.`, `Avoid ${l} when flattened collections are hiding important relationships.`],
    visual_scanning: [`Choose ${w} if bookmark review should be faster through previews instead of text-heavy lists.`, `Choose ${l} if a lighter text-first system is enough.`, `Avoid ${l} when text lists are slowing down scanning.`],
    resurfacing: [`Choose ${w} if useful bookmarks should reappear automatically instead of waiting for manual search.`, `Choose ${l} if you prefer a static archive with deliberate retrieval.`, `Avoid ${l} when saved links keep disappearing into storage.`],
    mixed_content_workspace: [`Choose ${w} if links, notes, and related material need to stay in one workspace.`, `Choose ${l} if you only need a simple bookmark archive.`, `Avoid ${l} when tool switching is the main bottleneck.`],
    general: [`Choose ${w} when the mechanism in the rule affects daily bookmarking in practice.`, `Choose ${l} when its lighter tradeoff better matches the real job.`, `Avoid ${l} once the same friction keeps repeating in setup and routine use.`],
  };
  return (context.orientation === "burden" ? burdenRules : strengthRules)[context.mode] || (context.orientation === "burden" ? burdenRules.general : strengthRules.general);
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const burdenFaqs = {
    capture_structure_burden: [
      { q: `Why can less structure during capture be better here`, a: `Because collections, metadata, and layout choices only help once that front-loaded organization is truly worth slowing down the save moment.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when immediate structure during capture is doing real work.` },
      { q: `What usually makes ${l} fail first`, a: `Capture keeps turning into an organization task before the bookmark is even saved.` },
      { q: `Is this anti-organization`, a: `No. It is about when organization should happen.` },
    ],
    self_host_burden: [
      { q: `Why does self-hosting change the recommendation`, a: `Because it affects first use, daily maintenance, and whether a simple bookmarking tool turns into a backend project.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when self-hosted ownership is part of the reason for using it.` },
      { q: `What usually makes ${l} fail first`, a: `Hosting and maintenance arrive before the user can simply save and retrieve bookmarks.` },
      { q: `Is this only for beginners`, a: `No. Any user can lose momentum when backend work is larger than the bookmarking job.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} wins because the other tool is the one introducing the burden named in the decision rule.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when that heavier mechanism is now doing enough real work to justify itself.` },
      { q: `What usually signals it is time to switch`, a: `The added layer stops feeling like overhead and starts solving a real bookmarking problem.` },
      { q: `Is this only about simplicity`, a: `No. It is about which tool actually owns the burden described in the rule.` },
    ],
  };
  const strengthFaqs = {
    manual_structure: [
      { q: `Why does ${w} matter beyond one feature`, a: `${w} changes how the library is organized, how retrieval stays reliable, and how much of the bookmark system is defined by the user instead of the app.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when a lighter system matters more than explicit manual structure control.` },
      { q: `What usually makes ${l} fail first`, a: `The user needs more direct control over tags and folders than the lighter model provides.` },
      { q: `Is this only for obsessive organizers`, a: `Mostly for users whose bookmark collection really depends on deliberate structure.` },
    ],
    local_archive: [
      { q: `Why does local archival control matter so much`, a: `Because it changes whether bookmarks are only references or preserved copies that remain under the user's own control.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when convenient bookmarking matters more than full local preservation.` },
      { q: `What usually makes ${l} fail first`, a: `The user needs stored page copies instead of only links back to the live web.` },
      { q: `Is ${w} harder to use`, a: `Often yes, because deeper archival control usually comes with more setup or maintenance.` },
    ],
    share_presentation: [
      { q: `Why does presentation quality change the verdict`, a: `Because it affects how quickly shared bookmark sets can be understood and whether the sender has to explain a raw link list before it becomes useful.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the bookmark collection is mainly private and does not need polished sharing.` },
      { q: `What usually makes ${l} feel limiting`, a: `Plain link lists keep needing extra context before other people can use them effectively.` },
      { q: `Is ${w} only for client work`, a: `Mostly for users who regularly share bookmark collections with other people.` },
    ],
    local_visual_assets: [
      { q: `Why do local visual assets matter so much here`, a: `Because they affect what kinds of materials the library can hold and whether saved references behave more like a visual asset system than a plain bookmark list.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the user mainly wants a standard bookmark manager for web links.` },
      { q: `What usually makes ${l} fail first`, a: `The collection needs local files and richer visual asset organization instead of only saved URLs.` },
      { q: `Is ${w} only for designers`, a: `Mostly for users whose saved material includes visual assets and local files rather than only links.` },
    ],
    in_workspace_access: [
      { q: `Why does in-workspace access matter so much`, a: `Because it affects whether bookmarks are available where work is already happening or whether the user has to jump into a separate app to use them.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the user prefers a dedicated bookmark app instead of keeping links inside the broader workspace.` },
      { q: `What usually makes ${l} fail first`, a: `The user keeps switching into a separate bookmark tool before the saved link can be used in the current task.` },
      { q: `Is ${w} only for teams`, a: `Mostly for users whose bookmarks support ongoing work inside another system.` },
    ],
    automatic_search: [
      { q: `Why does automatic indexing matter so much`, a: `Because it changes whether retrieval depends on remembered tags or on the actual content of the saved page.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the user prefers a deliberate tag-based system and maintains it consistently.` },
      { q: `What usually makes ${l} fail first`, a: `Bookmarks become hard to retrieve because the needed tags were never added or cannot be recalled later.` },
      { q: `Is ${w} only for search-heavy users`, a: `Mostly for users who want retrieval to work even when capture happens quickly and tagging is inconsistent.` },
    ],
    visual_mapping: [
      { q: `Why does visual mapping change the recommendation`, a: `Because it affects whether relationships between bookmarks can be seen spatially instead of being flattened into folders or collections.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the user prefers conventional folders and collections.` },
      { q: `What usually makes ${l} fail first`, a: `The collection needs to show connections between items, not just file them into separate bins.` },
      { q: `Is ${w} more complex`, a: `Often yes, because visual mapping adds a richer spatial organization model.` },
    ],
    visual_scanning: [
      { q: `Why do previews matter so much here`, a: `Because they affect how quickly saved items can be recognized and whether bookmark review depends on rereading titles and URLs every time.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the user prefers a lighter text-based bookmark system.` },
      { q: `What usually makes ${l} feel too limited`, a: `Text-heavy lists slow down review when the library needs to be scanned quickly under time pressure.` },
      { q: `Is ${w} only about aesthetics`, a: `No. It is also about scan speed and recognition.` },
    ],
    resurfacing: [
      { q: `Why does automatic resurfacing matter so much`, a: `Because it changes whether saved links return usefully on their own or stay buried until the user remembers to search for them.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the user prefers a static archive and deliberate retrieval.` },
      { q: `What usually makes ${l} fail first`, a: `Useful bookmarks disappear into storage unless the user explicitly remembers to go find them.` },
      { q: `Is ${w} only for discovery`, a: `Mostly for users who want rediscovery to be part of the bookmark system instead of relying only on search.` },
    ],
    mixed_content_workspace: [
      { q: `Why does mixed-content support change the verdict`, a: `Because it affects whether links, notes, and supporting materials stay together or get split across separate tools.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the user only needs a simple bookmark archive and not a mixed-content workspace.` },
      { q: `What usually makes ${l} fail first`, a: `Links lose context because notes and related materials live somewhere else.` },
      { q: `Is ${w} heavier to use`, a: `Often yes, because supporting several content types usually comes with a richer workspace model.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} turns the mechanism in the decision rule into gains across setup, daily bookmarking, and longer-term organization instead of only one narrow feature win.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when its tradeoff better matches the actual bookmarking workflow.` },
      { q: `What usually signals it is time to switch`, a: `The same friction starts repeating in normal bookmarking instead of only appearing in edge cases.` },
      { q: `Is this only about simplicity`, a: `No. It is about where the real operating cost of the bookmark workflow lands.` },
    ],
  };
  return ((context.orientation === "burden" ? burdenFaqs : strengthFaqs)[context.mode] || (context.orientation === "burden" ? burdenFaqs.general : strengthFaqs.general)).map((item) => ({
    q: sentence(item.q).slice(0, -1) + "?",
    a: sentence(item.a),
  }));
}

function rewritePage(doc) {
  const context = buildContext(doc);
  const xBullets = context.winnerSide === "x" ? (context.orientation === "burden" ? burdenWinnerBullets(context) : strengthWinnerBullets(context)) : (context.orientation === "burden" ? burdenLoserBullets(context) : strengthLoserBullets(context));
  const yBullets = context.winnerSide === "y" ? (context.orientation === "burden" ? burdenWinnerBullets(context) : strengthWinnerBullets(context)) : (context.orientation === "burden" ? burdenLoserBullets(context) : strengthLoserBullets(context));
  const sections = (doc.sections || []).filter((section) => ALLOWED_SECTIONS.has(section.type)).map((section) => {
    if (section.type === "persona_fit") return { ...section, heading: `Why ${context.winnerName} fits ${context.persona}s better`, content: buildPersonaFit(context) };
    if (section.type === "x_wins") return { ...section, heading: `Where ${context.xName} wins`, bullets: xBullets };
    if (section.type === "y_wins") return { ...section, heading: `Where ${context.yName} wins`, bullets: yBullets };
    if (section.type === "failure_modes") return { ...section, heading: "Where each tool can break down", items: buildFailureModes(context) };
    if (section.type === "edge_case") return { ...section, heading: "When this verdict might flip", content: buildEdgeCase(context) };
    if (section.type === "quick_rules") return { ...section, heading: "Quick decision rules", rules: buildQuickRules(context) };
    return null;
  });
  return {
    nextDoc: { ...doc, sections, faqs: buildFaqs(context), related_pages: [] },
    rewrittenSections: ["persona_fit", "x_wins", "y_wins", "failure_modes", "edge_case", "quick_rules", "faqs"],
  };
}

function main() {
  const files = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith(".json"));
  const changed = [];
  const skipped = [];
  let totalScanned = 0;
  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const doc = readJson(filePath);
    if (doc.categorySlug !== "bookmark-managers") continue;
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
  const reportLines = ["# Bookmark Managers Second Pass Report", "", `Date: ${new Date().toISOString()}`, "", `- Pages scanned: ${totalScanned}`, `- Pages expanded: ${changed.length}`, `- Sections rewritten: ${changed.reduce((sum, page) => sum + page.sections.length, 0)}`, `- Pages skipped: ${skipped.length}`, "", "## Expanded Pages", "", ...changed.flatMap((page) => [`- File path: ${page.filePath}`, `  Title: ${page.title}`, `  Sections rewritten: ${page.sections.join(", ")}`]), "", "## Skipped Pages", "", ...(skipped.length ? skipped.map((file) => `- ${file}`) : ["- None"]), ""];
  fs.writeFileSync(REPORT_PATH, `${reportLines.join("\n")}\n`);
  console.log(JSON.stringify({ reportPath: REPORT_PATH, pagesScanned: totalScanned, pagesExpanded: changed.length, sectionsRewritten: changed.reduce((sum, page) => sum + page.sections.length, 0), pagesSkipped: skipped.length }, null, 2));
}

main();
