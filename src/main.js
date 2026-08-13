import './styles.css';

const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const navLabel = navToggle?.querySelector('.sr-only');
const navLinks = document.querySelectorAll('.site-nav a');

const setMenu = (open) => {
  if (!header || !navToggle) return;
  header.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  if (navLabel) navLabel.textContent = open ? 'Close navigation' : 'Open navigation';
};

const closeMenuForDesktop = () => {
  if (window.matchMedia('(min-width: 761px)').matches) setMenu(false);
};

navToggle?.addEventListener('click', () => {
  setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
});
navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });
window.addEventListener('resize', closeMenuForDesktop, { passive: true });

const instrumentTabs = [...document.querySelectorAll('[data-screen]')];
const instrumentPanels = [...document.querySelectorAll('[data-panel]')];
instrumentPanels.forEach((panel) => { panel.hidden = !panel.classList.contains('is-active'); });
instrumentTabs.forEach((tab) => {
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-selected', String(tab.classList.contains('is-active')));
  tab.addEventListener('click', () => {
    const screen = tab.dataset.screen;
    instrumentTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.setAttribute('tabindex', active ? '0' : '-1');
    });
    instrumentPanels.forEach((panel) => {
      const active = panel.dataset.panel === screen;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  });
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = (instrumentTabs.indexOf(tab) + direction + instrumentTabs.length) % instrumentTabs.length;
    instrumentTabs[next].focus();
    instrumentTabs[next].click();
  });
});

const familyButtons = [...document.querySelectorAll('[data-family].family-rail button, .family-rail [data-family]')];
const packRows = [...document.querySelectorAll('.pack-table tbody [data-family]')];
familyButtons.forEach((button) => {
  button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
  button.addEventListener('click', () => {
    const family = button.dataset.family;
    familyButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    packRows.forEach((row) => {
      row.hidden = family !== 'all' && row.dataset.family !== family;
    });
  });
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries, revealObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach((element) => observer.observe(element));
}
