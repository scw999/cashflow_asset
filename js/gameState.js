// ==========================================
// 게임 상태 관리
// ==========================================

// Market prices (현재 가격)
let marketPrices = { ...basePrices };

// Real estate market prices (현재 부동산 가격)
let realEstateMarketPrices = { ...realEstatePrices };

// Price history for charts
let priceHistory = {};
let realEstatePriceHistory = {};

// Initialize price history with fake historical data
function initPriceHistory() {
    priceHistory = {};
    Object.keys(basePrices).forEach(name => {
        let history = [];
        let price = basePrices[name];
        // Generate 10 turns of fake historical data
        for (let i = 0; i < 10; i++) {
            const char = assetCharacteristics[name] || { volatility: 0.1 };
            const change = (Math.random() - 0.5) * char.volatility * 2;
            price = Math.max(0.1, price * (1 + change));
            history.push(Math.round(price * 100) / 100);
        }
        history.push(basePrices[name]);
        priceHistory[name] = history;
    });

    // Initialize real estate price history
    realEstatePriceHistory = {};
    Object.keys(realEstatePrices).forEach(name => {
        let history = [];
        let price = realEstatePrices[name];
        for (let i = 0; i < 10; i++) {
            const char = realEstateCharacteristics[name] || { volatility: 0.03 };
            // 부동산은 대체로 상승 추세 (약간의 상승 바이어스)
            const change = (Math.random() - 0.4) * char.volatility * 2;
            price = Math.max(1000, price * (1 + change));
            history.push(Math.round(price));
        }
        history.push(realEstatePrices[name]);
        realEstatePriceHistory[name] = history;
    });
}

// Initialize price history on load
initPriceHistory();

// Game State
let numPlayers = 1;
let currentPlayer = 0;
let setupPlayer = 0;
let suppressCashAnimation = false;  // 플레이어 전환 시 애니메이션 억제
let players = [];
let currentEvent = null;
let turn = 1;

// Create a new player
function createPlayer() {
    return {
        position: 0,
        inFastTrack: false,
        job: null,
        jobPreset: null,
        dream: null,
        dreamAchieved: false,
        income: { salary: 0, rental: 0, dividend: 0, other: 0 },
        expenses: { housing: 0, living: 0, loan: 0, tax: 0 },
        assets: { cash: 0, realEstate: 0, stocks: 0, crypto: 0 },
        liabilities: { mortgage: 0, credit: 0, student: 0, other: 0 },
        investments: [],
        children: 0,
        childcareCost: 30,  // 직업별 양육비 (기본값 30만원)
        skipTurns: 0,
        doubleDice: 0,
        urgentSaleCount: 0,  // 급매 카운트 (2회 필요)
        auctionCount: 0      // 경매 카운트 (3회 필요)
    };
}

// Initialize default player
players = [createPlayer()];

// Get current player
function getPlayer() {
    return players[currentPlayer];
}

// Legacy gameState reference for compatibility
const gameState = {
    get position() { return getPlayer().position; },
    set position(v) { getPlayer().position = v; },
    get inFastTrack() { return getPlayer().inFastTrack; },
    set inFastTrack(v) { getPlayer().inFastTrack = v; },
    get income() { return getPlayer().income; },
    set income(v) { Object.assign(getPlayer().income, v); },
    get expenses() { return getPlayer().expenses; },
    set expenses(v) { Object.assign(getPlayer().expenses, v); },
    get assets() { return getPlayer().assets; },
    set assets(v) { Object.assign(getPlayer().assets, v); },
    get liabilities() { return getPlayer().liabilities; },
    set liabilities(v) { Object.assign(getPlayer().liabilities, v); },
    get investments() { return getPlayer().investments; },
    set investments(v) { getPlayer().investments = v; },
    get children() { return getPlayer().children; },
    set children(v) { getPlayer().children = v; },
    get turn() { return turn; },
    set turn(v) { turn = v; }
};

