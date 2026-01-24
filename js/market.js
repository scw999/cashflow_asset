// ==========================================
// 투자 시장 (주식, ETF, 가상자산, 원자재)
// ==========================================

// Get market tab HTML
function getMarketHTML() {
    const inFastTrack = gameState.inFastTrack;

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- 부동산 시세 및 정보 -->
            <div class="card p-4 rounded-xl border border-blue-500/30">
                <h4 class="font-bold text-blue-400 mb-3">🏠 부동산 시세</h4>
                <div class="space-y-2 text-sm max-h-64 overflow-y-auto">
                    ${Object.keys(realEstateMarketPrices).map(name => {
                        const price = realEstateMarketPrices[name];
                        const history = realEstatePriceHistory[name] || [price];
                        const prevPrice = history.length > 1 ? history[history.length - 2] : price;
                        const change = ((price - prevPrice) / prevPrice * 100).toFixed(1);
                        const char = realEstateCharacteristics[name] || {};
                        return `
                            <div class="p-2 bg-gray-800 rounded">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs">${name}</span>
                                    <span class="${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'} text-xs">
                                        ${parseFloat(change) >= 0 ? '+' : ''}${change}%
                                    </span>
                                </div>
                                <div class="text-yellow-400 font-bold">₩${fmt(price)}만</div>
                                <div class="text-[10px] text-gray-500">수익률 ${((char.rentalYield || 0.04) * 100).toFixed(1)}%</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-400">
                    ${inFastTrack ?
                        '<span class="text-emerald-400">패스트트랙에서 대량 매수 가능</span>' :
                        '부동산은 <span class="text-yellow-400">기회 칸</span>에서 구매'}
                </div>
                ${inFastTrack ? `
                <button onclick="showBlockDealModal('realestate')"
                    class="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold">
                    🏢 블록딜 매수
                </button>` : ''}
            </div>

            <!-- 주식 -->
            <div class="card p-4 rounded-xl border border-purple-500/30">
                <h4 class="font-bold text-purple-400 mb-3">📊 주식</h4>
                <div class="space-y-2 text-sm">
                    ${['삼성전자', 'SK하이닉스', '네이버', '애플', '테슬라', '엔비디아'].map(name => {
                        const price = marketPrices[name];
                        const history = priceHistory[name] || [price];
                        const prevPrice = history.length > 1 ? history[history.length - 2] : price;
                        const change = ((price - prevPrice) / prevPrice * 100).toFixed(1);
                        return `
                            <div class="flex items-center gap-1">
                                <button onclick="buyStock('${name}')"
                                    class="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition">
                                    ${name} ₩${fmt(price)}만
                                    <span class="${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                                        ${parseFloat(change) >= 0 ? '+' : ''}${change}%
                                    </span>
                                </button>
                                <button onclick="showAssetChart('${name}')"
                                    class="p-2 bg-gray-600 hover:bg-gray-500 rounded">📈</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- ETF -->
            <div class="card p-4 rounded-xl border border-emerald-500/30">
                <h4 class="font-bold text-emerald-400 mb-3">📈 ETF</h4>
                <div class="space-y-2 text-sm">
                    ${['S&P500 ETF', '나스닥100 ETF', '고배당 ETF', '리츠 ETF', '채권 ETF'].map(name => {
                        const price = marketPrices[name];
                        const history = priceHistory[name] || [price];
                        const prevPrice = history.length > 1 ? history[history.length - 2] : price;
                        const change = ((price - prevPrice) / prevPrice * 100).toFixed(1);
                        return `
                            <div class="flex items-center gap-1">
                                <button onclick="buyStock('${name}')"
                                    class="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition">
                                    ${name} ₩${fmt(price)}만
                                    <span class="${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                                        ${parseFloat(change) >= 0 ? '+' : ''}${change}%
                                    </span>
                                </button>
                                <button onclick="showAssetChart('${name}')"
                                    class="p-2 bg-gray-600 hover:bg-gray-500 rounded">📈</button>
                            </div>
                        `;
                    }).join('')}

                    <div class="border-t border-gray-600 my-2 pt-2">
                        <div class="text-xs text-red-400 mb-1">⚠️ 레버리지/인버스 (고위험)</div>
                        ${['S&P500 2X ETF', '나스닥 3X ETF', 'S&P500 인버스', '나스닥 인버스 2X'].map(name => {
                            const price = marketPrices[name];
                            const history = priceHistory[name] || [price];
                            const prevPrice = history.length > 1 ? history[history.length - 2] : price;
                            const change = ((price - prevPrice) / prevPrice * 100).toFixed(1);
                            const char = assetCharacteristics[name] || {};
                            const leverageLabel = char.leverage > 0 ? `${char.leverage}X` : `${Math.abs(char.leverage)}X 인버스`;
                            return `
                                <div class="flex items-center gap-1">
                                    <button onclick="buyStock('${name}')"
                                        class="flex-1 p-2 ${char.leverage < 0 ? 'bg-red-900/50 hover:bg-red-800/50' : 'bg-orange-900/50 hover:bg-orange-800/50'} rounded text-left transition">
                                        <span class="text-xs ${char.leverage < 0 ? 'text-red-300' : 'text-orange-300'}">[${leverageLabel}]</span>
                                        ${name.replace(' 2X', '').replace(' 3X', '').replace(' 인버스', '')} ₩${fmt(price)}만
                                        <span class="${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                                            ${parseFloat(change) >= 0 ? '+' : ''}${change}%
                                        </span>
                                    </button>
                                    <button onclick="showAssetChart('${name}')"
                                        class="p-2 bg-gray-600 hover:bg-gray-500 rounded">📈</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- 원자재 -->
            <div class="card p-4 rounded-xl border border-yellow-500/30">
                <h4 class="font-bold text-yellow-400 mb-3">🥇 원자재</h4>
                <div class="space-y-2 text-sm">
                    ${['금 ETF', '은 ETF', '원유 ETF', '농산물 ETF'].map(name => {
                        const price = marketPrices[name];
                        const history = priceHistory[name] || [price];
                        const prevPrice = history.length > 1 ? history[history.length - 2] : price;
                        const change = ((price - prevPrice) / prevPrice * 100).toFixed(1);
                        return `
                            <div class="flex items-center gap-1">
                                <button onclick="buyStock('${name}')"
                                    class="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition">
                                    ${name} ₩${fmt(price)}만
                                    <span class="${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                                        ${parseFloat(change) >= 0 ? '+' : ''}${change}%
                                    </span>
                                </button>
                                <button onclick="showAssetChart('${name}')"
                                    class="p-2 bg-gray-600 hover:bg-gray-500 rounded">📈</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 가상자산 -->
            <div class="card p-4 rounded-xl border border-orange-500/30">
                <h4 class="font-bold text-orange-400 mb-3">💎 가상자산</h4>
                <div class="space-y-2 text-sm">
                    ${['비트코인', '이더리움', '솔라나'].map(name => {
                        const price = marketPrices[name];
                        const history = priceHistory[name] || [price];
                        const prevPrice = history.length > 1 ? history[history.length - 2] : price;
                        const change = ((price - prevPrice) / prevPrice * 100).toFixed(1);
                        return `
                            <div class="flex items-center gap-1">
                                <button onclick="buyCrypto('${name}')"
                                    class="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition">
                                    ${name} ₩${fmt(price)}만
                                    <span class="${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                                        ${parseFloat(change) >= 0 ? '+' : ''}${change}%
                                    </span>
                                </button>
                                <button onclick="showAssetChart('${name}')"
                                    class="p-2 bg-gray-600 hover:bg-gray-500 rounded">📈</button>
                            </div>
                        `;
                    }).join('')}

                    <div class="border-t border-gray-600 my-2 pt-2">
                        <div class="text-xs text-gray-400 mb-1">⛓️ 스테이킹 (이자는 코인으로)</div>
                        <button onclick="stakeCrypto('이더리움')"
                            class="w-full p-2 bg-indigo-700 hover:bg-indigo-600 rounded text-left transition mb-1">
                            Ξ 이더리움 스테이킹 <span class="text-emerald-400">연 3%</span>
                        </button>
                        <button onclick="stakeCrypto('솔라나')"
                            class="w-full p-2 bg-purple-700 hover:bg-purple-600 rounded text-left transition mb-1">
                            ◎ 솔라나 스테이킹 <span class="text-emerald-400">연 8%</span>
                        </button>
                    </div>

                    <div class="border-t border-gray-600 my-2 pt-2">
                        <div class="text-xs text-gray-400 mb-1">💵 스테이블 예치</div>
                        <button onclick="buyStableCoin()"
                            class="w-full p-2 bg-green-700 hover:bg-green-600 rounded text-left transition">
                            USDT 예치 <span class="text-emerald-400">연 5%</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Buy stock
function buyStock(name) {
    const currentPrice = marketPrices[name];
    const maxShares = Math.floor(gameState.assets.cash / currentPrice);

    if (maxShares <= 0) {
        showNotification('현금이 부족합니다!', 'error');
        return;
    }

    // Calculate dividend info for this specific stock
    let dividendYield = 0;
    if (name.includes('고배당')) dividendYield = 0.04;
    else if (name.includes('리츠')) dividendYield = 0.05;
    else if (name.includes('채권')) dividendYield = 0.03;
    else if (name === '삼성전자') dividendYield = 0.02;
    else if (name === '애플') dividendYield = 0.005;
    else if (assetCharacteristics[name] && assetCharacteristics[name].dividend) {
        dividendYield = assetCharacteristics[name].dividend;
    }

    // Build description based on dividend info
    let description = '';
    if (dividendYield > 0) {
        const annualDividendPercent = (dividendYield * 100).toFixed(1);
        const monthlyDividendPer100 = Math.floor(100 * currentPrice * dividendYield / 12);
        description = `💰 배당주 (연 ${annualDividendPercent}% 배당)<br>100주 매수 시 월 배당금: ₩${fmt(monthlyDividendPer100)}만`;
    } else {
        description = '📊 비배당주 (시세 차익 목적)';
    }

    showPurchaseModal({
        title: '📈 주식 매수',
        itemName: name,
        price: currentPrice,
        maxQuantity: maxShares,
        step: 1,
        unit: '주',
        description: description,
        buttonText: '매수하기',
        onConfirm: (shares) => {
            executeBuyStock(name, shares, currentPrice);
        }
    });
}

function executeBuyStock(name, shares, currentPrice) {
    const totalCost = Math.round(currentPrice * shares * 100) / 100;

    // Dividend yield based on asset type
    let dividendYield = 0;
    if (name.includes('고배당')) dividendYield = 0.04;
    else if (name.includes('리츠')) dividendYield = 0.05;
    else if (name.includes('채권')) dividendYield = 0.03;
    else if (name === '삼성전자') dividendYield = 0.02;
    else if (name === '애플') dividendYield = 0.005;

    const monthlyDividend = Math.floor(totalCost * dividendYield / 12);

    gameState.assets.cash -= totalCost;
    gameState.assets.stocks += totalCost;

    if (monthlyDividend > 0) {
        gameState.income.dividend += monthlyDividend;
    }

    gameState.investments.push({
        type: 'stocks',
        name: name,
        cost: totalCost,
        shares: shares,
        pricePerShare: currentPrice,
        monthlyIncome: monthlyDividend
    });

    showNotification(`${name} ${shares}주 매수 완료!${monthlyDividend > 0 ? ` (월 배당 +₩${fmt(monthlyDividend)}만)` : ''}`, 'success');
    updateUI();
    showTab('portfolio');
}

// Buy cryptocurrency (소수점 단위 가능)
function buyCrypto(name) {
    const currentPrice = marketPrices[name];
    const maxAmount = Math.floor((gameState.assets.cash / currentPrice) * 1000) / 1000;

    if (maxAmount <= 0) {
        showNotification('현금이 부족합니다!', 'error');
        return;
    }

    showPurchaseModal({
        title: '💎 가상자산 매수',
        itemName: name,
        price: currentPrice,
        maxQuantity: maxAmount,
        step: 0.001,
        unit: '개',
        description: '0.001 단위까지 구매 가능합니다.',
        buttonText: '매수하기',
        onConfirm: (amount) => {
            executeBuyCrypto(name, amount, currentPrice);
        }
    });
}

function executeBuyCrypto(name, amount, currentPrice) {
    const totalCost = Math.round(currentPrice * amount * 100) / 100;

    gameState.assets.cash -= totalCost;
    gameState.assets.crypto += totalCost;

    gameState.investments.push({
        type: 'crypto',
        name: name,
        cost: totalCost,
        amount: amount,
        pricePerUnit: currentPrice,
        monthlyIncome: 0
    });

    showNotification(`${name} ${amount}개 매수 완료!`, 'success');
    updateUI();
    showTab('portfolio');
}

// Stake cryptocurrency (새로 구매하여 스테이킹)
function stakeCrypto(name) {
    const currentPrice = marketPrices[name];
    const annualRate = stakingRates[name];

    // 기존 보유 코인 확인
    const existingCrypto = gameState.investments.filter(inv =>
        inv.type === 'crypto' && inv.name === name && !inv.isStaking && !inv.isStable
    );

    if (existingCrypto.length > 0) {
        const totalOwned = existingCrypto.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        // Show choice modal
        showEventModal(`💎 ${name} 스테이킹`, `
            <div class="text-center mb-4">
                <div class="text-lg text-yellow-400 mb-2">연 ${(annualRate * 100).toFixed(0)}% 보상</div>
                <div class="text-gray-400">보유 중: ${totalOwned.toFixed(3)}개</div>
            </div>
        `, [
            { text: '새로 구매하여 스테이킹', action: `showNewStakingModal('${name}')`, primary: true },
            { text: '보유 코인 스테이킹', action: `stakeExistingCrypto('${name}')` }
        ]);
        return;
    }

    showNewStakingModal(name);
}

function showNewStakingModal(name) {
    hideEventModal();
    const currentPrice = marketPrices[name];
    const annualRate = stakingRates[name];
    const maxAmount = Math.floor((gameState.assets.cash / currentPrice) * 1000) / 1000;

    if (maxAmount <= 0) {
        showNotification('현금이 부족합니다!', 'error');
        return;
    }

    showPurchaseModal({
        title: `💎 ${name} 스테이킹`,
        itemName: name,
        price: currentPrice,
        maxQuantity: maxAmount,
        step: 0.001,
        unit: '개',
        description: `연 ${(annualRate * 100).toFixed(0)}% 보상 (${name}으로 지급)`,
        buttonText: '스테이킹하기',
        onConfirm: (amount) => {
            executeStakeCrypto(name, amount, currentPrice);
        }
    });
}

function executeStakeCrypto(name, amount, currentPrice) {
    const annualRate = stakingRates[name];
    const totalCost = Math.round(currentPrice * amount * 100) / 100;
    const monthlyReward = amount * annualRate / 12;

    gameState.assets.cash -= totalCost;
    gameState.assets.crypto += totalCost;

    gameState.investments.push({
        type: 'crypto',
        name: `${name} 스테이킹`,
        baseName: name,
        cost: totalCost,
        amount: amount,
        pricePerUnit: currentPrice,
        stakingRate: annualRate,
        monthlyReward: monthlyReward,
        isStaking: true,
        monthlyIncome: 0,
        stakingTurn: turn,
        lockupTurns: 1
    });

    showNotification(`${name} ${amount}개 스테이킹 시작! (월 보상: ${monthlyReward.toFixed(4)} ${name})`, 'success');
    updateUI();
    showTab('portfolio');
}

// 기존 보유 코인 스테이킹
function stakeExistingCrypto(name) {
    hideEventModal();
    const annualRate = stakingRates[name];
    if (!annualRate) {
        showNotification(`${name}은(는) 스테이킹을 지원하지 않습니다.`, 'error');
        return;
    }

    // 보유 중인 해당 코인 찾기
    const existingIdx = gameState.investments.findIndex(inv =>
        inv.type === 'crypto' && inv.name === name && !inv.isStaking && !inv.isStable
    );

    if (existingIdx === -1) {
        showNotification(`보유 중인 ${name}이(가) 없습니다.`, 'error');
        return;
    }

    const existing = gameState.investments[existingIdx];

    showPurchaseModal({
        title: `💎 ${name} 스테이킹`,
        itemName: `보유 ${name}`,
        price: 0,
        maxQuantity: existing.amount,
        step: 0.001,
        unit: '개',
        description: `연 ${(annualRate * 100).toFixed(0)}% 보상 (보유: ${existing.amount.toFixed(3)}개)`,
        buttonText: '스테이킹하기',
        onConfirm: (amountToStake) => {
            executeStakeExisting(name, existingIdx, amountToStake);
        }
    });
}

function executeStakeExisting(name, existingIdx, amountToStake) {
    const annualRate = stakingRates[name];
    const existing = gameState.investments[existingIdx];
    const currentPrice = marketPrices[name] || existing.pricePerUnit;
    const stakeCost = Math.round(amountToStake * currentPrice * 100) / 100;
    const monthlyReward = amountToStake * annualRate / 12;

    // 기존 보유분에서 차감
    existing.amount -= amountToStake;
    existing.cost -= stakeCost;

    if (existing.amount <= 0.0001) {
        gameState.investments.splice(existingIdx, 1);
    }

    // 스테이킹으로 추가
    gameState.investments.push({
        type: 'crypto',
        name: `${name} 스테이킹`,
        baseName: name,
        cost: stakeCost,
        amount: amountToStake,
        pricePerUnit: currentPrice,
        stakingRate: annualRate,
        monthlyReward: monthlyReward,
        isStaking: true,
        monthlyIncome: 0,
        stakingTurn: turn,
        lockupTurns: 1
    });

    showNotification(`${name} ${amountToStake.toFixed(3)}개 스테이킹 시작!`, 'success');
    updateUI();
    showTab('portfolio');
}

// Buy stablecoin (예치)
function buyStableCoin() {
    const maxAmount = gameState.assets.cash;

    if (maxAmount <= 0) {
        showNotification('현금이 부족합니다!', 'error');
        return;
    }

    showPurchaseModal({
        title: '💵 스테이블코인 예치',
        itemName: '스테이블코인',
        price: 0,
        maxQuantity: maxAmount,
        step: 1,
        unit: '만원',
        description: '연 5% 이자 (현금으로 지급)',
        buttonText: '예치하기',
        onConfirm: (amount) => {
            executeStableCoin(amount);
        }
    });
}

function executeStableCoin(amount) {
    const monthlyInterest = Math.round(amount * 0.05 / 12 * 100) / 100;

    gameState.assets.cash -= amount;
    gameState.assets.crypto += amount;
    gameState.income.dividend += monthlyInterest;

    gameState.investments.push({
        type: 'crypto',
        name: '스테이블 예치',
        cost: amount,
        amount: amount,
        monthlyIncome: monthlyInterest,
        isStable: true
    });

    showNotification(`₩${fmt(amount)}만원 예치 완료! (월 이자 +₩${fmt(monthlyInterest)}만)`, 'success');
    updateUI();
    showTab('portfolio');
}

// Sell investment
function sellInvestment(idx) {
    const inv = gameState.investments[idx];

    // 스테이킹 언락 체크
    if (inv.isStaking) {
        // 아직 언락 시작 안한 경우
        if (!inv.isUnlocking) {
            if (confirm(`${inv.name}의 스테이킹을 해제하시겠습니까?\n\n언락에 1턴이 소요됩니다.\n언락 후 매도 또는 계속 보유할 수 있습니다.`)) {
                inv.isUnlocking = true;
                inv.unlockTurn = turn;
                showNotification(`${inv.baseName} 스테이킹 해제 시작 (1턴 후 완료)`, 'info');
                updateUI();
            }
            return;
        }

        // 언락 중인 경우
        const turnsSinceUnlock = turn - inv.unlockTurn;
        if (turnsSinceUnlock < 1) {
            alert(`스테이킹 해제 중입니다.\n\n1턴 후에 매도 가능합니다.\n현재: ${turnsSinceUnlock}턴 경과`);
            return;
        }

        // 언락 완료 - 매도 또는 계속 보유 선택
        const choice = prompt(`${inv.name} 언락 완료!\n\n보유: ${inv.amount.toFixed(3)}개\n\n1. 전량 매도\n2. 일부 매도\n3. 계속 보유 (스테이킹 해제 상태)\n\n선택 (1, 2, 3):`, '1');

        if (choice === '3') {
            // 스테이킹 해제하고 일반 보유로 전환
            inv.isStaking = false;
            inv.isUnlocking = false;
            inv.name = inv.baseName;
            inv.monthlyReward = 0;
            showNotification(`${inv.baseName} 스테이킹 해제 완료. 일반 보유로 전환.`, 'success');
            updateUI();
            return;
        }

        if (choice === '2') {
            // 일부 매도
            const amountToSell = parseFloat(prompt(`${inv.baseName} ${inv.amount.toFixed(3)}개 보유중\n몇 개를 매도하시겠습니까?`, inv.amount.toFixed(3)));
            if (!amountToSell || amountToSell <= 0) return;
            if (amountToSell > inv.amount) {
                alert('보유 수량보다 많이 매도할 수 없습니다.');
                return;
            }

            const currentPrice = marketPrices[inv.baseName] || inv.pricePerUnit;
            const saleValue = Math.round(amountToSell * currentPrice * 100) / 100;

            if (!confirm(`${inv.baseName} ${amountToSell.toFixed(3)}개를 ₩${fmt(saleValue)}만원에 매도하시겠습니까?`)) return;

            gameState.assets.cash += saleValue;
            const soldCost = Math.round(inv.cost * amountToSell / inv.amount);
            gameState.assets.crypto -= soldCost;

            inv.amount -= amountToSell;
            inv.cost -= soldCost;
            inv.monthlyReward = inv.monthlyReward * (1 - amountToSell / (inv.amount + amountToSell));

            // 스테이킹 해제 상태로 전환
            inv.isStaking = false;
            inv.isUnlocking = false;
            inv.name = inv.baseName;

            if (inv.amount <= 0.0001) {
                gameState.investments.splice(idx, 1);
            }

            showNotification(`${inv.baseName} ${amountToSell.toFixed(3)}개 매도 완료!`, 'success');
            updateUI();
            showTab('portfolio');
            return;
        }

        // 전량 매도 (choice === '1' 또는 기본)
        // 아래로 계속...
    }

    if (inv.shares && inv.shares > 1) {
        // Stock with multiple shares
        const sharesToSell = parseInt(prompt(`${inv.name} ${inv.shares}주 보유중\n몇 주를 매도하시겠습니까?`, inv.shares));
        if (!sharesToSell || sharesToSell <= 0) return;
        if (sharesToSell > inv.shares) {
            alert('보유 주식보다 많이 매도할 수 없습니다.');
            return;
        }

        const currentPrice = marketPrices[inv.name] || inv.pricePerShare;
        const saleValue = Math.round(sharesToSell * currentPrice * 100) / 100;
        const proportionalDividend = inv.monthlyIncome > 0 ? Math.round(inv.monthlyIncome * sharesToSell / inv.shares) : 0;

        if (!confirm(`${inv.name} ${sharesToSell}주를 ₩${fmt(saleValue)}만원에 매도하시겠습니까?`)) return;

        gameState.assets.cash += saleValue;
        const soldCost = Math.round(inv.cost * sharesToSell / inv.shares);
        gameState.assets.stocks -= soldCost;

        if (proportionalDividend > 0) {
            gameState.income.dividend -= proportionalDividend;
            inv.monthlyIncome -= proportionalDividend;
        }

        inv.shares -= sharesToSell;
        inv.cost -= soldCost;

        if (inv.shares <= 0) {
            gameState.investments.splice(idx, 1);
        }
    } else if (inv.amount && inv.amount > 0) {
        // Crypto with amount
        let amountToSell = parseFloat(prompt(`${inv.name} ${inv.amount.toFixed(4)}개 보유중\n몇 개를 매도하시겠습니까?\n(전량 매도: ${inv.amount.toFixed(4)})`, inv.amount.toFixed(4)));
        if (!amountToSell || amountToSell <= 0) return;

        // 부동소수점 오차 허용 (전량 매도 시 정확히 맞추기) - 0.002 이하 차이면 전량 매도
        if (Math.abs(amountToSell - inv.amount) < 0.002) {
            amountToSell = inv.amount;  // 전량 매도로 처리
        }
        // 남은 수량이 0.001 이하면 전량 매도로 처리
        if (inv.amount - amountToSell < 0.001 && inv.amount - amountToSell > 0) {
            amountToSell = inv.amount;
        }

        if (amountToSell > inv.amount + 0.001) {
            alert('보유 수량보다 많이 매도할 수 없습니다.');
            return;
        }

        const currentPrice = marketPrices[inv.baseName || inv.name] || inv.pricePerUnit || (inv.cost / inv.amount);
        const saleValue = Math.round(amountToSell * currentPrice * 100) / 100;

        if (!confirm(`${inv.name} ${amountToSell.toFixed(3)}개를 ₩${fmt(saleValue)}만원에 매도하시겠습니까?`)) return;

        gameState.assets.cash += saleValue;
        const soldCost = Math.round(inv.cost * amountToSell / inv.amount);
        gameState.assets.crypto -= soldCost;

        if (inv.monthlyIncome > 0) {
            const proportionalIncome = Math.round(inv.monthlyIncome * amountToSell / inv.amount * 100) / 100;
            gameState.income.dividend -= proportionalIncome;
            inv.monthlyIncome -= proportionalIncome;
        }

        if (inv.isStaking && inv.monthlyReward) {
            inv.monthlyReward = inv.monthlyReward * (1 - amountToSell / inv.amount);
        }

        inv.amount -= amountToSell;
        inv.cost -= soldCost;

        // 0.001 이하 남은 경우 정리 (부동소수점 오차 포함)
        if (inv.amount <= 0.001) {
            gameState.investments.splice(idx, 1);
        }
    } else {
        // Full sale (real estate or single item)
        let currentValue = inv.cost;

        if (inv.type === 'realEstate') {
            // Real estate appreciation (random 0-20%)
            const appreciation = 1 + Math.random() * 0.2;
            currentValue = Math.round(inv.cost * appreciation);
        }

        if (!confirm(`${inv.name}을(를) ₩${fmt(currentValue)}만원에 매도하시겠습니까?`)) return;

        gameState.assets.cash += currentValue;

        if (inv.type === 'realEstate') {
            gameState.assets.realEstate -= inv.cost;
            if (inv.loan) {
                // 대출금 상환 (투자부동산 담보대출은 별도 관리되므로 liabilities.mortgage에서 차감하지 않음)
                gameState.assets.cash -= inv.loan;  // 대출 상환으로 현금 차감
                // Remove loan payment (음수가 되지 않도록 보호)
                const monthlyLoanPayment = Math.round(inv.loan * 0.04 / 12);
                gameState.expenses.loan = Math.max(0, gameState.expenses.loan - monthlyLoanPayment);
            }
            if (inv.monthlyIncome) {
                gameState.income.rental = Math.max(0, gameState.income.rental - inv.monthlyIncome);
            }
        } else if (inv.type === 'stocks') {
            gameState.assets.stocks -= inv.cost;
            if (inv.monthlyIncome) {
                gameState.income.dividend -= inv.monthlyIncome;
            }
        } else if (inv.type === 'crypto') {
            gameState.assets.crypto -= inv.cost;
            if (inv.monthlyIncome) {
                gameState.income.dividend -= inv.monthlyIncome;
            }
        }

        gameState.investments.splice(idx, 1);
    }

    updateUI();
    showTab('portfolio');
}
