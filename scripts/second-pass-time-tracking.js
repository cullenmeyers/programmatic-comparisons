/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "time-tracking-second-pass-report.md");

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
  if (/self-host|self hosted|server|deep customization|hosting/.test(value)) return "self_host";
  if (/cloud account|ongoing sync|online account|cloud services|local storage|web-based app|works locally/.test(value)) return "local_first";
  if (/manually starting and stopping timers|manual timers|manual tagging|automatic background logging|automatic activity capture|automatic memory tracking|calendar events|physical device|passive activity detection|automatic timeline reconstruction|surveillance/.test(value)) return "capture_model";
  if (/navigating crm|project management modules|project management layers|task lists|full project management systems|separate app|billing modules|invoicing|business management workflows/.test(value)) return "workflow_layers";
  if (/billing rules|rate structures|payroll|accounting|budgets|allocations|approval workflows|compliance|expense tracking|configuring/.test(value)) return "setup_overhead";
  if (/jira integrations|monitoring features|screenshots|activity tracking|permissions|self-hosted web application|desktop app/.test(value)) return "operational_safety";
  if (/separate tools instead of one integrated system/.test(value)) return "integrated_flow";
  return "general";
}

function buildContext(doc) {
  const { xName, yName } = parsePair(doc.title);
  const winnerSide = doc.verdict?.winner === "x" ? "x" : "y";
  const loserSide = winnerSide === "x" ? "y" : "x";
  const winnerName = winnerSide === "x" ? xName : yName;
  const loserName = winnerSide === "x" ? yName : xName;
  return {
    doc,
    xName,
    yName,
    winnerSide,
    loserSide,
    winnerName,
    loserName,
    persona: doc.persona,
    personaNoun: personaNoun(doc.persona),
    rule: doc.verdict?.decision_rule || "",
    archetype: detectArchetype(doc.verdict?.decision_rule || ""),
  };
}

function isDeliberateCaptureRule(rule) {
  return /passive activity detection instead of explicit/i.test(rule)
    || /automatic timeline reconstruction instead of manual entry control/i.test(rule)
    || /automatic background tracking instead of scheduled visual time blocks/i.test(rule)
    || /surveillance features/i.test(rule);
}

function winnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    self_host: [
      { point: `${w} gives you control over where the tracker runs`, why_it_matters: `${w} lets you choose the server, environment, and upgrade timing instead of accepting a fixed hosted setup.` },
      { point: `${w} can be shaped around your own workflow rules`, why_it_matters: `That matters when a power user wants to change fields, permissions, or extensions instead of working around product limits.` },
      { point: `${w} keeps data ownership and admin access in the same hands`, why_it_matters: `You do not have to separate daily time tracking from the operational decisions about backups, retention, or internal access.` },
    ],
    local_first: [
      { point: `${w} starts without asking you to maintain an online account`, why_it_matters: `That removes an entire layer of setup and ongoing credential management before tracking can even feel routine.` },
      { point: `${w} keeps day-to-day tracking usable even when you are offline`, why_it_matters: `The timer or activity log still works when your connection drops instead of turning basic capture into a sync problem.` },
      { point: `${w} keeps the tool mentally lighter over time`, why_it_matters: `There is less to monitor because local capture does not keep surfacing account status, sync state, or browser dependency.` },
    ],
    capture_model: isDeliberateCaptureRule(context.rule)
      ? [
          { point: `${w} makes the capture model predictable`, why_it_matters: `You decide when tracking starts, stops, or gets categorized instead of reverse-engineering activity after the fact.` },
          { point: `${w} keeps review work cleaner at the end of the day`, why_it_matters: `You spend less time sorting noisy auto-detected sessions and more time looking at entries you actually meant to create.` },
          { point: `${w} reduces cognitive drift while working`, why_it_matters: `The tool stays aligned with deliberate sessions or structured entries instead of constantly inferring what counted as work.` },
        ]
      : [
          { point: `${w} reduces missed time during fast context switching`, why_it_matters: `Automatic or lower-friction capture helps when work moves too quickly for repeated start-stop decisions.` },
          { point: `${w} keeps logging from interrupting the task itself`, why_it_matters: `Less timer babysitting means fewer detours through controls before you can get back to the actual work.` },
          { point: `${w} makes review easier after the work is done`, why_it_matters: `Captured context gives you something concrete to confirm later instead of rebuilding the day from memory.` },
        ],
    workflow_layers: [
      { point: `${w} shortens the click path to the timer`, why_it_matters: `You can get from intention to active tracking without opening CRM, projects, billing, or other side systems first.` },
      { point: `${w} keeps daily use focused on time entry instead of navigation`, why_it_matters: `That matters for busy work because logging time stays a small action instead of a mini tour through the rest of the platform.` },
      { point: `${w} lowers the mental overhead of choosing where to log`, why_it_matters: `Fewer surrounding modules means fewer decisions about which workspace, pipeline, or admin surface you are supposed to be in.` },
    ],
    setup_overhead: [
      { point: `${w} gets you to the first entry faster`, why_it_matters: `You can start tracking before budgets, billing rules, payroll settings, or approval logic are fully modeled.` },
      { point: `${w} keeps the daily workflow from depending on admin fields`, why_it_matters: `That helps beginners because the timer does not keep asking for project accounting decisions they are not ready to make.` },
      { point: `${w} creates less cleanup risk when the setup is still evolving`, why_it_matters: `A simpler entry path means fewer early configuration mistakes get baked into every logged hour.` },
    ],
    operational_safety: [
      { point: `${w} feels safer to operate without specialist setup knowledge`, why_it_matters: `You are less likely to get blocked by hosting, permissions, or integration maintenance before the tool becomes useful.` },
      { point: `${w} keeps the working path more predictable day to day`, why_it_matters: `The tracker asks for fewer technical decisions while you are simply trying to log or review time.` },
      { point: `${w} narrows the number of systems you have to trust`, why_it_matters: `That reduces the fear that one broken integration, server change, or hidden setting will stop normal tracking.` },
    ],
    integrated_flow: [
      { point: `${w} keeps related work in the same workflow`, why_it_matters: `Time and adjacent records stay together, so you do not keep bouncing between separate tools to finish one piece of admin.` },
      { point: `${w} cuts down on duplicate entry`, why_it_matters: `Information only has to be captured once instead of being copied from the tracker into a second system later.` },
      { point: `${w} makes follow-through faster after the timer stops`, why_it_matters: `The next step is already close by, which matters when a solo user wants less upkeep around personal admin.` },
    ],
    general: [
      { point: `${w} keeps the initial setup lighter`, why_it_matters: `That helps the tool become useful before configuration work starts dominating the experience.` },
      { point: `${w} keeps daily tracking faster`, why_it_matters: `The core workflow takes fewer steps, which matters more than feature count when time entry happens repeatedly.` },
      { point: `${w} reduces mental overhead while logging`, why_it_matters: `You spend less time deciding how to use the tracker and more time simply recording the work.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function loserBullets(context) {
  const l = context.loserName;
  const sets = {
    self_host: [
      { point: `${l} is faster to start because the platform is already managed`, why_it_matters: `You can begin tracking without planning hosting, deployment, or upgrades first.` },
      { point: `${l} asks for less operational maintenance after signup`, why_it_matters: `That is useful when you want the tracker to stay someone else's infrastructure problem.` },
      { point: `${l} keeps the interface closer to a fixed product path`, why_it_matters: `Some teams prefer fewer customization decisions if the default workflow is already good enough.` },
    ],
    local_first: [
      { point: `${l} is easier when you need the same data on multiple devices`, why_it_matters: `Cloud access can be genuinely helpful if your tracking does not live on one machine.` },
      { point: `${l} is simpler for sharing or checking time from a browser`, why_it_matters: `Hosted access helps when the value comes from availability rather than from local control.` },
      { point: `${l} shifts storage and sync mechanics out of your hands`, why_it_matters: `That can feel lighter if you prefer convenience over owning the environment yourself.` },
    ],
    capture_model: isDeliberateCaptureRule(context.rule)
      ? [
          { point: `${l} can reduce manual start-stop effort`, why_it_matters: `Automatic collection helps if you would otherwise forget to log anything at all.` },
          { point: `${l} gives you a fuller trail to review later`, why_it_matters: `Some users value broad activity history even if they still need to clean it up afterward.` },
          { point: `${l} can surface patterns you would not capture intentionally`, why_it_matters: `That can be useful when the goal is observation first and precision second.` },
        ]
      : [
          { point: `${l} gives you tighter manual control over what counts`, why_it_matters: `Some users prefer intentional timers because every entry is explicit from the start.` },
          { point: `${l} can feel cleaner when the work is already well-defined`, why_it_matters: `If task boundaries are obvious, a simple manual timer may be enough without extra memory layers.` },
          { point: `${l} keeps the record easier to explain to someone else`, why_it_matters: `Manually started entries can be simpler to audit when the team wants a clear statement of intent for each block.` },
        ],
    workflow_layers: [
      { point: `${l} keeps adjacent business context close by`, why_it_matters: `That can help if time entry is only one step in a larger client, billing, or project process.` },
      { point: `${l} can reduce later admin handoff`, why_it_matters: `The extra modules may save time afterward if the logged hours immediately feed invoicing or project management.` },
      { point: `${l} gives a richer container for work that already lives in the same suite`, why_it_matters: `If the surrounding system is already your home base, the navigation cost can shrink.` },
    ],
    setup_overhead: [
      { point: `${l} gives more structure once the admin model is in place`, why_it_matters: `Budgets, billing rules, approvals, or payroll logic can be useful after the initial setup cost has been paid.` },
      { point: `${l} supports more formal downstream reporting`, why_it_matters: `The same required fields that slow beginners down can help mature operations later.` },
      { point: `${l} can fit stricter organizational workflows`, why_it_matters: `That matters when logged time has to satisfy finance, policy, or client billing constraints beyond simple entry.` },
    ],
    operational_safety: [
      { point: `${l} can be stronger once someone is ready to maintain the extra system`, why_it_matters: `More setup sometimes buys access to features that a simpler tool avoids.` },
      { point: `${l} can fit teams that already live inside the technical environment it expects`, why_it_matters: `The risk drops if hosting, integrations, or permissions are already familiar territory.` },
      { point: `${l} may support more specialized oversight or process controls`, why_it_matters: `That can matter when the organization values formal administration more than day-one simplicity.` },
    ],
    integrated_flow: [
      { point: `${l} stays lighter if you do not need the extra integration`, why_it_matters: `A separate tool can still be better when the surrounding admin process is tiny or optional.` },
      { point: `${l} gives you a narrower interface for pure tracking`, why_it_matters: `That helps if you want time logging to remain independent from mileage or other adjacent records.` },
      { point: `${l} can be easier to swap later`, why_it_matters: `A standalone tracker sometimes creates less dependency if you expect the rest of the workflow to change.` },
    ],
    general: [
      { point: `${l} can still be easier in a simpler workflow`, why_it_matters: `The lighter choice is often fine when the main decision rule does not matter yet.` },
      { point: `${l} may fit teams that value convenience over depth`, why_it_matters: `That tradeoff can be rational if advanced structure would mostly sit unused.` },
      { point: `${l} can reduce initial commitment`, why_it_matters: `Sometimes the easier surface is worth more than the winner's long-run advantage.` },
    ],
  };
  return sets[context.archetype] || sets.general;
}

