import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFile(resolve(root, path), 'utf8');

const [html, entry, app, css, packageText, viteConfig] = await Promise.all([
  read('index.html'),
  read('src/main.jsx'),
  read('src/App.jsx'),
  read('src/styles.css'),
  read('package.json'),
  read('vite.config.js')
]);
const packageJson = JSON.parse(packageText);

// Vite/React entry point and project configuration.
assert.match(html, /<div id="root"><\/div>/, 'HTML must provide the React root');
assert.match(html, /src="\/src\/main\.jsx"/, 'HTML must load the Vite React entry point');
assert.match(html, /href="\.\/favicon\.svg"/, 'HTML must reference the project favicon');
assert.match(entry, /createRoot\(document\.getElementById\('root'\)\)/, 'React must mount to the root element');
assert.match(entry, /import '\.\/styles\.css'/, 'React entry point must import the active stylesheet');
assert.match(viteConfig, /@vitejs\/plugin-react/, 'Vite must configure the React plugin');
assert.equal(packageJson.scripts.test, 'node tests/smoke-check.mjs', 'npm test must run this smoke check');
assert.equal(packageJson.dependencies.react, packageJson.dependencies['react-dom'], 'React and React DOM versions must match');
for (const name of ['react', 'react-dom', 'lucide-react', 'vite', '@vitejs/plugin-react']) {
  const version = packageJson.dependencies[name] ?? packageJson.devDependencies[name];
  assert.ok(version && !version.includes('latest') && !version.startsWith('^') && !version.startsWith('~'),
    name + ' must use a pinned version');
}

// GitHub Explorer source behavior, error recovery, and safe source rendering.
assert.match(app, /https:\/\/api\.github\.com\/users\//, 'Explorer must retrieve public GitHub user data');
assert.ok(app.includes("'+repo.name+'/contents/'+encodedPath"), 'Explorer must fetch repository contents');
assert.match(app, /function openRepo\(/, 'Explorer must support opening folders');
assert.match(app, /function openFile\(/, 'Explorer must support opening source files');
assert.match(app, /onClick=\{\(\)=>openRepo\(selected,path\)\}>Retry<\/button>/,
  'Folder-loading errors must offer a retry action');
assert.match(app, /aria-label="Read-only source code"/, 'Source preview must be labeled for assistive technology');
assert.match(app, /highlightLine\(line\)/, 'Source preview must apply syntax highlighting');
assert.doesNotMatch(app, /dangerouslySetInnerHTML/, 'Source files must not be injected as executable HTML');
assert.match(app, /https:\/\/github\.com\/BoyidapuMaheshBabu\/mahesh-babu-portfolio/,
  'The portfolio project card must link to this repository');
assert.match(app, /setTimeout\(\(\)=>URL\.revokeObjectURL\(url\),1000\)/,
  'Download object URLs should be revoked after the browser can start the download');

// Responsive layout, motion preferences, and required public assets.
assert.match(css, /@media\(max-width:680px\)/, 'Styles must include a mobile layout');
assert.match(css, /prefers-reduced-motion:reduce/, 'Styles must respect reduced-motion preferences');
await Promise.all([
  'favicon.svg',
  'public/og-image.svg',
  '.gitignore'
].map((path) => access(resolve(root, path), constants.R_OK)));

console.log('Portfolio smoke checks passed: React/Vite wiring, pinned dependencies, GitHub Explorer safeguards, retry handling, responsive styles, and assets.');

 
// Portfolio credibility: show a concrete project trail without implying public adoption.
assert.match(app, /className="case-study"/, 'Selected work must include a dedicated project case study');
assert.match(app, /FEATURED CASE STUDY/, 'The project case study must be labeled clearly');
assert.match(app, /A single expense entry supports daily activity and plan tracking/, 'The case study must explain the core product decision');
assert.match(app, /The 1\.0\.0-debug build was installed on a physical Android phone over USB/, 'The case study must state the concrete device check');
assert.match(app, /not public adoption/, 'The case study must distinguish a working build from user adoption');
assert.match(css, /\.case-study-steps\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/, 'Case study proof cards must use a responsive two-column layout');
assert.match(css, /@media\(max-width:500px\)[\s\S]*?\.case-study-steps\{grid-template-columns:minmax\(0,1fr\)\}/, 'Case study cards must stack on narrow screens');
