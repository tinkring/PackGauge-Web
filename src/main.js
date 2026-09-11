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
  const link = event.target.closest('a');
  if (!link) return;
  const wasOpen = menuOpen();
  setMenu(false);
  if (wasOpen && link.getAttribute('href').startsWith('#')) {
    const target = document.getElementById(link.hash.slice(1));
    target?.setAttribute('tabindex', '-1');
    target?.focus({ preventScroll: true });
  }
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
  const dialogPosition = dialog?.querySelector('[data-dialog-position]');
  const close = dialog?.querySelector('.dialog-close');
  let opener = null;
  let dialogIndex = 0;

  const showRender = (index) => {
    dialogIndex = (index + panels.length) % panels.length;
    const panel = panels[dialogIndex];
    const image = panel.querySelector('img');
    if (!dialogImage || !image) return;
    dialogImage.src = image.src;
    dialogImage.alt = image.alt;
    if (dialogTitle) dialogTitle.textContent = `${tabs[dialogIndex].textContent.trim()} screen`;
    if (dialogPosition) dialogPosition.textContent = `${dialogIndex + 1} of ${panels.length}`;
    activate(tabs[dialogIndex]);
    opener = panel.querySelector('[data-enlarge]');
  };

  gallery.querySelectorAll('[data-enlarge]').forEach((button) => {
    if (typeof dialog?.showModal !== 'function') return;
    button.removeAttribute('hidden');
    button.addEventListener('click', () => {
      const index = panels.indexOf(button.closest('[role="tabpanel"]'));
      if (index < 0) return;
      showRender(index);
      dialog.showModal();
      document.documentElement.classList.add('gallery-open');
    });
  });

  dialog?.querySelectorAll('[data-dialog-step]').forEach((button) => {
    button.addEventListener('click', () => showRender(dialogIndex + Number(button.dataset.dialogStep)));
  });
  dialog?.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showRender(dialogIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  close?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog?.addEventListener('close', () => {
    document.documentElement.classList.remove('gallery-open');
    opener?.focus();
  });
}

document.documentElement.classList.add('js');
