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

// Job Presets
const presets = {
    '사회초년생': {
        job: '신입사원',
        income: { salary: 280, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 50, living: 80, loan: 30, tax: 40 },
        assets: { cash: 500, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 0, student: 2000, other: 0 }
    },
    '직장인5년차': {
        job: '대리',
        income: { salary: 400, rental: 0, dividend: 5, other: 0 },
        expenses: { housing: 80, living: 100, loan: 50, tax: 60 },
        assets: { cash: 3000, realEstate: 0, stocks: 1000, crypto: 200 },
        liabilities: { mortgage: 0, credit: 500, student: 1000, other: 0 }
    },
    '투자자': {
        job: '전업투자자',
        income: { salary: 0, rental: 200, dividend: 150, other: 100 },
        expenses: { housing: 100, living: 150, loan: 100, tax: 80 },
        assets: { cash: 10000, realEstate: 50000, stocks: 30000, crypto: 5000 },
        liabilities: { mortgage: 30000, credit: 0, student: 0, other: 0 }
    },
    '고액자산가': {
        job: '사업가',
        income: { salary: 0, rental: 500, dividend: 300, other: 400 },
        expenses: { housing: 200, living: 300, loan: 200, tax: 200 },
        assets: { cash: 50000, realEstate: 200000, stocks: 100000, crypto: 20000 },
        liabilities: { mortgage: 80000, credit: 0, student: 0, other: 5000 }
    },
    '의사': {
        job: '전문의',
        income: { salary: 1200, rental: 0, dividend: 20, other: 0 },
        expenses: { housing: 150, living: 200, loan: 300, tax: 250 },
        assets: { cash: 5000, realEstate: 0, stocks: 3000, crypto: 0 },
        liabilities: { mortgage: 0, credit: 2000, student: 10000, other: 0 }
    },
    '변호사': {
        job: '변호사',
        income: { salary: 900, rental: 0, dividend: 30, other: 100 },
        expenses: { housing: 120, living: 180, loan: 150, tax: 200 },
        assets: { cash: 8000, realEstate: 0, stocks: 5000, crypto: 500 },
        liabilities: { mortgage: 0, credit: 1000, student: 5000, other: 0 }
    },
    '공무원': {
        job: '7급공무원',
        income: { salary: 320, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 60, living: 90, loan: 40, tax: 30 },
        assets: { cash: 2000, realEstate: 0, stocks: 500, crypto: 0 },
        liabilities: { mortgage: 0, credit: 0, student: 500, other: 0 }
    },
    '자영업자': {
        job: '식당운영',
        income: { salary: 0, rental: 0, dividend: 0, other: 500 },
        expenses: { housing: 80, living: 120, loan: 100, tax: 80 },
        assets: { cash: 3000, realEstate: 10000, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 3000, student: 0, other: 5000 }
    }
};

// Rat Race Spaces
const ratRaceSpaces = [
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '🏠부동산', color: '#3b82f6' },
    { type: 'market', name: '📈시장상승', color: '#22c55e' },
    { type: 'doodad', name: '🛒충동지출', color: '#ef4444' },
    { type: 'opportunity', name: '📊주식', color: '#8b5cf6' },
    { type: 'charity', name: '❤️기부', color: '#ec4899' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '💎가상자산', color: '#f59e0b' },
    { type: 'market', name: '📉시장하락', color: '#dc2626' },
    { type: 'baby', name: '👶아기탄생', color: '#f472b6' },
    { type: 'opportunity', name: '🏢상가투자', color: '#06b6d4' },
    { type: 'doodad', name: '🛒충동지출', color: '#ef4444' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '🏠경매물건', color: '#0891b2' },
    { type: 'layoff', name: '😢해고', color: '#991b1b' },
    { type: 'opportunity', name: '📊ETF', color: '#7c3aed' },
    { type: 'market', name: '📈시장상승', color: '#22c55e' },
    { type: 'doodad', name: '🛒충동지출', color: '#ef4444' },
    { type: 'payday', name: '💰월급날', color: '#10b981' },
    { type: 'opportunity', name: '🏠원룸', color: '#2563eb' },
    { type: 'charity', name: '❤️기부', color: '#ec4899' },
    { type: 'opportunity', name: '💰스테이킹', color: '#d97706' },
    { type: 'baby', name: '👶아기탄생', color: '#f472b6' },
    { type: 'market', name: '📉시장하락', color: '#dc2626' }
];

