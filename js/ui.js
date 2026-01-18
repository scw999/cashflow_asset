// ==========================================
// UI 관련 기능
// ==========================================

// Update UI
function updateUI() {
    const player = getPlayer();

    // Dashboard
    document.getElementById('dashCash').textContent = `₩${fmt(gameState.assets.cash)}만`;
    document.getElementById('dashAssets').textContent = `₩${fmt(getTotalAssets())}만`;
    document.getElementById('dashDebt').textContent = `₩${fmt(getTotalLiabilities())}만`;
    document.getElementById('dashNetWorth').textContent = `₩${fmt(getTotalAssets() - getTotalLiabilities())}만`;
    document.getElementById('dashCashflow').textContent = `₩${fmt(getCashflow())}만`;

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

    // Escape progress
    const escapeProgress = passiveIncome > 0 && totalExpense > 0 ? Math.min(100, (passiveIncome / totalExpense) * 100) : 0;
    document.getElementById('escapeProgress').style.width = `${escapeProgress}%`;

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
        if (gameState.liabilities.mortgage > 0) liabs.push({ name: '주택대출', value: gameState.liabilities.mortgage, icon: '🏦' });
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
    currentPlayer = playerIndex;
    updateCurrentPlayerDisplay();
    updateUI();
    drawBoard();
}

// Update setup player tabs
function updateSetupPlayerTabs() {
    const container = document.getElementById('setupPlayerTabs');
    if (!container) return;

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

    // Update selected job display
    const jobDisplay = document.getElementById('selectedJobDisplay');
    if (jobDisplay) {
        jobDisplay.textContent = player.job || '없음';
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

    // Dream selection
    updateDreamSelection();
}

// Update preset buttons
function updatePresetButtons() {
    const container = document.getElementById('presetBtns');
    if (!container) return;

    container.innerHTML = Object.entries(presets).map(([key, preset]) => `
        <button onclick="applyPreset('${key}')" class="preset-btn p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition ${players[setupPlayer].jobPreset === key ? 'ring-2 ring-yellow-400' : ''}">
            <div class="font-bold text-sm">${preset.job}</div>
            <div class="text-xs text-gray-400">${key}</div>
        </button>
    `).join('') + `
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
    if (!container) return;

    const player = players[setupPlayer];

    container.innerHTML = dreams.map(dream => `
        <button onclick="selectDream('${dream.id}')"
            class="p-3 rounded-lg text-left transition-all ${
                player.dream === dream.id
                    ? 'bg-yellow-600 ring-2 ring-yellow-400'
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

    loadSetupPlayerData();

    // Highlight selected preset
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-yellow-400');
    });
    if (event && event.target) {
        event.target.closest('.preset-btn').classList.add('ring-2', 'ring-yellow-400');
    }
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
    updateSetupPlayerTabs();
    loadSetupPlayerData();
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
        title.textContent = '📉 부채 상세';
        html = `
            <div class="space-y-3">
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>🏦 주택담보대출</span>
                    <span class="text-red-400">₩${fmt(gameState.liabilities.mortgage)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>💳 신용대출</span>
                    <span class="text-red-400">₩${fmt(gameState.liabilities.credit)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>🎓 학자금대출</span>
                    <span class="text-red-400">₩${fmt(gameState.liabilities.student)}만</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>📋 기타대출</span>
                    <span class="text-red-400">₩${fmt(gameState.liabilities.other)}만</span>
                </div>
                <div class="border-t border-gray-600 pt-3">
                    <div class="flex justify-between font-bold text-lg">
                        <span>총 부채</span>
                        <span class="text-red-400">₩${fmt(getTotalLiabilities())}만</span>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'expenses') {
        title.textContent = '💸 지출 상세';
        const childExpense = gameState.children * 30;
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
                ${childExpense > 0 ? `
                <div class="flex justify-between p-3 bg-gray-800 rounded-lg">
                    <span>👶 양육비 (${gameState.children}명)</span>
                    <span class="text-red-400">₩${fmt(childExpense)}만</span>
                </div>` : ''}
                <div class="border-t border-gray-600 pt-3">
                    <div class="flex justify-between font-bold text-lg">
                        <span>총 지출</span>
                        <span class="text-red-400">₩${fmt(getTotalExpenses())}만</span>
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

// Hide opportunity modal
function hideOpportunityModal() {
    const modal = document.getElementById('opportunityModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
