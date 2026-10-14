// =====================================================================
// Project List — horizontal B&W cards in their NATURAL layout.
// Cards keep their original spacing; the row only scrolls (and the
// pager only appears) when content overflows — e.g. 2 projects may fit
// the screen, 4 will paginate. Momentum glide + seamless ease settle.
// =====================================================================

import { projects } from './data.js';
import { navigateTo } from './router.js';
import { attachWheelPaging } from './scroll-paging.js';

let rendered = false;
let isActive = false;

const container = document.getElementById('projectList');
const prevBtn = document.getElementById('pagerPrev');
const nextBtn = document.getElementById('pagerNext');
const currentEl = document.getElementById('pagerCurrent');
const totalEl = document.getElementById('pagerTotal');
const controlsEl = document.getElementById('pagerControls');
const countEl = document.getElementById('projectCount');

const pad2 = (n) => String(n).padStart(2, '0');

function updateControls(index, count) {
  if (currentEl) currentEl.textContent = pad2(Math.min(index + 1, count));
  if (totalEl) totalEl.textContent = pad2(count);
  if (prevBtn) prevBtn.classList.toggle('is-disabled', index <= 0);
  if (nextBtn) nextBtn.classList.toggle('is-disabled', index >= count - 1);
}

const pager = attachWheelPaging(container, {
  impulse: 13,       // gentle velocity per wheel notch
  decay: 4.2,        // cards settle a bit quicker
  maxSpeed: 5200,
  settleSpeed: 80,
  settleMax: 700,
  snap: true,
  onIndexChange: updateControls,
});

// Buttons
prevBtn.addEventListener('click', () => pager.page(-1));
nextBtn.addEventListener('click', () => pager.page(1));

// Keyboard
window.addEventListener('keydown', (e) => {
  if (!isActive) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    pager.page(1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    pager.page(-1);
  }
});

// Show pager controls only when the row actually overflows.
function syncOverflow() {
  const scrollable = container.scrollWidth > container.clientWidth + 1;
  if (controlsEl) controlsEl.classList.toggle('is-hidden', !scrollable);
  return scrollable;
}

let resizeRaf = null;
window.addEventListener('resize', () => {
  if (!isActive) return;
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null;
    syncOverflow();
    updateControls(pager.getIndex(), pager.getCount());
  });
});

function render() {
  if (rendered) return;
  if (!container) return;

  container.innerHTML = projects.map(project => `
    <article class="project-card" data-id="${project.id}">
      <div class="project-card__image">
        <img src="${project.imageUrl}" alt="${project.title}" loading="lazy" decoding="async">
      </div>
      <div class="project-card__info">
        <div>
          <h3 class="project-card__title">${project.title}</h3>
          <p class="project-card__meta">${project.type} · ${project.year} · ${project.location}</p>
        </div>
        <span class="project-card__number">${project.index}</span>
      </div>
    </article>
  `).join('');

  container.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo(`/project/${card.dataset.id}`);
    });
  });

  if (countEl) countEl.textContent = `${projects.length} works`;

  rendered = true;
}

export function initProjectList() {
  window.addEventListener('route:enter', (e) => {
    if (e.detail.view === 'projects') {
      isActive = true;
      render();
      container.scrollLeft = 0;
      // Wait for cover images/layout, then decide whether paging exists.
      requestAnimationFrame(() => {
        syncOverflow();
        updateControls(pager.getIndex(), pager.getCount());
      });
    }
  });

  window.addEventListener('route:leave', (e) => {
    if (e.detail.view === 'projects') {
      isActive = false;
    }
  });
}