function buildPersonaFit(context) {
  const w = context.winnerName;
  const p = context.personaNoun;
  const content = {
    self_host: `${w} fits this ${p} because the real decision is not only about logging hours. It is also about who controls the tracker after installation, how far the system can be bent to match internal process, and whether admin access stays in your own hands. That turns the same self-hosting mechanism into setup control, long-run flexibility, and data ownership rather than just one hosting preference.`,
    local_first: `${w} fits this ${p} because the same local-first mechanism removes friction in several places at once. It lowers setup by removing account creation, keeps daily tracking available even without a connection, and reduces the background worry that sync or login state will interrupt normal use. The win is not only privacy; it is steadier day-to-day operation with less upkeep.`,
    capture_model: `${w} fits this ${p} because the capture model changes more than one part of the workflow. It affects how often you have to interrupt yourself, how much reconstruction happens later, and how much trust you can place in the recorded timeline. That is why the choice here is not just auto versus manual in theory, but what kind of attention the tracker demands every day.`,
    workflow_layers: `${w} fits this ${p} because extra modules do not just add features. They change how many screens you pass through before logging, how much context you have to load into your head, and how easy it is to return to the real work after the timer starts. The faster tool wins here by keeping the tracking path short and mentally cheap.`,
    setup_overhead: `${w} fits this ${p} because setup burden keeps echoing into daily use. When a tool needs billing rules, approvals, or accounting structure up front, the beginner is not only slowed at the start; they are also more likely to make mistakes and hesitate during routine entry later. ${w} works better by letting basic time capture become familiar before the heavier structure matters.`,
    operational_safety: `${w} fits this ${p} because the core need is to feel safe using the tracker without wondering which technical layer might break next. A simpler operating model reduces the chance that hosting, permissions, integrations, or monitoring settings become the real job. That safety shows up in onboarding, maintenance, and confidence during normal use.`,
    integrated_flow: `${w} fits this ${p} because the same integration mechanism changes both speed and cleanup. When related admin steps stay close to the timer, you do less switching during the day and less copying afterward. That turns one structural advantage into a workflow gain before, during, and after the tracked work.`,
    general: `${w} fits this ${p} because the winning mechanism removes friction in more than one place. It changes how hard the tool is to start, how fast it feels in daily use, and how much thinking is required to keep accurate records over time.`,
  };
  return sentence(content[context.archetype] || content.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const items = {
    self_host: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when nobody wants server ownership, upgrades, or internal admin responsibility to become part of the tracking tool.`, what_to_do_instead: `Choose ${l} if managed convenience matters more than infrastructure control.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the team needs to decide where the tracker runs, how it is customized, or how the data is governed beyond vendor defaults.`, what_to_do_instead: `Choose ${w} when deployment control and deeper system ownership are real requirements.` },
    ],
    local_first: [
      { tool: context.winnerSide, fails_when: `${w} becomes limiting when the same time data has to stay visible across several devices or be checked from anywhere with no local machine involved.`, what_to_do_instead: `Choose ${l} if cross-device access matters more than local-only simplicity.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when account maintenance, sync state, or online dependency keeps getting in the way of a tool that should feel invisible.`, what_to_do_instead: `Choose ${w} when local capture and lower upkeep matter more than hosted availability.` },
    ],
    capture_model: isDeliberateCaptureRule(context.rule)
      ? [
          { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user constantly forgets to start tracking and needs the system to collect a broad trail automatically before any review happens.`, what_to_do_instead: `Choose ${l} if capture coverage matters more than deliberate control.` },
          { tool: context.loserSide, fails_when: `${l} breaks down when noisy automatic data creates more review work than the user wanted and the tracker starts demanding interpretation instead of recording intent.`, what_to_do_instead: `Choose ${w} when cleaner, more deliberate entries are the real priority.` },
        ]
      : [
          { tool: context.winnerSide, fails_when: `${w} becomes less compelling when the work is already neatly bounded and the user genuinely prefers to declare every start and stop by hand.`, what_to_do_instead: `Choose ${l} if explicit timer control is more important than reducing capture friction.` },
          { tool: context.loserSide, fails_when: `${l} breaks down when repeated timer starts, missed switches, or manual reconstruction keep eating attention during a fast day.`, what_to_do_instead: `Choose ${w} when lower-friction capture is the only way the record will stay complete.` },
        ],
    workflow_layers: [
      { tool: context.winnerSide, fails_when: `${w} becomes the weaker fit when time entry is only one small part of a larger workflow that truly needs CRM, invoicing, or project context in the same place.`, what_to_do_instead: `Choose ${l} if the surrounding business suite is doing real work instead of just getting in the way.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the extra modules become a daily navigation tax and the user keeps paying for context they did not need just to log one block of time.`, what_to_do_instead: `Choose ${w} when quick standalone entry matters more than suite depth.` },
    ],
    setup_overhead: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the organization already knows the billing, payroll, or approval model it needs and wants those controls enforced from the beginning.`, what_to_do_instead: `Choose ${l} if formal structure is valuable immediately, not later.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user is still trying to learn simple time entry but keeps getting blocked by finance, approval, or allocation configuration.`, what_to_do_instead: `Choose ${w} when first-use speed and lower setup risk matter more than enterprise structure.` },
    ],
    operational_safety: [
      { tool: context.winnerSide, fails_when: `${w} becomes less convincing when the team already has the technical support needed for integrations, hosting, or advanced controls and actually wants those extra layers.`, what_to_do_instead: `Choose ${l} if that operational complexity is intentional rather than risky.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when ordinary tracking depends on technical setup that the user does not trust themselves to maintain correctly.`, what_to_do_instead: `Choose ${w} when predictability matters more than specialist features.` },
    ],
    integrated_flow: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the user does not need the adjacent workflow in the same place and only wants a narrow tracker.`, what_to_do_instead: `Choose ${l} if standalone simplicity is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when one tracked action keeps spilling into another tool just to finish the surrounding admin.`, what_to_do_instead: `Choose ${w} when keeping the workflow together saves real follow-up time.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes unnecessary when the workflow stays simpler than this verdict assumes.`, what_to_do_instead: `Choose ${l} if the lighter option is genuinely enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when its simpler model starts creating repeat manual friction in daily use.`, what_to_do_instead: `Choose ${w} when that friction becomes the real bottleneck.` },
    ],
  };
  return items[context.archetype] || items.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  const lines = {
    self_host: `This can flip if the tracker is not part of your internal infrastructure strategy and nobody wants to own deployment or maintenance. In that narrower case, ${l} can be the better fit because managed convenience is the real constraint.`,
    local_first: `This can flip if the user regularly moves between devices or needs browser access from anywhere more than they need local-only simplicity. In that case, ${l} can justify the extra account layer.`,
    capture_model: isDeliberateCaptureRule(context.rule)
      ? `This can flip if the biggest problem is forgetting to log anything at all and broad automatic collection is the only way to recover the day afterward. Then ${l} may be worth the extra cleanup.`
      : `This can flip if the work is highly structured and the user actually prefers to declare each session manually. Then ${l} may feel clearer without becoming burdensome.`,
    workflow_layers: `This can flip if time entry is only useful when it immediately feeds the same CRM, billing, or project workflow the team already lives in. Then ${l} may save more downstream work than it costs up front.`,
    setup_overhead: `This can flip if the organization already knows its billing, payroll, or approval model and wants those rules enforced from the first day. Then ${l} may be worth the extra setup.`,
    operational_safety: `This can flip if the user has strong technical support and actually wants the extra control or integration surface that makes the losing tool feel risky to everyone else. Then ${l} can make sense.`,
    integrated_flow: `This can flip if the adjacent workflow is tiny and keeping the tracker independent matters more than keeping every related step together. Then ${l} may stay lighter in a good way.`,
    general: `This can flip if the project stays simpler than the main verdict assumes. Then ${l} may be easier without creating meaningful downsides.`,
  };
  return sentence(lines[context.archetype] || lines.general);
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const rules = {
    self_host: [
      `Choose ${w} if hosting control is part of the requirement.`,
      `Choose ${l} if you want the tracker ready without owning deployment.`,
      `Avoid ${l} when vendor defaults are the exact limit you are trying to escape.`,
    ],
    local_first: [
      `Choose ${w} if you want local capture without account upkeep.`,
      `Choose ${l} if browser access or multi-device visibility matters more.`,
      `Avoid ${l} when sync and login state are becoming the real maintenance burden.`,
    ],
    capture_model: isDeliberateCaptureRule(context.rule)
      ? [
          `Choose ${w} if you want cleaner intentional entries instead of broad automatic collection.`,
          `Choose ${l} if passive capture is the only way you will get a usable record at all.`,
          `Avoid ${l} when reviewing auto-collected activity takes more effort than the logging itself.`,
        ]
      : [
          `Choose ${w} if manual timers are causing missed or incomplete records.`,
          `Choose ${l} if explicit start-stop control is genuinely part of the appeal.`,
          `Avoid ${l} when timer babysitting keeps interrupting the work.`,
        ],
    workflow_layers: [
      `Choose ${w} if time entry should stay close to a single focused action.`,
      `Choose ${l} if the surrounding CRM, billing, or project suite is doing real daily work.`,
      `Avoid ${l} when logging one hour keeps turning into platform navigation.`,
    ],
    setup_overhead: [
      `Choose ${w} if a beginner needs to log time before learning admin structure.`,
      `Choose ${l} if budgets, payroll, or approvals must be modeled from the start.`,
      `Avoid ${l} when configuration work arrives before basic tracking habits do.`,
    ],
    operational_safety: [
      `Choose ${w} if predictable standalone use matters more than extra technical layers.`,
      `Choose ${l} if the team is ready to maintain the setup it expects.`,
      `Avoid ${l} when integrations, hosting, or admin controls feel fragile to the people using it.`,
    ],
    integrated_flow: [
      `Choose ${w} if the tracked work and follow-up admin should stay together.`,
      `Choose ${l} if a standalone tracker is enough on its own.`,
      `Avoid ${l} when one finished entry still has to be copied somewhere else.`,
    ],
    general: [
      `Choose ${w} when the main friction named in the rule is already showing up in daily use.`,
      `Choose ${l} when the simpler surface is still enough.`,
      `Avoid ${l} once the same small friction keeps repeating every day.`,
    ],
  };
  return rules[context.archetype] || rules.general;
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const faqs = {
    self_host: [
      { q: `Why does ${w} win on more than hosting`, a: `${w} changes not only where the tracker runs, but also how much control you keep over customization, upgrades, and data handling.` },
      { q: `What is the real cost of choosing ${w}`, a: `You are taking on more operational responsibility, so the tradeoff is control versus convenience rather than features versus no features.` },
      { q: `When is ${l} still the better choice`, a: `${l} is still better when nobody wants to own the environment and managed simplicity is genuinely the safer option.` },
      { q: `What usually forces the move away from ${l}`, a: `It is usually when fixed vendor boundaries start blocking deployment, admin, or customization decisions that the team actually needs to make.` },
    ],
    local_first: [
      { q: `Why does local first help beyond privacy`, a: `It also reduces account upkeep, lowers dependence on sync, and keeps basic tracking available when connectivity is not the thing you want to think about.` },
      { q: `What do you give up with ${w}`, a: `Usually some convenience around browser access, easier device switching, or hosted sharing.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when availability across devices matters more than keeping the tracker self-contained.` },
      { q: `What is the warning sign that ${l} is the wrong fit`, a: `It is when the account and sync layer keeps creating more maintenance than the actual time tracking itself.` },
    ],
    capture_model: isDeliberateCaptureRule(context.rule)
      ? [
          { q: `Why is ${w} better if ${l} captures more automatically`, a: `Because more raw data is not always better if the user then has to interpret, clean, or defend that data every day.` },
          { q: `What does ${l} still do well`, a: `${l} can still help when the real problem is forgetting to record anything and broad collection is more valuable than precision.` },
          { q: `What usually makes people outgrow ${l}`, a: `It is often the moment when reviewing passive activity becomes its own chore instead of saving time.` },
          { q: `Who should still prefer ${l}`, a: `Users who value exhaustive capture first and are willing to spend time sorting it afterward.` },
        ]
      : [
          { q: `Why does ${w} beat manual timers here`, a: `Because the benefit is not only automation. It also reduces interruptions, recovers missed time, and makes later review less dependent on memory.` },
          { q: `When is ${l} still the right choice`, a: `${l} is still right when the work is clearly bounded and the user genuinely prefers explicit control over every entry.` },
          { q: `What usually pushes people away from ${l}`, a: `Repeated missed starts, forgotten switches, and the feeling that logging time is interrupting the very work being tracked.` },
          { q: `Is ${w} only about speed`, a: `No. It also changes data completeness and how much mental effort the tracker demands during a busy day.` },
        ],
    workflow_layers: [
      { q: `Why does navigation matter so much in this comparison`, a: `Because the same extra module can slow setup, add click paths, and force more context switching every time someone logs a block of time.` },
      { q: `When is ${l} still worth the extra navigation`, a: `When the surrounding CRM, project, or billing workflow is actively used and time tracking needs to feed it immediately.` },
      { q: `What is the first sign that ${l} is too heavy`, a: `It is usually when logging time feels slower than it should because the user keeps passing through screens that are not the timer itself.` },
      { q: `Does ${w} mean giving up all structure`, a: `Not necessarily. It mainly means the path to entry is more focused and the extra context is not always forced into the first interaction.` },
    ],
    setup_overhead: [
      { q: `Why does setup matter after the first week`, a: `Because the same required fields and configuration logic often keep showing up during daily entry, especially for new users.` },
      { q: `When is ${l} still the stronger tool`, a: `When the organization truly needs the heavier budgeting, payroll, approval, or compliance structure from day one.` },
      { q: `What usually makes ${l} frustrating for beginners`, a: `The user is trying to build a simple logging habit while the product keeps asking for administrative certainty they do not have yet.` },
      { q: `What is the practical win with ${w}`, a: `You can make basic time capture routine first and only pay for deeper structure when it becomes necessary.` },
    ],
    operational_safety: [
      { q: `Why is ${w} safer for this persona`, a: `${w} reduces the number of technical assumptions the user has to carry, which lowers both fear and the chance of breaking normal tracking through setup mistakes.` },
      { q: `What does ${l} still offer`, a: `${l} can still be stronger when the team wants the extra integrations, controls, or technical depth and knows how to manage them.` },
      { q: `What usually makes ${l} feel risky`, a: `A normal user has to rely on hosting, integrations, permissions, or monitoring layers they do not fully understand.` },
      { q: `Is this really about features`, a: `Only partly. It is also about how much operational trust and technical confidence the tool expects from the user.` },
    ],
    integrated_flow: [
      { q: `Why does keeping the workflow together matter here`, a: `Because the same integration can save time during entry and also remove follow-up copying after the work is already finished.` },
      { q: `When is ${l} still the better choice`, a: `${l} is still better when the adjacent workflow is minimal and keeping the tracker independent is actually simpler.` },
      { q: `What usually pushes someone toward ${w}`, a: `The point where tracking time cleanly still leaves too much manual follow-up in another tool.` },
      { q: `Does ${w} always mean more complexity`, a: `Not necessarily. It can actually reduce complexity if the user was already doing the same handoff manually across two systems.` },
    ],
    general: [
      { q: `Why does ${w} fit the decision rule better`, a: `${w} turns the main mechanism in the rule into several practical gains instead of solving only one narrow problem.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when the workflow is simpler than the verdict assumes and the main friction is not showing up often yet.` },
      { q: `What usually signals it is time to switch`, a: `It is usually when the same small friction in the rule starts appearing during setup, daily use, and cleanup instead of in just one place.` },
      { q: `Is this verdict only about speed`, a: `No. It is also about how much structure, thought, and maintenance the tracker demands over time.` },
    ],
  };
  return (faqs[context.archetype] || faqs.general).map((item) => ({
    q: sentence(item.q).slice(0, -1) + "?",
    a: sentence(item.a),
  }));
}

