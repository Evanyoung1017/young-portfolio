// =====================================================================
// Router — hash-based navigation with view switching
// =====================================================================

const ROUTES = {
  '/': 'home',
  '/menu': 'menu',
  '/projects': 'projects',
  '/others': 'others',
  '/contact': 'contact'
};

// Dynamic route pattern for project detail
const PROJECT_PATTERN = /^\/project\/(.+)$/;

let currentView = null;

function parseRoute() {
  const hash = window.location.hash.slice(1) || '/';

  // Check for project detail route
  const projectMatch = hash.match(PROJECT_PATTERN);
  if (projectMatch) {
    return { view: 'detail', params: { id: projectMatch[1] } };
  }

  // Check static routes
  if (ROUTES[hash]) {
    return { view: ROUTES[hash], params: {} };
  }

  // Default to home
  return { view: 'home', params: {} };
}

function setActiveView(viewName) {
  // Update body data attribute
  document.body.dataset.view = viewName;

  // Update view visibility
  document.querySelectorAll('.view').forEach(el => {
    el.classList.toggle('is-active', el.dataset.view === viewName);
  });
}

function dispatchRouteEvent(type, route) {
  window.dispatchEvent(new CustomEvent(`route:${type}`, {
    detail: route
  }));
}

function navigate() {
  const route = parseRoute();

  // Dispatch leave event for current view
  if (currentView && currentView.view !== route.view) {
    dispatchRouteEvent('leave', currentView);
  }

  // Set new active view
  setActiveView(route.view);

  // Dispatch enter event
  dispatchRouteEvent('enter', route);

  currentView = route;
}

export function navigateTo(path) {
  window.location.hash = path;
}

export function initRouter() {
  window.addEventListener('hashchange', navigate);
  navigate();
}
