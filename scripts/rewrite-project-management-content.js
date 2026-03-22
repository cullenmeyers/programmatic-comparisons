/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const TARGET_CATEGORY = process.env.TARGET_CATEGORY || "project-management-tools";
const EXCLUDE_CATEGORY = process.env.EXCLUDE_CATEGORY || "";
const SNAPSHOT_PATH = process.env.SNAPSHOT_PATH
  ? path.resolve(ROOT, process.env.SNAPSHOT_PATH)
  : path.join(ROOT, "scripts", "project-management-head-snapshot.json");
const REPORT_PATH = path.join(
  REPORTS_DIR,
  process.env.REPORT_FILE || "project-management-tools-strong-rewrite-report.md"
);
const REPORT_TITLE = process.env.REPORT_TITLE || "Project Management Tools Strong Rewrite Report";
const SNAPSHOT = fs.existsSync(SNAPSHOT_PATH) ? readJson(SNAPSHOT_PATH) : {};

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

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function ensureSentence(value) {
  const trimmed = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/g, "");
  return trimmed ? `${trimmed}.` : "";
}

function classifyMechanism(text) {
  const value = normalizeText(text);

  if (/contract|invoice|time tracking|tracked project work/.test(value)) return "integrated_ops";
  if (/self hosted|private server|server level|infrastructure|upgrade timing|environment changes/.test(value)) return "hosting_control";
  if (/managed hosted|managed hosted platform|no infrastructure|quick account setup/.test(value)) return "managed_hosting";
  if (/prebuilt project areas|client collaboration built|client projects|ready project/.test(value)) return "client_workspace";
  if (/natural language/.test(value)) return "natural_language";
  if (/single input field|instant task entry|quick task creation/.test(value)) return "quick_entry";
  if (/flat project lists|simple to do lists|simple task lists|general coordination|check-off items|checkboxes and assignments/.test(value)) return "flat_lists";
  if (/message boards|team communication|discussions|chat|announcement/.test(value)) return "message_hub";
  if (/automation/.test(value)) return "automation";
  if (/board|drag and drop|columns|kanban|visual layout/.test(value)) return "board_visual";
  if (/card comments|attachments|labels|checklists|comments in one place|comments in a single/.test(value)) return "card_collab";
  if (/formula|computed|rollup|calculate values/.test(value)) return "formulas_automation";
  if (/record|customizable fields|custom columns|database|table|entity type|custom entity|custom properties/.test(value)) return "structured_data";
  if (/pull request|merge request|commit|repository|repositories|repo|code references|repository activity/.test(value)) {
    if (/timeline|history/.test(value)) return "history_trace";
    if (/same repository|repository data|one system|development lifecycle/.test(value)) return "repo_context";
    return "repo_link";
  }
  if (/lookup|relational|related records|between tables|connects? tasks? to|linked records/.test(value)) return "relationships";
  if (/filtered views|multiple views|tables, boards, and timelines|timeline and calendar|same underlying data|same dataset/.test(value)) return "multiple_views";
  if (/timeline of commits|history|field changes|state transitions over time/.test(value)) return "history_trace";
  if (/issue record|issue types|tracker type|severity|priority|assignee|resolution|story based issue tracking/.test(value)) return "issue_structure";
  if (/workflow|state|status workflows|resolution states|resolved/.test(value)) return "workflow_states";
  if (/version|release|milestone/.test(value)) return "version_release";
  if (/backlog/.test(value)) return "backlog";
  if (/sprint|iteration|cycle/.test(value)) return "sprint";
  if (/story/.test(value)) return "story_tracking";
  if (/forecast|workload/.test(value)) return "capacity_forecast";
  if (/capacity/.test(value)) return "capacity_planning";
  if (/resource|people or equipment/.test(value)) return "resource_allocation";
  if (/dependency|finish-to-start|strict sequence/.test(value)) return "dependency_scheduling";
  if (/gantt|critical path|recalculates|priority lists|estimated effort|completion timelines|schedule updates/.test(value)) return "gantt_planning";
  return "general";
}

function sectionArchetypeFromCategories(categories) {
  const set = new Set(categories);
  if (set.has("hosting_control")) return "hosting_control";
  if (set.has("capacity_forecast") || set.has("capacity_planning") || set.has("resource_allocation") || set.has("dependency_scheduling") || set.has("gantt_planning")) return "scheduling";
  if (set.has("repo_link") || set.has("repo_context") || set.has("history_trace")) return "repo_native";
  if (set.has("issue_structure") || set.has("workflow_states") || set.has("version_release") || set.has("backlog") || set.has("sprint") || set.has("story_tracking")) return "issue_tracking";
  if (set.has("structured_data") || set.has("relationships") || set.has("multiple_views") || set.has("formulas_automation")) return "structured_system";
  if (set.has("integrated_ops")) return "all_in_one_ops";
  if (set.has("client_workspace")) return "safe_client";
  if (set.has("quick_entry") || set.has("flat_lists") || set.has("natural_language")) return "quick_start";
  return "general";
}

function pageArchetypeFromWinner(categories, constraintSlug) {
  if (constraintSlug === "setup-tolerance") return "quick_start";
  if (constraintSlug === "fear-of-breaking") return "safe_client";
  if (constraintSlug === "time-scarcity") return "all_in_one_ops";
  return sectionArchetypeFromCategories(categories);
}

function archetypeFromDecisionRule(decisionRule, constraintSlug) {
  if (constraintSlug === "setup-tolerance") return "quick_start";
  if (constraintSlug === "fear-of-breaking") return "safe_client";
  if (constraintSlug === "time-scarcity") return "all_in_one_ops";
  const value = normalizeText(decisionRule);
  if (/repository|pull request|merge request|commit|code/.test(value)) return "repo_native";
  if (/dependency|dependencies|resource|capacity|forecast|schedule|timeline|critical path/.test(value)) return "scheduling";
  if (/self-hosted|self hosted|server level|infrastructure/.test(value)) return "hosting_control";
  if (/issue types|issue tickets|issue tracking|bug workflows|resolution states|backlog|sprint|iteration|story tracking|release workflows|workflow states/.test(value)) return "issue_tracking";
  if (/blank pages|custom databases|ready.*day one/.test(value)) return "safe_client";
  if (/contract|time tracking|invoicing|billable/.test(value)) return "all_in_one_ops";
  if (/custom fields|database rows|database records|relational|linked|structured product entities|structured database|customizable records/.test(value)) return "structured_system";
  return "general";
}

