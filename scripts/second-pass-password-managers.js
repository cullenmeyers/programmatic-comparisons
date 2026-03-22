/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "password-managers-second-pass-report.md");

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
  if (/self-hosted server|deploying a self-hosted server|deployed on a self-hosted server|full administrative control/.test(value)) return "infrastructure_control";
  if (/vendor-hosted vault|hosted account|vendor cloud service|local encrypted database|locally controlled database|portable encrypted database file/.test(value)) return "local_control";
  if (/manually managing vault files|manually creating and managing a vault file|manually copying|manually syncing|manual cloud storage|autofill|browser autofill|command-line workflows|external cloud storage/.test(value)) return "daily_convenience";
  if (/regenerating passwords from inputs instead of retrieving|retrieving them from an automatically saved vault entry/.test(value)) return "saved_vault";
  if (/stored vault database rather than generating|deterministically on demand|deterministic password generation/.test(value)) return "generated_passwords";
  if (/recovery options|permanently locks|master password.*recovery/.test(value)) return "recovery_safety";
  if (/shared vault workspace|assigning permissions|sharing credentials/.test(value)) return "team_sharing";
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
    mode: detectMode(rule),
  };
}

function winnerBullets(context) {
  const w = context.winnerName;
  const sets = {
    infrastructure_control: [
      { point: `${w} puts the password server inside infrastructure you control`, why_it_matters: `That changes the trust boundary at setup time instead of forcing the vault into a vendor-managed environment.` },
      { point: `${w} gives administrators more direct control over daily operations`, why_it_matters: `Integrations, policies, and access flow can be tied to internal systems instead of waiting on an external service model.` },
      { point: `${w} makes long-term security and backup policy more adaptable`, why_it_matters: `Power users can shape where data lives and how it is recovered as the environment grows.` },
    ],
    local_control: [
      { point: `${w} keeps the vault under local or user-chosen control`, why_it_matters: `Passwords are not forced into a vendor-hosted account model before the user has decided they want that tradeoff.` },
      { point: `${w} reduces dependency on a provider account during daily use`, why_it_matters: `The password workflow stays closer to the device or storage path the user already trusts.` },
      { point: `${w} leaves more room to shape backup and storage choices`, why_it_matters: `That matters when portability and control are part of the reason for choosing the tool.` },
    ],
    daily_convenience: [
      { point: `${w} shortens the path from opening a site to logging in`, why_it_matters: `Automatic sync and autofill remove the extra steps that slow sign-ins across devices and browsers.` },
      { point: `${w} keeps daily password use more predictable`, why_it_matters: `The user does not have to remember file locations, sync routines, or separate retrieval workflows just to access an account.` },
      { point: `${w} lowers the maintenance burden around the vault`, why_it_matters: `The system stays usable without constant copying, storage setup, or manual credential handling.` },
    ],
    generated_passwords: [
      { point: `${w} removes the need to maintain a stored vault database`, why_it_matters: `That changes setup because the user is not also taking on storage, backup, and sync responsibilities.` },
      { point: `${w} keeps the password model lighter for simple use`, why_it_matters: `Daily access depends on a repeatable generation method rather than managing saved entries.` },
      { point: `${w} reduces the footprint of stored credential collections`, why_it_matters: `That matters when the user specifically wants fewer vault objects to maintain over time.` },
    ],
    saved_vault: [
      { point: `${w} turns logins into retrieval instead of reconstruction`, why_it_matters: `Saved entries and autofill remove the need to rebuild passwords from site inputs every time.` },
      { point: `${w} keeps everyday sign-ins more familiar`, why_it_matters: `The workflow matches what most users expect from a password manager across browsers and devices.` },
      { point: `${w} stores more context with each credential`, why_it_matters: `Notes, usernames, and updated entries can live with the login instead of being recreated from memory.` },
    ],
    recovery_safety: [
      { point: `${w} gives the user a recovery path before lockout becomes catastrophic`, why_it_matters: `The tool does not make one forgotten secret the end of the entire credential archive.` },
      { point: `${w} keeps account loss less disruptive in daily life`, why_it_matters: `Recovery and restore options matter when the user is more afraid of being locked out than of carrying a hosted account.` },
      { point: `${w} lowers the long-term risk of irreversible mistakes`, why_it_matters: `That makes the password manager easier to trust for someone who worries about doing something they cannot undo.` },
    ],
    team_sharing: [
      { point: `${w} makes credential sharing native instead of improvised`, why_it_matters: `Permissions and shared vault access can be managed inside the system rather than by passing encrypted files around.` },
      { point: `${w} keeps day-to-day access changes faster`, why_it_matters: `Teams can add, remove, or limit access without redistributing the whole vault.` },
      { point: `${w} gives the organization a cleaner admin model`, why_it_matters: `That matters when password sharing needs to scale beyond a handful of manual handoffs.` },
    ],
    general: [
      { point: `${w} handles the winning mechanism more directly`, why_it_matters: `The user spends less time compensating for the exact friction named in the decision rule.` },
      { point: `${w} keeps daily password use smoother`, why_it_matters: `The practical workflow stays shorter and easier to repeat.` },
      { point: `${w} reduces the hidden cost of managing credentials over time`, why_it_matters: `That matters when the password manager is supposed to remove friction, not create a second system to babysit.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function loserBullets(context) {
  const l = context.loserName;
  const sets = {
    infrastructure_control: [
      { point: `${l} can still be better for teams that do not want to run password infrastructure`, why_it_matters: `A hosted model can remove server work when admin control is not the main requirement.` },
      { point: `${l} often feels lighter for routine rollout`, why_it_matters: `The user can start faster when deployment and upgrades are handled by the vendor.` },
      { point: `${l} reduces operational upkeep outside the vault itself`, why_it_matters: `That tradeoff can be worth it when convenience matters more than self-hosting.` },
    ],
    local_control: [
      { point: `${l} can still be easier when automatic sync matters more than storage sovereignty`, why_it_matters: `A vendor account can reduce setup and daily handling for users who do not want to manage location or backup strategy.` },
      { point: `${l} often gives a smoother login experience out of the box`, why_it_matters: `Hosted accounts usually pair naturally with browser extensions and cross-device access.` },
      { point: `${l} asks for less manual thinking about where the vault lives`, why_it_matters: `That can be the better tradeoff when convenience beats local control.` },
    ],
    daily_convenience: [
      { point: `${l} can still appeal to users who want tighter local control`, why_it_matters: `Manual files, offline storage, or custom sync paths may be worth the extra steps for people who care more about control than speed.` },
      { point: `${l} can fit workflows that avoid hosted accounts`, why_it_matters: `The extra friction is less painful when the user intentionally wants a more self-managed setup.` },
      { point: `${l} leaves more room for custom storage choices`, why_it_matters: `That matters when flexibility of location matters more than instant autofill everywhere.` },
    ],
    generated_passwords: [
      { point: `${l} can still be better when the user wants passwords saved and recalled automatically`, why_it_matters: `Stored vault entries support fast sign-in without reconstructing inputs each time.` },
      { point: `${l} keeps day-to-day login behavior more familiar`, why_it_matters: `Browser autofill and saved entries are easier for most users to repeat reliably.` },
      { point: `${l} supports more conventional account maintenance`, why_it_matters: `That matters when password updates, notes, and login metadata need to live with the credential.` },
    ],
    saved_vault: [
      { point: `${l} can still be better when the user wants to avoid a stored vault database entirely`, why_it_matters: `A generated model removes storage and sync responsibilities for people who specifically dislike maintaining a vault.` },
      { point: `${l} reduces the amount of saved credential material`, why_it_matters: `That can appeal when the user prefers deriving passwords over storing a larger database.` },
      { point: `${l} can travel more lightly between environments`, why_it_matters: `The tradeoff may be worth it when portability of the model matters more than familiar autofill behavior.` },
    ],
    recovery_safety: [
      { point: `${l} can still be better when full local control matters more than recovery`, why_it_matters: `Some users accept the lockout risk because they do not want the vault tied to an account system.` },
      { point: `${l} works without depending on hosted recovery flows`, why_it_matters: `That can matter if the user prefers an entirely self-managed security model.` },
      { point: `${l} gives more direct ownership of the encrypted vault file`, why_it_matters: `The tradeoff is harsher, but some users still prefer it.` },
    ],
    team_sharing: [
      { point: `${l} can still be simpler for purely personal vaults`, why_it_matters: `Manual file handling is less of a problem when sharing and role changes rarely happen.` },
      { point: `${l} avoids a larger admin layer for small setups`, why_it_matters: `That may be fine when the team model would mostly sit unused.` },
      { point: `${l} leaves storage and transfer fully in the user's hands`, why_it_matters: `Some users still prefer that even though it scales worse for collaboration.` },
    ],
    general: [
      { point: `${l} can still win in a narrower workflow`, why_it_matters: `The losing tool may be better when the deeper or smoother mechanism is not doing much real work yet.` },
      { point: `${l} often asks for a different tradeoff rather than offering nothing`, why_it_matters: `That matters when the user values control and convenience differently than this verdict assumes.` },
      { point: `${l} can be the better fit when complexity is intentional`, why_it_matters: `The friction is only a dealbreaker when it gets in the way of the job this persona actually has.` },
    ],
  };
  return sets[context.mode] || sets.general;
}

function buildPersonaFit(context) {
  const w = context.winnerName;
  const p = context.personaNoun;
  const content = {
    infrastructure_control: `${w} fits this ${p} because the same infrastructure choice affects several layers at once. It changes where the vault is deployed, how daily admin work connects to internal systems, and how much long-term control the user keeps over backups and policy. The real issue is not one hosting checkbox but who owns the operating environment.`,
    local_control: `${w} fits this ${p} because storage control changes more than where the encrypted vault sits. It affects whether the user needs a provider account, how much trust they place in a hosted service during daily use, and how flexibly they can shape backup and portability decisions later. ${w} wins by keeping that control closer to the user.`,
    daily_convenience: `${w} fits this ${p} because the same convenience mechanism shows up all day long. It changes how fast logins happen, how often the user has to think about sync or retrieval steps, and how much vault maintenance leaks into normal work. ${w} wins by keeping password use closer to the moment of login.`,
    generated_passwords: `${w} fits this ${p} because the core tradeoff is between a maintained vault and a generated credential model. That choice affects setup burden, how daily logins are repeated, and whether the user is managing stored password collections or deriving them on demand. ${w} wins by matching the lighter model this rule favors.`,
    saved_vault: `${w} fits this ${p} because the core issue is whether passwords are reconstructed or simply retrieved. That changes the first-time setup, how familiar daily sign-ins feel, and how much credential context can stay attached to each account over time. ${w} wins by keeping login behavior closer to saved entries and autofill.`,
    recovery_safety: `${w} fits this ${p} because recovery risk is not only an edge case. It affects how safe the vault feels on day one, how much anxiety surrounds the master password in daily use, and what happens when a normal human mistake becomes irreversible. ${w} wins by making lockout less final.`,
    team_sharing: `${w} fits this ${p} because shared access changes setup, daily operations, and admin overhead together. It affects how credentials are handed off, how permissions change over time, and whether collaboration feels native or improvised. ${w} wins by making sharing a system capability instead of a manual workaround.`,
    general: `${w} fits this ${p} because the winning mechanism reduces friction across setup, daily password use, and long-term vault management instead of solving only one narrow problem.`,
  };
  return sentence(content[context.mode] || content.general);
}

function buildFailureModes(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const items = {
    infrastructure_control: [
      { tool: context.winnerSide, fails_when: `${w} becomes too heavy when the user wants passwords to work immediately and has no reason to run password infrastructure themselves.`, what_to_do_instead: `Choose ${l} if a hosted service is the better operational tradeoff.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when policy, deployment location, or system integration must stay under internal administrative control.`, what_to_do_instead: `Choose ${w} when self-hosted control is a real requirement.` },
    ],
    local_control: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user would rather offload storage and sync decisions to a hosted account model.`, what_to_do_instead: `Choose ${l} if convenience now matters more than vault ownership.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the user does not want credentials forced into a vendor-hosted account or cloud vault.`, what_to_do_instead: `Choose ${w} when local control is the non-negotiable boundary.` },
    ],
    daily_convenience: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user intentionally wants a more self-managed vault even if that costs time at login.`, what_to_do_instead: `Choose ${l} if local control matters more than speed.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when manual files, sync steps, or non-autofill workflows keep showing up during ordinary sign-ins.`, what_to_do_instead: `Choose ${w} when fast retrieval and lower maintenance matter more.` },
    ],
    generated_passwords: [
      { tool: context.winnerSide, fails_when: `${w} becomes limiting when the user really wants saved entries, richer login metadata, and familiar autofill behavior.`, what_to_do_instead: `Choose ${l} if a stored vault now matches daily use better.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when maintaining a stored vault database is exactly the burden the user wants to avoid.`, what_to_do_instead: `Choose ${w} when generated credentials are the cleaner model.` },
    ],
    saved_vault: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user specifically wants to avoid storing a vault database and is comfortable generating passwords from a repeatable formula instead.`, what_to_do_instead: `Choose ${l} if a generated model is the actual goal.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when daily sign-ins keep depending on reconstructing inputs instead of retrieving a saved login entry.`, what_to_do_instead: `Choose ${w} when saved credentials and autofill matter more.` },
    ],
    recovery_safety: [
      { tool: context.winnerSide, fails_when: `${w} becomes the wrong fit when the user rejects hosted recovery paths and prefers full local custody even with harsher lockout risk.`, what_to_do_instead: `Choose ${l} if absolute local control is worth the tradeoff.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when one forgotten master password can permanently end access to the entire vault.`, what_to_do_instead: `Choose ${w} when recoverability matters more than a purely self-managed model.` },
    ],
    team_sharing: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when credential sharing is rare and a full permission model would mostly sit unused.`, what_to_do_instead: `Choose ${l} if the vault is basically personal or static.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when access changes require manually redistributing files instead of updating shared permissions inside the system.`, what_to_do_instead: `Choose ${w} when collaboration is part of normal password management.` },
    ],
    general: [
      { tool: context.winnerSide, fails_when: `${w} becomes heavier than necessary when the winning mechanism is not doing enough real work yet.`, what_to_do_instead: `Choose ${l} if the simpler tradeoff still fits.` },
      { tool: context.loserSide, fails_when: `${l} breaks down when the exact friction named in the rule keeps recurring during normal password use.`, what_to_do_instead: `Choose ${w} once that mechanism matters daily.` },
    ],
  };
  return items[context.mode] || items.general;
}

