// =====================================================================
// Main entry point — initialize all modules
// =====================================================================

import { initRouter } from './router.js';
import { initProjectList } from './project-list.js';
import { initProjectDetail } from './project-detail.js';

// Initialize modules
initProjectList();
initProjectDetail();

// Initialize router
initRouter();

// Home wordmark click handler — only the YOUNG./ARCHITECT block is clickable
const homeWordmark = document.querySelector('.home__content');
if (homeWordmark) {
  homeWordmark.addEventListener('click', () => {
    window.location.hash = '#/menu';
  });
}

// Chrome navigation handlers
document.querySelectorAll('[data-nav="home"]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#/';
  });
});

document.querySelectorAll('[data-nav="menu"]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#/menu';
  });
});

// Menu item handlers
document.querySelectorAll('.menu__item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const href = item.getAttribute('href');
    if (href) {
      window.location.hash = href;
    }
  });
});
