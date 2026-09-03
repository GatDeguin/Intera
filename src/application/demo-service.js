import { ctToQuarters } from '../domain/ct.js';
import { grantWelcomeCredit, holdCredits, releaseEscrow, refundEscrow, splitEscrow, getAccountBalances } from '../domain/ledger.js';
import { assertTransition } from '../domain/state-machine.js';
import { findMatchesForRequest } from '../domain/matching.js';
import { buildUserReputation } from '../domain/reputation.js';

export class DemoService {
  constructor(repository) {
    this.repository = repository;
    this.state = repository.load();
  }

  getState() { return structuredClone(this.state); }
  getActiveUser() { return structuredClone(this.mustUser(this.state.activeUserId)); }
  getExchange(id) { return structuredClone(this.mustExchange(id)); }
  getBalances(userId = this.state.activeUserId) { return getAccountBalances(this.state.ledger, userId); }

  switchUser(userId) {
    this.mustUser(userId);
    return this.commit((draft) => { draft.activeUserId = userId; return draft.users.find((user) => user.id === userId); });
  }

  createProfile(input) {
    validateRequired(input.name, 'nombre');
    validateNeighborhood(input.neighborhood);
    return this.commit((draft) => {
      const id = nextId(draft, 'user', 'u');
      const user = {
        id,
        name: input.name.trim(),
        neighborhood: input.neighborhood,
        intent: input.intent || 'BOTH',
        skills: [...(input.skills || [])].slice(0, 3),
        needs: [...(input.needs || [])].slice(0, 3),
        avatar: initials(input.name),
        verification: 'V1_DEMO',
        bio: input.bio?.trim() || 'Perfil creado en modo demo local.',
        createdAt: new Date().toISOString(),
      };
      draft.users.push(user);
      draft.activeUserId = id;
      grantWelcomeCredit(draft.ledger, id, `welcome:${id}`);
      return user;
    });
  }

  createOffer(input) {
    validateMarketInput(input);
    return this.commit((draft) => {
      const offer = {
        id: nextId(draft, 'offer', 'o'), providerId: draft.activeUserId,
        title: input.title.trim(), category: input.category, skill: input.skill || input.category,
        description: (input.description || '').trim(), modality: input.modality,
        neighborhood: input.neighborhood || this.mustUser(draft.activeUserId).neighborhood,
        durationCt: positiveInteger(input.durationCt, 'durationCt'), availability: input.availability || 'A coordinar', active: true,
      };
      draft.offers.unshift(offer);
      return offer;
    });
  }

  createRequest(input) {
    validateMarketInput(input);
    return this.commit((draft) => {
      const request = {
        id: nextId(draft, 'request', 'r'), requesterId: draft.activeUserId,
        title: input.title.trim(), category: input.category, modality: input.modality,
        neighborhood: input.neighborhood || this.mustUser(draft.activeUserId).neighborhood,
        durationCt: positiveInteger(input.durationCt, 'durationCt'), notes: (input.notes || '').trim(), status: 'OPEN',
      };
      draft.requests.unshift(request);
      return request;
    });
  }

  proposeExchange(input) {
    const durationCt = positiveInteger(input.durationCt, 'durationCt');
    const request = this.mustRequest(input.requestId);
    const offer = this.mustOffer(input.offerId);
    if (request.requesterId !== this.state.activeUserId) throw new Error('Solo el solicitante puede proponer.');
    if (offer.providerId !== input.providerId) throw new Error('Prestador inválido.');
    if (offer.providerId === request.requesterId) throw new Error('No podés intercambiar con vos mismo.');
    return this.commit((draft) => {
      const exchange = {
        id: nextId(draft, 'exchange', 'x'), requestId: request.id, offerId: offer.id,
        requesterId: request.requesterId, providerId: offer.providerId,
        category: request.category, modality: input.modality || request.modality,
        neighborhood: request.neighborhood, durationCt, quarters: ctToQuarters(durationCt),
        scheduledAt: input.scheduledAt || '', note: (input.note || '').trim(), status: 'REQUESTED',
        createdAt: new Date().toISOString(), timeline: [{ status: 'REQUESTED', at: new Date().toISOString() }],
      };
      draft.exchanges.unshift(exchange);
      draft.conversations.push({ exchangeId: exchange.id, messages: [] });
      return exchange;
    });
  }