// Calculation functions
function getCashflow() {
    const totalIncome = Object.values(gameState.income).reduce((a, b) => a + b, 0);
    const player = getPlayer();
    const childcareCost = player.childcareCost || 30;  // 직업별 양육비
    const totalExpense = Object.values(gameState.expenses).reduce((a, b) => a + b, 0) + gameState.children * childcareCost;
    return totalIncome - totalExpense;
}

function getPassiveIncome() {
    return gameState.income.rental + gameState.income.dividend + gameState.income.other;
}

function getTotalExpenses() {
    const player = getPlayer();
    const childcareCost = player.childcareCost || 30;  // 직업별 양육비
    return Object.values(gameState.expenses).reduce((a, b) => a + b, 0) + gameState.children * childcareCost;
}

// 양육비 계산 (표시용)
function getChildcareCost() {
    const player = getPlayer();
    return (player.childcareCost || 30) * gameState.children;
}

function getTotalAssets() {
    return Object.values(gameState.assets).reduce((a, b) => a + b, 0);
}

function getTotalLiabilities() {
    const baseLiabilities = Object.values(gameState.liabilities).reduce((a, b) => a + b, 0);
    // 투자부동산 담보대출 추가 (investments에서 계산)
    const investmentLoan = gameState.investments
        .filter(inv => inv.type === 'realEstate' && inv.loan > 0)
        .reduce((sum, inv) => sum + inv.loan, 0);
    return baseLiabilities + investmentLoan;
}

// 투자부동산 담보대출 총액 계산
function getInvestmentLoan() {
    return gameState.investments
        .filter(inv => inv.type === 'realEstate' && inv.loan > 0)
        .reduce((sum, inv) => sum + inv.loan, 0);
}

// 코스톨라니 달걀 모형 기반 경제 사이클 업데이트 (이벤트 기반)
function updateEconomicCycleKostolany() {
    economicCycle.turnsInPhase++;
    const oldRate = interestRate;

    // 이벤트 기반 사이클 전환 확률 계산
    let transitionProbability = 0;

    // 기본 전환 확률 (시간이 지날수록 증가)
    const turnsRatio = economicCycle.turnsInPhase / economicCycle.phaseDuration;
    transitionProbability = turnsRatio * 0.15;  // 최대 15%

    // 금리 기반 이벤트 트리거
    if (economicCycle.phase === CYCLE_PHASES.BOOM && interestRate > 6) {
        // 호황기에 금리가 높으면 후퇴기로 전환 확률 증가
        transitionProbability += 0.15;
    } else if (economicCycle.phase === CYCLE_PHASES.DEPRESSION && interestRate < 2) {
        // 불황기에 금리가 낮으면 회복기로 전환 확률 증가
        transitionProbability += 0.15;
    } else if (economicCycle.phase === CYCLE_PHASES.RECOVERY && interestRate < 3) {
        // 회복기에 저금리가 유지되면 호황기로 전환 확률 증가
        transitionProbability += 0.1;
    } else if (economicCycle.phase === CYCLE_PHASES.RECESSION && interestRate > 5) {
        // 후퇴기에 금리가 높으면 불황기로 전환 확률 증가
        transitionProbability += 0.1;
    }

    // 랜덤 이벤트 (경제 충격)
    const economicShock = Math.random() < 0.05;  // 5% 확률로 경제 충격
    if (economicShock) {
        transitionProbability += 0.3;  // 경제 충격시 전환 확률 대폭 증가
        showNotification('⚠️ 경제 충격 발생!', 'warning');
    }

    // 사이클 전환 체크 (확률 기반)
    if (Math.random() < transitionProbability || economicCycle.turnsInPhase >= economicCycle.phaseDuration * 1.5) {
        const oldPhase = economicCycle.phase;
        const phases = [CYCLE_PHASES.RECOVERY, CYCLE_PHASES.BOOM, CYCLE_PHASES.RECESSION, CYCLE_PHASES.DEPRESSION];
        const currentIndex = phases.indexOf(economicCycle.phase);
        economicCycle.phase = phases[(currentIndex + 1) % phases.length];
        economicCycle.turnsInPhase = 0;
        economicCycle.phaseDuration = 6 + Math.floor(Math.random() * 10);  // 6~15턴 (더 변동적)

        // 사이클 전환 알림
        showNotification(`경기 사이클 변화: ${CYCLE_PHASE_NAMES[oldPhase]} → ${CYCLE_PHASE_NAMES[economicCycle.phase]}`, 'info');

        // Update background color for economic cycle
        if (typeof updateCycleBackground === 'function') {
            updateCycleBackground(economicCycle.phase);
        }

        // 사이클 전환시 금리 점프 이벤트
        if (economicCycle.phase === CYCLE_PHASES.RECESSION) {
            // 후퇴기 진입시 금리 인상
            interestRate = Math.min(10, interestRate + 0.5 + Math.random() * 0.5);
        } else if (economicCycle.phase === CYCLE_PHASES.RECOVERY) {
            // 회복기 진입시 금리 인하
            interestRate = Math.max(0.5, interestRate - 0.5 - Math.random() * 0.5);
        }
    }

    // 금리 조정 (이벤트 + 트렌드 기반)
    const cycleReturns = CYCLE_ASSET_RETURNS[economicCycle.phase];

    // 기본 트렌드
    let rateChange = cycleReturns.interestTrend;

    // 랜덤 이벤트 (중앙은행 정책 결정)
    const centralBankEvent = Math.random();
    if (centralBankEvent < 0.1) {
        // 10% 확률로 금리 동결 또는 큰 변동
        const bigMove = (Math.random() - 0.5) * 0.8;  // -0.4% ~ +0.4%
        rateChange += bigMove;
        if (Math.abs(bigMove) > 0.2) {
            showNotification(`🏦 중앙은행 ${bigMove > 0 ? '금리 인상' : '금리 인하'} 발표!`, 'info');
        }
    } else {
        // 일반적인 변동
        rateChange += (Math.random() - 0.5) * 0.2;
    }

    // 금리 적용
    interestRate = Math.max(0.5, Math.min(10, interestRate + rateChange));

    // 금리 히스토리 기록
    if (typeof interestRateHistory !== 'undefined') {
        interestRateHistory.push(Math.round(interestRate * 100) / 100);
        if (interestRateHistory.length > 30) interestRateHistory.shift();
    }
}

