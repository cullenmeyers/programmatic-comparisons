import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const checks = [
  {
    label: 'Internal readiness',
    script: 'seo:status',
  },
  {
    label: 'Live publish-ready URLs',
    script: 'seo:live',
  },
  {
    label: 'Comparison indexability policy',
    script: 'seo:compare-policy',
  },
];

const robotsCheckPath = path.join(__dirname, 'seo-robots-live-check.mjs');
if (existsSync(robotsCheckPath)) {
  checks.push({
    label: 'Rendered robots policy',
    script: 'seo:robots',
  });
}

function printHeader(label) {
  console.log('');
  console.log(`=== ${label} ===`);
}

console.log('ToolPicker SEO Check');
console.log('This does not submit URLs to Google Search Console or verify Google indexing.');

let failedCheck = null;

for (const check of checks) {
  printHeader(check.label);

  const result =
    process.platform === 'win32'
      ? spawnSync(`npm run ${check.script}`, {
          cwd: repoRoot,
          stdio: 'inherit',
          shell: true,
        })
      : spawnSync('npm', ['run', check.script], {
          cwd: repoRoot,
          stdio: 'inherit',
          shell: false,
        });

  if (result.error) {
    failedCheck = `${check.label} (${check.script}): ${result.error.message}`;
    break;
  }

  if (result.status !== 0) {
    failedCheck = `${check.label} (${check.script})`;
    break;
  }
}

if (failedCheck) {
  console.error('');
  console.error(`SEO check failed: ${failedCheck}`);
  process.exit(1);
}

console.log('');
console.log('All SEO checks passed.');
