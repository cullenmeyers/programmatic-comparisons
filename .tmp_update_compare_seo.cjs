const fs = require("fs");
const path = require("path");

const pagesDir = path.join(process.cwd(), "content", "pages");

function stripHook(title) {
  return String(title || "")
    .trim()
    .replace(/\s+(?:—|-|â€”)\s+.+$/, "")
    .trim();
}

function parsePair(title) {
  const normalized = String(title || "").trim();
  const match = normalized.match(
    /^(.*?)\s+vs\s+(.*?)\s+for\s+(.+?)(?:\s+(?:—|-|â€”)\s+.+)?$/
  );

  if (match) {
    return {
      xName: match[1].trim(),
      yName: match[2].trim(),
      personaFromTitle: match[3].trim(),
    };
  }

  const [pairPart = "", ...personaParts] = stripHook(title).split(" for ");
  const [xName = "", yName = ""] = pairPart.split(" vs ");
  return {
    xName: xName.trim(),
    yName: yName.trim(),
    personaFromTitle: personaParts.join(" for ").trim(),
  };
}

function lowercaseFirst(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function formatPersona(persona) {
  const trimmed = String(persona || "").trim();
  const map = {
    Beginner: "Beginners",
    "Solo user": "Solo users",
    Student: "Students",
    "Busy professional": "Busy professionals",
    "Power user": "Power users",
    "Non-technical user": "Non-technical users",
    Minimalist: "Minimalists",
  };
  return map[trimmed] || trimmed;
}

function extractFailureClause(decisionRule) {
  const trimmed = String(decisionRule || "").trim();
  const match = trimmed.match(/^If\s+(.+?),\s+(.+?)\s+fails first[.!?]?$/i);
  return match ? match[1].trim() : "";
}

function buildMetaDescription(doc, xName, yName) {
  const persona = formatPersona(doc.persona).toLowerCase();

  if (doc.verdict?.winner === "depends") {
    return `See where each tool breaks under this constraint and which one is the safer pick for ${persona}.`;
  }

  const winnerIsX = doc.verdict?.winner === "x";
  const winnerLabel = winnerIsX ? xName : yName;
  const loserLabel = winnerIsX ? yName : xName;
  const failureClause = extractFailureClause(doc.verdict?.decision_rule);

  if (failureClause) {
    return `See why ${loserLabel} fails first when ${lowercaseFirst(
      failureClause
    )} and why ${winnerLabel} is the better pick for ${persona}.`;
  }

  return `See why ${loserLabel} fails first under this constraint and why ${winnerLabel} is the better pick for ${persona}.`;
}

const files = fs
  .readdirSync(pagesDir)
  .filter((file) => file.endsWith(".json"))
  .sort((a, b) => a.localeCompare(b));

let updated = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const { xName, yName, personaFromTitle } = parsePair(doc.title);
  const persona = formatPersona(personaFromTitle || doc.persona);
  const baseTitle = `${xName} vs ${yName} for ${persona}`.trim();
  const hook = doc.verdict?.winner === "depends" ? "Don't Pick Wrong" : "Clear Winner";
  const nextTitle = `${baseTitle} - ${hook}`;
  const nextDescription = buildMetaDescription(doc, xName, yName);

  if (doc.title !== nextTitle || doc.meta_description !== nextDescription) {
    doc.title = nextTitle;
    doc.meta_description = nextDescription;
    fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    updated += 1;
  }
}

console.log(`Updated ${updated} comparison pages.`);
