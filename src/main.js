import './styles.css';
import './product3d.js';

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

toggle?.removeAttribute('hidden');
toggle?.addEventListener('click', () => setMenu(!menuOpen()));
nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuOpen()) setMenu(false, true);
});
document.addEventListener('click', (event) => {
  if (menuOpen() && header && !header.contains(event.target)) setMenu(false);
});
window.matchMedia('(min-width: 961px)').addEventListener?.('change', (event) => {
  if (event.matches) setMenu(false);
});

const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 16);
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

const gallery = document.querySelector('[data-gallery]');
if (gallery) {
  const tablist = gallery.querySelector('[role="tablist"]');
  const tabs = [...gallery.querySelectorAll('[role="tab"]')];
  const panels = [...gallery.querySelectorAll('[role="tabpanel"]')];

  const activate = (tab, moveFocus = false) => {
    const panelId = tab.getAttribute('aria-controls');
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== panelId; });
    if (moveFocus) tab.focus();
  };

  tablist?.removeAttribute('hidden');
  const initial = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0];
  if (initial) activate(initial);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(tabs[next], true);
    });
  });

  const dialog = document.querySelector('.photo-dialog');
  const dialogImage = dialog?.querySelector('img');
  const dialogTitle = dialog?.querySelector('#photo-dialog-title');
  const close = dialog?.querySelector('.dialog-close');
  let opener = null;

  gallery.querySelectorAll('[data-enlarge]').forEach((button) => {
    button.removeAttribute('hidden');
    button.addEventListener('click', () => {
      const figure = button.closest('figure');
      const image = figure?.querySelector('img');
      if (!dialog || !dialogImage || !image) return;
      opener = button;
      dialogImage.src = image.src;
      dialogImage.alt = image.alt;
      if (dialogTitle) dialogTitle.textContent = figure?.querySelector('figcaption')?.childNodes[0]?.textContent?.trim() || 'PackGauge interface render';
      dialog.showModal();
    });
  });

  close?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog?.addEventListener('close', () => opener?.focus());
}

document.documentElement.classList.add('js');
