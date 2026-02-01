// ==========================================
// UI 관련 기능
// ==========================================

// Update UI
function updateUI() {
    const player = getPlayer();

    // 최고 현금 보유액 추적 (대형 부동산 기회 해금용)
    if (typeof maxCashEverHeld !== 'undefined' && gameState.assets.cash > maxCashEverHeld) {
        maxCashEverHeld = gameState.assets.cash;
    }

    // Dashboard
    const dashCash = document.getElementById('dashCash');
    const oldCashText = dashCash.textContent;
    const newCashText = `₩${fmt(gameState.assets.cash)}만`;

    // Parse old cash value for comparison
    const oldCashValue = parseFloat(oldCashText.replace(/[^0-9.-]/g, '')) || 0;
    const newCashValue = gameState.assets.cash;

    dashCash.textContent = newCashText;

    // Number pop animation when cash changes (green for increase, red for decrease)
    // Skip animation if suppressCashAnimation flag is set (player tab switching)
    if (oldCashText !== newCashText && !suppressCashAnimation && typeof animateNumberPop === 'function') {
        const isPositive = newCashValue >= oldCashValue;
        animateNumberPop(dashCash, isPositive);

        // Show floating money indicator for significant changes
        if (Math.abs(newCashValue - oldCashValue) >= 1 && typeof showMoneyBounce === 'function') {
            showMoneyBounce(dashCash, Math.abs(newCashValue - oldCashValue), isPositive);
        }
    }

    document.getElementById('dashAssets').textContent = `₩${fmt(getTotalAssets())}만`;
    document.getElementById('dashDebt').textContent = `₩${fmt(getTotalLiabilities())}만`;
    document.getElementById('dashNetWorth').textContent = `₩${fmt(getTotalAssets() - getTotalLiabilities())}만`;
    document.getElementById('dashCashflow').textContent = `₩${fmt(getCashflow())}만`;
    document.getElementById('dashInterestRate').textContent = `${interestRate.toFixed(1)}%`;

    // Economic cycle display (코스톨라니 달걀 모형)
    const cycleElement = document.getElementById('dashEconomicCycle');
    if (cycleElement && typeof CYCLE_PHASE_NAMES !== 'undefined') {
        cycleElement.textContent = CYCLE_PHASE_NAMES[economicCycle.phase] || '🌱 회복기';
    }

    // Income statement
    const totalIncome = Object.values(gameState.income).reduce((a, b) => a + b, 0);
    const passiveIncome = getPassiveIncome();
    const totalExpense = getTotalExpenses();
    const cashflow = getCashflow();

    document.getElementById('incSalary').textContent = `₩${fmt(gameState.income.salary)}만`;
    document.getElementById('incPassive').textContent = `₩${fmt(passiveIncome)}만`;
    document.getElementById('expTotal').textContent = `₩${fmt(totalExpense)}만`;
    document.getElementById('cashflow').textContent = `₩${fmt(cashflow)}만`;
    document.getElementById('cashflow').className = cashflow >= 0 ? 'text-emerald-400' : 'text-red-400';

    // Balance sheet
    document.getElementById('totalAssets').textContent = `₩${fmt(getTotalAssets())}만`;
    document.getElementById('totalLiabilities').textContent = `₩${fmt(getTotalLiabilities())}만`;
    const netWorth = getTotalAssets() - getTotalLiabilities();
    document.getElementById('netWorth').textContent = `₩${fmt(netWorth)}만`;
    document.getElementById('netWorth').className = netWorth >= 0 ? 'text-emerald-400' : 'text-red-400';

    // Escape/Victory progress
    const progressTitle = document.getElementById('progressTitle');
    const progressDesc = document.getElementById('progressDesc');
    const progressBar = document.getElementById('escapeProgress');

    if (gameState.inFastTrack) {
        // 패스트트랙: 승리조건 진행도 표시
        const victoryProgress = Math.min(100, (passiveIncome / FAST_TRACK_WIN_PASSIVE) * 100);
        progressBar.style.width = `${victoryProgress}%`;
        progressBar.className = 'h-full bg-gradient-to-r from-purple-500 to-yellow-400 transition-all';
        progressTitle.textContent = '🏆 승리조건 진행도';
        progressDesc.textContent = `월 패시브 소득 ₩${fmt(passiveIncome)}만 / ₩${fmt(FAST_TRACK_WIN_PASSIVE)}만`;
    } else {
        // 쥐 레이스: 탈출 진행도 표시
        const escapeProgress = passiveIncome > 0 && totalExpense > 0 ? Math.min(100, (passiveIncome / totalExpense) * 100) : 0;
        progressBar.style.width = `${escapeProgress}%`;
        progressBar.className = 'h-full bg-gradient-to-r from-emerald-500 to-yellow-400 transition-all';
        progressTitle.textContent = '🏃 탈출 진행도';
        progressDesc.textContent = '패시브 소득 ≥ 총 지출 시 탈출!';
    }

    // Current player info
    document.getElementById('currentPlayerEmoji').textContent = playerEmojis[currentPlayer];
    document.getElementById('currentPlayerName').textContent = `플레이어 ${currentPlayer + 1}`;
    document.getElementById('currentPlayerJob').textContent = player.job || '직업 미선택';

    // Dream display
    const dreamDisplay = document.getElementById('myDreamDisplay');
    if (dreamDisplay && player.dream) {
        const dreamData = dreams.find(d => d.id === player.dream);
        dreamDisplay.textContent = dreamData ? `🎯 목표: ${dreamData.name}` : '';
    }

    // Summary lists
    updateSummaryLists();

    // Update active tab content
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (activeTabBtn) {
        const tabName = activeTabBtn.getAttribute('data-tab');
        showTab(tabName);
    }

    checkEscape();
}

