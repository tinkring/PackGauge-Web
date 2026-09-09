import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { samples, summarize, displayValues, csvCell, sampleCsv } from '../src/sample-data.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = path => readFile(resolve(root, path), 'utf8');
const pageNames = ['index.html', 'compatibility.html', 'safety.html'];
const ids = text => [...text.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);

test('every page has unique landmarks, working metadata and visible default content', async () => {
  for (const name of pageNames) {
    const html = await read(name);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, name);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1, name);
    assert.match(html, /<main[^>]*id="main"/);
    assert.match(html, /class="skip-link" href="#main"/);
    assert.match(html, /<meta name="viewport"/);
    assert.match(html, /<meta name="description"/);
    assert.match(html, /<meta property="og:image"/);
    const canonical = name === 'index.html' ? '' : name;
    assert.ok(html.includes(`rel="canonical" href="https://packgauge.com/${canonical}"`));
    assert.equal(ids(html).length, new Set(ids(html)).size, `${name}: duplicate IDs`);
    assert.doesNotMatch(html, /class="reveal\b/);
  }
});

test('local links, assets and fragment targets resolve', async () => {
  for (const name of pageNames) {
    const html = await read(name);
    for (const [, href] of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
      assert.notEqual(href, '#', `${name}: placeholder link`);
      if (/^(?:https?:|data:|mailto:)/.test(href)) continue;
      const [path, fragment] = href.split('#');
      const target = resolve(root, dirname(name), path || name);
      let actual = target;
      try { await access(actual); } catch { actual = resolve(root, 'public', path.replace(/^\.\//, '')); await access(actual); }
      if (fragment) assert.ok(ids(await readFile(actual, 'utf8')).includes(fragment), `${name}: broken ${href}`);
    }
  }
});

test('interactive demo tabs reference five actual panels and declared samples', async () => {
  const html = await read('index.html');
  const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*aria-controls="([^"]+)"/g)];
  const panels = [...html.matchAll(/<section[^>]*id="([^"]+)"[^>]*role="tabpanel"/g)];
  assert.equal(tabs.length, 5);
  assert.deepEqual(tabs.map(m => m[1]), panels.map(m => m[1]));
  for (const profile of Object.keys(samples)) assert.ok(html.includes(`option value="${profile}"`));
  assert.match(html, /not a hardware scan, product photograph, or exact firmware screen/i);
  assert.match(html, /ILLUSTRATIVE DATA/);
  assert.match(html, /<noscript>/);
});

test('initial visible readings match the public demo fixture', async () => {
  const html = await read('index.html'), values = displayValues(samples.detailed);
  for (const [key, value] of Object.entries(values)) {
    const match = html.match(new RegExp(`data-value="${key}">([^<]+)<`));
    assert.equal(match?.[1], value, key);
  }
});

test('voltage and spread calculations are internally consistent', () => {
  const s = summarize(samples.detailed.banks);
  assert.equal(s.voltage, 17.844);
  assert.equal(s.spread, 59);
  assert.equal(s.low, 3540);
  assert.equal(s.high, 3599);
  assert.equal(summarize(samples.limited.banks).spread, 4);
  assert.equal(summarize([0, 0, 0, 0, 0]).voltage, 0);
});

test('invalid sample banks fail explicitly instead of producing misleading data', () => {
  for (const value of [null, [], [1,2,3,4], [1,2,3,4,NaN], [1,2,3,4,-1], [1,2,3,4,Infinity]]) {
    assert.throws(() => summarize(value), TypeError);
  }
});

test('unavailable fields stay unavailable, while actual zero remains zero', () => {
  const values = displayValues(samples.limited);
  for (const key of ['lowStarts', 'faults', 'startTemp', 'endTemp', 'startBank', 'endBank']) assert.equal(values[key], 'Unavailable');
  const zero = displayValues({ ...samples.detailed, charges: 0, lowStarts: 0, faults: 0, dischargeAh: 0 });
  assert.equal(zero.charges, '0'); assert.equal(zero.faults, '0'); assert.equal(zero.lowStarts, '0');
  assert.equal(zero.cycles, '0.0');
  for (const nominalAh of [null, 0, -1, NaN]) assert.equal(displayValues({ ...samples.detailed, nominalAh }).cycles, 'Unavailable');
});

test('CSV explicitly labels illustrative data and missing history', () => {
  for (const profile of Object.keys(samples)) {
    const csv = sampleCsv(profile);
    assert.ok(csv.startsWith('\uFEFF'));
    const lines = csv.trim().split('\r\n');
    assert.equal(lines.length, 27);
    assert.ok(lines.slice(1).every(line => line.includes('ILLUSTRATIVE WEB DEMO — NOT A REAL SCAN')));
    assert.match(csv, /"cell_bank_spread"/);
    assert.match(csv, /"calculated"/);
  }
  assert.match(sampleCsv('limited'), /"fault_events","","","unavailable"/);
  assert.match(sampleCsv('limited'), /"illustrative_load_band_1","","relative units","unavailable"/);
  assert.throws(() => sampleCsv('not-a-sample'), RangeError);
  assert.throws(() => sampleCsv('__proto__'), RangeError);
});

test('CSV quotes commas, newlines and quotes and neutralizes formulas', () => {
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell('=2+2'), '"\'=2+2"');
  assert.equal(csvCell('line\nbreak'), '"line\nbreak"');
});

test('public copy keeps compatibility, release state and independent identity honest', async () => {
  const html = await read('index.html'), compatibility = await read('compatibility.html');
  assert.match(html, /no public downloadable release or ordering option/i);
  assert.match(html, /configured email|email are configured/i);
  assert.match(compatibility, /not a verified compatibility matrix/i);
  assert.match(compatibility, /unavailable instead of zero/i);
  assert.match(compatibility, /184 register definitions/);
  for (const name of pageNames) {
    const page = await read(name);
    assert.match(page, /not affiliated with, authorized by, sponsored by, or endorsed by Milwaukee Tool/i);
    assert.doesNotMatch(page, /github\.com\/tinkring\/PackGauge(?:[\/#"']|$)/i);
    assert.doesNotMatch(page, /<form\b|href="#"|Buy now|Pre-order/i);
  }
});

test('safety page retains physical warnings and diagnostic limitations', async () => {
  const html = await read('safety.html');
  for (const word of ['damaged','swollen','leaking','hot','wet','modified','recalled','suspect','repair','reset','rebalance','rejuvenate','unlock','reprogram']) assert.ok(html.includes(word), word);
  assert.match(html, /does not establish battery safety, authentication, capacity, or health/);
  assert.match(html, /pack may refresh its own recorded statistics during scanning/);
  assert.match(html, /Missing or unavailable data is not converted to a reassuring zero/);
});

test('enhancements have keyboard, reduced-motion and no-network safeguards', async () => {
  const [js, css] = await Promise.all([read('src/main.js'), read('src/styles.css')]);
  for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape']) assert.ok(js.includes(key));
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(js, /innerHTML\s*=|\beval\s*\(|\bfetch\s*\(|XMLHttpRequest/);
  assert.match(js, /URL\.revokeObjectURL/);
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic/);
});

test('domain and multi-page Vite entrypoints remain intact', async () => {
  assert.equal((await read('public/CNAME')).trim(), 'packgauge.com');
  const config = await read('vite.config.js');
  for (const page of pageNames) assert.ok(config.includes(page));
  const sitemap = await read('public/sitemap.xml');
  for (const page of pageNames.slice(1)) assert.ok(sitemap.includes(page));
});
