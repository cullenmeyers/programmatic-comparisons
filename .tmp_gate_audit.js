const fs = require('fs');
const path = require('path');

const pagesDir = 'content/pages';
const gatesDir = 'content/categoryGates';
const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const files = fs.existsSync(pagesDir)
  ? fs.readdirSync(pagesDir).filter((f) => f.endsWith('.json'))
  : [];

const docs = [];
const errors = [];

for (const f of files) {
  const full = path.join(pagesDir, f);
  let obj;
  try {
    const raw = fs.readFileSync(full, 'utf8');
    obj = JSON.parse(raw);
  } catch (e) {
    errors.push({ file: f, type: 'parse', msg: e.message });
    continue;
  }

  const slugBase = f.slice(0, -5);
  if (obj.slug !== slugBase) {
    errors.push({
      file: f,
      type: 'slug_filename',
      msg: 'filename ' + slugBase + ' != doc.slug ' + obj.slug,
    });
  }

  if (!obj.categorySlug || !kebab.test(obj.categorySlug)) {
    errors.push({
      file: f,
      type: 'categorySlug',
      msg: 'invalid categorySlug ' + obj.categorySlug,
    });
  }

  if (!obj.constraintSlug || !kebab.test(obj.constraintSlug)) {
    errors.push({
      file: f,
      type: 'constraintSlug',
      msg: 'invalid constraintSlug ' + obj.constraintSlug,
    });
  }

  const winner = obj && obj.verdict ? obj.verdict.winner : undefined;
  if (!['x', 'y', 'depends'].includes(winner)) {
    errors.push({
      file: f,
      type: 'winner',
      msg: 'invalid verdict.winner ' + winner,
    });
  }

  docs.push(Object.assign({ file: f }, obj));
}

const categoryCounts = {};
const gateCounts = {};
for (const d of docs) {
  const c = d.categorySlug;
  if (!c) continue;
  categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  const s = d.constraintSlug;
  if (!s) continue;
  if (!gateCounts[c]) gateCounts[c] = {};
  gateCounts[c][s] = (gateCounts[c][s] || 0) + 1;
}

const existingGates = new Set();
if (fs.existsSync(gatesDir)) {
  const catDirs = fs
    .readdirSync(gatesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const cat of catDirs) {
    const catDir = path.join(gatesDir, cat);
    for (const f of fs.readdirSync(catDir)) {
      if (f.endsWith('.json')) {
        existingGates.add(cat + '/' + f.slice(0, -5));
      }
    }
  }
}

const eligibleMissing = [];
const existsNotEligible = [];
const eligibleExists = [];

for (const [cat, count] of Object.entries(categoryCounts)) {
  const constraints = gateCounts[cat] || {};
  for (const [constraint, cCount] of Object.entries(constraints)) {
    const key = cat + '/' + constraint;
    const isEligible = count >= 10 && cCount >= 3;
    if (isEligible) {
      const row = {
        categorySlug: cat,
        constraintSlug: constraint,
        categoryComparisonsCount: count,
        constraintComparisonsCount: cCount,
      };
      if (existingGates.has(key)) eligibleExists.push(row);
      else eligibleMissing.push(row);
    }
  }
}

for (const key of existingGates) {
  const [cat, constraint] = key.split('/');
  const catCount = categoryCounts[cat] || 0;
  const conCount = (gateCounts[cat] || {})[constraint] || 0;
  const isEligible = catCount >= 10 && conCount >= 3;
  if (!isEligible) {
    existsNotEligible.push({
      categorySlug: cat,
      constraintSlug: constraint,
      categoryComparisonsCount: catCount,
      constraintComparisonsCount: conCount,
    });
  }
}

const coverage = Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([cat, count]) => ({
    categorySlug: cat,
    categoryComparisonsCount: count,
    constraints: Object.entries(gateCounts[cat] || {})
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([constraint, cCount]) => ({
        constraintSlug: constraint,
        constraintComparisonsCount: cCount,
      })),
  }));

const out = {
  audit: {
    totalFiles: files.length,
    parsedDocs: docs.length,
    errorCount: errors.length,
    errors,
  },
  coverage,
  eligibility: {
    thresholds: {
      categoryComparisonsCount: 10,
      constraintComparisonsCount: 3,
    },
    eligibleMissing,
    existsNotEligible,
    eligibleExists,
  },
};

console.log(JSON.stringify(out, null, 2));