function repeatedPage(doc) {
  const persona = (doc.sections || []).find((section) => section.type === "persona_fit")?.content || "";
  const xBullets = ((doc.sections || []).find((section) => section.type === "x_wins")?.bullets) || [];
  const yBullets = ((doc.sections || []).find((section) => section.type === "y_wins")?.bullets) || [];
  const bucket = (text) =>
    /setup|account|billing|payroll|approval|configure|server/i.test(text) ? "setup"
      : /navigate|module|dashboard|project|crm|billing|screen/i.test(text) ? "navigation"
      : /offline|local|cloud|sync|host|browser/i.test(text) ? "environment"
      : /automatic|manual|timer|capture|activity|calendar|session/i.test(text) ? "capture"
      : /complex|confus|predict|safe|maintain|maintenance/i.test(text) ? "overhead"
      : "general";
  const xBuckets = new Set(xBullets.map((bullet) => bucket(`${bullet.point} ${bullet.why_it_matters}`)));
  const yBuckets = new Set(yBullets.map((bullet) => bucket(`${bullet.point} ${bullet.why_it_matters}`)));
  return xBuckets.size < 3 || yBuckets.size < 3 || /removes the need|adds extra steps|ongoing setup|works locally and stores all data/i.test(persona);
}

function rewritePage(doc) {
  const context = buildContext(doc);
  const sections = (doc.sections || []).map((section) => {
    if (section.type === "persona_fit") {
      return {
        ...section,
        heading: `Why ${context.winnerName} fits ${context.persona}s better`,
        content: buildPersonaFit(context),
      };
    }
    if (section.type === "x_wins") {
      const bullets = context.winnerSide === "x" ? winnerBullets(context) : loserBullets(context);
      return { ...section, heading: `Where ${context.xName} wins`, bullets };
    }
    if (section.type === "y_wins") {
      const bullets = context.winnerSide === "y" ? winnerBullets(context) : loserBullets(context);
      return { ...section, heading: `Where ${context.yName} wins`, bullets };
    }
    if (section.type === "failure_modes") {
      return { ...section, heading: "Where each tool breaks down", items: buildFailureModes(context) };
    }
    if (section.type === "edge_case") {
      return { ...section, heading: "When this verdict might flip", content: buildEdgeCase(context) };
    }
    if (section.type === "quick_rules") {
      return { ...section, heading: "Quick rules", rules: buildQuickRules(context) };
    }
    return section;
  });

  return {
    ...doc,
    sections,
    faqs: buildFaqs(context),
    related_pages: [],
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
    if (doc.categorySlug !== "time-tracking-tools") continue;
    totalScanned += 1;

    if (!repeatedPage(doc)) {
      skipped.push(path.relative(ROOT, filePath).replace(/\\/g, "/"));
      continue;
    }

    const nextDoc = rewritePage(doc);
    if (JSON.stringify(nextDoc) !== JSON.stringify(doc)) {
      writeJson(filePath, nextDoc);
      changed.push({
        filePath: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        title: doc.title,
        sections: ["persona_fit", "x_wins", "y_wins", "failure_modes", "edge_case", "quick_rules", "faqs"],
      });
    } else {
      skipped.push(path.relative(ROOT, filePath).replace(/\\/g, "/"));
    }
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const reportLines = [
    "# Time Tracking Second Pass Report",
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    `- Pages scanned: ${totalScanned}`,
    `- Pages expanded: ${changed.length}`,
    `- Sections rewritten: ${changed.length * 7}`,
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
    sectionsRewritten: changed.length * 7,
    pagesSkipped: skipped.length,
  }, null, 2));
}

main();
