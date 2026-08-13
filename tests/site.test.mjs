import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(join(root, path), 'utf8');

test('homepage contains required product sections and grounded claims', async () => {
  const html = await read('index.html');
  for (const id of ['overview', 'diagnostics', 'workflow', 'compatibility', 'interface', 'safety', 'download', 'help', 'releases', 'about']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
  }
  assert.match(html, /See what your battery[\s\S]{0,80}has recorded/i);
  assert.match(html, /Milwaukee M18/i);
  assert.match(html, /184[\s\S]{0,40}registers/i);
  assert.match(html, /five[\s\S]{0,40}cell banks/i);
  assert.doesNotMatch(html, /lorem ipsum|placeholder|industry[- ]leading|revolutionary/i);
});

test('compatibility, independence, and battery-safety limits stay prominent', async () => {
  const html = await read('index.html');
  assert.match(html, /independent third-party product/i);
  assert.match(html, /not affiliated with, authorized by, sponsored by, or endorsed by Milwaukee Tool/i);
  assert.match(html, /MILWAUKEE and M18 are trademarks of Milwaukee Electric Tool Corporation/i);
  assert.match(html, /used only to identify compatible products/i);
  assert.match(html, /scan is evidence—not a safety certificate/i);
  assert.match(html, /does not prove capacity, internal condition, electrical integrity, future performance, or safety/i);
  assert.match(html, /does not charge, repair, rebalance, reset, authenticate, or certify/i);
  assert.match(html, /current user workflow does not expose pack-write commands/i);
  assert.match(html, /pack may update its own reported statistics during the scan sequence/i);
  assert.match(html, /Interface examples use bundled self-test data and illustrative comparison values/i);
  assert.doesNotMatch(html, /field-ready health report|certif(?:y|ies|ied) (?:a )?battery as safe/i);
  assert.doesNotMatch(html, /read-only by design|all known type codes|supported M18 battery type codes/i);
});

test('public links never target the private application repository', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /https:\/\/github\.com\/tinkring\/PackGauge(?:[\/#"'])/);
  assert.match(html, /https:\/\/github\.com\/tinkring\/PackGauge-Web/);
  assert.doesNotMatch(html, /PackGauge-Web\/releases/);
  assert.match(html, /Downloads not yet available/i);
  assert.match(html, /Documentation coming soon/i);
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