  declineExchange(exchangeId) {
    const exchange = this.mustExchange(exchangeId);
    if (this.state.activeUserId !== exchange.providerId) throw new Error('Solo el prestador puede rechazar.');
    assertTransition(exchange.status, 'DECLINED');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      setStatus(current, 'DECLINED');
      current.outcome = 'DECLINED_BY_PROVIDER';
      return current;
    });
  }

  acceptExchange(exchangeId) {
    const exchange = this.mustExchange(exchangeId);
    if (this.state.activeUserId !== exchange.providerId) throw new Error('Solo el prestador puede aceptar.');
    assertTransition(exchange.status, 'ESCROWED');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      holdCredits(draft.ledger, { userId: current.requesterId, exchangeId, quarters: current.quarters, idempotencyKey: `hold:${exchangeId}` });
      setStatus(current, 'ESCROWED');
      return current;
    });
  }

  startExchange(exchangeId) {
    const exchange = this.mustExchange(exchangeId);
    if (![exchange.providerId, exchange.requesterId].includes(this.state.activeUserId)) throw new Error('No participás de este intercambio.');
    assertTransition(exchange.status, 'IN_PROGRESS');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      setStatus(current, 'IN_PROGRESS');
      current.startedAt = new Date().toISOString();
      return current;
    });
  }

  completeByProvider(exchangeId) {
    const exchange = this.mustExchange(exchangeId);
    if (this.state.activeUserId !== exchange.providerId) throw new Error('Solo el prestador puede marcar completado.');
    assertTransition(exchange.status, 'COMPLETED_BY_PROVIDER');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      setStatus(current, 'COMPLETED_BY_PROVIDER');
      current.completedByProviderAt = new Date().toISOString();
      return current;
    });
  }

  confirmExchange(exchangeId) {
    const exchange = this.mustExchange(exchangeId);
    if (this.state.activeUserId !== exchange.requesterId) throw new Error('Solo el solicitante puede confirmar.');
    assertTransition(exchange.status, 'CONFIRMED');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      releaseEscrow(draft.ledger, {
        requesterId: current.requesterId, providerId: current.providerId, exchangeId,
        quarters: current.quarters, idempotencyKey: `release:${exchangeId}`,
      });
      setStatus(current, 'CONFIRMED');
      current.confirmedAt = new Date().toISOString();
      const request = draft.requests.find((item) => item.id === current.requestId);
      if (request) request.status = 'FULFILLED';
      return current;
    });
  }

  findMatches(requestId) {
    return structuredClone(findMatchesForRequest(this.state, requestId));
  }

  getUserReputation(userId) {
    this.mustUser(userId);
    return structuredClone(buildUserReputation(this.state, userId));
  }

  proposeExtension(exchangeId, additionalCt) {
    const exchange = this.mustExchange(exchangeId);
    if (this.state.activeUserId !== exchange.providerId) throw new Error('Solo el prestador puede proponer una extensión.');
    if (!['ESCROWED', 'IN_PROGRESS'].includes(exchange.status)) throw new Error('La extensión solo está disponible durante un intercambio reservado o en curso.');
    const amount = positiveInteger(additionalCt, 'additionalCt');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      current.pendingExtensionCt = amount;
      current.extensionStatus = 'PROPOSED';
      return current;
    });
  }

  acceptExtension(exchangeId) {
    const exchange = this.mustExchange(exchangeId);
    if (this.state.activeUserId !== exchange.requesterId) throw new Error('Solo el solicitante puede aprobar una extensión.');
    if (!exchange.pendingExtensionCt || exchange.extensionStatus !== 'PROPOSED') throw new Error('No existe una extensión pendiente.');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      const extraQuarters = ctToQuarters(current.pendingExtensionCt);
      holdCredits(draft.ledger, {
        userId: current.requesterId, exchangeId, quarters: extraQuarters,
        idempotencyKey: `extension:${exchangeId}:${current.durationCt}:${current.pendingExtensionCt}`,
      });
      current.durationCt += current.pendingExtensionCt;
      current.quarters += extraQuarters;
      current.extensionStatus = 'ACCEPTED';
      current.pendingExtensionCt = null;
      return current;
    });
  }

  cancelExchange(exchangeId, { hoursUntilStart = 3 } = {}) {
    const exchange = this.mustExchange(exchangeId);
    const isRequester = this.state.activeUserId === exchange.requesterId;
    const isProvider = this.state.activeUserId === exchange.providerId;
    if (!isRequester && !isProvider) throw new Error('No participás de este intercambio.');
    if (exchange.status === 'REQUESTED') {
      assertTransition(exchange.status, 'CANCELLED');
      return this.commit((draft) => {
        const current = draft.exchanges.find((item) => item.id === exchangeId);
        current.outcome = isRequester ? 'REQUESTER_CANCELLED' : 'PROVIDER_CANCELLED';
        setStatus(current, 'CANCELLED');
        return current;
      });
    }
    if (!['ESCROWED', 'IN_PROGRESS'].includes(exchange.status)) throw new Error('El intercambio no puede cancelarse en este estado.');
    assertTransition(exchange.status, 'CANCELLED');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      if (isProvider) {
        refundEscrow(draft.ledger, { userId: current.requesterId, exchangeId, quarters: current.quarters, idempotencyKey: `provider-cancel:${exchangeId}` });
        current.outcome = 'PROVIDER_CANCELLED';
      } else if (hoursUntilStart >= 2) {
        refundEscrow(draft.ledger, { userId: current.requesterId, exchangeId, quarters: current.quarters, idempotencyKey: `requester-cancel-full:${exchangeId}` });
        current.outcome = 'REQUESTER_CANCELLED';
      } else {
        const providerQuarters = current.quarters / 4;
        splitEscrow(draft.ledger, {
          requesterId: current.requesterId, providerId: current.providerId, exchangeId,
          providerQuarters, requesterQuarters: current.quarters - providerQuarters,
          idempotencyKey: `requester-cancel-late:${exchangeId}`, type: 'CANCELLATION_PENALTY',
        });
        current.outcome = 'REQUESTER_LATE_CANCELLED';
      }
      setStatus(current, 'CANCELLED');
      return current;
    });
  }

  recordNoShow(exchangeId, role) {
    const exchange = this.mustExchange(exchangeId);
    if (this.state.activeUserId !== exchange.providerId && this.state.activeUserId !== exchange.requesterId) throw new Error('No participás de este intercambio.');
    if (!['ESCROWED', 'IN_PROGRESS'].includes(exchange.status)) throw new Error('No-show inválido en este estado.');
    assertTransition(exchange.status, 'CANCELLED');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      if (role === 'REQUESTER') {
        const providerQuarters = current.quarters / 2;
        splitEscrow(draft.ledger, {
          requesterId: current.requesterId, providerId: current.providerId, exchangeId,
          providerQuarters, requesterQuarters: current.quarters - providerQuarters,
          idempotencyKey: `requester-noshow:${exchangeId}`, type: 'NO_SHOW_PENALTY',
        });
        current.outcome = 'REQUESTER_NO_SHOW';
      } else if (role === 'PROVIDER') {
        refundEscrow(draft.ledger, { userId: current.requesterId, exchangeId, quarters: current.quarters, idempotencyKey: `provider-noshow:${exchangeId}` });
        current.outcome = 'PROVIDER_NO_SHOW';
      } else {
        throw new Error('Rol de no-show inválido.');
      }
      setStatus(current, 'CANCELLED');
      return current;
    });
  }

  openDispute(exchangeId, reason = '') {
    const exchange = this.mustExchange(exchangeId);
    if (![exchange.requesterId, exchange.providerId].includes(this.state.activeUserId)) throw new Error('No participás de este intercambio.');
    if (!['ESCROWED', 'IN_PROGRESS', 'COMPLETED_BY_PROVIDER'].includes(exchange.status)) throw new Error('No se puede abrir disputa en este estado.');
    assertTransition(exchange.status, 'DISPUTED');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      current.disputeReason = String(reason).trim();
      current.disputeOpenedBy = draft.activeUserId;
      setStatus(current, 'DISPUTED');
      return current;
    });
  }

  sendMessage(exchangeId, text) {
    const exchange = this.mustExchange(exchangeId);
    const authorId = this.state.activeUserId;
    if (![exchange.requesterId, exchange.providerId].includes(authorId)) throw new Error('No participás de este intercambio.');
    const body = String(text || '').trim();
    if (!body) throw new Error('Escribí un mensaje.');
    if (body.length > 600) throw new Error('El mensaje es demasiado largo.');
    return this.commit((draft) => {
      const conversation = draft.conversations.find((item) => item.exchangeId === exchangeId);
      if (!conversation) throw new Error('Conversación inexistente.');
      const message = {
        id: nextId(draft, 'message', 'm'), exchangeId, authorId, body,
        createdAt: new Date().toISOString(),
      };
      conversation.messages.push(message);
      return message;
    });
  }

  submitReview(exchangeId, input) {
    const exchange = this.mustExchange(exchangeId);
    if (!['CONFIRMED', 'CLOSED'].includes(exchange.status)) throw new Error('El intercambio debe estar confirmado antes de valorar.');
    const authorId = this.state.activeUserId;
    if (![exchange.requesterId, exchange.providerId].includes(authorId)) throw new Error('No participás de este intercambio.');
    if (this.state.reviews.some((review) => review.exchangeId === exchangeId && review.authorId === authorId)) throw new Error('Ya enviaste tu valoración.');
    return this.commit((draft) => {
      const current = draft.exchanges.find((item) => item.id === exchangeId);
      const subjectId = authorId === current.requesterId ? current.providerId : current.requesterId;
      const review = {
        id: nextId(draft, 'review', 'rv'), exchangeId, authorId, subjectId,
        quality: optionalRating(input.quality), communication: rating(input.communication),
        punctuality: rating(input.punctuality), clarity: optionalRating(input.clarity),
        wouldRepeat: Boolean(input.wouldRepeat), comment: String(input.comment || '').trim().slice(0, 500),
        createdAt: new Date().toISOString(),
      };
      draft.reviews.push(review);
      return review;
    });
  }

  reset(nextState) {
    this.state = this.repository.reset(nextState);
    return this.getState();
  }

  commit(mutator) {
    const draft = structuredClone(this.state);
    const result = mutator(draft);
    validateState(draft);
    draft.updatedAt = new Date().toISOString();
    this.repository.save(draft);
    this.state = draft;
    return structuredClone(result);
  }

  mustUser(id) { const found = this.state.users.find((item) => item.id === id); if (!found) throw new Error(`Usuario inexistente: ${id}`); return found; }
  mustOffer(id) { const found = this.state.offers.find((item) => item.id === id); if (!found) throw new Error(`Oferta inexistente: ${id}`); return found; }
  mustRequest(id) { const found = this.state.requests.find((item) => item.id === id); if (!found) throw new Error(`Solicitud inexistente: ${id}`); return found; }
  mustExchange(id) { const found = this.state.exchanges.find((item) => item.id === id); if (!found) throw new Error(`Intercambio inexistente: ${id}`); return found; }
}

