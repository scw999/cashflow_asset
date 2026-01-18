// ==========================================
// 게임 상태 관리
// ==========================================

// Market prices (현재 가격)
let marketPrices = { ...basePrices };

// Price history for charts
let priceHistory = {};

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
}

// Initialize price history on load
initPriceHistory();

// Game State
let numPlayers = 1;
let currentPlayer = 0;
let setupPlayer = 0;
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
        skipTurns: 0,
        doubleDice: 0
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
    const totalExpense = Object.values(gameState.expenses).reduce((a, b) => a + b, 0) + gameState.children * 30;
    return totalIncome - totalExpense;
}

function getPassiveIncome() {
    return gameState.income.rental + gameState.income.dividend + gameState.income.other;
}

function getTotalExpenses() {
    return Object.values(gameState.expenses).reduce((a, b) => a + b, 0) + gameState.children * 30;
}

function getTotalAssets() {
    return Object.values(gameState.assets).reduce((a, b) => a + b, 0);
}

function getTotalLiabilities() {
    return Object.values(gameState.liabilities).reduce((a, b) => a + b, 0);
}

// 경제 사이클 업데이트
function updateEconomicCycle() {
    economicCycle.turnsInPhase++;

    const cycleInfo = cycleCharacteristics[economicCycle.phase];
    const [minDuration, maxDuration] = cycleInfo.duration;

    // Check if phase should change
    if (economicCycle.turnsInPhase >= minDuration) {
        const changeChance = (economicCycle.turnsInPhase - minDuration) / (maxDuration - minDuration);
        if (Math.random() < changeChance) {
            economicCycle.phase = cycleInfo.nextPhase;
            economicCycle.turnsInPhase = 0;

            // Adjust interest rate based on phase
            if (economicCycle.phase === 'recession') {
                economicCycle.interestRate = Math.max(0.5, economicCycle.interestRate - 0.5);
            } else if (economicCycle.phase === 'expansion') {
                economicCycle.interestRate = Math.min(6, economicCycle.interestRate + 0.25);
            }
        }
    }

    // Update market sentiment
    if (economicCycle.phase === 'expansion' || economicCycle.phase === 'recovery') {
        economicCycle.sentiment = Math.min(0.8, economicCycle.sentiment + (Math.random() * 0.1 - 0.03));
    } else {
        economicCycle.sentiment = Math.max(0.2, economicCycle.sentiment - (Math.random() * 0.1 - 0.03));
    }
}

// Update market prices with economic cycle and asset characteristics
function updateMarketPrices() {
    const changes = [];

    // Update economic cycle
    updateEconomicCycle();

    const cycleInfo = cycleCharacteristics[economicCycle.phase];

    Object.keys(marketPrices).forEach(name => {
        const oldPrice = marketPrices[name];
        const char = assetCharacteristics[name] || { type: 'stock', volatility: 0.1, beta: 1.0 };

        // Base random change
        let changePercent = (Math.random() - 0.5) * 2 * char.volatility;

        // Apply economic cycle bias based on asset type
        let cycleBias = 0;
        if (char.type === 'stock' || char.type === 'etf') {
            cycleBias = cycleInfo.stockBias * char.beta;
        } else if (char.type === 'crypto') {
            cycleBias = cycleInfo.cryptoBias * char.beta;
        } else if (char.type === 'bond') {
            cycleBias = cycleInfo.bondBias;
        } else if (char.type === 'commodity') {
            cycleBias = cycleInfo.commodityBias;
            // Safe haven assets (gold) benefit in recession
            if (char.safeHaven && economicCycle.phase === 'recession') {
                cycleBias += 0.02;
            }
        }

        // Apply market sentiment
        const sentimentEffect = (economicCycle.sentiment - 0.5) * 0.02;

        // Apply interest rate effect (higher rates = lower prices for growth assets)
        let rateEffect = 0;
        if (char.type === 'crypto' || (char.type === 'stock' && char.beta > 1.2)) {
            rateEffect = -((economicCycle.interestRate - 3) * 0.005);
        }

        changePercent += cycleBias + sentimentEffect + rateEffect;

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

// Apply market event (from market space)
function applyMarketEvent(isUp) {
    const multiplier = isUp ? 1.1 : 0.9;
    const changePercent = isUp ? 10 : -10;

    // Apply to random subset of assets
    const assetNames = Object.keys(marketPrices);
    const affectedCount = Math.floor(assetNames.length * (0.5 + Math.random() * 0.3));
    const shuffled = assetNames.sort(() => Math.random() - 0.5);
    const affected = shuffled.slice(0, affectedCount);

    const changes = [];

    affected.forEach(name => {
        const oldPrice = marketPrices[name];
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
    numPlayers = n;
    players = [];
    for (let i = 0; i < n; i++) {
        players.push(createPlayer());
    }
    currentPlayer = 0;
    setupPlayer = 0;

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
    if (typeof drawBoard === 'function') drawBoard();
    if (typeof updatePlayerTabs === 'function') updatePlayerTabs();
}

// Next player's turn
function nextTurn() {
    currentPlayer = (currentPlayer + 1) % numPlayers;
    if (currentPlayer === 0) {
        turn++;
    }
    document.getElementById('turnCount').textContent = turn;
    updateCurrentPlayerDisplay();
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
    gameState.inFastTrack = true;
    gameState.position = 0;
    document.getElementById('celebrateModal').classList.add('hidden');
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

        return true;
    }

    return false;
}

function hideVictoryModal() {
    document.getElementById('victoryModal').classList.add('hidden');
}
