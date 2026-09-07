export function calculateHousingMonthlyCost(property = {}) {
  return [property.rent, property.managementFee, property.utilitiesEstimate]
    .map((value) => Number(value || 0))
    .reduce((sum, value) => sum + value, 0);
}

export function calculateMonthlySurplus({ profile = {}, job = {}, property = {}, commute = {} } = {}) {
  const income = Number(job.estimatedNetIncome || 0);
  const housing = calculateHousingMonthlyCost(property);
  const commuteCost = Number(commute.monthlyCost || 0);
  const living = Number(profile.monthlyLivingBudget || 0);
  return income - housing - commuteCost - living;
}

export function calculateMoveGapDays(oldMoveOut, newMoveIn) {
  if (!oldMoveOut || !newMoveIn) return 0;
  const out = new Date(`${oldMoveOut}T00:00:00Z`);
  const incoming = new Date(`${newMoveIn}T00:00:00Z`);
  const diff = Math.floor((incoming - out) / 86400000);
  return Math.max(0, diff);
}

export function compareMobility({ transit = {}, car = {}, maxIncrementalMonthlyCost = 0, minMonthlyMinutesSaved = 0 } = {}) {
  const incrementalCost = Number(car.monthlyCost || 0) - Number(transit.monthlyCost || 0);
  const minutesSaved = Number(transit.monthlyMinutes || 0) - Number(car.monthlyMinutes || 0);
  let recommended = 'transit';
  if (incrementalCost <= maxIncrementalMonthlyCost && minutesSaved >= minMonthlyMinutesSaved) recommended = 'car';
  else if (minutesSaved > 0 && incrementalCost <= 0) recommended = 'car';
  return { recommended, incrementalCost, minutesSaved };
}

export function getFinanceReadiness({
  visaRemainingMonths = 0,
  employmentVerified = false,
  incomeVerified = false,
  residenceVerified = false,
  propertyRisk = 'unknown',
  hasVehicleTarget = false,
} = {}) {
  const stableStay = Number(visaRemainingMonths) >= 6;
  const creditReady = stableStay && employmentVerified && incomeVerified;
  const guaranteeReady = stableStay && residenceVerified && propertyRisk === 'low';
  const autoReady = creditReady && hasVehicleTarget;
  return {
    guarantee: guaranteeReady ? 'precheck-ready' : 'needs-review',
    depositLoan: guaranteeReady && incomeVerified ? 'precheck-ready' : 'needs-review',
    credit: creditReady ? 'precheck-ready' : 'needs-review',
    auto: autoReady ? 'precheck-ready' : 'needs-review',
    mortgage: stableStay && creditReady && propertyRisk === 'low' ? 'partner-review' : 'not-yet',
  };
}

export function aggregateReviews(reviews = []) {
  const valid = reviews.filter((review) => Number.isFinite(Number(review.rating)));
  if (!valid.length) return { count: 0, weightedRating: 0, weightedPromiseMatch: 0 };
  const weighted = valid.map((review) => ({
    rating: Number(review.rating),
    promiseMatch: Number(review.promiseMatch || review.rating),
    weight: 1 + Math.min(3, Math.max(0, Number(review.evidenceLevel || 0))),
  }));
  const weightTotal = weighted.reduce((sum, item) => sum + item.weight, 0);
  return {
    count: valid.length,
    weightedRating: weighted.reduce((sum, item) => sum + item.rating * item.weight, 0) / weightTotal,
    weightedPromiseMatch: weighted.reduce((sum, item) => sum + item.promiseMatch * item.weight, 0) / weightTotal,
  };
}

export function inferEntityKind(input = '') {
  const value = String(input).toLowerCase();
  if (/job|jobs|채용|회사|공장|employment/.test(value)) return 'job';
  if (/room|rooms|home|house|housing|rent|월세|전세|아파트|숙소|원룸/.test(value)) return 'housing';
  if (/car|vehicle|중고차|자동차|아반떼|쏘나타|k3|k5/.test(value)) return 'vehicle';
  return 'place';
}