// Fast Track Spaces (Dreams)
const fastTrackSpaces = [
    { type: 'dream', name: '🏝️섬구매', cost: 500000, color: '#fbbf24' },
    { type: 'dream', name: '🚀우주여행', cost: 300000, color: '#a855f7' },
    { type: 'dream', name: '🏰성구매', cost: 1000000, color: '#f97316' },
    { type: 'dream', name: '🎨예술컬렉션', cost: 200000, color: '#14b8a6' },
    { type: 'dream', name: '🏎️슈퍼카', cost: 150000, color: '#ef4444' },
    { type: 'dream', name: '🌍세계여행', cost: 100000, color: '#3b82f6' },
    { type: 'dream', name: '🏥자선재단', cost: 500000, color: '#ec4899' },
    { type: 'dream', name: '🎯꿈달성!', cost: 0, color: '#10b981' }
];

// Dreams list for selection
const dreams = [
    { id: 'island', name: '🏝️ 개인 섬', cost: 500000, desc: '나만의 열대 섬 구매' },
    { id: 'space', name: '🚀 우주여행', cost: 300000, desc: '우주 관광 체험' },
    { id: 'castle', name: '🏰 성 구매', cost: 1000000, desc: '유럽 고성 매입' },
    { id: 'art', name: '🎨 예술 컬렉션', cost: 200000, desc: '명화 컬렉션 수집' },
    { id: 'supercar', name: '🏎️ 슈퍼카', cost: 150000, desc: '드림카 구매' },
    { id: 'worldtrip', name: '🌍 세계여행', cost: 100000, desc: '1년간 세계 일주' },
    { id: 'charity', name: '🏥 자선재단', cost: 500000, desc: '나만의 재단 설립' },
    { id: 'freedom', name: '🎯 경제적 자유', cost: 0, desc: '패시브 소득 달성' }
];

// Real Estate Opportunities (기회 칸에서만 등장)
const realEstateOpportunities = [
    { name: '급매 원룸건물', cost: 12000, downPayment: 2400, monthlyIncome: 45, desc: '급하게 매물로 나온 원룸건물' },
    { name: '경매 상가', cost: 25000, downPayment: 5000, monthlyIncome: 90, desc: '법원 경매로 나온 상가' },
    { name: '갭투자 아파트', cost: 40000, downPayment: 5000, monthlyIncome: 30, desc: '전세 끼고 매입하는 아파트' },
    { name: '리모델링 오피스텔', cost: 8000, downPayment: 1600, monthlyIncome: 35, desc: '리모델링이 필요한 오피스텔' },
    { name: '신축 빌라', cost: 15000, downPayment: 3000, monthlyIncome: 50, desc: '분양받은 신축 빌라' },
    { name: '상업용 건물', cost: 50000, downPayment: 10000, monthlyIncome: 150, desc: '유동인구 많은 지역의 상업용 건물' },
    { name: '오래된 다가구', cost: 20000, downPayment: 4000, monthlyIncome: 70, desc: '재건축 기대되는 다가구 주택' },
    { name: '지방 아파트', cost: 10000, downPayment: 2000, monthlyIncome: 25, desc: '지방 소도시의 저렴한 아파트' }
];

// Staking Rates
const stakingRates = {
    '이더리움': 0.03,  // 연 3%
    '솔라나': 0.08     // 연 8%
};

// Utility function
function fmt(n) {
    if (typeof n !== 'number') return '0';
    return n.toLocaleString('ko-KR');
}
