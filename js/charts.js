// ==========================================
// 차트 관련 기능
// ==========================================

let assetChartInstance = null;
let simChartInstance = null;
let portfolioChartInstance = null;

// Show asset price chart modal
function showAssetChart(assetName) {
    const modal = document.getElementById('assetChartModal');
    const title = document.getElementById('assetChartTitle');
    const currentPriceEl = document.getElementById('assetCurrentPrice');
    const priceChangeEl = document.getElementById('assetPriceChange');

    title.textContent = `📈 ${assetName} 가격 차트`;

    const history = priceHistory[assetName] || [];
    const currentPrice = marketPrices[assetName];
    const startPrice = history[0] || currentPrice;
    const totalChange = ((currentPrice - startPrice) / startPrice * 100).toFixed(1);

    currentPriceEl.textContent = `₩${fmt(currentPrice)}만`;
    priceChangeEl.innerHTML = `<span class="${parseFloat(totalChange) >= 0 ? 'text-emerald-400' : 'text-red-400'}">${parseFloat(totalChange) >= 0 ? '▲' : '▼'} ${Math.abs(totalChange)}%</span>`;

    modal.classList.remove('hidden');

    // Draw chart
    setTimeout(() => {
        const ctx = document.getElementById('assetPriceChart');
        if (assetChartInstance) assetChartInstance.destroy();

        const labels = history.map((_, i) => {
            if (i === 0) return '과거';
            if (i === history.length - 1) return '현재';
            return `${history.length - i - 1}턴전`;
        });

        assetChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '가격 (만원)',
                    data: [...history],
                    borderColor: parseFloat(totalChange) >= 0 ? '#10b981' : '#ef4444',
                    backgroundColor: parseFloat(totalChange) >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `₩${fmt(ctx.raw)}만`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#9ca3af' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: {
                            color: '#9ca3af',
                            callback: v => '₩' + fmt(v)
                        },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }, 100);
}

function hideAssetChartModal() {
    document.getElementById('assetChartModal').classList.add('hidden');
}

