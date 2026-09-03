const TRANSITIONS = {
  REQUESTED: new Set(['ESCROWED', 'DECLINED', 'CANCELLED']),
  ESCROWED: new Set(['IN_PROGRESS', 'CANCELLED', 'DISPUTED']),
  IN_PROGRESS: new Set(['COMPLETED_BY_PROVIDER', 'CANCELLED', 'DISPUTED']),
  COMPLETED_BY_PROVIDER: new Set(['CONFIRMED', 'DISPUTED']),
  CONFIRMED: new Set(['CLOSED']),
  DISPUTED: new Set(['CLOSED']),
  DECLINED: new Set(),
  CANCELLED: new Set(),
  CLOSED: new Set(),
};

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.has(to));
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Transición inválida: ${from} → ${to}`);
  }
}
