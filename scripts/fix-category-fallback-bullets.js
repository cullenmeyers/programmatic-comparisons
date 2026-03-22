/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, "content", "pages");
const REPORT_PATH = path.join(ROOT, "reports", "category-fallback-bullet-fix-report.md");

const replacements = {
  "password-managers": {
    board: {
      point: "Vault contents are easy to review at a glance",
      why: (tool) => `${tool} makes it easy to review saved logins, cards, and secure notes quickly without digging through heavier admin controls.`,
    },
    collab: {
      point: "Login details and extra notes stay on the same entry",
      why: (tool) => `${tool} keeps usernames, passwords, notes, and related details together, which helps when you need the full credential context in one place.`,
    },
  },
  "time-tracking-tools": {
    board: {
      point: "Logged time is easy to review at a glance",
      why: (tool) => `${tool} makes it easy to check today's entries, recent sessions, or project totals without opening heavier reporting flows first.`,
    },
    collab: {
      point: "Time entries keep their project and note context together",
      why: (tool) => `${tool} keeps each time record tied to the project, tag, or note that explains it, which cuts down on cleanup later.`,
    },
  },
  "calendar-scheduling-tools": {
    board: {
      point: "The schedule is easy to scan at a glance",
      why: (tool) => `${tool} makes it easy to see what is booked, open, or changing without drilling into extra setup or planning panels.`,
    },
    collab: {
      point: "Event details stay with the same booking",
      why: (tool) => `${tool} keeps the time, location, notes, and invite context on the same event, which helps when plans move quickly.`,
    },
  },
  "habit-trackers": {
    board: {
      point: "Habit progress is easy to scan at a glance",
      why: (tool) => `${tool} makes it easy to check today's status, misses, and streaks without opening deeper goal settings first.`,
    },
    collab: {
      point: "Each habit keeps its notes and history together",
      why: (tool) => `${tool} keeps progress context with the same habit record, which helps when you are trying to spot patterns instead of just logging once.`,
    },
  },
  "note-taking-apps": {
    board: {
      point: "Your notes stay easy to skim and sort",
      why: (tool) => `${tool} keeps note browsing lightweight, which helps when you want to find the right page quickly without building extra structure first.`,
    },
    collab: {
      point: "Related notes and attachments stay with the same document",
      why: (tool) => `${tool} keeps the note, supporting material, and added context together, which makes the page easier to reuse later.`,
    },
  },
  "read-it-later-apps": {
    board: {
      point: "Saved reading is easy to skim later",
      why: (tool) => `${tool} makes it easy to review what is unread, queued, or worth returning to without adding heavier organization first.`,
    },
    collab: {
      point: "Highlights and notes stay with the saved item",
      why: (tool) => `${tool} keeps reading context attached to the same article or link, which helps when you come back later to use it.`,
    },
  },
  "bookmark-managers": {
    board: {
      point: "Saved links are easy to scan and reopen",
      why: (tool) => `${tool} makes it easy to review bookmarks quickly without adding more structure than the collection actually needs.`,
    },
    collab: {
      point: "Notes and metadata stay with the saved link",
      why: (tool) => `${tool} keeps tags, notes, and link details together, which helps when you need to understand why something was saved.`,
    },
  },
  "email-inbox-tools": {
    board: {
      point: "The inbox is easy to scan quickly",
      why: (tool) => `${tool} makes it easier to see what needs attention without opening extra coordination views or digging through nested controls.`,
    },
    collab: {
      point: "Replies and internal context stay in the same thread",
      why: (tool) => `${tool} keeps the message history and surrounding context together, which reduces backtracking during a busy reply cycle.`,
    },
  },
  "mind-mapping-tools": {
    board: {
      point: "The map is easy to scan visually",
      why: (tool) => `${tool} makes it easier to see branches, clusters, and gaps quickly without rebuilding the whole map layout.`,
    },
    collab: {
      point: "Links and supporting material stay with the same node",
      why: (tool) => `${tool} keeps the context for each idea close to the node itself, which helps when the map starts carrying more than labels.`,
    },
  },
};

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

function applyTextReplacements(text, categorySlug) {
  if (typeof text !== "string") return text;
  if (!replacements[categorySlug]) return text;
  let next = text
    .replace(/status is easy to scan on a visual board/gi, replacements[categorySlug].board.point)
    .replace(/comments and files stay attached to the task/gi, replacements[categorySlug].collab.point)
    .replace(/visual board/gi, replacements[categorySlug].board.point.toLowerCase());
  if (categorySlug === "note-taking-apps") next = next.replace(/visual board/gi, "visual workspace");
  if (categorySlug === "mind-mapping-tools") next = next.replace(/visual board/gi, "visual canvas");
  return next;
}

function main() {
  const changed = [];

  for (const file of fs.readdirSync(PAGES_DIR).filter((name) => name.endsWith(".json"))) {
    const filePath = path.join(PAGES_DIR, file);
    const doc = readJson(filePath);
    const category = doc.categorySlug;
    if (!replacements[category]) continue;
    const { xName, yName } = parsePair(doc.title);

    let touched = false;
    const nextSections = (doc.sections || []).map((section) => {
      const next = { ...section };
      if (Array.isArray(next.bullets)) {
        next.bullets = next.bullets.map((bullet) => {
          const current = { ...bullet };
          const toolName = section.type === "y_wins" ? yName : xName;
          if (/^status is easy to scan on a visual board$/i.test(current.point)) {
            current.point = replacements[category].board.point;
            current.why_it_matters = replacements[category].board.why(toolName);
            touched = true;
          }
          if (/^comments and files stay attached to the task$/i.test(current.point)) {
            current.point = replacements[category].collab.point;
            current.why_it_matters = replacements[category].collab.why(toolName);
            touched = true;
          }
          current.why_it_matters = applyTextReplacements(current.why_it_matters, category);
          return current;
        });
      }
      if (Array.isArray(next.rules)) next.rules = next.rules.map((rule) => applyTextReplacements(rule, category));
      if (typeof next.content === "string") next.content = applyTextReplacements(next.content, category);
      return next;
    });

    const nextFaqs = (doc.faqs || []).map((faq) => ({
      ...faq,
      q: applyTextReplacements(faq.q, category),
      a: applyTextReplacements(faq.a, category),
    }));

    const nextDoc = {
      ...doc,
      sections: nextSections,
      faqs: nextFaqs,
    };

    if (JSON.stringify(nextDoc) !== JSON.stringify(doc)) {
      writeJson(filePath, nextDoc);
      changed.push(path.relative(ROOT, filePath).replace(/\\/g, "/"));
    }
  }

  const report = [
    "# Category Fallback Bullet Fix Report",
    "",
    `Date: ${new Date().toISOString()}`,
    "",
    `- Pages changed: ${changed.length}`,
    "",
    "## Files",
    "",
    ...changed.map((file) => `- ${file}`),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_PATH, report);
  console.log(JSON.stringify({ reportPath: REPORT_PATH, pagesChanged: changed.length }, null, 2));
}

main();
