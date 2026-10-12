import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFile(resolve(root, path), 'utf8');
const [html, js, css] = await Promise.all([
  read('index.html'),
  read('script.js'),
  read('styles.css')
]);

const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
const dynamicallyCreatedIds = new Set(['repo-detail', 'retry-path', 'retry-bootstrap', 'show-full-source']);
const referencedIds = new Set([...js.matchAll(/byId\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]));
const missingIds = [...referencedIds].filter((id) => !ids.has(id) && !dynamicallyCreatedIds.has(id));

assert.equal(missingIds.length, 0, 'JavaScript references missing HTML IDs: ' + missingIds.join(', '));
assert.match(html, /href=["']styles\.css["']/, 'HTML must reference the local stylesheet');
assert.match(html, /src=["']script\.js["']/, 'HTML must reference the local script');
assert.match(html, /href=["']favicon\.svg["']/, 'HTML must reference the local favicon');
await Promise.all(['styles.css', 'script.js', 'favicon.svg'].map(async (path) => {
  await access(resolve(root, path), constants.R_OK);
}));

assert.match(js, /fetchPublicRepos/, 'Explorer must load the public repository list');
assert.match(js, /\/contents/, 'Explorer must request real repository contents');
assert.match(js, /AbortController/, 'Explorer requests must support cancellation');
assert.match(js, /escapeHTML\(line\)/, 'File preview lines must be escaped before rendering');
assert.match(js, /source-code'\)\.textContent = text/, 'Expanded preview must render text, not execute file HTML');
assert.match(js, /retry-path/, 'Folder errors must offer retry');
assert.match(js, /retry-bootstrap/, 'Startup errors must offer retry');
assert.match(css, /@media\(max-width:640px\)/, 'Styles must include a mobile layout');
assert.match(css, /prefers-reduced-motion:reduce/, 'Styles must respect reduced-motion preferences');

try {
  await access(resolve(root, '.github/workflows/deploy.yml'), constants.F_OK);
  assert.fail('A deployment workflow is still present');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

console.log('Portfolio smoke checks passed: assets, DOM references, explorer safeguards, responsive rules, and no deployment workflow.');