// Update summary lists
function updateSummaryLists() {
    // Assets summary
    const assetList = document.getElementById('assetSummaryList');
    if (assetList) {
        const assets = [];
        if (gameState.assets.cash > 0) assets.push({ name: '현금', value: gameState.assets.cash, icon: '💵' });
        if (gameState.assets.realEstate > 0) assets.push({ name: '부동산', value: gameState.assets.realEstate, icon: '🏠' });
        if (gameState.assets.stocks > 0) assets.push({ name: '주식/ETF', value: gameState.assets.stocks, icon: '📈' });
        if (gameState.assets.crypto > 0) assets.push({ name: '가상자산', value: gameState.assets.crypto, icon: '💎' });

        assetList.innerHTML = assets.length > 0
            ? assets.map(a => `<div class="flex justify-between text-sm"><span>${a.icon} ${a.name}</span><span>₩${fmt(a.value)}만</span></div>`).join('')
            : '<div class="text-gray-500 text-sm text-center">자산 없음</div>';
    }

    // Liabilities summary
    const liabList = document.getElementById('liabilitySummaryList');
    if (liabList) {
        const liabs = [];
        if (gameState.liabilities.mortgage > 0) liabs.push({ name: '주택담보대출', value: gameState.liabilities.mortgage, icon: '🏦' });

        // 투자부동산 담보대출 계산 (investments에서)
        const investmentLoan = gameState.investments
            .filter(inv => inv.type === 'realEstate' && inv.loan > 0)
            .reduce((sum, inv) => sum + inv.loan, 0);
        if (investmentLoan > 0) liabs.push({ name: '투자부동산 담보대출', value: investmentLoan, icon: '🏠' });

        if (gameState.liabilities.credit > 0) liabs.push({ name: '신용대출', value: gameState.liabilities.credit, icon: '💳' });
        if (gameState.liabilities.student > 0) liabs.push({ name: '학자금', value: gameState.liabilities.student, icon: '🎓' });
        if (gameState.liabilities.other > 0) liabs.push({ name: '기타부채', value: gameState.liabilities.other, icon: '📋' });

        liabList.innerHTML = liabs.length > 0
            ? liabs.map(l => `<div class="flex justify-between text-sm"><span>${l.icon} ${l.name}</span><span class="text-red-400">₩${fmt(l.value)}만</span></div>`).join('')
            : '<div class="text-gray-500 text-sm text-center">부채 없음</div>';
    }
}

// Update current player display
function updateCurrentPlayerDisplay() {
    updatePlayerTabs();
}

// Update player tabs
function updatePlayerTabs() {
    const container = document.getElementById('playerTabs');
    if (!container) return;

    if (numPlayers > 1) {
        container.classList.remove('hidden');
        container.innerHTML = '';
        for (let i = 0; i < numPlayers; i++) {
            const tab = document.createElement('button');
            tab.className = `px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                i === currentPlayer
                    ? playerColorClasses[i] + ' ring-2 ring-white'
                    : 'bg-gray-700 hover:bg-gray-600'
            }`;
            tab.innerHTML = `${playerEmojis[i]} P${i + 1}`;
            tab.onclick = () => switchToPlayer(i);
            container.appendChild(tab);
        }
    } else {
        container.classList.add('hidden');
    }
}

// Switch to player (for viewing)
function switchToPlayer(playerIndex) {
    suppressCashAnimation = true;  // 플레이어 전환 시 애니메이션 억제
    currentPlayer = playerIndex;
    updateCurrentPlayerDisplay();
    updateUI();
    drawBoard();
    suppressCashAnimation = false;  // 플래그 리셋
}

// Update setup player tabs
function updateSetupPlayerTabs() {
    const container = document.getElementById('setupPlayerTabs');
    if (!container) { console.error('setupPlayerTabs container not found'); return; }
    if (typeof numPlayers === 'undefined') { console.error('numPlayers not defined'); return; }
    if (typeof playerEmojis === 'undefined') { console.error('playerEmojis not defined'); return; }
    if (typeof playerColorClasses === 'undefined') { console.error('playerColorClasses not defined'); return; }

    container.innerHTML = '';
    for (let i = 0; i < numPlayers; i++) {
        const tab = document.createElement('button');
        tab.className = `px-4 py-2 rounded-lg font-bold transition-all ${
            i === setupPlayer
                ? playerColorClasses[i]
                : 'bg-gray-700 hover:bg-gray-600'
        }`;
        tab.innerHTML = `${playerEmojis[i]} 플레이어 ${i + 1}`;
        tab.onclick = () => {
            saveSetupPlayer();
            setupPlayer = i;
            updateSetupPlayerTabs();
            loadSetupPlayerData();
        };
        container.appendChild(tab);
    }

    // Update preset player label
    const presetLabel = document.getElementById('presetPlayerLabel');
    if (presetLabel) {
        presetLabel.textContent = `(플레이어 ${setupPlayer + 1})`;
    }
}

// Load setup player data into form
function loadSetupPlayerData() {
    const player = players[setupPlayer];

    // Update preset buttons
    updatePresetButtons();

    // Update dream selection (do this first even if player is undefined)
    updateDreamSelection();

    if (!player) return;

    // Update selected job display
    const jobDisplay = document.getElementById('selectedJobDisplay');
    if (jobDisplay) {
        jobDisplay.textContent = player.job || '없음';
    }

    // Update childcare cost display
    const childcareDisplay = document.getElementById('childcareCostDisplay');
    if (childcareDisplay) {
        const cost = player.childcareCost || 30;
        childcareDisplay.textContent = `₩${cost}만`;
    }

    // Income
    document.getElementById('inpSalary').value = player.income.salary;
    document.getElementById('inpRental').value = player.income.rental;
    document.getElementById('inpDividend').value = player.income.dividend;
    document.getElementById('inpOtherInc').value = player.income.other;

    // Expenses
    document.getElementById('expHousing').value = player.expenses.housing;
    document.getElementById('expLiving').value = player.expenses.living;
    document.getElementById('expLoan').value = player.expenses.loan;
    document.getElementById('expTax').value = player.expenses.tax;

    // Assets
    document.getElementById('astCash').value = player.assets.cash;
    document.getElementById('astRealEstate').value = player.assets.realEstate;
    document.getElementById('astStocks').value = player.assets.stocks;
    document.getElementById('astCrypto').value = player.assets.crypto;

    // Liabilities
    document.getElementById('debtMortgage').value = player.liabilities.mortgage;
    document.getElementById('debtCredit').value = player.liabilities.credit;
    document.getElementById('debtStudent').value = player.liabilities.student;
    document.getElementById('debtOther').value = player.liabilities.other;
}

