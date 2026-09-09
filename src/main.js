import { samples, summarize, displayValues, sampleCsv } from './sample-data.js';

// Content is visible by default. JavaScript only enhances controls and panels.
document.documentElement.classList.add('js');
const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
const menuLabel = document.querySelector('[data-menu-label]');
const desktop = window.matchMedia('(min-width: 901px)');
const menuIsOpen = () => navToggle?.getAttribute('aria-expanded') === 'true';
function setMenu(open, restoreFocus = false) {
  header?.classList.toggle('is-open', open);
  navToggle?.setAttribute('aria-expanded', String(open));
  if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
  if (!open && restoreFocus) navToggle?.focus();
}
navToggle?.addEventListener('click', () => setMenu(!menuIsOpen()));
nav?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuIsOpen()) setMenu(false, true);
});
document.addEventListener('click', event => {
  if (menuIsOpen() && header && !header.contains(event.target)) setMenu(false);
});
// Do not leave a collapsed mobile menu open when keyboard focus moves outside it.
header?.addEventListener('focusout', event => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
});
desktop.addEventListener('change', event => { if (event.matches) setMenu(false); });

const demo = document.getElementById('demo');
if (demo) {
  const tabs = [...demo.querySelectorAll('[role="tab"]')];
  const panels = [...demo.querySelectorAll('[role="tabpanel"]')];
  const selector = document.getElementById('sample-profile');
  const feedback = demo.querySelector('[data-demo-status]');
  function activateTab(tab, focus = false) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabs[next], true);
    });
  });
  activateTab(tabs[0]);

  function renderSample(profile, announce = false) {
    const sample = samples[profile];
    if (!sample) return;
    const values = displayValues(sample), summary = summarize(sample.banks);
    demo.querySelectorAll('[data-value]').forEach(element => {
      const value = values[element.dataset.value];
      element.textContent = value;
      element.classList.toggle('unavailable', value === 'Unavailable');
    });
    demo.querySelectorAll('.cell').forEach((element, i) => {
      const v = sample.banks[i];
      element.querySelector('.cell-value').textContent = (v / 1000).toFixed(3);
      element.querySelector('i').style.setProperty('--level', `${Math.min(100, v / 4200 * 100)}%`);
      element.classList.toggle('is-low', v === summary.low);
      element.classList.toggle('is-high', v === summary.high);
    });
    const loadChart = demo.querySelector('[data-load-chart]');
    const missing = sample.load == null;
    loadChart.hidden = missing;
    demo.querySelector('[data-load-axis]').hidden = missing;
    demo.querySelector('[data-load-empty]').hidden = !missing;
    if (!missing) {
      const max = Math.max(1, ...sample.load);
      loadChart.querySelectorAll('i').forEach((bar, i) => bar.style.setProperty('--level', `${sample.load[i] / max * 100}%`));
      loadChart.setAttribute('aria-label', `Illustrative relative activity in eight increasing load bands: ${sample.load.join(', ')}`);
    }
    if (announce) feedback.textContent = `${sample.label} sample loaded. All values are illustrative, not a live pack scan.`;
  }
  renderSample(selector.value);
  selector.addEventListener('change', () => renderSample(selector.value, true));
  demo.querySelector('[data-download]').addEventListener('click', () => {
    let url;
    try {
      const blob = new Blob([sampleCsv(selector.value)], { type: 'text/csv;charset=utf-8;' });
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `packgauge-illustrative-${selector.value}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      feedback.textContent = 'Sample CSV download requested. The file contains illustrative data only.';
    } catch {
      feedback.textContent = 'The sample download could not start. Please try again in a browser that allows file downloads.';
    } finally {
      // Keep the object URL alive long enough for browsers to begin the download.
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  });
}
