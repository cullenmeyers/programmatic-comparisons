/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "task-managers-second-pass-report.md");

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
    "Student": "student",
  };
  return map[persona] || lower(persona || "user");
}

function detectArchetype(rule) {
  const value = lower(rule);
  if (/database|fields|properties|table structure|database rows|custom fields|structured board data/.test(value)) return "database_structure";
  if (/advanced filters|rule-based queries|smart list|contexts|perspectives|review automation|advanced task fields|complex recurrence|recurring rule/.test(value)) return "advanced_logic";
  if (/issue workflows|sprint planning|backlog management|issue types|workflow schemes/.test(value)) return "issue_workflow";
  if (/dependencies|timeline scheduling|timeline planning|connected flows|dependency relationships/.test(value)) return "dependency_planning";
  if (/self-host|server maintenance|plugin maintenance|self-hosted/.test(value)) return "self_host_maintenance";
  if (/boards|cards|kanban columns|board management|task placement|moving cards|board-based organization/.test(value)) return "board_model";
  if (/projects before adding tasks|project setup|project layers|workspace|dashboards|project views|team coordination|collaborative project workspaces|enterprise-level structure|multiple views|configuration panels|spaces|folders/.test(value)) return "workspace_structure";
  if (/gtd|perspectives|contexts|review workflows|daily planning|planning sessions|gamification|rpg|frameworks or terminology|automatic scheduling/.test(value)) return "framework_overhead";
  if (/chat interface|shared project workspaces with collaborators|calendar views|integrated calendar|reminders|recurring schedules/.test(value)) return "integration_behavior";
  if (/syncing|ui behavior feels unpredictable|doing it wrong|risky or confusing|formal or rigid|command-line commands/.test(value)) return "safety_clarity";
  if (/semester|term|short-term academic needs|outweighs.*benefit/.test(value)) return "short_horizon";
  return "general";
}

function buildContext(doc) {
  const { xName, yName } = parsePair(doc.title);
  const winnerSide = doc.verdict?.winner === "x" ? "x" : "y";
  const loserSide = winnerSide === "x" ? "y" : "x";
  const rule = doc.verdict?.decision_rule || "";
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
    archetype: detectArchetype(rule),
    orientation: detectOrientation(doc.constraintSlug, rule, detectArchetype(rule)),
  };
}

function detectOrientation(constraintSlug, rule, archetype) {
  const value = lower(rule);
  if (constraintSlug === "ceiling-check") return "depth";
  if (archetype === "framework_overhead" || archetype === "self_host_maintenance" || archetype === "safety_clarity" || archetype === "short_horizon") return "simplicity";
  if (archetype === "dependency_planning" || archetype === "integration_behavior") return "depth";
  if (archetype === "database_structure") {
    if (/must be configured before use|before adding|before use|design a system before adding|database setup/.test(value)) return "simplicity";
    return "depth";
  }
  if (archetype === "advanced_logic") {
    if (/constrained|limited/.test(value)) return "depth";
    return "simplicity";
  }
  if (archetype === "issue_workflow") {
    if (/must be understood before|must be learned first|slows simple task entry/.test(value)) return "simplicity";
    return "depth";
  }
  if (archetype === "workspace_structure") {
    if (/cannot be organized|cannot include|require leaving the chat interface/.test(value)) return "depth";
    return "simplicity";
  }
  if (archetype === "board_model") {
    if (/must be added through external power-ups instead of native card behavior/.test(value)) return "depth";
    return "simplicity";
  }
  return constraintSlug === "time-scarcity" ? "simplicity" : "simplicity";
}

function winnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    database_structure: [
      { point: `${w} keeps setup decisions tied to useful structure`, why_it_matters: `The extra fields or properties pay off because the task model can hold more than a plain title without collapsing into workarounds later.` },
      { point: `${w} gives daily task handling more precision`, why_it_matters: `You can sort, filter, or update work using structured data instead of scanning long generic lists by eye.` },
      { point: `${w} scales the task system without forcing a rebuild`, why_it_matters: `As projects get more detailed, the same underlying structure keeps supporting new views and workflows.` },
    ],
    advanced_logic: [
      { point: `${w} turns large task lists into targeted working views`, why_it_matters: `Filters, perspectives, or query rules reduce the amount of noise you have to scan before deciding what matters now.` },
      { point: `${w} saves time by automating repeat organization`, why_it_matters: `You do not have to keep rebuilding the same views by hand when the system can apply the logic for you.` },
      { point: `${w} supports more deliberate control over structure`, why_it_matters: `Power users can shape how work appears and behaves instead of accepting one fixed list model for everything.` },
    ],
    issue_workflow: [
      { point: `${w} gives the team a clearer operating structure from the start`, why_it_matters: `Issue types, workflow states, and backlog rules make work easier to route instead of leaving every task to ad hoc handling.` },
      { point: `${w} keeps daily execution aligned with delivery flow`, why_it_matters: `Sprint and backlog mechanics help the team move work forward without constantly renegotiating what stage it is in.` },
      { point: `${w} makes planning and tracking speak the same language`, why_it_matters: `The structure used to plan work is also the structure used to execute and review it.` },
    ],
    dependency_planning: [
      { point: `${w} makes task order visible before work starts`, why_it_matters: `Dependencies or connected flows expose sequencing problems during setup instead of after tasks begin colliding.` },
      { point: `${w} keeps daily planning realistic when one task affects another`, why_it_matters: `You can see what must move next without manually rethinking the whole chain every time something slips.` },
      { point: `${w} gives the task system a truer map of the work`, why_it_matters: `The structure reflects relationships between tasks rather than pretending every item is independent.` },
    ],
    self_host_maintenance: [
      { point: `${w} removes technical upkeep from the normal task workflow`, why_it_matters: `You can use the tool without turning hosting, plugins, or updates into a separate maintenance responsibility.` },
      { point: `${w} keeps daily task work more predictable`, why_it_matters: `There are fewer moving parts between the user and the task list, so the app feels less fragile over time.` },
      { point: `${w} lowers the hidden cost of keeping the system alive`, why_it_matters: `The task manager does not keep asking for operational attention outside the actual work it is meant to support.` },
    ],
    board_model: [
      { point: `${w} matches the way this user naturally locates work`, why_it_matters: `The core layout makes sense immediately, so less setup time is spent translating tasks into an unfamiliar structure.` },
      { point: `${w} keeps daily navigation more obvious`, why_it_matters: `You can tell where a task belongs or where to find it without second-guessing the tool's visual model.` },
      { point: `${w} reduces cognitive friction during task movement`, why_it_matters: `The structure feels native to the job instead of making each drag, drop, or nest decision feel interpretive.` },
    ],
    workspace_structure: [
      { point: `${w} shortens the path from opening the app to adding work`, why_it_matters: `Fewer workspace layers mean the user spends less time deciding where a task belongs before it even exists.` },
      { point: `${w} keeps daily use focused on tasks instead of platform structure`, why_it_matters: `The app asks for less navigation through projects, dashboards, or team containers before useful action happens.` },
      { point: `${w} lowers the mental load of staying organized`, why_it_matters: `You do not have to keep the whole workspace map in your head just to capture and find tasks reliably.` },
    ],
    framework_overhead: [
      { point: `${w} avoids teaching a system before it helps with the work`, why_it_matters: `You can start using the app without first absorbing a planning ritual, productivity doctrine, or game layer.` },
      { point: `${w} keeps daily task handling closer to plain execution`, why_it_matters: `There are fewer checkpoints where the user has to pause and decide how the framework wants the task to be processed.` },
      { point: `${w} leaves more attention for the task itself`, why_it_matters: `The tool demands less interpretation, so the system does not become another thing you have to manage.` },
    ],
    integration_behavior: [
      { point: `${w} keeps the task tool closer to the place where the work already happens`, why_it_matters: `That reduces context switching because the user does not have to bounce between disconnected surfaces to keep the task current.` },
      { point: `${w} speeds up daily coordination`, why_it_matters: `Reminders, chat, collaboration, or calendar behavior work with the task instead of forcing a second pass in another app.` },
      { point: `${w} gives the task system a stronger role in the workflow`, why_it_matters: `The task is not just stored; it can connect to the surrounding actions that make it useful.` },
    ],
    safety_clarity: [
      { point: `${w} feels easier to trust on first use`, why_it_matters: `The user can predict what will happen when they add, move, or sync a task without feeling like they might break the system.` },
      { point: `${w} keeps navigation and labels easier to interpret`, why_it_matters: `Clearer structure lowers the chance that someone hesitates because they are unsure what the app expects.` },
      { point: `${w} reduces the emotional tax of routine task management`, why_it_matters: `The tool feels safer because normal use does not keep surfacing technical or conceptual uncertainty.` },
    ],
    short_horizon: [
      { point: `${w} becomes useful before the payoff window closes`, why_it_matters: `A student can get value quickly instead of spending too much of the term learning structure that may not matter long enough.` },
      { point: `${w} keeps day-to-day tracking lighter during a busy season`, why_it_matters: `Less setup and less structure means more of the short horizon is spent using the tool rather than configuring it.` },
      { point: `${w} asks for less long-term commitment to its system`, why_it_matters: `That matters when academic needs are temporary and the cost of adopting a heavy workflow may not be recovered.` },
    ],
    general: [
      { point: `${w} lowers the initial friction in a meaningful way`, why_it_matters: `The task tool becomes useful sooner instead of asking for structure that has not earned its place yet.` },
      { point: `${w} keeps daily task handling faster`, why_it_matters: `The core workflow demands fewer steps and less second-guessing during routine use.` },
      { point: `${w} organizes work in a way that stays understandable`, why_it_matters: `The structure supports the job instead of becoming another layer to manage.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function loserBullets(context) {
  const l = context.loserName;
  const sets = {
    database_structure: [
      { point: `${l} is easier when the task record does not need much structure`, why_it_matters: `A simpler tool can feel faster when titles, dates, and a few lightweight markers are enough.` },
      { point: `${l} keeps capture more immediate`, why_it_matters: `You can often add work before thinking about fields, properties, or how the data model should be shaped.` },
      { point: `${l} asks for less system design up front`, why_it_matters: `That can be better if the user wants a task list, not a build-your-own operating model.` },
    ],
    advanced_logic: [
      { point: `${l} feels calmer when the task list is still manageable by sight`, why_it_matters: `A simpler view can be enough if the user is not yet dealing with enough volume to justify query logic.` },
      { point: `${l} reduces feature surface during routine use`, why_it_matters: `Fewer advanced controls can make the app feel lighter when power-user depth would mostly stay unused.` },
      { point: `${l} favors direct navigation over system tuning`, why_it_matters: `Some users would rather visit projects and lists manually than maintain a layer of saved logic.` },
    ],
    issue_workflow: [
      { point: `${l} stays lighter when formal workflow depth is unnecessary`, why_it_matters: `If the work does not truly need backlog and sprint machinery, less structure can be a real advantage.` },
      { point: `${l} makes task capture faster for less formal work`, why_it_matters: `The user can add items without immediately deciding how they fit into a delivery process.` },
      { point: `${l} lowers the cost of staying flexible`, why_it_matters: `The app leaves more room for informal work patterns when rigid issue workflow would feel heavy.` },
    ],
    dependency_planning: [
      { point: `${l} is simpler when tasks are mostly independent`, why_it_matters: `A flatter model can be easier to maintain if the user does not actually need to map a chain of work.` },
      { point: `${l} speeds up entry when sequencing is obvious`, why_it_matters: `You do not have to define relationships for tasks that can safely be handled one by one.` },
      { point: `${l} avoids the upkeep of a more explicit planning structure`, why_it_matters: `That is helpful when the overhead of modeling dependencies would exceed the value.` },
    ],
    self_host_maintenance: [
      { point: `${l} can still appeal if you want deeper control`, why_it_matters: `Some users accept the extra upkeep because ownership of the environment matters more than convenience.` },
      { point: `${l} may fit teams that already manage similar systems`, why_it_matters: `The maintenance cost shrinks if hosting and updates are familiar rather than intimidating.` },
      { point: `${l} can unlock more technical flexibility`, why_it_matters: `That tradeoff may be worth it when the user intentionally wants the burden that everyone else is trying to avoid.` },
    ],
    board_model: [
      { point: `${l} can still help when its visual structure matches the work`, why_it_matters: `Some users really do think best in columns, boards, or card movement, even if others find that model noisy.` },
      { point: `${l} gives a broader spatial picture of tasks`, why_it_matters: `That can be useful when seeing task stages matters more than compact text-based organization.` },
      { point: `${l} may feel more engaging for collaborative movement`, why_it_matters: `A board can be the better fit when the visible movement of work is the real point of the system.` },
    ],
    workspace_structure: [
      { point: `${l} can pay off when the user truly needs collaborative structure`, why_it_matters: `Projects, dashboards, and workspaces help once the task list is part of a broader team system instead of a personal queue.` },
      { point: `${l} keeps related work grouped in a richer container`, why_it_matters: `The extra layers can reduce ambiguity later if the surrounding project context is genuinely important.` },
      { point: `${l} may scale better for multi-person coordination`, why_it_matters: `The same structure that slows capture can help once ownership, visibility, and team separation matter more.` },
    ],
    framework_overhead: [
      { point: `${l} can still help if the framework is the reason you want the app`, why_it_matters: `Some users value the ritual because it provides guidance, accountability, or a stronger planning method.` },
      { point: `${l} offers more deliberate reflection around tasks`, why_it_matters: `The extra steps can be useful when the goal is not only remembering work but shaping how it gets prioritized.` },
      { point: `${l} can create more consistency for people who like systems`, why_it_matters: `A stronger framework is not always noise if it matches the user's preferred way of thinking.` },
    ],
    integration_behavior: [
      { point: `${l} stays cleaner when the extra integration is unnecessary`, why_it_matters: `A narrower tool can be better if the user does not want tasks entangled with every surrounding workflow.` },
      { point: `${l} can reduce dependence on another platform`, why_it_matters: `That matters when simplicity or portability matters more than tighter connection.` },
      { point: `${l} may feel easier for purely personal use`, why_it_matters: `Some solo workflows benefit more from isolation than from deep integration.` },
    ],
    safety_clarity: [
      { point: `${l} can still work if the user understands its model already`, why_it_matters: `What feels risky to one person may feel natural to someone who is already comfortable with the app's structure.` },
      { point: `${l} may offer more organizational depth`, why_it_matters: `That can be worth the extra interpretive burden once the user is ready for it.` },
      { point: `${l} can become clearer after the learning curve is paid`, why_it_matters: `The downside here is about trust and onboarding, not that the tool can never become usable.` },
    ],
    short_horizon: [
      { point: `${l} can still pay off if the same system will last beyond the short horizon`, why_it_matters: `A heavier app may make sense if the student is really investing in a longer-term workflow.` },
      { point: `${l} can provide more structure for complex coursework`, why_it_matters: `The extra setup may be justified when assignments truly need it right away.` },
      { point: `${l} may be the better choice if collaboration or planning depth matters more than fast adoption`, why_it_matters: `The problem here is timing, not that the tool lacks value.` },
    ],
    general: [
      { point: `${l} can still be better in a simpler setup`, why_it_matters: `The losing tool may remain the calmer option if the rule's friction is not showing up very often yet.` },
      { point: `${l} may feel lighter for users who do not need the winner's depth`, why_it_matters: `Some workflows benefit more from a narrower surface than from extra capability.` },
      { point: `${l} can reduce commitment up front`, why_it_matters: `That matters when the user is not ready to pay the cost of a more structured system.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function simplicityWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    database_structure: [
      { point: `${w} lets you capture the task before designing the system`, why_it_matters: `The user can start with the work itself instead of deciding on fields, properties, or table logic first.` },
      { point: `${w} keeps daily task handling lighter`, why_it_matters: `Routine updates take less interpretation because the task is not wrapped in a heavier data model than the workflow needs.` },
      { point: `${w} reduces structural thinking while organizing work`, why_it_matters: `You spend less time deciding how the system should represent a task and more time deciding what to do about it.` },
    ],
    advanced_logic: [
      { point: `${w} keeps setup smaller by not asking for power-user logic up front`, why_it_matters: `The user can start working without building filters, rules, or views that may not yet earn their cost.` },
      { point: `${w} keeps daily execution closer to the list itself`, why_it_matters: `There is less system tuning between opening the app and acting on a task.` },
      { point: `${w} lowers cognitive load for routine planning`, why_it_matters: `The user does not have to keep a layer of saved logic in mind just to stay organized.` },
    ],
    issue_workflow: [
      { point: `${w} removes process learning from the first task`, why_it_matters: `The user can add and move work before understanding issue types, backlog rules, or workflow schemes.` },
      { point: `${w} keeps the day focused on execution instead of process maintenance`, why_it_matters: `Fewer formal workflow decisions means less friction during ordinary task handling.` },
      { point: `${w} makes the system easier to hold in your head`, why_it_matters: `The task model stays closer to direct work instead of requiring process concepts to interpret it.` },
    ],
    dependency_planning: [
      { point: `${w} avoids upfront planning structure when the work is still simple`, why_it_matters: `You do not have to model relationships before knowing whether they matter enough to pay back the effort.` },
      { point: `${w} keeps daily planning more direct`, why_it_matters: `The user can focus on current tasks instead of maintaining a richer dependency map.` },
      { point: `${w} lowers structural overhead around organization`, why_it_matters: `The task manager stays lighter when sequencing is occasional rather than central.` },
    ],
    self_host_maintenance: [
      { point: `${w} starts working without technical upkeep`, why_it_matters: `The user is not blocked by hosting, plugins, or maintenance chores before the task list can be useful.` },
      { point: `${w} keeps day-to-day use more predictable`, why_it_matters: `Normal task work is less likely to be interrupted by the side effects of maintaining the system itself.` },
      { point: `${w} removes a hidden cognitive tax`, why_it_matters: `You do not have to keep the health of the task platform in mind while trying to manage the work it contains.` },
    ],
    board_model: [
      { point: `${w} makes initial organization feel more obvious`, why_it_matters: `The user can place and find tasks without first adapting to a visual model that may not match how they think.` },
      { point: `${w} keeps routine navigation simpler`, why_it_matters: `The path to a task is clearer because the structure asks for fewer interpretive moves.` },
      { point: `${w} lowers uncertainty during task movement`, why_it_matters: `The user spends less time wondering where something belongs or what a move really means.` },
    ],
    workspace_structure: [
      { point: `${w} shortens the path from opening the app to adding a task`, why_it_matters: `There are fewer workspace, project, or dashboard layers standing between intention and capture.` },
      { point: `${w} keeps daily use centered on the task itself`, why_it_matters: `The user spends less effort navigating the platform and more effort handling the work.` },
      { point: `${w} asks for a smaller mental map`, why_it_matters: `It is easier to stay oriented when the app does not require a broad project structure just to remain usable.` },
    ],
    framework_overhead: [
      { point: `${w} helps before it starts teaching a system`, why_it_matters: `The user can benefit quickly without first adopting a ritual, method, or game layer.` },
      { point: `${w} keeps daily task flow closer to plain execution`, why_it_matters: `There are fewer framework steps standing between noticing work and recording or doing it.` },
      { point: `${w} leaves more attention for the work than the method`, why_it_matters: `The system demands less interpretation, which is the real benefit when the framework is the source of friction.` },
    ],
    integration_behavior: [
      { point: `${w} keeps the tool leaner when extra integration is not the main need`, why_it_matters: `The user is not forced into a broader connected workflow before basic task handling feels comfortable.` },
      { point: `${w} speeds up routine use by reducing platform switching decisions`, why_it_matters: `The task manager stays focused instead of asking the user to manage the connection model as well.` },
      { point: `${w} keeps the task system easier to reason about`, why_it_matters: `Less connection logic means fewer moving parts to remember while staying organized.` },
    ],
    safety_clarity: [
      { point: `${w} feels safer from the first interaction`, why_it_matters: `The user can trust normal actions like adding, moving, or syncing tasks without second-guessing the tool.` },
      { point: `${w} keeps daily navigation clearer`, why_it_matters: `Routine use is faster because labels, placement, and behavior are easier to interpret.` },
      { point: `${w} reduces the emotional drag of using the system`, why_it_matters: `Less uncertainty means the user spends more energy on the task and less on whether the app is being used correctly.` },
    ],
    short_horizon: [
      { point: `${w} becomes useful fast enough to match the short payoff window`, why_it_matters: `The user can get value now instead of spending too much of the term or season learning the system.` },
      { point: `${w} keeps day-to-day use lighter during a temporary need`, why_it_matters: `There is less setup and less process to maintain while the time horizon is short.` },
      { point: `${w} asks for less long-term commitment to its model`, why_it_matters: `That matters when the need may end before a heavier system has time to pay back its learning cost.` },
    ],
    general: [
      { point: `${w} lowers setup friction in a practical way`, why_it_matters: `The user can get to useful task handling sooner.` },
      { point: `${w} keeps daily workflow faster`, why_it_matters: `Routine task actions take less thought and fewer steps.` },
      { point: `${w} keeps the system easier to understand`, why_it_matters: `The structure supports the work instead of becoming extra work.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function simplicityLoserBullets(context) {
  const l = context.loserName;
  const sets = {
      database_structure: [
        { point: `${l} gives richer structure once the workflow really needs it`, why_it_matters: `Fields and properties become useful when tasks have to carry more than a title, date, and simple status.` },
        { point: `${l} creates cleaner working views when the list gets crowded`, why_it_matters: `A stronger data model makes it easier to sort, filter, and report on work without scanning everything manually.` },
        { point: `${l} scales better when the task system becomes a shared operating model`, why_it_matters: `The same structure that feels heavy early can pay back later when many projects or people rely on consistent records.` },
      ],
      advanced_logic: [
        { point: `${l} gives stronger control once the list becomes complex enough`, why_it_matters: `Filters, rules, or power-user views can replace a lot of manual browsing after task volume rises.` },
        { point: `${l} reduces repeated cleanup in daily workflow`, why_it_matters: `Saved logic can keep recurring organization work from turning into a constant maintenance chore.` },
        { point: `${l} offers deeper tuning for people who want to shape the system`, why_it_matters: `The extra controls matter when a custom operating model is part of the goal, not just an accidental burden.` },
      ],
      issue_workflow: [
        { point: `${l} provides more formal workflow depth when it becomes necessary`, why_it_matters: `Issue types and backlog structure help once the work truly needs repeatable routing instead of loose lists.` },
        { point: `${l} organizes day-to-day team handoffs more clearly`, why_it_matters: `The extra workflow states can reduce ambiguity when many people are moving work between stages.` },
        { point: `${l} gives leadership a stronger tracking model`, why_it_matters: `That added process pays off when planning, execution, and review all need to use the same delivery structure.` },
      ],
      workspace_structure: [
        { point: `${l} gives broader project structure when that structure is doing real work`, why_it_matters: `Projects, spaces, or dashboards help when a task needs to live inside a fuller planning system instead of a single list.` },
        { point: `${l} keeps surrounding context attached to the task`, why_it_matters: `Extra layers can make navigation clearer later when updates, owners, and related work need to stay grouped together.` },
        { point: `${l} scales better for team-level coordination`, why_it_matters: `The same structure that slows capture can help once many projects or collaborators need separation and visibility.` },
      ],
      general: [
        { point: `${l} offers more setup depth if the workflow grows into it`, why_it_matters: `The extra structure can become valuable later even if it feels heavy right now.` },
        { point: `${l} can add more control to daily coordination`, why_it_matters: `That matters when the workflow truly needs stronger routing, views, or rules than the winner provides.` },
        { point: `${l} handles broader organization once complexity is intentional`, why_it_matters: `The losing tool's extra layers are not useless, but they pay back only when scale and structure become real needs.` },
      ],
    };
    return sets[context.archetype] || sets.general;
  }

function buildPersonaFit(context) {
  const w = context.winnerName;
  const p = context.personaNoun;
  if (context.orientation === "simplicity") {
    const simple = {
      database_structure: `${w} fits this ${p} because the same database-first mechanism creates several costs at once. It slows the first capture, adds more structure to think through during daily use, and makes a simple task list feel like something that has to be designed before it can help. The better fit here wins by reducing those layers, not by pretending structure never matters.`,
      advanced_logic: `${w} fits this ${p} because the issue is not whether advanced logic exists, but whether the user has to carry it. Extra filters, recurrence logic, or power-user controls can create setup work, navigation clutter, and more thinking than the workflow actually needs. ${w} wins by keeping those costs out of the way until they become truly necessary.`,
      issue_workflow: `${w} fits this ${p} because formal issue structure changes more than the screen layout. It adds workflow concepts to learn, more decisions during entry, and more process between a thought and a saved task. ${w} wins by keeping task handling closer to direct use.`,
      dependency_planning: `${w} fits this ${p} because even useful planning structure can become overhead when the task system is still simple. If relationships have to be modeled before they matter, the user pays setup and thinking cost too early. ${w} works better by keeping the plan lighter until dependencies are truly central.`,
      self_host_maintenance: `${w} fits this ${p} because upkeep does not stay in the background. It shows up as setup work, periodic maintenance, and a lingering sense that the task manager needs its own care routine. ${w} wins by removing that extra responsibility from normal use.`,
      board_model: `${w} fits this ${p} because the core task model shapes both confidence and speed. If the user has to keep interpreting boards, cards, or placement rules, the same friction appears during setup, daily moves, and task retrieval. ${w} wins by making organization feel more obvious.`,
      workspace_structure: `${w} fits this ${p} because extra workspace layers make the same task harder in several ways. They slow first capture, lengthen the path back to the list, and ask the user to remember more structure than the task itself requires. ${w} wins by keeping the path shorter and the mental model smaller.`,
      framework_overhead: `${w} fits this ${p} because heavy methods do not just add theory. They also add steps, terminology, and more chances for the system to interrupt execution. ${w} wins by keeping the task manager useful without first making the user participate in a method.`,
      integration_behavior: `${w} fits this ${p} because the right connection should remove work, not add another platform layer to manage. The better tool here either keeps the needed integration close or avoids unnecessary switching without adding complexity for its own sake.`,
      safety_clarity: `${w} fits this ${p} because uncertainty is a real operating cost. When the interface or model feels risky, the user slows down during capture, organization, and routine updates. ${w} wins by making normal actions feel predictable.`,
      short_horizon: `${w} fits this ${p} because the payoff window is too short to absorb a heavy system lightly. Setup time, learning effort, and extra structure all matter more when the need may end soon. ${w} wins by becoming useful quickly enough to justify itself.`,
      general: `${w} fits this ${p} because it keeps the same friction from showing up in setup, daily use, and organization all at once.`,
    };
    return sentence(simple[context.archetype] || simple.general);
  }
  const content = {
    database_structure: `${w} fits this ${p} because the same structural mechanism changes more than setup. It affects how fast tasks can be entered, how much thought is required to organize them later, and whether the system can grow without turning into a pile of exceptions. The real question is not just whether fields exist, but whether structure helps the user or slows them down.`,
    advanced_logic: `${w} fits this ${p} because the filtering mechanism creates gains in several places at once. It changes how quickly the user can find the right work, how much manual sorting is needed each day, and how well the task system keeps up once lists become large or rule-heavy. That makes this a question of operational control, not just one extra filter feature.`,
    issue_workflow: `${w} fits this ${p} because the workflow mechanism affects planning, execution, and review together. It changes whether tasks move through a defined system, whether backlog management feels native, and whether the team can keep work organized without inventing process by hand.`,
    dependency_planning: `${w} fits this ${p} because the same dependency mechanism influences setup, planning, and daily judgment. It changes whether order can be modeled clearly, whether updates ripple through the plan coherently, and whether the task system reflects the real work instead of a flat list.`,
    self_host_maintenance: `${w} fits this ${p} because maintenance burden is not only a technical issue. It affects how much hidden work the app creates before and after normal task use, how predictable it feels over time, and whether the system stays focused on tasks or keeps asking for operational attention.`,
    board_model: `${w} fits this ${p} because the core task model shapes both navigation and confidence. It affects how quickly the user can place work, whether the structure feels intuitive during daily use, and how much second-guessing happens while organizing tasks. The right model reduces friction before features even matter.`,
    workspace_structure: `${w} fits this ${p} because the same project or workspace layer changes setup, click paths, and cognitive load together. It determines how much platform structure must be understood before adding tasks, how much navigation sits between the user and the list, and whether organization feels supportive or burdensome.`,
    framework_overhead: `${w} fits this ${p} because framework overhead shows up in several forms at once. It affects onboarding, the number of decisions between thought and capture, and how much attention the user must keep on the system itself instead of the task. The better tool wins by helping first and teaching less.`,
    integration_behavior: `${w} fits this ${p} because connection behavior affects both speed and usefulness. It changes whether the task lives near the rest of the workflow, how often the user has to switch tools, and whether a task remains actionable once reminders, chat, or calendar context matter.`,
    safety_clarity: `${w} fits this ${p} because clarity is a practical mechanism, not just a feeling. It affects whether the user trusts the app during setup, whether normal task moves feel obvious, and whether the system stays usable without anxiety about doing something wrong.`,
    short_horizon: `${w} fits this ${p} because the short horizon changes what counts as a good investment. It affects how much setup is acceptable, whether the workflow pays back its learning cost quickly enough, and how much long-term structure can be justified for a need that may disappear soon.`,
    general: `${w} fits this ${p} because the winning mechanism reduces friction across setup, daily use, and organization rather than solving only one narrow problem.`,
  };
  return sentence(content[context.archetype] || content.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "simplicity") {
    const simple = {
      database_structure: [
        { tool: context.winnerSide, fails_when: `${w} becomes too shallow when the task system genuinely needs richer fields, stronger structure, or multiple ways to organize the same work.`, what_to_do_instead: `Choose ${l} if simple lists are no longer enough to carry the workflow.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the user keeps paying setup and thinking cost before they can even enjoy a simple task list.`, what_to_do_instead: `Choose ${w} when direct capture matters more than database-style structure.` },
      ],
      advanced_logic: [
        { tool: context.winnerSide, fails_when: `${w} becomes limiting when task volume and complexity truly need stronger logic than simple browsing can provide.`, what_to_do_instead: `Choose ${l} if advanced rules now remove more work than they create.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the user keeps carrying logic, settings, or power-user structure that the actual workflow does not benefit from.`, what_to_do_instead: `Choose ${w} when simpler handling is the real gain.` },
      ],
      issue_workflow: [
        { tool: context.winnerSide, fails_when: `${w} becomes too light when the workflow has matured enough to require real issue process and repeatable planning structure.`, what_to_do_instead: `Choose ${l} if formal workflow is now part of the job.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when process overhead arrives before useful task entry.`, what_to_do_instead: `Choose ${w} when the user needs to act before learning the workflow system.` },
      ],
      workspace_structure: [
        { tool: context.winnerSide, fails_when: `${w} becomes too narrow when collaborative project containers and workspace structure are doing important real work.`, what_to_do_instead: `Choose ${l} if that added structure is genuinely earning its keep.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the user keeps navigating layers that are broader than the task they actually need to add or finish.`, what_to_do_instead: `Choose ${w} when shorter paths and lower mental load matter more.` },
      ],
      general: [
        { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the workflow grows beyond what a lighter task system can hold cleanly.`, what_to_do_instead: `Choose ${l} if the extra structure has become necessary instead of theoretical.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when its added layers keep showing up as friction during ordinary task use.`, what_to_do_instead: `Choose ${w} when the lighter model is the real advantage.` },
      ],
    };
    return simple[context.archetype] || simple.general;
  }
  const items = {
    database_structure: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user only needs a plain task list and every extra field or property feels like system design instead of help.`, what_to_do_instead: `Choose ${l} if lightweight capture matters more than structured task data.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when tasks need richer structure, repeatable organization, or multiple ways to view the same work without rebuilding the list by hand.`, what_to_do_instead: `Choose ${w} when the task system needs real structure instead of simple entries.` },
    ],
    advanced_logic: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the task list is still small enough to manage by sight and the user would not maintain the extra logic.`, what_to_do_instead: `Choose ${l} if direct navigation is enough and advanced rules would mostly sit unused.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when task volume grows and the user keeps doing manual sorting that a stronger filter or query system should have absorbed.`, what_to_do_instead: `Choose ${w} when the list has outgrown simple project-by-project browsing.` },
    ],
    issue_workflow: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the work is informal enough that backlog rules, issue states, or sprint logic would mostly create overhead.`, what_to_do_instead: `Choose ${l} if lighter task handling is the real need.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the team starts needing structured workflow, backlog control, or a repeatable system for moving work across stages.`, what_to_do_instead: `Choose ${w} when process depth is no longer optional.` },
    ],
    dependency_planning: [
      { tool: context.winnerSide, fails_when: `${w} becomes unnecessary when tasks are mostly independent and the user would spend more effort modeling links than benefiting from them.`, what_to_do_instead: `Choose ${l} if a flatter task model is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the order between tasks keeps mattering and the user has to remember the chain mentally instead of seeing it in the system.`, what_to_do_instead: `Choose ${w} when relationships between tasks need to stay visible.` },
    ],
    self_host_maintenance: [
      { tool: context.winnerSide, fails_when: `${w} becomes the weaker fit when the user actually wants deployment control and is prepared to maintain the system that comes with it.`, what_to_do_instead: `Choose ${l} if ownership of the environment is part of the goal.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when server updates, plugins, or hosting chores become a recurring side job around what should be a simple task manager.`, what_to_do_instead: `Choose ${w} when lower upkeep matters more than technical control.` },
    ],
    board_model: [
      { tool: context.winnerSide, fails_when: `${w} becomes less convincing when the losing tool's visual model is actually the one that matches how the user thinks about stages and movement.`, what_to_do_instead: `Choose ${l} if the board really is the clearer representation of the work.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user keeps hesitating about placement, movement, or layout instead of feeling sure where a task belongs.`, what_to_do_instead: `Choose ${w} when the current task model feels more natural and less interpretive.` },
    ],
    workspace_structure: [
      { tool: context.winnerSide, fails_when: `${w} becomes too narrow when the user truly needs collaborative workspaces, dashboards, or project containers as part of everyday task management.`, what_to_do_instead: `Choose ${l} if that extra structure is genuinely carrying the workflow.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when project layers keep delaying capture and the user spends more time finding the right container than recording the task itself.`, what_to_do_instead: `Choose ${w} when simpler capture and navigation matter more than broader workspace structure.` },
    ],
    framework_overhead: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user actively wants a stronger framework, ritual, or system to shape how tasks are processed.`, what_to_do_instead: `Choose ${l} if the framework is the product value, not the problem.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the system keeps inserting theory, rituals, or mechanics between the user and basic execution.`, what_to_do_instead: `Choose ${w} when a task manager should help first and coach less.` },
    ],
    integration_behavior: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than needed when the user does not benefit from the extra integration and just wants a standalone task list.`, what_to_do_instead: `Choose ${l} if a disconnected but simpler tool is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the task keeps losing value outside the place where reminders, chat, or calendar context actually live.`, what_to_do_instead: `Choose ${w} when connected behavior is part of what makes the task usable.` },
    ],
    safety_clarity: [
      { tool: context.winnerSide, fails_when: `${w} becomes the weaker fit when the user is already comfortable with the losing tool's model and wants the extra depth it provides.`, what_to_do_instead: `Choose ${l} if the learning curve has already been paid and the structure now feels natural.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when uncertainty about placement, sync, commands, or interface behavior keeps making the user hesitate.`, what_to_do_instead: `Choose ${w} when predictability and trust are the real priorities.` },
    ],
    short_horizon: [
      { tool: context.winnerSide, fails_when: `${w} becomes less compelling when the user is actually adopting a long-term system and can justify a bigger learning investment now.`, what_to_do_instead: `Choose ${l} if the workflow will last long enough to earn back the setup cost.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the semester or short-term need is too brief to recover the time spent learning and configuring it.`, what_to_do_instead: `Choose ${w} when the horizon makes fast usefulness more important than deeper structure.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes unnecessary when the workflow stays simpler than the verdict assumes.`, what_to_do_instead: `Choose ${l} if the lighter option is genuinely enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the same named friction keeps recurring during setup, capture, and organization.`, what_to_do_instead: `Choose ${w} when that friction has become the actual bottleneck.` },
    ],
  };
  return items[context.archetype] || items.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  if (context.orientation === "simplicity") {
    const simple = {
      database_structure: `This can flip if the task system quickly grows into something that really does need richer structure, stronger fields, or multiple views. Then ${l} may justify the extra setup.`,
      advanced_logic: `This can flip if the task list becomes large enough that stronger logic genuinely saves more time than it costs to maintain. Then ${l} may be the better fit.`,
      issue_workflow: `This can flip if the work becomes formal enough that issue process, planning structure, or workflow depth stops feeling optional. Then ${l} may be worth the extra overhead.`,
      workspace_structure: `This can flip if collaborative project structure is central to every task and the extra workspace layers are doing real coordination work. Then ${l} may make more sense.`,
      general: `This can flip if the deeper structure the loser provides becomes genuinely necessary instead of merely available. Then ${l} may be worth the added complexity.`,
    };
    return sentence(simple[context.archetype] || simple.general);
  }
  const lines = {
    database_structure: `This can flip if the task system stays simple enough that extra fields, properties, or richer structure would mostly be overhead. In that narrower case, ${l} can stay faster without creating real loss.`,
    advanced_logic: `This can flip if the task list is still small enough that the user can manage it by sight and would not maintain more advanced rules anyway. Then ${l} may feel simpler in the right way.`,
    issue_workflow: `This can flip if the work never really becomes formal enough to need backlog depth, workflow states, or sprint-like structure. Then ${l} can be the better fit.`,
    dependency_planning: `This can flip if tasks remain mostly independent and the user does not need to model order explicitly. Then ${l} may stay lighter without becoming limiting.`,
    self_host_maintenance: `This can flip if the user wants deployment control badly enough to accept the extra upkeep as part of the bargain. Then ${l} may be worth the maintenance burden.`,
    board_model: `This can flip if the losing tool's visual model is exactly how the user already thinks about the work. Then ${l} may feel more intuitive despite the broader verdict.`,
    workspace_structure: `This can flip if collaborative project structure really is part of every task and the extra layers are doing useful work rather than just slowing capture. Then ${l} may be worth it.`,
    framework_overhead: `This can flip if the user actively wants the stronger ritual, method, or planning system that the loser imposes. Then ${l} may feel supportive instead of heavy.`,
    integration_behavior: `This can flip if the surrounding chat, calendar, or collaborative context matters more than keeping the task manager isolated and simple. Then ${l} may fit better.`,
    safety_clarity: `This can flip if the user is already comfortable with the losing tool's model and no longer experiences it as risky or confusing. Then ${l} can make more sense.`,
    short_horizon: `This can flip if the need is not actually short-lived and the user expects to keep the same task system long after the current season ends. Then ${l} may justify the bigger investment.`,
    general: `This can flip if the work stays simpler than the main verdict assumes. Then ${l} may be easier without creating meaningful downsides.`,
  };
  return sentence(lines[context.archetype] || lines.general);
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "simplicity") {
    const simple = {
      database_structure: [
        `Choose ${w} if direct task capture matters more than richer task structure.`,
        `Choose ${l} if the workflow truly needs fields, properties, or stronger organization.`,
        `Avoid ${l} when system design is arriving before useful task entry.`,
      ],
      advanced_logic: [
        `Choose ${w} if the list is still better handled simply than through extra rules.`,
        `Choose ${l} if advanced logic now saves more work than it costs.`,
        `Avoid ${l} when power-user controls are creating noise instead of relief.`,
      ],
      issue_workflow: [
        `Choose ${w} if task entry should happen before process education.`,
        `Choose ${l} if formal issue workflow is truly part of the job.`,
        `Avoid ${l} when structure keeps arriving before the task itself.`,
      ],
      workspace_structure: [
        `Choose ${w} if shorter paths and lower mental load matter most.`,
        `Choose ${l} if workspace structure is genuinely carrying collaboration.`,
        `Avoid ${l} when the platform map is bigger than the task problem.`,
      ],
      general: [
        `Choose ${w} if the main friction is too much structure too early.`,
        `Choose ${l} if the extra depth is actually needed now.`,
        `Avoid ${l} when the system keeps demanding more thought than the task does.`,
      ],
    };
    return simple[context.archetype] || simple.general;
  }
  const rules = {
    database_structure: [
      `Choose ${w} if task structure needs to carry real properties or richer organization.`,
      `Choose ${l} if quick capture matters more than a heavier data model.`,
      `Avoid ${l} when the list is starting to need structure it cannot hold cleanly.`,
    ],
    advanced_logic: [
      `Choose ${w} if large task lists need filters, rules, or smarter views to stay usable.`,
      `Choose ${l} if the list is still simple enough to manage without extra logic.`,
      `Avoid ${l} when manual sorting is becoming a daily tax.`,
    ],
    issue_workflow: [
      `Choose ${w} if backlog depth and workflow structure are part of the job.`,
      `Choose ${l} if the work is still informal enough for lighter task handling.`,
      `Avoid ${l} when the team is inventing issue workflow by hand.`,
    ],
    dependency_planning: [
      `Choose ${w} if task order and relationships need to stay visible.`,
      `Choose ${l} if tasks are mostly independent and flatter planning is enough.`,
      `Avoid ${l} when sequencing keeps living only in the user's head.`,
    ],
    self_host_maintenance: [
      `Choose ${w} if you want the task manager to work without operational upkeep.`,
      `Choose ${l} if technical control is worth the maintenance cost.`,
      `Avoid ${l} when hosting chores are becoming part of normal task management.`,
    ],
    board_model: [
      `Choose ${w} if its task model feels more natural immediately.`,
      `Choose ${l} if the board or spatial model truly matches how you think about work.`,
      `Avoid ${l} when placement and movement keep feeling interpretive instead of obvious.`,
    ],
    workspace_structure: [
      `Choose ${w} if fast capture matters more than navigating workspace layers.`,
      `Choose ${l} if collaborative project structure is doing real daily work.`,
      `Avoid ${l} when the platform map is harder to manage than the tasks.`,
    ],
    framework_overhead: [
      `Choose ${w} if you want a task manager, not a ritual or doctrine.`,
      `Choose ${l} if the framework itself is what you want help enforcing.`,
      `Avoid ${l} when the system keeps demanding attention before the task does.`,
    ],
    integration_behavior: [
      `Choose ${w} if tasks should stay close to the surrounding workflow.`,
      `Choose ${l} if a simpler standalone list is enough.`,
      `Avoid ${l} when disconnected tasks keep losing useful context.`,
    ],
    safety_clarity: [
      `Choose ${w} if confidence and predictability matter more than extra depth.`,
      `Choose ${l} if you already understand its structure and want what that depth buys.`,
      `Avoid ${l} when uncertainty about normal use keeps slowing you down.`,
    ],
    short_horizon: [
      `Choose ${w} if you need value before the current season is over.`,
      `Choose ${l} if the system will last long enough to pay back a heavier setup cost.`,
      `Avoid ${l} when the learning curve is longer than the useful window.`,
    ],
    general: [
      `Choose ${w} when the friction named in the rule is already shaping daily use.`,
      `Choose ${l} when the lighter surface is still enough.`,
      `Avoid ${l} once the same friction keeps repeating across setup and execution.`,
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
        { q: `Why does ${w} win on more than setup`, a: `${w} also reduces the daily thinking and navigation burden that comes from carrying a heavier task structure than the workflow actually needs.` },
        { q: `When is ${l} still the better choice`, a: `${l} is the better choice when the task system truly needs richer structure and a simple list has become too limiting.` },
        { q: `What usually makes ${l} the wrong fit`, a: `The user keeps paying the cost of fields, properties, or structure before those things are delivering meaningful value.` },
        { q: `Is this only about beginner friendliness`, a: `No. Even experienced users can lose time when the tool asks for more structure than the task actually needs.` },
      ],
      advanced_logic: [
        { q: `Why can less logic be better here`, a: `Because extra filters, recurrence rules, or power-user options can add mental and navigation cost before they save any real work.` },
        { q: `When is ${l} still worth choosing`, a: `${l} is worth choosing once the task list is large or complex enough that stronger logic clearly pays back its overhead.` },
        { q: `What usually makes ${l} feel too heavy`, a: `The user keeps maintaining advanced controls that are more elaborate than the current workflow really needs.` },
        { q: `Does ${w} mean giving up future growth`, a: `Not necessarily. It mainly means the user is not paying for that growth too early.` },
      ],
      issue_workflow: [
        { q: `Why does ${w} fit better for simpler entry`, a: `${w} removes process education from the first interaction, so the user can add and handle tasks before learning a formal workflow system.` },
        { q: `When is ${l} still the better option`, a: `${l} becomes the better option once issue depth and formal planning are truly part of the work.` },
        { q: `What usually makes ${l} fail first`, a: `The tool keeps asking for issue-structure thinking before the user is even ready to capture normal tasks.` },
        { q: `Is this verdict anti-process`, a: `No. It is about timing and fit, not whether process can ever be valuable.` },
      ],
      workspace_structure: [
        { q: `Why do extra layers hurt so much here`, a: `Because the same workspace structure adds setup, longer click paths, and more things to remember every time a task is added or found.` },
        { q: `When is ${l} still worth it`, a: `${l} is worth it when those project and collaborative layers are genuinely doing daily work rather than just being available.` },
        { q: `What is the first sign ${l} is too much`, a: `The user spends too long deciding where a task belongs before the task itself becomes useful.` },
        { q: `Does ${w} only win by being basic`, a: `No. It wins by keeping the working path short and understandable.` },
      ],
      general: [
        { q: `Why does ${w} fit the rule better`, a: `${w} keeps the same friction from spreading across setup, daily use, and organization all at once.` },
        { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when its extra structure is delivering value right now rather than only in theory.` },
        { q: `What usually signals it is time to switch`, a: `The heavier system stops feeling like optional depth and starts feeling like repeated friction.` },
        { q: `Is this only about simplicity`, a: `It is also about where the real operating cost shows up during ordinary task use.` },
      ],
    };
    return (simple[context.archetype] || simple.general).map((item) => ({
      q: sentence(item.q).slice(0, -1) + "?",
      a: sentence(item.a),
    }));
  }
  const faqs = {
    database_structure: [
      { q: `Why does ${w} win on more than setup`, a: `${w} changes not only how tasks are configured at the start, but also how easily they can be sorted, viewed, and expanded later.` },
      { q: `When is ${l} still the better choice`, a: `${l} is still better when tasks do not need much structure and the faster capture path matters more than a richer model.` },
      { q: `What usually pushes someone away from ${l}`, a: `It is often the moment when the list starts needing more properties or views than a simpler task record can carry cleanly.` },
      { q: `Is this really about databases`, a: `Only partly. It is also about whether the structure helps daily work or forces the user to improvise around missing organization.` },
    ],
    advanced_logic: [
      { q: `Why do filters and rules matter so much here`, a: `Because the same logic affects findability, daily speed, and whether a large task list stays manageable without constant manual cleanup.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the list is small enough that browsing by eye is faster than maintaining advanced logic.` },
      { q: `What is the signal that ${l} has become too shallow`, a: `It is usually when the user keeps doing repetitive manual sorting that a stronger rule system should have taken over.` },
      { q: `Does ${w} automatically mean more complexity`, a: `Not necessarily. For a power user, better logic can actually remove complexity by reducing repeated manual organization.` },
    ],
    issue_workflow: [
      { q: `Why does workflow depth change the verdict`, a: `Because it changes how tasks are planned, moved, and reviewed rather than merely adding more screens.` },
      { q: `When is ${l} still preferable`, a: `${l} is preferable when the work does not really need backlog structure or a formal issue process.` },
      { q: `What usually makes ${l} fail first`, a: `The team starts needing repeatable stages or backlog control and ends up faking that structure manually.` },
      { q: `Is ${w} only for large teams`, a: `No. It is for any workflow where issue depth has become a real operating need rather than a theoretical future possibility.` },
    ],
    dependency_planning: [
      { q: `Why are dependencies more than a planning feature`, a: `Because they also reduce mental tracking during daily use by making task order explicit in the system.` },
      { q: `When is ${l} still the better option`, a: `${l} is still better when tasks are simple enough that explicit relationships would mostly be overhead.` },
      { q: `What pushes users toward ${w}`, a: `Usually the point where sequencing matters often enough that remembering it informally becomes unreliable.` },
      { q: `Does ${w} always mean more setup`, a: `Yes, some, but the payoff is that the work structure reflects reality instead of asking the user to hold the chain in memory.` },
    ],
    self_host_maintenance: [
      { q: `Why does upkeep matter in a task manager decision`, a: `Because the hidden work of hosting or maintenance can become part of the product experience even if the task features are fine.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when technical control is the goal and the user is ready to pay for it with upkeep.` },
      { q: `What usually makes ${l} the wrong fit`, a: `The user keeps doing system maintenance around a tool that was supposed to make work simpler, not add another responsibility.` },
      { q: `Is ${w} only about convenience`, a: `It is also about predictability and keeping normal task work separate from infrastructure chores.` },
    ],
    board_model: [
      { q: `Why does the task model matter so much here`, a: `Because the underlying model determines whether capture, movement, and retrieval feel intuitive or constantly debatable.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still better when its board or spatial model is exactly how the user already thinks about the work.` },
      { q: `What usually goes wrong with ${l}`, a: `The user keeps wondering where something belongs or whether moving it means the same thing the tool thinks it means.` },
      { q: `Does ${w} win only by being simpler`, a: `No. It wins by matching the user's mental model more closely, which reduces both clicks and hesitation.` },
    ],
    workspace_structure: [
      { q: `Why do workspace layers matter beyond setup`, a: `Because the same extra structure changes navigation speed, capture friction, and how much of the platform the user has to remember.` },
      { q: `When is ${l} still worth the overhead`, a: `${l} is worth it when projects, dashboards, and collaborative containers really are central to the workflow.` },
      { q: `What is the first sign that ${l} is too heavy`, a: `The user spends too much time finding the right place for a task before the task itself even exists.` },
      { q: `Does ${w} mean giving up scale`, a: `Not necessarily. It mainly means the app keeps task entry and navigation closer to the foreground.` },
    ],
    framework_overhead: [
      { q: `Why is ${w} better for users who dislike extra systems`, a: `Because it reduces both onboarding friction and the number of framework decisions that stand between intention and execution.` },
      { q: `When is ${l} still the smarter choice`, a: `${l} is the smarter choice when the framework itself is the value and the user wants that structure imposed consistently.` },
      { q: `What usually makes ${l} feel too heavy`, a: `The system keeps demanding rituals, categories, or interpretations before the user can simply add or finish a task.` },
      { q: `Is this only about minimalism`, a: `No. Busy and experienced users can also lose time when the framework becomes another thing to maintain.` },
    ],
    integration_behavior: [
      { q: `Why does integration behavior change the verdict`, a: `Because the task becomes more useful when it stays connected to the reminder, chat, or calendar context that drives real action.` },
      { q: `When is ${l} still a better choice`, a: `${l} is better when the user wants a cleaner standalone list and does not benefit from the extra connection.` },
      { q: `What usually pushes people to ${w}`, a: `The task keeps losing value once it leaves the place where the rest of the workflow actually happens.` },
      { q: `Does ${w} always mean more complexity`, a: `Not if the integration removes switching that the user was already doing manually.` },
    ],
    safety_clarity: [
      { q: `Why does clarity matter so much for this persona`, a: `Because confidence affects whether the tool feels usable at all, especially when the user worries about placing, moving, or syncing tasks incorrectly.` },
      { q: `When is ${l} still acceptable`, a: `${l} is still acceptable when the user already understands its model and no longer experiences it as risky.` },
      { q: `What usually makes ${l} fail first`, a: `Small moments of uncertainty keep repeating until the user stops trusting the system during normal use.` },
      { q: `Is this really about features`, a: `Only partly. It is also about how safe the app feels to operate without specialized confidence.` },
    ],
    short_horizon: [
      { q: `Why does time horizon change the recommendation`, a: `Because setup, learning, and structural overhead only make sense if there is enough time left to earn them back.` },
      { q: `When is ${l} still worth it`, a: `${l} is still worth it when the user expects to keep the same system long enough for the heavier investment to pay back.` },
      { q: `What usually makes ${l} the wrong call`, a: `The term or short-lived need ends before the user has recovered the time spent learning the app.` },
      { q: `Does ${w} only win by being simpler`, a: `It also wins by matching the actual payoff window instead of asking for a longer commitment than the need justifies.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} turns the same core mechanism into practical gains across setup, daily workflow, and organization instead of only in one narrow spot.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when the friction in the decision rule is not showing up often enough to justify the winner's extra depth.` },
      { q: `What usually signals it is time to switch`, a: `The same friction starts appearing in several parts of the workflow rather than staying a one-off annoyance.` },
      { q: `Is this verdict only about simplicity`, a: `No. It is about where the real cost of using the system appears once the workflow becomes routine.` },
    ],
  };
  return (faqs[context.archetype] || faqs.general).map((item) => ({
    q: sentence(item.q).slice(0, -1) + "?",
    a: sentence(item.a),
  }));
}