// Player ring color classes for selection
const playerRingClasses = ['ring-yellow-400', 'ring-blue-400', 'ring-red-400', 'ring-green-400'];
const playerTextClasses = ['text-yellow-200', 'text-blue-200', 'text-red-200', 'text-green-200'];

// Update preset buttons
function updatePresetButtons() {
    const container = document.getElementById('presetBtns');
    if (!container) { console.error('presetBtns container not found'); return; }
    if (typeof presets === 'undefined') { console.error('presets not defined'); return; }

    const player = players && players[setupPlayer];
    const currentJobPreset = player ? player.jobPreset : null;
    const playerBgClass = playerColorClasses[setupPlayer] || 'bg-yellow-600';
    const playerRingClass = playerRingClasses[setupPlayer] || 'ring-yellow-400';
    const playerTextClass = playerTextClasses[setupPlayer] || 'text-yellow-200';

    container.innerHTML = Object.entries(presets).map(([key, preset]) => {
        const totalIncome = Object.values(preset.income).reduce((a, b) => a + b, 0);
        const totalExpense = Object.values(preset.expenses).reduce((a, b) => a + b, 0);
        const cashflow = totalIncome - totalExpense;
        return `
        <button onclick="applyPreset('${key}')" class="preset-btn p-2 rounded-lg text-left transition ${currentJobPreset === key ? playerBgClass + ' ring-2 ' + playerRingClass : 'bg-gray-700 hover:bg-gray-600'}">
            <div class="font-bold text-sm">${preset.job}</div>
            <div class="flex justify-between items-center">
                <span class="text-xs ${currentJobPreset === key ? playerTextClass : 'text-gray-400'}">${key}</span>
                <span class="text-xs font-bold ${cashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}">CF ₩${fmt(cashflow)}만</span>
            </div>
        </button>`;
    }).join('') + `
        <button onclick="applyRandomPreset()" class="preset-btn p-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-center transition">
            <div class="font-bold text-sm">🎲 랜덤</div>
            <div class="text-xs text-gray-300">랜덤 선택</div>
        </button>
    `;
}

// Apply random preset
function applyRandomPreset() {
    const randomKey = getRandomPreset();
    applyPreset(randomKey);
    showNotification(`🎲 ${presets[randomKey].job}이(가) 선택되었습니다!`, 'success');
}

// Update dream selection UI
function updateDreamSelection() {
    const container = document.getElementById('dreamSelection');
    if (!container) { console.error('dreamSelection container not found'); return; }
    if (typeof dreams === 'undefined' || !Array.isArray(dreams)) { console.error('dreams not defined'); return; }

    const player = players && players[setupPlayer];
    const currentDream = player ? player.dream : null;
    const playerBgClass = playerColorClasses[setupPlayer] || 'bg-yellow-600';
    const playerRingClass = playerRingClasses[setupPlayer] || 'ring-yellow-400';

    container.innerHTML = dreams.map(dream => `
        <button onclick="selectDream('${dream.id}')"
            class="p-3 rounded-lg text-left transition-all ${
                currentDream === dream.id
                    ? playerBgClass + ' ring-2 ' + playerRingClass
                    : 'bg-gray-700 hover:bg-gray-600'
            }">
            <div class="font-bold">${dream.name}</div>
            <div class="text-xs text-gray-300">${dream.desc}</div>
            ${dream.cost > 0 ? `<div class="text-xs text-yellow-400 mt-1">₩${fmt(dream.cost)}만</div>` : ''}
        </button>
    `).join('');
}

// Select dream
function selectDream(dreamId) {
    players[setupPlayer].dream = dreamId;
    updateDreamSelection();
    // Auto-apply to current player
    if (setupPlayer === currentPlayer) {
        applySettingsToCurrentPlayer();
    }
    showNotification(`🌟 꿈이 설정되었습니다!`, 'success');
}

// Apply preset
function applyPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;

    const player = players[setupPlayer];
    player.job = preset.job;
    player.jobPreset = presetName;
    Object.assign(player.income, preset.income);
    Object.assign(player.expenses, preset.expenses);
    Object.assign(player.assets, preset.assets);
    Object.assign(player.liabilities, preset.liabilities);
    player.investments = []; // Start with no investments
    player.childcareCost = preset.childcareCost || 30;  // 직업별 양육비 설정

    // Reload UI which will update preset button highlights
    loadSetupPlayerData();

    // Auto-apply to current player
    if (setupPlayer === currentPlayer) {
        applySettingsToCurrentPlayer();
    }
    showNotification(`🎭 ${preset.job} 직업이 적용되었습니다!`, 'success');
}

// Save setup player data
function saveSetupPlayer() {
    const player = players[setupPlayer];

    // Income
    player.income.salary = +document.getElementById('inpSalary').value || 0;
    player.income.rental = +document.getElementById('inpRental').value || 0;
    player.income.dividend = +document.getElementById('inpDividend').value || 0;
    player.income.other = +document.getElementById('inpOtherInc').value || 0;

    // Expenses
    player.expenses.housing = +document.getElementById('expHousing').value || 0;
    player.expenses.living = +document.getElementById('expLiving').value || 0;
    player.expenses.loan = +document.getElementById('expLoan').value || 0;
    player.expenses.tax = +document.getElementById('expTax').value || 0;

    // Assets
    player.assets.cash = +document.getElementById('astCash').value || 0;
    player.assets.realEstate = +document.getElementById('astRealEstate').value || 0;
    player.assets.stocks = +document.getElementById('astStocks').value || 0;
    player.assets.crypto = +document.getElementById('astCrypto').value || 0;

    // Liabilities
    player.liabilities.mortgage = +document.getElementById('debtMortgage').value || 0;
    player.liabilities.credit = +document.getElementById('debtCredit').value || 0;
    player.liabilities.student = +document.getElementById('debtStudent').value || 0;
    player.liabilities.other = +document.getElementById('debtOther').value || 0;
}

