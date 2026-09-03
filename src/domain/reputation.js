function bayesianNormalized(values) {
  if (!values.length) return null;
  const priorMean = 4;
  const priorWeight = 5;
  const rating = (values.reduce((sum, value) => sum + value, 0) + priorMean * priorWeight) / (values.length + priorWeight);
  return ((rating - 1) / 4) * 100;
}

export function calculateReputation({ completed, reviews, reliability = 100, disputeIntegrity = 100 }) {
  const quality = bayesianNormalized(reviews.map((r) => r.quality).filter(Number.isFinite));
  const communication = bayesianNormalized(reviews.map((r) => r.communication).filter(Number.isFinite));
  const punctuality = bayesianNormalized(reviews.map((r) => r.punctuality).filter(Number.isFinite));
  const yes = reviews.filter((r) => r.wouldRepeat === true).length;
  const wouldRepeat = ((yes + 2) / (reviews.length + 4)) * 100;
  const dimensions = {
    quality: quality === null ? null : Math.round(quality),
    communication: communication === null ? null : Math.round(communication),
    punctuality: punctuality === null ? null : Math.round(punctuality),
  };

  if (completed < 3) return { stage: 'BUILDING', index: null, completed, wouldRepeat: Math.round(wouldRepeat), dimensions };
  if (completed < 5) return { stage: 'DIMENSIONS', index: null, completed, wouldRepeat: Math.round(wouldRepeat), dimensions };

  const q = quality ?? 75;
  const c = communication ?? 75;
  const p = punctuality ?? 75;
  const index = Math.round(
    0.30 * reliability + 0.25 * q + 0.15 * c + 0.15 * p + 0.10 * wouldRepeat + 0.05 * disputeIntegrity,
  );
  return { stage: 'INDEX', index: Math.max(0, Math.min(100, index)), completed, wouldRepeat: Math.round(wouldRepeat), dimensions };
}

export function buildUserReputation(state, userId) {
  const completed = state.exchanges.filter((exchange) => exchange.providerId === userId && ['CONFIRMED', 'CLOSED'].includes(exchange.status)).length;
  const reviews = state.reviews.filter((review) => review.subjectId === userId);
  const providerScheduled = state.exchanges.filter((exchange) => exchange.providerId === userId && exchange.status !== 'DECLINED').length;
  const adverse = state.exchanges.filter((exchange) => exchange.providerId === userId && ['PROVIDER_CANCELLED', 'PROVIDER_NO_SHOW'].includes(exchange.outcome)).length;
  const reliability = providerScheduled ? Math.max(0, 100 * (1 - adverse / providerScheduled)) : 100;
  return calculateReputation({ completed, reviews, reliability });
}