// Update market prices with Kostolany economic cycle and asset characteristics
function updateMarketPrices() {
    const changes = [];

    // Update economic cycle (코스톨라니 모형)
    updateEconomicCycleKostolany();

    const cycleReturns = CYCLE_ASSET_RETURNS[economicCycle.phase];

    // 먼저 기초 자산(S&P500 ETF, 나스닥100 ETF)의 변동률을 계산
    let sp500Change = 0;
    let nasdaqChange = 0;

    // 기초자산 먼저 업데이트
    ['S&P500 ETF', '나스닥100 ETF'].forEach(name => {
        const oldPrice = marketPrices[name];
        const char = assetCharacteristics[name] || { type: 'etf', volatility: 0.05, beta: 1.0 };

        // 코스톨라니 모형: 사이클에 따른 기대 수익률 + 변동성
        const stocksReturn = cycleReturns.stocks;
        let changePercent = (stocksReturn.base + (Math.random() - 0.5) * 2 * stocksReturn.volatility) / 100;
        changePercent *= char.beta;

        marketPrices[name] = Math.max(0.1, marketPrices[name] * (1 + changePercent));
        marketPrices[name] = Math.round(marketPrices[name] * 100) / 100;

        priceHistory[name].push(marketPrices[name]);
        if (priceHistory[name].length > 30) priceHistory[name].shift();

        const actualChange = ((marketPrices[name] - oldPrice) / oldPrice * 100);

        if (name === 'S&P500 ETF') sp500Change = actualChange;
        if (name === '나스닥100 ETF') nasdaqChange = actualChange;

        changes.push({
            name,
            oldPrice,
            newPrice: marketPrices[name],
            changePercent: actualChange.toFixed(1)
        });
    });

    // 레버리지/인버스 ETF는 기초자산에 연동
    const leveragedETFs = {
        'S&P500 2X ETF': { base: sp500Change, leverage: 2 },
        '나스닥 3X ETF': { base: nasdaqChange, leverage: 3 },
        'S&P500 인버스': { base: sp500Change, leverage: -1 },
        '나스닥 인버스 2X': { base: nasdaqChange, leverage: -2 }
    };

    Object.keys(leveragedETFs).forEach(name => {
        const oldPrice = marketPrices[name];
        const { base, leverage } = leveragedETFs[name];

        // 레버리지 적용 (기초자산 변동률 × 레버리지 배수)
        const changePercent = (base * leverage) / 100;

        marketPrices[name] = Math.max(0.1, marketPrices[name] * (1 + changePercent));
        marketPrices[name] = Math.round(marketPrices[name] * 100) / 100;

        priceHistory[name].push(marketPrices[name]);
        if (priceHistory[name].length > 30) priceHistory[name].shift();

        changes.push({
            name,
            oldPrice,
            newPrice: marketPrices[name],
            changePercent: (base * leverage).toFixed(1)
        });
    });

    // 나머지 자산들 업데이트 (기초 ETF 및 레버리지 ETF 제외)
    const skipAssets = ['S&P500 ETF', '나스닥100 ETF', 'S&P500 2X ETF', '나스닥 3X ETF', 'S&P500 인버스', '나스닥 인버스 2X'];

    Object.keys(marketPrices).forEach(name => {
        if (skipAssets.includes(name)) return;

        const oldPrice = marketPrices[name];
        const char = assetCharacteristics[name] || { type: 'stock', volatility: 0.1, beta: 1.0 };

        // 코스톨라니 모형: 자산 유형에 따른 사이클별 수익률 적용
        let assetReturn;
        if (char.type === 'stock' || char.type === 'etf') {
            assetReturn = cycleReturns.stocks;
        } else if (char.type === 'crypto') {
            assetReturn = cycleReturns.crypto;
        } else if (char.type === 'bond') {
            assetReturn = cycleReturns.bonds;
        } else if (char.type === 'commodity') {
            // 금(안전자산)은 특별 처리
            if (char.safeHaven) {
                assetReturn = cycleReturns.gold;
            } else {
                // 다른 원자재는 주식과 유사하게 동작
                assetReturn = { base: cycleReturns.stocks.base * 0.5, volatility: cycleReturns.stocks.volatility * 1.5 };
            }
        } else {
            assetReturn = cycleReturns.stocks;  // 기본값
        }

        // 기대 수익률 + 랜덤 변동 (변동성 범위 내)
        let changePercent = (assetReturn.base + (Math.random() - 0.5) * 2 * assetReturn.volatility) / 100;
        changePercent *= char.beta;

        // 금리 효과 (고금리일수록 성장자산 불리)
        if (char.type === 'crypto' || (char.type === 'stock' && char.beta > 1.2)) {
            changePercent -= (interestRate - 3) * 0.003;
        }

        // Apply change
        marketPrices[name] = Math.max(0.1, marketPrices[name] * (1 + changePercent));
        marketPrices[name] = Math.round(marketPrices[name] * 100) / 100;

        priceHistory[name].push(marketPrices[name]);
        if (priceHistory[name].length > 30) priceHistory[name].shift();

        changes.push({
            name,
            oldPrice,
            newPrice: marketPrices[name],
            changePercent: ((marketPrices[name] - oldPrice) / oldPrice * 100).toFixed(1)
        });
    });

    // 부동산 시세도 매 턴 업데이트 (주식처럼)
    const realEstateChanges = updateRealEstatePricesEveryTurn();
    changes.push(...realEstateChanges);

    // Update all players' investment values based on new prices
    players.forEach(player => {
        let totalStockValue = 0;
        let totalCryptoValue = 0;

        player.investments.forEach(inv => {
            // Update crypto investments
            if (inv.type === 'crypto') {
                if (inv.isStable) {
                    // Stablecoin doesn't change price
                    inv.currentValue = inv.amount;
                } else if (inv.baseName && marketPrices[inv.baseName]) {
                    inv.currentPrice = marketPrices[inv.baseName];
                    inv.currentValue = Math.round(inv.amount * inv.currentPrice * 100) / 100;
                    totalCryptoValue += inv.currentValue;
                } else if (inv.amount && marketPrices[inv.name]) {
                    inv.currentPrice = marketPrices[inv.name];
                    inv.currentValue = Math.round(inv.amount * inv.currentPrice * 100) / 100;
                    totalCryptoValue += inv.currentValue;
                }
            }
            // Update stock/ETF investments
            else if (inv.type === 'stocks' && inv.shares && marketPrices[inv.name]) {
                inv.currentPrice = marketPrices[inv.name];
                inv.currentValue = Math.round(inv.shares * inv.currentPrice * 100) / 100;
                totalStockValue += inv.currentValue;
            }
        });

        // Update asset totals based on current market values
        // Calculate stable coin value separately
        let stableValue = 0;
        player.investments.forEach(inv => {
            if (inv.isStable) stableValue += inv.amount;
        });

        if (totalCryptoValue > 0 || stableValue > 0) {
            player.assets.crypto = Math.round((totalCryptoValue + stableValue) * 100) / 100;
        }
        if (totalStockValue > 0) {
            player.assets.stocks = Math.round(totalStockValue * 100) / 100;
        }
    });

    return changes;
}

