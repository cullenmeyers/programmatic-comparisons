const fs = require("fs");
const path = require("path");

const PAGES_DIR = path.join(process.cwd(), "content", "pages");
const TARGET_MIN = 155;
const TARGET_MAX = 160;
const TARGET_IDEAL = 158;

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

function trimPunctuation(text) {
  return cleanText(text).replace(/[.?!;:,]+$/g, "").trim();
}

function splitWords(text) {
  return cleanText(text).split(" ").filter(Boolean);
}

function personaLabel(persona) {
  const map = {
    Beginner: "beginners",
    "Solo user": "solo users",
    Student: "students",
    "Busy professional": "busy professionals",
    "Power user": "power users",
    "Non-technical user": "nontechnical users",
    Minimalist: "minimalists",
  };
  return map[String(persona || "").trim()] || String(persona || "").trim().toLowerCase();
}

function extractPair(title) {
  const match = String(title || "")
    .trim()
    .match(/^(.*?)\s+vs\s+(.*?)\s+for\s+(.+)$/i);
  return match ? { xName: match[1].trim(), yName: match[2].trim() } : { xName: "", yName: "" };
}

function displayName(name) {
  return trimPunctuation(String(name || "").replace(/\s*\([^)]*\)/g, ""));
}

function getLosingSection(doc) {
  const loserSymbol = doc.verdict?.winner === "x" ? "y" : "x";
  return (doc.sections || [])
    .find((section) => section.type === "failure_modes")
    ?.items?.find((item) => item.tool === loserSymbol);
}

function compressText(text, maxWords) {
  return trimPunctuation(splitWords(text).slice(0, maxWords).join(" "))
    .replace(/\b(a|an|the|and|or|but|to|for|of|with|before|after)$/i, "")
    .trim();
}

function buildSituationOptions(doc) {
  const mapped = {
    "Avoid errors": ["you want fewer mistakes", "you need fewer mistakes"],
    "Easy to quit later": ["you might switch again soon", "you want something easy to leave"],
    "Easy to switch": ["you may need to switch later", "you want switching to stay easy"],
    "Fast to use daily": ["you need less daily friction", "you need faster daily use"],
    "Feels safe": ["you need to trust the setup", "you need it to feel safe"],
    "Focus on what matters": ["you want fewer distractions", "you need less distraction"],
    "Full control and flexibility": ["you want more control", "you need more flexibility"],
    "Grows with you": ["you expect the setup to grow", "you need room to grow"],
    "Handle complex workflows": ["your workflow is complex", "you need complex workflow support"],
    "Handle scale": ["the workload has to scale", "you need it to handle scale"],
    "Hard to mess up": ["you need something hard to mess up", "you want fewer setup mistakes"],
    "Keep it running": ["you cannot babysit the setup", "you want it easy to maintain"],
    "Keep it simple": ["you want it simple", "you want one clear workflow"],
    "Keeps it simple": ["you want it simple", "you want one clear workflow"],
    "Keep things moving": ["work cannot stall", "you need work to keep moving"],
    "Move fast": ["you need to move fast", "speed matters right away"],
    "Publish fast": ["you need to publish fast", "speed matters right away"],
    "Runs itself": ["you want it to run itself", "you want less manual upkeep"],
    "Safe to use": ["you need it to feel safe", "you need more confidence"],
    "Start fast": ["you need a fast start", "you need to start quickly"],
    "Use and move on": ["you want to use it and move on", "you do not want long-term setup"],
    "Works without upkeep": ["you want less upkeep", "you cannot keep tuning the setup"],
  };

  const uiName = String(doc.constraintUiName || "").trim();
  const lens = trimPunctuation(doc.constraint_lens || "");
  const lensBase = lens
    .replace(/^You\s+/i, "you ")
    .replace(/^This person\s+/i, "you ")
    .replace(/^Beginners?\s+/i, "you ")
    .replace(/^Students?\s+/i, "you ")
    .replace(/^Busy professionals?\s+/i, "you ")
    .replace(/^Power users?\s+/i, "you ")
    .replace(/^Solo users?\s+/i, "you ")
    .replace(/^Minimalists?\s+/i, "you ")
    .replace(/^Nontechnical users?\s+/i, "you ");
  const options = new Set(mapped[uiName] || []);
  options.add(compressText(lensBase, 10));
  options.add(compressText(lensBase, 9));
  options.add(compressText(lensBase, 8));
  options.add(compressText(lensBase, 7));
  return [...options].filter(Boolean);
}

