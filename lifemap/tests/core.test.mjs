import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHousingMonthlyCost,
  calculateMonthlySurplus,
  calculateMoveGapDays,
  compareMobility,
  getFinanceReadiness,
  aggregateReviews,
  inferEntityKind,
} from '../core.mjs';

test('housing monthly cost includes rent, management and utilities but not deposit', () => {
  const property = { rent: 520000, managementFee: 80000, utilitiesEstimate: 70000, deposit: 10000000 };
  assert.equal(calculateHousingMonthlyCost(property), 670000);
});

test('monthly surplus subtracts housing and commute from verified net income', () => {
  const profile = { monthlyLivingBudget: 0 };
  const job = { estimatedNetIncome: 2750000 };
  const property = { rent: 520000, managementFee: 80000, utilitiesEstimate: 70000 };
  const commute = { monthlyCost: 80000 };
  assert.equal(calculateMonthlySurplus({ profile, job, property, commute }), 2000000);
});

test('move gap returns positive days when old home ends before new home begins', () => {
  assert.equal(calculateMoveGapDays('2026-09-18', '2026-10-02'), 14);
});

test('move gap is zero when move dates overlap', () => {
  assert.equal(calculateMoveGapDays('2026-10-02', '2026-09-30'), 0);
});

test('mobility comparison recommends car when time savings are high and incremental cost fits budget', () => {
  const result = compareMobility({
    transit: { monthlyCost: 310000, monthlyMinutes: 3300 },
    car: { monthlyCost: 490000, monthlyMinutes: 1440 },
    maxIncrementalMonthlyCost: 250000,
    minMonthlyMinutesSaved: 1200,
  });
  assert.equal(result.recommended, 'car');
  assert.equal(result.incrementalCost, 180000);
  assert.equal(result.minutesSaved, 1860);
});

test('finance readiness never returns approved and separates precheck products', () => {
  const result = getFinanceReadiness({
    visaRemainingMonths: 22,
    employmentVerified: true,
    incomeVerified: true,
    residenceVerified: true,
    propertyRisk: 'low',
    hasVehicleTarget: true,
  });
  assert.equal(result.guarantee, 'precheck-ready');
  assert.equal(result.credit, 'precheck-ready');
  assert.equal(result.auto, 'precheck-ready');
  assert.notEqual(result.guarantee, 'approved');
});

test('review aggregate emphasizes verified promise-to-outcome reviews', () => {
  const result = aggregateReviews([
    { rating: 5, evidenceLevel: 0, promiseMatch: 5 },
    { rating: 3, evidenceLevel: 3, promiseMatch: 2 },
  ]);
  assert.equal(result.count, 2);
  assert.ok(result.weightedRating < 4.2);
  assert.ok(result.weightedPromiseMatch < 4);
});

test('entity kind can be inferred from imported URL or text with minimum user input', () => {
  assert.equal(inferEntityKind('https://example.com/jobs/123 제조업 채용'), 'job');
  assert.equal(inferEntityKind('https://example.com/rooms/abc 원룸 월세'), 'housing');
  assert.equal(inferEntityKind('아반떼 중고차'), 'vehicle');
});