function buildEdgeCase(context) {
  const l = context.loserName;
  const cases = {
    infrastructure_control: `This can flip if the user no longer needs administrative control over deployment and would rather offload hosting and upgrades entirely. Then ${l} may be the better fit.`,
    local_control: `This can flip if the user decides automatic hosted sync is worth more than direct control over vault location and storage choices. Then ${l} may make more sense.`,
    daily_convenience: `This can flip if the user is willing to accept slower sign-ins in exchange for a more self-managed or local-first vault model. Then ${l} may be worth it.`,
    generated_passwords: `This can flip if the user decides saved entries and conventional autofill are more important than avoiding a stored vault database. Then ${l} may be the better choice.`,
    saved_vault: `This can flip if the user decides avoiding a stored vault database matters more than familiar saved-entry behavior. Then ${l} may be the better choice.`,
    recovery_safety: `This can flip if the user is comfortable accepting permanent lockout risk in exchange for a more fully self-managed vault. Then ${l} may fit better.`,
    team_sharing: `This can flip if the password workflow stays personal enough that a full shared-vault permission model never really pays back. Then ${l} may be sufficient.`,
    general: `This can flip if the tradeoff on the losing side starts doing more real work than the mechanism that currently wins. Then ${l} may be worth the switch.`,
  };
  return sentence(cases[context.mode] || cases.general);
}

