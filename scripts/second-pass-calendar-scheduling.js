/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "calendar-scheduling-second-pass-report.md");

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
  if (/task integration|scheduled calendar blocks|workspace databases and task layers|workspace connections/.test(value)) return "task_layers";
  if (/automated planning|automated optimization|focus blocks|manually reorganized/.test(value)) return "automation_planning";
  if (/folder and account management|account management|service configuration|event types and booking links/.test(value)) return "setup_layers";
  if (/self-host|self hosting|configuration or self-host setup|deep configuration|apis/.test(value)) return "self_host_customization";
  if (/poll and collecting responses instead of letting people immediately book a time|individual booking links require setup before polling availability/.test(value)) {
    return /instead of letting people immediately book a time/.test(value) ? "booking_first" : "poll_first";
  }
  if (/quick polls|polling availability/.test(value)) return "poll_first";
  if (/manual email negotiation|automated booking links|booking link/.test(value)) return "booking_flow";
  if (/overlay their own calendar/.test(value)) return "availability_overlay";
  if (/payment processing and checkout|payment and service setup/.test(value)) return "payment_service";
  if (/installing a separate calendar client/.test(value)) return "separate_client";
  if (/enterprise setup exceeds project duration|short-term benefit|project duration/.test(value)) return "short_horizon";
  if (/routing workflows/.test(value)) return "routing_workflow";
  return "general";
}

function buildContext(doc) {
  const { xName, yName } = parsePair(doc.title);
  const winnerSide = doc.verdict?.winner === "x" ? "x" : "y";
  const loserSide = winnerSide === "x" ? "y" : "x";
  const rule = doc.verdict?.decision_rule || "";
  const mode = detectMode(rule);
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
    mode,
    orientation: detectOrientation(mode, rule),
  };
}

function detectOrientation(mode, rule) {
  const value = lower(rule);
  if (mode === "task_layers") {
    if (/introduces extra interface|adds unnecessary interface|workspace connections require ongoing adjustments|workspace databases and task layers introduce extra interface complexity/.test(value)) return "burden";
    return "strength";
  }
  if (mode === "automation_planning") {
    if (/adds extra interaction steps|adds unnecessary background activity/.test(value)) return "burden";
    return "strength";
  }
  if (mode === "setup_layers") return "burden";
  if (mode === "self_host_customization") {
    if (/requires configuration or self-host setup before generating a booking link|self-hosting or deep configuration outweighs short-term benefit/.test(value)) return "burden";
    return "strength";
  }
  if (mode === "payment_service") {
    if (/payment and service setup must be completed before sharing availability/.test(value)) return "burden";
    return "strength";
  }
  if (mode === "routing_workflow") return "burden";
  if (mode === "separate_client") return "burden";
  if (mode === "short_horizon") return "burden";
  if (mode === "booking_first" || mode === "poll_first" || mode === "booking_flow" || mode === "availability_overlay") return "strength";
  return "strength";
}

function winnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    task_layers: [
      { point: `${w} keeps scheduling closer to the actual work item`, why_it_matters: `Tasks and calendar blocks connect without forcing the user to bounce between separate planning surfaces.` },
      { point: `${w} shortens the daily path from deciding to doing`, why_it_matters: `The user can turn planned work into time on the calendar with fewer manual translation steps.` },
      { point: `${w} reduces the amount of interface structure you have to carry`, why_it_matters: `The scheduling model stays easier to navigate when task layers are helping instead of crowding the screen.` },
    ],
    automation_planning: [
      { point: `${w} moves conflict handling out of manual calendar cleanup`, why_it_matters: `Scheduling pressure is reduced because the tool can reorganize time without repeated drag-and-drop fixes.` },
      { point: `${w} protects daily focus time more actively`, why_it_matters: `The calendar does more than store events; it helps defend work blocks against meeting sprawl.` },
      { point: `${w} scales better when the week gets crowded`, why_it_matters: `Automatic planning removes some of the cognitive load that manual rescheduling creates.` },
    ],
    setup_layers: [
      { point: `${w} gets basic scheduling working sooner`, why_it_matters: `The user can create events or share availability before learning a heavier account or service structure.` },
      { point: `${w} keeps routine use closer to the calendar itself`, why_it_matters: `Daily scheduling does not keep routing through extra configuration panels or system layers.` },
      { point: `${w} lowers the mental map needed to stay oriented`, why_it_matters: `That matters when the user wants a simple event tool rather than a setup project.` },
    ],
    self_host_customization: [
      { point: `${w} gives more control over how booking workflows are built`, why_it_matters: `Self-hosting, API access, or deeper configuration let the system match more complex scheduling requirements.` },
      { point: `${w} supports more deliberate integration behavior`, why_it_matters: `The scheduling tool can fit into internal systems instead of only following a fixed hosted model.` },
      { point: `${w} leaves more room to adapt the workflow later`, why_it_matters: `That matters when the user expects scheduling needs to grow beyond a default booking page.` },
    ],
    poll_first: [
      { point: `${w} matches group coordination more directly`, why_it_matters: `Polls fit situations where many people's availability has to be compared before a final time is chosen.` },
      { point: `${w} reduces up-front scheduling setup`, why_it_matters: `The user can gather availability quickly instead of building a fuller booking workflow first.` },
      { point: `${w} keeps the process easier to understand for temporary coordination`, why_it_matters: `That helps when the meeting is a one-off decision rather than part of a recurring scheduling pipeline.` },
    ],
    booking_first: [
      { point: `${w} lets invitees act on availability immediately`, why_it_matters: `A booking page turns scheduling into one direct step instead of waiting for poll responses to settle.` },
      { point: `${w} keeps the daily scheduling path shorter`, why_it_matters: `The host can share one link and move on instead of managing a response-collection loop.` },
      { point: `${w} fits repeated one-to-one scheduling better`, why_it_matters: `The workflow scales when the main job is confirming slots quickly rather than comparing groups.` },
    ],
    booking_flow: [
      { point: `${w} removes back-and-forth from meeting setup`, why_it_matters: `A shareable booking link lets the other person choose a time without restarting the negotiation in email.` },
      { point: `${w} speeds up daily scheduling for repeat meetings`, why_it_matters: `The process stays consistent instead of requiring manual confirmation every time.` },
      { point: `${w} makes availability easier to hand off`, why_it_matters: `The calendar becomes a scheduling surface, not just a place where confirmed events end up.` },
    ],
    availability_overlay: [
      { point: `${w} lets invitees compare calendars before committing`, why_it_matters: `That removes guesswork during selection instead of asking people to translate availability mentally.` },
      { point: `${w} shortens the decision path for the other person`, why_it_matters: `Scheduling feels faster when invitees can evaluate fit without jumping back and forth between tools.` },
      { point: `${w} reduces coordination friction in denser calendars`, why_it_matters: `Overlay behavior matters more when small gaps and edge conflicts determine whether a meeting works.` },
    ],
    payment_service: [
      { point: `${w} keeps appointment booking tied to the service transaction`, why_it_matters: `Scheduling and checkout happen in one flow instead of requiring separate confirmation steps.` },
      { point: `${w} reduces manual handoff between booking and payment`, why_it_matters: `The user spends less time stitching together service setup after the slot is chosen.` },
      { point: `${w} fits businesses where appointments are part of a paid workflow`, why_it_matters: `The calendar works more like an operations tool instead of only an availability page.` },
    ],
    separate_client: [
      { point: `${w} starts scheduling without adding another app layer`, why_it_matters: `The user can create events immediately instead of first adopting a separate client workflow.` },
      { point: `${w} keeps daily calendar use more predictable`, why_it_matters: `Routine event handling stays in the environment the user already understands.` },
      { point: `${w} lowers the friction of staying on top of the calendar`, why_it_matters: `That matters when extra client setup is larger than the productivity benefit.` },
    ],
    short_horizon: [
      { point: `${w} becomes useful fast enough for a short-lived need`, why_it_matters: `The user can benefit now instead of burning most of the project window on setup.` },
      { point: `${w} keeps daily scheduling lighter during the temporary period`, why_it_matters: `There is less system to learn and maintain while the need is still short.` },
      { point: `${w} asks for less long-term commitment to its model`, why_it_matters: `That helps when the schedule problem may end before a heavier workflow pays back.` },
    ],
    routing_workflow: [
      { point: `${w} keeps availability sharing ahead of routing logic`, why_it_matters: `The user can get a link out quickly without first designing a more complex qualification flow.` },
      { point: `${w} reduces daily friction in straightforward scheduling`, why_it_matters: `Meetings can be booked without carrying workflow machinery that simpler use cases do not need.` },
      { point: `${w} lowers the admin burden of keeping scheduling usable`, why_it_matters: `That matters when routing depth is more overhead than help.` },
    ],
    general: [
      { point: `${w} handles the scheduling boundary more directly`, why_it_matters: `The user spends less time working around the exact friction named in the decision rule.` },
      { point: `${w} keeps day-to-day scheduling smoother`, why_it_matters: `The workflow stays shorter and easier to repeat.` },
      { point: `${w} reduces hidden overhead in the calendar system`, why_it_matters: `That matters when the scheduling tool is supposed to remove steps, not add another layer to manage.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function loserBullets(context) {
  const l = context.loserName;
  const sets = {
    task_layers: [
      { point: `${l} can still be better when the user wants a simpler calendar surface`, why_it_matters: `Less integrated structure can feel calmer when task layers would mostly add interface overhead.` },
      { point: `${l} keeps the schedule easier to scan as a plain calendar`, why_it_matters: `That matters when tasks do not need to sit directly inside the time-blocking workflow.` },
      { point: `${l} asks for less commitment to a combined task-calendar model`, why_it_matters: `The lighter calendar can be better if the richer layer is not doing much work yet.` },
    ],
    automation_planning: [
      { point: `${l} can still be better when the user wants the calendar to stay manual and visible`, why_it_matters: `Some people prefer direct control over every move even if automation could save time.` },
      { point: `${l} keeps the schedule easier to predict for users who dislike background changes`, why_it_matters: `That matters when automatic optimization feels like extra system activity instead of help.` },
      { point: `${l} reduces dependence on a planning engine`, why_it_matters: `The simpler calendar may be enough when the schedule is not crowded enough to justify automation.` },
    ],
    setup_layers: [
      { point: `${l} can still be better once the extra setup is doing real work`, why_it_matters: `Service layers, account structure, or event-type controls may pay off later when the scheduling workflow grows.` },
      { point: `${l} supports more formal organization around availability`, why_it_matters: `That matters when simple event entry is no longer enough.` },
      { point: `${l} may scale better for a broader scheduling system`, why_it_matters: `The same setup that slows beginners can help once the calendar job becomes more structured.` },
    ],
    self_host_customization: [
      { point: `${l} can still be better when the user wants booking to work with minimal configuration`, why_it_matters: `A hosted default can be faster when deeper customization is unnecessary.` },
      { point: `${l} reduces operational work outside the booking page`, why_it_matters: `That matters when self-hosting or APIs would mostly sit unused.` },
      { point: `${l} keeps the scheduling path simpler for straightforward needs`, why_it_matters: `The lighter tool can be better when control is not the actual bottleneck.` },
    ],
    poll_first: [
      { point: `${l} can still be better when scheduling should end in direct self-booking`, why_it_matters: `A booking flow is faster once individual appointment selection matters more than group comparison.` },
      { point: `${l} reduces follow-up after availability is shown`, why_it_matters: `That matters when the process should end with a confirmed slot, not a collected poll.` },
      { point: `${l} scales better for repeated one-to-one scheduling`, why_it_matters: `The poll model is not always the right fit for ongoing booking.` },
    ],
    booking_first: [
      { point: `${l} can still be better when many people's availability has to be compared before choosing a time`, why_it_matters: `A poll is often the clearer model when the meeting is fundamentally about collecting responses.` },
      { point: `${l} avoids overbuilding the scheduling flow for one-off group coordination`, why_it_matters: `That matters when a booking page would mostly add structure the meeting does not need.` },
      { point: `${l} keeps temporary group scheduling easier to explain`, why_it_matters: `The lighter poll model can be better when recurring self-booking is not the real job.` },
    ],
    booking_flow: [
      { point: `${l} can still be better when the user wants to negotiate in a simple shared calendar flow`, why_it_matters: `Manual scheduling may be enough if booking links would mostly be extra structure.` },
      { point: `${l} keeps the calendar closer to direct event entry`, why_it_matters: `That can feel lighter for users who do not need a booking surface.` },
      { point: `${l} avoids committing to a link-based scheduling model`, why_it_matters: `The simpler approach can be better when meetings are irregular and low volume.` },
    ],
    availability_overlay: [
      { point: `${l} can still be better when a normal booking page is enough`, why_it_matters: `Overlay comparison matters less if invitees do not need that extra visibility.` },
      { point: `${l} keeps the scheduling surface simpler`, why_it_matters: `That can help when the added comparison layer would mostly be extra interface.` },
      { point: `${l} reduces feature surface for straightforward bookings`, why_it_matters: `The lighter tool may be enough when small availability nuances are not the problem.` },
    ],
    payment_service: [
      { point: `${l} can still be better when the calendar should stay separate from commerce`, why_it_matters: `A simpler booking tool may be enough if payment happens elsewhere or not at all.` },
      { point: `${l} reduces setup tied to services and checkout`, why_it_matters: `That matters when the user only needs meeting booking.` },
      { point: `${l} keeps the scheduling flow lighter for non-paid appointments`, why_it_matters: `The added service stack is not always worth carrying.` },
    ],
    separate_client: [
      { point: `${l} can still be better when the user wants a more opinionated client experience`, why_it_matters: `A separate calendar app may provide workflow benefits once the user is ready to adopt it.` },
      { point: `${l} can improve speed after the client is already in place`, why_it_matters: `The problem is onboarding cost, not that the separate client has no value.` },
      { point: `${l} may suit users who want the calendar to behave differently from the default app`, why_it_matters: `That tradeoff can be worth it when the new client is doing real work.` },
    ],
    short_horizon: [
      { point: `${l} can still be better if the same scheduling system will last beyond the short project`, why_it_matters: `A heavier setup makes more sense when the user is really investing for longer use.` },
      { point: `${l} may support deeper scheduling structure later`, why_it_matters: `The extra model can pay back once the need stops being temporary.` },
      { point: `${l} becomes more reasonable when long-run capability matters more than fast adoption`, why_it_matters: `The problem here is timing, not that the tool lacks value.` },
    ],
    routing_workflow: [
      { point: `${l} can still be better when lead routing or qualification is the real job`, why_it_matters: `The extra workflow may be worth it once the schedule is tied to a broader intake system.` },
      { point: `${l} supports more structured booking handoff`, why_it_matters: `That matters when not every invitee should follow the same path.` },
      { point: `${l} scales better once simple availability sharing is no longer enough`, why_it_matters: `The extra routing layer can become useful when complexity is intentional.` },
    ],
    general: [
      { point: `${l} can still be better in a narrower scheduling workflow`, why_it_matters: `The losing tool may fit when the winner's mechanism is not doing much real work yet.` },
      { point: `${l} often offers a lighter or more direct tradeoff`, why_it_matters: `That can matter when the richer scheduling layer would mostly sit unused.` },
      { point: `${l} may be the better fit once complexity is intentional`, why_it_matters: `The friction only matters when it is getting in the way of the real calendar job.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function simplicityWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    task_layers: [
      { point: `${w} keeps scheduling in a plain event calendar`, why_it_matters: `The user can review the day without first parsing task inboxes, planning panels, or cross-tool structure.` },
      { point: `${w} keeps ordinary event changes on a shorter path`, why_it_matters: `Daily use stays closer to adding, moving, or checking events instead of operating a combined planning system.` },
      { point: `${w} asks for less mental translation between calendar and work system`, why_it_matters: `That matters when the real goal is seeing time clearly rather than blending tasks and scheduling together.` },
    ],
    automation_planning: [
      { point: `${w} keeps the schedule manual and easier to predict`, why_it_matters: `The user can see why a time block changed instead of interpreting planner behavior running in the background.` },
      { point: `${w} keeps daily scheduling on visible calendar actions`, why_it_matters: `Routine use stays focused on entering and adjusting events instead of tuning automation rules.` },
      { point: `${w} reduces the mental overhead of trusting the system`, why_it_matters: `That helps when automated rescheduling is exactly what makes the calendar feel less calm.` },
    ],
    setup_layers: [
      { point: `${w} gets to useful scheduling with fewer setup decisions`, why_it_matters: `The user can start creating events or sharing time before building a heavier account and service model.` },
      { point: `${w} keeps routine scheduling on the main calendar surface`, why_it_matters: `Daily use does not keep bouncing through event type, account, or service setup screens first.` },
      { point: `${w} reduces the amount of system structure the user has to remember`, why_it_matters: `That matters when the extra setup model is what keeps slowing the workflow down.` },
    ],
    self_host_customization: [
      { point: `${w} produces a booking link without infrastructure choices first`, why_it_matters: `The user can share availability before self-hosting, API planning, or deployment decisions become a side project.` },
      { point: `${w} keeps everyday scheduling close to the hosted booking page`, why_it_matters: `Routine use is faster when customization work is not mixed into the normal path for sharing time.` },
      { point: `${w} lowers the operational load around scheduling`, why_it_matters: `That helps when the real job is getting meetings booked, not managing booking infrastructure.` },
    ],
    payment_service: [
      { point: `${w} shares availability before checkout setup is required`, why_it_matters: `The user can begin booking time without first configuring payments, services, or pricing flow.` },
      { point: `${w} keeps daily bookings focused on choosing time`, why_it_matters: `That matters when the appointment is mainly a scheduling problem rather than a service transaction.` },
      { point: `${w} reduces the business-system overhead around simple meetings`, why_it_matters: `The tool stays lighter when commerce layers would mostly add setup and maintenance.` },
    ],
    routing_workflow: [
      { point: `${w} gets availability in front of people without qualification logic first`, why_it_matters: `The user can share a booking path quickly instead of building a routing workflow before anyone can choose a time.` },
      { point: `${w} keeps routine scheduling closer to direct booking`, why_it_matters: `Daily use is faster when the meeting does not have to pass through intake steps or branch logic.` },
      { point: `${w} lowers the admin burden of keeping scheduling usable`, why_it_matters: `That matters when routing machinery is the exact source of friction.` },
    ],
    separate_client: [
      { point: `${w} starts scheduling without asking the user to adopt another app`, why_it_matters: `The first useful event can be created before a separate client workflow has to be installed and learned.` },
      { point: `${w} keeps routine calendar work in the environment the user already knows`, why_it_matters: `That shortens the path for everyday event handling and reduces switching cost.` },
      { point: `${w} avoids the upkeep of another calendar surface`, why_it_matters: `The simpler setup matters when the extra client is more effort than benefit.` },
    ],
    short_horizon: [
      { point: `${w} becomes useful inside a short payoff window`, why_it_matters: `The user can benefit now instead of spending most of the project period on setup and learning.` },
      { point: `${w} keeps temporary scheduling lighter day to day`, why_it_matters: `There is less system to maintain while the need is still short-lived.` },
      { point: `${w} asks for less long-term commitment to its model`, why_it_matters: `That helps when the scheduling problem may end before a heavier tool has time to pay back.` },
    ],
    general: [
      { point: `${w} lowers the setup burden that the losing tool introduces`, why_it_matters: `The user reaches useful scheduling sooner.` },
      { point: `${w} keeps daily calendar work more direct`, why_it_matters: `Routine scheduling takes fewer extra steps.` },
      { point: `${w} makes the tool easier to operate without extra system thinking`, why_it_matters: `That matters when the added mechanism is the source of friction.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function simplicityLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    task_layers: [
      { point: `${l} can still be better when tasks and time blocks must live in one place`, why_it_matters: `The extra planning layer can be worth it once the calendar is also acting as the execution system.` },
      { point: `${l} reduces manual handoff between task lists and scheduled work`, why_it_matters: `That matters when copying work into the calendar has become the bigger daily bottleneck.` },
      { point: `${l} gives more structure for users who want a combined planning surface`, why_it_matters: `The added complexity only pays back when that integrated model is doing real work.` },
    ],
    automation_planning: [
      { point: `${l} can still be better when the schedule is crowded enough to justify automation`, why_it_matters: `Background planning may save more time than it costs once manual cleanup becomes frequent.` },
      { point: `${l} actively reorganizes time when conflicts pile up`, why_it_matters: `That matters when interruptions and shifting priorities are the real bottleneck.` },
      { point: `${l} can handle denser calendars with less manual juggling`, why_it_matters: `The extra planner behavior pays back when the week is hard to manage by hand.` },
    ],
    setup_layers: [
      { point: `${l} can still be better once the extra setup supports a broader scheduling system`, why_it_matters: `Service layers and richer configuration may help when the workflow grows beyond basic events.` },
      { point: `${l} supports more structured scheduling flows later`, why_it_matters: `That matters when event types, accounts, or service rules are now part of the real job.` },
      { point: `${l} may scale better for a more formal calendar operation`, why_it_matters: `The setup only pays back when the tool is doing more than the winner is built to handle.` },
    ],
    self_host_customization: [
      { point: `${l} can still be better once self-hosting or deeper control becomes necessary`, why_it_matters: `The same configuration burden can pay back when the workflow genuinely needs owned infrastructure.` },
      { point: `${l} fits teams that need booking behavior to connect with internal systems`, why_it_matters: `That matters when a fixed hosted workflow has become the real limitation.` },
      { point: `${l} leaves more room for deployment and governance decisions`, why_it_matters: `The added setup only makes sense once operational control is part of the job.` },
    ],
    payment_service: [
      { point: `${l} can still be better when appointments are tightly tied to paid services`, why_it_matters: `Checkout and service setup may be worth the extra structure if they are part of every booking.` },
      { point: `${l} keeps booking and payment in the same operational flow`, why_it_matters: `That matters when the handoff between appointment and checkout should not be manual.` },
      { point: `${l} scales better for service businesses`, why_it_matters: `The extra setup only pays back when the calendar is part of a commercial workflow.` },
    ],
    routing_workflow: [
      { point: `${l} can still be better when requests need qualification before booking`, why_it_matters: `The added routing model helps once not every invitee should take the same path.` },
      { point: `${l} supports more structured handoff across teams`, why_it_matters: `That matters when scheduling is part of a broader intake workflow instead of a single booking page.` },
      { point: `${l} scales better once simple booking is no longer enough`, why_it_matters: `The extra workflow only pays back when that complexity is intentional.` },
    ],
    separate_client: [
      { point: `${l} can still be better when its dedicated client workflow is doing real work`, why_it_matters: `The separate app may pay back once the user wants a more opinionated calendar experience.` },
      { point: `${l} can improve speed after the client is already in place`, why_it_matters: `The problem is onboarding cost, not that the client lacks value.` },
      { point: `${l} may suit users who want the calendar to behave differently from the default app`, why_it_matters: `That tradeoff can be worth it once the new client is clearly helping.` },
    ],
    short_horizon: [
      { point: `${l} can still be better if the same scheduling system will last beyond the short project`, why_it_matters: `A heavier setup makes more sense when the user is really investing for longer use.` },
      { point: `${l} may support deeper structure later`, why_it_matters: `The extra model can pay back once the need stops being temporary.` },
      { point: `${l} becomes more reasonable when long-run capability matters more than fast adoption`, why_it_matters: `The problem here is timing, not that the tool lacks value.` },
    ],
    general: [
      { point: `${l} can still be better once the heavier mechanism starts doing real work`, why_it_matters: `The added layer is not useless, just earlier than this use case needs.` },
      { point: `${l} may support a broader workflow later`, why_it_matters: `That matters once the winner's simpler path stops being enough.` },
      { point: `${l} becomes more reasonable when complexity is intentional`, why_it_matters: `The friction only matters when it is not paying back.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function buildPersonaFit(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const p = context.personaNoun;
  if (context.orientation === "burden") {
    const simple = {
      task_layers: `${w} fits this ${p} because ${l} is the tool adding the task layer, not ${w}. That extra layer slows ordinary event entry, adds more planning structure to scan, and makes the calendar feel heavier during normal use. ${w} wins by staying a clearer event calendar until task scheduling is genuinely necessary.`,
      automation_planning: `${w} fits this ${p} because ${l} is the tool introducing the planning engine, not ${w}. That engine adds background behavior to interpret, changes the schedule outside direct edits, and increases the amount of calendar logic the user has to track. ${w} wins by keeping scheduling more direct and predictable.`,
      setup_layers: `${w} fits this ${p} because ${l} is the tool adding the heavier setup model, not ${w}. Those extra layers slow the first useful action, keep adding configuration stops during routine scheduling, and force the user to remember more system structure than the calendar job requires. ${w} wins by reaching useful scheduling sooner.`,
      self_host_customization: `${w} fits this ${p} because ${l} is the tool introducing infrastructure and customization decisions, not ${w}. Those choices can matter later, but first they slow the path to a working booking link, add operational work, and make a simple scheduling need feel like a systems project. ${w} wins by keeping booking usable before deeper control is necessary.`,
      payment_service: `${w} fits this ${p} because ${l} is the tool adding payment and service layers, not ${w}. Those layers can help in service businesses, but here they slow first use, add more booking steps, and turn a simple availability problem into a broader operations problem. ${w} wins by keeping that commerce layer out of the way.`,
      routing_workflow: `${w} fits this ${p} because ${l} is the tool introducing routing logic, not ${w}. That workflow can help when booking is really intake management, but here it adds setup, branch decisions, and admin structure before anyone can simply choose a time. ${w} wins by keeping the path to a bookable slot shorter.`,
      separate_client: `${w} fits this ${p} because ${l} is the tool asking the user to adopt a separate calendar client, not ${w}. That adds another install step, another interface to learn, and another software surface to maintain before the calendar is even useful. ${w} wins by keeping scheduling in the environment the user already knows.`,
      short_horizon: `${w} fits this ${p} because ${l} is the tool asking for the heavier long-run investment, not ${w}. When the payoff window is short, setup time, learning effort, and extra structure all matter more because there is less time to earn them back. ${w} wins by becoming useful quickly enough to justify itself.`,
      general: `${w} fits this ${p} because ${l} is the tool introducing the extra mechanism named in the rule, not ${w}. ${w} wins by keeping that same friction from showing up in setup, daily scheduling, and coordination all at once.`,
    };
    return sentence(simple[context.mode] || simple.general);
  }
  const text = {
    task_layers: `${w} fits this ${p} because the same task-layer decision affects setup, daily scheduling speed, and interface clarity together. It changes whether work has to be translated between tools, whether scheduling stays close to execution, and how much extra structure the user has to carry in the calendar. ${w} wins by making that layer help rather than interrupt.`,
    automation_planning: `${w} fits this ${p} because planning automation changes more than one calendar move. It affects how conflicts are resolved, how much manual cleanup the week needs, and how much mental effort it takes to protect focus time once meetings start colliding. ${w} wins by reducing those recurring adjustments.`,
    setup_layers: `${w} fits this ${p} because extra setup layers do not only slow the first action. They also lengthen routine scheduling paths and increase the amount of account or service structure the user must remember later. ${w} wins by getting to useful scheduling before that system overhead takes over.`,
    self_host_customization: `${w} fits this ${p} because control over scheduling infrastructure changes both setup and long-term flexibility. It affects how workflows integrate with other systems, how much of the booking model can be adapted, and whether the tool can keep up once needs become less standard. ${w} wins by leaving that control open.`,
    poll_first: `${w} fits this ${p} because the real question is whether the scheduling job is group comparison or direct booking. That choice affects how much setup is needed, how quickly people can respond, and whether the coordination flow matches the actual meeting type. ${w} wins by fitting the simpler path this use case needs.`,
    booking_first: `${w} fits this ${p} because direct booking changes several parts of the workflow at once. It reduces the setup needed to share availability, shortens the path from invitation to confirmed slot, and avoids the extra response loop that poll-based scheduling creates. ${w} wins by turning availability into an immediate action.`,
    booking_flow: `${w} fits this ${p} because the same booking-link mechanism changes setup, daily coordination speed, and handoff quality together. It reduces negotiation, makes scheduling more repeatable, and turns availability into something another person can act on directly. ${w} wins by removing that back-and-forth layer.`,
    availability_overlay: `${w} fits this ${p} because invitee-side visibility changes more than one click. It affects how quickly a time is chosen, how much calendar translation the other person has to do, and how well the tool handles crowded schedules with narrow openings. ${w} wins by making the comparison easier before the choice is made.`,
    payment_service: `${w} fits this ${p} because scheduling is part of a paid service flow, not just a calendar event. That affects setup, the day-to-day booking handoff, and whether payment and confirmation stay connected instead of becoming separate chores. ${w} wins by keeping that operational flow together.`,
    separate_client: `${w} fits this ${p} because adding another calendar client changes setup cost, daily predictability, and how much extra software the user has to keep in mind just to create events. ${w} wins by keeping scheduling useful before a separate client model becomes necessary.`,
    short_horizon: `${w} fits this ${p} because the payoff window is short enough that setup and learning count more. A heavier system slows first use, adds more daily overhead while the need is still temporary, and may never recover its cost before the project ends. ${w} wins by becoming useful quickly enough.`,
    routing_workflow: `${w} fits this ${p} because routing logic changes setup, sharing speed, and admin burden together. It can help when the scheduling job is really intake management, but it becomes drag when all the user needs is a straightforward booking path. ${w} wins by keeping that complexity out of the way.`,
    general: `${w} fits this ${p} because the winning mechanism reduces friction across setup, daily scheduling, and ongoing coordination instead of solving only one narrow problem.`,
  };
  return sentence(text[context.mode] || text.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    const items = {
      task_layers: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when tasks and calendar blocks really do need to live together in one planning surface.`, what_to_do_instead: `Choose ${l} if integrated task scheduling is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the added task layer keeps making a simple calendar harder to scan and use.`, what_to_do_instead: `Choose ${w} when a cleaner event-first calendar is the real advantage.` },
      ],
      automation_planning: [
        { tool: context.winnerSide, fails_when: `${w} becomes too manual when the schedule is crowded enough that an optimization layer would now save real time.`, what_to_do_instead: `Choose ${l} if automatic planning has become genuinely useful.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when background planning keeps adding interaction and interpretation overhead that the user does not want.`, what_to_do_instead: `Choose ${w} when a more direct calendar is the better fit.` },
      ],
      setup_layers: [
        { tool: context.winnerSide, fails_when: `${w} becomes too light once the broader account, service, or event structure is doing real scheduling work.`, what_to_do_instead: `Choose ${l} if the extra setup is now paying back.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when configuration keeps standing between the user and basic scheduling.`, what_to_do_instead: `Choose ${w} when lower setup friction matters more.` },
      ],
      self_host_customization: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when self-hosting, APIs, or deeper workflow control are no longer optional.`, what_to_do_instead: `Choose ${l} if customization has become a real requirement.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when configuration and deployment choices keep arriving before the user can even share a working booking link.`, what_to_do_instead: `Choose ${w} when faster hosted scheduling is the real gain.` },
      ],
      payment_service: [
        { tool: context.winnerSide, fails_when: `${w} becomes too simple when payment and service setup are central to every appointment.`, what_to_do_instead: `Choose ${l} if the calendar now has to carry that paid-service flow.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when payment and service layers keep delaying simple availability sharing.`, what_to_do_instead: `Choose ${w} when scheduling should work before checkout setup.` },
      ],
      routing_workflow: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when requests genuinely need routing or qualification before booking.`, what_to_do_instead: `Choose ${l} if that workflow complexity is now real.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when routing machinery keeps getting in the way of straightforward scheduling.`, what_to_do_instead: `Choose ${w} when simple booking is the actual job.` },
      ],
      separate_client: [
        { tool: context.winnerSide, fails_when: `${w} becomes too basic when the separate client's workflow gains are now clearly worth adopting.`, what_to_do_instead: `Choose ${l} if the dedicated client is doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when another app layer is more effort than the calendar benefit is worth.`, what_to_do_instead: `Choose ${w} when staying in the default environment matters more.` },
      ],
      short_horizon: [
        { tool: context.winnerSide, fails_when: `${w} becomes too short-term if the same scheduling system will continue well beyond the temporary need.`, what_to_do_instead: `Choose ${l} if a longer-term investment now makes sense.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when setup and learning effort outlast the short payoff window.`, what_to_do_instead: `Choose ${w} when the tool has to start helping immediately.` },
      ],
      general: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited once the heavier mechanism is actually doing enough work to justify itself.`, what_to_do_instead: `Choose ${l} if the added layer is now worth carrying.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the same overhead keeps showing up before useful scheduling can happen.`, what_to_do_instead: `Choose ${w} when the simpler path is the real gain.` },
      ],
    };
    return items[context.mode] || items.general;
  }
  const items = {
    task_layers: [
      { tool: context.winnerSide, fails_when: `${w} becomes too heavy when the user only wants a plain calendar and the extra task layer is not doing enough real work.`, what_to_do_instead: `Choose ${l} if a simpler scheduling surface now fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when scheduling keeps requiring separate manual translation between tasks and calendar time.`, what_to_do_instead: `Choose ${w} when integrated planning has become a real need.` },
    ],
    automation_planning: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user wants every calendar move to stay manual and visible instead of being optimized in the background.`, what_to_do_instead: `Choose ${l} if direct control matters more than automatic planning.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when manual reorganization keeps consuming time that an optimization layer should have absorbed.`, what_to_do_instead: `Choose ${w} when crowded schedules need more active planning help.` },
    ],
    setup_layers: [
      { tool: context.winnerSide, fails_when: `${w} becomes too limited once richer event types, accounts, or service structure are genuinely necessary.`, what_to_do_instead: `Choose ${l} if the heavier setup is now doing useful work.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when extra configuration keeps standing between the user and basic scheduling.`, what_to_do_instead: `Choose ${w} when faster entry and lower overhead matter more.` },
    ],
    self_host_customization: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the user does not need self-hosting, APIs, or deeper workflow control.`, what_to_do_instead: `Choose ${l} if a simpler hosted model fits the real job.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when fixed booking behavior cannot match the user's integration or deployment requirements.`, what_to_do_instead: `Choose ${w} when customization and control are central.` },
    ],
    poll_first: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when people should simply choose a time directly instead of comparing a group poll.`, what_to_do_instead: `Choose ${l} if direct booking is now the better model.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the meeting really requires gathering and comparing multiple people's availability first.`, what_to_do_instead: `Choose ${w} when polling is the cleaner path.` },
    ],
    booking_first: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the meeting really depends on comparing many people's responses before a time can be chosen.`, what_to_do_instead: `Choose ${l} if a poll is now the cleaner coordination model.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user wants scheduling to end with an immediate confirmed slot instead of waiting for poll responses.`, what_to_do_instead: `Choose ${w} when direct booking is the real need.` },
    ],
    booking_flow: [
      { tool: context.winnerSide, fails_when: `${w} becomes too much when meetings are infrequent and a full booking-link model adds more setup than value.`, what_to_do_instead: `Choose ${l} if simple calendar negotiation is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when manual scheduling conversations keep repeating for meetings that should be self-booked.`, what_to_do_instead: `Choose ${w} when automated booking has become the real need.` },
    ],
    availability_overlay: [
      { tool: context.winnerSide, fails_when: `${w} becomes unnecessary when invitees do not need a richer comparison step to choose a workable time.`, what_to_do_instead: `Choose ${l} if a normal booking page is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when crowded schedules keep forcing invitees to guess which slot actually fits their own calendar.`, what_to_do_instead: `Choose ${w} when overlay comparison matters.` },
    ],
    payment_service: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when appointments are not tied to paid services or checkout flows.`, what_to_do_instead: `Choose ${l} if a simpler scheduling tool is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when booking and payment keep requiring manual handoff between separate systems.`, what_to_do_instead: `Choose ${w} when service and scheduling need to stay linked.` },
    ],
    separate_client: [
      { tool: context.winnerSide, fails_when: `${w} becomes limiting when the user is ready to adopt a more opinionated calendar client because the workflow gains now justify it.`, what_to_do_instead: `Choose ${l} if the separate client is doing real work.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when installing and maintaining another client becomes more effort than the scheduling gain is worth.`, what_to_do_instead: `Choose ${w} when staying in the default environment matters more.` },
    ],
    short_horizon: [
      { tool: context.winnerSide, fails_when: `${w} becomes too light if the same scheduling system will continue long after the short project ends.`, what_to_do_instead: `Choose ${l} if a longer-term investment now makes sense.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the setup and learning cost outlast the short payoff window.`, what_to_do_instead: `Choose ${w} when the tool has to start helping immediately.` },
    ],
    routing_workflow: [
      { tool: context.winnerSide, fails_when: `${w} becomes too simple when meeting requests need qualification, routing, or more structured handoff before booking.`, what_to_do_instead: `Choose ${l} if that workflow complexity is now real.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when routing machinery keeps getting in the way of simple availability sharing.`, what_to_do_instead: `Choose ${w} when straightforward booking is the real need.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the winning mechanism is not doing enough work yet.`, what_to_do_instead: `Choose ${l} if the simpler tradeoff still fits.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the friction named in the rule keeps recurring during normal scheduling.`, what_to_do_instead: `Choose ${w} when that mechanism now matters daily.` },
    ],
  };
  return items[context.mode] || items.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  if (context.orientation === "burden") {
    const cases = {
      task_layers: `This can flip if tasks and scheduling genuinely need to live together in one interface and that extra layer is doing real work. Then ${l} may be worth it.`,
      automation_planning: `This can flip if the calendar becomes crowded enough that automatic planning now saves more time than it costs. Then ${l} may be the better fit.`,
      setup_layers: `This can flip if the extra setup starts supporting a broader scheduling system the user actually needs. Then ${l} may make more sense.`,
      self_host_customization: `This can flip if self-hosting, APIs, or deeper control become real requirements instead of premature overhead. Then ${l} may be worth the added setup.`,
      payment_service: `This can flip if booking is tightly tied to paid services and checkout on most appointments. Then ${l} may be the better fit.`,
      routing_workflow: `This can flip if meeting requests truly need qualification and routing before booking. Then ${l} may make more sense.`,
      separate_client: `This can flip if the dedicated client workflow is now clearly worth adopting despite the extra app layer. Then ${l} may be the better choice.`,
      short_horizon: `This can flip if the same scheduling system will continue beyond the short project and now has time to pay back its setup cost. Then ${l} may be worth it.`,
      general: `This can flip if the heavier mechanism on the losing side starts doing more real work than the simpler path currently does. Then ${l} may be worth the tradeoff.`,
    };
    return sentence(cases[context.mode] || cases.general);
  }
  const cases = {
    task_layers: `This can flip if the user decides a plain calendar is better than carrying an integrated task layer that is no longer earning its space. Then ${l} may fit better.`,
    automation_planning: `This can flip if the user wants to keep the calendar fully manual and does not want background planning behavior changing the schedule. Then ${l} may be the better fit.`,
    setup_layers: `This can flip if the extra setup layers start doing real organizational work instead of just delaying first use. Then ${l} may be worth it.`,
    self_host_customization: `This can flip if the user no longer needs deeper control over deployment, APIs, or workflow behavior and would rather have a simpler hosted setup. Then ${l} may make more sense.`,
    poll_first: `This can flip if the scheduling job becomes direct individual booking rather than comparing group availability. Then ${l} may be the better model.`,
    booking_first: `This can flip if the meeting becomes more about comparing a group's availability than letting one person book a slot immediately. Then ${l} may be the better model.`,
    booking_flow: `This can flip if meetings are rare enough that a full booking-link workflow stops paying back its setup and structure cost. Then ${l} may be enough.`,
    availability_overlay: `This can flip if invitees do not need richer calendar comparison and a standard booking page is sufficient. Then ${l} may be the better fit.`,
    payment_service: `This can flip if payment and service configuration are no longer part of the appointment workflow. Then ${l} may be the cleaner option.`,
    separate_client: `This can flip if the user is ready to adopt a separate client because its workflow benefits now clearly outweigh the setup cost. Then ${l} may be worth it.`,
    short_horizon: `This can flip if the same scheduling system will continue beyond the short project or course and a heavier setup now has time to pay back. Then ${l} may make more sense.`,
    routing_workflow: `This can flip if meeting requests genuinely need qualification and routing before booking. Then ${l} may be the better fit.`,
    general: `This can flip if the tradeoff on the losing side starts doing more real work than the mechanism that currently wins. Then ${l} may be worth the switch.`,
  };
  return sentence(cases[context.mode] || cases.general);
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    const rules = {
      task_layers: [
        `Choose ${w} if you want a plain event calendar without extra planning layers.`,
        `Choose ${l} if tasks and time blocks really need to live together.`,
        `Avoid ${l} when integrated task layers are the main source of clutter.`,
      ],
      automation_planning: [
        `Choose ${w} if you want the schedule to stay more direct and visible.`,
        `Choose ${l} if automation now saves more time than it costs.`,
        `Avoid ${l} when background planning is the friction you are trying to remove.`,
      ],
      setup_layers: [
        `Choose ${w} if useful scheduling should start before heavier setup does.`,
        `Choose ${l} if the extra structure is now doing real work.`,
        `Avoid ${l} when configuration is bigger than the scheduling problem.`,
      ],
      self_host_customization: [
        `Choose ${w} if you need a booking link quickly without infrastructure decisions first.`,
        `Choose ${l} if self-hosting, APIs, or deeper control are now real requirements.`,
        `Avoid ${l} when customization arrives earlier than the workflow needs it.`,
      ],
      payment_service: [
        `Choose ${w} if scheduling should work before payment setup does.`,
        `Choose ${l} if booking and checkout genuinely belong in one flow.`,
        `Avoid ${l} when service configuration is the main delay.`,
      ],
      routing_workflow: [
        `Choose ${w} if straightforward booking matters more than routing logic.`,
        `Choose ${l} if qualification and routing are now part of the real job.`,
        `Avoid ${l} when workflow machinery is bigger than the meeting problem.`,
      ],
      separate_client: [
        `Choose ${w} if you do not want another calendar app layer first.`,
        `Choose ${l} if the dedicated client workflow is now worth adopting.`,
        `Avoid ${l} when extra client setup is the actual friction.`,
      ],
      short_horizon: [
        `Choose ${w} if the tool has to pay back during a short project or term.`,
        `Choose ${l} if you are really investing in a longer scheduling system.`,
        `Avoid ${l} when setup lasts longer than the useful window.`,
      ],
      general: [
        `Choose ${w} when the added mechanism on the other side is the real source of friction.`,
        `Choose ${l} when that heavier model is now doing enough work to justify itself.`,
        `Avoid ${l} when extra system layers keep arriving before useful scheduling.`,
      ],
    };
    return rules[context.mode] || rules.general;
  }
  const rules = {
    task_layers: [
      `Choose ${w} if tasks should turn into scheduled work with fewer translation steps.`,
      `Choose ${l} if a plain calendar is enough and extra task layers feel noisy.`,
      `Avoid ${l} when planning keeps getting split across separate tools.`,
    ],
    automation_planning: [
      `Choose ${w} if conflict cleanup and focus protection should happen more automatically.`,
      `Choose ${l} if you want scheduling to stay manual and fully visible.`,
      `Avoid ${l} when calendar reorganization keeps becoming a daily tax.`,
    ],
    setup_layers: [
      `Choose ${w} if useful scheduling should start before heavier account or service setup.`,
      `Choose ${l} if richer configuration is doing real work now.`,
      `Avoid ${l} when setup is larger than the actual scheduling job.`,
    ],
    self_host_customization: [
      `Choose ${w} if self-hosting, APIs, or deeper customization are real requirements.`,
      `Choose ${l} if a simpler hosted model is enough.`,
      `Avoid ${l} when fixed booking behavior is the main limitation.`,
    ],
    poll_first: [
      `Choose ${w} if the meeting needs group availability comparison first.`,
      `Choose ${l} if people should just book a time directly.`,
      `Avoid ${l} when a poll is the cleaner coordination model.`,
    ],
    booking_first: [
      `Choose ${w} if people should be able to book a time immediately.`,
      `Choose ${l} if the meeting needs group availability comparison first.`,
      `Avoid ${l} when waiting on poll responses is the main friction.`,
    ],
    booking_flow: [
      `Choose ${w} if automated booking links should replace back-and-forth scheduling.`,
      `Choose ${l} if manual calendar negotiation is still enough.`,
      `Avoid ${l} when repeated meeting setup keeps turning into email churn.`,
    ],
    availability_overlay: [
      `Choose ${w} if invitees should compare their own calendar before choosing.`,
      `Choose ${l} if a standard booking page is enough.`,
      `Avoid ${l} when crowded schedules keep making slot choice harder than it should be.`,
    ],
    payment_service: [
      `Choose ${w} if booking and payment need to stay in one flow.`,
      `Choose ${l} if you only need scheduling without service checkout.`,
      `Avoid ${l} when booking keeps requiring manual payment handoff.`,
    ],
    separate_client: [
      `Choose ${w} if event scheduling should work without adopting another client.`,
      `Choose ${l} if the separate client is doing enough workflow work to justify itself.`,
      `Avoid ${l} when extra client setup is the real friction.`,
    ],
    short_horizon: [
      `Choose ${w} if the tool has to pay back during a short project or term.`,
      `Choose ${l} if you are investing in a longer-run scheduling system.`,
      `Avoid ${l} when the setup lasts longer than the useful window.`,
    ],
    routing_workflow: [
      `Choose ${w} if fast availability sharing matters more than routing logic.`,
      `Choose ${l} if booking requests really need qualification and routing.`,
      `Avoid ${l} when workflow machinery is larger than the meeting problem.`,
    ],
    general: [
      `Choose ${w} when the mechanism in the rule is already affecting daily scheduling.`,
      `Choose ${l} when its tradeoff better matches the actual calendar job.`,
      `Avoid ${l} once the same friction keeps repeating in setup and routine use.`,
    ],
  };
  return rules[context.mode] || rules.general;
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    const faqs = {
      task_layers: [
        { q: `Why does ${w} fit better here`, a: `${w} keeps the calendar focused on events instead of making the user carry a combined task-and-schedule system they do not need.` },
        { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when tasks and scheduled work genuinely need to live together in one workflow.` },
        { q: `What usually makes ${l} the wrong fit`, a: `The added task layer keeps making the calendar harder to scan and use.` },
        { q: `Is this only about simplicity`, a: `No. It is also about which tool actually owns the extra planning layer.` },
      ],
      automation_planning: [
        { q: `Why can a simpler calendar win here`, a: `Because automation can add background changes, extra controls, and more system behavior than the user wants to manage.` },
        { q: `When is ${l} still better`, a: `${l} is still better when schedule pressure is high enough that automation clearly pays back its overhead.` },
        { q: `What usually makes ${l} fail first`, a: `Background planning becomes the friction instead of the solution.` },
        { q: `Does ${w} only win by being basic`, a: `No. It wins by keeping the schedule more direct and predictable.` },
      ],
      setup_layers: [
        { q: `Why do setup layers matter so much`, a: `Because they affect first use, routine navigation, and how much service structure the user has to keep in mind later.` },
        { q: `When is ${l} still worth it`, a: `${l} is still worth it when the added setup is supporting a broader scheduling workflow the user actually needs.` },
        { q: `What usually makes ${l} feel too heavy`, a: `Configuration keeps arriving before basic scheduling is even working.` },
        { q: `Is this only about beginners`, a: `No. Any user can lose time when setup is larger than the actual calendar job.` },
      ],
      self_host_customization: [
        { q: `Why can less control be better here`, a: `Because self-hosting and deeper configuration only help once those choices are truly necessary instead of standing in front of a simple booking link.` },
        { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when customization and deployment control are now real requirements.` },
        { q: `What usually makes ${l} fail first`, a: `The setup and infrastructure layer arrives before the user has even shared a working booking path.` },
        { q: `Is this anti-customization`, a: `No. It is about timing and fit.` },
      ],
      payment_service: [
        { q: `Why does service setup change the recommendation`, a: `Because it affects first use, daily booking flow, and whether the calendar is carrying commerce complexity it may not need.` },
        { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when booking and payment genuinely belong in one appointment workflow.` },
        { q: `What usually makes ${l} the wrong fit`, a: `Payment and service setup keep delaying simple scheduling.` },
        { q: `Is ${w} only for non-business use`, a: `Mostly for cases where the calendar does not need to act like a checkout system.` },
      ],
      routing_workflow: [
        { q: `Why can simpler scheduling beat routing logic`, a: `Because routing only pays back once the booking flow is really part of a larger qualification process.` },
        { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when booking requests genuinely need routing before a time is chosen.` },
        { q: `What usually makes ${l} fail first`, a: `The workflow machinery is larger than the meeting problem.` },
        { q: `Is ${w} only for low-volume use`, a: `No. It is for cases where straightforward booking is the real job.` },
      ],
      separate_client: [
        { q: `Why does another client matter so much`, a: `Because it adds onboarding cost, another interface, and another piece of software to maintain before the calendar is useful.` },
        { q: `When is ${l} still worth it`, a: `${l} is still worth it when its dedicated client workflow is now clearly earning that extra setup.` },
        { q: `What usually makes ${l} the wrong fit`, a: `Another app layer becomes more effort than the scheduling benefit is worth.` },
        { q: `Does ${w} only win by staying familiar`, a: `It also wins by reducing setup and orientation cost.` },
      ],
      short_horizon: [
        { q: `Why does time horizon change the recommendation`, a: `Because setup and learning only pay back if the scheduling need lasts long enough for the investment to matter.` },
        { q: `When is ${l} still worth it`, a: `${l} is still worth it when the same scheduling system will continue beyond the short project or course.` },
        { q: `What usually makes ${l} the wrong call`, a: `The need ends before the heavier setup has earned back its cost.` },
        { q: `Does ${w} only win by being simpler`, a: `It also wins by matching the real payoff window.` },
      ],
      general: [
        { q: `Why does ${w} fit the rule better`, a: `${w} wins because the other tool is the one introducing the extra mechanism named in the decision rule.` },
        { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when that heavier mechanism is now doing enough real work to justify itself.` },
        { q: `What usually signals it is time to switch`, a: `The added layer stops feeling like overhead and starts solving a real scheduling problem.` },
        { q: `Is this only about minimalism`, a: `No. It is about which tool actually owns the burden described in the rule.` },
      ],
    };
    return (faqs[context.mode] || faqs.general).map((item) => ({
      q: sentence(item.q).slice(0, -1) + "?",
      a: sentence(item.a),
    }));
  }
  const faqs = {
    task_layers: [
      { q: `Why does ${w} win on more than one feature`, a: `${w} also changes how quickly work moves from task planning into calendar time and how much extra interface structure the user has to carry each day.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when a plain calendar surface is enough and integrated task layers would mostly add overhead.` },
      { q: `What usually makes ${l} fail first`, a: `The user keeps translating work manually between tasks and scheduled time.` },
      { q: `Is this only about complexity`, a: `No. It is also about how directly the calendar supports execution.` },
    ],
    automation_planning: [
      { q: `Why does automation matter so much here`, a: `Because it changes conflict handling, focus protection, and how much manual rework the user does once the calendar gets crowded.` },
      { q: `When is ${l} still better`, a: `${l} is still better when the user prefers a fully manual calendar and does not want background optimization behavior.` },
      { q: `What usually pushes someone toward ${w}`, a: `Repeated manual calendar cleanup becomes a real drain on the week.` },
      { q: `Is ${w} only for extreme schedules`, a: `No. It helps whenever meeting pressure and focus protection keep colliding.` },
    ],
    setup_layers: [
      { q: `Why do setup layers change the recommendation`, a: `Because they affect first use, routine navigation, and how much service structure the user must keep in mind later.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when the added setup is supporting a broader scheduling workflow that the user actually needs.` },
      { q: `What usually makes ${l} feel too heavy`, a: `The user keeps configuring accounts, services, or event types before basic scheduling is even working.` },
      { q: `Does ${w} only win by being simpler`, a: `No. It wins by reaching useful scheduling faster.` },
    ],
    self_host_customization: [
      { q: `Why does customization matter beyond setup`, a: `Because it also affects integration behavior, workflow fit, and whether the tool can adapt once scheduling needs stop being standard.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the user does not need self-hosting or deeper workflow control.` },
      { q: `What usually makes ${l} the wrong fit`, a: `Fixed hosted behavior blocks the integrations or control the user actually needs.` },
      { q: `Is this only for very technical teams`, a: `No. Any user with real deployment or workflow requirements can care about it.` },
    ],
    poll_first: [
      { q: `Why does polling win in some cases`, a: `Because some meetings are mainly about comparing many people's availability rather than letting one invitee self-book immediately.` },
      { q: `When is ${l} still the better model`, a: `${l} is the better model when people should choose a time directly and the process ends there.` },
      { q: `What usually makes ${l} fail first`, a: `The coordination problem is group comparison, not individual booking.` },
      { q: `Is ${w} only for informal use`, a: `No. It is for any schedule where quick group alignment is the real job.` },
    ],
    booking_first: [
      { q: `Why does direct booking win in some cases`, a: `Because some meetings should move straight from shared availability to a confirmed slot without waiting for poll responses.` },
      { q: `When is ${l} still the better model`, a: `${l} is still the better model when the meeting depends on comparing many people's availability before choosing a time.` },
      { q: `What usually makes ${l} fail first`, a: `The user wants an immediate booking path, not a response-collection loop.` },
      { q: `Is ${w} only for one-to-one meetings`, a: `Mostly for cases where fast confirmed booking matters more than group comparison.` },
    ],
    booking_flow: [
      { q: `Why do booking links matter so much here`, a: `Because they remove negotiation, speed up repeated scheduling, and make availability something the other person can act on directly.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when meetings are low volume and manual coordination is not yet painful.` },
      { q: `What usually pushes users toward ${w}`, a: `Too much time keeps disappearing into arranging meetings that could have been self-booked.` },
      { q: `Is this only about convenience`, a: `No. It also changes how scalable the scheduling process feels.` },
    ],
    availability_overlay: [
      { q: `Why does invitee-side overlay change the verdict`, a: `Because it affects how easily someone can compare their real calendar before picking a slot instead of guessing from memory.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when a standard booking page gives invitees all the context they need.` },
      { q: `What usually makes ${l} feel limiting`, a: `Crowded calendars make it too hard to judge a workable time from a normal availability list alone.` },
      { q: `Is this a niche feature`, a: `It becomes more important whenever small schedule gaps and edge conflicts matter.` },
    ],
    payment_service: [
      { q: `Why does payment integration change the recommendation`, a: `Because it ties scheduling to checkout, reducing manual handoff and making appointments easier to confirm in one flow.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the calendar does not need to handle payment or service configuration.` },
      { q: `What usually makes ${l} fail first`, a: `Booking keeps breaking away from the service transaction and creating follow-up work.` },
      { q: `Is ${w} only for businesses`, a: `Mostly for workflows where the appointment is part of an operational service exchange.` },
    ],
    separate_client: [
      { q: `Why does another calendar client matter so much`, a: `Because it adds onboarding cost, another software surface, and a new place the user must stay oriented just to create events.` },
      { q: `When is ${l} still worth it`, a: `${l} is still worth it when its client workflow gains now clearly outweigh the extra setup.` },
      { q: `What usually makes ${l} the wrong fit`, a: `Installing and maintaining another calendar app feels like more work than the benefit it brings.` },
      { q: `Does ${w} only win by staying familiar`, a: `It also wins by getting to useful scheduling faster.` },
    ],
    short_horizon: [
      { q: `Why does time horizon matter here`, a: `Because setup and learning only pay back if the scheduling problem lasts long enough for that investment to matter.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when the same scheduling system will continue beyond the short project or course.` },
      { q: `What usually makes ${l} the wrong call`, a: `The need ends before the heavier setup has earned back its cost.` },
      { q: `Does ${w} only win by being simpler`, a: `It also wins by matching the real payoff window.` },
    ],
    routing_workflow: [
      { q: `Why does routing complexity matter so much`, a: `Because it affects setup, sharing speed, and whether the user is carrying workflow machinery that simple scheduling never needed.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when booking requests genuinely need qualification or routing before a time is chosen.` },
      { q: `What usually makes ${l} fail first`, a: `The routing layer is bigger than the scheduling problem itself.` },
      { q: `Is ${w} only for simple use cases`, a: `It is for cases where straightforward availability sharing is the real job.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} turns the mechanism in the decision rule into gains across setup, daily scheduling, and ongoing coordination instead of only one narrow feature win.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when its tradeoff better matches the actual scheduling workflow.` },
      { q: `What usually signals it is time to switch`, a: `The same friction starts repeating in normal scheduling instead of only appearing in edge cases.` },
      { q: `Is this only about simplicity`, a: `No. It is about where the real operating cost of the scheduling tool lands.` },
    ],
  };
  return (faqs[context.mode] || faqs.general).map((item) => ({
    q: sentence(item.q).slice(0, -1) + "?",
    a: sentence(item.a),
  }));
}

