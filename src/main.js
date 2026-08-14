import './styles.css';

document.documentElement.classList.add('js');

const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const navLabel = navToggle?.querySelector('.sr-only');
const nav = document.getElementById('site-nav');
const desktopQuery = window.matchMedia('(min-width: 769px)');

const menuIsOpen = () => navToggle?.getAttribute('aria-expanded') === 'true';

const setMenu = (open, restoreFocus = false) => {
  if (!header || !navToggle) return;

  header.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  if (navLabel) navLabel.textContent = open ? 'Close navigation' : 'Open navigation';
  if (!open && restoreFocus) navToggle.focus();
};

navToggle?.addEventListener('click', () => setMenu(!menuIsOpen()));
nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuIsOpen()) setMenu(false, true);
});

document.addEventListener('click', (event) => {
  if (menuIsOpen() && header && !header.contains(event.target)) setMenu(false);
});

const handleViewportChange = (event) => {
  if (event.matches) setMenu(false);
};

desktopQuery.addEventListener?.('change', handleViewportChange);

let headerTicking = false;
const syncHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
  headerTicking = false;
};

syncHeader();
window.addEventListener('scroll', () => {
  if (headerTicking) return;
  headerTicking = true;
  window.requestAnimationFrame(syncHeader);
}, { passive: true });

const tablist = document.querySelector('[role="tablist"]');
const tabs = tablist ? [...tablist.querySelectorAll('[role="tab"]')] : [];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

const activateTab = (tab, moveFocus = false) => {
  const panelId = tab.getAttribute('aria-controls');

  tabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });

  panels.forEach((panel) => {
    const active = panel.id === panelId;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });

  if (moveFocus) tab.focus();
};

if (tabs.length) {
  const initialTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0];
  activateTab(initialTab);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex;

      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });
  });
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = [...document.querySelectorAll('.reveal')];

if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

  reveals.forEach((element) => revealObserver.observe(element));
}
