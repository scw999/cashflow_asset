// ==========================================
// 게임 설정값 및 상수
// ==========================================

// Player colors and emojis
const playerColors = ['#fbbf24', '#3b82f6', '#ef4444', '#10b981'];
const playerEmojis = ['🐭', '🐱', '🐶', '🐰'];
const playerColorClasses = ['bg-yellow-600', 'bg-blue-600', 'bg-red-600', 'bg-green-600'];

// Stock/Asset base prices (만원) - 2026년 1월 기준
const basePrices = {
    // 한국 주식 (만원/주)
    '삼성전자': 5.5,
    'SK하이닉스': 19,
    '네이버': 21,
    '카카오': 4.5,

    // 미국 주식 (만원/주, 환율 1,400원 기준)
    '애플': 35,
    '테슬라': 55,
    '마이크로소프트': 60,
    '엔비디아': 195,

    // ETF (만원/주)
    'S&P500 ETF': 7,
    '나스닥100 ETF': 8,
    '고배당 ETF': 4.5,
    '리츠 ETF': 3.5,
    '채권 ETF': 11,

    // 레버리지/인버스 ETF
    'S&P500 2X ETF': 5,
    '나스닥 3X ETF': 4,
    'S&P500 인버스': 3.5,
    '나스닥 인버스 2X': 2.5,

    // 원자재 ETF (만원/주)
    '금 ETF': 12,
    '은 ETF': 4.5,
    '원유 ETF': 6,
    '농산물 ETF': 4,

    // 가상자산 (만원)
    '비트코인': 14000,
    '이더리움': 550,
    '솔라나': 35
};

// 부동산 기본 가격 (만원)
const realEstatePrices = {
    '서울 아파트': 80000,
    '수도권 아파트': 45000,
    '지방 아파트': 15000,
    '오피스텔': 25000,
    '상가': 35000,
    '원룸 건물': 40000,
    '빌라': 20000,
    '다가구 주택': 30000
};

// 부동산 특성
const realEstateCharacteristics = {
    '서울 아파트': { type: 'realestate', volatility: 0.03, rentalYield: 0.025, beta: 1.0, location: 'seoul' },
    '수도권 아파트': { type: 'realestate', volatility: 0.04, rentalYield: 0.03, beta: 0.9, location: 'metro' },
    '지방 아파트': { type: 'realestate', volatility: 0.05, rentalYield: 0.05, beta: 0.7, location: 'local' },
    '오피스텔': { type: 'realestate', volatility: 0.04, rentalYield: 0.045, beta: 0.8, location: 'any' },
    '상가': { type: 'realestate', volatility: 0.06, rentalYield: 0.06, beta: 1.1, location: 'any' },
    '원룸 건물': { type: 'realestate', volatility: 0.04, rentalYield: 0.055, beta: 0.85, location: 'any' },
    '빌라': { type: 'realestate', volatility: 0.05, rentalYield: 0.04, beta: 0.75, location: 'any' },
    '다가구 주택': { type: 'realestate', volatility: 0.045, rentalYield: 0.05, beta: 0.8, location: 'any' }
};