function bulletBucket(text) {
  return /setup|config|create|install|account|service|self-host|client/i.test(text) ? "setup"
    : /daily|book|schedule|event|meeting|focus|resched|workflow/i.test(text) ? "workflow"
      : /link|poll|overlay|route|task|calendar block|availability|navigation|path/i.test(text) ? "navigation"
        : /workspace|account|service|payment|api|client|structure|permission/i.test(text) ? "structure"
          : /mental|overhead|complex|predict|clutter|activity|remember/i.test(text) ? "cognitive"
            : /integrat|handoff|checkout|compare|share/i.test(text) ? "integration"
              : "general";
}

function repeatedPage(doc) {
  const persona = (doc.sections || []).find((section) => section.type === "persona_fit")?.content || "";
  const xBullets = ((doc.sections || []).find((section) => section.type === "x_wins")?.bullets) || [];
  const yBullets = ((doc.sections || []).find((section) => section.type === "y_wins")?.bullets) || [];
  const xBuckets = new Set(xBullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
  const yBuckets = new Set(yBullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
  return xBuckets.size < 3 || yBuckets.size < 3 || /the user|this means|this removes|that matters when/i.test(persona);
}

function shouldRewriteSection(doc, section) {
  const mode = detectMode(doc.verdict?.decision_rule || "");
  const forceModes = ["task_layers", "automation_planning", "setup_layers", "self_host_customization", "payment_service", "routing_workflow", "separate_client", "short_horizon", "poll_first", "booking_first"];
  if (section.type === "persona_fit") return forceModes.includes(mode) || /the user|this means|this removes|that safety|the right tool/i.test(section.content || "") || repeatedPage(doc);
  if (section.type === "x_wins" || section.type === "y_wins") {
    const bullets = section.bullets || [];
    const buckets = new Set(bullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
    return forceModes.includes(mode) || buckets.size < 3 || bullets.some((bullet) => /instead of|can be|allows|provides|This/i.test(`${bullet.point} ${bullet.why_it_matters}`));
  }
  if (section.type === "failure_modes") return forceModes.includes(mode) || repeatedPage(doc);
  if (section.type === "edge_case") return forceModes.includes(mode) || repeatedPage(doc);
  if (section.type === "quick_rules") return forceModes.includes(mode) || repeatedPage(doc) || (section.rules || []).some((rule) => /Pick |If /.test(rule));
  return false;
}

function shouldRewriteFaqs(doc) {
  const faqs = doc.faqs || [];
  const mode = detectMode(doc.verdict?.decision_rule || "");
  const forceModes = ["task_layers", "automation_planning", "setup_layers", "self_host_customization", "payment_service", "routing_workflow", "separate_client", "short_horizon", "poll_first", "booking_first"];
  return forceModes.includes(mode) || faqs.length !== 4 || faqs.some((item) => /Why is .*|Can .*|Who should choose/.test(`${item.q} ${item.a}`)) || repeatedPage(doc);
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
        ? (context.orientation === "strength" ? winnerBullets(context) : simplicityWinnerBullets(context))
        : (context.orientation === "strength" ? loserBullets(context) : simplicityLoserBullets(context));
      rewrittenSections.push("x_wins");
      return { ...section, heading: `Where ${context.xName} wins`, bullets };
    }
    if (section.type === "y_wins" && shouldRewriteSection(doc, section)) {
      const bullets = context.winnerSide === "y"
        ? (context.orientation === "strength" ? winnerBullets(context) : simplicityWinnerBullets(context))
        : (context.orientation === "strength" ? loserBullets(context) : simplicityLoserBullets(context));
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
    if (doc.categorySlug !== "calendar-scheduling-tools") continue;
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
    "# Calendar / Scheduling Tools Second Pass Report",
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
