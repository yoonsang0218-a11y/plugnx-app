export const initialProfile = {
  name: 'Minh',
  visa: 'E-7',
  visaRemainingMonths: 22,
  employmentVerified: true,
  incomeVerified: true,
  residenceVerified: true,
  currentNetIncome: 2750000,
  monthlyLivingBudget: 420000,
  maxHousingMonthly: 750000,
  maxIncrementalMobilityCost: 230000,
  moveOutDate: '2026-09-18',
  moveInDate: '2026-10-02',
  language: 'ko',
};

export const jobs = [
  {id:'job-1',kind:'job',name:'화성 테크웍스',lat:37.1816,lng:126.8313,area:'화성 · 남양',role:'생산 오퍼레이터',estimatedNetIncome:2880000,baseSalary:2480000,shift:'주간 08:00–17:00 · 잔업 선택',dorm:true,shuttle:true,foreignHiringEvidence:'기업 확인',evidenceLevel:3,source:'파트너 피드 · DEMO DATA',publicRisk:'공개 위험신호 없음 (데모)',tags:['E-7','E-9 검토','기숙사','통근버스'],reviewIds:['r-job1-1','r-job1-2'],commuteMonthly:60000},
  {id:'job-2',kind:'job',name:'반월 프리시전',lat:37.3105,lng:126.7869,area:'안산 · 반월산단',role:'CNC 가공',estimatedNetIncome:3010000,baseSalary:2550000,shift:'2교대 · 야간 포함',dorm:false,shuttle:false,foreignHiringEvidence:'공고 명시',evidenceLevel:2,source:'채용공고 가져오기 · DEMO DATA',publicRisk:'확인 필요 1건 (데모)',tags:['E-7','야간','경력우대'],reviewIds:['r-job2-1'],commuteMonthly:110000},
  {id:'job-3',kind:'job',name:'시흥 모션랩',lat:37.3449,lng:126.7302,area:'시흥 · 정왕',role:'물류·포장',estimatedNetIncome:2690000,baseSalary:2350000,shift:'07:00–16:00',dorm:true,shuttle:false,foreignHiringEvidence:'과거 외국인 고용 확인',evidenceLevel:2,source:'WorkProof · DEMO DATA',publicRisk:'공개 위험신호 없음 (데모)',tags:['E-9','기숙사'],reviewIds:['r-job3-1'],commuteMonthly:80000},
  {id:'job-4',kind:'job',name:'평택 그린팩',lat:37.0126,lng:127.0707,area:'평택 · 청북',role:'식품 포장',estimatedNetIncome:2760000,baseSalary:2380000,shift:'06:30–15:30',dorm:true,shuttle:true,foreignHiringEvidence:'비자 적합 추정',evidenceLevel:1,source:'규칙엔진 · DEMO DATA',publicRisk:'기업 확인 전',tags:['E-9 추정','새벽출근','통근버스'],reviewIds:[],commuteMonthly:70000},
];