// 자산별 변동성 및 특성
const assetCharacteristics = {
    // 주식
    '삼성전자': { type: 'stock', volatility: 0.08, dividend: 0.02, beta: 1.0 },
    'SK하이닉스': { type: 'stock', volatility: 0.12, dividend: 0.01, beta: 1.3 },
    '네이버': { type: 'stock', volatility: 0.10, dividend: 0.00, beta: 1.1 },
    '카카오': { type: 'stock', volatility: 0.12, dividend: 0.00, beta: 1.2 },
    '애플': { type: 'stock', volatility: 0.06, dividend: 0.005, beta: 0.9 },
    '테슬라': { type: 'stock', volatility: 0.15, dividend: 0.00, beta: 1.8 },
    '마이크로소프트': { type: 'stock', volatility: 0.07, dividend: 0.008, beta: 0.95 },
    '엔비디아': { type: 'stock', volatility: 0.18, dividend: 0.001, beta: 1.6 },

    // ETF
    'S&P500 ETF': { type: 'etf', volatility: 0.05, dividend: 0.015, beta: 1.0 },
    '나스닥100 ETF': { type: 'etf', volatility: 0.07, dividend: 0.005, beta: 1.2 },
    '고배당 ETF': { type: 'etf', volatility: 0.04, dividend: 0.04, beta: 0.7 },
    '리츠 ETF': { type: 'etf', volatility: 0.06, dividend: 0.05, beta: 0.8 },
    '채권 ETF': { type: 'bond', volatility: 0.02, dividend: 0.03, beta: -0.2 },

    // 레버리지/인버스 ETF (고위험)
    'S&P500 2X ETF': { type: 'leveraged', volatility: 0.10, dividend: 0.00, beta: 2.0, leverage: 2 },
    '나스닥 3X ETF': { type: 'leveraged', volatility: 0.21, dividend: 0.00, beta: 3.6, leverage: 3 },
    'S&P500 인버스': { type: 'inverse', volatility: 0.05, dividend: 0.00, beta: -1.0, leverage: -1 },
    '나스닥 인버스 2X': { type: 'inverse', volatility: 0.14, dividend: 0.00, beta: -2.4, leverage: -2 },

    // 원자재
    '금 ETF': { type: 'commodity', volatility: 0.04, dividend: 0.00, beta: 0.0, safeHaven: true },
    '은 ETF': { type: 'commodity', volatility: 0.08, dividend: 0.00, beta: 0.3 },
    '원유 ETF': { type: 'commodity', volatility: 0.12, dividend: 0.00, beta: 0.5 },
    '농산물 ETF': { type: 'commodity', volatility: 0.06, dividend: 0.00, beta: 0.2 },

    // 가상자산
    '비트코인': { type: 'crypto', volatility: 0.15, dividend: 0.00, beta: 2.0 },
    '이더리움': { type: 'crypto', volatility: 0.18, dividend: 0.00, beta: 2.2 },
    '솔라나': { type: 'crypto', volatility: 0.25, dividend: 0.00, beta: 2.5 }
};

// Job Presets - 모든 직업의 난이도를 비슷하게 조정
// 핵심: 소득이 높으면 지출도 높고 빚도 많음, 모든 직업이 현금만 보유
// childcareCost: 아이 1명당 양육비 (직업별 차등)
const presets = {
    '사회초년생': {
        job: '신입사원',
        income: { salary: 280, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 50, living: 80, loan: 20, tax: 40 },
        assets: { cash: 500, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 0, student: 2000, other: 0 },
        childcareCost: 25,
        description: '갓 취업한 신입사원. 학자금 대출이 있지만 지출은 적음.'
    },
    '직장인5년차': {
        job: '대리',
        income: { salary: 400, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 80, living: 120, loan: 40, tax: 60 },
        assets: { cash: 2000, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 1500, student: 500, other: 0 },
        childcareCost: 35,
        description: '경력 5년차 직장인. 소득은 늘었지만 지출도 함께 증가.'
    },
    '공무원': {
        job: '7급공무원',
        income: { salary: 320, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 60, living: 90, loan: 30, tax: 30 },
        assets: { cash: 1500, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 500, student: 1000, other: 0 },
        childcareCost: 30,
        description: '안정적인 공무원. 소득과 지출 모두 보통 수준.'
    },
    '자영업자': {
        job: '카페사장',
        income: { salary: 450, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 80, living: 100, loan: 80, tax: 70 },
        assets: { cash: 1000, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 2000, student: 0, other: 3000 },
        childcareCost: 40,
        description: '카페 운영 자영업자. 소득 변동이 크고 사업자금 대출 있음.'
    },
    '의사': {
        job: '전문의',
        income: { salary: 1200, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 200, living: 300, loan: 250, tax: 300 },
        assets: { cash: 3000, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 5000, credit: 3000, student: 8000, other: 0 },
        childcareCost: 100,
        description: '고소득 전문의. 하지만 학자금과 개업 비용으로 부채가 많음.'
    },
    '변호사': {
        job: '변호사',
        income: { salary: 900, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 150, living: 250, loan: 200, tax: 200 },
        assets: { cash: 2500, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 3000, credit: 2000, student: 5000, other: 0 },
        childcareCost: 80,
        description: '고소득 변호사. 학자금 대출과 사무실 비용으로 부채 있음.'
    },
    '간호사': {
        job: '간호사',
        income: { salary: 400, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 60, living: 100, loan: 30, tax: 50 },
        assets: { cash: 1200, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 500, student: 1500, other: 0 },
        childcareCost: 35,
        description: '야근 수당 포함 간호사. 안정적이지만 시간이 부족함.'
    },
    '프리랜서': {
        job: 'IT프리랜서',
        income: { salary: 500, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 70, living: 110, loan: 50, tax: 80 },
        assets: { cash: 1500, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 1000, student: 1000, other: 500 },
        childcareCost: 45,
        description: '자유로운 IT 프리랜서. 소득이 불안정하지만 유동성이 높음.'
    }
};