// Apply settings to current setup player
function applySettingsToPlayer() {
    saveSetupPlayer();
    showNotification(`플레이어 ${setupPlayer + 1} 설정 적용됨`, 'success');
}

// Auto-apply current setup player's settings to game state and UI
function applySettingsToCurrentPlayer() {
    updateUI();
    updateCurrentPlayerDisplay();
    drawBoard();
}

// Apply settings and close modal
function applySettingsAndClose() {
    saveSetupPlayer();

    // Validate all players have jobs and dreams
    for (let i = 0; i < numPlayers; i++) {
        if (!players[i].job) {
            alert(`플레이어 ${i + 1}의 직업을 선택해주세요.`);
            setupPlayer = i;
            updateSetupPlayerTabs();
            loadSetupPlayerData();
            return;
        }
        if (!players[i].dream) {
            alert(`플레이어 ${i + 1}의 꿈을 선택해주세요.`);
            setupPlayer = i;
            updateSetupPlayerTabs();
            loadSetupPlayerData();
            return;
        }
    }

    hideSetupModal();
    currentPlayer = 0;
    turn = 1;
    document.getElementById('turnCount').textContent = turn;
    updateCurrentPlayerDisplay();
    updateUI();
    drawBoard();

    showNotification('게임 설정이 완료되었습니다!', 'success');
}

// Show setup modal
function showSetupModal() {
    document.getElementById('setupModal').classList.remove('hidden');
    try {
        updateSetupPlayerTabs();
    } catch (e) { console.error('updateSetupPlayerTabs error:', e); }
    try {
        loadSetupPlayerData();
    } catch (e) { console.error('loadSetupPlayerData error:', e); }
}

// Hide setup modal
function hideSetupModal() {
    document.getElementById('setupModal').classList.add('hidden');
}

