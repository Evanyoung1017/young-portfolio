// =====================================================================
// Momentum horizontal scroller with a seamless release settle.
//
// Two-phase motion, all driven by our OWN rAF loop:
//   1. GLIDE   — wheel input becomes velocity; exponential-decay inertia
//                lets the page drift continuously (fast rolls fling
//                through several sheets/cards in one motion).
//   2. SETTLE  — when the glide slows, the position eases from WHERE IT
//                CURRENTLY IS to the nearest snap point in one unbroken
//                animation (easeOutQuint). CSS scroll-snap stays SUSPENDED
//                for the whole motion and is only re-armed once the
//                position already equals the snap point — so the browser
//                can never "flash-jump" a resting midpoint onto a page.
//
// Touch / trackpad horizontal swipes keep native scrolling & snapping.
// Public API: page(dir), goTo(i), getIndex(), getCount().
// =====================================================================

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const easeOutQuint = (t) => 1 - Math.pow(1 - t, 3.2);

export function getSnapPoints(container) {
  const cs = getComputedStyle(container);
  const padLeft = parseFloat(cs.scrollPaddingLeft) || 0;
  const max = container.scrollWidth - container.clientWidth;
  return [...container.children]
    .map((el) => clamp(el.offsetLeft - padLeft, 0, Math.max(0, max)))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a - b);
}

// Normalise wheel delta to "pixel-ish" units (line/page mode mice report
// tiny raw numbers: one detent can be deltaY=1-3 lines).
function wheelDeltaPx(deltaY, deltaMode, clientHeight) {
  if (deltaMode === 1) return deltaY * 33;            // lines
  if (deltaMode === 2) return deltaY * clientHeight; // pages
  return deltaY;                                     // pixels
}