// Rat Race Spaces (부동산 칸 통합)
const ratRaceSpaces = [
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'market', name: '📈시장상승', color: '#22c55e' },
    { type: 'doodad', name: '🛒충동지출', color: '#ef4444' },
    { type: 'opportunity', name: '📊주식', color: '#8b5cf6' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '💎가상자산', color: '#f59e0b' },
    { type: 'market', name: '📉시장하락', color: '#dc2626' },
    { type: 'baby', name: '👶아기탄생', color: '#f472b6' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'charity', name: '❤️기부', color: '#ec4899' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'doodad', name: '🛒충동지출', color: '#ef4444' },
    { type: 'opportunity', name: '📊ETF', color: '#7c3aed' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'market', name: '📈시장상승', color: '#22c55e' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'layoff', name: '😢해고', color: '#991b1b' },
    { type: 'opportunity', name: '💰스테이킹', color: '#d97706' },
    { type: 'doodad', name: '🛒충동지출', color: '#ef4444' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'market', name: '📉시장하락', color: '#dc2626' },
    { type: 'baby', name: '👶아기탄생', color: '#f472b6' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' }
];

// Fast Track Spaces (사업 투자 + 꿈 + 월급날)
const fastTrackSpaces = [
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'business', name: '🏢프랜차이즈', cost: 50000, monthlyIncome: 500, color: '#10b981' },
    { type: 'business', name: '🏭제조공장', cost: 100000, monthlyIncome: 1000, color: '#3b82f6' },
    { type: 'dream', name: '🏝️섬구매', cost: 500000, color: '#fbbf24' },
    { type: 'business', name: '🏬쇼핑몰', cost: 150000, monthlyIncome: 1500, color: '#8b5cf6' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'business', name: '🚢해운사업', cost: 180000, monthlyIncome: 1800, color: '#0ea5e9' },
    { type: 'dream', name: '🚀우주여행', cost: 300000, color: '#a855f7' },
    { type: 'business', name: '💻IT스타트업', cost: 80000, monthlyIncome: 800, color: '#06b6d4' },
    { type: 'business', name: '🎮게임회사', cost: 90000, monthlyIncome: 900, color: '#f43f5e' },
    { type: 'dream', name: '🏰성구매', cost: 1000000, color: '#f97316' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'business', name: '🏨호텔체인', cost: 200000, monthlyIncome: 2000, color: '#ec4899' },
    { type: 'business', name: '🏥병원사업', cost: 250000, monthlyIncome: 2500, color: '#14b8a6' },
    { type: 'dream', name: '🎨예술컬렉션', cost: 200000, color: '#14b8a6' },
    { type: 'business', name: '⚡에너지사업', cost: 120000, monthlyIncome: 1200, color: '#eab308' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'business', name: '📱통신사업', cost: 300000, monthlyIncome: 3000, color: '#6366f1' },
    { type: 'dream', name: '🏎️슈퍼카', cost: 150000, color: '#ef4444' },
    { type: 'business', name: '🎬엔터테인먼트', cost: 150000, monthlyIncome: 1500, color: '#d946ef' },
    { type: 'dream', name: '🌍세계여행', cost: 100000, color: '#3b82f6' }
];

// 패스트트랙 승리 조건: 월 패시브 소득 5000만원
const FAST_TRACK_WIN_PASSIVE = 5000;

// Dreams list for selection (경제적 자유 제거 - 이미 탈출 조건)
const dreams = [
    { id: 'island', name: '🏝️ 개인 섬', cost: 500000, desc: '나만의 열대 섬 구매' },
    { id: 'space', name: '🚀 우주여행', cost: 300000, desc: '우주 관광 체험' },
    { id: 'castle', name: '🏰 성 구매', cost: 1000000, desc: '유럽 고성 매입' },
    { id: 'art', name: '🎨 예술 컬렉션', cost: 200000, desc: '명화 컬렉션 수집' },
    { id: 'supercar', name: '🏎️ 슈퍼카', cost: 150000, desc: '드림카 구매' },
    { id: 'worldtrip', name: '🌍 세계여행', cost: 100000, desc: '1년간 세계 일주' },
    { id: 'charity', name: '🏥 자선재단', cost: 500000, desc: '나만의 재단 설립' }
];

