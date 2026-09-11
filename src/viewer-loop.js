// Draw only when visible and dirty, or while a visible model is rotating.
export function createRenderLoop({ draw, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame }) {
  let active = false;
  let continuous = false;
  let disposed = false;
  let pending = null;
  let previous = null;

  const invalidate = () => {
    if (active && !disposed && pending === null) pending = requestFrame(frame);
  };
  const frame = (now) => {
    pending = null;
    if (!active || disposed) return;
    const dt = previous === null ? 0 : Math.max(0, Math.min((now - previous) / 1000, 0.05));
    previous = now;
    draw(now, dt);
    if (continuous) invalidate();
  };
  const stop = () => {
    if (pending !== null) cancelFrame(pending);
    pending = null;
    previous = null;
  };
  return {
    invalidate,
    setActive(value) {
      active = Boolean(value);
      if (active) invalidate();
      else stop();
    },
    setContinuous(value) {
      continuous = Boolean(value);
      previous = null;
      invalidate();
    },
    dispose() {
      disposed = true;
      stop();
    },
  };
}