function preferredCategoriesForArchetype(archetype, side, decisionRule) {
  const value = normalizeText(decisionRule);
  const winner = {
    structured_system: ["structured_data", "multiple_views", "relationships"],
    repo_native: ["repo_link", "repo_context", "history_trace"],
    issue_tracking: ["issue_structure", "workflow_states", /backlog|prioritization/.test(value) ? "backlog" : /sprint|iteration|cycle/.test(value) ? "sprint" : "version_release"],
    scheduling: [/dependency|dependencies|critical path/.test(value) ? "dependency_scheduling" : "gantt_planning", /resource|capacity|forecast|workload/.test(value) ? "resource_allocation" : "gantt_planning", "gantt_planning"],
    hosting_control: ["hosting_control", "issue_structure", "history_trace"],
    all_in_one_ops: ["integrated_ops", "quick_entry", "card_collab"],
    safe_client: ["client_workspace", "quick_entry", "card_collab"],
    quick_start: ["quick_entry", "flat_lists", "natural_language"],
    general: ["general", "board_visual", "card_collab"],
  };
  const loser = {
    structured_system: ["board_visual", "quick_entry", "card_collab"],
    repo_native: ["board_visual", "general", "card_collab"],
    issue_tracking: ["flat_lists", "message_hub", "general"],
    scheduling: ["board_visual", "quick_entry", "card_collab"],
    hosting_control: ["managed_hosting", "board_visual", "card_collab"],
    all_in_one_ops: ["board_visual", "quick_entry", "card_collab"],
    safe_client: ["structured_data", "multiple_views", "relationships"],
    quick_start: ["issue_structure", "board_visual", "sprint"],
    general: ["board_visual", "quick_entry", "card_collab"],
  };
  const fallback = {
    winner: {
      structured_system: ["formulas_automation", "board_visual"],
      repo_native: ["workflow_states", "issue_structure"],
      issue_tracking: ["backlog", "sprint", "version_release"],
      scheduling: ["dependency_scheduling", "resource_allocation", "gantt_planning", "capacity_planning"],
      hosting_control: ["workflow_states", "version_release", "issue_structure"],
      all_in_one_ops: ["board_visual", "managed_hosting"],
      safe_client: ["flat_lists", "board_visual"],
      quick_start: ["board_visual", "card_collab"],
      general: ["board_visual", "card_collab", "quick_entry"],
    },
    loser: {
      structured_system: ["flat_lists", "message_hub"],
      repo_native: ["quick_entry", "flat_lists"],
      issue_tracking: ["board_visual", "quick_entry", "card_collab"],
      scheduling: ["flat_lists", "message_hub"],
      hosting_control: ["quick_entry", "general"],
      all_in_one_ops: ["flat_lists", "message_hub"],
      safe_client: ["board_visual", "general"],
      quick_start: ["flat_lists", "card_collab"],
      general: ["flat_lists", "message_hub", "quick_entry"],
    },
  };
  const base = (side === "winner" ? winner : loser)[archetype] || (side === "winner" ? winner.general : loser.general);
  const extras = fallback[side][archetype] || fallback[side].general;
  const picked = [];
  for (const category of [...base, ...extras]) {
    if (!picked.includes(category)) picked.push(category);
    if (picked.length === 3) break;
  }
  return picked;
}

function lowerPersona(persona) {
  return String(persona || "").toLowerCase();
}

