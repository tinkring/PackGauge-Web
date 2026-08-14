import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(join(root, path), 'utf8');

const compact = (value) => value.replace(/\s+/g, ' ');

test('homepage follows the six-chapter revealing-instrument narrative', async () => {
  const html = await read('index.html');
  for (const id of ['product', 'revelation', 'history', 'instrument', 'workflow', 'close']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
  }
  assert.match(compact(html), /See what your battery has recorded\./i);
  assert.match(html, />Product</);
  assert.match(html, />How it works</);
  assert.match(html, /href="\.\/compatibility\.html"/);
  assert.match(html, /href="\.\/safety\.html"/);
  assert.match(html, /class="[^"]*release-state[^"]*"[\s\S]*<strong>Coming soon<\/strong>/i);
  assert.doesNotMatch(html, /id=["'](?:download|help|releases|about|diagnostics|interface)["']/);
  assert.doesNotMatch(html, /href=["']#["']/);
});

test('revelation and history use exact, honestly labelled sample values', async () => {
  const html = await read('index.html');
  assert.match(html, /17\.84\s*V/);
  for (const value of ['3568', '3567', '3570', '3540', '3599']) assert.match(html, new RegExp(value));
  assert.match(html, /59\s*mV/);
  assert.match(html, /evidence, not proof of capacity, health, or safety/i);
  assert.match(html, /bundled firmware self-test data/i);
  assert.match(html, /illustrative/i);
  assert.match(html, /availability differs by pack firmware/i);
  assert.match(html, /unavailable[^<]{0,100}(?:not|rather than)[^<]{0,40}zero/i);
});

test('instrument is a single accessible five-view stage', async () => {
  const [html, js] = await Promise.all([read('index.html'), read('src/main.js')]);
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) ?? []).length, 5);
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 5);
  for (const label of ['Pack', 'Charge', 'Tool', 'Amps', 'Conditions']) {
    assert.match(html, new RegExp(`>${label}<`));
  }
  assert.match(js, /ArrowLeft/);
  assert.match(js, /ArrowRight/);
  assert.match(js, /Home/);
  assert.match(js, /End/);
  assert.doesNotMatch(js, /innerHTML\s*=/);
});

test('workflow and concise homepage limitations remain truthful', async () => {
  const html = await read('index.html');
  assert.match(compact(html), /Connect\. Scan\. Understand\./i);
  assert.match(html, /USB-C power/i);
  assert.match(html, /purpose-built signal interface/i);
  assert.match(html, /read-oriented/i);
  assert.match(html, /pack may refresh its own recorded statistics during scanning/i);
  assert.match(html, /independent third-party product/i);
  assert.match(html, /not affiliated with, authorized by, sponsored by, or endorsed by Milwaukee Tool/i);
  assert.match(html, /MILWAUKEE and M18 are trademarks of Milwaukee Electric Tool Corporation/i);
  assert.match(html, /used only to identify compatible products/i);
});

test('compatibility page preserves support scope and missing-data honesty', async () => {
  const html = await read('compatibility.html');
  assert.match(html, /designed for compatible Milwaukee M18 battery packs/i);
  assert.match(html, /not a universal battery tester/i);
  assert.match(html, /184 register definitions/i);
  assert.match(html, /availability differs by pack firmware/i);
  assert.match(html, /Forge/i);
  assert.match(html, /unavailable instead of zero/i);
  assert.match(html, /estimated equivalent cycles/i);
  assert.match(html, /not affiliated with, authorized by, sponsored by, or endorsed by Milwaukee Tool/i);
  assert.doesNotMatch(html, /all (?:known )?M18|guaranteed compatibility|supported M18 battery type codes/i);
});

test('safety page preserves diagnostic, physical-warning, and write limits', async () => {
  const html = await read('safety.html');
  assert.match(html, /does not establish.*safety, authentication, capacity, or health/is);
  assert.match(html, /observed data/i);
  assert.match(html, /calculations/i);
  assert.match(html, /conclusions not established/i);
  for (const warning of ['damaged', 'swollen', 'leaking', 'hot', 'wet', 'modified', 'recalled', 'suspect']) {
    assert.match(html, new RegExp(warning, 'i'));
  }
  for (const claim of ['repair', 'reset', 'rebalance', 'rejuvenate', 'unlock', 'reprogram']) {
    assert.match(html, new RegExp(claim, 'i'));
  }
  assert.match(html, /Missing or unavailable data is not converted to a reassuring zero/i);
  assert.match(html, /pack may refresh its own recorded statistics during scanning/i);
});

test('site is local, progressively enhanced, and motion-accessible', async () => {
  const [home, compatibility, safety, css] = await Promise.all([
    read('index.html'), read('compatibility.html'), read('safety.html'), read('src/styles.css'),
  ]);
  for (const html of [home, compatibility, safety]) {
    assert.match(html, /<main[^>]*id="main"/);
    assert.match(html, /class="skip-link"/);
    assert.doesNotMatch(html, /milwaukee[^>]+\.(?:png|jpe?g|webp|svg)/i);
    assert.doesNotMatch(html, /github\.com\/tinkring\/PackGauge(?:[\/#"'])/i);
  }
  assert.match(home, /<noscript>[\s\S]*\.reveal/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /\.js\s+\.stage-panel:not\(\.is-active\)/);
  assert.doesNotMatch(css, /\.screen-bezel::(?:before|after)/);
  assert.match(css, /\.mount-suggestion[\s\S]{0,300}(?:vermilion|#(?:ed4b32|c94738))/i);
  assert.doesNotMatch(css, /repeat\(5,\s*minmax\(7\.4rem|max-content/);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});

test('custom domain, sitemap, and Pages deployment remain configured', async () => {
  assert.equal((await read('public/CNAME')).trim(), 'packgauge.com');
  const sitemap = await read('public/sitemap.xml');
  assert.match(sitemap, /https:\/\/packgauge\.com\/compatibility\.html/);
  assert.match(sitemap, /https:\/\/packgauge\.com\/safety\.html/);
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /path:\s*dist/);
  assert.match(workflow, /npm run build/);
});
