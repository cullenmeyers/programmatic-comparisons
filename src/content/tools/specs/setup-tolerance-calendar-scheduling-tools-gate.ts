// FILE: src/content/tools/specs/setup-tolerance-calendar-scheduling-tools-gate.ts
import type { ToolSpec } from "../types";

export const tool: ToolSpec = {
  slug: "setup-tolerance-calendar-scheduling-tools-gate",
  title: "Square Appointments vs Calendly — Setup Tolerance Gate",
  description: [
    "Use this to share a booking link fast with minimal setup.",
    "Choose the tool that lets you publish availability first.",
  ],
  constraintLabel: "low tolerance for setup/configuration",
  inputs: [
    {
      key: "trigger_tool",
      label:
        "Which tool forces you to set up payments or service menus before you can share a booking link?",
      options: ["Square Appointments", "Calendly"] as [string, string],
    },
  ],
  rule: { mode: "selected_is_loser" },
  result: {
    lines: [
      "{Loser} makes you set up payments or service menus before you can share availability.",
      "Pick {Winner} so you can share the link now.",
    ] as [string, string],
  },
  embedBlockTitle: "Quick Gate: Setup Tolerance",
  relatedComparisons: [
    "square-appointments-vs-acuity-scheduling-for-beginner",
    "square-appointments-vs-youcanbook-me-for-beginner",
    "tidycal-vs-google-calendar-for-beginner",
    "zoho-bookings-vs-tidycal-for-beginner",
    "setmore-vs-calendly-for-beginner",
  ],
};