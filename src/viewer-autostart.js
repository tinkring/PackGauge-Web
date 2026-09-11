// Start once the page is loaded and the hero is visible. Manual controls stay
// available when a visitor asks for less motion or reduced data use.
export function scheduleViewerStart(root, start, { page = window, doc = document } = {}) {
  const motion = page.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = page.navigator.connection;
  const events = new AbortController();
  const options = { signal: events.signal };
  const bounds = root.getBoundingClientRect();
  let visible = bounds.bottom > 0 && bounds.top < page.innerHeight;
  let stopped = false;
  let observer;

  const stop = () => {
    stopped = true;
    observer?.disconnect();
    events.abort();
  };
  const attempt = () => {
    if (stopped || doc.readyState !== 'complete' || doc.hidden || !visible || motion.matches || connection?.saveData) return;
    stop();
    start();
  };
  if (page.IntersectionObserver) {
    observer = new page.IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      attempt();
    });
    observer.observe(root);
  }
  page.addEventListener('load', attempt, options);
  doc.addEventListener('visibilitychange', attempt, options);
  motion.addEventListener('change', attempt, options);
  connection?.addEventListener?.('change', attempt, options);
  attempt();
  return stop;
}
