import {
  calculateHousingMonthlyCost,
  calculateMonthlySurplus,
  calculateMoveGapDays,
  compareMobility,
  getFinanceReadiness,
  aggregateReviews,
  inferEntityKind,
} from './core.mjs';
import {
  initialProfile, jobs, housing, community, moveServices, vehicles, reviews as seedReviews, sourceAdapters,
} from './data.mjs';

const state = {
  profile: loadJson('lifemap-profile', initialProfile),
  reviews: [...seedReviews, ...loadJson('lifemap-local-reviews', [])],
  imported: loadJson('lifemap-imported', []),
  activeLayers: new Set(['jobs','housing']),
  selectedJobId: 'job-1',
  selectedHomeId: 'home-1',
  selectedEntityId: null,
  drawerTab: 'overview',
  filter: 'all',
  query: '',
  selectedVehicleId: 'vehicle-1',
  map: null,
  markers: new Map(),
  route: null,
  financeCircles: [],
};

const el = (id) => document.getElementById(id);
const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
const money = (v) => `${Math.round(Number(v||0)/10000).toLocaleString()}만`;
const won = (v) => `${Math.round(Number(v||0)).toLocaleString()}원`;

function loadJson(key, fallback){
  try { const raw=localStorage.getItem(key); return raw ? {...fallback, ...JSON.parse(raw)} : structuredClone(fallback); }
  catch { return structuredClone(fallback); }
}
function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function toast(message){ const t=el('toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),1800); }

function allEntities(){ return [...jobs,...housing,...community,...moveServices,...state.imported]; }
function entityById(id){ return allEntities().find(x=>x.id===id); }
function entityReviews(id){ return state.reviews.filter(r=>r.entityId===id); }
function reviewSummary(id){ return aggregateReviews(entityReviews(id)); }

function iconHtml(kind){
  const icon={job:'W',housing:'H',community:'+',move:'M'}[kind]||'•';
  return `<div class="marker-pin marker-${kind}"><span>${icon}</span></div>`;
}
function markerFor(entity){
  if(!state.map || !entity.lat || !entity.lng) return null;
  const icon=L.divIcon({className:'custom-marker',html:iconHtml(entity.kind),iconSize:[34,34],iconAnchor:[17,30]});
  const marker=L.marker([entity.lat,entity.lng],{icon}).addTo(state.map);
  marker.on('click',()=>openEntity(entity.id));
  state.markers.set(entity.id,marker); return marker;
}

function initMap(){
  if(!window.L){ el('map').style.display='none'; el('map-fallback').style.zIndex='1'; return; }
  state.map=L.map('map',{zoomControl:false,attributionControl:true}).setView([37.238,126.835],10.6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(state.map);
  renderMapLayers();
}

function layerAllows(entity){
  if(entity.kind==='job') return state.activeLayers.has('jobs');
  if(entity.kind==='housing') return state.activeLayers.has('housing');
  if(entity.kind==='community') return state.activeLayers.has('community');
  if(entity.kind==='move') return state.activeLayers.has('move');
  return false;
}

function renderMapLayers(){
  if(!state.map) return;
  for(const marker of state.markers.values()) state.map.removeLayer(marker);
  state.markers.clear();
  allEntities().filter(layerAllows).forEach(markerFor);
  renderRouteAndFinance();
}

function renderRouteAndFinance(){
  if(!state.map) return;
  if(state.route){ state.map.removeLayer(state.route); state.route=null; }
  state.financeCircles.forEach(c=>state.map.removeLayer(c)); state.financeCircles=[];
  const job=entityById(state.selectedJobId), home=entityById(state.selectedHomeId);
  if(state.activeLayers.has('mobility') && job?.lat && home?.lat){
    state.route=L.polyline([[job.lat,job.lng],[home.lat,home.lng]],{color:'#ef4444',weight:4,opacity:.75,dashArray:'8 7'}).addTo(state.map);
  }
  if(state.activeLayers.has('finance')){
    housing.forEach(h=>{
      const c=L.circle([h.lat,h.lng],{radius:900,color:'#111827',weight:2,fillColor:'#111827',fillOpacity:.035,dashArray:'4 5'}).addTo(state.map);
      c.on('click',()=>openEntity(h.id)); state.financeCircles.push(c);
    });
  }
}

function visibleEntities(){
  let items=allEntities().filter(layerAllows);
  const query=state.query.trim().toLowerCase();
  if(query) items=items.filter(x=>`${x.name} ${x.area||''} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(query));
  if(state.filter==='verified') items=items.filter(x=>(x.evidenceLevel||0)>=2 || (x.homeSafe||0)>=80);
  if(state.filter==='reviews') items=items.filter(x=>entityReviews(x.id).length>0);
  if(state.filter==='lowcost') items=items.sort((a,b)=>costSort(a)-costSort(b));
  return items;
}
function costSort(x){ if(x.kind==='housing') return calculateHousingMonthlyCost(x); if(x.kind==='job') return -x.estimatedNetIncome; return x.basePrice||99999999; }

function renderEntityList(){
  const items=visibleEntities();
  el('entity-list').innerHTML=items.length?items.map(entityCard).join(''):`<div style="padding:18px;color:#98a2b3;font-size:11px">조건에 맞는 항목이 없습니다.</div>`;
  qsa('.entity-card',el('entity-list')).forEach(card=>card.addEventListener('click',()=>openEntity(card.dataset.id)));
}
function entityCard(x){
  const rs=reviewSummary(x.id); const rating=rs.count?`★ ${rs.weightedRating.toFixed(1)} · ${rs.count}건`:'리뷰 대기';
  let meta='';
  if(x.kind==='job') meta=`<span class="entity-price">실수령 ${money(x.estimatedNetIncome)}</span><span>${x.foreignHiringEvidence}</span>`;
  if(x.kind==='housing') meta=`<span class="entity-price">월 ${money(calculateHousingMonthlyCost(x))}</span><span>보증금 ${money(x.deposit)}</span>`;
  if(x.kind==='community') meta=`<span>${x.category}</span>`;
  if(x.kind==='move') meta=`<span class="entity-price">${x.category} ${won(x.basePrice)}~</span>`;
  return `<article class="entity-card ${state.selectedEntityId===x.id?'active':''}" data-id="${x.id}">
    <div class="entity-card-top"><div><div class="entity-name">${escapeHtml(x.name)}</div><div class="entity-area">${escapeHtml(x.area||'')}</div></div><span class="mini-badge">${kindLabel(x.kind)}</span></div>
    <div class="entity-meta">${meta}</div><div class="review-line">${rating} · ${escapeHtml(x.source||'')}</div>
  </article>`;
}

function kindLabel(kind){ return ({job:'직장',housing:'주거',community:'생활',move:'이사',vehicle:'차량',place:'장소'})[kind]||'장소'; }
function escapeHtml(value){ return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function openEntity(id){
  state.selectedEntityId=id; state.drawerTab='overview';
  const x=entityById(id); if(!x) return;
  el('entity-drawer').classList.remove('hidden'); el('journey-panel').classList.add('drawer-open');
  el('drawer-kind').textContent=kindLabel(x.kind).toUpperCase(); el('drawer-title').textContent=x.name; el('drawer-source').textContent=`${x.source||'출처 미확인'} · 최근 검증: 데모 시각`;
  qsa('.drawer-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.drawerTab==='overview'));
  renderDrawer(); renderEntityList();
  const marker=state.markers.get(id); if(marker&&state.map) state.map.panTo(marker.getLatLng());
}
function closeDrawer(){ el('entity-drawer').classList.add('hidden'); el('journey-panel').classList.remove('drawer-open'); state.selectedEntityId=null; renderEntityList(); }

function renderDrawer(){
  const x=entityById(state.selectedEntityId); if(!x) return;
  if(state.drawerTab==='overview') el('drawer-body').innerHTML=overviewHtml(x);
  if(state.drawerTab==='reviews') el('drawer-body').innerHTML=reviewsHtml(x);
  if(state.drawerTab==='actions') el('drawer-body').innerHTML=actionsHtml(x);
  wireDrawerActions(x);
}
function overviewHtml(x){
  const rs=reviewSummary(x.id);
  let metrics=[];
  if(x.kind==='job') metrics=[['예상 실수령',money(x.estimatedNetIncome)],['기본급',money(x.baseSalary)],['근무',x.shift],['채용근거',x.foreignHiringEvidence]];
  if(x.kind==='housing') metrics=[['월 주거비',money(calculateHousingMonthlyCost(x))],['보증금',money(x.deposit)],['HomeSafe',`${x.homeSafe}/100`],['입주가능',x.availableFrom]];
  if(x.kind==='community') metrics=[['분류',x.category],['지역',x.area],['언어/특징',(x.tags||[]).join(' · ')],['출처',x.source]];
  if(x.kind==='move') metrics=[['분류',x.category],['시작가',won(x.basePrice)],['지역',x.area],['연계',(x.tags||[]).join(' · ')]];
  return `<div class="metric-grid">${metrics.map(([a,b])=>`<div class="metric-card"><div class="metric-label">${escapeHtml(a)}</div><div class="metric-value">${escapeHtml(b)}</div></div>`).join('')}</div>
    <div class="tag-row">${(x.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
    <div class="evidence-bar"><b>근거</b><span>${escapeHtml(x.source||'미확인')}</span>${x.evidenceLevel?`<span>· L${x.evidenceLevel}</span>`:''}</div>
    ${rs.count?`<div class="section-title">구조화 리뷰 요약</div><div class="metric-grid"><div class="metric-card"><div class="metric-label">검증가중 평점</div><div class="metric-value">★ ${rs.weightedRating.toFixed(1)}</div></div><div class="metric-card"><div class="metric-label">약속-실제 일치</div><div class="metric-value">${rs.weightedPromiseMatch.toFixed(1)}/5</div></div></div>`:''}`;
}
function reviewsHtml(x){
  const list=entityReviews(x.id); const rs=reviewSummary(x.id);
  return `${rs.count?`<div class="metric-grid"><div class="metric-card"><div class="metric-label">검증가중</div><div class="metric-value">★ ${rs.weightedRating.toFixed(1)}</div></div><div class="metric-card"><div class="metric-label">약속-실제</div><div class="metric-value">${rs.weightedPromiseMatch.toFixed(1)}/5</div></div></div>`:''}
    <button class="primary-btn full-btn" id="write-review">이 장소 경험 남기기</button>
    <div class="section-title">Promise → Outcome</div>
    ${list.length?list.map(reviewCard).join(''):`<div class="review-card"><div class="review-summary">아직 리뷰가 없습니다. 첫 번째 경험을 남겨주세요.</div></div>`}`;
}
function reviewCard(r){ return `<div class="review-card"><div class="review-top"><span>${escapeHtml(r.author||'익명')}</span><span class="review-score">★ ${Number(r.rating).toFixed(1)} · L${r.evidenceLevel||0}</span></div><div class="review-summary">${escapeHtml(r.summary||'')}</div><div class="review-metrics">${Object.entries(r.metrics||{}).map(([k,v])=>`<span>${escapeHtml(k)}: ${escapeHtml(v)}</span>`).join('')}</div></div>`; }
function actionsHtml(x){
  const actions=[];
  if(x.kind==='job') actions.push(['내 직장으로 선택','실수령·집·통근·차량을 한 번에 비교','select-job','primary-action'],['이 회사 리뷰 보기','공고·계약·실제 결과 비교','reviews','']);
  if(x.kind==='housing') actions.push(['내 집 후보로 선택','월 잔여금·이사공백·보증 사전점검','select-home','primary-action'],['HomeSafe 상세','가격·권리·계약 확인 흐름','homesafe',''],['리뷰 남기기','월세·관리비·사진·보증금 결과','write-review','']);
  if(x.kind==='move') actions.push(['내 Move Plan에 추가','이사·창고·임시숙소 일정에 연결','add-move','primary-action']);
  if(x.kind==='community') actions.push(['생활권에 저장','집 비교 시 생활 적합도에 반영','save-place','primary-action']);
  return `<div class="action-stack">${actions.map(([t,s,a,c])=>`<button class="action-btn ${c}" data-action="${a}">${t}<small>${s}</small></button>`).join('')}</div>`;
}
function wireDrawerActions(x){
  const write=el('write-review'); if(write) write.onclick=()=>openReview(x.id);
  qsa('[data-action]',el('drawer-body')).forEach(btn=>btn.onclick=()=>{
    const a=btn.dataset.action;
    if(a==='select-job'){state.selectedJobId=x.id; toast('직장 후보로 선택했습니다.'); renderAll();}
    if(a==='select-home'){state.selectedHomeId=x.id; toast('주거 후보로 선택했습니다.'); renderAll();}
    if(a==='reviews'){state.drawerTab='reviews'; qsa('.drawer-tab').forEach(b=>b.classList.toggle('active',b.dataset.drawerTab==='reviews')); renderDrawer();}
    if(a==='write-review') openReview(x.id);
    if(a==='homesafe'){toast('HomeSafe 사전점검: 실제 연계 시 등기·가치·계약 데이터를 조회합니다.');}
    if(a==='add-move'){toast(`${x.name}을 Move Plan에 추가했습니다.`);}
    if(a==='save-place'){toast('생활권에 저장했습니다.');}
  });
}

function selectedVehicle(){ return vehicles.find(v=>v.id===state.selectedVehicleId)||vehicles[0]; }
function planMetrics(){
  const job=entityById(state.selectedJobId)||jobs[0]; const home=entityById(state.selectedHomeId)||housing[0]; const car=selectedVehicle();
  const transit={monthlyCost:job.commuteMonthly||80000,monthlyMinutes:(home.commuteMinutesByTransit||35)*2*22};
  const carMonthly=car.monthlyFinance+car.insurance+car.fuel+car.maintenance;
  const carOption={monthlyCost:carMonthly,monthlyMinutes:(home.commuteMinutesByCar||18)*2*22};
  const mobility=compareMobility({transit,car:carOption,maxIncrementalMonthlyCost:state.profile.maxIncrementalMobilityCost||230000,minMonthlyMinutesSaved:900});
  const commute=mobility.recommended==='car'?carOption:transit;
  const monthlySurplus=calculateMonthlySurplus({profile:state.profile,job,property:home,commute});
  const gap=calculateMoveGapDays(state.profile.moveOutDate,state.profile.moveInDate||home.availableFrom);
  const finance=getFinanceReadiness({visaRemainingMonths:state.profile.visaRemainingMonths,employmentVerified:state.profile.employmentVerified,incomeVerified:state.profile.incomeVerified,residenceVerified:state.profile.residenceVerified,propertyRisk:home.propertyRisk,hasVehicleTarget:true});
  return {job,home,car,transit,carOption,mobility,commute,monthlySurplus,gap,finance};
}
function renderJourney(){
  const p=planMetrics();
  const financeItems=[['보증',p.finance.guarantee],['신용',p.finance.credit],['오토',p.finance.auto],['담보',p.finance.mortgage]];
  el('journey-content').className='journey-content';
  el('journey-content').innerHTML=`
    <div class="selection-pair"><div class="selection-card"><span>WORK</span><strong>${escapeHtml(p.job.name)}</strong></div><div class="flow-arrow">→</div><div class="selection-card"><span>HOME</span><strong>${escapeHtml(p.home.name)}</strong></div></div>
    <div class="journey-metrics"><div class="journey-metric"><label>월 잔여금</label><strong>${money(p.monthlySurplus)}</strong></div><div class="journey-metric"><label>이사 공백</label><strong>${p.gap}일</strong></div><div class="journey-metric"><label>이동 추천</label><strong>${p.mobility.recommended==='car'?'차량':'대중교통'}</strong></div></div>
    <div class="journey-steps"><span class="journey-step active">직장</span><span class="journey-step active">집</span><span class="journey-step ${p.gap?'active':''}">이사</span><span class="journey-step ${p.gap?'active':''}">창고</span><span class="journey-step ${p.mobility.recommended==='car'?'active':''}">차량</span><span class="journey-step">금융</span><span class="journey-step">자산</span></div>
    <div class="finance-strip">${financeItems.map(([k,v])=>`<div class="finance-cell"><b>${k}</b><span class="${v==='precheck-ready'?'ready':'review-needed'}">${financeLabel(v)}</span></div>`).join('')}</div>
    <button class="secondary-btn full-btn" id="open-plan-detail" style="margin-top:9px">전체 플랜 보기</button>`;
  el('open-plan-detail').onclick=()=>openPlanDetail(p);
}
function financeLabel(v){ return ({'precheck-ready':'사전점검 가능','needs-review':'추가확인','partner-review':'파트너심사','not-yet':'아직 아님'})[v]||'확인'; }
function openPlanDetail(p){
  const gapCost=p.gap?119000+Math.max(1,p.gap)*49000:0;
  const vehicleExtra=p.mobility.incrementalCost;
  const body=`<div class="metric-grid"><div class="metric-card"><div class="metric-label">월 주거비</div><div class="metric-value">${money(calculateHousingMonthlyCost(p.home))}</div></div><div class="metric-card"><div class="metric-label">예상 월 잔여금</div><div class="metric-value">${money(p.monthlySurplus)}</div></div><div class="metric-card"><div class="metric-label">이사 공백 비용</div><div class="metric-value">${money(gapCost)}</div></div><div class="metric-card"><div class="metric-label">차량 추가비용</div><div class="metric-value">${money(vehicleExtra)}</div></div></div><div class="section-title">Agent 제안</div><div class="review-card"><div class="review-summary">${p.gap?`${p.gap}일의 입주 공백이 있어 창고 + 임시숙소 조합을 먼저 확인하세요.`:'퇴실·입주 일정 공백이 없습니다.'} ${p.mobility.recommended==='car'?`차량을 보유하면 월 ${Math.round(p.mobility.minutesSaved/60)}시간가량의 통근시간을 줄일 수 있는 시나리오입니다.`:'현재 조건에서는 대중교통 유지가 비용 측면에서 유리합니다.'}</div></div><div class="section-title">Finance Bridge</div><div class="review-card"><div class="review-summary">보증·대출은 승인 결과가 아니라 사용자 동의 기반의 사전점검으로만 표시합니다. 실제 승인 여부는 금융기관·보증기관 심사에서 결정됩니다.</div></div>`;
  el('entity-drawer').classList.remove('hidden'); el('journey-panel').classList.add('drawer-open'); el('drawer-kind').textContent='LIFE EVENT'; el('drawer-title').textContent='전체 이동 플랜'; el('drawer-source').textContent='내 프로필 + 선택한 직장·주거 + 데모 파트너 데이터'; el('drawer-body').innerHTML=body; qsa('.drawer-tab').forEach(b=>b.classList.remove('active'));
}

function renderAll(){ renderEntityList(); renderJourney(); renderMapLayers(); if(state.selectedEntityId) renderDrawer(); }

function openSheet(id){ el(id).classList.remove('hidden'); }
function closeSheets(){ qsa('.sheet').forEach(s=>s.classList.add('hidden')); }
function openReview(entityId){
  const x=entityById(entityId); if(!x) return; el('review-entity-id').value=entityId; el('review-entity-name').textContent=x.name; openSheet('review-modal');
}
function renderScoreChips(){
  qsa('.score-chips').forEach(group=>{ group.innerHTML=[1,2,3,4,5].map(n=>`<button type="button" data-score="${n}">${n}</button>`).join(''); const target=el(group.dataset.scoreTarget); qsa('button',group).forEach(btn=>btn.onclick=()=>{target.value=btn.dataset.score;qsa('button',group).forEach(b=>b.classList.toggle('active',b===btn));}); qsa('button',group)[3]?.classList.add('active'); });
}

function bindUI(){
  qsa('.layer-chip').forEach(btn=>btn.onclick=()=>{const layer=btn.dataset.layer;if(state.activeLayers.has(layer)) state.activeLayers.delete(layer); else state.activeLayers.add(layer);btn.classList.toggle('active',state.activeLayers.has(layer));renderAll();});
  qsa('.smart-filter').forEach(btn=>btn.onclick=()=>{state.filter=btn.dataset.filter;qsa('.smart-filter').forEach(b=>b.classList.toggle('active',b===btn));renderEntityList();});
  el('global-search').addEventListener('input',e=>{state.query=e.target.value;renderEntityList();}); el('search-clear').onclick=()=>{state.query='';el('global-search').value='';renderEntityList();};
  el('close-drawer').onclick=closeDrawer; qsa('.drawer-tab').forEach(btn=>btn.onclick=()=>{state.drawerTab=btn.dataset.drawerTab;qsa('.drawer-tab').forEach(b=>b.classList.toggle('active',b===btn));renderDrawer();});
  el('collapse-list').onclick=()=>{el('entity-list-panel').classList.toggle('collapsed');el('collapse-list').textContent=el('entity-list-panel').classList.contains('collapsed')?'›':'‹';};
  el('collapse-journey').onclick=()=>el('journey-panel').classList.toggle('collapsed');
  el('open-profile').onclick=()=>{populateProfile();openSheet('profile-panel');}; el('open-import').onclick=()=>openSheet('import-panel'); el('open-data-sources').onclick=()=>openSheet('source-panel');
  qsa('[data-close-sheet]').forEach(b=>b.onclick=closeSheets); qsa('.sheet').forEach(s=>s.addEventListener('click',e=>{if(e.target===s)closeSheets();}));
  el('profile-save').onclick=saveProfile; el('profile-ai-fill').onclick=()=>{Object.assign(state.profile,initialProfile);populateProfile();toast('샘플 문서에서 8개 항목을 자동 채운 시나리오입니다.');};
  el('quick-import-form').addEventListener('submit',handleImport);
  el('review-form').addEventListener('submit',handleReview);
  qsa('.evidence-chips button').forEach(btn=>btn.onclick=()=>{el('review-evidence').value=btn.dataset.evidence;qsa('.evidence-chips button').forEach(b=>b.classList.toggle('active',b===btn));});
  el('fit-map').onclick=()=>{if(state.map)state.map.setView([37.238,126.835],10.6);}; el('focus-plan').onclick=focusPlan;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheets();closeDrawer();}});
}
function populateProfile(){
  el('profile-visa').value=state.profile.visa; el('profile-visa-months').value=state.profile.visaRemainingMonths; el('profile-income').value=state.profile.currentNetIncome; el('profile-living').value=state.profile.monthlyLivingBudget; el('profile-housing').value=state.profile.maxHousingMonthly; el('profile-moveout').value=state.profile.moveOutDate; el('profile-movein').value=state.profile.moveInDate; el('profile-language').value=state.profile.language||'ko'; el('profile-employment-verified').checked=!!state.profile.employmentVerified; el('profile-income-verified').checked=!!state.profile.incomeVerified; el('profile-residence-verified').checked=!!state.profile.residenceVerified;
}
function saveProfile(){
  Object.assign(state.profile,{visa:el('profile-visa').value,visaRemainingMonths:Number(el('profile-visa-months').value),currentNetIncome:Number(el('profile-income').value),monthlyLivingBudget:Number(el('profile-living').value),maxHousingMonthly:Number(el('profile-housing').value),moveOutDate:el('profile-moveout').value,moveInDate:el('profile-movein').value,language:el('profile-language').value,employmentVerified:el('profile-employment-verified').checked,incomeVerified:el('profile-income-verified').checked,residenceVerified:el('profile-residence-verified').checked}); saveJson('lifemap-profile',state.profile); closeSheets();renderAll();toast('프로필을 저장했습니다. 다음부터 자동 계산됩니다.');
}
function handleImport(e){
  e.preventDefault(); const input=el('import-input').value.trim(); if(!input){toast('URL이나 텍스트를 넣어주세요.');return;}
  const kind=inferEntityKind(input); const id=`import-${Date.now()}`; const seed={id,kind,name:`가져온 ${kindLabel(kind)} · 검증대기`,area:'사용자 입력',source:'사용자 가져오기 · 검증대기 · DEMO PARSER',tags:['AI 구조화','출처 확인 필요'],lat:37.245+Math.random()*.03,lng:126.82+Math.random()*.03};
  if(kind==='job') Object.assign(seed,{estimatedNetIncome:2800000,baseSalary:2400000,shift:'문서에서 추출 필요',foreignHiringEvidence:'미확인',evidenceLevel:0,commuteMonthly:90000,reviewIds:[]});
  if(kind==='housing') Object.assign(seed,{deposit:5000000,rent:500000,managementFee:0,utilitiesEstimate:0,availableFrom:state.profile.moveInDate,homeSafe:0,propertyRisk:'unknown',reviewIds:[]});
  state.imported.push(seed); saveJson('lifemap-imported',state.imported); state.activeLayers.add(kind==='job'?'jobs':kind==='housing'?'housing':'community');
  el('import-result').classList.remove('hidden'); el('import-result').innerHTML=`<b>${escapeHtml(seed.name)}</b><br>유형: ${kindLabel(kind)}<br>현재는 PoC 파서입니다. 실서비스에서는 원문·출처·추출 필드·신뢰도를 보존하고 사용자 확인 후 확정합니다.`; renderAll(); toast('가져온 항목을 지도에 추가했습니다.');
}
function handleReview(e){
  e.preventDefault(); const entityId=el('review-entity-id').value; const review={id:`local-review-${Date.now()}`,entityId,rating:Number(el('review-rating').value),promiseMatch:Number(el('review-promise').value),evidenceLevel:Number(el('review-evidence').value),author:'내 경험 · 로컬 데모',summary:el('review-summary').value.trim()||'구조화 평가를 남겼습니다.',metrics:{}}; state.reviews.push(review); const locals=state.reviews.filter(r=>String(r.id).startsWith('local-review-')); localStorage.setItem('lifemap-local-reviews',JSON.stringify(locals)); closeSheets(); state.drawerTab='reviews'; renderDrawer();renderEntityList();toast('리뷰가 저장되었습니다.');
}
function focusPlan(){
  if(!state.map)return; const a=entityById(state.selectedJobId),b=entityById(state.selectedHomeId); if(!a||!b)return; state.map.fitBounds([[a.lat,a.lng],[b.lat,b.lng]],{padding:[80,80],maxZoom:12});
}
function renderSources(){ el('source-adapters').innerHTML=sourceAdapters.map(s=>`<div class="source-card"><div><strong>${s.name}</strong><p>${s.detail}</p></div><span class="source-status">샘플 연결</span></div>`).join(''); }

renderScoreChips(); renderSources(); bindUI(); initMap(); renderAll();