function retargetBullets(bullets, fromName, toName) {
  return bullets.map((bullet) => ({
    point: String(bullet.point || "").replaceAll(fromName, toName),
    why_it_matters: String(bullet.why_it_matters || "").replaceAll(fromName, toName),
  }));
}

function bulletBucket(text) {
  return /setup|learn|configure|before use|before adding|onboarding|start working|first task/i.test(text) ? "setup"
    : /daily|routine|day-to-day|planning|review|execution|workflow|entry|capture/i.test(text) ? "workflow"
      : /view|board|cards|drag|move|screen|navigation|click|path|find/i.test(text) ? "navigation"
        : /filter|query|structure|data|properties|contexts|perspectives|dependency|issue|project|workspace|dashboard|space/i.test(text) ? "structure"
          : /thinking|mental|confusing|uncertainty|risky|overhead|trust|understand/i.test(text) ? "cognitive"
            : /calendar|chat|integration|switching|sync|reminder/i.test(text) ? "integration"
              : "general";
}

function repeatedPage(doc) {
  const persona = (doc.sections || []).find((section) => section.type === "persona_fit")?.content || "";
  const xBullets = ((doc.sections || []).find((section) => section.type === "x_wins")?.bullets) || [];
  const yBullets = ((doc.sections || []).find((section) => section.type === "y_wins")?.bullets) || [];
  const xBuckets = new Set(xBullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
  const yBuckets = new Set(yBullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
  return xBuckets.size < 3 || yBuckets.size < 3 || /the right tool should|adds hesitation|add more decisions|without .* first|limited rule-based/i.test(persona);
}

function shouldRewriteSection(doc, section) {
  if (section.type === "persona_fit") {
    return /the same friction|the same structural mechanism|the same project or workspace layer|the same database-first mechanism|the winning mechanism reduces friction across setup, daily use, and organization/i.test(section.content || "");
  }
  if (section.type === "x_wins" || section.type === "y_wins") {
    const bullets = section.bullets || [];
    const buckets = new Set(bullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
    return buckets.size < 3 || bullets.some((bullet) => /can still be better|may feel lighter|offers more depth|supports more formal organization|complexity is intentional/i.test(`${bullet.point} ${bullet.why_it_matters}`));
  }
  if (section.type === "failure_modes") {
    return (section.items || []).some((item) => /becomes the wrong fit|breaks down when its added layers keep showing up as friction|the lighter model is the real advantage/i.test(`${item.fails_when} ${item.what_to_do_instead}`));
  }
  if (section.type === "edge_case") {
    return /deeper structure the loser provides becomes genuinely necessary|extra setup|added complexity/i.test(section.content || "");
  }
  if (section.type === "quick_rules") {
    return (section.rules || []).some((rule) => /extra depth is actually needed now|lighter model is the real advantage|same friction/i.test(rule));
  }
  return repeatedPage(doc) && ["persona_fit", "x_wins", "y_wins", "failure_modes", "edge_case", "quick_rules"].includes(section.type);
}

function shouldRewriteFaqs(doc) {
  const faqs = doc.faqs || [];
  return faqs.length !== 4 || faqs.some((item) => /same friction|only about simplicity|still reasonable|fit the rule better/i.test(`${item.q} ${item.a}`));
}

function rewritePage(doc) {
  const context = buildContext(doc);
  const rewrittenSections = [];
  const sections = (doc.sections || []).map((section) => {
    if (section.type === "persona_fit" && shouldRewriteSection(doc, section)) {
      rewrittenSections.push("persona_fit");
      return {
        ...section,
        heading: `Why ${context.winnerName} fits ${context.persona}s better`,
        content: buildPersonaFit(context),
      };
    }
    if (section.type === "x_wins" && shouldRewriteSection(doc, section)) {
      const bullets = context.winnerSide === "x"
        ? (context.orientation === "depth"
          ? winnerBullets(context)
          : simplicityWinnerBullets(context))
        : (context.orientation === "depth"
          ? loserBullets(context)
          : simplicityLoserBullets(context));
      rewrittenSections.push("x_wins");
      return {
        ...section,
        heading: `Where ${context.xName} wins`,
        bullets,
      };
    }
    if (section.type === "y_wins" && shouldRewriteSection(doc, section)) {
      const bullets = context.winnerSide === "y"
        ? (context.orientation === "depth"
          ? winnerBullets(context)
          : simplicityWinnerBullets(context))
        : (context.orientation === "depth"
          ? loserBullets(context)
          : simplicityLoserBullets(context));
      rewrittenSections.push("y_wins");
      return {
        ...section,
        heading: `Where ${context.yName} wins`,
        bullets,
      };
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

  let nextDoc = {
    ...doc,
    sections,
    related_pages: [],
  };
  if (shouldRewriteFaqs(doc)) {
    nextDoc = {
      ...nextDoc,
      faqs: buildFaqs(context),
    };
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
    if (doc.categorySlug !== "task-managers") continue;
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
    "# Task Managers Second Pass Report",
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
