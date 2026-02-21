// src/content/tools/types.ts

export type ToolSpec = {
  slug: string;
  title: string;
  description: string[]; // keep short: 2–4 paragraphs max
  constraintLabel: string; // verbatim constraint text
  inputs: Array<{
    key: "trigger_tool";
    label: string;
    options: [string, string]; // X, Y
  }>;
  rule: {
    mode: "selected_is_loser";
  };
  result: {
    // 2–3 lines max; use {Winner}/{Loser} placeholders
    lines: [string, string] | [string, string, string];
  };
  embedBlockTitle: string; // "Quick Gate: ..."
  relatedComparisons: string[]; // compare slugs only (no leading /compare/)
};