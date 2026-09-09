import './styles.css';
import { getSample, displayValue, sampleCsv } from './sample-data.js';

const header = document.querySelector('[data-header]');
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
const menuOpen = () => toggle?.getAttribute('aria-expanded') === 'true';
function setMenu(open, restoreFocus = false) {
  if (!header || !toggle) return;
  header.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  const label = toggle.querySelector('.sr-only');
  if (label) label.textContent = open ? 'Close navigation' : 'Open navigation';
  if (restoreFocus) toggle.focus();
}
toggle?.addEventListener('click', () => setMenu(!menuOpen()));
nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuOpen()) setMenu(false, true);
});
document.addEventListener('click', (event) => {
  if (menuOpen() && !header.contains(event.target)) setMenu(false);
});
window.matchMedia('(min-width: 769px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});
const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 16);
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

const demo = document.querySelector('[data-demo]');
if (demo) {
  const tabs = [...demo.querySelectorAll('[role="tab"]')];
  const panels = [...demo.querySelectorAll('[role="tabpanel"]')];
  const select = demo.querySelector('#sample-profile');
  const announcement = demo.querySelector('[role="status"]');
  function activate(tab, moveFocus = false) {
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (moveFocus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      activate(tabs[next], true);
    });
  });
  function refreshProfile(announce = true) {
    const sample = getSample(select.value);
    demo.querySelectorAll('[data-field]').forEach((element) => {
      element.textContent = displayValue(sample[element.dataset.field], element.dataset.unit);
    });
    demo.querySelector('[data-load-chart]').hidden = sample.load == null;
    demo.querySelector('[data-load-empty]').hidden = sample.load != null;
    if (announce) announcement.textContent = `${sample.label} illustrative sample selected. Missing fields are shown as unavailable, not zero.`;
  }
  select.addEventListener('change', () => refreshProfile());
  demo.querySelector('[data-download]').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([sampleCsv(select.value)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `packgauge-illustrative-${select.value}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    announcement.textContent = 'Illustrative sample CSV download requested. This is not a scan from a physical battery.';
  });
  activate(tabs[0]);
  refreshProfile(false);
  demo.querySelectorAll('[data-enhanced]').forEach((element) => { element.hidden = false; });
  document.querySelector('[data-explore]')?.addEventListener('click', () => {
    window.setTimeout(() => tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.focus({ preventScroll: true }), 0);
  });
}
document.documentElement.classList.add('js');