export const housing = [
  {id:'home-1',kind:'housing',name:'남양 스테이 A',lat:37.1983,lng:126.8206,area:'화성 · 남양',type:'원룸',deposit:5000000,rent:520000,managementFee:70000,utilitiesEstimate:60000,availableFrom:'2026-10-02',homeSafe:86,propertyRisk:'low',valueEstimate:118000000,commuteMinutesByTransit:24,commuteMinutesByCar:12,source:'제휴 숙소 · DEMO DATA',tags:['외국인 계약 경험','주차','가구포함'],reviewIds:['r-home1-1','r-home1-2']},
  {id:'home-2',kind:'housing',name:'사동 오피스텔 7F',lat:37.2988,lng:126.8433,area:'안산 · 사동',type:'오피스텔',deposit:10000000,rent:590000,managementFee:90000,utilitiesEstimate:70000,availableFrom:'2026-09-25',homeSafe:78,propertyRisk:'low',valueEstimate:164000000,commuteMinutesByTransit:41,commuteMinutesByCar:19,source:'매물 가져오기 · DEMO DATA',tags:['역세권','관리비 확인'],reviewIds:['r-home2-1']},
  {id:'home-3',kind:'housing',name:'정왕 쉐어하우스',lat:37.3452,lng:126.7448,area:'시흥 · 정왕',type:'쉐어하우스',deposit:1000000,rent:360000,managementFee:50000,utilitiesEstimate:40000,availableFrom:'2026-09-15',homeSafe:72,propertyRisk:'medium',valueEstimate:null,commuteMinutesByTransit:31,commuteMinutesByCar:15,source:'커뮤니티 제보 · DEMO DATA',tags:['저보증금','베트남 커뮤니티'],reviewIds:['r-home3-1']},
  {id:'home-4',kind:'housing',name:'향남 아파트 101동',lat:37.1302,lng:126.9192,area:'화성 · 향남',type:'아파트',deposit:30000000,rent:680000,managementFee:110000,utilitiesEstimate:80000,availableFrom:'2026-10-06',homeSafe:91,propertyRisk:'low',valueEstimate:278000000,commuteMinutesByTransit:48,commuteMinutesByCar:21,source:'부동산 파트너 · DEMO DATA',tags:['가족','주차','가치평가 연계'],reviewIds:['r-home4-1']},
  {id:'home-5',kind:'housing',name:'청북 미니룸',lat:37.0208,lng:127.0640,area:'평택 · 청북',type:'원룸',deposit:3000000,rent:430000,managementFee:60000,utilitiesEstimate:55000,availableFrom:'2026-09-20',homeSafe:68,propertyRisk:'medium',valueEstimate:96000000,commuteMinutesByTransit:18,commuteMinutesByCar:9,source:'사용자 가져오기 · DEMO DATA',tags:['직주근접','계약조건 확인'],reviewIds:[]},
];

export const community = [
  {id:'community-1',kind:'community',name:'베트남 식료품점 · 샘플',lat:37.3410,lng:126.7465,area:'시흥 · 정왕',category:'식료품',source:'지역 데이터 · DEMO DATA',tags:['베트남어']},
  {id:'community-2',kind:'community',name:'외국인 진료의원 · 샘플',lat:37.3189,lng:126.8354,area:'안산 · 고잔',category:'의료',source:'공공/제휴 · DEMO DATA',tags:['영어','베트남어']},
  {id:'community-3',kind:'community',name:'글로벌 지원센터 · 샘플',lat:37.3224,lng:126.8318,area:'안산 · 고잔',category:'지원센터',source:'공공데이터 · DEMO DATA',tags:['생활상담']},
  {id:'community-4',kind:'community',name:'중앙아시아 마트 · 샘플',lat:37.3496,lng:126.7378,area:'시흥 · 정왕',category:'식료품',source:'지역 데이터 · DEMO DATA',tags:['러시아어']},
];

export const moveServices = [
  {id:'move-1',kind:'move',name:'MoveMate 이사 · 샘플',lat:37.2580,lng:126.8320,area:'안산·화성',category:'이사',basePrice:145000,source:'제휴 예정 · DEMO DATA',tags:['다국어 요청서','1톤']},
  {id:'move-2',kind:'move',name:'BoxKeep 스토리지 · 샘플',lat:37.2795,lng:126.8050,area:'안산',category:'창고',basePrice:119000,source:'제휴 예정 · DEMO DATA',tags:['월단위','픽업 옵션']},
  {id:'move-3',kind:'move',name:'Bridge Stay · 샘플',lat:37.2204,lng:126.8462,area:'화성',category:'임시숙소',basePrice:49000,source:'숙박 파트너 · DEMO DATA',tags:['1박','장기 할인']},
  {id:'move-4',kind:'move',name:'CleanStart · 샘플',lat:37.3050,lng:126.7900,area:'안산',category:'입주청소',basePrice:120000,source:'제휴 예정 · DEMO DATA',tags:['원룸','오피스텔']},
];

export const vehicles = [
  {id:'vehicle-1',kind:'vehicle',name:'아반떼 AD 1.6 · 샘플',price:9800000,monthlyFinance:215000,insurance:108000,fuel:135000,maintenance:42000,year:2019,mileage:78000,source:'중고차 파트너 · DEMO DATA',tags:['출퇴근 추천']},
  {id:'vehicle-2',kind:'vehicle',name:'K3 1.6 · 샘플',price:11200000,monthlyFinance:242000,insurance:111000,fuel:132000,maintenance:40000,year:2020,mileage:65000,source:'중고차 파트너 · DEMO DATA',tags:['유지비 균형']},
  {id:'vehicle-3',kind:'vehicle',name:'레이 1.0 · 샘플',price:8600000,monthlyFinance:190000,insurance:101000,fuel:126000,maintenance:38000,year:2020,mileage:69000,source:'중고차 파트너 · DEMO DATA',tags:['도심·짐']},
];