function buildQuickRules(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const rules = {
    infrastructure_control: [
      `Choose ${w} if the password system must run inside infrastructure you control.`,
      `Choose ${l} if a hosted service is preferable to running password servers yourself.`,
      `Avoid ${l} when deployment location and admin control are part of the requirement.`,
    ],
    local_control: [
      `Choose ${w} if vault ownership matters more than hosted convenience.`,
      `Choose ${l} if you want sync and account management handled for you.`,
      `Avoid ${l} when provider-controlled vault storage is the exact dealbreaker.`,
    ],
    daily_convenience: [
      `Choose ${w} if passwords need to sync and autofill with fewer manual steps.`,
      `Choose ${l} if you are willing to trade speed for more local control.`,
      `Avoid ${l} when vault-file handling or manual retrieval keeps slowing sign-ins.`,
    ],
    generated_passwords: [
      `Choose ${w} if you want to avoid maintaining a stored vault database.`,
      `Choose ${l} if saved entries and familiar autofill matter more than a lighter model.`,
      `Avoid ${l} when vault maintenance is the problem you are trying to remove.`,
    ],
    saved_vault: [
      `Choose ${w} if passwords should be saved and retrieved instead of regenerated.`,
      `Choose ${l} if avoiding a stored vault matters more than familiar autofill behavior.`,
      `Avoid ${l} when reconstructing credentials keeps slowing or confusing sign-ins.`,
    ],
    recovery_safety: [
      `Choose ${w} if recovery options matter more than absolute local custody.`,
      `Choose ${l} if you accept harsher lockout risk for a fully self-managed vault.`,
      `Avoid ${l} when one forgotten master password cannot be an irreversible failure.`,
    ],
    team_sharing: [
      `Choose ${w} if credential sharing and permissions change often.`,
      `Choose ${l} if the vault is mostly personal and does not need a team admin layer.`,
      `Avoid ${l} when access changes require manual file handoffs.`,
    ],
    general: [
      `Choose ${w} when the winning mechanism is already affecting daily password use.`,
      `Choose ${l} when its tradeoff still better matches the job you actually have.`,
      `Avoid ${l} once the same friction keeps showing up in setup and routine use.`,
    ],
  };
  return rules[context.mode] || rules.general;
}

