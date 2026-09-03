const CLUSTER = ['Almagro', 'Caballito', 'Villa Crespo'];

export function findMatchesForRequest(state, requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) throw new Error(`Solicitud inexistente: ${requestId}`);

  return state.offers
    .filter((offer) => offer.active && offer.category === request.category && offer.providerId !== request.requesterId)
    .filter((offer) => offer.modality === request.modality)
    .map((offer) => {
      const provider = state.users.find((user) => user.id === offer.providerId);
      let score = 55;
      const reasons = ['Misma categoría', offer.modality === 'REMOTE' ? 'Remoto compatible' : 'Modalidad presencial compatible'];
      if (offer.neighborhood === request.neighborhood) {
        score += 25;
        reasons.push('Mismo barrio');
      } else if (CLUSTER.includes(offer.neighborhood) && CLUSTER.includes(request.neighborhood)) {
        score += 12;
        reasons.push('Dentro del cluster piloto');
      }
      if (provider?.verification === 'V2_DEMO') {
        score += 8;
        reasons.push('Identidad verificada · demo');
      }
      if (offer.durationCt <= request.durationCt) score += 5;
      return { offer, provider, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.offer.id.localeCompare(b.offer.id));
}