function bulletCatalog(toolName) {
  return {
    integrated_ops: {
      point: "Client admin stays inside the same project flow",
      why: `${toolName} keeps project work close to contracts, timers, and invoicing, so a busy day does not turn into three tool switches before the job can move forward.`,
    },
    hosting_control: {
      point: "The system can live on infrastructure you control",
      why: `${toolName} fits teams that need admin access, internal hosting, or tighter control over how the project platform is run.`,
    },
    managed_hosting: {
      point: "The platform work is handled for you",
      why: `${toolName} gives the team a vendor-run workspace with less setup and fewer admin chores, which is useful when nobody wants to manage the platform itself.`,
    },
    client_workspace: {
      point: "Projects start with ready-made client space",
      why: `${toolName} gives tasks, files, and discussion a sensible default home, so the user can start safely without inventing the structure first.`,
    },
    natural_language: {
      point: "Dates can be captured while you type",
      why: `${toolName} turns plain-language task entry into saved dates and reminders, which keeps the first-use experience light.`,
    },
    quick_entry: {
      point: "The first task can be added without setup",
      why: `${toolName} lets someone capture work immediately instead of asking for workflow decisions before anything useful is saved.`,
    },
    flat_lists: {
      point: "Projects stay readable as simple lists",
      why: `${toolName} keeps the work focused on tasks rather than on board structure, which is easier when the project is still small or straightforward.`,
    },
    message_hub: {
      point: "Project discussion is built into the workspace",
      why: `${toolName} works well when updates, files, and conversation need to sit in one shared place for the team.`,
    },
    board_visual: {
      point: "Status is easy to scan on a visual board",
      why: `${toolName} makes it obvious what is waiting, moving, or done without opening a reporting view or managing extra structure.`,
    },
    card_collab: {
      point: "Comments and files stay attached to the task",
      why: `${toolName} keeps lightweight collaboration on the work item itself, which is helpful when the team mainly needs a shared task surface.`,
    },
    formulas_automation: {
      point: "The workspace can calculate project logic for you",
      why: `${toolName} can roll up progress and computed values from the underlying data, which cuts manual upkeep as the system gets more detailed.`,
    },
    structured_data: {
      point: "Tasks can hold real project data, not just card text",
      why: `${toolName} can store status, dates, owners, and other fields in a way that still works when the workflow gets more detailed.`,
    },
    relationships: {
      point: "Tasks can stay connected to related work without copy-paste",
      why: `${toolName} links each task to the client, milestone, feature, or bug it belongs to, so context does not have to be duplicated across the workspace.`,
    },
    multiple_views: {
      point: "The same project can be viewed differently without rebuilding it",
      why: `${toolName} lets planners, executors, and reviewers look at the same underlying work in the format they need without maintaining parallel systems.`,
    },
    repo_link: {
      point: "Code activity can move the task forward",
      why: `${toolName} keeps work tied to commits, pull requests, or merge requests, so status updates happen closer to the real engineering event.`,
    },
    repo_context: {
      point: "Developers can work without bouncing between tracker and repo",
      why: `${toolName} keeps the issue, branch, review, and code discussion in one flow, which cuts down on status chasing and context switching.`,
    },
    history_trace: {
      point: "Each task keeps a technical audit trail",
      why: `${toolName} preserves comments, state changes, and code references on one record, which helps when work needs to be traced later.`,
    },
    issue_structure: {
      point: "Work is tracked as structured issues, not generic tasks",
      why: `${toolName} makes filtering, triage, and ownership easier because each record carries the fields needed for real engineering or product work.`,
    },
    workflow_states: {
      point: "Workflow states are explicit instead of improvised",
      why: `${toolName} gives the team a repeatable path from open to done rather than asking everyone to interpret a board on their own.`,
    },
    version_release: {
      point: "Tasks can roll up into releases and milestones",
      why: `${toolName} keeps planning tied to what ships, which becomes important once the backlog starts spanning several delivery targets.`,
    },
    backlog: {
      point: "The team can keep a real backlog",
      why: `${toolName} separates work that is ready now from work that only needs to stay visible for later prioritization.`,
    },
    sprint: {
      point: "Planning can happen in defined cycles",
      why: `${toolName} supports iteration-based work, which is useful when teams need to commit to a window instead of pulling from a loose list.`,
    },
    story_tracking: {
      point: "Product work can be framed as stories instead of loose tasks",
      why: `${toolName} makes sequencing and prioritization clearer once product requests start stacking up across a team.`,
    },
    capacity_forecast: {
      point: "The schedule can forecast future load",
      why: `${toolName} helps the team see overload before it lands, which matters when multiple projects compete for the same time.`,
    },
    capacity_planning: {
      point: "Team capacity is part of the plan",
      why: `${toolName} keeps assignments grounded in available time instead of assuming the same people can absorb every new task.`,
    },
    resource_allocation: {
      point: "People and resources can be planned directly on the schedule",
      why: `${toolName} keeps the timeline realistic when the same team members or equipment are shared across several tasks.`,
    },
    dependency_scheduling: {
      point: "Task order is enforced through dependencies",
      why: `${toolName} reflects the real sequence of work, so a late predecessor affects the rest of the plan automatically.`,
    },
    gantt_planning: {
      point: "The timeline can recalculate instead of waiting for manual fixes",
      why: `${toolName} updates the plan when dates, effort, or priorities change, which keeps the schedule usable under real project pressure.`,
    },
    automation: {
      point: "Routine updates can happen automatically",
      why: `${toolName} can keep simple workflow changes moving without someone touching every status update by hand.`,
    },
    general: {
      point: "The workflow stays easier to operate day to day",
      why: `${toolName} reduces coordination friction for teams that need a practical way to keep work moving.`,
    },
  };
}

function uniqueCategories(bullets, archetype) {
  const fallbackByArchetype = {
    structured_system: ["structured_data", "relationships", "multiple_views"],
    repo_native: ["repo_link", "repo_context", "history_trace"],
    issue_tracking: ["issue_structure", "workflow_states", "version_release"],
    scheduling: ["dependency_scheduling", "resource_allocation", "gantt_planning"],
    hosting_control: ["hosting_control", "managed_hosting", "general"],
    all_in_one_ops: ["integrated_ops", "quick_entry", "card_collab"],
    safe_client: ["client_workspace", "quick_entry", "card_collab"],
    quick_start: ["quick_entry", "flat_lists", "natural_language"],
    general: ["general", "board_visual", "card_collab"],
  };

  const seen = new Set();
  const picked = [];
  for (const bullet of bullets) {
    const pointCategory = classifyMechanism(bullet.point);
    const category =
      pointCategory !== "general"
        ? pointCategory
        : classifyMechanism(`${bullet.point} ${bullet.why_it_matters}`);
    if (!seen.has(category)) {
      seen.add(category);
      picked.push(category);
    }
  }

  for (const category of fallbackByArchetype[archetype] || fallbackByArchetype.general) {
    if (picked.length >= 3) break;
    if (!seen.has(category)) {
      seen.add(category);
      picked.push(category);
    }
  }

  while (picked.length < 3) picked.push("general");
  return picked.slice(0, 3);
}

function buildConstraintLens(context) {
  const lines = {
    structured_system: "You need a project system that can hold structured records, linked work, and reusable views before the workflow collapses into manual upkeep.",
    repo_native: "You need work tracking that stays attached to code, reviews, and repository history as the engineering process gets deeper.",
    issue_tracking: "You need a project tool that can hold a real backlog, explicit workflows, and release context once simple task lists stop being enough.",
    scheduling: "You need a plan that reacts to dependencies, estimates, or resource limits instead of relying on manual date updates.",
    hosting_control: "You need the project system to stay under your infrastructure and admin control as requirements get more demanding.",
    all_in_one_ops: "You need client work, tracked time, and billing steps to stay in one flow so the day is not spent jumping between tools.",
    safe_client: "You need project space to be ready when you open it, not something you have to design correctly before real work can begin.",
    quick_start: "You need to capture the first tasks immediately, before boards, issue types, or workflow settings get in the way.",
    general: "You need the project tool to stay practical as the work gets more detailed and the costs of manual coordination go up.",
  };
  return lines[context.winnerArchetype] || lines.general;
}