function nearestIndex(points, value) {
  let best = 0;
  let bestD = Infinity;
  points.forEach((p, i) => {
    const d = Math.abs(p - value);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

export function attachWheelPaging(container, options = {}) {
  const {
    mode = 'momentum',     // 'momentum' (free inertia glide) | 'paged'
    impulse = 22,          // px/s velocity added per unit of wheel deltaY
    decay = 3.2,           // inertia decay (1/s) — smaller = longer glide
    maxSpeed = 7500,       // px/s
    settleSpeed = 70,      // below this speed the glide becomes a settle
    settleMax = 850,       // max settle duration (ms)
    // paged feel tuning
    chainAt = 0.55,        // a notch after this fraction of the turn pre-arms
                           // the NEXT sheet, so two quick notches chain with
                           // no dead wait — still strictly one sheet/notch
    turnGateMs = 120,      // min gap between accepted notches
    burstMs = 120,         // wheel events closer than this are fragments of
                           // ONE physical detent (high-res/smooth-scroll mice)
    notchAccum = 80,       // accumulated normalised |deltaY| per burst that
                           // fires exactly one detent
    snap = true,
    isEnabled = () => true,
    onIndexChange = null,
  } = options;

  let points = [];

  // one shared loop, two phases
  let phase = 'idle';      // 'idle' | 'glide' | 'settle'
  let rafId = null;
  let lastTime = 0;
  let pos = 0;
  let vel = 0;

  // settle params
  let settleFrom = 0;
  let settleTo = 0;
  let settleStart = 0;
  let settleDur = 0;

  let lastIndex = -1;

  // paged chaining: a single pre-armed next turn (never a growing queue)
  let lastTurnAt = 0;
  let chainedDir = 0;

  // wheel-event coalescing for ONE physical detent
  let burstAccum = 0;
  let burstDir = 0;
  let burstLastAt = 0;
  let suppressUntil = 0;

  function emitIndex() {
    if (!onIndexChange || !points.length) return;
    const idx = nearestIndex(points, container.scrollLeft);
    if (idx !== lastIndex) {
      lastIndex = idx;
      onIndexChange(idx, points.length);
    }
  }

  function refreshPoints() {
    points = options.getSnapPoints
      ? options.getSnapPoints(container)
      : getSnapPoints(container);
  }

  // CSS snap is only allowed to act while WE are not moving. Keeping it
  // armed (and already exactly on a snap point) means it can never jump.
  function suspendSnap() {
    if (container.style.scrollSnapType !== 'none') {
      container.style.scrollSnapType = 'none';
    }
  }

  function armSnap() {
    container.style.scrollSnapType = '';
  }

  function beginSettle(fromPos, targetIndex) {
    if (!snap || points.length <= 1) {
      stop();
      armSnap();
      emitIndex();
      return;
    }
    const idx = clamp(targetIndex, 0, points.length - 1);
    settleFrom = fromPos;
    settleTo = points[idx];
    settleStart = performance.now();
    // Duration grows gently with travel distance — a short residual
    // drift finishes quickly; a far midpoint gets a long soft glide.
    const dist = Math.abs(settleTo - settleFrom);
    settleDur = clamp(260 + dist * 0.42, 300, settleMax);
    vel = 0;   // settle is position-driven; fresh wheel input starts clean
    phase = 'settle';
    suspendSnap();
    if (rafId == null) {
      lastTime = settleStart;
      rafId = requestAnimationFrame(step);
    }
  }

  function stop() {
    phase = 'idle';
    vel = 0;
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function startGlide() {
    pos = container.scrollLeft;
    phase = 'glide';
    suspendSnap();
    if (rafId == null) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(step);
    }
  }

  function step(now) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    dt = clamp(dt, 0.001, 0.05);

    if (phase === 'glide') {
      vel *= Math.exp(-decay * dt);
      pos += vel * dt;

      const max = container.scrollWidth - container.clientWidth;
      if (pos <= 0) { pos = 0; vel = 0; }
      if (pos >= max) { pos = max; vel = 0; }

      container.scrollLeft = pos;

      if (Math.abs(vel) < settleSpeed || vel === 0) {
        // Hand off WITHOUT a pause: ease continues from this exact spot.
        refreshPoints();
        beginSettle(pos, nearestIndex(points, pos));
        if (phase === 'idle') { armSnap(); emitIndex(); return; }
      }
    } else if (phase === 'settle') {
      const t = clamp((now - settleStart) / settleDur, 0, 1);
      pos = settleFrom + (settleTo - settleFrom) * easeOutQuint(t);
      container.scrollLeft = pos;

      if (t >= 1) {
        container.scrollLeft = settleTo;   // exact alignment
        pos = settleTo;
        stop();
        emitIndex();

        // A notch made late in this turn has pre-armed exactly ONE next
        // turn — chain it on this frame (no dead gap). Extra notches are
        // never stored, so a single detent still turns a single sheet.
        if (mode === 'paged' && chainedDir !== 0) {
          const dir = chainedDir;
          chainedDir = 0;
          const cur = nearestIndex(points, settleTo);
          const next = clamp(cur + dir, 0, points.length - 1);
          if (next !== cur) {
            lastTurnAt = now;
            beginSettle(settleTo, next);
            emitIndex();
            return;   // keep snap suspended across the chain
          }
        }

        armSnap();                          // safe: already on the point
        return;
      }
    }

    if (phase !== 'idle') rafId = requestAnimationFrame(step);
  }

  // ---- paged request shared by wheel / buttons / keys ----
  function requestPagedTurn(dir, now) {
    if (!points.length || points.length <= 1) return;
    if (phase === 'idle') {
      if (now - lastTurnAt < turnGateMs) return;
      const cur = nearestIndex(points, container.scrollLeft);
      const next = clamp(cur + dir, 0, points.length - 1);
      if (next === cur) return;             // boundary
      lastTurnAt = now;
      beginSettle(container.scrollLeft, next);
      emitIndex();
    } else if (phase === 'settle') {
      // Only pre-arm once the current turn is past its visual bulk
      // (easeOutQuint is ~95% done at chainAt) and the gate has elapsed.
      const t = (now - settleStart) / settleDur;
      if (t >= chainAt && now - lastTurnAt >= turnGateMs) {
        chainedDir = dir;   // single slot; later notches merely overwrite
      }
    }
  }

  // ---- adjacent targets (buttons / keys): same paged semantics ----
  function page(dir) {
    refreshPoints();
    requestPagedTurn(dir, performance.now());
  }

  function goTo(index) {
    refreshPoints();
    if (!points.length) return;
    chainedDir = 0;        // direct jump cancels a pre-armed turn
    burstAccum = 0;
    suppressUntil = 0;
    stop();
    beginSettle(container.scrollLeft, clamp(index, 0, points.length - 1));
    lastTurnAt = performance.now();
    emitIndex();
  }

  function getIndex() {
    refreshPoints();
    return points.length ? nearestIndex(points, container.scrollLeft) : 0;
  }

  function getCount() {
    refreshPoints();
    return points.length;
  }

  // ---- wheel handling ----
  function onWheel(e) {
    if (!isEnabled() || e.ctrlKey) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // native trackpad swipe
    e.preventDefault();

    refreshPoints();
    if (points.length <= 1) return;  // nothing to page through

    if (mode === 'paged') {
      // Coalesce all wheel events belonging to ONE physical detent into a
      // single turn: discrete mice fire one big event; high-res mice fire
      // a quick burst of small events. Each detected detent then behaves
      // exactly like one notch — start a turn or pre-arm the chained one.
      const now = performance.now();
      const dy = wheelDeltaPx(e.deltaY, e.deltaMode, container.clientHeight);
      const dir = dy > 0 ? 1 : -1;
      if (now < suppressUntil) return;                    // tail of a burst
      if (now - burstLastAt > burstMs || dir !== burstDir) {
        burstAccum = 0;                                   // a fresh detent
      }
      burstLastAt = now;
      burstDir = dir;
      burstAccum += Math.abs(dy);
      if (burstAccum >= notchAccum) {
        requestPagedTurn(dir, now);
        burstAccum = 0;
        suppressUntil = now + burstMs;
      }
      return;
    }

    // momentum mode: fresh input redirects in-flight motion seamlessly
    if (phase === 'settle') {
      pos = container.scrollLeft;
    }
    vel = clamp(vel + e.deltaY * impulse, -maxSpeed, maxSpeed);
    if (phase !== 'glide') startGlide();
  }

  container.addEventListener('wheel', onWheel, { passive: false });

  // Index reporting for native (touch/trackpad) movement.
  let scrollRaf = null;
  function onScroll() {
    if (phase === 'idle') pos = container.scrollLeft;
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      emitIndex();
    });
  }
  container.addEventListener('scroll', onScroll, { passive: true });

  refreshPoints();
  lastIndex = nearestIndex(points, container.scrollLeft);

  return {
    page,
    goTo,
    getIndex,
    getCount,
    detach() {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('scroll', onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      chainedDir = 0;
      burstAccum = 0;
      suppressUntil = 0;
      stop();
      armSnap();
    },
  };
}
