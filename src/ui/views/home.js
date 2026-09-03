import { button, sectionHeading, stat, badge, avatar, icon, escapeHtml } from '../components.js';
import { quartersToCt } from '../../domain/ct.js';
import { pendingActionForUser, activitySummary } from '../../application/selectors.js';

export function renderHome({ state, service }) {
  const user = state.users.find((item) => item.id === state.activeUserId);
  const balances = service.getBalances(user.id);
  const pending = pendingActionForUser(state, user.id);
  const summary = activitySummary(state, user.id);
  const requests = state.requests.filter((r) => r.requesterId === user.id && r.status === 'OPEN').slice(0, 2);
  const recommended = state.offers.filter((o) => o.providerId !== user.id).slice(0, 4);
  return `<main id="main" class="page page-home">
    <section class="hero-grid container">
      <div class="hero-copy">
        <span class="eyebrow">Tu red empieza cerca</span>
        <h1>Conectá lo que podés aportar con lo que necesitás.</h1>
        <p>Compartí tiempo, resolvé necesidades y construí confianza con personas de tu comunidad.</p>
        <div class="hero-actions">${button('Explorar oportunidades', { href: '#/explorar', iconName: 'search' })}${button('Cómo funciona', { href: '#/como-funciona', tone: 'secondary' })}</div>
        <div class="cluster-note">${icon('map', 18)} Piloto demo · Almagro, Caballito y Villa Crespo</div>
      </div>
      <aside class="balance-hero" aria-label="Saldo de Créditos de Tiempo">
        <div class="balance-top"><div><span>Tu tiempo disponible</span><strong>${quartersToCt(balances.available)} <small>CT</small></strong></div><span class="balance-icon">${icon('clock', 28)}</span></div>
        <p><strong>1 CT = 15 minutos.</strong> El tiempo de todos vale lo mismo.</p>
        <div class="balance-split"><div><span>Disponibles</span><strong>${quartersToCt(balances.available)} CT</strong></div><div><span>Reservados</span><strong>${quartersToCt(balances.held)} CT</strong></div></div>
        <a href="#/historial">Ver movimientos ${icon('chevron', 15)}</a>
      </aside>
    </section>

    <section class="container dashboard-section">
      <div class="quick-grid">
        <div class="welcome-card"><span class="eyebrow">Hola, ${escapeHtml(user.name.split(' ')[0])}</span><h2>¿Qué querés hacer hoy?</h2><div class="quick-actions"><a href="#/ofertas/nueva" class="quick-action"><span>${icon('plus', 22)}</span><strong>Ofrecer algo</strong><small>Convertí una habilidad en CT</small></a><a href="#/solicitudes/nueva" class="quick-action"><span>${icon('search', 22)}</span><strong>Pedir ayuda</strong><small>Usá tus CT para resolver algo</small></a></div></div>
        ${pending ? `<a class="pending-card" href="#/intercambios/${pending.exchange.id}"><span class="pending-kicker">Acción pendiente</span><strong>${escapeHtml(pending.label)}</strong><small>Intercambio ${escapeHtml(pending.exchange.category)} · ${pending.exchange.durationCt} CT</small><span class="pending-link">Resolver ahora ${icon('chevron', 16)}</span></a>` : `<div class="pending-card pending-clear"><span class="pending-kicker">Todo al día</span><strong>No tenés acciones urgentes</strong><small>Explorá la comunidad y encontrá tu próximo intercambio.</small><a class="pending-link" href="#/explorar">Explorar ${icon('chevron', 16)}</a></div>`}
      </div>
    </section>

    ${requests.length ? `<section class="container dashboard-section">${sectionHeading('Tus necesidades', 'Encontramos personas que podrían ayudarte')}<div class="request-match-grid">${requests.map((request) => {
      const match = service.findMatches(request.id)[0];
      if (!match) return '';
      return `<a class="match-teaser" href="#/solicitudes/${request.id}"><div class="match-person">${avatar(match.provider)}<div><span>Para “${escapeHtml(request.title)}”</span><strong>${escapeHtml(match.provider.name)}</strong><small>${escapeHtml(match.offer.title)}</small></div></div><div class="match-meta">${badge(`${match.score}% match`, 'positive')}<span>${match.offer.durationCt} CT</span>${icon('chevron', 18)}</div></a>`;
    }).join('')}</div></section>` : ''}

    <section class="container dashboard-section">${sectionHeading('Cerca tuyo', 'Personas con algo útil para compartir', 'Perfiles demo sembrados para probar la experiencia y la liquidez local.')}<div class="card-grid">${recommended.map((offer) => {
      const provider = state.users.find((u) => u.id === offer.providerId);
      return `<a class="service-card" href="#/ofertas/${offer.id}"><div class="service-card-top"><span class="service-icon">${icon(offer.modality === 'REMOTE' ? 'message' : 'map', 20)}</span>${badge(offer.modality === 'REMOTE' ? 'Remoto' : offer.neighborhood, 'soft')}</div><h3>${escapeHtml(offer.title)}</h3><p>${escapeHtml(offer.description)}</p><div class="service-person">${avatar(provider, 'sm')}<span><strong>${escapeHtml(provider.name)}</strong><small>${escapeHtml(provider.neighborhood)} · ${provider.verification === 'V2_DEMO' ? 'Identidad verificada · demo' : 'Perfil básico · demo'}</small></span></div><div class="service-footer"><strong>${offer.durationCt} CT <small>· ${offer.durationCt * 15} min</small></strong><span>Ver oferta ${icon('chevron', 15)}</span></div></a>`;
    }).join('')}</div></section>

    <section class="container impact-strip"><div><span class="eyebrow">Tu actividad</span><h2>Una red que crece con cada intercambio</h2></div><div class="impact-stats">${stat('Intercambios', String(summary.total), 'en tu historial')}${stat('Completados', String(summary.completed), 'valor entregado')}${stat('Activos', String(summary.active), 'en movimiento')}</div></section>
  </main>`;
}