function buildFaqs(context) {
  const w = context.winnerName;
  const l = context.loserName;
  const faqs = {
    infrastructure_control: [
      { q: `Why does ${w} win on more than hosting`, a: `${w} also changes how the vault integrates with internal systems, how backups are handled, and how much administrative control the user keeps over the whole environment.` },
      { q: `When is ${l} still the better choice`, a: `${l} is still the better choice when the user wants a hosted password manager that works without running server infrastructure.` },
      { q: `What usually makes ${l} fail first`, a: `The need for deployment control and internal integration becomes real rather than theoretical.` },
      { q: `Is this only for large teams`, a: `No. Even a solo power user can care about where the password server runs and who controls it.` },
    ],
    local_control: [
      { q: `Why does local control matter so much here`, a: `Because it affects trust boundary, daily dependence on a provider account, and how flexibly the vault can be backed up or moved later.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when automatic hosted sync is more valuable than storage sovereignty.` },
      { q: `What usually makes ${l} the wrong fit`, a: `The user does not want the vault tied to a vendor-hosted account or cloud model in the first place.` },
      { q: `Does ${w} always mean more work`, a: `Often some, but that tradeoff can be the point when local control is the priority.` },
    ],
    daily_convenience: [
      { q: `Why does convenience change the verdict so much`, a: `Because the same sync and autofill mechanism affects login speed, device switching, and how much vault maintenance leaks into normal work.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when the user intentionally prefers a more self-managed or local-first model.` },
      { q: `What usually makes ${l} feel too heavy`, a: `Manual files, sync steps, or slower retrieval keep showing up in ordinary sign-ins.` },
      { q: `Is this only about speed`, a: `No. It is also about reducing repeated maintenance and friction.` },
    ],
    generated_passwords: [
      { q: `Why would someone prefer ${w}`, a: `${w} fits users who want to avoid maintaining a stored vault database and prefer a lighter generation model instead.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still better when saved entries, autofill, and richer login records matter more than avoiding vault storage.` },
      { q: `What usually pushes users away from ${l}`, a: `Maintaining a stored vault becomes the very burden they were trying to escape.` },
      { q: `Is ${w} easier for everyone`, a: `No. It is better only for users who specifically prefer deterministic generation over a conventional vault.` },
    ],
    saved_vault: [
      { q: `Why does ${w} fit better for everyday sign-ins`, a: `${w} saves and retrieves credentials directly, which is easier to repeat than rebuilding passwords from remembered inputs each time.` },
      { q: `When is ${l} still the better fit`, a: `${l} is still the better fit when the user specifically wants to avoid maintaining any stored vault database.` },
      { q: `What usually makes ${l} fail first`, a: `The user expects a conventional password manager that remembers and fills logins instead of regenerating them.` },
      { q: `Is ${w} only about convenience`, a: `No. It also keeps more login context attached to each credential over time.` },
    ],
    recovery_safety: [
      { q: `Why is recovery such a big deal for this persona`, a: `Because the fear is not only security but permanent lockout from all saved credentials after one forgotten password.` },
      { q: `When is ${l} still worth choosing`, a: `${l} is still worth choosing when full local custody matters more than recoverability.` },
      { q: `What usually makes ${l} fail first`, a: `The user cannot accept a model where one mistake can permanently close the vault.` },
      { q: `Does ${w} trade away control`, a: `Usually some, but that tradeoff can be worth it for people who need a recovery path.` },
    ],
    team_sharing: [
      { q: `Why does sharing method change the recommendation`, a: `Because it affects how access is granted, changed, and audited instead of treating password sharing as a manual file problem.` },
      { q: `When is ${l} still enough`, a: `${l} is still enough when the vault is mostly personal and sharing needs are rare.` },
      { q: `What usually makes ${l} break down`, a: `Credential access changes often enough that redistributing files becomes messy and slow.` },
      { q: `Is ${w} only for large organizations`, a: `No. Any team that changes access regularly can benefit from a native sharing model.` },
    ],
    general: [
      { q: `Why does ${w} fit the rule better`, a: `${w} turns the mechanism in the decision rule into gains across setup, daily use, and long-term vault management instead of only one isolated feature.` },
      { q: `When is ${l} still reasonable`, a: `${l} is still reasonable when its tradeoff better matches the real password workflow.` },
      { q: `What usually signals it is time to switch`, a: `The same friction starts appearing during ordinary sign-ins and vault maintenance instead of only in edge cases.` },
      { q: `Is this verdict only about simplicity`, a: `No. It is about where the ongoing operating cost of the password manager really lands.` },
    ],
  };
  return (faqs[context.mode] || faqs.general).map((item) => ({
    q: sentence(item.q).slice(0, -1) + "?",
    a: sentence(item.a),
  }));
}