function normalizeMechanism(text) {
  let value = trimPunctuation(text)
    .replace(/^if\s+/i, "")
    .replace(/\bthe user\b/gi, "you")
    .replace(/\binstead of\b/gi, "before")
    .replace(/\s+/g, " ")
    .trim();

  const requiresMatch = value.match(/^(.+?)\s+requires\s+(.+)$/i);
  if (requiresMatch) {
    value = `it requires ${trimPunctuation(requiresMatch[2])} before ${trimPunctuation(requiresMatch[1])}`;
  } else if (!/^it\s+/i.test(value)) {
    value = `it breaks when ${value}`;
  }

  value = value
    .replace(/\bmay require\b/gi, "requires")
    .replace(/\badds complexity\b/gi, "breaks when complexity piles up")
    .replace(/\bcan slow you down\b/gi, "fails when speed matters")
    .replace(/\bbecome indistinguishable\b/gi, "blur together")
    .replace(/\bautomatic cloud syncing and autofill\b/gi, "cloud sync and autofill")
    .replace(/\bappear as the default writing model\b/gi, "show up by default")
    .replace(/\bmust be configured before use\b/gi, "must be set up first")
    .replace(/\bnavigating workforce scheduling and compliance workflows\b/gi, "workforce scheduling comes before tracking time")
    .replace(/\brelying on a vendor-hosted vault before deploying\b/gi, "a vendor-hosted vault comes before self-hosting")
    .replace(/\bopen-ended community-style channels\b/gi, "community-style channels")
    .replace(/\bautomated optimization adds unnecessary background activity\b/gi, "automation adds background activity")
    .replace(/\bmultiple views and configuration panels add extra decisions\b/gi, "multiple views force extra decisions")
    .replace(/\s+/g, " ")
    .trim();

  return value;
}

function mechanismOptions(mechanism) {
  const options = new Set([mechanism]);

  const requiresMatch = mechanism.match(/^it requires\s+(.+)$/i);
  if (requiresMatch) {
    const tail = trimPunctuation(requiresMatch[1]);
    options.add(`it requires ${compressText(tail, 8)}`);
    options.add(`it requires ${compressText(tail, 7)}`);
    options.add(`it requires ${compressText(tail, 6)}`);
    options.add(`it requires ${compressText(tail, 5)}`);
    options.add(compressText(tail, 8));
    options.add(compressText(tail, 7));
  }

  const breaksMatch = mechanism.match(/^it breaks when\s+(.+)$/i);
  if (breaksMatch) {
    const tail = trimPunctuation(breaksMatch[1]);
    options.add(`it breaks when ${compressText(tail, 9)}`);
    options.add(`it breaks when ${compressText(tail, 8)}`);
    options.add(`it breaks when ${compressText(tail, 7)}`);
    options.add(`it breaks when ${compressText(tail, 6)}`);
    options.add(compressText(tail, 9));
    options.add(compressText(tail, 8));
    options.add(compressText(tail, 7));
  }

  const filtered = [...options].filter((option) => option && option.length >= 28);
  return filtered.length ? filtered : [mechanism];
}

function extractMechanism(doc) {
  const decisionRule = cleanText(doc?.verdict?.decision_rule || "");
  const match = decisionRule.match(/^If\s+(.+?),\s+(.+?)\s+fails first[.!?]?$/i);
  if (match) return normalizeMechanism(match[1]);

  const loser = getLosingSection(doc);
  const fallback = cleanText(loser?.fails_when || "");
  const whenMatch = fallback.match(/\bwhen\s+(.+?)[.?!]?$/i);
  return normalizeMechanism(whenMatch ? whenMatch[1] : fallback);
}

