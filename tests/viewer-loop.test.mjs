import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderLoop } from '../src/viewer-loop.js';

function harness() {
  const queued = new Map();
  const draws = [];
  let id = 0;
  const loop = createRenderLoop({
    draw: (now, dt) => draws.push({ now, dt }),
    requestFrame: (callback) => { queued.set(++id, callback); return id; },
    cancelFrame: (key) => queued.delete(key),
  });
  return { loop, queued, draws, tick(now) {
    const callbacks = [...queued.values()];
    queued.clear();
    callbacks.forEach((callback) => callback(now));
  } };
}

test('a static viewer draws once and redraws only when its view changes', () => {
  const h = harness();
  h.loop.setActive(true);
  h.tick(0);
  assert.equal(h.draws.length, 1);
  assert.equal(h.queued.size, 0);
  h.loop.invalidate();
  h.loop.invalidate();
  assert.equal(h.queued.size, 1);
  h.tick(16);
  assert.equal(h.draws.length, 2);
  assert.equal(h.queued.size, 0);
});

test('leaving the viewport or hiding the page stops work, including pending frames', () => {
  const h = harness();
  h.loop.setContinuous(true);
  h.loop.setActive(true);
  h.tick(0);
  assert.equal(h.queued.size, 1);
  h.loop.setActive(false);
  h.loop.invalidate();
  assert.equal(h.queued.size, 0);
  h.tick(10000);
  assert.equal(h.draws.length, 1);
  h.loop.setActive(true);
  h.tick(20000);
  assert.equal(h.draws.at(-1).dt, 0);
  assert.equal(h.queued.size, 1);
});

test('pausing rotation stops continuous rendering while allowing manual rotation', () => {
  const h = harness();
  h.loop.setActive(true);
  h.loop.setContinuous(true);
  h.tick(0);
  h.loop.setContinuous(false);
  h.tick(16);
  assert.equal(h.queued.size, 0);
  h.loop.invalidate();
  h.tick(32);
  assert.equal(h.draws.length, 3);
  assert.equal(h.queued.size, 0);
});

test('slow frames are bounded and disposed viewers cannot schedule more work', () => {
  const h = harness();
  h.loop.setContinuous(true);
  h.loop.setActive(true);
  h.tick(0);
  h.tick(5000);
  assert.equal(h.draws.at(-1).dt, 0.05);
  h.loop.dispose();
  h.loop.setActive(true);
  h.loop.setContinuous(true);
  h.loop.invalidate();
  assert.equal(h.queued.size, 0);
});