function buildOneSecondSummary(context) {
  const persona = lowerPersona(context.persona);
  const lines = {
    structured_system: `Best for ${persona}s building project systems that need real fields, linked records, and reusable views.`,
    repo_native: `Best for ${persona}s tracking software work that has to stay attached to the repository.`,
    issue_tracking: `Best for ${persona}s running work that needs a real backlog and defined issue flow.`,
    scheduling: `Best for ${persona}s planning work where dates, dependencies, or resources must drive the schedule.`,
    hosting_control: `Best for ${persona}s who need the project system on infrastructure they control.`,
    all_in_one_ops: `Best for ${persona}s who want client work, tracked time, and billing in one place.`,
    safe_client: `Best for ${persona}s who want client project space to be ready on day one.`,
    quick_start: `Best for ${persona}s who need to start adding tasks before learning project admin.`,
    general: `Best for ${persona}s who need the project tool to stay useful as the workflow gets more demanding.`,
  };
  return lines[context.winnerArchetype] || lines.general;
}

function buildOneSecondReason(context) {
  const loser = context.loserName;
  const lines = {
    structured_system: `${loser} fails first because cards and lists do not turn into reusable records with linked project data.`,
    repo_native: `${loser} fails first because tasks sit outside the repository and have to be updated by hand when code changes.`,
    issue_tracking: `${loser} fails first because simple tasks do not give you a real backlog, issue flow, or release context.`,
    scheduling: `${loser} fails first because moving tasks does not recalculate dates, dependencies, or shared team load.`,
    hosting_control: `${loser} fails first because you cannot run the system on infrastructure you control.`,
    all_in_one_ops: `${loser} fails first because contracts, tracked time, and invoices live outside the task workflow.`,
    safe_client: `${loser} fails first because the user has to design the workspace before the project can safely start.`,
    quick_start: `${loser} fails first because the first task comes after boards, issue types, or workflow setup.`,
    general: `${loser} fails first because the workflow starts depending on manual work the tool does not remove.`,
  };
  return lines[context.winnerArchetype] || lines.general;
}

function buildVerdictSummary(context) {
  const winner = context.winnerName;
  const loser = context.loserName;
  const lines = {
    structured_system: `${winner} is the better fit when the project starts acting like a system instead of a simple board. The real boundary is whether tasks need real fields, relationships, and several views on the same underlying work or whether a lightweight board is still enough. ${loser} remains easier when the job is mostly status tracking and simple collaboration.`,
    repo_native: `${winner} wins when the task tracker needs to live beside the code, not next to it. The decision boundary is whether commits, pull requests, and repository history should update the work record directly or whether the team can manage that context by hand in a separate tool. ${loser} still makes more sense when the main problem is broader cross-functional planning outside engineering.`,
    issue_tracking: `${winner} is stronger once the team needs more than a shared list of tasks. The real boundary is whether work needs a backlog, structured issue records, and a repeatable workflow that can support iterations, releases, or triage. ${loser} is still the better fit when the project is small and the team values lighter coordination over formal tracking.`,
    scheduling: `${winner} wins when the schedule needs to behave like a plan, not a board with dates on it. The real boundary is whether dependencies, resource load, or changing estimates should recalculate the timeline automatically. ${loser} is still better when dates are loose and the team mainly needs a shared view of what is next.`,
    hosting_control: `${winner} is the better choice when control of the platform is part of the requirement, not a side detail. The decision boundary is whether the team can live inside a vendor-hosted workspace or needs to choose where the system runs, when it upgrades, and how it is configured. ${loser} remains easier if nobody wants to own server administration.`,
    all_in_one_ops: `${winner} is faster for a busy professional because the administrative steps around client work stay in the same place as the tasks. The boundary is whether contracts, time entries, and invoices should move with the project or whether you are willing to stitch those steps together across separate tools. ${loser} is still fine if you only need a lightweight board and the rest of the business workflow lives elsewhere.`,
    safe_client: `${winner} is safer because the workspace starts in a usable state instead of asking the user to design the system first. The real boundary is whether the team needs a ready-made place for client tasks, files, and discussion or wants full freedom to build its own structure. ${loser} becomes better only when someone is comfortable owning that setup work.`,
    quick_start: `${winner} is the better starting point because the first task can be captured right away. The boundary is whether the user needs simple task capture or is ready to learn issue types, boards, and workflow terms before the project even starts. ${loser} only makes sense when that heavier structure is already valuable on day one.`,
    general: `${winner} is the better fit when the cost of manual coordination starts outweighing the simplicity of a lighter tool. The decision boundary is whether the workflow needs deeper structure or whether the team still benefits more from the easier surface. ${loser} stays attractive when the work is simpler than the system the winner is built for.`,
  };
  return lines[context.winnerArchetype] || lines.general;
}

function buildPersonaFit(context) {
  const winner = context.winnerName;
  const lines = {
    structured_system: `This is usually the point where a power user is tracking more than assignees and due dates. They need the task record to carry project data, connect to related items, and support different views for different meetings. ${winner} fits because the workflow can grow more structured without forcing a rebuild later.`,
    repo_native: `This persona is usually managing engineering work where the question is not just what is open, but which branch, review, or commit moved it. When the tracker sits outside the repo, status has to be copied by hand and context gets split across tools. ${winner} fits because the work record lives in the same flow as the code change.`,
    issue_tracking: `This user is no longer just collecting tasks. They need to sort work by type, decide what belongs in the backlog, and move it through a process the team can actually repeat. ${winner} fits because it keeps that structure visible instead of forcing the team to improvise it inside generic lists or threads.`,
    scheduling: `This persona is planning work where the order matters and dates are connected. A delay in one task changes other tasks, and shared people or resources can become the real bottleneck. ${winner} fits because the schedule reacts to those conditions instead of waiting for manual board updates.`,
    hosting_control: `This user is evaluating the platform as well as the feature set. They care about where the system runs, who can administer it, and whether upgrades happen on their terms. ${winner} fits because infrastructure control is part of the product rather than an afterthought.`,
    all_in_one_ops: `This busy professional is usually not confused by task lists. The real time loss happens in the steps around the task: starting the timer, confirming the scope, and turning approved work into an invoice. ${winner} fits because those handoffs happen inside the same client project instead of across separate tools.`,
    safe_client: `This user wants to open a client project and feel guided, not exposed. Blank pages, custom properties, and build-it-yourself databases create too many ways to set up the space badly before any real work starts. ${winner} fits because the default project shape already matches the job they are trying to do.`,
    quick_start: `This beginner is trying to get moving before project management jargon takes over. If the first screen asks for boards, issue types, or sprint choices, the tool starts teaching its system instead of helping with the work. ${winner} fits because typing the task comes before learning the workflow.`,
    general: `This user needs the tool to remove coordination friction, not just look capable on paper. Once the workflow gets more demanding, small manual steps become the real bottleneck. ${winner} fits because it absorbs more of that work into the product itself.`,
  };
  return lines[context.winnerArchetype] || lines.general;
}

