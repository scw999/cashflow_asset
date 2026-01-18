// ==========================================
// UI 관련 기능
// ==========================================

// Update UI
function updateUI() {
    // Update financial statement
    document.getElementById('incomeSalary').textContent = `₩${fmt(gameState.income.salary)}만`;
    document.getElementById('incomeRental').textContent = `₩${fmt(gameState.income.rental)}만`;
    document.getElementById('incomeDividend').textContent = `₩${fmt(gameState.income.dividend)}만`;
    document.getElementById('incomeOther').textContent = `₩${fmt(gameState.income.other)}만`;

    document.getElementById('expenseHousing').textContent = `₩${fmt(gameState.expenses.housing)}만`;
    document.getElementById('expenseLiving').textContent = `₩${fmt(gameState.expenses.living)}만`;
    document.getElementById('expenseLoan').textContent = `₩${fmt(gameState.expenses.loan)}만`;
    document.getElementById('expenseTax').textContent = `₩${fmt(gameState.expenses.tax)}만`;

    document.getElementById('childExpense').textContent = `₩${fmt(gameState.children * 30)}만 (${gameState.children}명)`;

    document.getElementById('assetCash').textContent = `₩${fmt(gameState.assets.cash)}만`;
    document.getElementById('assetRealEstate').textContent = `₩${fmt(gameState.assets.realEstate)}만`;
    document.getElementById('assetStocks').textContent = `₩${fmt(gameState.assets.stocks)}만`;
    document.getElementById('assetCrypto').textContent = `₩${fmt(gameState.assets.crypto)}만`;

    document.getElementById('liabMortgage').textContent = `₩${fmt(gameState.liabilities.mortgage)}만`;
    document.getElementById('liabCredit').textContent = `₩${fmt(gameState.liabilities.credit)}만`;
    document.getElementById('liabStudent').textContent = `₩${fmt(gameState.liabilities.student)}만`;
    document.getElementById('liabOther').textContent = `₩${fmt(gameState.liabilities.other)}만`;

    // Summaries
    const totalIncome = Object.values(gameState.income).reduce((a, b) => a + b, 0);
    const totalExpense = Object.values(gameState.expenses).reduce((a, b) => a + b, 0) + gameState.children * 30;
    const cashflow = totalIncome - totalExpense;
    const passiveIncome = getPassiveIncome();

    document.getElementById('totalIncome').textContent = `₩${fmt(totalIncome)}만`;
    document.getElementById('totalExpense').textContent = `₩${fmt(totalExpense)}만`;
    document.getElementById('cashflowAmount').textContent = `₩${fmt(cashflow)}만`;
    document.getElementById('cashflowAmount').className = cashflow >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';
    document.getElementById('passiveIncome').textContent = `₩${fmt(passiveIncome)}만`;

    const totalAssets = getTotalAssets();
    const totalLiabilities = getTotalLiabilities();
    const netWorth = totalAssets - totalLiabilities;
    document.getElementById('totalAssets').textContent = `₩${fmt(totalAssets)}만`;
    document.getElementById('totalLiabilities').textContent = `₩${fmt(totalLiabilities)}만`;
    document.getElementById('netWorth').textContent = `₩${fmt(netWorth)}만`;
    document.getElementById('netWorth').className = netWorth >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';

    // Progress bars
    const escapeProgress = passiveIncome > 0 ? Math.min(100, (passiveIncome / totalExpense) * 100) : 0;
    document.getElementById('escapeProgress').style.width = `${escapeProgress}%`;
    document.getElementById('escapeProgressText').textContent = `${escapeProgress.toFixed(0)}%`;

    // Summary lists
    updateSummaryLists();

    // Update active tab content
    const activeTab = document.querySelector('[data-tab].border-b-2.border-yellow-400');
    if (activeTab) {
        const tabName = activeTab.getAttribute('data-tab');
        if (tabName === 'investment') {
            document.getElementById('tabContent').innerHTML = getMarketHTML();
        } else if (tabName === 'portfolio') {
            document.getElementById('tabContent').innerHTML = getPortfolioHTML();
        }
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

    // Investments summary
    const invList = document.getElementById('investmentSummaryList');
    if (invList) {
        const investments = gameState.investments.slice(0, 5); // Show top 5
        invList.innerHTML = investments.length > 0
            ? investments.map(inv => {
                let currentValue;
                if (inv.amount && inv.baseName && marketPrices[inv.baseName]) {
                    currentValue = Math.round(inv.amount * marketPrices[inv.baseName] * 100) / 100;
                } else if (inv.amount && marketPrices[inv.name]) {
                    currentValue = Math.round(inv.amount * marketPrices[inv.name] * 100) / 100;
                } else if (inv.shares && marketPrices[inv.name]) {
                    currentValue = Math.round(inv.shares * marketPrices[inv.name] * 100) / 100;
                } else {
                    currentValue = inv.cost;
                }
                const pnl = currentValue - inv.cost;
                const pnlClass = pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
                return `<div class="flex justify-between text-sm">
                    <span class="truncate">${inv.name}</span>
                    <span class="${pnlClass}">₩${fmt(currentValue)}만</span>
                </div>`;
            }).join('')
            : '<div class="text-gray-500 text-sm text-center">투자 없음</div>';
    }
}

// Update current player display
function updateCurrentPlayerDisplay() {
    const indicator = document.getElementById('currentPlayerIndicator');
    const avatar = document.getElementById('currentPlayerAvatar');
    const label = document.getElementById('currentPlayerLabel');

    indicator.className = `flex items-center gap-2 px-4 py-2 rounded-full ${playerColorClasses[currentPlayer]}`;
    avatar.textContent = playerEmojis[currentPlayer];
    label.textContent = `플레이어 ${currentPlayer + 1}의 차례`;

    updatePlayerTabs();
}

// Update player tabs
function updatePlayerTabs() {
    const container = document.getElementById('playerTabs');
    if (!container) return;

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
            setupPlayer = i;
            updateSetupPlayerTabs();
            loadSetupPlayerData();
        };
        container.appendChild(tab);
    }
}