// Update real estate prices (called when landing on real estate space - bigger change)
function updateRealEstatePrices() {
    const changes = [];
    const cycleReturns = CYCLE_ASSET_RETURNS[economicCycle.phase];
    const realEstateReturn = cycleReturns.realEstate;

    Object.keys(realEstateMarketPrices).forEach(name => {
        const oldPrice = realEstateMarketPrices[name];
        const char = realEstateCharacteristics[name] || { volatility: 0.03, beta: 1.0 };

        // 코스톨라니 모형: 부동산 사이클별 기대 수익률 적용
        let changePercent = (realEstateReturn.base + (Math.random() - 0.5) * 2 * realEstateReturn.volatility * 2);
        changePercent *= char.beta;

        // 금리 영향 (고금리 = 부동산 하락)
        if (interestRate > 4) {
            changePercent -= (interestRate - 4) * 0.8;
        }

        // 변동폭 제한 (-5% ~ +8%)
        changePercent = Math.max(-5, Math.min(8, changePercent));

        const multiplier = 1 + (changePercent / 100);
        realEstateMarketPrices[name] = Math.round(realEstateMarketPrices[name] * multiplier);

        realEstatePriceHistory[name].push(realEstateMarketPrices[name]);
        if (realEstatePriceHistory[name].length > 30) realEstatePriceHistory[name].shift();

        changes.push({
            name,
            oldPrice,
            newPrice: realEstateMarketPrices[name],
            changePercent: changePercent.toFixed(1)
        });
    });

    return changes;
}

