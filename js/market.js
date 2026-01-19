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
    const shares = parseInt(prompt(`${name} (현재가 ₩${fmt(currentPrice)}만/주)\n\n몇 주 구매하시겠습니까?`, '10'));

    if (!shares || shares <= 0) return;

    const totalCost = Math.round(currentPrice * shares * 100) / 100;

    if (gameState.assets.cash < totalCost) {
        alert(`현금이 부족합니다! 필요: ₩${fmt(totalCost)}만`);
        return;
    }

    // Dividend yield based on asset type
    let dividendYield = 0;
    if (name.includes('고배당')) dividendYield = 0.04;
    else if (name.includes('리츠')) dividendYield = 0.05;
    else if (name.includes('채권')) dividendYield = 0.03;
    else if (name === '삼성전자') dividendYield = 0.02;
    else if (name === '애플') dividendYield = 0.005;

    const monthlyDividend = Math.floor(totalCost * dividendYield / 12);

    if (!confirm(`${name} ${shares}주를 ₩${fmt(totalCost)}만원에 구매하시겠습니까?${monthlyDividend > 0 ? `\n예상 월 배당: ₩${fmt(monthlyDividend)}만` : ''}`)) {
        return;
    }

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

    updateUI();
    showTab('portfolio');
}

// Buy cryptocurrency (소수점 단위 가능)
function buyCrypto(name) {
    const currentPrice = marketPrices[name];
    const amount = parseFloat(prompt(`${name} (현재가 ₩${fmt(currentPrice)}만)\n\n몇 개 구매하시겠습니까?\n(0.001 단위까지 입력 가능)`, '1'));

    if (!amount || amount <= 0) return;

    const totalCost = Math.round(currentPrice * amount * 100) / 100;

    if (gameState.assets.cash < totalCost) {
        alert(`현금이 부족합니다! 필요: ₩${fmt(totalCost)}만`);
        return;
    }

    if (!confirm(`${name} ${amount}개를 ₩${fmt(totalCost)}만원에 구매하시겠습니까?`)) return;

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

    updateUI();
    showTab('portfolio');
}

// Stake cryptocurrency
function stakeCrypto(name) {
    const currentPrice = marketPrices[name];
    const annualRate = stakingRates[name];

    const amount = parseFloat(prompt(`${name} 스테이킹 (연 ${annualRate * 100}%)\n\n현재가: ₩${fmt(currentPrice)}만\n이자는 ${name}으로 지급됩니다.\n\n몇 개를 스테이킹하시겠습니까?\n(0.001 단위까지 입력 가능)`, '1'));

    if (!amount || amount <= 0) return;

    const totalCost = Math.round(currentPrice * amount * 100) / 100;

    if (gameState.assets.cash < totalCost) {
        alert(`현금이 부족합니다! 필요: ₩${fmt(totalCost)}만`);
        return;
    }

    const monthlyReward = amount * annualRate / 12;

    if (!confirm(`${name} ${amount}개를 ₩${fmt(totalCost)}만원에 스테이킹하시겠습니까?\n\n예상 월 보상: ${monthlyReward.toFixed(4)} ${name}`)) {
        return;
    }

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
        stakingTurn: turn,  // 락업 시작 턴
        lockupTurns: 1       // 1턴 후 매도 가능
    });

    updateUI();
    showTab('portfolio');
}

// Buy stablecoin (예치)
function buyStableCoin() {
    const amount = parseFloat(prompt(`스테이블코인 예치 (연 5% 이자, 현금으로 지급)\n\n얼마를 예치하시겠습니까? (만원 단위)`, '1000'));

    if (!amount || amount <= 0) return;

    if (gameState.assets.cash < amount) {
        alert(`현금이 부족합니다! 보유: ₩${fmt(gameState.assets.cash)}만`);
        return;
    }

    const monthlyInterest = Math.round(amount * 0.05 / 12 * 100) / 100;

    if (!confirm(`₩${fmt(amount)}만원을 스테이블코인에 예치하시겠습니까?\n\n예상 월 이자: ₩${fmt(monthlyInterest)}만 (현금)`)) {
        return;
    }

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

    updateUI();
    showTab('portfolio');
}

// Sell investment
function sellInvestment(idx) {
    const inv = gameState.investments[idx];

    // 스테이킹 락업 체크 (1턴 후 매도 가능)
    if (inv.isStaking && inv.stakingTurn !== undefined) {
        const turnsStaked = turn - inv.stakingTurn;
        const requiredTurns = inv.lockupTurns || 1;
        if (turnsStaked < requiredTurns) {
            alert(`스테이킹 락업 기간입니다.\n\n${requiredTurns}턴 후에 매도할 수 있습니다.\n현재: ${turnsStaked}턴 경과 / ${requiredTurns}턴 필요`);
            return;
        }
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
        const amountToSell = parseFloat(prompt(`${inv.name} ${inv.amount.toFixed(3)}개 보유중\n몇 개를 매도하시겠습니까?`, inv.amount.toFixed(3)));
        if (!amountToSell || amountToSell <= 0) return;
        if (amountToSell > inv.amount) {
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

        if (inv.amount <= 0.0001) {
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
                gameState.liabilities.mortgage -= inv.loan;
                // Remove loan payment
                const monthlyLoanPayment = Math.round(inv.loan * 0.04 / 12);
                gameState.expenses.loan -= monthlyLoanPayment;
            }
            if (inv.monthlyIncome) {
                gameState.income.rental -= inv.monthlyIncome;
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