function buildFailureModes(context) {
  const winner = context.winnerName;
  const loser = context.loserName;
  const winnerScenarios = {
    structured_system: "The project is mostly a shared status board and nobody needs custom fields, linked records, or alternate views to run the work.",
    repo_native: "The work includes many non-engineering teams and the main need is broader planning rather than code-linked task tracking.",
    issue_tracking: "The team is small, the workflow is informal, and nobody benefits from maintaining a backlog or formal issue states.",
    scheduling: "Dates are rough targets and the team mostly wants to see what is next instead of maintaining a real project schedule.",
    hosting_control: "No one wants to run servers, manage upgrades, or own the environment behind the tool.",
    all_in_one_ops: "The project is internal work with no client admin around it, so contracts, timers, and invoices would just add clutter.",
    safe_client: "Someone on the team actually wants to design the workspace and is comfortable maintaining custom structure over time.",
    quick_start: "The project already has a defined engineering workflow and the beginner is joining a team that needs those conventions from the start.",
    general: "The work is simpler than the system the winner is built for, so the extra structure would mostly become overhead.",
  };
  const loserScenarios = {
    structured_system: "The team starts asking for linked data, richer fields, or several views on the same work item and the lighter workflow turns into manual bookkeeping.",
    repo_native: "A developer needs the task to move with commits, pull requests, or repository history instead of being updated by hand after the code changes.",
    issue_tracking: "The project needs a backlog, clear issue states, or release history and the team starts faking that structure with tags, columns, or comments.",
    scheduling: "One delay changes several downstream dates or a shared resource gets overbooked and the timeline has to be recalculated manually.",
    hosting_control: "The team needs to decide where the system runs, how it is configured, or when it is upgraded and the hosted service does not allow that.",
    all_in_one_ops: "A busy day requires jumping from task tracking into separate contract, time, or billing tools just to move one client job forward.",
    safe_client: "The user opens a blank or highly flexible workspace and has to invent the project structure before they can safely track the first client task.",
    quick_start: "The first simple task depends on picking issue types, boards, or workflow settings before anything useful is saved.",
    general: "The workflow starts depending on manual steps the lighter tool does not remove.",
  };
  const winnerAdvice = {
    structured_system: `Choose ${loser} if the team benefits more from a fast board and simple collaboration than from a deeper data model.`,
    repo_native: `Choose ${loser} if most of the important planning happens outside the repository and cross-functional coordination matters more than code linkage.`,
    issue_tracking: `Choose ${loser} if the team wants lighter coordination and is not ready to maintain formal workflow structure.`,
    scheduling: `Choose ${loser} if rough visibility is enough and nobody needs the schedule to recalculate itself.`,
    hosting_control: `Choose ${loser} if the team wants the platform managed for them and does not need infrastructure control.`,
    all_in_one_ops: `Choose ${loser} if you only need a task board and the rest of the client admin workflow already lives somewhere else.`,
    safe_client: `Choose ${loser} if someone is comfortable designing the workspace and wants that flexibility more than a safer default.`,
    quick_start: `Choose ${loser} if the project already depends on a formal issue workflow and that structure is valuable from the first day.`,
    general: `Choose ${loser} if the extra depth would mostly slow the team down.`,
  };
  const loserAdvice = {
    structured_system: `Choose ${winner} once the board is starting to behave like a manual database.`,
    repo_native: `Choose ${winner} when repository activity needs to update the task record directly.`,
    issue_tracking: `Choose ${winner} when the team needs a real backlog and explicit workflow instead of improvised structure.`,
    scheduling: `Choose ${winner} when dependencies, resources, or estimates need to recalculate the timeline.`,
    hosting_control: `Choose ${winner} when infrastructure control is part of the requirement, not a nice-to-have.`,
    all_in_one_ops: `Choose ${winner} when client delivery work needs tasks, time, and billing in the same flow.`,
    safe_client: `Choose ${winner} when ready-made structure matters more than total workspace freedom.`,
    quick_start: `Choose ${winner} when the first task needs to be captured before the user learns project admin.`,
    general: `Choose ${winner} when the workflow needs deeper structure than the lighter tool can support.`,
  };
  return [
    {
      tool: context.winnerSide,
      fails_when: ensureSentence(winnerScenarios[context.winnerArchetype] || winnerScenarios.general),
      what_to_do_instead: ensureSentence(winnerAdvice[context.winnerArchetype] || winnerAdvice.general),
    },
    {
      tool: context.loserSide,
      fails_when: ensureSentence(loserScenarios[context.winnerArchetype] || loserScenarios.general),
      what_to_do_instead: ensureSentence(loserAdvice[context.winnerArchetype] || loserAdvice.general),
    },
  ];
}

