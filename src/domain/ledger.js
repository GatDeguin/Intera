function nowIso() {
  return new Date().toISOString();
}

export function createLedgerState() {
  return { entries: [] };
}

export function postLedgerEntry(state, { type, idempotencyKey, postings, metadata = {} }) {
  const prior = state.entries.find((entry) => entry.idempotencyKey === idempotencyKey);
  if (prior) return prior;

  if (!idempotencyKey) throw new Error('idempotencyKey requerido');
  if (!Array.isArray(postings) || postings.length < 2) throw new Error('postings inválidos');
  const total = postings.reduce((sum, posting) => sum + posting.quarters, 0);
  if (total !== 0) throw new Error('El ledger debe balancear a cero.');
  for (const posting of postings) {
    if (!Number.isInteger(posting.quarters)) throw new TypeError('Los postings usan ct_quarters enteros.');
  }

  const entry = {
    id: `le_${state.entries.length + 1}`,
    type,
    idempotencyKey,
    createdAt: nowIso(),
    postings: postings.map((posting, index) => ({ id: `${idempotencyKey}:${index}`, ...posting })),
    metadata,
  };
  state.entries.push(entry);
  return entry;
}

export function getAccountBalances(state, userId) {
  let available = 0;
  let held = 0;
  for (const entry of state.entries) {
    for (const posting of entry.postings) {
      if (posting.userId !== userId) continue;
      if (posting.bucket === 'AVAILABLE') available += posting.quarters;
      if (posting.bucket === 'HELD') held += posting.quarters;
    }
  }
  return { available, held };
}

export function grantWelcomeCredit(state, userId, idempotencyKey) {
  return postLedgerEntry(state, {
    type: 'WELCOME_GRANT',
    idempotencyKey,
    postings: [
      { userId: 'SYSTEM', bucket: 'ISSUANCE', quarters: -16 },
      { userId, bucket: 'AVAILABLE', quarters: 16 },
    ],
  });
}

export function creditEarned(state, { userId, quarters, idempotencyKey, type = 'SERVICE_CREDIT', metadata = {} }) {
  assertPositiveQuarters(quarters);
  return postLedgerEntry(state, {
    type,
    idempotencyKey,
    postings: [
      { userId: 'SYSTEM', bucket: 'ISSUANCE', quarters: -quarters },
      { userId, bucket: 'AVAILABLE', quarters },
    ],
    metadata,
  });
}

export function holdCredits(state, { userId, exchangeId, quarters, idempotencyKey }) {
  assertPositiveQuarters(quarters);
  const existing = state.entries.find((entry) => entry.idempotencyKey === idempotencyKey);
  if (existing) return existing;
  const { available } = getAccountBalances(state, userId);
  if (available < quarters) throw new Error('saldo insuficiente');
  return postLedgerEntry(state, {
    type: 'ESCROW_HOLD',
    idempotencyKey,
    postings: [
      { userId, bucket: 'AVAILABLE', quarters: -quarters },
      { userId, bucket: 'HELD', quarters },
    ],
    metadata: { exchangeId },
  });
}

export function releaseEscrow(state, { requesterId, providerId, exchangeId, quarters, idempotencyKey }) {
  assertPositiveQuarters(quarters);
  const existing = state.entries.find((entry) => entry.idempotencyKey === idempotencyKey);
  if (existing) return existing;
  const { held } = getAccountBalances(state, requesterId);
  if (held < quarters) throw new Error('escrow insuficiente');
  return postLedgerEntry(state, {
    type: 'ESCROW_RELEASE',
    idempotencyKey,
    postings: [
      { userId: requesterId, bucket: 'HELD', quarters: -quarters },
      { userId: providerId, bucket: 'AVAILABLE', quarters },
    ],
    metadata: { exchangeId },
  });
}

export function refundEscrow(state, { userId, exchangeId, quarters, idempotencyKey }) {
  assertPositiveQuarters(quarters);
  const existing = state.entries.find((entry) => entry.idempotencyKey === idempotencyKey);
  if (existing) return existing;
  const { held } = getAccountBalances(state, userId);
  if (held < quarters) throw new Error('escrow insuficiente');
  return postLedgerEntry(state, {
    type: 'ESCROW_REFUND',
    idempotencyKey,
    postings: [
      { userId, bucket: 'HELD', quarters: -quarters },
      { userId, bucket: 'AVAILABLE', quarters },
    ],
    metadata: { exchangeId },
  });
}

export function splitEscrow(state, { requesterId, providerId, exchangeId, providerQuarters, requesterQuarters, idempotencyKey, type }) {
  if (!Number.isInteger(providerQuarters) || !Number.isInteger(requesterQuarters) || providerQuarters < 0 || requesterQuarters < 0) {
    throw new TypeError('Los ajustes deben usar ct_quarters enteros no negativos.');
  }
  const total = providerQuarters + requesterQuarters;
  if (total <= 0) throw new Error('ajuste vacío');
  const existing = state.entries.find((entry) => entry.idempotencyKey === idempotencyKey);
  if (existing) return existing;
  const { held } = getAccountBalances(state, requesterId);
  if (held < total) throw new Error('escrow insuficiente');
  const postings = [{ userId: requesterId, bucket: 'HELD', quarters: -total }];
  if (providerQuarters) postings.push({ userId: providerId, bucket: 'AVAILABLE', quarters: providerQuarters });
  if (requesterQuarters) postings.push({ userId: requesterId, bucket: 'AVAILABLE', quarters: requesterQuarters });
  return postLedgerEntry(state, { type, idempotencyKey, postings, metadata: { exchangeId } });
}

function assertPositiveQuarters(quarters) {
  if (!Number.isInteger(quarters) || quarters <= 0) {
    throw new TypeError('ct_quarters debe ser un entero positivo.');
  }
}
