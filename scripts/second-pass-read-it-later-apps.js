/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "read-it-later-apps-second-pass-report.md");
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
  if (/mixed content types|structured organization|full-text extraction and structured organization|deep search and document management|mixed media asset organization/.test(value)) return "structured_library";
  if (/full local archival control|full local archival|controlling data storage and customizing the backend|hosted service without full local archival control/.test(value)) return "local_archive_control";
  if (/annotation|webpage overlays|inline webpage annotation/.test(value)) return "annotation_layers";
  if (/automatic feed updates|filtering through feeds|separate read-later queue|rss reader/.test(value)) return "feed_discovery";
  if (/entering tags before retrieval works well/.test(value)) return "tagging_burden";
  if (/account creation and exposure to recommended content feeds/.test(value)) return "account_feed_burden";
  if (/server upkeep or backend management|setting up or hosting your own server before use/.test(value)) return "server_burden";
  if (/highlighting layers or social features|citation metadata or academic library structures|folder hierarchies and visual bookmark management|managing collections or folder-based bookmark systems/.test(value)) return "reading_focus_burden";
  if (/directly into a local note system|directly into a local knowledge base/.test(value)) return "local_knowledge_capture";
  if (/extracting highlights and exporting them into structured workflows/.test(value)) return "highlight_export";
  if (/bare links without a clean reading view/.test(value)) return "clean_reader_view";
  return "general";
}