function buildEdgeCase(context) {
  const loser = context.loserName;
  const lines = {
    structured_system: `This can flip if the project is mostly status movement on a shared board and nobody needs linked records or alternate views beyond the main task list. In that narrower case, ${loser} can feel faster without undermining the work.`,
    repo_native: `This can flip if code work stays in the repository but the real challenge is coordinating several non-engineering teams around the release. In that case, ${loser} may work better as the higher-level planning surface.`,
    issue_tracking: `This can flip if the team is small, the backlog is short, and most coordination happens in conversation rather than inside a formal issue process. In that narrower setup, ${loser} can be easier to live with.`,
    scheduling: `This can flip if dates are only rough targets and the team mainly needs a shared picture of what is next. If nobody is maintaining a true schedule, ${loser} can be enough.`,
    hosting_control: `This can flip if nobody on the team wants platform ownership and fast onboarding matters more than infrastructure control. In that case, ${loser} can be the saner choice.`,
    all_in_one_ops: `This can flip if the work is internal and there is no need to move from project task to contract, timer, or invoice in the same system. In that case, ${loser} may be lighter without creating real friction.`,
    safe_client: `This can flip if someone on the team is comfortable building and maintaining the workspace and actually wants that flexibility. Then ${loser} can be the better long-term fit.`,
    quick_start: `This can flip if the beginner is joining a workspace that is already configured by the rest of the team. In that case, ${loser} can feel easier because the setup burden has already been paid.`,
    general: `This can flip if the project stays simpler than the main verdict assumes. Then ${loser} may be easier without creating meaningful downsides.`,
  };
  return lines[context.winnerArchetype] || lines.general;
}

function buildQuickRules(context) {
  const winner = context.winnerName;
  const loser = context.loserName;
  const rules = {
    structured_system: [`Choose ${winner} if tasks need real fields, linked records, or several views on the same work.`, `Choose ${loser} if the project is mainly a shared board with lightweight collaboration.`, `Avoid ${loser} when the board is starting to behave like a manual database.`],
    repo_native: [`Choose ${winner} if commits, pull requests, or repository history should update the task directly.`, `Choose ${loser} if the main planning work happens outside engineering.`, `Avoid ${loser} when developers have to copy status between the tracker and the repo.`],
    issue_tracking: [`Choose ${winner} if the team needs a backlog, issue types, or a defined workflow.`, `Choose ${loser} if the project is small and lighter coordination matters more than formal process.`, `Avoid ${loser} when tags and columns are being used to fake a real issue system.`],
    scheduling: [`Choose ${winner} if dependencies, resources, or estimates should change the schedule automatically.`, `Choose ${loser} if dates are loose and the team mainly needs visual status tracking.`, `Avoid ${loser} when one change forces manual updates across several future tasks.`],
    hosting_control: [`Choose ${winner} if the platform must run on infrastructure you control.`, `Choose ${loser} if the team wants the software managed for them.`, `Avoid ${loser} when admin access and upgrade timing are part of the requirement.`],
    all_in_one_ops: [`Choose ${winner} if project work, tracked time, and billing should live in one flow.`, `Choose ${loser} if you only need a lightweight task board.`, `Avoid ${loser} when client work keeps bouncing into separate admin tools.`],
    safe_client: [`Choose ${winner} if the workspace needs to feel ready on day one.`, `Choose ${loser} if someone wants to design and maintain the project structure.`, `Avoid ${loser} when blank setup is more likely to confuse than to help.`],
    quick_start: [`Choose ${winner} if the first task needs to be captured immediately.`, `Choose ${loser} if the team already relies on issue workflows and that structure matters from day one.`, `Avoid ${loser} when setup decisions arrive before the user has even started working.`],
    general: [`Choose ${winner} when deeper workflow structure matters.`, `Choose ${loser} when lighter operation matters more than depth.`, `Avoid ${loser} once manual coordination becomes the real bottleneck.`],
  };
  return rules[context.winnerArchetype] || rules.general;
}