// Load setup player data into form
function loadSetupPlayerData() {
    const player = players[setupPlayer];

    document.getElementById('setupJobInput').value = player.job || '';

    // Income
    document.getElementById('setupSalary').value = player.income.salary;
    document.getElementById('setupRental').value = player.income.rental;
    document.getElementById('setupDividend').value = player.income.dividend;
    document.getElementById('setupOther').value = player.income.other;

    // Expenses
    document.getElementById('setupHousing').value = player.expenses.housing;
    document.getElementById('setupLiving').value = player.expenses.living;
    document.getElementById('setupLoan').value = player.expenses.loan;
    document.getElementById('setupTax').value = player.expenses.tax;

    // Assets
    document.getElementById('setupCash').value = player.assets.cash;
    document.getElementById('setupRealEstate').value = player.assets.realEstate;
    document.getElementById('setupStocks').value = player.assets.stocks;
    document.getElementById('setupCrypto').value = player.assets.crypto;

    // Liabilities
    document.getElementById('setupMortgage').value = player.liabilities.mortgage;
    document.getElementById('setupCredit').value = player.liabilities.credit;
    document.getElementById('setupStudent').value = player.liabilities.student;
    document.getElementById('setupOtherLiab').value = player.liabilities.other;

    // Dream selection
    updateDreamSelection();
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
            ${dream.cost > 0 ? `<div class="text-xs text-yellow-400 mt-1">필요자금: ₩${fmt(dream.cost)}만</div>` : ''}
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

    loadSetupPlayerData();

    // Highlight selected preset
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-yellow-400');
    });
    event.target.classList.add('ring-2', 'ring-yellow-400');
}

// Save setup player data
function saveSetupPlayer() {
    const player = players[setupPlayer];

    player.job = document.getElementById('setupJobInput').value;

    // Income
    player.income.salary = +document.getElementById('setupSalary').value || 0;
    player.income.rental = +document.getElementById('setupRental').value || 0;
    player.income.dividend = +document.getElementById('setupDividend').value || 0;
    player.income.other = +document.getElementById('setupOther').value || 0;

    // Expenses
    player.expenses.housing = +document.getElementById('setupHousing').value || 0;
    player.expenses.living = +document.getElementById('setupLiving').value || 0;
    player.expenses.loan = +document.getElementById('setupLoan').value || 0;
    player.expenses.tax = +document.getElementById('setupTax').value || 0;

    // Assets
    player.assets.cash = +document.getElementById('setupCash').value || 0;
    player.assets.realEstate = +document.getElementById('setupRealEstate').value || 0;
    player.assets.stocks = +document.getElementById('setupStocks').value || 0;
    player.assets.crypto = +document.getElementById('setupCrypto').value || 0;

    // Liabilities
    player.liabilities.mortgage = +document.getElementById('setupMortgage').value || 0;
    player.liabilities.credit = +document.getElementById('setupCredit').value || 0;
    player.liabilities.student = +document.getElementById('setupStudent').value || 0;
    player.liabilities.other = +document.getElementById('setupOtherLiab').value || 0;
}

