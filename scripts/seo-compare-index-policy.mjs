import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_INDEXABLE_SLUGS = [
  'notion-vs-todoist-for-beginner',
  'rescuetime-vs-toggl-track-for-busy-professional',
];

const VERBOSE_LIMIT = 25;
const INDEXABLE_WARNING_LIMIT = 10;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const auditFilePath = path.join(repoRoot, 'content', 'seo', 'comparison-evidence-audit.json');
const pagesDirPath = path.join(repoRoot, 'content', 'pages');
const verbose = process.argv.includes('--verbose');

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Could not read or parse ${filePath}: ${reason}`);
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pageSlugFromFile(fileName) {
  return fileName.endsWith('.json') ? fileName.slice(0, -'.json'.length) : fileName;
}

function asRoute(slug) {
  return `/compare/${slug}`;
}

function listPreview(title, slugs, limit = slugs.length) {
  console.log(title);

  const visibleSlugs = slugs.slice(0, limit);
  if (visibleSlugs.length === 0) {
    console.log('- None');
  } else {
    for (const slug of visibleSlugs) {
      console.log(`- ${asRoute(slug)}`);
    }
  }

  if (slugs.length > visibleSlugs.length) {
    console.log(`- Output truncated to first ${visibleSlugs.length} of ${slugs.length}.`);
  }
}

function main() {
  const errors = [];
  const warnings = [];

  const audit = readJson(auditFilePath);
  if (!isObject(audit)) {
    throw new Error('Audit JSON top-level value must be an object.');
  }

  if (!isObject(audit.status_definitions)) {
    errors.push('Audit JSON must include a status_definitions object.');
  }

  if (!Array.isArray(audit.audited_comparisons)) {
    errors.push('Audit JSON must include an audited_comparisons array.');
  }

  const validStatuses = new Set(Object.keys(audit.status_definitions || {}));
  const auditedComparisons = Array.isArray(audit.audited_comparisons)
    ? audit.audited_comparisons
    : [];

  const pageFiles = readdirSync(pagesDirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const comparisonSlugs = [];
  for (const fileName of pageFiles) {
    const filePath = path.join(pagesDirPath, fileName);
    const page = readJson(filePath);
    const fileSlug = pageSlugFromFile(fileName);
    const pageSlug = typeof page.slug === 'string' && page.slug.trim() !== '' ? page.slug : fileSlug;

    if (pageSlug.includes('-vs-')) {
      comparisonSlugs.push(pageSlug);
    }
  }

  const comparisonSlugSet = new Set(comparisonSlugs);
  const auditedSlugSet = new Set();
  const indexableSlugSet = new Set();

  auditedComparisons.forEach((entry, index) => {
    if (!isObject(entry)) {
      errors.push(`audited_comparisons[${index}] must be an object.`);
      return;
    }

    const slug = typeof entry.slug === 'string' ? entry.slug.trim() : '';
    if (!slug) {
      errors.push(`audited_comparisons[${index}] must include a non-empty slug.`);
      return;
    }

    if (auditedSlugSet.has(slug)) {
      errors.push(`Duplicate audited comparison slug: ${asRoute(slug)}`);
    }
    auditedSlugSet.add(slug);

    if (!comparisonSlugSet.has(slug)) {
      errors.push(`Audited slug is missing from content/pages: ${asRoute(slug)}`);
    }

    if (typeof entry.current_status !== 'string' || !validStatuses.has(entry.current_status)) {
      errors.push(
        `Invalid current_status for ${asRoute(slug)}: ${String(entry.current_status)}`,
      );
    }

    if (entry.current_status === 'verified_evidence' && entry.reuse_allowed === true) {
      indexableSlugSet.add(slug);
    }
  });

  const expectedIndexableSlugSet = new Set(EXPECTED_INDEXABLE_SLUGS);
  for (const slug of EXPECTED_INDEXABLE_SLUGS) {
    if (!comparisonSlugSet.has(slug)) {
      errors.push(`Expected indexable slug is missing from content/pages: ${asRoute(slug)}`);
    }
    if (!indexableSlugSet.has(slug)) {
      errors.push(
        `Expected indexable slug is not verified_evidence with reuse_allowed true: ${asRoute(slug)}`,
      );
    }
  }

  for (const slug of indexableSlugSet) {
    if (!expectedIndexableSlugSet.has(slug)) {
      errors.push(`Unexpected indexable comparison slug: ${asRoute(slug)}`);
    }
  }

  if (indexableSlugSet.size > INDEXABLE_WARNING_LIMIT) {
    warnings.push(
      `More than ${INDEXABLE_WARNING_LIMIT} comparison pages are indexable (${indexableSlugSet.size}).`,
    );
  }

  const indexableSlugs = comparisonSlugs
    .filter((slug) => indexableSlugSet.has(slug))
    .sort((left, right) => left.localeCompare(right));
  const noindexSlugs = comparisonSlugs
    .filter((slug) => !indexableSlugSet.has(slug))
    .sort((left, right) => left.localeCompare(right));
  const unauditedSlugs = comparisonSlugs
    .filter((slug) => !auditedSlugSet.has(slug))
    .sort((left, right) => left.localeCompare(right));
  const verifiedEvidenceCount = auditedComparisons.filter(
    (entry) => isObject(entry) && entry.current_status === 'verified_evidence',
  ).length;

  const policyValid = errors.length === 0;

  console.log('Comparison Indexability Policy Verification');
  console.log(`Source: ${auditFilePath}`);
  console.log(
    'This script verifies local policy data only. It does not fetch live pages, inspect rendered robots metadata, or check Google indexing.',
  );
  console.log('');

  console.log('A. Summary');
  console.log(`- total comparison pages: ${comparisonSlugs.length}`);
  console.log(`- audited comparisons: ${auditedSlugSet.size}`);
  console.log(`- verified evidence comparisons: ${verifiedEvidenceCount}`);
  console.log(`- expected indexable comparisons: ${EXPECTED_INDEXABLE_SLUGS.length}`);
  console.log(`- unaudited comparisons: ${unauditedSlugs.length}`);
  console.log(`- indexable comparison count: ${indexableSlugs.length}`);
  console.log(`- noindex comparison count: ${noindexSlugs.length}`);
  console.log(`- policy valid: ${policyValid}`);
  console.log('');

  listPreview('B. Indexable comparison pages', indexableSlugs);
  console.log('');

  console.log('C. Warnings/errors only');
  if (warnings.length === 0 && errors.length === 0) {
    console.log('- None');
  } else {
    for (const warning of warnings) {
      console.log(`- warning: ${warning}`);
    }
    for (const error of errors) {
      console.log(`- error: ${error}`);
    }
  }

  if (verbose) {
    console.log('');
    console.log('D. Verbose samples');
    listPreview('First 25 noindex comparison slugs', noindexSlugs, VERBOSE_LIMIT);
    console.log('');
    listPreview('First 25 unaudited comparison slugs', unauditedSlugs, VERBOSE_LIMIT);
  }

  process.exitCode = policyValid ? 0 : 1;
}

try {
  main();
} catch (error) {
  console.error(
    `Comparison indexability policy error: ${error instanceof Error ? error.message : 'unknown error'}`,
  );
  process.exitCode = 1;
}