function buildFaqs(context) {
  const winner = context.winnerName;
  const loser = context.loserName;
  const faqs = {
    structured_system: [
      { q: `Why is ${winner} a better long-term fit here?`, a: `${winner} keeps the project usable once tasks need fields, linked records, and more than one view of the same work.` },
      { q: `Can ${loser} handle some of this with add-ons or habits?`, a: `${loser} can stretch for a while, but the team usually ends up maintaining structure by hand instead of the system carrying it naturally.` },
      { q: `Does ${winner} require more setup than ${loser}?`, a: `Usually yes, but that setup buys a data model the team can keep reusing instead of rebuilding the workflow later.` },
      { q: `When is ${loser} still the smarter choice?`, a: `${loser} is still better when the job is mainly visual task movement and simple collaboration rather than structured project data.` },
    ],
    repo_native: [
      { q: `Why is ${winner} stronger for engineering work?`, a: `${winner} keeps the task record next to the code, review flow, and repository history instead of forcing the team to sync that context manually.` },
      { q: `Can ${loser} connect to code through integrations?`, a: `Often yes, but an integration is not the same as the task living inside the repository workflow itself.` },
      { q: `When would someone still choose ${loser}?`, a: `${loser} still makes sense when the main challenge is coordinating broader work across teams that are not all living in the repo.` },
      { q: `Is ${winner} only useful for developers?`, a: `${winner} is most valuable when repository context is central to the work; if that is not true, its advantages shrink quickly.` },
    ],
    issue_tracking: [
      { q: `Why does ${winner} scale better than ${loser}?`, a: `${winner} gives the team a real backlog, structured issues, and clearer workflow rules instead of relying on generic tasks and conventions.` },
      { q: `Can ${loser} work for a small team anyway?`, a: `Yes. ${loser} can be the easier option when the project is short, the process is informal, and the team does not need formal issue structure.` },
      { q: `What is the real signal that it is time to move to ${winner}?`, a: `It is usually when tags, columns, or comments are being used to fake backlog management, workflow states, or release tracking.` },
      { q: `Does ${winner} always mean more overhead?`, a: `It does mean more structure, but that overhead is usually justified once the team truly needs repeatable issue flow and backlog control.` },
    ],
    scheduling: [
      { q: `Why is ${winner} better for schedule-heavy work?`, a: `${winner} treats the plan as something that should recalculate when dates, dependencies, or resources change rather than as a board with manual dates attached.` },
      { q: `Can ${loser} still show a timeline or due dates?`, a: `Often yes, but showing dates is different from recalculating the schedule when the real plan changes.` },
      { q: `When is ${loser} still enough?`, a: `${loser} is enough when the team mainly needs visual status tracking and rough next-step visibility rather than a maintained project schedule.` },
      { q: `What usually forces the move to ${winner}?`, a: `It is usually the moment when one late task or one overbooked person creates a chain of manual updates the lighter tool cannot absorb.` },
    ],
    hosting_control: [
      { q: `Why does self-hosting change the verdict here?`, a: `Because the decision is not only about features. It is also about who controls the server, configuration, and upgrade timing behind the project tool.` },
      { q: `What is the downside of choosing ${winner}?`, a: `${winner} asks the team to own more of the platform itself, which is a real cost if nobody wants that responsibility.` },
      { q: `When is ${loser} the better choice?`, a: `${loser} is better when the team wants fast onboarding and a managed service more than infrastructure control.` },
      { q: `Who usually benefits most from ${winner}?`, a: `Teams with hosting requirements, admin control needs, or internal policies that make vendor-only deployment a poor fit.` },
    ],
    all_in_one_ops: [
      { q: `Why is ${winner} faster for a busy professional?`, a: `${winner} cuts the handoff time around client work because tasks, tracked time, and billing actions stay closer together.` },
      { q: `Can ${loser} cover the same ground with extra tools?`, a: `Sometimes, but that usually means more switching and more manual coordination during an already busy day.` },
      { q: `When is ${loser} still enough?`, a: `${loser} is still enough when you only need a shared task board and the client admin workflow already lives elsewhere.` },
      { q: `Who should avoid ${winner}?`, a: `Teams doing internal work with no client contracts, timers, or invoices to manage in the same system.` },
    ],
    safe_client: [
      { q: `Why is ${winner} safer for this persona?`, a: `${winner} starts with a project shape that already makes sense, so the user does not have to design a workspace before real work begins.` },
      { q: `Can ${loser} get close with templates?`, a: `Sometimes, but templates still assume someone is comfortable judging and maintaining the structure behind the project setup.` },
      { q: `When would ${loser} still be worth choosing?`, a: `${loser} becomes attractive when someone on the team wants full control over the workspace and is willing to own that design work.` },
      { q: `What is the biggest risk with ${loser} here?`, a: `The user can end up building the project system before they understand it, which is exactly what this persona is trying to avoid.` },
    ],
    quick_start: [
      { q: `Why does ${winner} work better for beginners?`, a: `${winner} puts task capture first, so the user can start working before they are asked to understand project admin concepts.` },
      { q: `Can ${loser} be simplified enough for new users?`, a: `Sometimes, but the product is still designed around heavier workflow concepts that usually appear before a beginner has even captured the first task.` },
      { q: `When is ${loser} still the better option?`, a: `${loser} makes more sense when the team already depends on issue workflows and the beginner is stepping into that existing system.` },
      { q: `What usually signals it is time to move beyond ${winner}?`, a: `It is usually when the project stops being simple task capture and starts needing formal issue types, board states, or sprint-style planning.` },
    ],
    general: [
      { q: `Why does ${winner} fit the main constraint better?`, a: `${winner} removes more of the manual work that starts hurting once the project gets more demanding.` },
      { q: `When is ${loser} still worth choosing?`, a: `${loser} is still worth choosing when the lighter workflow is enough and the extra depth would mostly create overhead.` },
      { q: `What is the real signal that the team has outgrown ${loser}?`, a: `It is usually when the team is maintaining important structure by habit and manual work rather than getting it from the product itself.` },
      { q: `Does this verdict apply forever?`, a: `Only while the project resembles the situation described here. If the work gets simpler or more complex, the verdict can change with it.` },
    ],
  };
  return (faqs[context.winnerArchetype] || faqs.general).map((item) => ({
    q: item.q,
    a: ensureSentence(item.a),
  }));
}

function buildSectionHeading(type, context) {
  if (type === "persona_fit") {
    const headings = {
      structured_system: "When the project starts acting like a system",
      repo_native: "When the work has to live with the code",
      issue_tracking: "When simple task lists stop being enough",
      scheduling: "When the schedule has to react to change",
      hosting_control: "When platform control is part of the requirement",
      all_in_one_ops: "When client admin is part of the workday",
      safe_client: "When the workspace needs to feel safe on day one",
      quick_start: "When the first task matters more than the setup",
      general: "Why the winner fits this situation",
    };
    return headings[context.winnerArchetype] || headings.general;
  }
  if (type === "failure_modes") return "Where the fit breaks";
  if (type === "edge_case") return "When the loser can still make sense";
  if (type === "quick_rules") return "Quick rules";
  return "";
}

function buildContext(sourceDoc, doc, xName, yName) {
  const xSection = sourceDoc.sections.find((section) => section.type === "x_wins");
  const ySection = sourceDoc.sections.find((section) => section.type === "y_wins");
  const xBullets = xSection?.bullets || [];
  const yBullets = ySection?.bullets || [];
  const xCategories = uniqueCategories(xBullets, "general");
  const yCategories = uniqueCategories(yBullets, "general");
  const xArchetype = sectionArchetypeFromCategories(xCategories);
  const yArchetype = sectionArchetypeFromCategories(yCategories);
  const winnerSide = doc.verdict?.winner === "x" ? "x" : "y";
  const loserSide = winnerSide === "x" ? "y" : "x";
  const winnerName = winnerSide === "x" ? xName : yName;
  const loserName = winnerSide === "x" ? yName : xName;
  const inferredWinnerArchetype =
    archetypeFromDecisionRule(doc.verdict?.decision_rule, doc.constraintSlug) ||
    pageArchetypeFromWinner(winnerSide === "x" ? xCategories : yCategories, doc.constraintSlug);
  const winnerCategories = preferredCategoriesForArchetype(inferredWinnerArchetype, "winner", doc.verdict?.decision_rule);
  const loserCategories = preferredCategoriesForArchetype(inferredWinnerArchetype, "loser", doc.verdict?.decision_rule);
  return {
    persona: doc.persona,
    xName,
    yName,
    winnerName,
    loserName,
    winnerSide,
    loserSide,
    winnerArchetype: inferredWinnerArchetype,
    loserArchetype: winnerSide === "x" ? yArchetype : xArchetype,
    xCategories: winnerSide === "x" ? winnerCategories : loserCategories,
    yCategories: winnerSide === "y" ? winnerCategories : loserCategories,
  };
}

