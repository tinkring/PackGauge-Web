import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(join(root, path), 'utf8');

test('homepage contains required product sections and grounded claims', async () => {
  const html = await read('index.html');
  for (const id of ['overview', 'diagnostics', 'workflow', 'compatibility', 'interface', 'download', 'help', 'releases', 'about']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
  }
  assert.match(html, /See what(?:’|&rsquo;|')s really happening[\s\S]{0,80}inside your battery/i);
  assert.match(html, /Milwaukee M18/i);
  assert.match(html, /184[\s\S]{0,40}registers/i);
  assert.match(html, /five[\s\S]{0,40}cell banks/i);
  assert.doesNotMatch(html, /lorem ipsum|coming soon|placeholder|industry[- ]leading|revolutionary/i);
});

test('download and documentation links use canonical GitHub sources', async () => {
  const html = await read('index.html');
  assert.match(html, /https:\/\/github\.com\/tinkring\/PackGauge\/releases\/latest/);
  assert.match(html, /https:\/\/github\.com\/tinkring\/PackGauge\/blob\/main\/README\.md/);
  assert.match(html, /https:\/\/github\.com\/tinkring\/PackGauge/);
  assert.doesNotMatch(html, /href=["']#["']/);
});

test('custom domain and Pages deployment are configured', async () => {
  assert.equal((await read('public/CNAME')).trim(), 'packgauge.com');
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /path:\s*dist/);
  assert.match(workflow, /npm run build/);
  assert.doesNotMatch(workflow, /working-directory:|website\//);
});

test('site scripts avoid unsafe HTML injection and honor reduced motion', async () => {
  const [html, js, css] = await Promise.all([read('index.html'), read('src/main.js'), read('src/styles.css')]);
  assert.doesNotMatch(js, /innerHTML\s*=/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(html, /<noscript>[\s\S]*\.reveal/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /class="pack-table-wrap reveal" tabindex="0" role="region"/);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});
