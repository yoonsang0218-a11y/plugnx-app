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

export function estimateMoveBundle({ gapDays = 0, includeCleaning = true } = {}) {
  const modules = ['moving'];
  if (Number(gapDays) > 0) modules.push('storage', 'temporary-stay');
  if (includeCleaning) modules.push('cleaning');
  return { modules, gapDays: Math.max(0, Number(gapDays || 0)) };
}

function timelineItem(id, stage, title, status, reason, module, cta, optional = false) {
  return { id, stage, title, status, reason, dueLabel: '', module, entityId: null, cta, optional };
}

export function buildLifeEventPlan({ eventType = 'move-home', profile = {}, job = {}, property = {}, mobility = {}, finance = {} } = {}) {
  const gapDays = calculateMoveGapDays(profile.moveOutDate, profile.moveInDate || property.availableFrom);
  const timeline = [];
  const unsafeHome = Number(property.homeSafe || 0) < 80 || property.propertyRisk !== 'low';

  if (eventType === 'change-job') {
    timeline.push(timelineItem('job-check','decision','새 직장 조건 확인','done','선택한 직장의 급여·근무·외국인 채용 근거를 확인합니다.','workproof','직장 상세 보기'));
    timeline.push(timelineItem('home-select','decision','통근 가능한 집 비교','next','직장 기준 생활권과 월 잔여금을 비교하세요.','housing','집 비교하기'));
  }

  if (eventType === 'sign-housing') {
    if (unsafeHome) timeline.push(timelineItem('homesafe','trust','계약 전 HomeSafe 확인','next','가격·권리·계약 조건을 확인한 뒤 계약하는 편이 안전합니다.','homesafe','HomeSafe 확인'));
    else timeline.push(timelineItem('homesafe','trust','HomeSafe 기본 확인','done','현재 데모 기준 주요 주거 위험 신호가 낮습니다.','homesafe','검증 결과 보기'));
    timeline.push(timelineItem('housing-finance','finance','보증·보증금 금융 사전점검',unsafeHome?'blocked':'recommended','필요한 경우에만 보증·자금 준비도를 확인합니다.','housing-finance','사전점검 보기',true));
  }

  if (eventType === 'move-home' || eventType === 'change-job') {
    if (eventType === 'move-home') timeline.push(timelineItem('home-ready','decision','새 집 조건 확정','done','선택한 집을 기준으로 이동 계획을 만듭니다.','housing','집 상세 보기'));
    timeline.push(timelineItem('moving','execution','이사 예약','next','퇴실일과 입주일 기준으로 이사 일정을 먼저 잡으세요.','moving','이사 옵션 보기'));
    if (gapDays > 0) {
      timeline.push(timelineItem('storage','execution','짐 보관','recommended',`${gapDays}일의 입주 공백이 있어 보관 옵션이 필요합니다.`,'storage','창고 비교'));
      timeline.push(timelineItem('temporary-stay','execution','임시 숙소','recommended',`${gapDays}일 동안 머물 곳을 함께 준비하세요.`,'temporary-stay','임시숙소 비교'));
    }
    timeline.push(timelineItem('cleaning','execution','입주 청소','recommended','새 집 입주 전 청소 시간을 이사 일정과 묶어 예약할 수 있습니다.','cleaning','청소 옵션 보기'));
    timeline.push(timelineItem('address-change','aftercare','주소 변경','later','입주 후 체류지·은행·보험·회사 주소 변경을 확인합니다.','address-change','체크리스트 보기'));
  }

  if (eventType === 'commute-hard') {
    timeline.push(timelineItem('mobility-compare','decision','이사 vs 차량 비교','next','현재 집을 유지할지, 이사할지, 차량을 살지 총비용으로 비교합니다.','mobility','비교 보기'));
    if (mobility.recommended === 'car') {
      timeline.push(timelineItem('used-car','execution','중고차 후보 비교','recommended','통근시간 절감이 추가 월비용 범위 안에 들어옵니다.','used-car','차량 후보 보기'));
      timeline.push(timelineItem('auto-finance','finance','오토금융 사전점검',finance.auto === 'precheck-ready'?'recommended':'later','차량을 선택한 뒤 필요한 경우 금융 준비도를 확인합니다.','auto-finance','사전점검 보기',true));
    }
  }

  if (eventType === 'settle-long-term') {
    timeline.push(timelineItem('stability','trust','정착 준비도 확인','next','재직·소득·체류·거주 이력을 하나의 Passport로 정리합니다.','passport','준비도 보기'));
    timeline.push(timelineItem('mortgage','finance','주택구입 금융 검토',finance.mortgage === 'partner-review'?'recommended':'later','장기 정착 의향이 있을 때만 파트너 심사 가능성을 확인합니다.','mortgage','파트너 심사 조건',true));
    timeline.push(timelineItem('valuation','execution','가치평가·감정평가','later','구매 물건이 정해지면 가치평가를 연결합니다.','valuation','가치평가 보기'));
    timeline.push(timelineItem('registration','execution','전자등기','later','대출 승인 이후 담보설정·등기 사건으로 연결합니다.','registration','등기 흐름 보기'));
  }

  if (eventType === 'leave-korea') {
    timeline.push(timelineItem('exit-check','decision','출국 일정·주거 종료 확인','next','퇴거일, 보증금 반환, 짐 처리 순서를 먼저 정리합니다.','exit','출국 플랜 보기'));
    timeline.push(timelineItem('storage-exit','execution','짐 보관 또는 배송','recommended','재입국 예정이라면 보관, 장기 출국이면 배송·처분을 비교합니다.','storage','짐 옵션 보기'));
    timeline.push(timelineItem('settlement','finance','정산·환급 확인','recommended','보증금·임금·환급·송금할 금액을 확인합니다.','settlement','정산 보기'));
  }

  return { eventType, gapDays, timeline, job, property, mobility, finance };
}

export function getNextBestAction(plan = {}) {
  const items = Array.isArray(plan.timeline) ? plan.timeline : [];
  return items.find((item) => item.status === 'next')
    || items.find((item) => item.status === 'blocked')
    || items.find((item) => item.status === 'recommended')
    || items[0]
    || null;
}