// Real Estate Opportunities (기회 칸에서만 등장)
const realEstateOpportunities = [
    { name: '원룸건물', cost: 12000, downPayment: 2400, monthlyIncome: 45, desc: '수익형 원룸건물' },
    { name: '상가', cost: 25000, downPayment: 5000, monthlyIncome: 90, desc: '임대 수익 상가' },
    { name: '갭투자 아파트', cost: 40000, downPayment: 5000, monthlyIncome: 30, desc: '전세 끼고 매입하는 아파트' },
    { name: '오피스텔', cost: 8000, downPayment: 1600, monthlyIncome: 35, desc: '역세권 오피스텔' },
    { name: '신축 빌라', cost: 15000, downPayment: 3000, monthlyIncome: 50, desc: '분양받은 신축 빌라' },
    { name: '상업용 건물', cost: 50000, downPayment: 10000, monthlyIncome: 150, desc: '유동인구 많은 지역의 상업용 건물' },
    { name: '다가구 주택', cost: 20000, downPayment: 4000, monthlyIncome: 70, desc: '재건축 기대되는 다가구 주택' },
    { name: '지방 아파트', cost: 10000, downPayment: 2000, monthlyIncome: 25, desc: '지방 소도시의 저렴한 아파트' }
];

// Staking Rates
const stakingRates = {
    '이더리움': 0.03,  // 연 3%
    '솔라나': 0.08     // 연 8%
};

// 금리 설정 (연이율)
let interestRate = 4.0;  // 기준금리 4%
const MORTGAGE_RATE_SPREAD = 1.0;  // 주택담보대출 스프레드
const CREDIT_RATE_SPREAD = 4.0;   // 신용대출 스프레드

// 금리 계산 함수
function getMortgageRate() {
    return interestRate + MORTGAGE_RATE_SPREAD;
}

function getCreditRate() {
    return interestRate + CREDIT_RATE_SPREAD;
}

// ==========================================
// 코스톨라니 달걀 모형 - 경기 사이클 시스템
// ==========================================

// 경기 사이클 단계: 회복기 → 호황기 → 후퇴기 → 불황기
const CYCLE_PHASES = {
    RECOVERY: 'recovery',    // 회복기: 금리 하락, 주식 상승 시작
    BOOM: 'boom',            // 호황기: 금리 상승, 주식/부동산 고점
    RECESSION: 'recession',  // 후퇴기: 금리 고점, 주식 하락
    DEPRESSION: 'depression' // 불황기: 금리 하락, 채권 상승
};

// 현재 경기 사이클 상태
let economicCycle = {
    phase: CYCLE_PHASES.RECOVERY,
    turnsInPhase: 0,
    phaseDuration: 8 + Math.floor(Math.random() * 8)  // 8~15턴
};

// 사이클별 자산 수익률 특성 (월 기대 수익률 %)
const CYCLE_ASSET_RETURNS = {
    [CYCLE_PHASES.RECOVERY]: {
        stocks: { base: 1.5, volatility: 2 },      // 주식 상승 시작
        bonds: { base: -0.3, volatility: 0.5 },    // 채권 약세
        realEstate: { base: 0.3, volatility: 1 },  // 부동산 보합
        crypto: { base: 2, volatility: 5 },        // 가상자산 고변동
        gold: { base: 0.2, volatility: 1 },        // 금 보합
        interestTrend: -0.1                        // 금리 하락 추세
    },
    [CYCLE_PHASES.BOOM]: {
        stocks: { base: 0.5, volatility: 3 },      // 주식 고점 변동성 증가
        bonds: { base: -0.5, volatility: 0.5 },    // 채권 약세
        realEstate: { base: 1.2, volatility: 1.5 },// 부동산 강세
        crypto: { base: 1, volatility: 6 },        // 가상자산 고변동
        gold: { base: 0.5, volatility: 1.5 },      // 금 상승
        interestTrend: 0.15                        // 금리 상승 추세
    },
    [CYCLE_PHASES.RECESSION]: {
        stocks: { base: -1.2, volatility: 4 },     // 주식 하락
        bonds: { base: 0.5, volatility: 0.5 },     // 채권 강세
        realEstate: { base: -0.5, volatility: 1.5 },// 부동산 약세
        crypto: { base: -1.5, volatility: 7 },     // 가상자산 급락
        gold: { base: 0.8, volatility: 2 },        // 금 안전자산 상승
        interestTrend: 0.05                        // 금리 고점 유지
    },
    [CYCLE_PHASES.DEPRESSION]: {
        stocks: { base: -0.3, volatility: 3 },     // 주식 바닥 다지기
        bonds: { base: 0.8, volatility: 0.3 },     // 채권 강세
        realEstate: { base: -0.8, volatility: 1 }, // 부동산 하락
        crypto: { base: 0.5, volatility: 5 },      // 가상자산 회복 시작
        gold: { base: 0.3, volatility: 1 },        // 금 보합
        interestTrend: -0.2                        // 금리 하락
    }
};

