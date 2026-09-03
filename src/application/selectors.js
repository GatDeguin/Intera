export function exchangesForUser(state, userId) {
  return state.exchanges.filter((exchange) => exchange.requesterId === userId || exchange.providerId === userId);
}

export function pendingActionForUser(state, userId) {
  const exchanges = exchangesForUser(state, userId);
  const priority = [
    ['COMPLETED_BY_PROVIDER', (e) => e.requesterId === userId, 'Confirmá un intercambio completado'],
    ['REQUESTED', (e) => e.providerId === userId, 'Tenés una propuesta esperando respuesta'],
    ['ESCROWED', () => true, 'Tenés un intercambio listo para comenzar'],
    ['IN_PROGRESS', (e) => e.providerId === userId, 'Marcá el intercambio cuando termines'],
  ];
  for (const [status, predicate, label] of priority) {
    const exchange = exchanges.find((item) => item.status === status && predicate(item));
    if (exchange) return { label, exchange };
  }
  return null;
}

export function activitySummary(state, userId) {
  const exchanges = exchangesForUser(state, userId);
  return {
    total: exchanges.length,
    completed: exchanges.filter((e) => ['CONFIRMED', 'CLOSED'].includes(e.status)).length,
    active: exchanges.filter((e) => ['REQUESTED', 'ESCROWED', 'IN_PROGRESS', 'COMPLETED_BY_PROVIDER', 'DISPUTED'].includes(e.status)).length,
  };
}
