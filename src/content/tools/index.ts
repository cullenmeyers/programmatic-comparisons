// src/content/tools/index.ts

import type { ToolSpec } from "./types";

// Import each tool spec (1 file per tool)
import { tool as setupToleranceCalendarSchedulingToolsGate } from "./specs/setup-tolerance-calendar-scheduling-tools-gate";
export type { ToolSpec };

export const TOOLS: ToolSpec[] = [
  setupToleranceCalendarSchedulingToolsGate,
];

export function getToolBySlug(slug: string): ToolSpec | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function listToolSlugs(): string[] {
  return TOOLS.map((t) => t.slug);
}