// Show detail modal for assets/liabilities/expenses
function showDetailModal(type) {
    const modal = document.getElementById('detailModal');
    const title = document.getElementById('detailModalTitle');
    const content = document.getElementById('detailModalContent');

    let html = '';

    if (type === 'cash') {
        title.textContent = '💵 현금 상세';
        html = `
            <div class="space-y-3">
                <div class="p-4 bg-gray-800 rounded-lg">
                    <div class="text-2xl font-bold text-emerald-400">₩${fmt(gameState.assets.cash)}만</div>
                    <div class="text-sm text-gray-400 mt-1">보유 현금</div>
                </div>
                <div class="text-sm text-gray-400">
                    <p>현금은 투자, 지출, 부채 상환 등에 사용됩니다.</p>
                    <p class="mt-2">월급날에 캐시플로우가 추가됩니다.</p>
                </div>
            </div>
        `;
    } else if (type === 'assets') {
        title.textContent = '📊 자산 상세';
        html = `
            <div class="space-y-3">
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>💵 현금</span>
                    <span class="text-emerald-400">₩${fmt(gameState.assets.cash)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>🏠 부동산</span>
                    <span class="text-blue-400">₩${fmt(gameState.assets.realEstate)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>📈 주식/ETF</span>
                    <span class="text-purple-400">₩${fmt(gameState.assets.stocks)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>💎 가상자산</span>
                    <span class="text-orange-400">₩${fmt(gameState.assets.crypto)}만</span>
                </div>
                <div class="border-t border-gray-600 pt-3">
                    <div class="flex justify-between font-bold text-lg">
                        <span>총 자산</span>
                        <span class="text-emerald-400">₩${fmt(getTotalAssets())}만</span>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'liabilities') {
        title.textContent = '📉 부채 상세 및 상환';
        const mortgageRate = getMortgageRate();
        const creditRate = getCreditRate();
        const studentRate = interestRate + 1.5;  // 학자금 금리
        const otherRate = interestRate + 3.0;    // 기타대출 금리

        // 투자부동산 담보대출 계산
        const investmentLoan = typeof getInvestmentLoan === 'function' ? getInvestmentLoan() : 0;
        const investmentLoanPayment = Math.round(investmentLoan * mortgageRate / 100 / 12);

        // 개별 투자부동산 대출 목록
        const realEstateLoans = gameState.investments.filter(inv => inv.type === 'realEstate' && inv.loan > 0);

        html = `
            <div class="space-y-3">
                <div class="p-3 bg-cyan-900/30 rounded-lg mb-3">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="text-sm text-gray-400">기준금리</div>
                            <div class="text-xl font-bold text-cyan-400">${interestRate.toFixed(1)}%</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm text-gray-400">보유 현금</div>
                            <div class="text-xl font-bold text-emerald-400">₩${fmt(gameState.assets.cash)}만</div>
                        </div>
                    </div>
                </div>

                <div class="p-3 bg-gray-800 rounded-lg">
                    <div class="flex justify-between items-center mb-1">
                        <span>🏦 주택담보대출 (거주용)</span>
                        <span class="${gameState.liabilities.mortgage > 0 ? 'text-red-400' : 'text-gray-500'} font-bold">₩${fmt(gameState.liabilities.mortgage)}만</span>
                    </div>
                    <div class="text-xs text-cyan-400 mb-2">연 ${mortgageRate.toFixed(1)}% (월 이자: ₩${fmt(Math.round(gameState.liabilities.mortgage * mortgageRate / 100 / 12))}만)</div>
                    ${gameState.liabilities.mortgage > 0 ? `
                    <div class="flex gap-2">
                        <input type="number" id="repayMortgage" class="flex-1 bg-gray-700 rounded p-2 text-sm" placeholder="상환 금액" min="0" max="${gameState.liabilities.mortgage}" step="0.01" value="${gameState.liabilities.mortgage <= 10 ? gameState.liabilities.mortgage : ''}">
                        <button onclick="repayDebt('mortgage')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">상환</button>
                        ${gameState.liabilities.mortgage <= gameState.assets.cash ? `<button onclick="repayFullDebt('mortgage')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm">전액</button>` : ''}
                    </div>` : '<div class="text-xs text-gray-500">부채 없음</div>'}
                </div>

                ${realEstateLoans.length > 0 ? `
                <div class="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-blue-400">🏠 투자부동산 담보대출</span>
                        <span class="text-red-400 font-bold">₩${fmt(investmentLoan)}만</span>
                    </div>
                    <div class="text-xs text-cyan-400 mb-2">총 월 이자: ₩${fmt(investmentLoanPayment)}만</div>
                    <div class="space-y-2 text-sm max-h-40 overflow-y-auto">
                        ${realEstateLoans.map((inv, idx) => `
                        <div class="p-2 bg-gray-800 rounded">
                            <div class="flex justify-between">
                                <span class="text-gray-300">${inv.name}</span>
                                <span class="text-orange-400">₩${fmt(inv.loan)}만</span>
                            </div>
                            <div class="text-xs text-gray-500">월 이자: ₩${fmt(inv.monthlyLoanPayment || Math.round(inv.loan * 0.04 / 12))}만 | 월 수익: ₩${fmt(inv.monthlyIncome || 0)}만</div>
                        </div>
                        `).join('')}
                    </div>
                    <div class="p-2 mt-2 bg-yellow-900/30 border border-yellow-600/30 rounded text-xs">
                        <span class="text-yellow-400">⚠️ 직접 상환 불가</span>
                        <span class="text-gray-400"> - 부동산 매도 시에만 자동 상환됩니다</span>
                    </div>
                </div>` : ''}

                <div class="p-3 bg-gray-800 rounded-lg">
                    <div class="flex justify-between items-center mb-1">
                        <span>💳 신용대출</span>
                        <span class="${gameState.liabilities.credit > 0 ? 'text-red-400' : 'text-gray-500'} font-bold">₩${fmt(gameState.liabilities.credit)}만</span>
                    </div>
                    <div class="text-xs text-orange-400 mb-2">연 ${creditRate.toFixed(1)}% (월 이자: ₩${fmt(Math.round(gameState.liabilities.credit * creditRate / 100 / 12))}만)</div>
                    ${gameState.liabilities.credit > 0 ? `
                    <div class="flex gap-2">
                        <input type="number" id="repayCredit" class="flex-1 bg-gray-700 rounded p-2 text-sm" placeholder="상환 금액" min="0" max="${gameState.liabilities.credit}" step="0.01" value="${gameState.liabilities.credit <= 10 ? gameState.liabilities.credit : ''}">
                        <button onclick="repayDebt('credit')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">상환</button>
                        ${gameState.liabilities.credit <= gameState.assets.cash ? `<button onclick="repayFullDebt('credit')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm">전액</button>` : ''}
                    </div>` : '<div class="text-xs text-gray-500">부채 없음</div>'}
                </div>

                <div class="p-3 bg-gray-800 rounded-lg">
                    <div class="flex justify-between items-center mb-1">
                        <span>🎓 학자금대출</span>
                        <span class="${gameState.liabilities.student > 0 ? 'text-red-400' : 'text-gray-500'} font-bold">₩${fmt(gameState.liabilities.student)}만</span>
                    </div>
                    <div class="text-xs text-purple-400 mb-2">연 ${studentRate.toFixed(1)}% (월 이자: ₩${fmt(Math.round(gameState.liabilities.student * studentRate / 100 / 12))}만)</div>
                    ${gameState.liabilities.student > 0 ? `
                    <div class="flex gap-2">
                        <input type="number" id="repayStudent" class="flex-1 bg-gray-700 rounded p-2 text-sm" placeholder="상환 금액" min="0" max="${gameState.liabilities.student}" step="0.01" value="${gameState.liabilities.student <= 10 ? gameState.liabilities.student : ''}">
                        <button onclick="repayDebt('student')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">상환</button>
                        ${gameState.liabilities.student <= gameState.assets.cash ? `<button onclick="repayFullDebt('student')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm">전액</button>` : ''}
                    </div>` : '<div class="text-xs text-gray-500">부채 없음</div>'}
                </div>

                <div class="p-3 bg-gray-800 rounded-lg">
                    <div class="flex justify-between items-center mb-1">
                        <span>📋 기타대출</span>
                        <span class="${gameState.liabilities.other > 0 ? 'text-red-400' : 'text-gray-500'} font-bold">₩${fmt(gameState.liabilities.other)}만</span>
                    </div>
                    <div class="text-xs text-yellow-400 mb-2">연 ${otherRate.toFixed(1)}% (월 이자: ₩${fmt(Math.round(gameState.liabilities.other * otherRate / 100 / 12))}만)</div>
                    ${gameState.liabilities.other > 0 ? `
                    <div class="flex gap-2">
                        <input type="number" id="repayOther" class="flex-1 bg-gray-700 rounded p-2 text-sm" placeholder="상환 금액" min="0" max="${gameState.liabilities.other}" step="0.01" value="${gameState.liabilities.other <= 10 ? gameState.liabilities.other : ''}">
                        <button onclick="repayDebt('other')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">상환</button>
                        ${gameState.liabilities.other <= gameState.assets.cash ? `<button onclick="repayFullDebt('other')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm">전액</button>` : ''}
                    </div>` : '<div class="text-xs text-gray-500">부채 없음</div>'}
                </div>

                ${getTotalLiabilities() === 0 ? `
                <div class="p-4 bg-emerald-900/30 rounded-lg text-center">
                    <div class="text-emerald-400 font-bold">🎉 모든 부채 상환 완료!</div>
                    <div class="text-sm text-gray-400">축하합니다!</div>
                </div>` : ''}

                <div class="border-t border-gray-600 pt-3">
                    <div class="flex justify-between font-bold text-lg">
                        <span>총 부채</span>
                        <span class="${getTotalLiabilities() > 0 ? 'text-red-400' : 'text-emerald-400'}">₩${fmt(getTotalLiabilities())}만</span>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'expenses') {
        title.textContent = '💸 지출 상세';
        const player = getPlayer();
        const childcareCostPerChild = player.childcareCost || 30;
        const childExpense = gameState.children * childcareCostPerChild;
        html = `
            <div class="space-y-3">
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>🏠 주거비</span>
                    <span class="text-red-400">₩${fmt(gameState.expenses.housing)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>🍽️ 생활비</span>
                    <span class="text-red-400">₩${fmt(gameState.expenses.living)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>💰 대출이자</span>
                    <span class="text-red-400">₩${fmt(gameState.expenses.loan)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>📋 세금/보험</span>
                    <span class="text-red-400">₩${fmt(gameState.expenses.tax)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>👶 양육비 (${gameState.children}명 × ₩${childcareCostPerChild}만)</span>
                    <span class="text-red-400">₩${fmt(childExpense)}만</span>
                </div>
                <div class="border-t border-gray-600 pt-3">
                    <div class="flex justify-between font-bold text-lg">
                        <span>총 지출</span>
                        <span class="text-red-400">₩${fmt(getTotalExpenses())}만</span>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'cashflow') {
        title.textContent = '💰 월 캐시플로우 상세';
        const player = getPlayer();
        const childcareCostPerChild = player.childcareCost || 30;
        const childExpense = gameState.children * childcareCostPerChild;
        const totalIncome = Object.values(gameState.income).reduce((a, b) => a + b, 0);
        const passiveIncome = getPassiveIncome();
        const totalExpense = getTotalExpenses();
        const cashflow = getCashflow();

        html = `
            <div class="space-y-4">
                <!-- 소득 -->
                <div class="p-3 bg-emerald-900/20 rounded-lg border border-emerald-600/30">
                    <h4 class="font-bold text-emerald-400 mb-2">📈 소득</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>💼 근로소득 (월급)</span>
                            <span class="text-emerald-400">+₩${fmt(gameState.income.salary)}만</span>
                        </div>
                        <div class="flex justify-between">
                            <span>🏠 임대소득</span>
                            <span class="text-emerald-400">+₩${fmt(gameState.income.rental)}만</span>
                        </div>
                        <div class="flex justify-between">
                            <span>💵 배당소득</span>
                            <span class="text-emerald-400">+₩${fmt(gameState.income.dividend)}만</span>
                        </div>
                        <div class="flex justify-between">
                            <span>📊 기타소득</span>
                            <span class="text-emerald-400">+₩${fmt(gameState.income.other)}만</span>
                        </div>
                        <div class="border-t border-emerald-600/30 pt-2 mt-2">
                            <div class="flex justify-between font-bold">
                                <span>총 소득</span>
                                <span class="text-emerald-400">+₩${fmt(totalIncome)}만</span>
                            </div>
                            <div class="flex justify-between text-xs text-gray-400 mt-1">
                                <span>패시브 소득</span>
                                <span>₩${fmt(passiveIncome)}만</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 지출 -->
                <div class="p-3 bg-red-900/20 rounded-lg border border-red-600/30">
                    <h4 class="font-bold text-red-400 mb-2">📉 지출</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>🏠 주거비</span>
                            <span class="text-red-400">-₩${fmt(gameState.expenses.housing)}만</span>
                        </div>
                        <div class="flex justify-between">
                            <span>🍽️ 생활비</span>
                            <span class="text-red-400">-₩${fmt(gameState.expenses.living)}만</span>
                        </div>
                        <div class="flex justify-between">
                            <span>💰 대출이자</span>
                            <span class="text-red-400">-₩${fmt(gameState.expenses.loan)}만</span>
                        </div>
                        <div class="flex justify-between">
                            <span>📋 세금/보험</span>
                            <span class="text-red-400">-₩${fmt(gameState.expenses.tax)}만</span>
                        </div>
                        <div class="flex justify-between">
                            <span>👶 양육비 (${gameState.children}명 × ₩${childcareCostPerChild}만)</span>
                            <span class="text-red-400">-₩${fmt(childExpense)}만</span>
                        </div>
                        <div class="border-t border-red-600/30 pt-2 mt-2">
                            <div class="flex justify-between font-bold">
                                <span>총 지출</span>
                                <span class="text-red-400">-₩${fmt(totalExpense)}만</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 캐시플로우 계산 -->
                <div class="p-4 bg-yellow-900/20 rounded-lg border border-yellow-600/30">
                    <div class="text-center">
                        <div class="text-sm text-gray-400 mb-2">총 소득 - 총 지출</div>
                        <div class="text-lg">
                            <span class="text-emerald-400">₩${fmt(totalIncome)}만</span>
                            <span class="text-gray-400 mx-2">−</span>
                            <span class="text-red-400">₩${fmt(totalExpense)}만</span>
                        </div>
                        <div class="border-t border-yellow-600/30 my-3"></div>
                        <div class="text-2xl font-bold ${cashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                            월 캐시플로우: ₩${fmt(cashflow)}만
                        </div>
                    </div>
                </div>

                <!-- 쥐 레이스 탈출 조건 -->
                <div class="p-3 bg-purple-900/20 rounded-lg border border-purple-600/30 text-sm">
                    <div class="flex justify-between items-center">
                        <span class="text-purple-400">🏃 쥐 레이스 탈출 조건</span>
                        <span class="text-gray-300">패시브 소득 ≥ 총 지출</span>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-gray-400">현재 진행도</span>
                        <span class="${passiveIncome >= totalExpense ? 'text-emerald-400' : 'text-yellow-400'}">
                            ₩${fmt(passiveIncome)}만 / ₩${fmt(totalExpense)}만
                            (${totalExpense > 0 ? Math.round(passiveIncome / totalExpense * 100) : 0}%)
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
    modal.classList.remove('hidden');
}

// Hide detail modal
function hideDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// Tab switching
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-gray-700');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active', 'bg-gray-700');
        }
    });

    // Update content
    const content = document.getElementById('tabContent');
    switch(tabName) {
        case 'market':
            content.innerHTML = getMarketHTML();
            break;
        case 'simulation':
            content.innerHTML = getSimulationHTML();
            break;
        case 'portfolio':
            content.innerHTML = getPortfolioHTML();
            break;
    }
}