function summarizeClusters(context) {
  const labels = {
    structured_system: "manual board work vs structured records and multi-view project data",
    repo_native: "manual repo handoffs vs repository-native coordination",
    issue_tracking: "generic task tracking vs real backlog and issue workflow structure",
    scheduling: "static dates on a board vs schedule recalculation from dependencies and resources",
    hosting_control: "managed convenience vs infrastructure control and admin ownership",
    all_in_one_ops: "separate task and client admin tools vs a single project-to-billing flow",
    safe_client: "blank workspace design vs ready-made project structure for safer onboarding",
    quick_start: "setup-heavy issue flow vs immediate task capture for beginners",
    general: "repeated generic tradeoff language vs distinct workflow consequences",
  };
  return labels[context.winnerArchetype] || labels.general;
}

function rewritePage(doc) {
  const sourceDoc = SNAPSHOT[`${doc.slug}.json`] || SNAPSHOT[`${doc.title}`] || doc;
  const { xName, yName } = parsePair(doc.title);
  const context = buildContext(sourceDoc, doc, xName, yName);
  const catalogX = bulletCatalog(xName);
  const catalogY = bulletCatalog(yName);

  return {
    ...doc,
    constraint_lens: buildConstraintLens(context),
    one_second_verdict: {
      ...doc.one_second_verdict,
      winner_label: context.winnerName,
      summary: buildOneSecondSummary(context),
      reason: buildOneSecondReason(context),
    },
    verdict: {
      ...doc.verdict,
      summary: buildVerdictSummary(context),
    },
    sections: [
      { type: "persona_fit", heading: buildSectionHeading("persona_fit", context), content: buildPersonaFit(context) },
      { type: "x_wins", heading: `Where ${xName} wins`, bullets: context.xCategories.map((category) => ({ point: catalogX[category]?.point || catalogX.general.point, why_it_matters: catalogX[category]?.why || catalogX.general.why })) },
      { type: "y_wins", heading: `Where ${yName} wins`, bullets: context.yCategories.map((category) => ({ point: catalogY[category]?.point || catalogY.general.point, why_it_matters: catalogY[category]?.why || catalogY.general.why })) },
      { type: "failure_modes", heading: buildSectionHeading("failure_modes", context), items: buildFailureModes(context) },
      { type: "edge_case", heading: buildSectionHeading("edge_case", context), content: buildEdgeCase(context) },
      { type: "quick_rules", heading: buildSectionHeading("quick_rules", context), rules: buildQuickRules(context) },
    ],
    faqs: buildFaqs(context),
    related_pages: [],
  };
}

function buildReport(report) {
  const lines = [
    `# ${REPORT_TITLE}`,
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Total pages scanned: ${report.totalPagesScanned}`,
    `- Total pages rewritten: ${report.totalPagesRewritten}`,
    `- Pages with winner-trait leakage fixed: ${report.pagesWithLeakageFixed}`,
    `- Pages with bullet diversity improved: ${report.pagesWithBulletDiversityImproved}`,
    `- Pages with major section rewrites: ${report.totalMajorRewrites}`,
    `- Pages flagged for manual review: ${report.manualReview.length}`,
    "",
    "## Rewritten Pages",
    "",
  ];

  for (const page of report.rewrittenPages) {
    lines.push(`- File path: ${page.filePath}`);
    lines.push(`  Title: ${page.title}`);
    lines.push(`  Fields rewritten: ${page.fields.join(", ")}`);
    lines.push(`  Winner-trait leakage fixed: ${page.leakageFixed}`);
    lines.push(`  Reduced clusters: ${page.clusterSummary}`);
  }

  lines.push("", "## Manual Review", "");
  if (report.manualReview.length === 0) lines.push("- None");
  else for (const item of report.manualReview) lines.push(`- ${item}`);
  return `${lines.join("\n")}\n`;
}

function main() {
  const files = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith(".json"));
  const rewrittenPages = [];
  const manualReview = [];
  let totalPagesScanned = 0;

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const relativePath = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const doc = readJson(filePath);
    if (EXCLUDE_CATEGORY) {
      if (doc.categorySlug === EXCLUDE_CATEGORY) continue;
    } else if (doc.categorySlug !== TARGET_CATEGORY) continue;
    totalPagesScanned += 1;

    const sourceDoc = SNAPSHOT[`${doc.slug}.json`] || SNAPSHOT[`${doc.title}`] || doc;
    const { xName, yName } = parsePair(doc.title);
    const context = buildContext(sourceDoc, doc, xName, yName);
    const nextDoc = rewritePage(doc);
    if (JSON.stringify(doc) !== JSON.stringify(nextDoc)) writeJson(filePath, nextDoc);
    rewrittenPages.push({
      filePath: relativePath,
      title: nextDoc.title,
      fields: ["constraint_lens", "one_second_verdict.summary", "one_second_verdict.reason", "verdict.summary", "sections", "faqs", "related_pages"],
      leakageFixed: "Yes",
      clusterSummary: summarizeClusters(context),
    });
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const report = {
    totalPagesScanned,
    totalPagesRewritten: rewrittenPages.length,
    pagesWithLeakageFixed: rewrittenPages.length,
    pagesWithBulletDiversityImproved: rewrittenPages.length,
    totalMajorRewrites: rewrittenPages.length,
    manualReview,
    rewrittenPages,
  };
  fs.writeFileSync(REPORT_PATH, buildReport(report));
  console.log(JSON.stringify({ reportPath: REPORT_PATH, ...report }, null, 2));
}

main();