// Simulation tab HTML
function getSimulationHTML() {
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card p-4 rounded-xl">
                <h4 class="font-bold text-emerald-400 mb-3">🏃 탈출 시뮬레이션</h4>
                <div class="space-y-3">
                    <div>
                        <label class="text-sm">월 저축액 (만원)</label>
                        <input type="number" id="simSave" class="w-full bg-gray-700 rounded p-2" value="${Math.max(0, getCashflow())}">
                    </div>
                    <div>
                        <label class="text-sm">예상 투자수익률 (%/년)</label>
                        <input type="number" id="simReturn" class="w-full bg-gray-700 rounded p-2" value="8">
                    </div>
                    <button onclick="runEscapeSim()" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold">
                        시뮬레이션 실행
                    </button>
                </div>
                <div id="escapeResult" class="mt-4 text-sm"></div>
            </div>

            <div class="card p-4 rounded-xl">
                <h4 class="font-bold text-blue-400 mb-3">📈 30년 자산 시뮬레이션</h4>
                <div class="space-y-3">
                    <div>
                        <label class="text-sm">시나리오</label>
                        <select id="simScenario" class="w-full bg-gray-700 rounded p-2">
                            <option value="bear">하락장 (-50%)</option>
                            <option value="flat">횡보장 (0%)</option>
                            <option value="normal" selected>보통 (+8%/년)</option>
                            <option value="bull">상승장 (+100%)</option>
                        </select>
                    </div>
                    <button onclick="runLongSim()" class="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">
                        시뮬레이션 실행
                    </button>
                </div>
                <canvas id="simChart" class="mt-4"></canvas>
            </div>
        </div>
    `;
}

// Run escape simulation
function runEscapeSim() {
    const save = +document.getElementById('simSave').value;
    const ret = +document.getElementById('simReturn').value / 100 / 12;
    const target = getTotalExpenses();
    let assets = getTotalAssets();
    let passive = getPassiveIncome();
    let months = 0;

    while (passive < target && months < 600) {
        assets += save;
        assets *= (1 + ret);
        passive = assets * ret;
        months++;
    }

    document.getElementById('escapeResult').innerHTML = months < 600
        ? `<div class="p-3 bg-emerald-900/50 rounded-lg">
             🎉 <b>${Math.floor(months / 12)}년 ${months % 12}개월</b> 후 탈출 가능!<br>
             예상 자산: ₩${fmt(Math.floor(assets))}만원
           </div>`
        : `<div class="p-3 bg-red-900/50 rounded-lg">
             ⚠️ 50년 내 탈출이 어렵습니다. 저축률을 높이세요.
           </div>`;
}

// Run 30-year simulation
function runLongSim() {
    const scenario = document.getElementById('simScenario').value;
    const returns = { bear: -0.5, flat: 0, normal: 0.08, bull: 1 };
    const annualReturn = returns[scenario];
    let assets = getTotalAssets();
    const data = [assets];

    for (let y = 1; y <= 30; y++) {
        assets *= (1 + annualReturn);
        assets += getCashflow() * 12;
        data.push(Math.max(0, assets));
    }

    const ctx = document.getElementById('simChart');
    if (simChartInstance) simChartInstance.destroy();

    simChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 31 }, (_, i) => i + '년'),
            datasets: [{
                label: '총 자산 (만원)',
                data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                x: { ticks: { color: '#9ca3af' } },
                y: {
                    ticks: {
                        color: '#9ca3af',
                        callback: v => '₩' + fmt(v)
                    }
                }
            }
        }
    });
}

// Portfolio tab HTML
function getPortfolioHTML() {
    const inv = gameState.investments;
    const assets = gameState.assets;
    const total = getTotalAssets();

    // Calculate breakdown
    const breakdown = [
        { name: '현금', value: assets.cash, color: '#10b981' },
        { name: '부동산', value: assets.realEstate, color: '#3b82f6' },
        { name: '주식/ETF', value: assets.stocks, color: '#8b5cf6' },
        { name: '가상자산', value: assets.crypto, color: '#f59e0b' }
    ].filter(x => x.value > 0);

    let html = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="card p-4 rounded-xl">
                <h4 class="font-bold text-yellow-400 mb-3">📊 자산 비율</h4>
                <canvas id="portfolioChart" height="200"></canvas>
                <div class="mt-3 space-y-1 text-sm">
                    ${breakdown.map(b => `
                        <div class="flex justify-between">
                            <span style="color: ${b.color}">● ${b.name}</span>
                            <span>₩${fmt(b.value)}만 (${total > 0 ? Math.round(b.value / total * 100) : 0}%)</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card p-4 rounded-xl">
                <h4 class="font-bold text-purple-400 mb-3">💼 보유 투자 (${inv.length}건)</h4>
                <div class="space-y-2 max-h-80 overflow-y-auto">
                    ${inv.length === 0
                        ? '<p class="text-gray-400 text-center py-4">보유중인 투자가 없습니다.</p>'
                        : inv.map((i, idx) => {
                            let currentValue, pnl, pnlPct;

                            if (i.amount && i.baseName && marketPrices[i.baseName]) {
                                currentValue = Math.round(i.amount * marketPrices[i.baseName] * 100) / 100;
                            } else if (i.amount && marketPrices[i.name]) {
                                currentValue = Math.round(i.amount * marketPrices[i.name] * 100) / 100;
                            } else if (i.shares && marketPrices[i.name]) {
                                currentValue = Math.round(i.shares * marketPrices[i.name] * 100) / 100;
                            } else {
                                currentValue = i.cost;
                            }

                            pnl = currentValue - i.cost;
                            pnlPct = i.cost > 0 ? Math.round(pnl / i.cost * 100) : 0;

                            const displayAmount = i.shares
                                ? `${i.shares}주`
                                : (i.amount ? `${i.amount.toFixed(3)}개` : '');

                            const stakingInfo = i.isStaking
                                ? `<div class="text-xs text-purple-400">월 보상: +${i.monthlyReward.toFixed(4)} ${i.baseName}</div>`
                                : '';

                            const incomeInfo = i.monthlyIncome > 0
                                ? `<span class="text-xs text-emerald-400">월 ₩${fmt(i.monthlyIncome)}만</span>`
                                : '';

                            return `
                                <div class="flex justify-between items-center p-2 bg-gray-700/50 rounded-lg text-sm">
                                    <div class="flex-1 cursor-pointer hover:text-yellow-400" onclick="showAssetChart('${i.baseName || i.name}')">
                                        <span class="font-bold">${i.name}</span>
                                        ${displayAmount ? `<span class="text-gray-400 ml-1">${displayAmount}</span>` : ''}
                                        <div class="text-xs text-gray-400">
                                            매수: ₩${fmt(i.cost)}만 → 현재: ₩${fmt(currentValue)}만
                                            <span class="${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                                                (${pnl >= 0 ? '+' : ''}${pnlPct}%)
                                            </span>
                                        </div>
                                        ${stakingInfo}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        ${incomeInfo}
                                        <button onclick="showAssetChart('${i.baseName || i.name}')"
                                            class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">📈</button>
                                        <button onclick="sellInvestment(${idx})"
                                            class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs">매도</button>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        </div>
    `;

    // Render chart after HTML is inserted
    setTimeout(() => {
        const ctx = document.getElementById('portfolioChart');
        if (ctx && breakdown.length > 0) {
            if (portfolioChartInstance) portfolioChartInstance.destroy();

            portfolioChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: breakdown.map(b => b.name),
                    datasets: [{
                        data: breakdown.map(b => b.value),
                        backgroundColor: breakdown.map(b => b.color),
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `₩${fmt(ctx.raw)}만 (${Math.round(ctx.raw / total * 100)}%)`
                            }
                        }
                    }
                }
            });
        }
    }, 100);

    return html;
}