// Hide celebrate modal
function hideCelebrateModal() {
    document.getElementById('celebrateModal').classList.add('hidden');
}

// Hide opportunity modal (nextTurn 호출 포함)
function hideOpportunityModal() {
    const modal = document.getElementById('opportunityModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    nextTurn();
    updateUI();
}

// Repay debt
function repayDebt(debtType) {
    const inputIds = {
        mortgage: 'repayMortgage',
        credit: 'repayCredit',
        student: 'repayStudent',
        other: 'repayOther'
    };

    const debtNames = {
        mortgage: '주택담보대출',
        credit: '신용대출',
        student: '학자금대출',
        other: '기타대출'
    };

    const inputEl = document.getElementById(inputIds[debtType]);
    if (!inputEl) return;

    let amount = parseFloat(inputEl.value) || 0;
    const currentDebt = gameState.liabilities[debtType];
    const currentCash = gameState.assets.cash;

    // 소액 잔액(1만원 이하)이면 전액 상환으로 처리
    if (currentDebt > 0 && currentDebt <= 1 && (amount <= 0 || Math.abs(amount - currentDebt) < 0.01)) {
        amount = currentDebt;
    }

    if (amount <= 0) {
        showNotification('상환 금액을 입력해주세요.', 'warning');
        return;
    }

    // 부채보다 약간 많이 입력해도 부채 금액으로 조정
    if (amount > currentDebt && amount - currentDebt < 1) {
        amount = currentDebt;
    }

    if (amount > currentCash) {
        showNotification('현금이 부족합니다.', 'error');
        return;
    }

    if (amount > currentDebt) {
        showNotification('부채 금액보다 많이 상환할 수 없습니다.', 'warning');
        return;
    }

    // Process repayment
    gameState.liabilities[debtType] = Math.max(0, Math.round((gameState.liabilities[debtType] - amount) * 100) / 100);
    gameState.assets.cash = Math.round((gameState.assets.cash - amount) * 100) / 100;

    // 0.01 미만의 잔액은 0으로 정리
    if (gameState.liabilities[debtType] > 0 && gameState.liabilities[debtType] < 0.01) {
        gameState.liabilities[debtType] = 0;
    }

    // Recalculate loan interest expense (assume 5% annual = 0.42% monthly)
    const totalDebt = getTotalLiabilities();
    gameState.expenses.loan = Math.round(totalDebt * 0.0042);

    showNotification(`${debtNames[debtType]} ₩${fmt(amount)}만 상환 완료!`, 'success');

    // Refresh the modal
    showDetailModal('liabilities');
    updateUI();
}

// Repay full debt amount
function repayFullDebt(debtType) {
    const debtNames = {
        mortgage: '주택담보대출',
        credit: '신용대출',
        student: '학자금대출',
        other: '기타대출'
    };

    const currentDebt = gameState.liabilities[debtType];
    const currentCash = gameState.assets.cash;

    if (currentDebt <= 0) {
        showNotification('상환할 부채가 없습니다.', 'warning');
        return;
    }

    if (currentDebt > currentCash) {
        showNotification('현금이 부족합니다.', 'error');
        return;
    }

    // Process full repayment
    gameState.liabilities[debtType] = 0;
    gameState.assets.cash = Math.round((currentCash - currentDebt) * 100) / 100;

    // Recalculate loan interest expense
    const totalDebt = getTotalLiabilities();
    gameState.expenses.loan = Math.round(totalDebt * 0.0042);

    showNotification(`${debtNames[debtType]} ₩${fmt(currentDebt)}만 전액 상환 완료!`, 'success');

    // Refresh the modal
    showDetailModal('liabilities');
    updateUI();
}

// Block Deal Modal (Fast Track)
function showBlockDealModal(type) {
    const modal = document.getElementById('blockDealModal');
    const cashDisplay = document.getElementById('blockDealCash');
    const content = document.getElementById('blockDealContent');

    cashDisplay.textContent = `₩${fmt(gameState.assets.cash)}만`;

    let html = '';

    if (type === 'realestate') {
        html = `
            <div class="text-sm text-gray-400 mb-4">
                패스트트랙에서는 부동산을 대량으로 매입할 수 있습니다.
                현재 시세로 즉시 구매 가능합니다.
            </div>
            <div class="space-y-3">
                ${Object.keys(realEstateMarketPrices).map(name => {
                    const price = realEstateMarketPrices[name];
                    const char = realEstateCharacteristics[name] || { rentalYield: 0.04 };
                    const monthlyIncome = Math.round(price * char.rentalYield / 12);
                    const canAfford = gameState.assets.cash >= price;
                    return `
                        <div class="p-3 bg-gray-800 rounded-lg ${!canAfford ? 'opacity-50' : ''}">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold">${name}</span>
                                <span class="text-yellow-400">₩${fmt(price)}만</span>
                            </div>
                            <div class="flex justify-between text-sm text-gray-400 mb-2">
                                <span>예상 월 수익</span>
                                <span class="text-emerald-400">+₩${fmt(monthlyIncome)}만</span>
                            </div>
                            <button onclick="buyBlockDealRealEstate('${name}')"
                                class="w-full py-2 ${canAfford ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'} rounded font-bold"
                                ${!canAfford ? 'disabled' : ''}>
                                ${canAfford ? '구매하기' : '자금 부족'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (type === 'stocks') {
        html = `
            <div class="text-sm text-gray-400 mb-4">
                대량 주식 매수로 더 큰 수익을 노리세요!
                10주 이상 구매시 할인 적용됩니다.
            </div>
            <div class="space-y-3">
                ${['삼성전자', '애플', '테슬라', '엔비디아', 'S&P500 ETF', '나스닥100 ETF'].map(name => {
                    const price = marketPrices[name];
                    const char = assetCharacteristics[name] || {};
                    const minShares = 100;
                    const totalCost = price * minShares;
                    const canAfford = gameState.assets.cash >= totalCost;
                    return `
                        <div class="p-3 bg-gray-800 rounded-lg ${!canAfford ? 'opacity-50' : ''}">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold">${name}</span>
                                <span class="text-yellow-400">₩${fmt(price)}만/주</span>
                            </div>
                            <div class="text-sm text-gray-400 mb-2">
                                최소 ${minShares}주 = ₩${fmt(totalCost)}만
                            </div>
                            <button onclick="buyBlockDealStock('${name}', ${minShares})"
                                class="w-full py-2 ${canAfford ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 cursor-not-allowed'} rounded font-bold"
                                ${!canAfford ? 'disabled' : ''}>
                                ${canAfford ? `${minShares}주 구매` : '자금 부족'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    content.innerHTML = html;
    modal.classList.remove('hidden');
}

function hideBlockDealModal() {
    document.getElementById('blockDealModal').classList.add('hidden');
}

// Buy block deal real estate
function buyBlockDealRealEstate(name) {
    const price = realEstateMarketPrices[name];
    const char = realEstateCharacteristics[name] || { rentalYield: 0.04 };
    const monthlyIncome = Math.round(price * char.rentalYield / 12);

    if (gameState.assets.cash < price) {
        showNotification('현금이 부족합니다!', 'error');
        return;
    }

    if (!confirm(`${name}을(를) ₩${fmt(price)}만원에 구매하시겠습니까?\n\n예상 월 수익: ₩${fmt(monthlyIncome)}만`)) {
        return;
    }

    gameState.assets.cash -= price;
    gameState.assets.realEstate += price;
    gameState.income.rental += monthlyIncome;

    gameState.investments.push({
        type: 'realEstate',
        name: name,
        cost: price,
        monthlyIncome: monthlyIncome,
        purchaseTurn: turn
    });

    showNotification(`${name} 구매 완료! 월 수익 +₩${fmt(monthlyIncome)}만`, 'success');
    hideBlockDealModal();
    checkFastTrackVictory();
    updateUI();
}

// Buy block deal stock
function buyBlockDealStock(name, shares) {
    const price = marketPrices[name];
    const totalCost = Math.round(price * shares * 100) / 100;
    const char = assetCharacteristics[name] || {};
    const monthlyDividend = Math.floor(totalCost * (char.dividend || 0) / 12);

    if (gameState.assets.cash < totalCost) {
        showNotification('현금이 부족합니다!', 'error');
        return;
    }

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
        pricePerShare: price,
        monthlyIncome: monthlyDividend
    });

    showNotification(`${name} ${shares}주 블록딜 완료!`, 'success');
    hideBlockDealModal();
    updateUI();
}

// ==========================================
// Universal Purchase Modal
// ==========================================

let purchaseModalCallback = null;
let purchaseModalMax = 0;
let purchaseModalStep = 1;

function showPurchaseModal(options) {
    const {
        title = '구매',
        itemName = '',
        price = 0,
        maxQuantity = 0,
        step = 1,
        unit = '주',
        description = '',
        buttonText = '구매하기',
        onConfirm = null
    } = options;

    purchaseModalCallback = onConfirm;
    purchaseModalMax = maxQuantity;
    purchaseModalStep = step;

    document.getElementById('purchaseModalTitle').textContent = title;
    document.getElementById('purchaseModalCash').textContent = `₩${fmt(gameState.assets.cash)}만`;
    document.getElementById('purchaseModalMax').textContent = `${typeof maxQuantity === 'number' && maxQuantity % 1 !== 0 ? maxQuantity.toFixed(3) : maxQuantity}${unit}`;
    document.getElementById('purchaseModalLabel').textContent = `몇 ${unit} 구매하시겠습니까?`;
    document.getElementById('purchaseModalConfirm').textContent = buttonText;

    const input = document.getElementById('purchaseModalInput');
    input.value = '';
    input.step = step;
    input.min = step;
    input.max = maxQuantity;
    input.placeholder = `0 ~ ${typeof maxQuantity === 'number' && maxQuantity % 1 !== 0 ? maxQuantity.toFixed(3) : maxQuantity}`;

    // Build content
    let html = '';
    if (itemName) {
        html += `<div class="text-center">
            <div class="text-2xl font-bold text-white mb-1">${itemName}</div>`;
        if (price > 0) {
            html += `<div class="text-lg text-yellow-400">현재가: ₩${fmt(price)}만/${unit}</div>`;
        }
        html += `</div>`;
    }
    if (description) {
        html += `<div class="text-sm text-gray-400 text-center p-2 bg-gray-800/50 rounded-lg">${description}</div>`;
    }

    document.getElementById('purchaseModalContent').innerHTML = html;
    document.getElementById('purchaseModal').classList.remove('hidden');

    // Focus input
    setTimeout(() => input.focus(), 100);
}

function hidePurchaseModal() {
    document.getElementById('purchaseModal').classList.add('hidden');
    purchaseModalCallback = null;
}

function setPurchaseMax() {
    const input = document.getElementById('purchaseModalInput');
    input.value = purchaseModalStep < 1 ? purchaseModalMax.toFixed(3) : purchaseModalMax;
}

function confirmPurchase() {
    const input = document.getElementById('purchaseModalInput');
    const value = parseFloat(input.value);

    if (isNaN(value) || value <= 0) {
        showNotification('올바른 수량을 입력해주세요.', 'error');
        return;
    }

    if (value > purchaseModalMax) {
        showNotification('최대 수량을 초과했습니다.', 'error');
        return;
    }

    if (purchaseModalCallback) {
        purchaseModalCallback(value);
    }

    hidePurchaseModal();
}

