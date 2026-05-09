import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const statusFilePath = path.resolve(
  __dirname,
  '..',
  'content',
  'seo',
  'category-constraint-page-status.json',
);

function exitWithError(message) {
  console.error(`SEO status error: ${message}`);
  process.exit(1);
}

function formatValue(value) {
  return value === null || value === undefined || value === '' ? 'n/a' : String(value);
}

function countFailedGates(page) {
  return Array.isArray(page.failed_gates) ? page.failed_gates.length : Number.MAX_SAFE_INTEGER;
}

function validatePage(page, index) {
  if (!page || typeof page !== 'object' || Array.isArray(page)) {
    exitWithError(`pages[${index}] must be an object.`);
  }

  const requiredFields = [
    'route',
    'final_status',
    'publish_allowed',
    'index_submission_allowed',
  ];

  for (const field of requiredFields) {
    if (!(field in page)) {
      exitWithError(`pages[${index}] is missing required field "${field}".`);
    }
  }

  if (typeof page.route !== 'string' || page.route.trim() === '') {
    exitWithError(`pages[${index}].route must be a non-empty string.`);
  }

  if (typeof page.final_status !== 'string' || page.final_status.trim() === '') {
    exitWithError(`pages[${index}].final_status must be a non-empty string.`);
  }

  if (typeof page.publish_allowed !== 'boolean') {
    exitWithError(`pages[${index}].publish_allowed must be a boolean.`);
  }

  if (typeof page.index_submission_allowed !== 'boolean') {
    exitWithError(`pages[${index}].index_submission_allowed must be a boolean.`);
  }
}

let parsed;

try {
  const raw = readFileSync(statusFilePath, 'utf8');
  parsed = JSON.parse(raw);
} catch (error) {
  exitWithError(
    error instanceof Error ? `could not read or parse ${statusFilePath}: ${error.message}` : 'unknown JSON error.',
  );
}

if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
  exitWithError('top-level JSON value must be an object.');
}

if (!Array.isArray(parsed.pages)) {
  exitWithError('top-level "pages" must be an array.');
}

parsed.pages.forEach(validatePage);

const publishReadyPages = parsed.pages.filter(
  (page) =>
    page.final_status === 'publish_ready' &&
    page.publish_allowed === true &&
    page.index_submission_allowed === true,
);

const blockedPages = parsed.pages.filter(
  (page) =>
    !(
      page.final_status === 'publish_ready' &&
      page.publish_allowed === true &&
      page.index_submission_allowed === true
    ),
);

const recommendedAction =
  typeof parsed.summary?.recommended_next_action === 'string' &&
  parsed.summary.recommended_next_action.trim() !== ''
    ? parsed.summary.recommended_next_action.trim()
    : blockedPages
        .slice()
        .sort((left, right) => countFailedGates(left) - countFailedGates(right))[0]?.recommended_next_action ||
      blockedPages
        .slice()
        .sort((left, right) => countFailedGates(left) - countFailedGates(right))[0]?.next_repair_action ||
      'No repair action recorded.';

console.log('Category + Constraint SEO Status');
console.log(`Source: ${statusFilePath}`);
console.log('This is internal readiness only. It does not verify Vercel deployment or Google index status.');
console.log('');

console.log('A. Publish-ready according to internal gate');
if (publishReadyPages.length === 0) {
  console.log('- None');
} else {
  for (const page of publishReadyPages) {
    console.log(`- route: ${page.route}`);
    console.log(`  page file: ${formatValue(page.page_file)}`);
    if (page.production_url) {
      console.log(`  production_url: ${page.production_url}`);
    }
    if (page.public_tracking) {
      console.log(`  public_tracking: ${page.public_tracking}`);
    }
    console.log('  note: Internal gate passed. Confirm deploy/GSC separately.');
  }
}

console.log('');
console.log('B. Blocked pages');
if (blockedPages.length === 0) {
  console.log('- None');
} else {
  for (const page of blockedPages) {
    console.log(`- route: ${page.route}`);
    console.log(`  final_status: ${formatValue(page.final_status)}`);
    console.log(`  failed_gate_to_address_first: ${formatValue(page.failed_gate_to_address_first)}`);
    console.log(`  failure_type: ${formatValue(page.failure_type)}`);
    console.log(`  next_repair_action: ${formatValue(page.next_repair_action)}`);
    console.log(`  publish_allowed: ${formatValue(page.publish_allowed)}`);
    console.log(`  index_submission_allowed: ${formatValue(page.index_submission_allowed)}`);
  }
}

console.log('');
console.log('C. Next repair action');
console.log(`- ${recommendedAction}`);
