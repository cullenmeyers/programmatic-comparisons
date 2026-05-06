// src/content/categoryGates/index.ts

import type { CategoryGateSpec } from "./types";
import { getGateKey } from "./helpers";
import fs from "node:fs";
import path from "node:path";
import { getToolNamesFromDoc, listPageDocs } from "@/lib/pages";

const GATES_ROOT = path.join(process.cwd(), "content", "categoryGates");

function isDir(p: string) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p: string) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function listAllGateFiles(): Array<{
  categorySlug: string;
  constraintSlug: string;
  filePath: string;
}> {
  if (!isDir(GATES_ROOT)) return [];

  const categoryDirs = fs
    .readdirSync(GATES_ROOT)
    .map((name) => path.join(GATES_ROOT, name))
    .filter(isDir);

  const files: Array<{
    categorySlug: string;
    constraintSlug: string;
    filePath: string;
  }> = [];

  for (const dirPath of categoryDirs) {
    const categorySlug = path.basename(dirPath);

    const jsonFiles = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(dirPath, f))
      .filter(isFile);

    for (const fp of jsonFiles) {
      const constraintSlug = path.basename(fp, ".json");
      files.push({ categorySlug, constraintSlug, filePath: fp });
    }
  }

  return files;
}

// Cache in-memory for build/runtime
let _cache: Map<string, CategoryGateSpec> | null = null;
let _paramsCache:
  | Array<{
      category: string;
      constraint: string;
    }>
  | null = null;
let _inferredCache: Map<string, CategoryGateSpec> | null = null;
let _pageDocsByCategoryCache: Map<string, ReturnType<typeof listPageDocs>> | null = null;

function loadGateCache(): Map<string, CategoryGateSpec> {
  if (_cache) return _cache;

  const map = new Map<string, CategoryGateSpec>();
  const files = listAllGateFiles();

  for (const f of files) {
    let gate: CategoryGateSpec | null = null;

    // 1) Loudly report invalid JSON (instead of crashing with no context)
    try {
      gate = readJsonFile<CategoryGateSpec>(f.filePath);
    } catch (err) {
      console.error("❌ Invalid JSON in category gate file:", f.filePath);
      console.error(err);
      continue;
    }

    // 2) Loudly report slug mismatch (instead of silently skipping)
    if (gate.categorySlug !== f.categorySlug || gate.constraintSlug !== f.constraintSlug) {
      console.error("❌ CategoryGateSpec slug mismatch. Skipping gate:", {
        filePath: f.filePath,
        expected: { categorySlug: f.categorySlug, constraintSlug: f.constraintSlug },
        found: { categorySlug: gate.categorySlug, constraintSlug: gate.constraintSlug },
      });
      continue;
    }

    map.set(getGateKey(gate.categorySlug, gate.constraintSlug), gate);
  }

  _cache = map;
  return map;
}

function withInferredTools(gate: CategoryGateSpec): CategoryGateSpec {
  const gateKey = getGateKey(gate.categorySlug, gate.constraintSlug);
  if (_inferredCache?.has(gateKey)) {
    return _inferredCache.get(gateKey)!;
  }

  const byName = new Map(gate.tools.map((tool) => [tool.name, tool]));
  const manualNames = new Set(gate.tools.map((tool) => tool.name));
  const scoreByTool = new Map<string, { wins: number; losses: number }>();

  if (!_pageDocsByCategoryCache) {
    _pageDocsByCategoryCache = new Map();

    for (const doc of listPageDocs()) {
      const categorySlug = doc.categorySlug;
      if (!categorySlug) continue;

      const existing = _pageDocsByCategoryCache.get(categorySlug);
      if (existing) {
        existing.push(doc);
      } else {
        _pageDocsByCategoryCache.set(categorySlug, [doc]);
      }
    }
  }

  const docsInCategory = _pageDocsByCategoryCache.get(gate.categorySlug) ?? [];
  const docsForGate = docsInCategory.filter(
    (doc) => doc.constraintSlug === gate.constraintSlug
  );

  for (const doc of docsInCategory) {
    const { xName, yName } = getToolNamesFromDoc(doc);
    if (!byName.has(xName)) {
      byName.set(xName, { name: xName, fails: false, note: "" });
    }
    if (!byName.has(yName)) {
      byName.set(yName, { name: yName, fails: false, note: "" });
    }
  }

  for (const doc of docsForGate) {
    const { xName, yName } = getToolNamesFromDoc(doc);
    const xScore = scoreByTool.get(xName) ?? { wins: 0, losses: 0 };
    const yScore = scoreByTool.get(yName) ?? { wins: 0, losses: 0 };

    if (doc.verdict.winner === "x") {
      xScore.wins += 1;
      yScore.losses += 1;
    } else if (doc.verdict.winner === "y") {
      yScore.wins += 1;
      xScore.losses += 1;
    }

    scoreByTool.set(xName, xScore);
    scoreByTool.set(yName, yScore);
  }

  for (const [name, score] of scoreByTool) {
    if (manualNames.has(name)) continue;
    byName.set(name, {
      name,
      fails: score.losses > score.wins,
      note: "",
    });
  }

  const inferredGate = {
    ...gate,
    tools: Array.from(byName.values()),
  };

  if (!_inferredCache) {
    _inferredCache = new Map();
  }
  _inferredCache.set(gateKey, inferredGate);

  return inferredGate;
}

export function listCategoryGateParams(): Array<{
  category: string;
  constraint: string;
}> {
  if (_paramsCache) return _paramsCache;

  _paramsCache = listAllGateFiles().map((f) => ({
    category: f.categorySlug,
    constraint: f.constraintSlug,
  }));

  return _paramsCache;
}

export function getCategoryGate(categorySlug: string, constraintSlug: string) {
  const key = getGateKey(categorySlug, constraintSlug);
  const cache = loadGateCache();
  const gate = cache.get(key);
  if (!gate) return undefined;
  return withInferredTools(gate);
}
