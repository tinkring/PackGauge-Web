import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { samples, getSample, bankSpread, displayValue, sampleCsv } from '../src/sample-data.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(`${root}/${path}`, 'utf8');

test('sample arithmetic is internally consistent, with no fabricated health rating', () => {
  assert.equal(bankSpread(samples.full.banks), 59);
  assert.equal((samples.full.banks.reduce((sum, value) => sum + value, 0) / 1000).toFixed(2), '17.84');
  assert.equal(samples.full.load.reduce((sum, value) => sum + value, 0), 100);
  assert.throws(() => bankSpread([1, 2]), TypeError);
  assert.throws(() => bankSpread([1, 2, 3, 4, NaN]), TypeError);
  assert.throws(() => getSample('__proto__'), RangeError);
  assert.throws(() => getSample('missing'), RangeError);
  assert.equal(Object.hasOwn(samples.full, 'health'), false);
});

test('missing values stay unavailable and a real zero remains zero', () => {
  assert.equal(displayValue(null, '°C'), 'Unavailable');
  assert.equal(displayValue(undefined), 'Unavailable');
  assert.equal(displayValue(0, 'Ah'), '0 Ah');
  assert.equal(samples.limited.events, null);
  assert.equal(samples.limited.load, null);
  assert.equal(samples.limited.startTemperature, null);
});

test('CSV identifies illustrative origin and exports the selected profile', () => {
  const full = sampleCsv('full');
  const limited = sampleCsv('limited');
  assert.match(full, /illustrative web sample/);
  assert.match(full, /"bank_spread","59","mV"/);
  assert.match(full, /"load_10_20A","32","%"/);
  assert.match(limited, /"Limited history"/);
  assert.match(limited, /"low_voltage_charge_starts","Unavailable",""/);
  assert.match(limited, /"load_10_20A","Unavailable","%"/);
  assert.doesNotMatch(limited, /"low_voltage_charge_starts","0"/);
  assert.equal(full.trim().split('\r\n').length, 19);
});

test('homepage actions and local anchors have real destinations', async () => {
  const html = await read('index.html');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'duplicate IDs');
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), `missing #${target}`);
  assert.doesNotMatch(html, /href="#"/);
  assert.match(html, /Explore a sample scan/);
  assert.match(html, /href="\.\/compatibility\.html"/);
  assert.match(html, /href="\.\/safety\.html"/);
  assert.match(html, /no public downloadable release yet/i);
  assert.doesNotMatch(html, /github\.com\/tinkring\/PackGauge(?:[\/#"'])/i);
});

test('demo is honestly labeled and all five panels have matching controls', async () => {
  const html = await read('index.html');
  assert.match(html, /illustrative data—not a hardware scan, product photograph, or exact firmware screen/i);
  assert.match(html, /WEB DEMO \/ NOT CONNECTED/);
  assert.match(html, /Profiles do not certify model compatibility/);
  for (const view of ['pack', 'charge', 'use', 'load', 'conditions']) {
    assert.match(html, new RegExp(`id="tab-${view}"[^>]+aria-controls="panel-${view}"`));
    assert.match(html, new RegExp(`id="panel-${view}"[^>]+aria-labelledby="tab-${view}"`));
  }
  assert.equal((html.match(/role="tab"/g) ?? []).length, 5);
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 5);
  assert.match(html, /<label for="sample-profile">/);
  assert.match(html, /role="status"/);
});

test('progressive enhancement and keyboard controls remain available', async () => {
  const [html, js, css] = await Promise.all([read('index.html'), read('src/main.js'), read('src/styles.css')]);
  assert.match(html, /<link rel="stylesheet" href="\.\/src\/styles.css"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /class="skip-link"/);
  assert.match(js, /ArrowLeft/);
  assert.match(js, /ArrowRight/);
  assert.match(js, /Home:/);
  assert.match(js, /End:/);
  assert.match(js, /Escape/);
  assert.match(js, /URL.revokeObjectURL/);
  assert.doesNotMatch(js, /innerHTML\s*=/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /\[hidden\]/);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});

test('compatibility and safety scope is retained', async () => {
  const [compatibility, safety, home] = await Promise.all([read('compatibility.html'), read('safety.html'), read('index.html')]);
  assert.match(compatibility, /not a universal battery tester/i);
  assert.match(compatibility, /184 register definitions/);
  assert.match(compatibility, /unavailable instead of zero/);
  assert.match(safety, /does not establish.*safety, authentication, capacity, or health/is);
  for (const word of ['damaged', 'swollen', 'leaking', 'hot', 'wet', 'modified', 'recalled', 'suspect']) assert.match(safety, new RegExp(word));
  assert.match(safety, /pack may refresh its own recorded statistics during scanning/i);
  for (const html of [home, compatibility, safety]) {
    assert.match(html, /<main[^>]*id="main"/);
    assert.match(html, /not affiliated with, authorized by, sponsored by, or endorsed by Milwaukee Tool/);
    assert.match(html, /MILWAUKEE and M18 are trademarks of Milwaukee Electric Tool Corporation/);
    assert.doesNotMatch(html, /milwaukee[^>]+\.(?:png|jpe?g|webp|svg)/i);
  }
});

test('custom domain and production deployment remain unchanged', async () => {
  assert.equal((await read('public/CNAME')).trim(), 'packgauge.com');
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path:\s*dist/);
  const checks = await read('.github/workflows/checks.yml');
  assert.match(checks, /pull_request:/);
  assert.match(checks, /npm run check/);
  assert.match(checks, /npm run build/);
  assert.doesNotMatch(checks, /deploy-pages|pages:\s*write/);
});
