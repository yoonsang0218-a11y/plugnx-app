import {
  calculateHousingMonthlyCost,
  calculateMonthlySurplus,
  calculateMoveGapDays,
  compareMobility,
  getFinanceReadiness,
  aggregateReviews,
  inferEntityKind,
  buildLifeEventPlan,
  getNextBestAction,
  estimateMoveBundle,
} from './core.mjs';
import {
  initialProfile, jobs, housing, community, moveServices, vehicles, reviews as seedReviews, sourceAdapters,
} from './data.mjs';

const EVENT_DEFINITIONS = [
  {id:'change-job',icon:'↗',title:'이직하고 싶어요',subtitle:'직장 → 집 → 이동'},
  {id:'move-home',icon:'⌂',title:'이사해야 해요',subtitle:'집 → 이사 → 정착'},
  {id:'commute-hard',icon:'⇄',title:'출퇴근이 힘들어요',subtitle:'이사 vs 차량'},
  {id:'sign-housing',icon:'✓',title:'집 계약을 앞뒀어요',subtitle:'검증 → 보증 → 계약'},
  {id:'settle-long-term',icon:'◇',title:'한국에서 오래 살래요',subtitle:'정착 → 자산 → 금융'},
  {id:'leave-korea',icon:'→',title:'한국을 떠날 예정이에요',subtitle:'퇴거 → 짐 → 정산'},
];

const state = {
  profile: loadJson('lifemap-profile', initialProfile),
  reviews: [...seedReviews, ...loadJson('lifemap-local-reviews', [])],
  imported: loadJson('lifemap-imported', []),
  activeLayers: new Set(['jobs','housing']),
  activeEventType: localStorage.getItem('lifemap-event') || 'move-home',
  selectedJobId: localStorage.getItem('lifemap-job') || 'job-1',
  selectedHomeId: localStorage.getItem('lifemap-home') || 'home-1',
  selectedEntityId: null,
  drawerTab: 'overview',
  filter: 'all',
  query: '',
  selectedVehicleId: 'vehicle-1',
  serviceModuleFilter: null,
  mapControlsOpen: false,
  map: null,
  markers: new Map(),
  route: null,
  financeCircles: [],
};

const el = (id) => document.getElementById(id);
const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
const money = (v) => `${Math.round(Number(v||0)/10000).toLocaleString()}만`;
const won = (v) => `${Math.round(Number(v||0)).toLocaleString()}원`;
const hours = (minutes) => `${Math.max(0,Math.round(Number(minutes||0)/60))}시간`;