function bulletBucket(text) {
  return /setup|deploy|install|create|hosted account|server|cloud storage|backup/i.test(text) ? "setup"
    : /daily|login|autofill|browser|device|retrieve|sign-in|routine/i.test(text) ? "workflow"
      : /server|vault|database file|storage|backup|permission|recovery|policy|self-host/i.test(text) ? "structure"
        : /trust|control|risk|lockout|anxiety|hosted|local|admin/i.test(text) ? "cognitive"
          : /sync|share|permissions|integrat|cross-device/i.test(text) ? "integration"
            : "general";
}

function repeatedPage(doc) {
  const persona = (doc.sections || []).find((section) => section.type === "persona_fit")?.content || "";
  const xBullets = ((doc.sections || []).find((section) => section.type === "x_wins")?.bullets) || [];
  const yBullets = ((doc.sections || []).find((section) => section.type === "y_wins")?.bullets) || [];
  const xBuckets = new Set(xBullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
  const yBuckets = new Set(yBullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
  return xBuckets.size < 3 || yBuckets.size < 3 || /the user wants|this design allows|this removes the need|that safety net/i.test(persona);
}

function shouldRewriteSection(doc, section) {
  const mode = detectMode(doc.verdict?.decision_rule || "");
  if (section.type === "persona_fit") return ["saved_vault", "generated_passwords"].includes(mode) || /the user wants|this design allows|this removes the need|that safety net/i.test(section.content || "") || repeatedPage(doc);
  if (section.type === "x_wins" || section.type === "y_wins") {
    const bullets = section.bullets || [];
    const buckets = new Set(bullets.map((bullet) => bulletBucket(`${bullet.point} ${bullet.why_it_matters}`)));
    return ["saved_vault", "generated_passwords"].includes(mode) || buckets.size < 3 || bullets.some((bullet) => /instead of|can be|allows|provides|stored vault database|regenerating|deterministic/i.test(`${bullet.point} ${bullet.why_it_matters}`));
  }
  if (section.type === "failure_modes") return ["saved_vault", "generated_passwords"].includes(mode) || repeatedPage(doc);
  if (section.type === "edge_case") return ["saved_vault", "generated_passwords"].includes(mode) || repeatedPage(doc);
  if (section.type === "quick_rules") return ["saved_vault", "generated_passwords"].includes(mode) || repeatedPage(doc) || (section.rules || []).some((rule) => /Pick .* if you want|Pick .* if you need/.test(rule));
  return false;
}

function shouldRewriteFaqs(doc) {
  const faqs = doc.faqs || [];
  const mode = detectMode(doc.verdict?.decision_rule || "");
  return ["saved_vault", "generated_passwords"].includes(mode) || faqs.length !== 4 || faqs.some((item) => /Why is .* easier|Can .* be self hosted|Who should choose .* instead/.test(`${item.q} ${item.a}`)) || repeatedPage(doc);
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
      const bullets = context.winnerSide === "x" ? winnerBullets(context) : loserBullets(context);
      rewrittenSections.push("x_wins");
      return { ...section, heading: `Where ${context.xName} wins`, bullets };
    }
    if (section.type === "y_wins" && shouldRewriteSection(doc, section)) {
      const bullets = context.winnerSide === "y" ? winnerBullets(context) : loserBullets(context);
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
    if (doc.categorySlug !== "password-managers") continue;
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
    "# Password Managers Second Pass Report",
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