function setStatus(exchange, status) {
  exchange.status = status;
  exchange.timeline.push({ status, at: new Date().toISOString() });
}
function nextId(state, counter, prefix) { state.counters[counter] += 1; return `${prefix}_${state.counters[counter]}`; }
function initials(name) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(''); }
function validateRequired(value, field) { if (!value || !String(value).trim()) throw new Error(`${field} requerido`); }
function validateNeighborhood(value) { if (!['Almagro', 'Caballito', 'Villa Crespo'].includes(value)) throw new Error('Barrio fuera del cluster demo.'); }
function positiveInteger(value, field) { const number = Number(value); if (!Number.isInteger(number) || number <= 0) throw new Error(`${field} debe ser un entero positivo`); return number; }
function rating(value) { const n = Number(value); if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error('La valoración debe estar entre 1 y 5.'); return n; }
function optionalRating(value) { return value == null ? null : rating(value); }
function validateMarketInput(input) {
  validateRequired(input.title, 'título'); validateRequired(input.category, 'categoría');
  if (!['REMOTE', 'IN_PERSON'].includes(input.modality)) throw new Error('modalidad inválida');
  positiveInteger(input.durationCt, 'durationCt');
}
function validateState(state) {
  for (const user of state.users) {
    const balance = getAccountBalances(state.ledger, user.id);
    if (balance.available < 0 || balance.held < 0) throw new Error(`Invariante de saldo violada para ${user.id}`);
  }
}