function detectOrientation(mode) {
  if (["structured_library", "local_archive_control", "annotation_layers", "feed_discovery", "local_knowledge_capture", "highlight_export", "clean_reader_view"].includes(mode)) return "strength";
  if (["tagging_burden", "account_feed_burden", "server_burden", "reading_focus_burden"].includes(mode)) return "burden";
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
    structured_library: [
      { point: `${w} gives saved content a richer structure than a simple reading queue`, why_it_matters: `The user can organize different content types without flattening everything into one article list.` },
      { point: `${w} keeps daily retrieval faster once the library grows`, why_it_matters: `Search, grouping, or structured organization reduce the need to scroll through a long linear queue.` },
      { point: `${w} supports a broader content workflow over time`, why_it_matters: `That matters when saved material needs to act like a library or research base instead of only a reading backlog.` },
    ],
    local_archive_control: [
      { point: `${w} keeps preserved content under the user's own storage control`, why_it_matters: `Access does not depend on a hosted reading service continuing to hold the material.` },
      { point: `${w} changes daily use from borrowing access to owning the archive`, why_it_matters: `The user can trust that the saved copy remains available even if the original page changes.` },
      { point: `${w} leaves more room to shape long-term preservation around local systems`, why_it_matters: `That matters when saved content needs to survive beyond a convenience reading queue.` },
    ],
    annotation_layers: [
      { point: `${w} keeps annotation attached directly to the page instead of outside it`, why_it_matters: `The user can mark and revisit ideas without moving into another export or note layer first.` },
      { point: `${w} speeds up reading-to-thinking workflows during normal use`, why_it_matters: `Inline annotation means insight can be captured at the same moment the passage is read.` },
      { point: `${w} gives saved content a more active knowledge layer`, why_it_matters: `That matters when the tool is meant for study, commentary, or shared analysis rather than only storing links.` },
    ],
    feed_discovery: [
      { point: `${w} reduces the setup cost of staying informed by bringing new content in automatically`, why_it_matters: `The user does not have to manually hunt and save each article before reading begins.` },
      { point: `${w} keeps daily reading faster because discovery and triage happen in one place`, why_it_matters: `Routine scanning stays close to the feed instead of switching between finding and saving tools.` },
      { point: `${w} gives the reading system a stronger upstream structure`, why_it_matters: `That matters when the real job is monitoring many sources instead of only storing a few articles.` },
    ],
    local_knowledge_capture: [
      { point: `${w} sends saved articles directly into the knowledge system where they will actually be used`, why_it_matters: `The user does not have to move material out of a separate hosted reader before thinking with it.` },
      { point: `${w} shortens the daily path between capture and reuse`, why_it_matters: `Notes, links, and saved articles can live in the same local workflow instead of being split across apps.` },
      { point: `${w} gives the archive a structure that matches a local thinking system`, why_it_matters: `That matters when the real goal is building a knowledge base, not just maintaining a read-later queue.` },
    ],
    highlight_export: [
      { point: `${w} turns highlights into reusable material instead of trapped reader markup`, why_it_matters: `The user can move insights into notes or structured systems without workaround steps.` },
      { point: `${w} keeps daily review and reuse faster`, why_it_matters: `Exports and integrations reduce the need to manually copy important passages after reading.` },
      { point: `${w} gives reading output a better downstream structure`, why_it_matters: `That matters when saved articles are meant to feed a larger research or knowledge workflow.` },
    ],
    clean_reader_view: [
      { point: `${w} turns saved articles into something readable instead of leaving them as bare links`, why_it_matters: `The user can focus on the text itself without the original page structure doing the work.` },
      { point: `${w} keeps daily reading faster because the article opens in a cleaner format`, why_it_matters: `That reduces the time spent navigating clutter before actual reading begins.` },
      { point: `${w} gives the reading queue a clearer purpose than a generic bookmark list`, why_it_matters: `That matters when the tool is supposed to support reading, not just storage.` },
    ],
    general: [
      { point: `${w} handles the winning reading mechanism more directly`, why_it_matters: `The user spends less time working around the exact friction named in the rule.` },
      { point: `${w} keeps daily use smoother`, why_it_matters: `The workflow stays shorter and easier to repeat.` },
      { point: `${w} scales better once the saved-content system becomes more serious`, why_it_matters: `That matters when the mechanism in the rule affects setup, daily use, and long-term organization together.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function strengthLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    structured_library: [
      { point: `${l} can still be better when the user only wants a simple reading queue`, why_it_matters: `A lighter article-first tool may feel calmer when deep structure would mostly be overhead.` },
      { point: `${l} keeps daily reading narrower and easier to understand`, why_it_matters: `That matters when mixed content types and library behavior are not part of the real job.` },
      { point: `${l} asks for less commitment to a larger organization model`, why_it_matters: `The simpler queue can be better when structured systems would mostly sit unused.` },
    ],
    local_archive_control: [
      { point: `${l} can still be better when the user mainly wants quick reading instead of long-term preservation`, why_it_matters: `A hosted reader can feel easier when owning the archive is not the actual priority.` },
      { point: `${l} keeps the daily workflow lighter than a full archival system`, why_it_matters: `That matters when convenience matters more than preservation depth.` },
      { point: `${l} may fit when the user values a reading queue over archive ownership`, why_it_matters: `The tradeoff only fails once storage control is doing real work.` },
    ],
    annotation_layers: [
      { point: `${l} can still be better when the user mainly wants to save and read rather than annotate deeply`, why_it_matters: `A simpler reader may be enough if inline markup and overlays would mostly go unused.` },
      { point: `${l} keeps the article surface lighter for straightforward reading`, why_it_matters: `That matters when annotation depth is not the reason the content was saved.` },
      { point: `${l} reduces the complexity of using the reader itself`, why_it_matters: `The lighter model can be better when annotation capability is not the main value.` },
    ],
    feed_discovery: [
      { point: `${l} can still be better when the user prefers manually curating a smaller reading list`, why_it_matters: `A save-only queue may fit better if automatic inflow would mostly create more unread material.` },
      { point: `${l} keeps reading separate from discovery`, why_it_matters: `That matters when the user already finds content elsewhere and only needs a clean place to read it.` },
      { point: `${l} asks for less commitment to a feed-management system`, why_it_matters: `The lighter model can be better when subscriptions are not the actual workflow.` },
    ],
    local_knowledge_capture: [
      { point: `${l} can still be better when the user wants a separate reading app rather than direct knowledge-base storage`, why_it_matters: `A dedicated reader may feel simpler if the local note system is not the main destination.` },
      { point: `${l} keeps reading and knowledge management as separate jobs`, why_it_matters: `That matters when direct capture into notes would mostly add structure the user does not need.` },
      { point: `${l} may fit when hosted reading convenience matters more than local integration`, why_it_matters: `The tradeoff only fails once direct reuse in the note system becomes central.` },
    ],
    highlight_export: [
      { point: `${l} can still be better when the user mainly wants a reading queue rather than a reuse system`, why_it_matters: `A simpler app may be enough if highlights do not need to feed other tools.` },
      { point: `${l} keeps reading focused on consumption instead of downstream processing`, why_it_matters: `That matters when export and structured reuse would mostly be overhead.` },
      { point: `${l} may fit when integrations are less important than a lighter reader`, why_it_matters: `The simpler model can be better when the workflow ends at reading.` },
    ],
    clean_reader_view: [
      { point: `${l} can still be better when the user wants a broad bookmark archive instead of a dedicated reading app`, why_it_matters: `Bare-link storage may be enough if the job is remembering pages rather than reading them well.` },
      { point: `${l} gives more flexibility for mixed bookmarking use`, why_it_matters: `That matters when article readability is not the only reason content is being saved.` },
      { point: `${l} may fit when generic saving matters more than a refined reader`, why_it_matters: `The tradeoff only fails once reading comfort becomes the central requirement.` },
    ],
    general: [
      { point: `${l} can still be better in a narrower saved-content workflow`, why_it_matters: `The losing tool may fit when the winning mechanism is not doing much real work yet.` },
      { point: `${l} often offers a lighter tradeoff`, why_it_matters: `That can matter when the richer mechanism would mostly add overhead.` },
      { point: `${l} becomes more reasonable when complexity is not needed`, why_it_matters: `The friction only matters when it gets in the way of the actual reading job.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function burdenWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    tagging_burden: [
      { point: `${w} lets the user save content before learning an organization scheme`, why_it_matters: `The first useful action is saving the article, not deciding which tags must exist for retrieval to work.` },
      { point: `${w} keeps daily retrieval easier without relying on tag discipline`, why_it_matters: `Routine use stays faster when recall does not depend on building a taxonomy up front.` },
      { point: `${w} lowers the cognitive cost of maintaining the library`, why_it_matters: `That matters when tag management is exactly what makes the tool feel heavier than the reading job requires.` },
    ],
    account_feed_burden: [
      { point: `${w} gets the reading queue usable without account setup or feed distraction first`, why_it_matters: `The user can save and read without another sign-in or recommendation surface standing in front of the article.` },
      { point: `${w} keeps daily reading focused on the saved list itself`, why_it_matters: `Routine use is faster when recommendations and account-driven layers are not competing with the actual reading queue.` },
      { point: `${w} lowers the maintenance burden around the app`, why_it_matters: `That matters when account creation and recommendation feeds are the exact layers the user is trying to avoid.` },
    ],
    server_burden: [
      { point: `${w} lets the user start saving before server setup becomes a project`, why_it_matters: `The first saved article can happen immediately instead of after hosting, installs, or backend choices.` },
      { point: `${w} keeps daily use separate from infrastructure maintenance`, why_it_matters: `Routine reading stays focused on content instead of on keeping a service running.` },
      { point: `${w} lowers the technical overhead of adopting the tool`, why_it_matters: `That matters when server management is exactly what is blocking the reading workflow.` },
    ],
    reading_focus_burden: [
      { point: `${w} keeps the saved article closer to plain reading instead of surrounding it with extra layers`, why_it_matters: `The user can get into the text without first managing highlights, citations, folders, or social surfaces.` },
      { point: `${w} keeps daily reading faster because the article is not competing with adjacent workflow machinery`, why_it_matters: `Routine use stays closer to open, read, and finish instead of operating a broader system.` },
      { point: `${w} lowers the amount of structure the reader has to think about`, why_it_matters: `That matters when the burden in the rule is exactly what makes the tool feel less calm.` },
    ],
    general: [
      { point: `${w} removes the burden introduced by the losing tool`, why_it_matters: `The user reaches useful reading sooner.` },
      { point: `${w} keeps daily use more direct`, why_it_matters: `Routine saving and reading take fewer extra steps.` },
      { point: `${w} makes the system easier to operate without added overhead`, why_it_matters: `That matters when the burden named in the rule is the real source of friction.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function burdenLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    tagging_burden: [
      { point: `${l} can still be better when the user wants retrieval built around a deliberate tagging system`, why_it_matters: `The extra classification work may pay back once the library is large enough for tags to do real navigation work.` },
      { point: `${l} supports more explicit organization for users who like taxonomies`, why_it_matters: `That matters when free-form saving is no longer enough to keep the collection usable.` },
      { point: `${l} may scale better once careful labeling is part of the workflow`, why_it_matters: `The added burden only pays back when tags are genuinely part of the system.` },
    ],
    account_feed_burden: [
      { point: `${l} can still be better when syncing and discovery are part of the reason for using the app`, why_it_matters: `An account layer may be worth it once cross-device access and recommendations are doing real work.` },
      { point: `${l} supports a broader content ecosystem around the reading list`, why_it_matters: `That matters when discovery matters almost as much as reading the saved article.` },
      { point: `${l} may fit when the user wants a cloud-centered reading workflow`, why_it_matters: `The extra layers only make sense once those connected features are genuinely useful.` },
    ],
    server_burden: [
      { point: `${l} can still be better when the user wants hosting and backend control`, why_it_matters: `The setup cost may be worth it once ownership of the system is part of the value.` },
      { point: `${l} supports a more self-managed archive model later`, why_it_matters: `That matters when server control becomes a real requirement instead of an obstacle.` },
      { point: `${l} may fit when infrastructure decisions are intentional`, why_it_matters: `The extra setup only pays back when backend control is actually part of the job.` },
    ],
    reading_focus_burden: [
      { point: `${l} can still be better when the user needs the added workflow layer`, why_it_matters: `Highlights, citations, folders, or social features may be worth the extra structure once reading alone is not the full job.` },
      { point: `${l} supports richer downstream use after the article is saved`, why_it_matters: `That matters when the content needs to feed study, research, or heavier organization systems.` },
      { point: `${l} may fit when the user wants a more elaborate reading workflow`, why_it_matters: `The added complexity only pays back when that extra system is doing real work.` },
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
      tagging_burden: `${w} fits this ${p} because ${l} is the tool making organization depend on tags before the system feels easy to use, not ${w}. That adds setup thinking before the first useful save, keeps retrieval tied to classification discipline, and raises the mental cost of maintaining the library over time. ${w} wins by letting saving work before taxonomy becomes a project.`,
      account_feed_burden: `${w} fits this ${p} because ${l} is the tool introducing account setup and recommendation-feed exposure, not ${w}. Those layers add sign-in friction before reading starts, bring more visual noise into the app, and make the saved queue feel less self-contained during normal use. ${w} wins by keeping the reading workflow closer to the saved article itself.`,
      server_burden: `${w} fits this ${p} because ${l} is the tool asking for hosting and backend setup before the system feels ready, not ${w}. That extra work slows the first save, keeps maintenance attached to everyday use, and turns a reading tool into an infrastructure task. ${w} wins by letting the reading workflow start before server decisions take over.`,
      reading_focus_burden: `${w} fits this ${p} because ${l} is the tool adding the extra layer named in the rule, not ${w}. Those features can help in the right case, but here they add more interface structure, more decisions around the article, and more mental overhead than the reader actually wants. ${w} wins by keeping the saved item closer to plain reading.`,
      general: `${w} fits this ${p} because ${l} is the tool introducing the burden named in the decision rule, not ${w}. ${w} wins by keeping that same friction from showing up in setup, daily use, and long-term maintenance all at once.`,
    };
    return sentence(text[context.mode] || text.general);
  }
  const text = {
    structured_library: `${w} fits this ${p} because richer organization changes the saved-content workflow at several levels at once. It affects how content types are stored, how quickly items can be found later, and whether the system behaves like a queue or a true library. ${w} wins by giving saved material more structure to live in.`,
    local_archive_control: `${w} fits this ${p} because storage ownership changes more than where files sit. It affects whether saved material depends on a service, how trustworthy long-term access feels, and how much control the user keeps over preservation strategy. ${w} wins by keeping the archive under the user's own control.`,
    annotation_layers: `${w} fits this ${p} because annotation changes more than one reading action. It affects how ideas are captured in the moment, whether notes stay attached to the original passage, and how much reuse is possible without leaving the page. ${w} wins by making annotation part of the content itself instead of an afterthought.`,
    feed_discovery: `${w} fits this ${p} because automatic discovery changes setup, daily workflow speed, and navigation together. It affects whether articles arrive on their own, whether reading starts from a feed instead of a manual save step, and how well the system handles many sources without extra switching. ${w} wins by moving discovery closer to reading.`,
    local_knowledge_capture: `${w} fits this ${p} because direct capture into a local note system changes both storage and reuse. It affects where saved articles live, how quickly they can be processed into notes, and whether the reading workflow feeds the knowledge base directly or through an extra app. ${w} wins by removing that extra handoff.`,
    highlight_export: `${w} fits this ${p} because exportable highlights change what saved reading is for. It affects whether insights can move into notes automatically, how much manual copying is left after reading, and whether the reader supports a real downstream workflow instead of trapping value inside itself. ${w} wins by making reuse part of the normal path.`,
    clean_reader_view: `${w} fits this ${p} because a true reading view changes several parts of the experience at once. It affects whether the article is readable without page clutter, how quickly reading can start, and whether the saved item feels like something to read or only something to store. ${w} wins by keeping the queue oriented around actual reading.`,
    general: `${w} fits this ${p} because the winning mechanism improves setup, daily reading, and longer-term organization instead of solving only one narrow problem.`,
  };
  return sentence(text[context.mode] || text.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    const items = {
      tagging_burden: [
        { tool: context.winnerSide, fails_when: `${w} becomes too light when the user truly needs retrieval organized around a deliberate tagging system.`, what_to_do_instead: `Choose ${l} if tag-driven organization is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when tag entry and taxonomy thinking keep getting in front of simple saving and retrieval.`, what_to_do_instead: `Choose ${w} when lower-friction organization is the actual gain.` },
      ],
      account_feed_burden: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when syncing and recommendation-driven discovery are now important parts of the workflow.`, what_to_do_instead: `Choose ${l} if those connected features are doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when account setup and recommendation feeds keep feeling larger than the saved-reading job itself.`, what_to_do_instead: `Choose ${w} when a cleaner, more self-contained reader fits better.` },
      ],
      server_burden: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when the user really wants hosting control and a self-managed backend.`, what_to_do_instead: `Choose ${l} if backend ownership is now part of the requirement.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when server setup keeps standing between the user and actually saving articles.`, what_to_do_instead: `Choose ${w} when getting started quickly matters more.` },
      ],
      reading_focus_burden: [
        { tool: context.winnerSide, fails_when: `${w} becomes too thin when the user now needs the heavier layer around reading to do real downstream work.`, what_to_do_instead: `Choose ${l} if the extra system has become part of the job.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the extra reading layer keeps adding interaction and mental overhead around an article that should be simple to save and read.`, what_to_do_instead: `Choose ${w} when a cleaner reading path is the real fit.` },
      ],
      general: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited once the heavier mechanism is actually doing enough work to justify itself.`, what_to_do_instead: `Choose ${l} if the added layer is now worth carrying.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the same overhead keeps showing up before useful reading can happen.`, what_to_do_instead: `Choose ${w} when the simpler path is the real gain.` },
      ],
    };
    return items[context.mode] || items.general;
  }
  const items = {
    structured_library: [
      { tool: context.winnerSide, fails_when: `${w} becomes too heavy when the user only wants a simple queue of articles to read and does not need a broader library structure.`, what_to_do_instead: `Choose ${l} if a lighter reading queue now fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when saved content needs more structure, search depth, or mixed-type organization than a simple queue can support.`, what_to_do_instead: `Choose ${w} when library-like organization matters.` },
    ],
    local_archive_control: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the user mainly wants convenient reading and not long-term archive ownership.`, what_to_do_instead: `Choose ${l} if preservation control is not the real need.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user needs a saved copy they control instead of depending on a hosted service for continued access.`, what_to_do_instead: `Choose ${w} when local archival control matters.` },
    ],
    annotation_layers: [
      { tool: context.winnerSide, fails_when: `${w} becomes too elaborate when the user only wants to save and read content without annotation depth.`, what_to_do_instead: `Choose ${l} if a lighter reader is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user needs inline annotation and page-level commentary without pushing the work into external tools.`, what_to_do_instead: `Choose ${w} when annotation is part of the reading workflow.` },
    ],
    feed_discovery: [
      { tool: context.winnerSide, fails_when: `${w} becomes too much when the user prefers curating a small manual reading list instead of managing feeds and subscriptions.`, what_to_do_instead: `Choose ${l} if manual curation fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when discovering content depends on saving articles one by one instead of having new material arrive automatically.`, what_to_do_instead: `Choose ${w} when feed-driven discovery matters daily.` },
    ],
    local_knowledge_capture: [
      { tool: context.winnerSide, fails_when: `${w} becomes too tied to a note workflow when the user only wants a separate read-later app.`, what_to_do_instead: `Choose ${l} if direct knowledge-base capture is not the real need.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user keeps saving into a separate hosted reader and then moving material manually into a local note system.`, what_to_do_instead: `Choose ${w} when direct local capture matters more.` },
    ],
    highlight_export: [
      { tool: context.winnerSide, fails_when: `${w} becomes too workflow-heavy when the user only wants to read saved content and not export or reuse it elsewhere.`, what_to_do_instead: `Choose ${l} if a simpler queue is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when important highlights have to be copied out manually or pushed through weak integrations before they can be reused.`, what_to_do_instead: `Choose ${w} when structured export matters.` },
    ],
    clean_reader_view: [
      { tool: context.winnerSide, fails_when: `${w} becomes too specialized when the user wants a broader bookmark archive more than a dedicated reading experience.`, what_to_do_instead: `Choose ${l} if generic saving matters more.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when saved content stays as bare links instead of becoming something comfortable to read.`, what_to_do_instead: `Choose ${w} when a clean reading view is the actual requirement.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the winning mechanism is not doing enough real work yet.`, what_to_do_instead: `Choose ${l} if the simpler tradeoff still fits.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the exact friction named in the rule keeps recurring during normal saving and reading.`, what_to_do_instead: `Choose ${w} once that mechanism matters daily.` },
    ],
  };
  return items[context.mode] || items.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  const burdenCases = {
    tagging_burden: `This can flip if the user now wants retrieval organized around a deliberate tagging system instead of looser saving. Then ${l} may be worth the extra taxonomy work.`,
    account_feed_burden: `This can flip if syncing and recommendation-driven discovery now matter more than keeping the reader self-contained. Then ${l} may be worth the extra layers.`,
    server_burden: `This can flip if the user now wants backend control badly enough to justify server setup and maintenance. Then ${l} may be worth the heavier start.`,
    reading_focus_burden: `This can flip if the added layer around reading is now doing real work, such as study, research, or heavier organization. Then ${l} may be worth the added complexity.`,
    general: `This can flip if the heavier mechanism on the losing side starts doing more real work than the simpler path currently does. Then ${l} may be worth the tradeoff.`,
  };
  const strengthCases = {
    structured_library: `This can flip if the user decides a simple reading queue is enough and no longer needs a broader library structure. Then ${l} may fit better.`,
    local_archive_control: `This can flip if the user stops needing local archival ownership and mainly wants a convenient hosted reading queue. Then ${l} may be the better fit.`,
    annotation_layers: `This can flip if the user no longer needs inline annotation and mainly wants a lighter save-and-read workflow. Then ${l} may be the better fit.`,
    feed_discovery: `This can flip if the user prefers manually curating a small set of reads instead of managing subscriptions and feed inflow. Then ${l} may feel simpler.`,
    local_knowledge_capture: `This can flip if the user no longer needs direct capture into a local note system and would rather keep reading separate. Then ${l} may fit better.`,
    highlight_export: `This can flip if the user mainly wants to read saved content and no longer needs highlights to feed a larger workflow. Then ${l} may be enough.`,
    clean_reader_view: `This can flip if the user wants a broader bookmark archive more than a dedicated reading view. Then ${l} may be the better fit.`,
    general: `This can flip if the tradeoff on the losing side starts doing more real work than the mechanism that currently wins. Then ${l} may be worth the switch.`,
  };
  return sentence((context.orientation === "burden" ? burdenCases : strengthCases)[context.mode] || (context.orientation === "burden" ? burdenCases.general : strengthCases.general));
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const burdenRules = {
    tagging_burden: [`Choose ${w} if saving should work before you build a tag system.`, `Choose ${l} if deliberate tag-based retrieval is now worth the extra effort.`, `Avoid ${l} when taxonomy work is the real friction.`],
    account_feed_burden: [`Choose ${w} if you want saved reading without account overhead or recommendation feeds.`, `Choose ${l} if syncing and discovery are now doing real work.`, `Avoid ${l} when extra account and feed layers are the main distraction.`],
    server_burden: [`Choose ${w} if you want to start saving before hosting becomes a project.`, `Choose ${l} if backend control is now worth the setup.`, `Avoid ${l} when server work is the actual blocker.`],
    reading_focus_burden: [`Choose ${w} if you want the article itself without the extra workflow layer around it.`, `Choose ${l} if the heavier reading system is now part of the job.`, `Avoid ${l} when the added layer is the friction you are trying to remove.`],
    general: [`Choose ${w} when the burden on the other side is the real source of friction.`, `Choose ${l} when that heavier model is now doing enough work to justify itself.`, `Avoid ${l} when extra layers keep arriving before useful reading.`],
  };
  const strengthRules = {
    structured_library: [`Choose ${w} if saved content needs to behave like a structured library, not just a reading queue.`, `Choose ${l} if a simple queue is enough.`, `Avoid ${l} when the queue has outgrown a flatter model.`],
    local_archive_control: [`Choose ${w} if you need local control over preserved content.`, `Choose ${l} if a hosted reader is enough for the real job.`, `Avoid ${l} when service dependence is the actual dealbreaker.`],
    annotation_layers: [`Choose ${w} if annotation should happen directly on the saved page.`, `Choose ${l} if you mainly want a lighter save-and-read tool.`, `Avoid ${l} when external annotation workarounds are slowing you down.`],
    feed_discovery: [`Choose ${w} if content should arrive through subscriptions instead of manual saving.`, `Choose ${l} if you prefer manually curating a smaller reading queue.`, `Avoid ${l} when one-by-one saving is the bottleneck.`],
    local_knowledge_capture: [`Choose ${w} if saved content should go straight into your local note system.`, `Choose ${l} if you want a separate hosted reading app instead.`, `Avoid ${l} when manual transfer into notes is the real friction.`],
    highlight_export: [`Choose ${w} if highlights need to move into structured workflows without workarounds.`, `Choose ${l} if you mainly want a simple reading queue.`, `Avoid ${l} when reuse outside the app matters.`],
    clean_reader_view: [`Choose ${w} if saved articles should open in a true reading view instead of staying as bare links.`, `Choose ${l} if you want a broader bookmark archive instead.`, `Avoid ${l} when generic storage is getting in the way of reading.`],
    general: [`Choose ${w} when the mechanism in the rule affects saving and reading in practice.`, `Choose ${l} when its lighter tradeoff better matches the real job.`, `Avoid ${l} once the same friction keeps repeating in setup and routine use.`],
  };
  return (context.orientation === "burden" ? burdenRules : strengthRules)[context.mode] || (context.orientation === "burden" ? burdenRules.general : strengthRules.general);
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const burdenFaqs = {
    tagging_burden: [
      { q: `Why can less organization be better here`, a: `Because tags only help once the user truly wants retrieval to depend on a deliberate labeling system instead of straightforward saving.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when tag-based retrieval is now doing real work.` },
      { q: `What usually makes ${l} fail first`, a: `The user keeps doing taxonomy work before the library even feels useful.` },
      { q: `Is this anti-organization`, a: `No. It is about whether the organization method matches the real job.` },
    ],
    account_feed_burden: [
      { q: `Why can avoiding accounts and feeds matter so much`, a: `Because those layers affect setup, daily attention cost, and whether the reader stays focused on saved content or on a broader content ecosystem.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when syncing and recommendation-driven discovery are genuinely useful.` },
      { q: `What usually makes ${l} fail first`, a: `The account and feed layers feel larger than the saved-reading job itself.` },
      { q: `Is ${w} only for minimalists`, a: `Mostly for users who want a more self-contained reading workflow.` },
    ],
    server_burden: [
      { q: `Why does server setup change the recommendation`, a: `Because it affects first use, daily maintenance, and whether a simple saving tool turns into a backend project.` },
      { q: `When is ${l} still worth it`, a: `${l} is still worth it when backend control is part of the reason for using the app.` },
      { q: `What usually makes ${l} feel too heavy`, a: `Hosting and maintenance arrive before the user can simply start saving articles.` },
      { q: `Is this only for beginners`, a: `No. Any user can lose momentum when infrastructure work is larger than the reading job.` },
    ],
    reading_focus_burden: [
      { q: `Why can a cleaner reader win here`, a: `Because highlights, social features, citation systems, or folder structures only help once those added layers are actually part of the work.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when the heavier workflow layer is doing real downstream work.` },
      { q: `What usually makes ${l} the wrong fit`, a: `The added layer keeps interrupting a reading flow that should feel simpler.` },
      { q: `Is this anti-feature`, a: `No. It is about whether the extra workflow matches the actual reading goal.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} wins because the other tool is the one introducing the burden named in the decision rule.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when that heavier mechanism is now doing enough real work to justify itself.` },
      { q: `What usually signals it is time to switch`, a: `The added layer stops feeling like overhead and starts solving a real reading problem.` },
      { q: `Is this only about simplicity`, a: `No. It is about which tool actually owns the burden described in the rule.` },
    ],
  };
  const strengthFaqs = {
    structured_library: [
      { q: `Why does ${w} matter beyond one feature`, a: `${w} changes how saved content is structured, how quickly it can be found again, and whether the system behaves like a queue or a real library.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when a simple reading queue is enough and deeper structure would mostly be overhead.` },
      { q: `What usually makes ${l} fail first`, a: `The saved collection grows past what a flat reading queue can support comfortably.` },
      { q: `Is this only for researchers`, a: `Mostly for users whose saved content needs more organization than a basic queue can provide.` },
    ],
    local_archive_control: [
      { q: `Why does local archival control matter so much`, a: `Because it affects whether saved content is really owned by the user or borrowed through a hosted reading service.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when convenient reading matters more than long-term archive ownership.` },
      { q: `What usually makes ${l} fail first`, a: `The user needs a saved copy under their own control instead of depending on a hosted service.` },
      { q: `Is ${w} harder to use`, a: `Often yes, because deeper preservation control usually comes with more setup or maintenance.` },
    ],
    annotation_layers: [
      { q: `Why do inline annotation layers change the verdict`, a: `Because they affect how ideas are captured while reading and whether markup stays attached directly to the original page.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the user mainly wants to save and read content without annotation depth.` },
      { q: `What usually makes ${l} feel limiting`, a: `The user needs annotation on the content itself instead of pushing notes into external workarounds.` },
      { q: `Is this a niche need`, a: `It matters whenever annotation is part of the reason the content was saved.` },
    ],
    feed_discovery: [
      { q: `Why does feed-based discovery matter so much here`, a: `Because it changes whether new content arrives automatically or whether the user has to find and save every article one by one.` },
      { q: `When is ${l} still better`, a: `${l} is still better when the user prefers manually curating a smaller reading list.` },
      { q: `What usually pushes someone toward ${w}`, a: `Too much time keeps disappearing into manual saving before reading can even begin.` },
      { q: `Does ${w} replace a read-later app`, a: `Often yes for users whose main bottleneck is discovering and scanning many sources.` },
    ],
    local_knowledge_capture: [
      { q: `Why does direct capture into a note system change the recommendation`, a: `Because it affects where saved content lives, how quickly it can be reused, and whether reading feeds a larger local knowledge workflow.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the user wants a separate hosted reading app instead of direct local capture.` },
      { q: `What usually makes ${l} fail first`, a: `The user keeps saving into a separate reader and then moving material manually into notes later.` },
      { q: `Is ${w} only for power users`, a: `Mostly for users whose main goal is getting saved content into a broader local knowledge system.` },
    ],
    highlight_export: [
      { q: `Why do exports and integrations matter so much here`, a: `Because they decide whether highlights can move into structured workflows automatically or stay trapped inside the reading app.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the user mainly wants to read articles and not reuse highlights elsewhere.` },
      { q: `What usually makes ${l} feel too limited`, a: `Important passages need to leave the app, but export and integration paths are too weak or too manual.` },
      { q: `Is ${w} heavier to use`, a: `Often yes, because better downstream workflows usually come with more structure.` },
    ],
    clean_reader_view: [
      { q: `Why does a clean reading view matter so much`, a: `Because it changes whether the saved item becomes comfortable to read or stays a bare reference that still depends on the original page format.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the user wants a broader bookmark archive more than a dedicated reading experience.` },
      { q: `What usually makes ${l} fail first`, a: `Saved content keeps acting like stored links instead of something the user can settle in and read.` },
      { q: `Is ${w} only for article readers`, a: `Mostly for users who care more about reading comfort than generic bookmarking.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} turns the mechanism in the decision rule into gains across setup, daily reading, and longer-term organization instead of only one narrow feature win.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when its tradeoff better matches the actual saved-reading workflow.` },
      { q: `What usually signals it is time to switch`, a: `The same friction starts repeating in normal saving and reading instead of only appearing in edge cases.` },
      { q: `Is this only about simplicity`, a: `No. It is about where the real operating cost of the reading workflow lands.` },
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
    if (doc.categorySlug !== "read-it-later-apps") continue;
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
  const reportLines = ["# Read-It-Later Apps Second Pass Report", "", `Date: ${new Date().toISOString()}`, "", `- Pages scanned: ${totalScanned}`, `- Pages expanded: ${changed.length}`, `- Sections rewritten: ${changed.reduce((sum, page) => sum + page.sections.length, 0)}`, `- Pages skipped: ${skipped.length}`, "", "## Expanded Pages", "", ...changed.flatMap((page) => [`- File path: ${page.filePath}`, `  Title: ${page.title}`, `  Sections rewritten: ${page.sections.join(", ")}`]), "", "## Skipped Pages", "", ...(skipped.length ? skipped.map((file) => `- ${file}`) : ["- None"]), ""];
  fs.writeFileSync(REPORT_PATH, `${reportLines.join("\n")}\n`);
  console.log(JSON.stringify({ reportPath: REPORT_PATH, pagesScanned: totalScanned, pagesExpanded: changed.length, sectionsRewritten: changed.reduce((sum, page) => sum + page.sections.length, 0), pagesSkipped: skipped.length }, null, 2));
}

main();