// Start game
function startGame() {
    // Save current setup player data
    saveSetupPlayer();

    // Validate all players have jobs and dreams
    for (let i = 0; i < numPlayers; i++) {
        if (!players[i].job) {
            alert(`플레이어 ${i + 1}의 직업을 설정해주세요.`);
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

    document.getElementById('setupModal').classList.add('hidden');
    currentPlayer = 0;
    turn = 1;
    document.getElementById('turnCount').textContent = turn;
    updateCurrentPlayerDisplay();
    updateUI();
    drawBoard();
}

// Show settings modal
function showSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');

    // Load current player data
    document.getElementById('editJobInput').value = getPlayer().job || '';
    document.getElementById('editSalary').value = gameState.income.salary;
    document.getElementById('editRental').value = gameState.income.rental;
    document.getElementById('editDividend').value = gameState.income.dividend;
    document.getElementById('editOther').value = gameState.income.other;

    document.getElementById('editHousing').value = gameState.expenses.housing;
    document.getElementById('editLiving').value = gameState.expenses.living;
    document.getElementById('editLoan').value = gameState.expenses.loan;
    document.getElementById('editTax').value = gameState.expenses.tax;

    document.getElementById('editCash').value = gameState.assets.cash;
    document.getElementById('editRealEstate').value = gameState.assets.realEstate;
    document.getElementById('editStocks').value = gameState.assets.stocks;
    document.getElementById('editCrypto').value = gameState.assets.crypto;

    document.getElementById('editMortgage').value = gameState.liabilities.mortgage;
    document.getElementById('editCredit').value = gameState.liabilities.credit;
    document.getElementById('editStudent').value = gameState.liabilities.student;
    document.getElementById('editOtherLiab').value = gameState.liabilities.other;

    document.getElementById('editChildren').value = gameState.children;
}

// Hide settings modal
function hideSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

// Save settings
function saveSettings() {
    getPlayer().job = document.getElementById('editJobInput').value;

    gameState.income.salary = +document.getElementById('editSalary').value || 0;
    gameState.income.rental = +document.getElementById('editRental').value || 0;
    gameState.income.dividend = +document.getElementById('editDividend').value || 0;
    gameState.income.other = +document.getElementById('editOther').value || 0;

    gameState.expenses.housing = +document.getElementById('editHousing').value || 0;
    gameState.expenses.living = +document.getElementById('editLiving').value || 0;
    gameState.expenses.loan = +document.getElementById('editLoan').value || 0;
    gameState.expenses.tax = +document.getElementById('editTax').value || 0;

    gameState.assets.cash = +document.getElementById('editCash').value || 0;
    gameState.assets.realEstate = +document.getElementById('editRealEstate').value || 0;
    gameState.assets.stocks = +document.getElementById('editStocks').value || 0;
    gameState.assets.crypto = +document.getElementById('editCrypto').value || 0;

    gameState.liabilities.mortgage = +document.getElementById('editMortgage').value || 0;
    gameState.liabilities.credit = +document.getElementById('editCredit').value || 0;
    gameState.liabilities.student = +document.getElementById('editStudent').value || 0;
    gameState.liabilities.other = +document.getElementById('editOtherLiab').value || 0;

    gameState.children = +document.getElementById('editChildren').value || 0;

    updateUI();

    // Show save confirmation
    const saveBtn = document.querySelector('#settingsModal button[onclick="saveSettings()"]');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '저장되었습니다!';
    saveBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
    saveBtn.classList.add('bg-green-500');

    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('bg-green-500');
        saveBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
    }, 1500);
}

// Tab switching
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.classList.remove('border-b-2', 'border-yellow-400', 'text-yellow-400');
        btn.classList.add('text-gray-400');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('border-b-2', 'border-yellow-400', 'text-yellow-400');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-gray-400');

    // Update content
    const content = document.getElementById('tabContent');
    switch(tabName) {
        case 'investment':
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

// Hide event modal
function hideEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    currentEvent = null;
}

// Hide celebrate modal
function hideCelebrateModal() {
    document.getElementById('celebrateModal').classList.add('hidden');
}

