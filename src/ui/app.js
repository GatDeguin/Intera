import { createSeedState } from '../demo/seed.js';
import { createLocalRepository } from '../persistence/local-repository.js';
import { DemoService } from '../application/demo-service.js';
import { currentRoute } from './router.js';
import { renderAppShell, escapeHtml, avatar, icon, button } from './components.js';
import { renderHome } from './views/home.js';
import { renderExplore, renderPublish, renderNewOffer, renderNewRequest, renderOfferDetail, renderRequestDetail, renderProfile, renderOnboarding, renderHistory, renderHowItWorks } from './views/marketplace.js';
import { renderExchanges, renderExchangeDetail } from './views/exchanges.js';
import { runFormAction, runClickAction } from './controller.js';
import { matchesExploreCard } from './explore-filter.js';

const repository = createLocalRepository({ storage: window.localStorage, seedFactory: createSeedState });
export const service = new DemoService(repository);
const root = document.querySelector('#app');
let selectedExploreCategory = 'Todo';

function routeContent(route, state) {
  if (route.name === 'home') return renderHome({ state, service });
  if (route.name === 'explore') return renderExplore({ state, service });
  if (route.name === 'publish') return renderPublish({ state, service });
  if (route.name === 'new-offer') return renderNewOffer({ state, service });
  if (route.name === 'new-request') return renderNewRequest({ state, service });
  if (route.name === 'offer') return renderOfferDetail({ state, service, offerId: route.id });
  if (route.name === 'request') return renderRequestDetail({ state, service, requestId: route.id });
  if (route.name === 'profile') return renderProfile({ state, service, userId: route.id });
  if (route.name === 'my-profile') return renderProfile({ state, service, userId: state.activeUserId });
  if (route.name === 'onboarding') return renderOnboarding({ state, service });
  if (route.name === 'exchanges') return renderExchanges({ state, service });
  if (route.name === 'exchange-detail') return renderExchangeDetail({ state, service, exchangeId: route.id });
  if (route.name === 'history') return renderHistory({ state, service });
  if (route.name === 'how') return renderHowItWorks({ state, service });
  return `<main id="main" class="page container simple-page"><span class="eyebrow">En construcción</span><h1>${escapeHtml(route.path)}</h1><p>Esta sección forma parte del vertical slice de INTERA.</p>${button('Volver al inicio', { href: '#/', tone: 'secondary' })}</main>`;
}

export function render() {
  const state = service.getState();
  const route = currentRoute();
  const activeUser = state.users.find((user) => user.id === state.activeUserId);
  root.innerHTML = renderAppShell({ content: routeContent(route, state), activeUser, balances: service.getBalances(), route: route.path });
  if (route.name === 'explore') applyExploreFilters();
}

function applyExploreFilters({ selectedCategory = selectedExploreCategory } = {}) {
  selectedExploreCategory = selectedCategory;
  const input = document.querySelector('#explore-search');
  const query = input?.value || '';
  document.querySelectorAll('[data-offer-grid] [data-category]').forEach((card) => {
    card.hidden = !matchesExploreCard(
      { category: card.dataset.category, search: card.dataset.search },
      { selectedCategory, query },
    );
  });
  document.querySelectorAll('[data-action="filter-category"]').forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.category === selectedCategory);
  });
}

function showDemoPanel() {
  const state = service.getState();
  const active = state.activeUserId;
  document.querySelector('#demo-panel-root').innerHTML = `<div class="modal-backdrop" data-action="close-demo-panel"><section class="demo-panel" role="dialog" aria-modal="true" aria-labelledby="demo-panel-title" data-dialog><div class="panel-head"><div><span class="eyebrow">Modo demo local</span><h2 id="demo-panel-title">Cambiá de perspectiva</h2><p>Actuá como cualquiera de estos perfiles ficticios para completar ambos lados del intercambio.</p></div><button class="icon-btn" data-action="close-demo-panel" aria-label="Cerrar">×</button></div><div class="demo-user-list">${state.users.map((user) => `<button class="demo-user-row ${user.id === active ? 'is-active' : ''}" data-action="switch-user" data-user-id="${user.id}">${avatar(user)}<span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.neighborhood)} · ${user.verification === 'V2_DEMO' ? 'V2 demo' : 'V1 demo'}</small></span>${user.id === active ? `<span class="selected-check">${icon('check', 18)}</span>` : icon('chevron', 17)}</button>`).join('')}</div><div class="panel-footer"><a href="#/onboarding" class="btn btn-secondary">${icon('plus', 17)} Crear perfil demo</a><button class="btn btn-ghost danger" data-action="reset-demo">${icon('reset', 17)} Restablecer demo</button></div><p class="demo-disclaimer">Los datos, verificaciones y reputación de esta experiencia son simulados y permanecen únicamente en este navegador.</p></section></div>`;
  requestAnimationFrame(() => document.querySelector('[data-dialog] button')?.focus());
}

function flash(message, tone = 'success') {
  const region = document.querySelector('#flash-region');
  if (!region) return;
  region.innerHTML = `<div class="flash flash-${tone}">${tone === 'success' ? icon('check', 17) : icon('info', 17)} ${escapeHtml(message)}</div>`;
  setTimeout(() => { if (region) region.innerHTML = ''; }, 3200);
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'toggle-demo-panel') { showDemoPanel(); return; }
  if (action === 'filter-category') { applyExploreFilters({ selectedCategory: target.dataset.category }); return; }
  if (action === 'search-explore') { applyExploreFilters(); return; }
  if (action === 'close-demo-panel') {
    if (event.target === target || target.matches('.icon-btn')) document.querySelector('#demo-panel-root').innerHTML = '';
    return;
  }
  try {
    const result = runClickAction(service, action, { userId: target.dataset.userId, exchangeId: target.dataset.exchangeId });
    if (action === 'switch-user' || action === 'reset-demo') document.querySelector('#demo-panel-root').innerHTML = '';
    if (result.route) location.hash = `#${result.route}`;
    render();
    if (result.message) flash(result.message);
  } catch (error) {
    flash(error.message || 'No se pudo actualizar la demo.', 'error');
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-form]');
  if (!form) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const result = runFormAction(service, form.dataset.form, data);
    if (result.route) location.hash = `#${result.route}`;
    render();
    if (result.message) flash(result.message);
    if (result.focus === 'chat') document.querySelector('.chat-form input[name="text"]')?.focus();
  } catch (error) {
    flash(error.message || 'No se pudo completar la acción.', 'error');
  }
});

window.addEventListener('hashchange', render);
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
render();
