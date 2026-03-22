/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "habit-trackers-second-pass-report.md");

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
  if (/full productivity workspace|projects and task lists|full task management workspace|lists and projects|same system that manages daily tasks and to-do lists/.test(value)) return "workspace_system";
  if (/commitment contracts|financial penalties|goal trajectories|enforced quantitative goal trajectories|enforced deadlines|quantified goals with enforced deadlines/.test(value)) return "commitment_system";
  if (/measurable targets|goal metrics|progress tracking rather than simple daily completion logs/.test(value)) return "measurable_targets";
  if (/quests|avatars|reward|rpg|characters|game-style|gamified/.test(value)) return "gamification";
  if (/automatically sync|sync progress across multiple devices|across devices|stored only on one device|manual data transfer/.test(value)) return "sync_devices";
  if (/creating and maintaining a cloud account|maintaining a cloud account|syncing service|cloud services|online account/.test(value)) return "cloud_account";
  if (/custom database|databases|structured workflows|integrated dashboards/.test(value)) return "custom_database";
  if (/social connections|shared activity feeds|shared habit feeds|coaching\/community features|coaching\/community/.test(value)) return "social_layers";
  if (/charts and statistical analysis|charts and detailed habit analytics|statistical analysis of habit performance/.test(value)) return "analytics";
  return "general";
}

function detectOrientation(mode, rule) {
  const value = lower(rule);
  if (mode === "workspace_system") return /cannot appear inside the same system/.test(value) ? "strength" : "burden";
  if (mode === "commitment_system") return /before logging|requires configuring|before logging progress|for missing goals/.test(value) ? "burden" : "strength";
  if (mode === "measurable_targets") return /before logging completion/.test(value) ? "burden" : "strength";
  if (mode === "gamification") return "burden";
  if (mode === "sync_devices") return "strength";
  if (mode === "cloud_account") return "burden";
  if (mode === "custom_database") return /requires building and maintaining|before logging/.test(value) ? "burden" : "strength";
  if (mode === "social_layers") return "burden";
  if (mode === "analytics") return "strength";
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
    orientation: detectOrientation(mode, rule),
  };
}

function strengthWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    workspace_system: [
      { point: `${w} keeps habits inside the same place where daily work is already reviewed`, why_it_matters: `The user does not have to switch apps to decide what needs attention today.` },
      { point: `${w} combines habit check-offs with task execution`, why_it_matters: `That keeps the daily workflow faster because recurring actions and one-off work can be handled in one pass.` },
      { point: `${w} gives habits a clearer place in a broader planning structure`, why_it_matters: `That matters when recurring behaviors need to live beside projects, lists, and calendar work instead of outside them.` },
    ],
    commitment_system: [
      { point: `${w} turns habits into measurable commitments instead of loose checklists`, why_it_matters: `Targets, rates, and deadlines create a system that pushes the habit forward even when motivation drops.` },
      { point: `${w} makes daily slippage visible before the habit quietly drifts`, why_it_matters: `The user gets a live signal about whether they are still on pace instead of only seeing isolated completions.` },
      { point: `${w} adds accountability that keeps long-range goals from becoming optional`, why_it_matters: `That matters when the point of tracking is not just logging but staying bound to a quantitative standard.` },
    ],
    measurable_targets: [
      { point: `${w} supports habits that need real targets instead of simple yes-no completion`, why_it_matters: `The user can track quantities or threshold-based routines without flattening them into a checkbox.` },
      { point: `${w} makes progress review more informative over time`, why_it_matters: `The system can show whether the habit is improving, holding steady, or missing the target entirely.` },
      { point: `${w} gives structured metrics that fit more advanced planning`, why_it_matters: `That matters when performance goals need a stronger data model than a daily streak alone can provide.` },
    ],
    sync_devices: [
      { point: `${w} keeps habit data available across the devices the user actually switches between`, why_it_matters: `Progress stays current whether the habit is checked on a phone, tablet, or computer.` },
      { point: `${w} reduces daily breaks caused by device-specific tracking`, why_it_matters: `The user does not have to wait until returning to one device to log or review progress.` },
      { point: `${w} makes the habit system more dependable over time`, why_it_matters: `That matters when work context, travel, or device changes are part of normal life.` },
    ],
    custom_database: [
      { point: `${w} gives habits a customizable data model instead of a fixed list shape`, why_it_matters: `The user can decide which fields, tags, and status logic the system should carry.` },
      { point: `${w} connects habits to larger workflows without duplicating information`, why_it_matters: `Databases and relations let habits sit beside goals, plans, and reviews as one system.` },
      { point: `${w} supports dashboards and review views that can evolve over time`, why_it_matters: `That matters when the habit system needs to grow rather than stay locked to one built-in layout.` },
    ],
    analytics: [
      { point: `${w} turns habit history into trend analysis instead of only raw checkmarks`, why_it_matters: `Charts and summaries help the user see whether behavior is improving or fading over time.` },
      { point: `${w} makes review sessions more actionable`, why_it_matters: `Statistical views help spot weak habits, strong streaks, and patterns that deserve adjustment.` },
      { point: `${w} supports comparing performance across habits instead of reading each one in isolation`, why_it_matters: `That matters when the goal is to analyze the system, not just log today's completion.` },
    ],
    general: [
      { point: `${w} handles the winning mechanism more directly`, why_it_matters: `The user spends less time working around the exact friction named in the decision rule.` },
      { point: `${w} keeps daily tracking smoother`, why_it_matters: `The workflow stays shorter and easier to repeat.` },
      { point: `${w} scales better once the habit system is used seriously`, why_it_matters: `That matters when the chosen mechanism needs to hold up beyond quick daily check-offs.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function strengthLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    workspace_system: [
      { point: `${l} can still be better when habits should stay separate from a broader work system`, why_it_matters: `A dedicated tracker can feel calmer if tasks and projects would mostly add clutter.` },
      { point: `${l} keeps daily logging narrower and more habit-specific`, why_it_matters: `That matters when the user does not want recurring behaviors mixed into to-do management.` },
      { point: `${l} asks for less commitment to an all-in-one planning model`, why_it_matters: `The lighter approach can be better when unified workflow depth is not doing much real work.` },
    ],
    commitment_system: [
      { point: `${l} can still be better when the user wants habits to stay low-pressure`, why_it_matters: `A simple tracker may support consistency better if penalties and hard pacing would cause resistance.` },
      { point: `${l} keeps daily logging easier to start`, why_it_matters: `That matters when the user needs a fast check-off routine more than a quantified enforcement system.` },
      { point: `${l} reduces the risk of overengineering the habit`, why_it_matters: `The lighter model can be better when strict targets would mostly create avoidance.` },
    ],
    measurable_targets: [
      { point: `${l} can still be better when simple completion is enough`, why_it_matters: `A binary tracker may be all the user needs if the habit is mainly about showing up consistently.` },
      { point: `${l} keeps daily logging faster than a metrics-heavy system`, why_it_matters: `That matters when entering numbers would add friction without changing decisions.` },
      { point: `${l} reduces maintenance for habits that do not need formal measurement`, why_it_matters: `The simpler model can be better when metrics would mostly sit unused.` },
    ],
    sync_devices: [
      { point: `${l} can still be better when the user wants habit data kept on one device`, why_it_matters: `A local-only tracker may feel cleaner if cross-device access is not part of the routine.` },
      { point: `${l} avoids depending on cloud sync for everyday use`, why_it_matters: `That matters when the user values direct local storage more than access from everywhere.` },
      { point: `${l} keeps the system simpler for a single-device habit workflow`, why_it_matters: `The tradeoff can be worth it when moving between devices rarely happens.` },
    ],
    custom_database: [
      { point: `${l} can still be better when the user wants a ready-made habit tracker`, why_it_matters: `A fixed app can get out of the way when system design would mostly be overhead.` },
      { point: `${l} keeps daily logging faster than a workspace that has to be maintained`, why_it_matters: `That matters when the habit system should work immediately instead of being built.` },
      { point: `${l} reduces the upkeep of running habits inside a broader database structure`, why_it_matters: `The lighter tool can be better when deep customization is not doing enough real work.` },
    ],
    analytics: [
      { point: `${l} can still be better when the user only needs a simple record of completion`, why_it_matters: `A lean tracker may be enough if charts would rarely change what the user does next.` },
      { point: `${l} keeps daily use lighter than an analysis-heavy tracker`, why_it_matters: `That matters when the user wants to log habits quickly and leave review for later.` },
      { point: `${l} avoids building a habit practice around dashboards`, why_it_matters: `The simpler model can be better when statistics would add interpretation work without much payoff.` },
    ],
    general: [
      { point: `${l} can still be better in a narrower habit workflow`, why_it_matters: `The losing tool may fit when the winning mechanism is not doing much real work yet.` },
      { point: `${l} often offers a lighter tradeoff`, why_it_matters: `That can matter when the richer mechanism would mostly add overhead.` },
      { point: `${l} becomes more reasonable when complexity is not needed`, why_it_matters: `The friction only matters when it gets in the way of the habit job this persona actually has.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function burdenWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    workspace_system: [
      { point: `${w} keeps habit tracking out of a broader workspace layer`, why_it_matters: `The user can log the habit without navigating projects, task lists, or productivity structure first.` },
      { point: `${w} shortens the path to ordinary habit check-offs`, why_it_matters: `Daily use stays closer to marking completion instead of orienting inside a larger planning system.` },
      { point: `${w} lowers the mental load of staying consistent`, why_it_matters: `That matters when extra workspace structure is exactly what makes the tracker feel heavier.` },
    ],
    commitment_system: [
      { point: `${w} lets the user log a habit before defining contracts or penalties`, why_it_matters: `The first interaction is habit tracking itself rather than configuring enforcement.` },
      { point: `${w} keeps daily tracking closer to simple completion`, why_it_matters: `Routine use stays focused on showing up instead of managing goal trajectories.` },
      { point: `${w} reduces the pressure created by a commitment system`, why_it_matters: `That helps when hard pacing and penalties are more likely to stop the habit than support it.` },
    ],
    measurable_targets: [
      { point: `${w} allows habits to start without defining metrics first`, why_it_matters: `The user can build the tracking routine before deciding whether a quantity needs formal measurement.` },
      { point: `${w} keeps daily logging faster than a target-driven model`, why_it_matters: `Routine check-offs stay simple when numbers would mostly slow entry down.` },
      { point: `${w} lowers the thinking required to maintain the habit`, why_it_matters: `That matters when metric setup is the very friction this persona is trying to avoid.` },
    ],
    gamification: [
      { point: `${w} keeps habit logging centered on a direct checkmark`, why_it_matters: `The user can record completion without opening a game layer first.` },
      { point: `${w} keeps daily tracking faster by avoiding quests and reward loops`, why_it_matters: `Routine use stays closer to the habit itself instead of the motivation system around it.` },
      { point: `${w} reduces the cognitive clutter around consistency`, why_it_matters: `That helps when avatars, rewards, and progression are the exact source of drag.` },
    ],
    cloud_account: [
      { point: `${w} lets the user track habits without creating a cloud account first`, why_it_matters: `The app can be used immediately without tying the routine to another service login.` },
      { point: `${w} keeps daily tracking available without maintaining sync infrastructure`, why_it_matters: `Routine use stays focused on the habit instead of on account upkeep.` },
      { point: `${w} lowers the ongoing burden of account-based maintenance`, why_it_matters: `That matters when online sync is the exact layer the user wants to avoid.` },
    ],
    custom_database: [
      { point: `${w} lets the user start tracking before building a database system`, why_it_matters: `The first useful action is logging a habit, not deciding how the workspace should be modeled.` },
      { point: `${w} keeps daily check-offs separate from workspace maintenance`, why_it_matters: `Routine use is faster when custom fields, relations, and dashboards are not part of every habit decision.` },
      { point: `${w} reduces the thinking required to keep the tracker usable`, why_it_matters: `That matters when the database layer is exactly what makes the habit system feel too heavy.` },
    ],
    social_layers: [
      { point: `${w} keeps habit tracking private and self-contained`, why_it_matters: `The user can maintain the routine without managing social feeds, followers, or coaching layers.` },
      { point: `${w} keeps daily logging on the habit itself`, why_it_matters: `Routine use stays faster when community interaction is not mixed into the check-off path.` },
      { point: `${w} lowers the attention cost of using the tracker`, why_it_matters: `That matters when social features are the distraction rather than the help.` },
    ],
    general: [
      { point: `${w} lowers the extra burden introduced by the losing tool`, why_it_matters: `The user reaches a usable habit routine sooner.` },
      { point: `${w} keeps daily tracking more direct`, why_it_matters: `Routine check-offs take fewer extra steps.` },
      { point: `${w} makes the system easier to operate without extra overhead`, why_it_matters: `That matters when the added mechanism is the source of friction.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function burdenLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    workspace_system: [
      { point: `${l} can still be better when habits should live inside a broader work system`, why_it_matters: `The heavier workspace only pays back when projects and tasks really need to sit beside the habit.` },
      { point: `${l} can connect habits more closely to planning and task context`, why_it_matters: `That matters when isolated check-offs are no longer enough for daily execution.` },
      { point: `${l} gives more room for one combined productivity surface`, why_it_matters: `The added structure is only worth it once that all-in-one model is doing real work.` },
    ],
    commitment_system: [
      { point: `${l} can still be better when the user needs hard accountability`, why_it_matters: `Commitment rules may be worth the overhead once gentle tracking has stopped working.` },
      { point: `${l} gives stronger pacing around measurable habits`, why_it_matters: `That matters when the habit needs deadlines and a visible rate of progress, not just a checkmark.` },
      { point: `${l} can create more pressure to follow through`, why_it_matters: `The extra system only pays back when enforcement is the point.` },
    ],
    measurable_targets: [
      { point: `${l} can still be better when the habit needs a real metric from day one`, why_it_matters: `Entering numbers may be worth it once the habit is about performance rather than attendance.` },
      { point: `${l} supports clearer progress tracking for quantified routines`, why_it_matters: `That matters when a simple completion mark hides whether the habit is actually improving.` },
      { point: `${l} gives more structure for target-driven habits`, why_it_matters: `The added setup only makes sense once measurement is part of the job.` },
    ],
    gamification: [
      { point: `${l} can still be better when motivation needs a game loop`, why_it_matters: `The extra layer may help if plain tracking is not enough to keep the user engaged.` },
      { point: `${l} adds more visible rewards around daily completion`, why_it_matters: `That matters when feedback and progression are driving consistency.` },
      { point: `${l} can make habit work feel more engaging over time`, why_it_matters: `The extra mechanics only pay back when motivation support matters more than simplicity.` },
    ],
    cloud_account: [
      { point: `${l} can still be better when the user wants the habit available across devices`, why_it_matters: `An account layer may be worth it once the routine really depends on cloud access.` },
      { point: `${l} reduces the risk of habit data staying trapped on one device`, why_it_matters: `That matters when the user moves between devices as part of normal life.` },
      { point: `${l} can be easier to recover and continue later`, why_it_matters: `The extra account burden only makes sense once sync convenience is a real need.` },
    ],
    custom_database: [
      { point: `${l} can still be better when habits must connect to a larger system`, why_it_matters: `The database layer may be worth the overhead once dashboards and relations are doing real work.` },
      { point: `${l} supports more structured habit records and workflows`, why_it_matters: `That matters when fixed lists have become the real limitation.` },
      { point: `${l} leaves more room for the habit system to evolve later`, why_it_matters: `The added setup only makes sense once customization is part of the goal.` },
    ],
    social_layers: [
      { point: `${l} can still be better when accountability depends on other people`, why_it_matters: `Social feeds or coaching may be worth the extra layer if private tracking is not enough.` },
      { point: `${l} adds more feedback beyond the checkmark itself`, why_it_matters: `That matters when encouragement or outside visibility are part of the motivation model.` },
      { point: `${l} can keep the routine more engaging for users who want interaction`, why_it_matters: `The extra system only pays back when community support is doing real work.` },
    ],
    general: [
      { point: `${l} can still be better once the heavier mechanism starts doing real work`, why_it_matters: `The added layer is not useless, just earlier than this use case needs.` },
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
      workspace_system: `${w} fits this ${p} because ${l} is the tool adding the larger workspace layer, not ${w}. That extra structure slows the first check-off, lengthens daily navigation, and makes habit tracking carry projects or task context the user may not even need. ${w} wins by keeping the habit routine more direct.`,
      commitment_system: `${w} fits this ${p} because ${l} is the tool introducing contracts, penalties, and paced goal rules, not ${w}. Those mechanics can help in the right case, but first they add setup friction, make daily tracking feel heavier, and turn a simple habit into something harder to start. ${w} wins by letting the tracking habit form before enforcement becomes necessary.`,
      measurable_targets: `${w} fits this ${p} because ${l} is the tool pushing target setup into the first interaction, not ${w}. That adds extra decisions before the habit is even underway, slows routine logging with numeric thinking, and raises the mental cost of using the tracker every day. ${w} wins by keeping early tracking lighter.`,
      gamification: `${w} fits this ${p} because ${l} is the tool introducing quests, rewards, and game mechanics, not ${w}. Those layers can motivate some users, but here they add extra screens, more interpretation, and more mental noise around a habit that should be quick to log. ${w} wins by keeping the action closer to a simple completion.`,
      cloud_account: `${w} fits this ${p} because ${l} is the tool introducing the account and sync layer, not ${w}. That extra requirement adds sign-up friction, more service maintenance, and another dependency to carry before habit logging even feels settled. ${w} wins by keeping the routine usable without that account burden.`,
      custom_database: `${w} fits this ${p} because ${l} is the tool introducing the database-building layer, not ${w}. That means setup decisions arrive before the first useful log, daily use keeps one eye on system maintenance, and the tracker asks for more structure than this persona actually needs. ${w} wins by making the habit routine usable before system design becomes the job.`,
      social_layers: `${w} fits this ${p} because ${l} is the tool adding social or coaching layers, not ${w}. Those features can help some people, but here they add account management, extra attention cost, and more interaction beyond simply keeping the habit going. ${w} wins by keeping the routine self-contained.`,
      general: `${w} fits this ${p} because ${l} is the tool introducing the extra mechanism named in the rule, not ${w}. ${w} wins by keeping that same friction from showing up in setup, daily use, and long-term maintenance all at once.`,
    };
    return sentence(text[context.mode] || text.general);
  }
  const text = {
    workspace_system: `${w} fits this ${p} because putting habits inside the broader work system changes several parts of the routine at once. It affects where the user starts the day, whether habits can be completed alongside tasks, and how much context switching is required to keep everything moving. ${w} wins by making habits part of the same operating surface.`,
    commitment_system: `${w} fits this ${p} because quantitative commitment changes more than one setting. It affects how the habit is defined up front, how progress is interpreted each day, and how much pressure the system can apply when consistency slips. ${w} wins by turning the habit into something enforceable instead of merely recorded.`,
    measurable_targets: `${w} fits this ${p} because measurable targets change the whole shape of the habit system. They affect the data model, the meaning of progress reviews, and whether the tracker can support habits that need more than a yes-no mark. ${w} wins by giving those metrics a proper place to live.`,
    gamification: `${w} fits this ${p} because removing the game layer changes setup, daily speed, and mental overhead together. The user can log habits without navigating motivation mechanics, without interpreting reward systems, and without carrying extra cognitive noise through the routine. ${w} wins by keeping the habit system closer to the behavior itself.`,
    sync_devices: `${w} fits this ${p} because cross-device sync changes more than storage location. It affects whether progress is available in the moment, how often logging gets delayed by device boundaries, and how dependable the habit system feels once real life stops happening on one screen. ${w} wins by keeping the routine available wherever the user is.`,
    custom_database: `${w} fits this ${p} because database customization changes setup, daily organization, and long-term flexibility together. It decides whether habits are fixed list items or structured records, whether they can connect to larger workflows, and whether the review surface can grow with the system. ${w} wins by letting habits act like data instead of only app entries.`,
    analytics: `${w} fits this ${p} because analysis changes what the tracker is for. It affects whether the user can review trends, compare habits, and make adjustments from evidence instead of memory. ${w} wins by turning habit history into something that can actually be studied.`,
    general: `${w} fits this ${p} because the winning mechanism improves setup, daily tracking, and long-term habit management instead of solving only one narrow problem.`,
  };
  return sentence(text[context.mode] || text.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    const items = {
      workspace_system: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when habits genuinely need to live inside projects, tasks, or a larger work system.`, what_to_do_instead: `Choose ${l} if unified workflow context is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the workspace layer keeps making simple habit logging slower than it should be.`, what_to_do_instead: `Choose ${w} when a dedicated habit path is the real advantage.` },
      ],
      commitment_system: [
        { tool: context.winnerSide, fails_when: `${w} becomes too light when the user needs hard accountability, measurable pacing, or consequences to stay on track.`, what_to_do_instead: `Choose ${l} if enforcement has become the actual need.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when contracts and pacing rules arrive before the user has even built a basic logging routine.`, what_to_do_instead: `Choose ${w} when starting and sustaining the habit matters more than enforcement.` },
      ],
      measurable_targets: [
        { tool: context.winnerSide, fails_when: `${w} becomes too simple when the habit really needs target values or more formal measurement from the start.`, what_to_do_instead: `Choose ${l} if metrics are now central to the habit.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when setup and numeric entry keep getting in the way of just recording the habit.`, what_to_do_instead: `Choose ${w} when lower-friction tracking is the real gain.` },
      ],
      gamification: [
        { tool: context.winnerSide, fails_when: `${w} becomes too flat when the user needs rewards, progression, or challenge loops to keep showing up.`, what_to_do_instead: `Choose ${l} if the motivation layer is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when game mechanics keep adding steps and mental clutter around a habit that should be simple to log.`, what_to_do_instead: `Choose ${w} when direct check-offs are the better fit.` },
      ],
      cloud_account: [
        { tool: context.winnerSide, fails_when: `${w} becomes too isolated when the routine genuinely depends on cloud access across devices.`, what_to_do_instead: `Choose ${l} if account-based sync has become necessary.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when account maintenance and online sync keep feeling larger than the habit itself.`, what_to_do_instead: `Choose ${w} when using the tracker without that extra layer is the real advantage.` },
      ],
      custom_database: [
        { tool: context.winnerSide, fails_when: `${w} becomes too rigid when the user truly needs habits to function as structured records inside a larger system.`, what_to_do_instead: `Choose ${l} if database-level customization is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when building and maintaining the database keeps standing between the user and consistent habit logging.`, what_to_do_instead: `Choose ${w} when a ready-to-use tracker fits better.` },
      ],
      social_layers: [
        { tool: context.winnerSide, fails_when: `${w} becomes too solitary when outside accountability or coaching is the main thing keeping the habit alive.`, what_to_do_instead: `Choose ${l} if social support is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when social feeds and coaching layers keep distracting from the habit itself.`, what_to_do_instead: `Choose ${w} when private tracking is the cleaner fit.` },
      ],
      general: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited once the heavier mechanism is actually doing enough work to justify itself.`, what_to_do_instead: `Choose ${l} if the added layer is now worth carrying.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the same overhead keeps showing up before useful habit tracking can happen.`, what_to_do_instead: `Choose ${w} when the simpler path is the real gain.` },
      ],
    };
    return items[context.mode] || items.general;
  }
  const items = {
    workspace_system: [
      { tool: context.winnerSide, fails_when: `${w} becomes too heavy when the user wants habits separated from the rest of work instead of mixed into one planning surface.`, what_to_do_instead: `Choose ${l} if a dedicated tracker now fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when habits need to appear inside the same daily system as tasks and to-do work.`, what_to_do_instead: `Choose ${w} when unified workflow context matters.` },
    ],
    commitment_system: [
      { tool: context.winnerSide, fails_when: `${w} becomes too intense when the user wants low-pressure consistency rather than enforced pacing and consequences.`, what_to_do_instead: `Choose ${l} if gentle tracking fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when habits need real quantitative pacing, deadlines, or accountability to hold.`, what_to_do_instead: `Choose ${w} when simple logging is no longer enough.` },
    ],
    measurable_targets: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the habit only needs a simple done-or-not-done check.`, what_to_do_instead: `Choose ${l} if metrics are not carrying real value.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the habit needs measurable targets and progress review that a simple completion log cannot express.`, what_to_do_instead: `Choose ${w} when metrics now matter.` },
    ],
    sync_devices: [
      { tool: context.winnerSide, fails_when: `${w} becomes less attractive when the user intentionally wants habit data tied to one local device.`, what_to_do_instead: `Choose ${l} if local-only use is the real priority.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when habit data needs to move with the user across devices instead of staying trapped in one place.`, what_to_do_instead: `Choose ${w} when cross-device access matters daily.` },
    ],
    custom_database: [
      { tool: context.winnerSide, fails_when: `${w} becomes too slow when the user only wants quick habit logging without maintaining a broader workspace system.`, what_to_do_instead: `Choose ${l} if ready-made tracking fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when fixed lists can no longer support structured records, relations, or dashboards.`, what_to_do_instead: `Choose ${w} when system-level customization is now required.` },
    ],
    analytics: [
      { tool: context.winnerSide, fails_when: `${w} becomes too heavy when the user rarely reviews charts and mostly wants fast daily completion logging.`, what_to_do_instead: `Choose ${l} if simpler tracking is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user needs trend analysis and performance review rather than only raw check-offs.`, what_to_do_instead: `Choose ${w} when analytics are part of the job.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the winning mechanism is not doing enough real work yet.`, what_to_do_instead: `Choose ${l} if the simpler tradeoff still fits.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the friction named in the rule keeps recurring during normal habit tracking.`, what_to_do_instead: `Choose ${w} once that mechanism matters daily.` },
    ],
  };
  return items[context.mode] || items.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  const burdenCases = {
    workspace_system: `This can flip if habits genuinely need to sit inside projects, tasks, or a broader work system instead of staying separate. Then ${l} may be worth the extra structure.`,
    commitment_system: `This can flip if the user now needs hard accountability and measurable pacing more than a low-friction check-off routine. Then ${l} may be worth the heavier setup.`,
    measurable_targets: `This can flip if the habit now needs target values and formal measurement from the start instead of a simple completion mark. Then ${l} may be the better fit.`,
    gamification: `This can flip if motivation is the real problem and rewards or progression now keep the habit alive better than simplicity does. Then ${l} may be worth the extra layer.`,
    cloud_account: `This can flip if the user now needs cloud access across devices more than freedom from account maintenance. Then ${l} may make more sense.`,
    custom_database: `This can flip if habits now need to operate as structured records inside a broader system instead of a ready-made tracker. Then ${l} may be worth the setup.`,
    social_layers: `This can flip if coaching or social accountability has become the main thing keeping the habit consistent. Then ${l} may be worth the added interaction.`,
    general: `This can flip if the heavier mechanism on the losing side starts doing more real work than the simpler path currently does. Then ${l} may be worth the tradeoff.`,
  };
  const strengthCases = {
    workspace_system: `This can flip if the user decides habits should stay separate from tasks and projects rather than inside one work system. Then ${l} may fit better.`,
    commitment_system: `This can flip if the user decides hard pacing and commitment pressure are more draining than helpful. Then ${l} may be the better fit.`,
    measurable_targets: `This can flip if the habit no longer needs formal targets and a simple completion routine is enough. Then ${l} may be the better fit.`,
    sync_devices: `This can flip if the user decides habit data should stay on one local device and cross-device access is no longer important. Then ${l} may fit better.`,
    custom_database: `This can flip if the user no longer needs habits inside a custom database system and would rather use a fixed tracker that works immediately. Then ${l} may be the better fit.`,
    analytics: `This can flip if the user stops needing charts and review analysis and mainly wants a lighter daily logging experience. Then ${l} may be the better fit.`,
    general: `This can flip if the tradeoff on the losing side starts doing more real work than the mechanism that currently wins. Then ${l} may be worth the switch.`,
  };
  return sentence((context.orientation === "burden" ? burdenCases : strengthCases)[context.mode] || (context.orientation === "burden" ? burdenCases.general : strengthCases.general));
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const burdenRules = {
    workspace_system: [`Choose ${w} if habit tracking should stay separate from a bigger productivity workspace.`, `Choose ${l} if habits really need to live inside projects or task lists.`, `Avoid ${l} when workspace navigation is the actual friction.`],
    commitment_system: [`Choose ${w} if you need to start logging before setting penalties or pacing rules.`, `Choose ${l} if hard accountability is now part of the job.`, `Avoid ${l} when commitment mechanics are what make the tracker hard to use.`],
    measurable_targets: [`Choose ${w} if the habit should start before metrics are configured.`, `Choose ${l} if target values are necessary from day one.`, `Avoid ${l} when numbers are adding more friction than clarity.`],
    gamification: [`Choose ${w} if you want habit logging to stay close to a simple checkmark.`, `Choose ${l} if rewards and progression are genuinely helping consistency.`, `Avoid ${l} when game mechanics are the friction you are trying to remove.`],
    cloud_account: [`Choose ${w} if you do not want habit tracking tied to a cloud account first.`, `Choose ${l} if cross-device sync now matters more than avoiding account upkeep.`, `Avoid ${l} when account maintenance is the real drag.`],
    custom_database: [`Choose ${w} if you want to log habits before building a database system.`, `Choose ${l} if habits really need custom records and dashboards.`, `Avoid ${l} when workspace maintenance is larger than the habit itself.`],
    social_layers: [`Choose ${w} if private habit tracking fits better than social feeds or coaching.`, `Choose ${l} if outside accountability is now part of the solution.`, `Avoid ${l} when social features are the main distraction.`],
    general: [`Choose ${w} when the extra mechanism on the other side is the real source of friction.`, `Choose ${l} when that heavier model is now doing enough work to justify itself.`, `Avoid ${l} when extra layers keep arriving before useful habit tracking.`],
  };
  const strengthRules = {
    workspace_system: [`Choose ${w} if habits need to live inside the same daily system as tasks.`, `Choose ${l} if you want a dedicated tracker separate from work management.`, `Avoid ${l} when switching between habit and task systems slows the day down.`],
    commitment_system: [`Choose ${w} if habits need quantified pacing and hard accountability.`, `Choose ${l} if a lower-pressure habit routine works better for you.`, `Avoid ${l} when simple check-offs are not enough to keep the habit on track.`],
    measurable_targets: [`Choose ${w} if the habit needs measurable targets rather than a simple completion mark.`, `Choose ${l} if yes-no tracking is enough.`, `Avoid ${l} when the habit needs real metrics to make progress visible.`],
    sync_devices: [`Choose ${w} if habit progress needs to follow you across devices.`, `Choose ${l} if local single-device tracking is enough.`, `Avoid ${l} when device boundaries keep delaying habit logging.`],
    custom_database: [`Choose ${w} if habits need databases, relations, or dashboards.`, `Choose ${l} if you want a ready-made tracker that works immediately.`, `Avoid ${l} when fixed lists are the real limit.`],
    analytics: [`Choose ${w} if charts and trend review are part of the job.`, `Choose ${l} if you mainly want a lighter daily tracker.`, `Avoid ${l} when raw check-offs are not enough to explain performance.`],
    general: [`Choose ${w} when the mechanism in the rule affects daily habit tracking in practice.`, `Choose ${l} when its lighter tradeoff better matches the real job.`, `Avoid ${l} once the same friction keeps repeating in setup and routine use.`],
  };
  return (context.orientation === "burden" ? burdenRules : strengthRules)[context.mode] || (context.orientation === "burden" ? burdenRules.general : strengthRules.general);
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const burdenFaqs = {
    workspace_system: [{ q: `Why does ${w} fit better here`, a: `${w} keeps the habit routine from being slowed down by projects, task lists, or a bigger workspace model.` }, { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when habits genuinely need to sit inside a broader work system.` }, { q: `What usually makes ${l} the wrong fit`, a: `The larger workspace layer keeps arriving before the user can simply log the habit.` }, { q: `Is this only about simplicity`, a: `No. It is also about whether the work-system layer is doing real value or only adding navigation.` }],
    commitment_system: [{ q: `Why can less pressure be better here`, a: `Because contracts, penalties, and pacing rules only help once accountability is truly the missing ingredient instead of just making the tracker harder to start.` }, { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the habit needs real enforcement and measurable pacing.` }, { q: `What usually makes ${l} fail first`, a: `The commitment layer arrives before the user has even built a consistent logging routine.` }, { q: `Is this anti-accountability`, a: `No. It is about timing and fit.` }],
    measurable_targets: [{ q: `Why can a simpler tracker win here`, a: `Because metrics only help once the habit truly needs numbers instead of basic consistency.` }, { q: `When is ${l} still worth it`, a: `${l} is still worth it when the habit needs target values or progress metrics from the start.` }, { q: `What usually makes ${l} feel too heavy`, a: `The user keeps doing target setup and numeric entry before the habit routine is even stable.` }, { q: `Is this only for beginners`, a: `No. Any user can lose momentum when measurement overhead is larger than the value it creates.` }],
    gamification: [{ q: `Why can a plain habit tracker win here`, a: `Because quests, rewards, and character systems can add more interaction than the user wants around a simple habit check-off.` }, { q: `When is ${l} still better`, a: `${l} is still better when motivation depends on game mechanics and visible rewards.` }, { q: `What usually makes ${l} fail first`, a: `The game layer becomes extra work instead of useful motivation.` }, { q: `Does ${w} only win by being basic`, a: `No. It wins by keeping the habit action more direct.` }],
    cloud_account: [{ q: `Why can avoiding an account matter so much`, a: `Because account setup and sync maintenance affect first use, daily access, and the amount of service overhead attached to the habit routine.` }, { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when cross-device sync is now a real requirement.` }, { q: `What usually makes ${l} the wrong fit`, a: `The account and sync layer feels larger than the habit itself.` }, { q: `Is ${w} only for offline use`, a: `Mostly for users who want the tracker usable without another service dependency.` }],
    custom_database: [{ q: `Why can a fixed tracker beat a database system`, a: `Because custom fields, relations, and dashboards only help once that flexibility is truly being used instead of standing in front of habit logging.` }, { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when habits need to work as structured records inside a larger system.` }, { q: `What usually makes ${l} fail first`, a: `Building and maintaining the database keeps delaying actual habit tracking.` }, { q: `Is this anti-customization`, a: `No. It is about whether customization is helping or only adding setup.` }],
    social_layers: [{ q: `Why can private tracking be better here`, a: `Because social feeds and coaching layers only help once outside accountability is the real problem instead of another distraction.` }, { q: `When is ${l} still worth it`, a: `${l} is still worth it when coaching or social accountability is doing real work.` }, { q: `What usually makes ${l} feel too heavy`, a: `The user ends up managing social interaction instead of simply keeping the habit going.` }, { q: `Is this only for introverts`, a: `No. It is about whether the social layer helps the habit or distracts from it.` }],
    general: [{ q: `Why does ${w} fit the rule better`, a: `${w} wins because the other tool is the one introducing the extra mechanism named in the decision rule.` }, { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when that heavier mechanism is now doing enough real work to justify itself.` }, { q: `What usually signals it is time to switch`, a: `The added layer stops feeling like overhead and starts solving a real habit problem.` }, { q: `Is this only about simplicity`, a: `No. It is about which tool actually owns the burden described in the rule.` }],
  };
  const strengthFaqs = {
    workspace_system: [{ q: `Why does ${w} matter beyond one feature`, a: `${w} changes where habits are reviewed, how quickly they can be completed during the day, and whether they live inside the same execution system as tasks.` }, { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when a dedicated habit tracker is preferable to an all-in-one workspace.` }, { q: `What usually makes ${l} fail first`, a: `The user keeps switching between habit tracking and task management instead of handling both in one flow.` }, { q: `Is this only about convenience`, a: `No. It is also about whether habits belong inside the broader work system.` }],
    commitment_system: [{ q: `Why do commitment mechanics matter so much here`, a: `Because they change setup, the meaning of daily progress, and how much pressure the tracker applies when consistency slips.` }, { q: `When is ${l} still better`, a: `${l} is still better when the user wants habits to stay simple and low pressure.` }, { q: `What usually pushes someone toward ${w}`, a: `Simple check-offs stop being enough and the habit needs real quantitative accountability.` }, { q: `Is ${w} only for extreme users`, a: `No. It helps whenever the habit needs enforceable pacing instead of only a log.` }],
    measurable_targets: [{ q: `Why do measurable targets change the verdict`, a: `Because they decide whether the tracker can represent quantities and progress trends instead of flattening everything into a yes-no completion mark.` }, { q: `When is ${l} still enough`, a: `${l} is still enough when the habit only needs basic consistency tracking.` }, { q: `What usually makes ${l} feel limiting`, a: `The user needs more than a completion log to understand whether the habit is actually improving.` }, { q: `Is this a niche need`, a: `It matters whenever the habit has a meaningful target value rather than only attendance.` }],
    sync_devices: [{ q: `Why does sync matter so much here`, a: `Because it affects whether progress is available in the moment or delayed until the user returns to one specific device.` }, { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when single-device local tracking is genuinely enough.` }, { q: `What usually makes ${l} fail first`, a: `The habit routine keeps getting interrupted by the fact that progress is trapped on one device.` }, { q: `Is ${w} only about convenience`, a: `No. It also changes how dependable the habit system feels in daily life.` }],
    custom_database: [{ q: `Why do databases change the recommendation`, a: `Because they affect the habit data model, how habits connect to other workflows, and whether the review surface can evolve over time.` }, { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when a ready-made habit tracker is more useful than a customizable workspace.` }, { q: `What usually makes ${l} fail first`, a: `Fixed lists stop being enough once habits need structured records, relations, or dashboards.` }, { q: `Is ${w} harder to use`, a: `Yes, because greater flexibility usually means more setup and maintenance.` }],
    analytics: [{ q: `Why do charts change the verdict`, a: `Because they turn habit history into something the user can review, compare, and adjust instead of only recording that a habit happened.` }, { q: `When is ${l} still enough`, a: `${l} is still enough when the user mainly wants quick daily logging.` }, { q: `What usually makes ${l} feel too limited`, a: `The user wants to understand trends and performance, not just read a row of checkmarks.` }, { q: `Is ${w} only for data-heavy users`, a: `Mostly for users who actually review habit patterns and want the tracker to support that analysis.` }],
    general: [{ q: `Why does ${w} fit the rule better`, a: `${w} turns the mechanism in the decision rule into gains across setup, daily tracking, and longer-term habit management instead of only one narrow feature win.` }, { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when its tradeoff better matches the actual habit routine.` }, { q: `What usually signals it is time to switch`, a: `The same friction starts repeating in normal use instead of only appearing in edge cases.` }, { q: `Is this only about simplicity`, a: `No. It is about where the real operating cost of the habit tracker lands.` }],
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
  const sections = (doc.sections || []).map((section) => {
    if (section.type === "persona_fit") return { ...section, heading: `Why ${context.winnerName} fits ${context.persona}s better`, content: buildPersonaFit(context) };
    if (section.type === "x_wins") return { ...section, heading: `Where ${context.xName} wins`, bullets: xBullets };
    if (section.type === "y_wins") return { ...section, heading: `Where ${context.yName} wins`, bullets: yBullets };
    if (section.type === "failure_modes") return { ...section, heading: "Where each tool can break down", items: buildFailureModes(context) };
    if (section.type === "edge_case") return { ...section, heading: "When this verdict might flip", content: buildEdgeCase(context) };
    if (section.type === "quick_rules") return { ...section, heading: "Quick decision rules", rules: buildQuickRules(context) };
    return section;
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
    if (doc.categorySlug !== "habit-trackers") continue;
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
  const reportLines = ["# Habit Trackers Second Pass Report", "", `Date: ${new Date().toISOString()}`, "", `- Pages scanned: ${totalScanned}`, `- Pages expanded: ${changed.length}`, `- Sections rewritten: ${changed.reduce((sum, page) => sum + page.sections.length, 0)}`, `- Pages skipped: ${skipped.length}`, "", "## Expanded Pages", "", ...changed.flatMap((page) => [`- File path: ${page.filePath}`, `  Title: ${page.title}`, `  Sections rewritten: ${page.sections.join(", ")}`]), "", "## Skipped Pages", "", ...(skipped.length ? skipped.map((file) => `- ${file}`) : ["- None"]), ""];
  fs.writeFileSync(REPORT_PATH, `${reportLines.join("\n")}\n`);
  console.log(JSON.stringify({ reportPath: REPORT_PATH, pagesScanned: totalScanned, pagesExpanded: changed.length, sectionsRewritten: changed.reduce((sum, page) => sum + page.sections.length, 0), pagesSkipped: skipped.length }, null, 2));
}

main();
