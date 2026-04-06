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

function lowercaseFirst(text) {
  const cleaned = cleanText(text);
  if (!cleaned) return "";
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

function splitWords(text) {
  return cleanText(text).split(" ").filter(Boolean);
}

function titleCasePersona(persona) {
  return String(persona || "").trim();
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

  if (!match) {
    return { xName: "", yName: "" };
  }

  return {
    xName: match[1].trim(),
    yName: match[2].trim(),
  };
}

function extractFailure(doc, loserLabel) {
  const decisionRule = cleanText(doc?.verdict?.decision_rule || "");
  const match = decisionRule.match(/^If\s+(.+?),\s+(.+?)\s+fails first[.!?]?$/i);

  if (match) {
    return {
      trigger: normalizeClause(match[1]),
      loserFromRule: trimPunctuation(match[2]),
    };
  }

  const fallback = (doc.sections || [])
    .find((section) => section.type === "failure_modes")
    ?.items?.find((item) => item.tool === (doc.verdict?.winner === "x" ? "y" : "x"));

  const failsWhen = cleanText(fallback?.fails_when || "");
  const losesWhen = failsWhen.match(/\bwhen\s+(.+?)[.?!]?$/i);

  return {
    trigger: normalizeClause(losesWhen ? losesWhen[1] : failsWhen || `the main tradeoff breaks against ${loserLabel}`),
    loserFromRule: loserLabel,
  };
}

function buildLensSituation(lens, persona) {
  let text = trimPunctuation(lens);
  const personaEscaped = String(persona || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  text = text.replace(/^You\s+/i, "");
  text = text.replace(/^This person\s+/i, "");
  text = text.replace(new RegExp(`^${personaEscaped}s?\\s+`, "i"), "");
  text = text.replace(/^wants\s+/i, "want ");
  text = text.replace(/^needs\s+/i, "need ");
  text = text.replace(/^prefers\s+/i, "prefer ");

  return trimPunctuation(text);
}

function buildSituation(uiName, lens, persona) {
  const mapped = {
    "Avoid errors": "want fewer mistakes",
    "Easy to quit later": "want something easy to leave later",
    "Easy to switch": "want switching to stay easy",
    "Fast to use daily": "need less daily friction",
    "Feels safe": "need more confidence",
    "Focus on what matters": "want fewer distractions",
    "Full control and flexibility": "want more control",
    "Grows with you": "need room to grow",
    "Handle complex workflows": "need to handle complex workflows",
    "Handle scale": "need it to handle scale",
    "Hard to mess up": "want fewer setup mistakes",
    "Keep it running": "want it easy to maintain",
    "Keep it simple": "want it simple",
    "Keeps it simple": "want it simple",
    "Keep things moving": "need work to keep moving",
    "Move fast": "need speed",
    "Publish fast": "need to publish fast",
    "Runs itself": "want it to run itself",
    "Safe to use": "need it to feel safe",
    "Start fast": "need a fast start",
    "Use and move on": "want to use it and move on",
    "Works without upkeep": "want less upkeep",
  };

  if (mapped[String(uiName || "").trim()]) {
    return mapped[String(uiName || "").trim()];
  }

  return buildLensSituation(lens, persona);
}

function clampClause(text, maxWords) {
  const words = splitWords(text);
  const clipped = words.slice(0, maxWords).join(" ");
  return trimPunctuation(clipped);
}

function fixTrailingJoiner(text) {
  return trimPunctuation(text).replace(/\b(and|or|but|so|because|if|when|with|without|to|of|for|that|which|a|an|the|your|their|its|this|these)$/i, "").trim();
}

function normalizeClause(text) {
  return trimPunctuation(text)
    .replace(/^(?:using|running|tracking|managing|sharing|storing|viewing)\s+.+?\s+requires\s+/i, "")
    .replace(/\binstead of automatic cloud syncing and autofill\b/gi, "over cloud sync and autofill")
    .replace(/\binstead of\b/gi, "over")
    .replace(/\bthe user\b/gi, "you")
    .replace(/\s+/g, " ")
    .trim();
}

function compressRelativeClause(text) {
  const cleaned = trimPunctuation(text);
  return cleaned
    .replace(/^want\s+/i, "wanting ")
    .replace(/^need\s+/i, "needing ")
    .replace(/^prefer\s+/i, "preferring ");
}

function buildMetaDescription(persona, situationInput, winner, loser, trigger) {
  const personaText = personaLabel(persona);
  const triggerWords = splitWords(trigger);
  const candidates = [];
  const minTriggerWords = Math.min(5, triggerWords.length);
  const suffixes = [" overall.", " here.", " in this matchup.", " for this decision.", " for this tradeoff."];
  const situationOptions = Array.isArray(situationInput) ? situationInput : [situationInput];

  const templates = [
    (s, t) => `For ${personaText} ${compressRelativeClause(s)}, pick ${winner} when ${t}; ${loser} fails first.`,
    (s, t) => `For ${personaText} who ${s}, pick ${winner} when ${t}; ${loser} fails first.`,
    (s, t) => `For ${personaText} who ${s}, choose ${winner} when ${t}; ${loser} fails first.`,
    (s, t) => `For ${personaText} who ${s}, ${winner} wins when ${t}; ${loser} fails first.`,
    (s, t) => `For ${personaText} who ${s}, pick ${winner}; ${loser} fails first when ${t}.`,
    (s, t) => `For ${personaText} who ${s}, choose ${winner}; ${loser} fails first when ${t}.`,
  ];

  for (const template of templates) {
    for (const [situationIndex, rawSituation] of situationOptions.entries()) {
      const situation = trimPunctuation(rawSituation);
      const situationWords = splitWords(situation);
      const minSituationWords = Math.min(5, situationWords.length);
      for (let sCount = Math.min(situationWords.length, 14); sCount >= minSituationWords; sCount -= 1) {
        for (let tCount = Math.min(triggerWords.length, 18); tCount >= minTriggerWords; tCount -= 1) {
          const s = fixTrailingJoiner(clampClause(situation, sCount));
          const t = fixTrailingJoiner(clampClause(trigger, tCount));
          if (!s || !t) continue;
          const candidate = cleanText(template(s, t));
          candidates.push({ text: candidate, penalty: situationIndex * 8 });
          if (candidate.length < TARGET_MIN) {
            for (const suffix of suffixes) {
              const padded = candidate.replace(/\.$/, "") + suffix;
              if (padded.length <= TARGET_MAX) {
                candidates.push({ text: padded, penalty: situationIndex * 8 });
              }
            }
          }
        }
      }
    }
  }

  let best = candidates[0]?.text || cleanText(`For ${personaText}, pick ${winner} when ${trigger}; ${loser} fails first.`);
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const length = candidate.text.length;
    const inRangePenalty = length < TARGET_MIN || length > TARGET_MAX ? 1000 : 0;
    const score = inRangePenalty + Math.abs(length - TARGET_IDEAL) + candidate.penalty;
    if (score < bestScore) {
      best = candidate.text;
      bestScore = score;
    }
  }

  if (best.length < TARGET_MIN || best.length > TARGET_MAX) {
    throw new Error(`Unable to fit meta description in range: ${best.length} ${best}`);
  }

  return best;
}

function buildVerdictSummary(persona, situation) {
  const personaText = personaLabel(persona);
  const words = splitWords(situation);
  const clipped = fixTrailingJoiner(words.slice(0, Math.min(words.length, 9)).join(" "));
  return cleanText(`Best for ${personaText} who ${clipped}.`);
}

function buildVerdictReason(loser, trigger) {
  return cleanText(`${loser} fails first when ${trimPunctuation(trigger)}.`);
}

function getSection(doc, type) {
  return (doc.sections || []).find((section) => section.type === type) || null;
}

function getBulletsText(section) {
  const bullet = section?.bullets?.[0]?.point || "";
  return trimPunctuation(bullet);
}

function stripLeadingLabel(text, label) {
  const escaped = String(label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return trimPunctuation(String(text || "").replace(new RegExp(`^${escaped}\\s+`, "i"), ""));
}

function getFailureMode(doc, symbol) {
  return getSection(doc, "failure_modes")?.items?.find((item) => item.tool === symbol) || null;
}

function extractClauseAfterWhen(text) {
  const cleaned = cleanText(text);
  const match = cleaned.match(/\bwhen\s+(.+?)[.?!]?$/i);
  if (match) {
    return fixTrailingJoiner(match[1]);
  }
  return trimPunctuation(cleaned);
}

function extractChooseInsteadClause(item, label) {
  const fromInstead = cleanText(item?.what_to_do_instead || "");
  const chooseMatch = fromInstead.match(new RegExp(`^Choose\\s+${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(?:if|when)\\s+(.+?)[.?!]?$`, "i"));
  if (chooseMatch) {
    return fixTrailingJoiner(chooseMatch[1]);
  }

  const failsWhen = cleanText(item?.fails_when || "");
  const whenClause = extractClauseAfterWhen(failsWhen);
  return whenClause || `the tradeoff shifts toward ${label}`;
}

function buildFaqs(doc, winner, loser, winnerSymbol, loserSymbol, trigger, persona, situation) {
  const winnerMode = getFailureMode(doc, winnerSymbol);
  const winnerWins = getBulletsText(getSection(doc, winnerSymbol === "x" ? "x_wins" : "y_wins"));
  const loserChooseClause = extractChooseInsteadClause(winnerMode, loser);
  const winnerReason = winnerWins
    ? `${winner} ${lowercaseFirst(stripLeadingLabel(winnerWins, winner))}`
    : `${winner} stays closer to what ${personaLabel(persona)} need`;
  const canonical = [
    {
      q: `Which tool better matches this priority?`,
      a: `${winner} fits this need better because ${winnerReason}. ${loser} fails first when ${trigger}.`,
    },
    {
      q: `When should I choose ${loser} instead?`,
      a: `Choose ${loser} over ${winner} when ${loserChooseClause}. Otherwise, ${winner} remains the better fit for this comparison.`,
    },
    {
      q: `What makes ${loser} fail first here?`,
      a: `${loser} fails first here when ${trigger}. That is the point where ${winner} becomes the stronger pick.`,
    },
    {
      q: `Is this verdict only about one feature?`,
      a: `No. ${winner} beats ${loser} because ${winnerReason}, while ${loser} loses once ${trigger}.`,
    },
  ];

  return (doc.faqs || []).map((_, index) => canonical[index] || canonical[canonical.length - 1]);
}

function validateMetaDescription(text) {
  const length = text.length;
  if (length < TARGET_MIN || length > TARGET_MAX) {
    throw new Error(`Meta description length ${length} is out of range: ${text}`);
  }
}

let updated = 0;

for (const file of fs.readdirSync(PAGES_DIR).filter((name) => name.endsWith(".json")).sort()) {
  const filePath = path.join(PAGES_DIR, file);
  const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const { xName, yName } = extractPair(doc.title);
  const winnerSymbol = doc.verdict?.winner;
  const winner = winnerSymbol === "x" ? xName : yName;
  const loser = winnerSymbol === "x" ? yName : xName;
  const { trigger } = extractFailure(doc, loser);
  const situation = buildSituation(doc.constraintUiName, doc.constraint_lens, titleCasePersona(doc.persona));
  const altSituation = buildLensSituation(doc.constraint_lens, titleCasePersona(doc.persona));

  const nextMeta = buildMetaDescription(doc.persona, [situation, altSituation], winner, loser, trigger);
  const nextVerdict = {
    ...doc.one_second_verdict,
    summary: buildVerdictSummary(doc.persona, situation),
    reason: buildVerdictReason(loser, trigger),
  };
  const nextFaqs = buildFaqs(doc, winner, loser, winnerSymbol, winnerSymbol === "x" ? "y" : "x", trigger, doc.persona, situation);

  validateMetaDescription(nextMeta);

  doc.meta_description = nextMeta;
  doc.one_second_verdict = nextVerdict;
  doc.faqs = nextFaqs;

  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  updated += 1;
}

console.log(`Updated ${updated} comparison pages.`);