// 매 턴마다 부동산 시세 업데이트 (주식처럼 작은 변동)
function updateRealEstatePricesEveryTurn() {
    const changes = [];
    const cycleReturns = CYCLE_ASSET_RETURNS[economicCycle.phase];
    const realEstateReturn = cycleReturns.realEstate;

    Object.keys(realEstateMarketPrices).forEach(name => {
        const oldPrice = realEstateMarketPrices[name];
        const char = realEstateCharacteristics[name] || { volatility: 0.03, beta: 1.0 };

        // 코스톨라니 모형: 매 턴 작은 변동 (사이클 기반)
        let changePercent = (realEstateReturn.base * 0.3 + (Math.random() - 0.5) * realEstateReturn.volatility * 0.5);
        changePercent *= char.beta;

        // 금리 영향 (매 턴 작게)
        if (interestRate > 4) {
            changePercent -= (interestRate - 4) * 0.2;
        }

        // 변동폭 제한 (-2% ~ +3%)
        changePercent = Math.max(-2, Math.min(3, changePercent));

        const multiplier = 1 + (changePercent / 100);
        realEstateMarketPrices[name] = Math.round(realEstateMarketPrices[name] * multiplier);

        realEstatePriceHistory[name].push(realEstateMarketPrices[name]);
        if (realEstatePriceHistory[name].length > 30) realEstatePriceHistory[name].shift();

        changes.push({
            name,
            oldPrice,
            newPrice: realEstateMarketPrices[name],
            changePercent: changePercent.toFixed(1)
        });
    });

    return changes;
}

