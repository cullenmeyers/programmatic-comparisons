// src/content/categoryGates/helpers.ts

import type { ConstraintLabel, ConstraintSlug } from "./types";

export function constraintSlugFromLabel(label: ConstraintLabel): ConstraintSlug {
  switch (label) {
    case "low tolerance for setup/configuration":
      return "setup-tolerance";
    case "zero tolerance for ongoing maintenance":
      return "maintenance-load";
    case "short-term use + low switching cost":
      return "switching-cost";
    case "time scarcity / cognitive overload":
      return "time-scarcity";
    case "ceiling matters":
      return "ceiling-check";
    case "fear of breaking things":
      return "fear-of-breaking";
    case "feature aversion":
      return "feature-aversion";
  }
}

export function slugifyCategory(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getGateKey(categorySlug: string, constraintSlug: string) {
  return `${categorySlug}__${constraintSlug}` as const;
}