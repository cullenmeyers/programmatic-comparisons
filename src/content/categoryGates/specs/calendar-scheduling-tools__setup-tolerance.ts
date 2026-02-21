// src/content/categoryGates/specs/calendar-scheduling-tools__setup-tolerance.ts

import type { CategoryGateSpec } from "../types";

export const gate: CategoryGateSpec = {
  categoryLabel: "Calendar / Scheduling tools",
  categorySlug: "calendar-scheduling-tools",
  constraintLabel: "low tolerance for setup/configuration",
  constraintSlug: "setup-tolerance",

  title: "Setup Tolerance Gate — Calendar/Scheduling Tools",
  description: [
    "Use this when your goal is to publish availability fast, not configure a full booking system.",
    "A tool fails this gate if it forces business setup (payments, services, staff) before you can share a working booking link.",
  ],
  embedBlockTitle: "Quick Gate: Setup Before Link",

  tools: [
    { name: "Calendly", fails: false, note: "Link-first scheduling." },
    { name: "TidyCal", fails: false, note: "Simple booking pages." },
    { name: "Setmore", fails: false, note: "Can share booking quickly." },

    { name: "Square Appointments", fails: true, note: "Often pushes services/payments setup." },
    { name: "Zoho Bookings", fails: true, note: "Business-layer setup early." },
  ],

  relatedComparisons: [
    "square-appointments-vs-calendly-for-beginners",
    "zoho-bookings-vs-tidycal-for-beginners",
    "setmore-vs-calendly-for-beginners",
    "tidycal-vs-google-calendar-for-beginners",
  ],
};