function loadJson(key, fallback){
  try {
    const raw=localStorage.getItem(key);
    if(!raw) return structuredClone(fallback);
    const parsed=JSON.parse(raw);
    if(Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : structuredClone(fallback);
    return {...fallback, ...parsed};
  } catch { return structuredClone(fallback); }
}
function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function toast(message){ const t=el('toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),1800); }
function escapeHtml(value){ return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function kindLabel(kind){ return ({job:'직장',housing:'주거',community:'생활',move:'실행',vehicle:'차량',place:'장소'})[kind]||'장소'; }
function currentEvent(){ return EVENT_DEFINITIONS.find(x=>x.id===state.activeEventType) || EVENT_DEFINITIONS[1]; }
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
  state.markers.set(entity.id,marker);
  return marker;
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
  if(state.route){state.map.removeLayer(state.route);state.route=null;}
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
  if(state.serviceModuleFilter){
    const categoryMap={moving:'이사',storage:'창고','temporary-stay':'임시숙소',cleaning:'입주청소'};
    const target=categoryMap[state.serviceModuleFilter];
    if(target) items=items.filter(x=>x.kind!=='move'||x.category===target);
  }
  const query=state.query.trim().toLowerCase();
  if(query) items=items.filter(x=>`${x.name} ${x.area||''} ${(x.tags||[]).join(' ')}`.toLowerCase().includes(query));
  if(state.filter==='verified') items=items.filter(x=>(x.evidenceLevel||0)>=2 || (x.homeSafe||0)>=80);
  if(state.filter==='reviews') items=items.filter(x=>entityReviews(x.id).length>0);
  if(state.filter==='lowcost') items=[...items].sort((a,b)=>costSort(a)-costSort(b));
  return items;
}
function costSort(x){ if(x.kind==='housing') return calculateHousingMonthlyCost(x); if(x.kind==='job') return -x.estimatedNetIncome; return x.basePrice||99999999; }
function renderEntityList(){
  const items=visibleEntities();
  el('entity-list').innerHTML=items.length?items.map(entityCard).join(''):`<div style="padding:18px;color:#98a2b3;font-size:10px">조건에 맞는 항목이 없습니다.</div>`;
  qsa('.entity-card',el('entity-list')).forEach(card=>card.addEventListener('click',()=>openEntity(card.dataset.id)));
}
function entityCard(x){
  const rs=reviewSummary(x.id); const rating=rs.count?`★ ${rs.weightedRating.toFixed(1)} · ${rs.count}건`:'리뷰 대기';
  let meta='';
  if(x.kind==='job') meta=`<span class="entity-price">실수령 ${money(x.estimatedNetIncome)}</span><span>${escapeHtml(x.foreignHiringEvidence)}</span>`;
  if(x.kind==='housing') meta=`<span class="entity-price">월 ${money(calculateHousingMonthlyCost(x))}</span><span>보증금 ${money(x.deposit)}</span>`;
  if(x.kind==='community') meta=`<span>${escapeHtml(x.category)}</span>`;
  if(x.kind==='move') meta=`<span class="entity-price">${escapeHtml(x.category)} ${won(x.basePrice)}~</span>`;
  return `<article class="entity-card ${state.selectedEntityId===x.id?'active':''}" data-id="${x.id}">
    <div class="entity-card-top"><div><div class="entity-name">${escapeHtml(x.name)}</div><div class="entity-area">${escapeHtml(x.area||'')}</div></div><span class="mini-badge">${kindLabel(x.kind)}</span></div>
    <div class="entity-meta">${meta}</div><div class="review-line">${rating} · ${escapeHtml(x.source||'')}</div>
  </article>`;
}

function openEntity(id){
  state.selectedEntityId=id; state.drawerTab='overview';
  const x=entityById(id); if(!x) return;
  el('entity-drawer').classList.remove('hidden');
  el('drawer-kind').textContent=kindLabel(x.kind).toUpperCase(); el('drawer-title').textContent=x.name; el('drawer-source').textContent=`${x.source||'출처 미확인'} · 최근 검증: 데모 시각`;
  qsa('.drawer-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.drawerTab==='overview'));
  renderDrawer(); renderEntityList();
  const marker=state.markers.get(id); if(marker&&state.map) state.map.panTo(marker.getLatLng());
}
function closeDrawer(){ el('entity-drawer').classList.add('hidden'); state.selectedEntityId=null; renderEntityList(); }
function renderDrawer(){
  const x=entityById(state.selectedEntityId); if(!x) return;
  if(state.drawerTab==='overview') el('drawer-body').innerHTML=overviewHtml(x);
  if(state.drawerTab==='reviews') el('drawer-body').innerHTML=reviewsHtml(x);
  if(state.drawerTab==='actions') el('drawer-body').innerHTML=actionsHtml(x);
  wireDrawerActions(x);
}
function overviewHtml(x){
  const rs=reviewSummary(x.id); let metrics=[];
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
  const list=entityReviews(x.id), rs=reviewSummary(x.id);
  return `${rs.count?`<div class="metric-grid"><div class="metric-card"><div class="metric-label">검증가중</div><div class="metric-value">★ ${rs.weightedRating.toFixed(1)}</div></div><div class="metric-card"><div class="metric-label">약속-실제</div><div class="metric-value">${rs.weightedPromiseMatch.toFixed(1)}/5</div></div></div>`:''}
    <button class="primary-btn full-btn" id="write-review">이 장소 경험 남기기</button>
    <div class="section-title">Promise → Outcome</div>
    ${list.length?list.map(reviewCard).join(''):`<div class="review-card"><div class="review-summary">아직 리뷰가 없습니다. 첫 번째 경험을 남겨주세요.</div></div>`}`;
}
function reviewCard(r){ return `<div class="review-card"><div class="review-top"><span>${escapeHtml(r.author||'익명')}</span><span class="review-score">★ ${Number(r.rating).toFixed(1)} · L${r.evidenceLevel||0}</span></div><div class="review-summary">${escapeHtml(r.summary||'')}</div><div class="review-metrics">${Object.entries(r.metrics||{}).map(([k,v])=>`<span>${escapeHtml(k)}: ${escapeHtml(v)}</span>`).join('')}</div></div>`; }
function actionsHtml(x){
  const actions=[];
  if(x.kind==='job') actions.push(['이 회사를 내 직장으로','이후 집·통근·이사 플랜 자동 갱신','select-job','primary-action'],['이 회사 리뷰 보기','공고·계약·실제 결과 비교','reviews','']);
  if(x.kind==='housing') actions.push(['이 집을 후보로','HomeSafe·월 잔여금·이사 플랜 갱신','select-home','primary-action'],['HomeSafe 상세','가격·권리·계약 확인 흐름','homesafe',''],['리뷰 남기기','월세·관리비·사진·보증금 결과','write-review','']);
  if(x.kind==='move') actions.push(['이 실행 옵션 보기','현재 Life Event에 연결','add-move','primary-action']);
  if(x.kind==='community') actions.push(['생활권에 저장','집 비교 시 생활 적합도에 반영','save-place','primary-action']);
  return `<div class="action-stack">${actions.map(([t,s,a,c])=>`<button class="action-btn ${c}" data-action="${a}">${t}<small>${s}</small></button>`).join('')}</div>`;
}
function wireDrawerActions(x){
  const write=el('write-review'); if(write) write.onclick=()=>openReview(x.id);
  qsa('[data-action]',el('drawer-body')).forEach(btn=>btn.onclick=()=>{
    const a=btn.dataset.action;
    if(a==='select-job'){state.selectedJobId=x.id;localStorage.setItem('lifemap-job',x.id);toast('직장 후보가 바뀌어 Life Event 플랜을 다시 계산했습니다.');renderAll();}
    if(a==='select-home'){state.selectedHomeId=x.id;localStorage.setItem('lifemap-home',x.id);toast('주거 후보가 바뀌어 Life Event 플랜을 다시 계산했습니다.');renderAll();}
    if(a==='reviews'){state.drawerTab='reviews';qsa('.drawer-tab').forEach(b=>b.classList.toggle('active',b.dataset.drawerTab==='reviews'));renderDrawer();}
    if(a==='write-review') openReview(x.id);
    if(a==='homesafe') activateModule('homesafe');
    if(a==='add-move') activateModule(moduleForMoveCategory(x.category));
    if(a==='save-place') toast('생활권에 저장했습니다.');
  });
}

function selectedVehicle(){ return vehicles.find(v=>v.id===state.selectedVehicleId)||vehicles[0]; }
function planMetrics(){
  const job=entityById(state.selectedJobId)||jobs[0];
  const home=entityById(state.selectedHomeId)||housing[0];
  const car=selectedVehicle();
  const transit={monthlyCost:job.commuteMonthly||80000,monthlyMinutes:(home.commuteMinutesByTransit||35)*2*22};
  const carMonthly=car.monthlyFinance+car.insurance+car.fuel+car.maintenance;
  const carOption={monthlyCost:carMonthly,monthlyMinutes:(home.commuteMinutesByCar||18)*2*22};
  const mobility=compareMobility({transit,car:carOption,maxIncrementalMonthlyCost:state.profile.maxIncrementalMobilityCost||230000,minMonthlyMinutesSaved:900});
  const commute=mobility.recommended==='car'?carOption:transit;
  const monthlySurplus=calculateMonthlySurplus({profile:state.profile,job,property:home,commute});
  const gap=calculateMoveGapDays(state.profile.moveOutDate,state.profile.moveInDate||home.availableFrom);
  const finance=getFinanceReadiness({visaRemainingMonths:state.profile.visaRemainingMonths,employmentVerified:state.profile.employmentVerified,incomeVerified:state.profile.incomeVerified,residenceVerified:state.profile.residenceVerified,propertyRisk:home.propertyRisk,hasVehicleTarget:mobility.recommended==='car'});
  const eventPlan=buildLifeEventPlan({eventType:state.activeEventType,profile:state.profile,job,property:home,mobility,finance});
  const moveBundle=estimateMoveBundle({gapDays:gap,includeCleaning:true});
  return {job,home,car,transit,carOption,mobility,commute,monthlySurplus,gap,finance,eventPlan,moveBundle};
}

function renderEventChooser(){
  el('event-chooser').innerHTML=EVENT_DEFINITIONS.map(event=>`<button class="event-card ${state.activeEventType===event.id?'active':''}" data-event="${event.id}"><span class="event-icon">${event.icon}</span><strong>${event.title}</strong><span>${event.subtitle}</span></button>`).join('');
  qsa('[data-event]',el('event-chooser')).forEach(btn=>btn.onclick=()=>selectEvent(btn.dataset.event));
}
function selectEvent(eventType){
  state.activeEventType=eventType; localStorage.setItem('lifemap-event',eventType); state.serviceModuleFilter=null;
  const presets={
    'change-job':['jobs','housing'],
    'move-home':['housing','move'],
    'commute-hard':['jobs','housing','mobility'],
    'sign-housing':['housing','finance'],
    'settle-long-term':['housing','finance'],
    'leave-korea':['housing','move'],
  };
  state.activeLayers=new Set(presets[eventType]||['jobs','housing']);
  qsa('.layer-chip').forEach(btn=>btn.classList.toggle('active',state.activeLayers.has(btn.dataset.layer)));
  renderAll(); focusPlan();
}
function renderCockpit(){
  const p=planMetrics(), event=currentEvent(), next=getNextBestAction(p.eventPlan);
  el('event-current-title').textContent=event.title;
  el('event-current-subtitle').textContent=event.subtitle;
  el('selection-pair').innerHTML=`<div class="selection-card"><span>WORK</span><strong>${escapeHtml(p.job.name)}</strong></div><div class="flow-arrow">→</div><div class="selection-card"><span>HOME</span><strong>${escapeHtml(p.home.name)}</strong></div>`;
  renderNextAction(next);
  renderTimeline(p.eventPlan);
  renderExecutionPanel(p);
}
function renderNextAction(next){
  if(!next){el('next-action-title').textContent='현재 필요한 행동이 없습니다.';el('next-action-reason').textContent='지도에서 새로운 직장이나 집을 선택해보세요.';el('next-action-cta').textContent='지도 보기';el('next-action-cta').onclick=()=>focusPlan();return;}
  el('next-action-title').textContent=next.title;
  el('next-action-reason').textContent=next.reason;
  el('next-action-cta').textContent=next.cta;
  el('next-action-cta').onclick=()=>activateModule(next.module);
}
function statusLabel(status){return ({done:'완료',next:'지금',recommended:'추천',blocked:'선행 필요',optional:'선택',later:'나중'})[status]||status;}
function renderTimeline(plan){
  const done=plan.timeline.filter(x=>x.status==='done').length;
  el('timeline-progress').textContent=`${done} / ${plan.timeline.length}`;
  el('event-timeline').innerHTML=plan.timeline.map((item,index)=>`<article class="timeline-item ${item.status}" data-module="${item.module}"><div class="timeline-dot">${item.status==='done'?'✓':index+1}</div><div class="timeline-body"><div class="timeline-title-row"><span class="timeline-title">${escapeHtml(item.title)}</span><span class="timeline-status">${statusLabel(item.status)}</span></div><div class="timeline-reason">${escapeHtml(item.reason)}</div></div></article>`).join('');
  qsa('.timeline-item',el('event-timeline')).forEach(item=>item.onclick=()=>activateModule(item.dataset.module));
}
function renderExecutionPanel(p){
  const visible=p.eventPlan.timeline.filter(item=>['next','recommended','blocked'].includes(item.status));
  const seen=new Set();
  const html=[];
  visible.forEach(item=>{if(seen.has(item.module))return;seen.add(item.module);html.push(executionModuleHtml(item,p));});
  if(!html.length) html.push(`<div class="execution-card"><h3>필요한 실행을 기다리는 중</h3><p>선택한 직장·집 또는 일정이 바뀌면 필요한 모듈만 이곳에 나타납니다.</p></div>`);
  el('execution-panel').innerHTML=html.join('');
  qsa('[data-module-action]',el('execution-panel')).forEach(btn=>btn.onclick=()=>activateModule(btn.dataset.moduleAction));
  qsa('[data-vehicle]',el('execution-panel')).forEach(btn=>btn.onclick=()=>{state.selectedVehicleId=btn.dataset.vehicle;renderAll();toast('차량 후보를 바꿨습니다.');});
}
function executionModuleHtml(item,p){
  const m=item.module;
  if(m==='moving'||m==='storage'||m==='temporary-stay'||m==='cleaning') return moveModuleHtml(m,p,item);
  if(m==='homesafe') return `<article class="execution-card highlight"><div class="execution-head"><div><span class="execution-label">HOMESAFE</span><h3>계약 전 위험 확인</h3></div><span class="status-pill ${p.home.homeSafe>=80?'status-ready':'status-review'}">${p.home.homeSafe}/100</span></div><p>${escapeHtml(p.home.name)}의 가격·권리·계약 조건을 먼저 확인합니다. 현재 데이터는 데모입니다.</p><div class="module-grid"><div class="module-option"><span>보증금</span><strong>${money(p.home.deposit)}</strong></div><div class="module-option"><span>물건 위험</span><strong>${escapeHtml(p.home.propertyRisk)}</strong></div></div><button class="module-cta" data-module-action="homesafe">HomeSafe 보기</button></article>`;
  if(m==='housing-finance') return financeModuleHtml('주거 보증·자금',p.finance.guarantee,'보증·보증금 금융은 승인 결과가 아니라 사전점검 준비도로만 표시합니다.','housing-finance');
  if(m==='mobility') return mobilityModuleHtml(p);
  if(m==='used-car') return usedCarModuleHtml(p);
  if(m==='auto-finance') return financeModuleHtml('오토금융',p.finance.auto,'차량을 선택한 뒤 재직·소득·체류 정보로 파트너 사전점검을 준비합니다.','auto-finance');
  if(m==='housing') return `<article class="execution-card highlight"><span class="execution-label">DECISION</span><h3>직장 기준 집 비교</h3><p>${escapeHtml(p.job.name)} 기준으로 월 잔여금과 통근시간이 좋은 집을 지도에서 고르세요.</p><button class="module-cta" data-module-action="housing">집 비교하기</button></article>`;
  if(m==='workproof') return `<article class="execution-card"><span class="execution-label">WORKPROOF</span><h3>${escapeHtml(p.job.name)}</h3><p>${escapeHtml(p.job.foreignHiringEvidence||'채용 근거 미확인')} · 예상 실수령 ${money(p.job.estimatedNetIncome)}</p><button class="module-cta" data-module-action="workproof">직장 근거 보기</button></article>`;
  if(m==='passport') return `<article class="execution-card highlight"><span class="execution-label">FINANCIAL PASSPORT</span><h3>정착 준비도 묶기</h3><p>재직 ${state.profile.employmentVerified?'확인':'미확인'} · 소득 ${state.profile.incomeVerified?'확인':'미확인'} · 거주 ${state.profile.residenceVerified?'확인':'미확인'} · 체류 ${state.profile.visaRemainingMonths}개월</p><button class="module-cta" data-module-action="passport">Passport 보기</button></article>`;
  if(m==='mortgage') return financeModuleHtml('주택구입 금융',p.finance.mortgage,'장기 정착 이벤트에서만 파트너 심사 조건을 확인합니다.','mortgage');
  if(m==='valuation') return genericModule('가치평가·감정평가','공간의가치·감정평가 프로젝트와 연결할 실행 레이어입니다.','valuation');
  if(m==='registration') return genericModule('전자등기','대출 승인 이후 담보설정·등기 사건으로 연결하는 후속 레일입니다.','registration');
  if(m==='exit') return genericModule('출국·퇴거 플랜','퇴거일과 보증금 반환일, 짐 처리 일정을 한 번에 정리합니다.','exit');
  if(m==='settlement') return genericModule('정산·환급','보증금·미지급금·환급·송금의 확인 순서를 관리합니다.','settlement');
  return genericModule(item.title,item.reason,m);
}
function moveModuleHtml(module,p,item){
  const categoryMap={moving:'이사',storage:'창고','temporary-stay':'임시숙소',cleaning:'입주청소'};
  const candidates=moveServices.filter(x=>x.category===categoryMap[module]);
  const first=candidates[0];
  const gapText=p.gap?`${p.gap}일 공백 기준`:'입주 일정 기준';
  const bundle=estimateMoveBundle({gapDays:p.gap,includeCleaning:true});
  const estimate=bundle.modules.reduce((sum,key)=>sum+estimateModuleCost(key,p.gap),0);
  return `<article class="execution-card ${item.status==='next'?'highlight':''}"><div class="execution-head"><div><span class="execution-label">MOVE OS · ${escapeHtml(categoryMap[module])}</span><h3>${escapeHtml(item.title)}</h3></div><span class="status-pill ${item.status==='next'?'status-ready':'status-review'}">${statusLabel(item.status)}</span></div><p>${escapeHtml(item.reason)} · ${gapText}</p>${first?`<div class="module-option"><span>샘플 파트너</span><strong>${escapeHtml(first.name)} · ${won(first.basePrice)}~</strong></div>`:''}<div class="bundle-total"><span>현재 Move Bundle 추정</span><strong>${won(estimate)}~</strong></div><button class="module-cta" data-module-action="${module}">${escapeHtml(item.cta)}</button></article>`;
}
function estimateModuleCost(module,gapDays){
  if(module==='moving') return moveServices.find(x=>x.category==='이사')?.basePrice||145000;
  if(module==='storage') return moveServices.find(x=>x.category==='창고')?.basePrice||119000;
  if(module==='temporary-stay') return (moveServices.find(x=>x.category==='임시숙소')?.basePrice||49000)*Math.max(1,gapDays);
  if(module==='cleaning') return moveServices.find(x=>x.category==='입주청소')?.basePrice||120000;
  return 0;
}
function mobilityModuleHtml(p){
  return `<article class="execution-card highlight"><span class="execution-label">MOBILITY DECISION</span><h3>현재 집 유지 vs 차량</h3><p>차량은 별도 쇼핑 메뉴가 아니라 통근 문제를 풀 때만 나타납니다.</p><div class="module-grid"><div class="module-option"><span>대중교통 월비용</span><strong>${won(p.transit.monthlyCost)}</strong></div><div class="module-option"><span>차량 월비용</span><strong>${won(p.carOption.monthlyCost)}</strong></div><div class="module-option"><span>절약 가능 시간</span><strong>${hours(p.mobility.minutesSaved)}</strong></div><div class="module-option"><span>추가 월비용</span><strong>${won(p.mobility.incrementalCost)}</strong></div></div><button class="module-cta" data-module-action="mobility">지도에서 통근 경로 보기</button></article>`;
}
function usedCarModuleHtml(p){
  return `<article class="execution-card"><span class="execution-label">USED CAR · LIFE-FIT</span><h3>내 생활비에 맞는 차량 후보</h3><p>가격순이 아니라 월 가처분소득·통근거리·보험·유류비를 합친 Total Cost of Mobility로 비교합니다.</p><div class="vehicle-row">${vehicles.slice(0,3).map(v=>`<button class="vehicle-card ${v.id===state.selectedVehicleId?'selected':''}" data-vehicle="${v.id}"><strong>${escapeHtml(v.name.replace(' · 샘플',''))}</strong><span>${money(v.price)} · 월 ${won(v.monthlyFinance+v.insurance+v.fuel+v.maintenance)}</span></button>`).join('')}</div></article>`;
}
function financeModuleHtml(title,status,copy,module){
  const ready=status==='precheck-ready';
  return `<article class="execution-card"><div class="execution-head"><div><span class="execution-label">FINANCIAL BRIDGE</span><h3>${escapeHtml(title)}</h3></div><span class="status-pill ${ready?'status-ready':'status-review'}">${financeLabel(status)}</span></div><p>${escapeHtml(copy)}</p><button class="module-cta" data-module-action="${module}">준비도 확인</button></article>`;
}
function genericModule(title,copy,module){return `<article class="execution-card"><span class="execution-label">EXECUTION</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p><button class="module-cta light" data-module-action="${module}">흐름 보기</button></article>`;}
function financeLabel(v){ return ({'precheck-ready':'사전점검 가능','needs-review':'추가확인','partner-review':'파트너심사','not-yet':'아직 아님'})[v]||'확인'; }

function moduleForMoveCategory(category){return ({'이사':'moving','창고':'storage','임시숙소':'temporary-stay','입주청소':'cleaning'})[category]||'moving';}
function activateModule(module){
  state.serviceModuleFilter=null;
  if(module==='housing'){state.activeLayers.add('housing');state.activeLayers.delete('move');openMapOptions(false);toast('지도에서 집 후보를 선택하세요.');renderAll();return;}
  if(module==='workproof'){openEntity(state.selectedJobId);return;}
  if(module==='homesafe'){openEntity(state.selectedHomeId);toast('HomeSafe는 실제 연계 시 등기·가치·계약 데이터를 확인합니다.');return;}
  if(['moving','storage','temporary-stay','cleaning'].includes(module)){
    state.activeLayers.add('move');state.serviceModuleFilter=module;qsa('.layer-chip').forEach(btn=>btn.classList.toggle('active',state.activeLayers.has(btn.dataset.layer)));renderAll();toast('해당 실행 파트너만 지도·목록에 표시했습니다.');return;
  }
  if(module==='mobility'){state.activeLayers.add('mobility');renderAll();focusPlan();toast('선택한 직장과 집의 통근 경로를 표시했습니다.');return;}
  if(module==='used-car'){toast('차량은 통근 분석에서 필요할 때만 추천합니다.');return;}
  if(['housing-finance','auto-finance','mortgage'].includes(module)){toast('금융은 승인 대신 사전점검/파트너심사 준비도만 제공합니다.');return;}
  if(module==='passport'){populateProfile();openSheet('profile-panel');return;}
  if(module==='address-change'){toast('입주 후 체류지·은행·보험·회사 주소 변경 체크리스트로 연결합니다.');return;}
  if(module==='valuation'){toast('공간의가치·감정평가 연계 단계입니다.');return;}
  if(module==='registration'){toast('금융 승인 후 전자등기 사건으로 연결하는 단계입니다.');return;}
  if(module==='exit'||module==='settlement'){toast('출국 정산·퇴거 워크플로우로 연결하는 단계입니다.');return;}
}

function renderAll(){renderEventChooser();renderEntityList();renderCockpit();renderMapLayers();if(state.selectedEntityId)renderDrawer();}
function openSheet(id){el(id).classList.remove('hidden');}
function closeSheets(){qsa('.sheet').forEach(s=>s.classList.add('hidden'));}
function openReview(entityId){const x=entityById(entityId);if(!x)return;el('review-entity-id').value=entityId;el('review-entity-name').textContent=x.name;openSheet('review-modal');}
function renderScoreChips(){
  qsa('.score-chips').forEach(group=>{group.innerHTML=[1,2,3,4,5].map(n=>`<button type="button" data-score="${n}">${n}</button>`).join('');const target=el(group.dataset.scoreTarget);qsa('button',group).forEach(btn=>btn.onclick=()=>{target.value=btn.dataset.score;qsa('button',group).forEach(b=>b.classList.toggle('active',b===btn));});qsa('button',group)[3]?.classList.add('active');});
}
function openMapOptions(force){
  state.mapControlsOpen=typeof force==='boolean'?force:!state.mapControlsOpen;
  el('advanced-map-controls').classList.toggle('hidden',!state.mapControlsOpen);
  el('toggle-map-controls').setAttribute('aria-expanded',String(state.mapControlsOpen));
}
function bindUI(){
  qsa('.layer-chip').forEach(btn=>btn.onclick=()=>{const layer=btn.dataset.layer;if(state.activeLayers.has(layer))state.activeLayers.delete(layer);else state.activeLayers.add(layer);btn.classList.toggle('active',state.activeLayers.has(layer));state.serviceModuleFilter=null;renderAll();});
  qsa('.smart-filter').forEach(btn=>btn.onclick=()=>{state.filter=btn.dataset.filter;qsa('.smart-filter').forEach(b=>b.classList.toggle('active',b===btn));renderEntityList();});
  el('global-search').addEventListener('input',e=>{state.query=e.target.value;renderEntityList();});
  el('search-clear').onclick=()=>{state.query='';el('global-search').value='';renderEntityList();};
  el('toggle-map-controls').onclick=()=>openMapOptions();
  el('close-drawer').onclick=closeDrawer;
  qsa('.drawer-tab').forEach(btn=>btn.onclick=()=>{state.drawerTab=btn.dataset.drawerTab;qsa('.drawer-tab').forEach(b=>b.classList.toggle('active',b===btn));renderDrawer();});
  el('collapse-list').onclick=()=>{el('entity-list-panel').classList.toggle('collapsed');el('collapse-list').textContent=el('entity-list-panel').classList.contains('collapsed')?'›':'‹';};
  el('open-profile').onclick=()=>{populateProfile();openSheet('profile-panel');};
  el('open-import').onclick=()=>openSheet('import-panel');
  el('open-data-sources').onclick=()=>openSheet('source-panel');
  qsa('[data-close-sheet]').forEach(b=>b.onclick=closeSheets);qsa('.sheet').forEach(s=>s.addEventListener('click',e=>{if(e.target===s)closeSheets();}));
  el('profile-save').onclick=saveProfile;
  el('profile-ai-fill').onclick=()=>{Object.assign(state.profile,initialProfile);populateProfile();toast('샘플 문서에서 프로필을 자동 채운 시나리오입니다.');};
  el('quick-import-form').addEventListener('submit',handleImport);
  el('review-form').addEventListener('submit',handleReview);
  qsa('.evidence-chips button').forEach(btn=>btn.onclick=()=>{el('review-evidence').value=btn.dataset.evidence;qsa('.evidence-chips button').forEach(b=>b.classList.toggle('active',b===btn));});
  el('fit-map').onclick=()=>{if(state.map)state.map.setView([37.238,126.835],10.6);};
  el('focus-plan').onclick=focusPlan;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheets();closeDrawer();openMapOptions(false);}});
}
function populateProfile(){
  el('profile-visa').value=state.profile.visa;el('profile-visa-months').value=state.profile.visaRemainingMonths;el('profile-income').value=state.profile.currentNetIncome;el('profile-living').value=state.profile.monthlyLivingBudget;el('profile-housing').value=state.profile.maxHousingMonthly;el('profile-moveout').value=state.profile.moveOutDate;el('profile-movein').value=state.profile.moveInDate;el('profile-language').value=state.profile.language||'ko';el('profile-employment-verified').checked=!!state.profile.employmentVerified;el('profile-income-verified').checked=!!state.profile.incomeVerified;el('profile-residence-verified').checked=!!state.profile.residenceVerified;
}
function saveProfile(){
  Object.assign(state.profile,{visa:el('profile-visa').value,visaRemainingMonths:Number(el('profile-visa-months').value),currentNetIncome:Number(el('profile-income').value),monthlyLivingBudget:Number(el('profile-living').value),maxHousingMonthly:Number(el('profile-housing').value),moveOutDate:el('profile-moveout').value,moveInDate:el('profile-movein').value,language:el('profile-language').value,employmentVerified:el('profile-employment-verified').checked,incomeVerified:el('profile-income-verified').checked,residenceVerified:el('profile-residence-verified').checked});saveJson('lifemap-profile',state.profile);closeSheets();renderAll();toast('프로필을 저장해 다음 Life Event에도 재사용합니다.');
}
function handleImport(e){
  e.preventDefault();const input=el('import-input').value.trim();if(!input){toast('URL이나 텍스트를 넣어주세요.');return;}
  const kind=inferEntityKind(input),id=`import-${Date.now()}`;
  const seed={id,kind,name:`가져온 ${kindLabel(kind)} · 검증대기`,area:'사용자 입력',source:'사용자 가져오기 · 검증대기 · DEMO PARSER',tags:['AI 구조화','출처 확인 필요'],lat:37.245+Math.random()*.03,lng:126.82+Math.random()*.03};
  if(kind==='job')Object.assign(seed,{estimatedNetIncome:2800000,baseSalary:2400000,shift:'문서에서 추출 필요',foreignHiringEvidence:'미확인',evidenceLevel:0,commuteMonthly:90000,reviewIds:[]});
  if(kind==='housing')Object.assign(seed,{deposit:5000000,rent:500000,managementFee:0,utilitiesEstimate:0,availableFrom:state.profile.moveInDate,homeSafe:0,propertyRisk:'unknown',reviewIds:[]});
  state.imported.push(seed);saveJson('lifemap-imported',state.imported);state.activeLayers.add(kind==='job'?'jobs':kind==='housing'?'housing':'community');
  el('import-result').classList.remove('hidden');el('import-result').innerHTML=`<b>${escapeHtml(seed.name)}</b><br>유형: ${kindLabel(kind)}<br>현재는 PoC 파서입니다. 실서비스에서는 원문·출처·추출 필드·신뢰도를 보존하고 사용자 확인 후 확정합니다.`;renderAll();toast('가져온 항목을 지도에 추가했습니다.');
}
function handleReview(e){
  e.preventDefault();const entityId=el('review-entity-id').value;const review={id:`local-review-${Date.now()}`,entityId,rating:Number(el('review-rating').value),promiseMatch:Number(el('review-promise').value),evidenceLevel:Number(el('review-evidence').value),author:'내 경험 · 로컬 데모',summary:el('review-summary').value.trim()||'구조화 평가를 남겼습니다.',metrics:{}};state.reviews.push(review);const locals=state.reviews.filter(r=>String(r.id).startsWith('local-review-'));localStorage.setItem('lifemap-local-reviews',JSON.stringify(locals));closeSheets();state.drawerTab='reviews';renderDrawer();renderEntityList();toast('리뷰가 저장되었습니다.');
}
function focusPlan(){if(!state.map)return;const a=entityById(state.selectedJobId),b=entityById(state.selectedHomeId);if(!a||!b)return;state.map.fitBounds([[a.lat,a.lng],[b.lat,b.lng]],{padding:[80,80],maxZoom:12});}
function renderSources(){el('source-adapters').innerHTML=sourceAdapters.map(s=>`<div class="source-card"><div><strong>${escapeHtml(s.name)}</strong><p>${escapeHtml(s.detail)}</p></div><span class="source-status">샘플 연결</span></div>`).join('');}

renderScoreChips();renderSources();bindUI();initMap();renderAll();
