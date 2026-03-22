/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "email-inbox-tools-second-pass-report.md");

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
  if (/assign|comment on|collaborate within the same email thread|shared assignment|shared conversation visibility|who is responding|who is handling/.test(value)) return "team_collaboration";
  if (/screened before reaching the inbox|screened before reaching|filtered manually after arrival|filtered manually after delivery|approve or reject first time senders/.test(value)) return "sender_screening";
  if (/advertising|promotional/.test(value)) return "ad_free";
  if (/paying a recurring subscription|free account/.test(value)) return "free_access";
  if (/installing and configuring a desktop client|desktop mail client|imap or smtp accounts/.test(value)) return "client_setup";
  if (/self-hosted server environment|deployed and controlled inside a self-hosted server|deployed inside a self-hosted server/.test(value)) return "self_hosted";
  if (/complex rule-based folders and automation across multiple accounts|rule based folders and automation across multiple accounts/.test(value)) return "rules_automation";
  if (/keyboard-driven workflows and advanced filtering rules|tagging systems and filtering rules|advanced local settings|extended with add-ons|plugins or customized with advanced configuration/.test(value)) return "power_customization";
  return "general";
}

function detectOrientation(mode, rule) {
  const value = lower(rule);
  if (mode === "team_collaboration") return "strength";
  if (mode === "sender_screening") return "strength";
  if (mode === "ad_free") return "burden";
  if (mode === "free_access") return "burden";
  if (mode === "client_setup") return "burden";
  if (mode === "self_hosted") return "strength";
  if (mode === "rules_automation") return "strength";
  if (mode === "power_customization") return "strength";
  return /fails first/.test(value) ? "strength" : "strength";
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
    team_collaboration: [
      { point: `${w} keeps multiple teammates inside the same conversation instead of splitting work across separate inboxes`, why_it_matters: `Ownership and visibility stay clear without forwarding threads or asking who is replying.` },
      { point: `${w} speeds up daily coordination by keeping assignments and internal notes in the thread itself`, why_it_matters: `The team can decide who handles the message without switching to chat or a ticketing side channel.` },
      { point: `${w} gives shared email a clearer operating structure`, why_it_matters: `That matters when customer conversations belong to a team workflow instead of one personal mailbox.` },
    ],
    sender_screening: [
      { point: `${w} stops unknown senders before they become inbox cleanup work`, why_it_matters: `The user decides once whether a sender belongs instead of filtering messages after they have already landed.` },
      { point: `${w} keeps daily inbox review faster by reducing manual sorting after delivery`, why_it_matters: `Routine reading stays focused on approved senders instead of cleanup decisions.` },
      { point: `${w} changes the structure of the inbox from open admission to controlled entry`, why_it_matters: `That matters when simplicity depends on limiting what reaches the main inbox in the first place.` },
    ],
    self_hosted: [
      { point: `${w} can run inside infrastructure the user controls`, why_it_matters: `Deployment stays on private servers instead of depending on a vendor-hosted mail environment.` },
      { point: `${w} gives administrators more control over day-to-day mail operations`, why_it_matters: `Updates, integration points, and server-side behavior can be tied to the environment they already manage.` },
      { point: `${w} leaves more room to adapt the mail system over time`, why_it_matters: `That matters when ownership of the environment is part of the reason for choosing the tool.` },
    ],
    rules_automation: [
      { point: `${w} supports inbox structures that go beyond a simple flat stream`, why_it_matters: `Folders, account separation, and routing rules let the system scale with heavier mail volume.` },
      { point: `${w} reduces daily sorting work through rule-driven automation`, why_it_matters: `Messages can be moved or categorized before the user manually triages them.` },
      { point: `${w} handles multi-account complexity more deliberately`, why_it_matters: `That matters when the inbox is really a larger operating system for several work contexts.` },
    ],
    power_customization: [
      { point: `${w} gives the user deeper control over how the client behaves`, why_it_matters: `Extensions, plugins, or advanced settings let the inbox match a more demanding workflow instead of staying fixed.` },
      { point: `${w} supports faster day-to-day processing for people who rely on precision workflows`, why_it_matters: `Keyboard control, advanced filtering, or local configuration shorten the path through heavy inbox volume.` },
      { point: `${w} makes the mail system more adaptable as needs grow`, why_it_matters: `That matters when the user wants to shape the tool around their process instead of accepting a fixed model.` },
    ],
    general: [
      { point: `${w} handles the winning email mechanism more directly`, why_it_matters: `The user spends less time compensating for the exact friction named in the decision rule.` },
      { point: `${w} keeps daily inbox use smoother`, why_it_matters: `The practical workflow stays shorter and easier to repeat.` },
      { point: `${w} scales better once the inbox has to do more serious work`, why_it_matters: `That matters when the mechanism in the rule affects setup, daily use, and longer-term organization together.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function strengthLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    team_collaboration: [
      { point: `${l} can still be better when email belongs to one person instead of a team queue`, why_it_matters: `A personal inbox may feel lighter when shared ownership is not part of the workflow.` },
      { point: `${l} often keeps solo email use simpler than a collaboration layer`, why_it_matters: `That matters when assignment and internal notes would mostly be extra structure.` },
      { point: `${l} asks for less commitment to a shared-inbox model`, why_it_matters: `The lighter setup can be better when team coordination inside threads is not doing much real work.` },
    ],
    sender_screening: [
      { point: `${l} can still be better when the user prefers conventional inbox behavior`, why_it_matters: `Some people would rather accept delivery first and organize email with filters after arrival.` },
      { point: `${l} often integrates more naturally with larger productivity ecosystems`, why_it_matters: `That matters when sender control is less important than the surrounding toolset.` },
      { point: `${l} may feel more flexible for users who want their own sorting model`, why_it_matters: `The tradeoff can make sense when built-in screening is not the actual priority.` },
    ],
    self_hosted: [
      { point: `${l} can still be better when the user does not want to run mail infrastructure`, why_it_matters: `A hosted service can remove server setup and maintenance when control is not the main requirement.` },
      { point: `${l} gets email working faster for users who want immediate access`, why_it_matters: `That matters when deployment and server upkeep would mostly be extra work.` },
      { point: `${l} reduces the admin burden outside the inbox itself`, why_it_matters: `The hosted model can be the better tradeoff when convenience matters more than infrastructure ownership.` },
    ],
    rules_automation: [
      { point: `${l} can still be better when the user wants a simpler inbox model`, why_it_matters: `A flatter design may feel cleaner if complex rules and folder trees would mostly add maintenance.` },
      { point: `${l} reduces the amount of system tuning required to keep email usable`, why_it_matters: `That matters when the inbox should stay opinionated instead of deeply configurable.` },
      { point: `${l} can be the better fit when heavy automation is not the real job`, why_it_matters: `The lighter structure only loses once multi-account complexity truly needs formal rules.` },
    ],
    power_customization: [
      { point: `${l} can still be better when the user prefers a simpler email surface`, why_it_matters: `A less configurable client may be easier to adopt when advanced tuning would mostly go unused.` },
      { point: `${l} often works well for normal inbox volume without power-user setup`, why_it_matters: `That matters when the user does not actually need plugins, granular rules, or deep local settings.` },
      { point: `${l} reduces maintenance around the email tool itself`, why_it_matters: `The fixed model can be the better tradeoff when customization is not the main value.` },
    ],
    general: [
      { point: `${l} can still be better in a narrower email workflow`, why_it_matters: `The losing tool may fit when the winning mechanism is not doing much real work yet.` },
      { point: `${l} often offers a lighter tradeoff`, why_it_matters: `That can matter when the richer mechanism would mostly add overhead.` },
      { point: `${l} becomes more reasonable when complexity is not needed`, why_it_matters: `The friction only matters when it gets in the way of the actual inbox job.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function burdenWinnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    ad_free: [
      { point: `${w} keeps the inbox visually centered on messages instead of promotions`, why_it_matters: `The user can scan email without ad panels competing for attention.` },
      { point: `${w} shortens daily reading because message triage is not mixed with promotional clutter`, why_it_matters: `Routine inbox review stays focused on actual mail instead of ignoring interface noise.` },
      { point: `${w} lowers the cognitive load of using the inbox`, why_it_matters: `That matters when advertising is exactly what makes email feel busier than it needs to be.` },
    ],
    free_access: [
      { point: `${w} lets the user start sending and receiving email without a billing decision first`, why_it_matters: `The inbox works immediately instead of making a subscription the first requirement.` },
      { point: `${w} keeps daily email access available without recurring cost pressure`, why_it_matters: `That matters when the user needs reliable email but does not want each month of use to require justification.` },
      { point: `${w} reduces the commitment risk of adopting the tool`, why_it_matters: `The user can use the inbox for school or temporary needs without carrying a paid workflow they may not keep.` },
    ],
    client_setup: [
      { point: `${w} gets the inbox usable without client installation and account configuration first`, why_it_matters: `The user can log in and start reading mail before setup turns into a separate project.` },
      { point: `${w} keeps routine email access on a shorter path`, why_it_matters: `Daily use stays closer to opening the inbox instead of maintaining a client or account settings.` },
      { point: `${w} lowers the technical overhead of basic email use`, why_it_matters: `That matters when configuration steps are exactly what make the tool harder to adopt.` },
    ],
    general: [
      { point: `${w} removes the burden introduced by the losing tool`, why_it_matters: `The user reaches useful email sooner.` },
      { point: `${w} keeps daily inbox use more direct`, why_it_matters: `Routine reading and sending take fewer extra steps.` },
      { point: `${w} makes the inbox easier to operate without added overhead`, why_it_matters: `That matters when the burden named in the rule is the real source of friction.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function burdenLoserBullets(context) {
  const l = context.loserName;
  const sets = {
    ad_free: [
      { point: `${l} can still be better when the user values broader free-service perks over a cleaner interface`, why_it_matters: `Some people will tolerate promotional clutter if the surrounding service bundle matters more.` },
      { point: `${l} often stays familiar for users already embedded in its ecosystem`, why_it_matters: `That matters when the interface noise is acceptable in exchange for other conveniences.` },
      { point: `${l} may still fit when ad exposure is not the main dealbreaker`, why_it_matters: `The tradeoff only fails once interface cleanliness becomes a real priority.` },
    ],
    free_access: [
      { point: `${l} can still be better when faster power-user email handling is worth paying for`, why_it_matters: `The subscription may make sense once the interface is doing enough work to justify its cost.` },
      { point: `${l} often offers workflow gains that matter for heavier inbox volume`, why_it_matters: `That matters when email speed is a professional bottleneck instead of a basic utility.` },
      { point: `${l} may fit once the user wants a premium email workflow rather than a free baseline account`, why_it_matters: `The recurring fee only makes sense when the upgrade is clearly part of the job.` },
    ],
    client_setup: [
      { point: `${l} can still be better when the user wants a dedicated desktop workflow`, why_it_matters: `Installation and setup may be worth it once local-client behavior is part of the value.` },
      { point: `${l} often gives more control after the client is already in place`, why_it_matters: `That matters when the problem is onboarding friction, not that the desktop client has no upside.` },
      { point: `${l} may suit users who prefer a traditional mail-client model`, why_it_matters: `The extra setup only pays back when that client workflow is doing real work.` },
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
      ad_free: `${w} fits this ${p} because ${l} is the tool bringing advertising and promotional placements into the inbox, not ${w}. That clutter competes with real messages, slows routine scanning, and increases the amount of visual noise the user has to filter out during normal use. ${w} wins by keeping the inbox focused on mail instead of ad inventory.`,
      free_access: `${w} fits this ${p} because ${l} is the tool putting a subscription in front of basic email access, not ${w}. That adds a payment decision before the inbox is even useful, makes daily access feel tied to ongoing cost, and raises the switching risk for users who just need dependable email. ${w} wins by making the inbox usable before billing becomes part of the workflow.`,
      client_setup: `${w} fits this ${p} because ${l} is the tool asking for installation and account configuration before the inbox is even ready, not ${w}. Those steps slow first use, add more setup points to maintain later, and make basic email feel more technical than it needs to be. ${w} wins by reaching useful email faster.`,
      general: `${w} fits this ${p} because ${l} is the tool introducing the burden named in the decision rule, not ${w}. ${w} wins by keeping that same friction from showing up in setup, daily use, and long-term maintenance all at once.`,
    };
    return sentence(text[context.mode] || text.general);
  }
  const text = {
    team_collaboration: `${w} fits this ${p} because collaboration inside the thread changes several parts of the email workflow at once. It affects who owns the reply, whether internal discussion stays near the message, and how much coordination leaks into other tools when the inbox gets busy. ${w} wins by making shared email a native team workflow instead of an improvised one.`,
    sender_screening: `${w} fits this ${p} because sender screening changes more than one inbox decision. It affects what reaches the inbox in the first place, how much cleanup arrives during daily triage, and whether inbox simplicity depends on later filtering or earlier control. ${w} wins by moving the decision to the front of the workflow.`,
    self_hosted: `${w} fits this ${p} because infrastructure control changes setup, daily operations, and long-term flexibility together. It affects where the mail system runs, how it connects to other systems, and whether the environment can be shaped around internal requirements. ${w} wins by keeping that control under the user's own administration.`,
    rules_automation: `${w} fits this ${p} because folder rules and account automation change the whole operating model of the inbox. They affect how messages are routed before review, how several accounts stay organized in one place, and how much manual triage remains once volume grows. ${w} wins by giving large inbox systems more structure to work with.`,
    power_customization: `${w} fits this ${p} because deeper customization changes both daily speed and long-term workflow control. It affects whether the client can be extended, how precisely the inbox can be tuned, and how well the tool keeps up once the user's process becomes more specialized. ${w} wins by leaving more room to shape the system around the workflow.`,
    general: `${w} fits this ${p} because the winning mechanism improves setup, daily inbox use, and longer-term email management instead of solving only one narrow problem.`,
  };
  return sentence(text[context.mode] || text.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  if (context.orientation === "burden") {
    const items = {
      ad_free: [
        { tool: context.winnerSide, fails_when: `${w} becomes too plain when the user is willing to tolerate ad clutter in exchange for other ecosystem benefits or a broader free-service bundle.`, what_to_do_instead: `Choose ${l} if interface cleanliness is no longer the real priority.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when advertising keeps competing with actual messages during normal inbox use.`, what_to_do_instead: `Choose ${w} when a cleaner message-first inbox is the real gain.` },
      ],
      free_access: [
        { tool: context.winnerSide, fails_when: `${w} becomes too basic when the user now needs a premium email workflow badly enough to justify paying for it.`, what_to_do_instead: `Choose ${l} if the paid interface is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the user needs ordinary email access but does not want a recurring bill standing in front of it.`, what_to_do_instead: `Choose ${w} when free access is the actual requirement.` },
      ],
      client_setup: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited when the user really wants a dedicated desktop workflow with the benefits of a local client.`, what_to_do_instead: `Choose ${l} if the client model is now doing real work.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when installation and account setup keep delaying basic email access.`, what_to_do_instead: `Choose ${w} when getting to a usable inbox quickly matters more.` },
      ],
      general: [
        { tool: context.winnerSide, fails_when: `${w} becomes too limited once the heavier mechanism is actually doing enough work to justify itself.`, what_to_do_instead: `Choose ${l} if the added layer is now worth carrying.` },
        { tool: context.loserSide, fails_when: `${l} breaks down when the same overhead keeps showing up before useful email can happen.`, what_to_do_instead: `Choose ${w} when the simpler path is the real gain.` },
      ],
    };
    return items[context.mode] || items.general;
  }
  const items = {
    team_collaboration: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when email is mostly personal and a team collaboration layer would mostly sit unused.`, what_to_do_instead: `Choose ${l} if one-person inbox handling is the real workflow.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when several people need to own, discuss, and respond to the same thread without coordination happening elsewhere.`, what_to_do_instead: `Choose ${w} when shared thread collaboration matters daily.` },
    ],
    sender_screening: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user prefers a more conventional inbox and wants to rely on filters or categories after delivery.`, what_to_do_instead: `Choose ${l} if built-in screening is not the real gain.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when unknown senders keep reaching the inbox and creating cleanup work after the message has already landed.`, what_to_do_instead: `Choose ${w} when pre-inbox screening matters more.` },
    ],
    self_hosted: [
      { tool: context.winnerSide, fails_when: `${w} becomes too heavy when the user wants email working immediately without deploying or maintaining mail infrastructure.`, what_to_do_instead: `Choose ${l} if a hosted service is the better operational tradeoff.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the mail system has to run inside infrastructure the user controls instead of on a vendor platform.`, what_to_do_instead: `Choose ${w} when self-hosted control is a real requirement.` },
    ],
    rules_automation: [
      { tool: context.winnerSide, fails_when: `${w} becomes too much when the user would rather have a simpler inbox than manage folders, automation logic, and account structure.`, what_to_do_instead: `Choose ${l} if a lighter inbox model fits better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when large inbox volume needs rules, folder logic, or multi-account organization that a simpler structure cannot carry.`, what_to_do_instead: `Choose ${w} when automation depth is now part of the job.` },
    ],
    power_customization: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the user rarely uses advanced settings, extensions, or granular controls.`, what_to_do_instead: `Choose ${l} if a simpler client is enough.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user needs deeper control over shortcuts, filters, plugins, or local client behavior than the tool can provide.`, what_to_do_instead: `Choose ${w} when customization depth now matters daily.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the winning mechanism is not doing enough real work yet.`, what_to_do_instead: `Choose ${l} if the simpler tradeoff still fits.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the exact friction named in the rule keeps recurring during normal inbox use.`, what_to_do_instead: `Choose ${w} once that mechanism matters daily.` },
    ],
  };
  return items[context.mode] || items.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  const burdenCases = {
    ad_free: `This can flip if the user decides ad clutter is tolerable in exchange for other benefits in the surrounding service. Then ${l} may be acceptable.`,
    free_access: `This can flip if the user now values a premium inbox workflow enough to justify paying for it each month. Then ${l} may be worth the subscription.`,
    client_setup: `This can flip if the user decides a dedicated desktop client is worth the setup cost because the local workflow now matters more. Then ${l} may be the better fit.`,
    general: `This can flip if the heavier mechanism on the losing side starts doing more real work than the simpler path currently does. Then ${l} may be worth the tradeoff.`,
  };
  const strengthCases = {
    team_collaboration: `This can flip if email belongs mostly to one person and shared thread coordination rarely matters. Then ${l} may fit better.`,
    sender_screening: `This can flip if the user prefers a more conventional inbox and is comfortable relying on filters after messages arrive. Then ${l} may feel easier.`,
    self_hosted: `This can flip if the user no longer wants to run or control mail infrastructure and would rather offload the whole environment to a hosted service. Then ${l} may make more sense.`,
    rules_automation: `This can flip if the inbox no longer needs complex rules, folder hierarchies, or multi-account automation and a simpler structure is enough. Then ${l} may be the better fit.`,
    power_customization: `This can flip if the user stops needing advanced controls and would rather have a simpler email surface than a highly tunable one. Then ${l} may be the better fit.`,
    general: `This can flip if the tradeoff on the losing side starts doing more real work than the mechanism that currently wins. Then ${l} may be worth the switch.`,
  };
  return sentence((context.orientation === "burden" ? burdenCases : strengthCases)[context.mode] || (context.orientation === "burden" ? burdenCases.general : strengthCases.general));
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const burdenRules = {
    ad_free: [`Choose ${w} if you want the inbox interface focused on messages instead of ads.`, `Choose ${l} if you can tolerate promotional clutter for other benefits.`, `Avoid ${l} when advertising is the exact source of inbox friction.`],
    free_access: [`Choose ${w} if email access should work before any subscription decision.`, `Choose ${l} if a paid inbox workflow is now worth the cost.`, `Avoid ${l} when recurring price is bigger than the email job itself.`],
    client_setup: [`Choose ${w} if you want useful email before installing and configuring a client.`, `Choose ${l} if the desktop client workflow is now worth the setup.`, `Avoid ${l} when configuration is the actual friction.`],
    general: [`Choose ${w} when the burden on the other side is the real source of friction.`, `Choose ${l} when that heavier model is now doing enough work to justify itself.`, `Avoid ${l} when extra setup or cost keeps arriving before useful email.`],
  };
  const strengthRules = {
    team_collaboration: [`Choose ${w} if several teammates need to work inside the same email thread.`, `Choose ${l} if inbox work is mostly personal rather than shared.`, `Avoid ${l} when coordination keeps leaking into forwarding or side chat.`],
    sender_screening: [`Choose ${w} if unknown senders should be decided before they hit the inbox.`, `Choose ${l} if you prefer traditional delivery and post-arrival filtering.`, `Avoid ${l} when inbox cleanup after delivery is the real drag.`],
    self_hosted: [`Choose ${w} if the email system must run inside infrastructure you control.`, `Choose ${l} if you want a hosted service instead of running mail infrastructure.`, `Avoid ${l} when deployment control is part of the requirement.`],
    rules_automation: [`Choose ${w} if the inbox needs deep folder rules and multi-account automation.`, `Choose ${l} if you want a simpler inbox structure with less system tuning.`, `Avoid ${l} when message volume has outgrown a lighter model.`],
    power_customization: [`Choose ${w} if you need extensions, plugins, advanced settings, or granular workflow control.`, `Choose ${l} if a simpler client is enough for normal inbox work.`, `Avoid ${l} when fixed controls are the main limit.`],
    general: [`Choose ${w} when the mechanism in the rule affects daily inbox use in practice.`, `Choose ${l} when its lighter tradeoff better matches the real email job.`, `Avoid ${l} once the same friction keeps repeating in setup and routine use.`],
  };
  return (context.orientation === "burden" ? burdenRules : strengthRules)[context.mode] || (context.orientation === "burden" ? burdenRules.general : strengthRules.general);
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const burdenFaqs = {
    ad_free: [
      { q: `Why does ${w} fit better here`, a: `${w} keeps the inbox focused on real messages instead of making the user work around ad panels and promotional placements.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when ad clutter is not the main dealbreaker and other parts of the service matter more.` },
      { q: `What usually makes ${l} the wrong fit`, a: `Advertising keeps competing with actual mail during normal inbox review.` },
      { q: `Is this only about aesthetics`, a: `No. It is also about scan speed and cognitive load.` },
    ],
    free_access: [
      { q: `Why can free access matter so much`, a: `Because it affects adoption cost, day-to-day access, and how easy it is to keep or drop the tool later.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when its premium workflow is doing enough work to justify the recurring price.` },
      { q: `What usually makes ${l} fail first`, a: `The user needs ordinary email access but does not want a subscription standing in front of it.` },
      { q: `Is this anti-premium software`, a: `No. It is about whether the paid layer matches the job.` },
    ],
    client_setup: [
      { q: `Why does client setup change the recommendation`, a: `Because it affects first use, routine maintenance, and how technical basic email feels before the inbox is even ready.` },
      { q: `When is ${l} still worth it`, a: `${l} is still worth it when the dedicated desktop workflow is now part of the value.` },
      { q: `What usually makes ${l} feel too heavy`, a: `Installation and account configuration arrive before the user can simply check mail.` },
      { q: `Is this only for beginners`, a: `No. Any user can lose time when setup is larger than the actual email job.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} wins because the other tool is the one introducing the burden named in the decision rule.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when that heavier mechanism is now doing enough work to justify itself.` },
      { q: `What usually signals it is time to switch`, a: `The added layer stops feeling like overhead and starts solving a real inbox problem.` },
      { q: `Is this only about simplicity`, a: `No. It is about which tool actually owns the burden described in the rule.` },
    ],
  };
  const strengthFaqs = {
    team_collaboration: [
      { q: `Why does ${w} matter beyond one feature`, a: `${w} changes who owns the reply, where internal discussion happens, and whether shared email can be handled inside the thread instead of around it.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when most email belongs to one person instead of a team queue.` },
      { q: `What usually makes ${l} fail first`, a: `The team keeps forwarding messages or coordinating replies outside the inbox because the thread itself is not collaborative enough.` },
      { q: `Is this only about support teams`, a: `No. It applies anywhere several people need to work inside the same conversation.` },
    ],
    sender_screening: [
      { q: `Why does sender screening matter so much here`, a: `Because it changes whether inbox simplicity comes from controlling entry before delivery or from cleaning things up after messages arrive.` },
      { q: `When is ${l} still better`, a: `${l} is still better when the user prefers a conventional inbox and is comfortable filtering after delivery.` },
      { q: `What usually pushes someone toward ${w}`, a: `Too much inbox energy keeps disappearing into cleanup that could have been prevented earlier.` },
      { q: `Is ${w} only for minimalists`, a: `Mostly for users who want stricter control over what reaches the inbox in the first place.` },
    ],
    self_hosted: [
      { q: `Why does self-hosting change the verdict`, a: `Because it affects deployment control, integration freedom, and whether the whole mail environment can run inside infrastructure the user manages.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the user would rather offload server operation to a hosted provider.` },
      { q: `What usually makes ${l} the wrong fit`, a: `The mail system has to live inside infrastructure under the user's own control.` },
      { q: `Is this only for admins`, a: `Mostly for people whose requirements include owning the environment rather than only using a mailbox.` },
    ],
    rules_automation: [
      { q: `Why do rules and folders matter so much here`, a: `Because they change how incoming mail is routed, how multiple accounts stay organized, and how much manual triage remains once inbox volume grows.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when the user wants a simpler inbox model instead of a deeply structured one.` },
      { q: `What usually makes ${l} fail first`, a: `Large inbox systems outgrow a lighter structure once formal routing and folder automation become necessary.` },
      { q: `Is ${w} only for enterprise users`, a: `Mostly for users whose inbox has become complex enough that rules and hierarchy are doing real work.` },
    ],
    power_customization: [
      { q: `Why does customization depth matter so much`, a: `Because it affects how precisely the inbox can be tuned, extended, and adapted once the default workflow stops being enough.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when a simpler client is enough and advanced tuning would mostly go unused.` },
      { q: `What usually makes ${l} fail first`, a: `The user needs more control over shortcuts, filters, add-ons, or local settings than the tool can provide.` },
      { q: `Is ${w} harder to use`, a: `Often yes, because deeper control usually comes with more setup and maintenance.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} turns the mechanism in the decision rule into gains across setup, daily use, and longer-term inbox management instead of only one narrow feature win.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when its tradeoff better matches the actual email workflow.` },
      { q: `What usually signals it is time to switch`, a: `The same friction starts repeating in normal inbox use instead of only appearing in edge cases.` },
      { q: `Is this only about simplicity`, a: `No. It is about where the real operating cost of the inbox lands.` },
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
  const allowed = new Set(["persona_fit", "x_wins", "y_wins", "failure_modes", "edge_case", "quick_rules"]);
  const sections = (doc.sections || []).filter((section) => allowed.has(section.type)).map((section) => {
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
    if (doc.categorySlug !== "email-inbox-tools") continue;
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
  const reportLines = ["# Email / Inbox Tools Second Pass Report", "", `Date: ${new Date().toISOString()}`, "", `- Pages scanned: ${totalScanned}`, `- Pages expanded: ${changed.length}`, `- Sections rewritten: ${changed.reduce((sum, page) => sum + page.sections.length, 0)}`, `- Pages skipped: ${skipped.length}`, "", "## Expanded Pages", "", ...changed.flatMap((page) => [`- File path: ${page.filePath}`, `  Title: ${page.title}`, `  Sections rewritten: ${page.sections.join(", ")}`]), "", "## Skipped Pages", "", ...(skipped.length ? skipped.map((file) => `- ${file}`) : ["- None"]), ""];
  fs.writeFileSync(REPORT_PATH, `${reportLines.join("\n")}\n`);
  console.log(JSON.stringify({ reportPath: REPORT_PATH, pagesScanned: totalScanned, pagesExpanded: changed.length, sectionsRewritten: changed.reduce((sum, page) => sum + page.sections.length, 0), pagesSkipped: skipped.length }, null, 2));
}

main();
