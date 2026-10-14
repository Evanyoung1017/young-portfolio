// =====================================================================
// Project Detail — independent per-project gallery
//
// Each detail view contains ONLY the sheets of the project entered;
// you can never scroll from one project into another. The page is pure
// imagery: no titles, no captions. Motion = momentum glide with a
// seamless ease settle, plus per-image parallax/depth while scrolling.
// =====================================================================

import { getProjectById } from './data.js';
import { navigateTo } from './router.js';
import { attachWheelPaging } from './scroll-paging.js';

let track = null;
let pager = null;
let progressEl = null;
let backBtn = null;

let isActive = false;
let frameEls = [];
let imgEls = [];
let dotEls = [];
let rafScheduled = false;

function render(project) {
  const pages = (project.pages && project.pages.length)
    ? project.pages
    : [project.imageUrl];

  // ---- Sheets (images only, nothing floats over them) ----
  track.innerHTML = pages.map((src, i) => `
    <div class="detail-slide">
      <div class="detail-slide__frame is-entering" style="--d:${i * 70}ms">
        <a class="detail-slide__link" href="${src}" target="_blank" rel="noopener">
          <img src="${src}" alt="${project.title} — sheet ${i + 1}"
               draggable="false" decoding="async"
               loading="${i === 0 ? 'eager' : 'lazy'}">
        </a>
      </div>
    </div>
  `).join('');

  frameEls = [...track.querySelectorAll('.detail-slide__frame')];
  imgEls = [...track.querySelectorAll('.detail-slide__frame img')];

  // Trigger staggered entrance after paint (two rAFs so the hidden
  // state is committed before transitions run).
  requestAnimationFrame(() => requestAnimationFrame(() => {
    frameEls.forEach(el => el.classList.remove('is-entering'));
  }));

  // ---- Minimal progress dots (no text) ----
  progressEl.innerHTML = pages.map((_, i) =>
    `<button class="detail-dot${i === 0 ? ' is-active' : ''}" data-page="${i}" aria-label="Go to sheet ${i + 1}" style="--p:${i === 0 ? 1 : 0}"></button>`
  ).join('');
  dotEls = [...progressEl.children];
  dotEls.forEach(dot => {
    dot.addEventListener('click', () => pager && pager.goTo(Number(dot.dataset.page)));
  });

  // Reset to the first sheet
  track.scrollLeft = 0;
}

// ---- Scroll-driven image depth: parallax drift + gentle scale ----
function onScroll() {
  if (!isActive || rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    if (!isActive) return;

    const w = track.clientWidth;
    const P = track.scrollLeft / w;

    imgEls.forEach((img, i) => {
      const d = P - i;
      if (Math.abs(d) > 1.3) {
        img.style.opacity = '0';
        return;
      }
      const ad = Math.min(Math.abs(d), 1);
      const drift = -d * 90;             // counter-motion -> spatial depth
      const scale = 1 - ad * 0.045;      // breathing scale between sheets
      img.style.transform =
        `translate3d(${drift.toFixed(2)}px,0,0) scale(${scale.toFixed(4)})`;
      img.style.opacity = (1 - ad * 0.30).toFixed(3);
    });

    // Dots respond continuously to scroll position
    dotEls.forEach((dot, i) => {
      const proximity = Math.max(0, 1 - Math.abs(P - i));
      dot.style.setProperty('--p', proximity.toFixed(3));
      dot.classList.toggle('is-active', Math.round(P) === i);
    });
  });
}

function onKeyDown(e) {
  if (!isActive) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    pager.page(1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    pager.page(-1);
  } else if (e.key === 'Escape') {
    navigateTo('/projects');
  }
}

export function initProjectDetail() {
  track = document.getElementById('detailTrack');
  progressEl = document.getElementById('detailProgress');
  backBtn = document.getElementById('detailBack');

  // Paged browsing: one physical wheel detent = one sheet. A high-res
  // wheel's per-detent event burst is coalesced (120ms window, 80px
  // accumulated) so it can never flip twice. The 380ms glide allows a
  // second detent (in its last 45%) to pre-arm the next sheet and chain
  // without the old ~1s dead wait.
  pager = attachWheelPaging(track, {
    mode: 'paged',
    settleMax: 380,
    chainAt: 0.55,
    turnGateMs: 120,
    burstMs: 120,
    notchAccum: 80,
    snap: true,
    isEnabled: () => isActive
  });

  track.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKeyDown);

  backBtn.addEventListener('click', () => navigateTo('/projects'));

  window.addEventListener('route:enter', (e) => {
    if (e.detail.view !== 'detail') return;
    const project = getProjectById(e.detail.params.id);
    if (!project) {
      navigateTo('/projects');
      return;
    }
    isActive = true;
    render(project);
  });

  window.addEventListener('route:leave', (e) => {
    if (e.detail.view !== 'detail') return;
    isActive = false;
    // Clear so every project opens as its own self-contained gallery
    track.innerHTML = '';
    progressEl.innerHTML = '';
    track.scrollLeft = 0;
    frameEls = [];
    imgEls = [];
    dotEls = [];
  });
}