// Apply market event (from market space) - 자산별 다른 비율로 변동
function applyMarketEvent(isUp) {
    const baseDirection = isUp ? 1 : -1;

    // Apply to random subset of assets
    const assetNames = Object.keys(marketPrices);
    const affectedCount = Math.floor(assetNames.length * (0.5 + Math.random() * 0.3));
    const shuffled = assetNames.sort(() => Math.random() - 0.5);
    const affected = shuffled.slice(0, affectedCount);

    const changes = [];

    affected.forEach(name => {
        const oldPrice = marketPrices[name];
        const char = assetCharacteristics[name] || { type: 'stock', volatility: 0.1, beta: 1.0 };

        // 자산 특성에 따른 변동폭 계산
        // 기본 5~15% 변동에 자산별 특성 적용
        let changePercent;

        if (char.type === 'crypto') {
            // 가상자산: 10~30% 변동 (고변동성)
            changePercent = baseDirection * (10 + Math.random() * 20) * char.beta / 2;
        } else if (char.type === 'bond') {
            // 채권: 1~5% 변동 (저변동성, 주식과 역방향)
            changePercent = -baseDirection * (1 + Math.random() * 4);
        } else if (char.type === 'commodity') {
            // 원자재: 5~15% 변동
            if (char.safeHaven && !isUp) {
                // 금은 시장 하락시 오히려 상승
                changePercent = (3 + Math.random() * 7);
            } else {
                changePercent = baseDirection * (5 + Math.random() * 10);
            }
        } else {
            // 주식/ETF: 5~20% 변동 (베타값에 따라)
            changePercent = baseDirection * (5 + Math.random() * 15) * char.beta;
        }

        // 변동폭 제한 (-40% ~ +50%)
        changePercent = Math.max(-40, Math.min(50, changePercent));

        const multiplier = 1 + (changePercent / 100);
        marketPrices[name] = Math.round(marketPrices[name] * multiplier * 100) / 100;

        priceHistory[name].push(marketPrices[name]);
        if (priceHistory[name].length > 30) priceHistory[name].shift();

        changes.push({
            name,
            oldPrice,
            newPrice: marketPrices[name],
            changePercent: changePercent.toFixed(1)
        });
    });

    // Update investment values
    players.forEach(player => {
        let totalStockValue = 0;
        let totalCryptoValue = 0;

        player.investments.forEach(inv => {
            if (inv.type === 'crypto' && !inv.isStable) {
                const priceName = inv.baseName || inv.name;
                if (marketPrices[priceName]) {
                    inv.currentPrice = marketPrices[priceName];
                    inv.currentValue = Math.round(inv.amount * inv.currentPrice * 100) / 100;
                    totalCryptoValue += inv.currentValue;
                }
            } else if (inv.type === 'stocks' && inv.shares && marketPrices[inv.name]) {
                inv.currentPrice = marketPrices[inv.name];
                inv.currentValue = Math.round(inv.shares * inv.currentPrice * 100) / 100;
                totalStockValue += inv.currentValue;
            }
        });

        // Update asset totals
        let stableValue = 0;
        player.investments.forEach(inv => {
            if (inv.isStable) stableValue += inv.amount;
        });

        if (totalCryptoValue > 0 || stableValue > 0) {
            player.assets.crypto = Math.round((totalCryptoValue + stableValue) * 100) / 100;
        }
        if (totalStockValue > 0) {
            player.assets.stocks = Math.round(totalStockValue * 100) / 100;
        }
    });

    return changes;
}

