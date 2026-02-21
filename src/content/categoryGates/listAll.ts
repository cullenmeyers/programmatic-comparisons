// src/content/categoryGates/listAll.ts

import type { CategoryGateSpec } from "./types";
import { getCategoryGate, listCategoryGateParams } from "./index";

export function listAllCategoryGates(): CategoryGateSpec[] {
  const params = listCategoryGateParams();
  const out: CategoryGateSpec[] = [];

  for (const p of params) {
    const g = getCategoryGate(p.category, p.constraint);
    if (g) out.push(g);
  }

  return out;
}