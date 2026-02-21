// src/content/categoryGates/types.ts

export type ConstraintLabel =
  | "low tolerance for setup/configuration"
  | "zero tolerance for ongoing maintenance"
  | "short-term use + low switching cost"
  | "time scarcity / cognitive overload"
  | "ceiling matters"
  | "fear of breaking things"
  | "feature aversion";

export type ConstraintSlug =
  | "setup-tolerance"
  | "maintenance-load"
  | "switching-cost"
  | "time-scarcity"
  | "ceiling-check"
  | "fear-of-breaking"
  | "feature-aversion";

export type CategoryGateSpec = {
  categoryLabel: string;      // e.g. "Calendar / Scheduling tools"
  categorySlug: string;       // e.g. "calendar-scheduling-tools"
  constraintLabel: ConstraintLabel;
  constraintSlug: ConstraintSlug;

  // NEW: user-facing name for the lens (keeps UI human while keeping internal label locked)
  uiConstraintName?: string;  // e.g. "Works without upkeep" / "Keeps it simple"

  title: string;
  description: string[];
  embedBlockTitle: string;

  tools: Array<{
    name: string;
    fails: boolean;
    note?: string;            // short reason fragment shown in UI
  }>;

  relatedComparisons?: string[];
};