// Process staking rewards (called on payday)
function processStakingRewards() {
    const rewards = [];

    gameState.investments.forEach(inv => {
        if (inv.isStaking && inv.monthlyReward && inv.baseName) {
            const oldAmount = inv.amount;
            inv.amount += inv.monthlyReward;

            const currentPrice = marketPrices[inv.baseName] || inv.pricePerUnit;
            const rewardValue = inv.monthlyReward * currentPrice;

            // Update crypto assets value
            gameState.assets.crypto += rewardValue;

            rewards.push({
                name: inv.baseName,
                reward: inv.monthlyReward,
                value: rewardValue
            });
        }
    });

    return rewards;
}

// Set number of players
function setNumPlayers(n) {
    const previousNumPlayers = numPlayers;
    numPlayers = n;

    // Preserve existing player data
    if (n > players.length) {
        // Add new players if increasing count
        for (let i = players.length; i < n; i++) {
            players.push(createPlayer());
        }
    } else if (n < players.length) {
        // Remove excess players if decreasing count
        players.length = n;
    }

    // Keep setupPlayer within valid range
    if (setupPlayer >= n) {
        setupPlayer = n - 1;
    }

    currentPlayer = 0;

    // Update UI
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.classList.remove('bg-yellow-600', 'bg-blue-600', 'bg-red-600', 'bg-green-600');
        btn.classList.add('bg-gray-700');
    });
    const colors = ['bg-yellow-600', 'bg-blue-600', 'bg-red-600', 'bg-green-600'];
    const btn = document.querySelector(`[data-count="${n}"]`);
    if (btn) {
        btn.classList.remove('bg-gray-700');
        btn.classList.add(colors[n - 1]);
    }

    if (typeof updateSetupPlayerTabs === 'function') updateSetupPlayerTabs();
    if (typeof loadSetupPlayerData === 'function') loadSetupPlayerData();
    if (typeof drawBoard === 'function') drawBoard();
    if (typeof updatePlayerTabs === 'function') updatePlayerTabs();
}

// Next player's turn
function nextTurn() {
    // 애니메이션 완료 대기 후 다음 플레이어로 전환 (1초 딜레이)
    setTimeout(() => {
        suppressCashAnimation = true;  // 플레이어 전환 시 애니메이션 억제
        currentPlayer = (currentPlayer + 1) % numPlayers;
        if (currentPlayer === 0) {
            turn++;
        }
        document.getElementById('turnCount').textContent = turn;
        updateCurrentPlayerDisplay();
        updateUI();  // 여기서도 updateUI 호출 (플래그 설정된 상태)
        drawBoard();  // 보드 다시 그려서 현재 플레이어 위치 표시
        suppressCashAnimation = false;  // 플래그 리셋
    }, 1000);
}

// Check if player can escape rat race
function checkEscape() {
    // Only check if game has started (player has income/expenses set)
    const totalExpenses = getTotalExpenses();
    const passiveIncome = getPassiveIncome();

    // Don't trigger if no expenses set (game not started) or no passive income yet
    if (totalExpenses <= 0 || passiveIncome <= 0) return;

    if (!gameState.inFastTrack && passiveIncome >= totalExpenses) {
        document.getElementById('celebrateModal').classList.remove('hidden');
    }
}