export const reviews = [
  {id:'r-job1-1',entityId:'job-1',rating:4.6,promiseMatch:4.5,evidenceLevel:3,author:'E-7 · 18개월 재직',summary:'공고 급여와 실제 입금액 차이가 작았고 급여일이 일정했습니다.',metrics:{'급여일':'일치','공고-실제 급여':'거의 일치','잔업':'선택 가능','기숙사비':'공고와 일치'}},
  {id:'r-job1-2',entityId:'job-1',rating:4.1,promiseMatch:4.0,evidenceLevel:2,author:'E-9 · 7개월 재직',summary:'통근버스는 편했지만 성수기 잔업이 많았습니다.',metrics:{'급여일':'일치','업무내용':'일치','잔업':'성수기 많음'}},
  {id:'r-job2-1',entityId:'job-2',rating:3.4,promiseMatch:3.0,evidenceLevel:2,author:'E-7 · 9개월 재직',summary:'야간수당은 지급됐지만 공고보다 교대변경이 잦았습니다.',metrics:{'급여일':'일치','공고-실제 근무':'차이 있음','기숙사':'미제공'}},
  {id:'r-job3-1',entityId:'job-3',rating:4.0,promiseMatch:4.2,evidenceLevel:1,author:'E-9 · 자가입력',summary:'기숙사가 가깝고 월 공제액이 예상 범위였습니다.',metrics:{'기숙사':'가까움','공제액':'예상 범위'}},
  {id:'r-home1-1',entityId:'home-1',rating:4.5,promiseMatch:4.7,evidenceLevel:3,author:'실거주 11개월',summary:'표시 월세와 실제 계약금액이 같았고 보증금 반환도 정상적이었습니다.',metrics:{'월세':'일치','관리비':'거의 일치','사진-실물':'일치','보증금':'정상 반환'}},
  {id:'r-home1-2',entityId:'home-1',rating:4.0,promiseMatch:4.1,evidenceLevel:2,author:'실거주 4개월',summary:'주차는 편하지만 겨울 공과금이 예상보다 높았습니다.',metrics:{'관리비':'일치','공과금':'겨울 높음','하자처리':'3일'}},
  {id:'r-home2-1',entityId:'home-2',rating:3.8,promiseMatch:3.6,evidenceLevel:2,author:'실거주 8개월',summary:'위치는 좋지만 관리비 항목을 계약 전 확인하는 것이 좋습니다.',metrics:{'월세':'일치','관리비':'추가항목 있음','사진-실물':'일치'}},
  {id:'r-home3-1',entityId:'home-3',rating:3.6,promiseMatch:3.4,evidenceLevel:1,author:'실거주 · 자가입력',summary:'저렴하지만 공용공간 사용 규칙을 미리 확인해야 합니다.',metrics:{'월세':'일치','공용공간':'확인 필요'}},
  {id:'r-home4-1',entityId:'home-4',rating:4.7,promiseMatch:4.6,evidenceLevel:3,author:'가족 거주 · 14개월',summary:'계약 조건과 실제 비용이 안정적이었고 주차가 편했습니다.',metrics:{'월세':'일치','관리비':'일치','하자처리':'2일','보증금':'정상'}},
];

export const sourceAdapters = [
  {name:'JobSourceAdapter',status:'demo',detail:'기업 피드 · 채용공고 URL · 공공 API'},
  {name:'PropertyContextProvider',status:'demo',detail:'부동산 파트너 · 실거래 · 공간의가치'},
  {name:'ReviewProvider',status:'demo',detail:'구조화 리뷰 · 검증 문서 · Outcome'},
  {name:'MoveProvider',status:'demo',detail:'이사 · 창고 · 임시숙소'},
  {name:'MobilityProvider',status:'demo',detail:'중고차 재고 · 통근 분석 · 보험'},
  {name:'FinanceEligibilityProvider',status:'demo',detail:'보증 · 신용 · 오토 · 담보 사전점검'},
];
