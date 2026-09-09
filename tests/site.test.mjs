import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(join(root, path), 'utf8');
const pages = ['index.html', 'compatibility.html', 'safety.html'];
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

test('homepage uses rendered PackGauge assets instead of raw prototype photographs', async () => {
  const html = await read('index.html');
  assert.match(html, /renders\/hero-reader\.webp/);
  for (const screen of ['home', 'pack', 'amps']) assert.match(html, new RegExp(`renders\\/screen-${screen}\\.svg`));
  assert.doesNotMatch(html, /\.\/photos\//);
  assert.match(html, /Rendered interface previews/i);
  assert.match(html, /third-party branding are intentionally omitted/i);
});

test('render assets exist and have sensible sizes', async () => {
  const hero = await readFile(join(root, 'public/renders/hero-reader.webp'));
  assert.ok(hero.length > 10000 && hero.length < 1000000);
  assert.equal(hero.subarray(8, 12).toString(), 'WEBP');
  for (const screen of ['home', 'pack', 'amps']) {
    const svg = await read(`public/renders/screen-${screen}.svg`);
    assert.match(svg, /<svg[\s\S]+width="1280"[\s\S]+height="960"/);
    assert.doesNotMatch(svg, /Milwaukee|M18|REDLITHIUM/i);
  }
});

test('render tabs and no-JavaScript panel labels point to real elements', async () => {
  const html = await read('index.html');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  const tabs = [...html.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map((m) => attrs(m[0]));
  const panels = [...html.matchAll(/<section\b[^>]*role="tabpanel"[^>]*>/g)].map((m) => attrs(m[0]));
  assert.equal(tabs.length, 3);
  assert.equal(panels.length, 3);
  assert.equal(tabs.filter((tab) => tab['aria-selected'] === 'true').length, 1);
  for (const tab of tabs) assert.ok(panels.some((p) => p.id === tab['aria-controls']));
  for (const panel of panels) assert.ok(ids.includes(panel['aria-labelledby']));
  assert.doesNotMatch(html, /<section[^>]*role="tabpanel"[^>]*\shidden/);
  assert.match(html, /role="tablist"[^>]*hidden/);
});

test('public pages omit third-party battery branding and identifying artwork', async () => {
  for (const path of pages) {
    const html = await read(path);
    assert.doesNotMatch(html, /Milwaukee|M18|REDLITHIUM|Forge|High Output/i, path);
    assert.match(html, /id="main"/);
    assert.match(html, /class="skip-link"/);
    assert.match(html, /stylesheet[^>]+src\/styles\.css/);
  }
  const home = await read('index.html');
  assert.match(home, /supported 18V lithium-ion tool battery packs/i);
  assert.match(home, /no battery branding shown/i);
});

test('same-site anchors and relative page destinations exist', async () => {
  for (const path of pages) {
    const html = await read(path);
    for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]*)"/g)) {
      assert.notEqual(href, '#');
      if (/^https?:/.test(href)) continue;
      const [file, id] = href.split('#');
      const target = file ? resolve(root, dirname(path), file) : join(root, path);
      const content = await readFile(target, 'utf8');
      if (id) assert.ok(content.includes(`id="${id}"`), `${path}: ${href}`);
    }
  }
});

test('keyboard, modal and motion safeguards are present', async () => {
  const [html, js, css] = await Promise.all([read('index.html'), read('src/main.js'), read('src/styles.css')]);
  for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'Escape']) assert.ok(js.includes(key));
  assert.match(js, /showModal/);
  assert.match(js, /opener\?\.focus\(\)/);
  assert.match(html, /<dialog[^>]*aria-labelledby="photo-dialog-title"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(js, /innerHTML\s*=/);
});

test('shared pages retain diagnostic safety and unknown-data boundaries', async () => {
  const safety = await read('safety.html');
  for (const word of ['damaged', 'swollen', 'leaking', 'hot', 'wet', 'modified', 'recalled', 'suspect', 'reset', 'reprogram']) assert.ok(safety.includes(word));
  assert.match(safety, /Missing or unavailable data is not converted to a reassuring zero/i);
  const compatibility = await read('compatibility.html');
  assert.match(compatibility, /not a universal battery tester/i);
  assert.match(compatibility, /Missing data stays unavailable/i);
  assert.match(compatibility, /visual similarity alone cannot guarantee/i);
});

test('development status and production publishing remain explicit', async () => {
  const html = await read('index.html');
  assert.match(html, /no public downloadable release or purchase option/i);
  assert.equal((await read('public/CNAME')).trim(), 'packgauge.com');
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path:\s*dist/);
  const checks = await read('.github/workflows/checks.yml');
  assert.match(checks, /contents:\s*read/);
  assert.doesNotMatch(checks, /contents:\s*write|pages:\s*write|pull_request_target/);
  assert.match(checks, /npm run build/);
});
