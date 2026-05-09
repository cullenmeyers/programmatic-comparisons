import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PRODUCTION_ORIGIN = 'https://gettoolpicker.com';

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
  console.error(`SEO live check error: ${message}`);
  process.exitCode = 1;
  throw new Error('SEO_LIVE_CHECK_EXIT');
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

  if (!page.route.startsWith('/')) {
    exitWithError(`pages[${index}].route must start with "/".`);
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

function loadStatusJson() {
  try {
    const raw = readFileSync(statusFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    exitWithError(
      error instanceof Error
        ? `could not read or parse ${statusFilePath}: ${error.message}`
        : 'unknown JSON error.',
    );
  }
}

async function main() {
  const parsed = loadStatusJson();

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

  console.log('Category + Constraint SEO Live Check');
  console.log(`Source: ${statusFilePath}`);
  console.log('This only checks live URL availability. It does not verify Google indexing.');
  console.log('');

  let hasFailure = false;

  if (publishReadyPages.length === 0) {
    console.log('No publish-ready pages found.');
  } else {
    for (const page of publishReadyPages) {
      const productionUrl = new URL(page.route, PRODUCTION_ORIGIN).toString();
      let status = 'fetch_failed';
      let live = false;
      let warning = 'warning: fetch failed';

      try {
        const response = await fetch(productionUrl);
        status = response.status;
        live = response.status === 200;
        warning = live ? null : 'warning: non-200 response';
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown fetch error';
        warning = `warning: fetch failed (${reason})`;
      }

      if (!live) {
        hasFailure = true;
      }

      console.log(`- route: ${page.route}`);
      console.log(`  production_url: ${productionUrl}`);
      console.log(`  http_status: ${status}`);
      console.log(`  live: ${live}`);
      if (warning) {
        console.log(`  ${warning}`);
      }
    }
  }

  process.exitCode = hasFailure ? 1 : 0;
}

try {
  await main();
} catch (error) {
  if (!(error instanceof Error && error.message === 'SEO_LIVE_CHECK_EXIT')) {
    console.error(
      `SEO live check error: ${error instanceof Error ? error.message : 'unknown error.'}`,
    );
    process.exitCode = 1;
  }
}
