import { quartersToCt } from '../domain/ct.js';

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

export function icon(name, size = 20) {
  const paths = {
    home: '<path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    exchange: '<path d="M7 7h11l-3-3m3 3-3 3M17 17H6l3 3m-3-3 3-3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 3 5 6v5c0 4.7 2.8 8.5 7 10 4.2-1.5 7-5.3 7-10V6z"/><path d="m9.5 12 1.7 1.7 3.6-3.8"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    message: '<path d="M4 5h16v11H8l-4 4z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    spark: '<path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    map: '<path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
    reset: '<path d="M4 4v6h6"/><path d="M5.5 9a8 8 0 1 1-.2 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}

export function renderLogo({ compact = false } = {}) {
  return `<a class="brand" href="#/" aria-label="INTERA, inicio"><img src="./assets/intera-mark.svg" alt="" width="38" height="38"><span class="brand-word${compact ? ' sr-only' : ''}">intera</span></a>`;
}

export function avatar(user, size = 'md') {
  return `<span class="avatar avatar-${size}" aria-hidden="true">${escapeHtml(user?.avatar || '?')}</span>`;
}

export function badge(text, tone = 'neutral') {
  return `<span class="badge badge-${tone}">${escapeHtml(text)}</span>`;
}

export function button(label, { href, action, tone = 'primary', iconName, attrs = '' } = {}) {
  const inner = `${iconName ? icon(iconName, 18) : ''}<span>${escapeHtml(label)}</span>`;
  if (href) return `<a class="btn btn-${tone}" href="${href}" ${attrs}>${inner}</a>`;
  return `<button class="btn btn-${tone}" type="button" ${action ? `data-action="${action}"` : ''} ${attrs}>${inner}</button>`;
}

export function renderAppShell({ content, activeUser, balances, route = '/' }) {
  const nav = [
    ['/', 'Inicio', 'home'], ['/explorar', 'Explorar', 'search'], ['/publicar', 'Publicar', 'plus'], ['/intercambios', 'Intercambios', 'exchange'], ['/mi-perfil', 'Perfil', 'user'],
  ];
  const availableCt = quartersToCt(balances?.available || 0);
  return `
  <div class="app-shell">
    <a class="skip-link" href="#main">Saltar al contenido</a>
    <header class="topbar">
      <div class="topbar-inner">
        ${renderLogo()}
        <nav class="desktop-nav" aria-label="Navegación principal">
          ${nav.slice(0, 4).map(([path, label]) => `<a href="#${path}" class="desktop-link ${route === path ? 'is-active' : ''}">${label}</a>`).join('')}
        </nav>
        <div class="top-actions">
          <span class="demo-pill">${icon('spark', 15)} Modo demo local</span>
          <button class="user-chip" type="button" data-action="toggle-demo-panel" aria-haspopup="dialog" aria-label="Cambiar usuario demo">
            ${avatar(activeUser, 'sm')}
            <span class="user-chip-copy"><strong>${escapeHtml(activeUser?.name || 'Usuario')}</strong><small>${escapeHtml(activeUser?.neighborhood || '')}</small></span>
            ${icon('chevron', 15)}
          </button>
        </div>
      </div>
    </header>
    <div class="mobile-balance-strip"><span>${icon('clock', 16)} Disponible</span><strong>${availableCt} CT</strong><span class="demo-mini">DEMO</span></div>
    <div id="flash-region" class="flash-region" role="status" aria-live="polite"></div>
    ${content}
    <nav class="mobile-nav" aria-label="Navegación principal móvil">
      ${nav.map(([path, label, iconName]) => `<a href="#${path}" class="mobile-nav-item ${route === path ? 'is-active' : ''}">${icon(iconName, 21)}<span>${label}</span></a>`).join('')}
    </nav>
    <div id="demo-panel-root"></div>
  </div>`;
}

export function sectionHeading(eyebrow, title, copy = '') {
  return `<div class="section-heading"><div><span class="eyebrow">${escapeHtml(eyebrow)}</span><h2>${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ''}</div></div>`;
}

export function stat(label, value, help = '') {
  return `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${help ? `<small>${escapeHtml(help)}</small>` : ''}</div>`;
}

export function emptyState(title, copy, actionHtml = '') {
  return `<div class="empty-state"><span class="empty-icon">${icon('spark', 24)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p>${actionHtml}</div>`;
}
