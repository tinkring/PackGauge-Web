import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleViewerStart } from '../src/viewer-autostart.js';

function fixture({ loaded = true, hidden = false, visible = true, reduce = false, saveData = false } = {}) {
  const page = new EventTarget();
  const doc = Object.assign(new EventTarget(), { readyState: loaded ? 'complete' : 'interactive', hidden });
  const motion = Object.assign(new EventTarget(), { matches: reduce });
  const connection = Object.assign(new EventTarget(), { saveData });
  let observer;
  Object.assign(page, {
    innerHeight: 800,
    navigator: { connection },
    matchMedia: () => motion,
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; observer = this; }
      observe() {}
      disconnect() { this.disconnected = true; }
      report(isIntersecting) { this.callback([{ isIntersecting }]); }
    },
  });
  const root = { getBoundingClientRect: () => ({ top: visible ? 80 : 900, bottom: visible ? 480 : 1300 }) };
  let starts = 0;
  const cancel = scheduleViewerStart(root, () => starts++, { page, doc });
  return { page, doc, motion, connection, observer, cancel, starts: () => starts };
}

test('automatic 3D waits for page load, then starts only once', () => {
  const f = fixture({ loaded: false });
  assert.equal(f.starts(), 0);
  f.doc.readyState = 'complete';
  f.page.dispatchEvent(new Event('load'));
  assert.equal(f.starts(), 1);
  assert.equal(f.observer.disconnected, true);
  f.page.dispatchEvent(new Event('load'));
  f.observer.report(true);
  assert.equal(f.starts(), 1);
});

test('automatic 3D waits until both the hero and browser tab are visible', () => {
  const f = fixture({ hidden: true, visible: false });
  f.observer.report(true);
  assert.equal(f.starts(), 0);
  f.doc.hidden = false;
  f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.starts(), 1);
});

test('reduced motion leaves the poster until the preference changes', () => {
  const f = fixture({ reduce: true });
  assert.equal(f.starts(), 0);
  f.motion.matches = false;
  f.motion.dispatchEvent(new Event('change'));
  assert.equal(f.starts(), 1);
});

test('data saver leaves the poster until the preference changes', () => {
  const f = fixture({ saveData: true });
  assert.equal(f.starts(), 0);
  f.connection.saveData = false;
  f.connection.dispatchEvent(new Event('change'));
  assert.equal(f.starts(), 1);
});

test('manual opening cancels the pending automatic attempt', () => {
  const f = fixture({ loaded: false });
  f.cancel();
  f.doc.readyState = 'complete';
  f.page.dispatchEvent(new Event('load'));
  f.observer.report(true);
  assert.equal(f.starts(), 0);
  assert.equal(f.observer.disconnected, true);
});