function buildSummary(doc) {
  const persona = personaLabel(doc.persona);
  const mapped = {
    "Avoid errors": "Best for " + persona + " who want fewer mistakes.",
    "Easy to quit later": "Best for " + persona + " who may switch again soon.",
    "Easy to switch": "Best for " + persona + " who need switching to stay easy.",
    "Fast to use daily": "Best for " + persona + " who need faster daily use.",
    "Feels safe": "Best for " + persona + " who need a safer-feeling setup.",
    "Focus on what matters": "Best for " + persona + " who want fewer distractions.",
    "Full control and flexibility": "Best for " + persona + " who want more control.",
    "Grows with you": "Best for " + persona + " who need room to grow.",
    "Handle complex workflows": "Best for " + persona + " who run complex workflows.",
    "Handle scale": "Best for " + persona + " who need the setup to scale.",
    "Hard to mess up": "Best for " + persona + " who want fewer setup mistakes.",
    "Keep it running": "Best for " + persona + " who cannot babysit the setup.",
    "Keep it simple": "Best for " + persona + " who want one clear workflow.",
    "Keeps it simple": "Best for " + persona + " who want one clear workflow.",
    "Keep things moving": "Best for " + persona + " who cannot let work stall.",
    "Move fast": "Best for " + persona + " who need speed right away.",
    "Publish fast": "Best for " + persona + " who need to publish fast.",
    "Runs itself": "Best for " + persona + " who want less manual upkeep.",
    "Safe to use": "Best for " + persona + " who need more confidence.",
    "Start fast": "Best for " + persona + " who need a fast start.",
    "Use and move on": "Best for " + persona + " who want to use it and move on.",
    "Works without upkeep": "Best for " + persona + " who want less upkeep.",
  };

  return cleanText(mapped[String(doc.constraintUiName || "").trim()] || `Best for ${persona} who need this to work with less friction.`);
}

function buildReason(loser, mechanism) {
  return cleanText(`${loser} fails first because ${mechanism.replace(/^it\s+/i, "it ")}.`);
}

function buildMetaDescription(winner, loser, situations, mechanism) {
  const candidates = [];
  const mechanismChoices = mechanismOptions(mechanism);
  const seeWhyOptions = [
    `See why ${winner} holds up.`,
    `See why ${winner} still holds up.`,
    `See why ${winner} holds up better.`,
    `See why ${winner} holds up under pressure.`,
    `See why ${winner} holds up over time.`,
    `See why ${winner} holds up under team pressure.`,
    `See why ${winner} holds up for this kind of work.`,
    `See why ${winner} holds up when the stakes stay real.`,
  ];

  for (const situation of situations) {
    const situationOptions = [
      trimPunctuation(situation),
      compressText(situation, 7),
      compressText(situation, 6),
      compressText(situation, 5),
    ].filter(Boolean);

    for (const [situationIndex, s] of situationOptions.entries()) {
      for (const m of mechanismChoices) {
        for (const ending of seeWhyOptions) {
          const penalty = situationIndex * 3;
          candidates.push({ text: cleanText(`If ${s}, ${loser} fails first because ${m}. ${ending}`), penalty });
          candidates.push({ text: cleanText(`If ${s} long-term, ${loser} fails first because ${m}. ${ending}`), penalty });
          candidates.push({ text: cleanText(`If ${s} every day, ${loser} fails first because ${m}. ${ending}`), penalty });
          candidates.push({ text: cleanText(`If ${s} day to day, ${loser} fails first because ${m}. ${ending}`), penalty });
          candidates.push({ text: cleanText(`If ${s} at work, ${loser} fails first because ${m}. ${ending}`), penalty });
        }
      }
    }
  }

  let best = "";
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const length = candidate.text.length;
    const rangePenalty = length < TARGET_MIN || length > TARGET_MAX ? 1000 : 0;
    const score = rangePenalty + Math.abs(length - TARGET_IDEAL) + candidate.penalty;
    if (score < bestScore) {
      best = candidate.text;
      bestScore = score;
    }
  }

  if (best.length < TARGET_MIN || best.length > TARGET_MAX) {
    throw new Error(`Meta description length ${best.length} out of range: ${best}`);
  }

  return best;
}

let updated = 0;

for (const file of fs.readdirSync(PAGES_DIR).filter((name) => name.endsWith(".json")).sort()) {
  const filePath = path.join(PAGES_DIR, file);
  const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const { xName, yName } = extractPair(doc.title);
  const winner = doc.verdict?.winner === "x" ? xName : yName;
  const loser = doc.verdict?.winner === "x" ? yName : xName;
  const winnerShort = displayName(winner);
  const loserShort = displayName(loser);
  const situations = buildSituationOptions(doc);
  const mechanism = extractMechanism(doc);

  doc.meta_description = buildMetaDescription(winnerShort, loserShort, situations, mechanism);
  doc.one_second_verdict = {
    ...doc.one_second_verdict,
    summary: buildSummary(doc),
    reason: buildReason(loserShort, mechanism),
  };

  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  updated += 1;
}

console.log(`Updated ${updated} comparison pages.`);