// Enter fast track
function enterFastTrack() {
    const player = getPlayer();

    // 패스트트랙 진입 시 투자 소득 계산 (탈출 시점의 패시브 소득)
    const passiveIncomeAtEscape = getPassiveIncome();
    const totalExpensesAtEscape = getTotalExpenses();

    // 모든 자산 현금화
    let totalCash = gameState.assets.cash;

    // 1. 주식/ETF 매도
    gameState.investments.filter(inv => inv.type === 'stocks').forEach(inv => {
        const currentValue = inv.shares * (marketPrices[inv.name] || inv.currentPrice || inv.cost / inv.shares);
        totalCash += currentValue;
    });

    // 2. 가상자산 매도
    gameState.investments.filter(inv => inv.type === 'crypto').forEach(inv => {
        if (inv.isStable) {
            totalCash += inv.amount;
        } else {
            const price = marketPrices[inv.baseName] || marketPrices[inv.name] || inv.currentPrice || 1;
            totalCash += inv.amount * price;
        }
    });

    // 3. 부동산 매도 (시세 기준, 대출 상환)
    gameState.investments.filter(inv => inv.type === 'realEstate').forEach(inv => {
        // 현재 시세로 매도 (시세가 있으면 시세, 없으면 구매가)
        const currentMarketPrice = realEstateMarketPrices[inv.name] || inv.cost;
        const saleProceeds = currentMarketPrice - (inv.loan || 0);  // 대출 상환 후 순수익
        totalCash += saleProceeds;
    });

    // 4. 일반 부채 상환 (신용대출, 학자금 등)
    const remainingDebts = gameState.liabilities.credit + gameState.liabilities.student + gameState.liabilities.other;
    totalCash -= remainingDebts;

    // 모든 투자 및 자산 초기화
    player.investments = [];
    player.assets = { cash: Math.round(totalCash), realEstate: 0, stocks: 0, crypto: 0 };
    player.liabilities = { mortgage: 0, credit: 0, student: 0, other: 0 };

    // 패스트트랙용 소득/지출 설정
    // 투자 소득 = 탈출 시점의 패시브 소득 (월급은 더 이상 없음)
    player.income = {
        salary: 0,
        rental: 0,
        dividend: 0,
        other: passiveIncomeAtEscape  // 투자 소득으로 전환
    };

    // 지출 = 기본 생활비만 (대출, 세금 등은 초기화)
    const basicLiving = Math.round(totalExpensesAtEscape * 0.3);  // 기본 생활비
    player.expenses = {
        housing: 0,
        living: basicLiving,
        loan: 0,
        tax: 0
    };

    gameState.inFastTrack = true;
    gameState.position = 0;

    document.getElementById('celebrateModal').classList.add('hidden');
    showNotification(`패스트트랙 진입! 모든 자산 현금화: ₩${fmt(Math.round(totalCash))}만, 월 투자소득: ₩${fmt(passiveIncomeAtEscape)}만`, 'success');

    // Celebration animation
    if (typeof celebrateFastTrackEntry === 'function') {
        celebrateFastTrackEntry();
    }

    drawBoard();
    updateUI();
}

// Check if dream is achieved
function checkDreamAchieved(space) {
    const player = getPlayer();
    if (!player.dream) return false;

    const dreamData = dreams.find(d => d.id === player.dream);
    if (!dreamData) return false;

    // Check if current space matches dream
    const spaceName = space.name.toLowerCase();
    const dreamName = dreamData.name.toLowerCase();

    if (spaceName.includes(dreamName.substring(2)) || // Remove emoji
        (player.dream === 'island' && spaceName.includes('섬')) ||
        (player.dream === 'space' && spaceName.includes('우주')) ||
        (player.dream === 'castle' && spaceName.includes('성')) ||
        (player.dream === 'art' && spaceName.includes('예술')) ||
        (player.dream === 'supercar' && spaceName.includes('슈퍼카')) ||
        (player.dream === 'worldtrip' && spaceName.includes('세계')) ||
        (player.dream === 'charity' && spaceName.includes('자선')) ||
        (player.dream === 'freedom' && spaceName.includes('꿈달성'))) {

        if (gameState.assets.cash >= dreamData.cost) {
            return true;
        }
    }

    return false;
}

// Purchase dream
function purchaseDream(space) {
    const player = getPlayer();
    const dreamData = dreams.find(d => d.id === player.dream);

    if (dreamData && gameState.assets.cash >= dreamData.cost) {
        gameState.assets.cash -= dreamData.cost;
        player.dreamAchieved = true;

        document.getElementById('victoryMessage').textContent =
            `${dreamData.name}을(를) 달성했습니다! 축하합니다!`;
        document.getElementById('victoryModal').classList.remove('hidden');

        // Victory celebration animation
        if (typeof celebrateVictory === 'function') {
            celebrateVictory();
        }

        return true;
    }

    return false;
}

function hideVictoryModal() {
    document.getElementById('victoryModal').classList.add('hidden');
}