// 사이클 단계 이름
const CYCLE_PHASE_NAMES = {
    [CYCLE_PHASES.RECOVERY]: '🌱 회복기',
    [CYCLE_PHASES.BOOM]: '🔥 호황기',
    [CYCLE_PHASES.RECESSION]: '📉 후퇴기',
    [CYCLE_PHASES.DEPRESSION]: '❄️ 불황기'
};

// 다음 사이클 단계
function getNextPhase(currentPhase) {
    const phases = [CYCLE_PHASES.RECOVERY, CYCLE_PHASES.BOOM, CYCLE_PHASES.RECESSION, CYCLE_PHASES.DEPRESSION];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[(currentIndex + 1) % phases.length];
}

// 사이클 업데이트 (턴마다 호출)
function updateEconomicCycle() {
    economicCycle.turnsInPhase++;

    // 사이클 전환 체크
    if (economicCycle.turnsInPhase >= economicCycle.phaseDuration) {
        const oldPhase = economicCycle.phase;
        economicCycle.phase = getNextPhase(economicCycle.phase);
        economicCycle.turnsInPhase = 0;
        economicCycle.phaseDuration = 8 + Math.floor(Math.random() * 8);

        // 사이클 전환 알림
        showNotification(`경기 사이클 변화: ${CYCLE_PHASE_NAMES[oldPhase]} → ${CYCLE_PHASE_NAMES[economicCycle.phase]}`, 'info');
    }

    // 금리 조정
    const cycleReturns = CYCLE_ASSET_RETURNS[economicCycle.phase];
    const rateChange = cycleReturns.interestTrend + (Math.random() - 0.5) * 0.1;
    interestRate = Math.max(0.5, Math.min(10, interestRate + rateChange));
}

// 자산 유형별 수익률 계산
function getAssetReturn(assetType) {
    const cycleReturns = CYCLE_ASSET_RETURNS[economicCycle.phase];
    let assetConfig;

    // 자산 유형 매핑
    if (assetType.includes('ETF') || assetType.includes('삼성') || assetType.includes('애플') ||
        assetType.includes('테슬라') || assetType.includes('엔비디아') || assetType.includes('SK') ||
        assetType.includes('네이버')) {
        assetConfig = cycleReturns.stocks;
    } else if (assetType.includes('채권')) {
        assetConfig = cycleReturns.bonds;
    } else if (assetType.includes('비트코인') || assetType.includes('이더리움') || assetType.includes('솔라나')) {
        assetConfig = cycleReturns.crypto;
    } else if (assetType.includes('금') || assetType.includes('금 ETF')) {
        assetConfig = cycleReturns.gold;
    } else {
        assetConfig = cycleReturns.stocks;  // 기본값
    }

    // 수익률 계산 (base + 랜덤 변동)
    const randomFactor = (Math.random() - 0.5) * 2 * assetConfig.volatility;
    return (assetConfig.base + randomFactor) / 100;
}

// 주사위 쿨다운 상태
let diceRolling = false;

// Utility function
function fmt(n) {
    if (typeof n !== 'number') return '0';
    return n.toLocaleString('ko-KR');
}

// 랜덤 직업 선택 함수
function getRandomPreset() {
    const presetNames = Object.keys(presets);
    const randomIndex = Math.floor(Math.random() * presetNames.length);
    return presetNames[randomIndex];
}
