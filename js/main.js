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

// Contact — click email to copy, with transient feedback
const contactEmail = document.querySelector('.contact-link');
if (contactEmail) {
  const email = contactEmail.dataset.email;
  const sub = document.querySelector('.contact-sub');
  const defaultLabel = email;
  const defaultSub = sub ? sub.dataset.default : '';
  let resetTimer = null;

  const fallbackCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  };

  contactEmail.addEventListener('click', async () => {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
        ok = true;
      } else {
        ok = fallbackCopy(email);
      }
    } catch (_) {
      ok = fallbackCopy(email);
    }

    if (!ok) {
      if (sub) sub.textContent = 'Press Ctrl+C to copy';
    } else {
      contactEmail.textContent = 'Copied ✓';
      contactEmail.classList.add('is-copied');
      if (sub) sub.textContent = 'Email copied to clipboard';
    }

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      contactEmail.textContent = defaultLabel;
      contactEmail.classList.remove('is-copied');
      if (sub) sub.textContent = defaultSub;
    }, 1800);
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
