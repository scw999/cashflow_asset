// ==========================================
// 메인 초기화 및 이벤트 바인딩
// ==========================================

// Initialize game
function init() {
    // Draw initial board
    drawBoard();

    // Setup player tabs
    setNumPlayers(1);

    // Initialize UI
    updateCurrentPlayerDisplay();
    updateUI();

    // Show setup modal on start
    showSetupModal();

    // Setup tab click handlers
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => showTab(tab.getAttribute('data-tab')));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Start auto-save
    startAutoSave();

    // Check for existing save
    const savedGame = localStorage.getItem('cashflowGame');
    if (savedGame) {
        const loadBtn = document.createElement('button');
        loadBtn.className = 'mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold';
        loadBtn.textContent = '이전 게임 불러오기';
        loadBtn.onclick = () => {
            loadGame();
            loadBtn.remove();
        };

        const setupContent = document.querySelector('#setupModal .max-w-2xl');
        if (setupContent) {
            const existingLoadBtn = setupContent.querySelector('.load-save-btn');
            if (!existingLoadBtn) {
                loadBtn.classList.add('load-save-btn');
                setupContent.appendChild(loadBtn);
            }
        }
    }
}

// Handle keyboard shortcuts
function handleKeyboard(e) {
    // Only when not in modal or input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    // Check if setup modal is visible
    const setupModal = document.getElementById('setupModal');
    if (setupModal && !setupModal.classList.contains('hidden')) {
        return;
    }

    switch(e.key.toLowerCase()) {
        case ' ': // Space - Roll dice
        case 'r':
            e.preventDefault();
            rollDice();
            break;
        case 's': // S - Save game
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                saveGame();
            }
            break;
        case 'l': // L - Load game
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                loadGame();
            }
            break;
        case '1':
            showTab('market');
            break;
        case '2':
            showTab('simulation');
            break;
        case '3':
            showTab('portfolio');
            break;
        case 'escape':
            hideEventModal();
            hideAssetChartModal();
            hideSetupModal();
            hideCelebrateModal();
            hideOpportunityModal();
            hideVictoryModal();
            hideDetailModal();
            break;
    }
}

// Roll dice and move
function rollDice() {
    // Prevent rapid clicking
    if (diceRolling) {
        return;
    }

    const player = getPlayer();

    // Check if player needs to skip turn
    if (player.skipTurns > 0) {
        player.skipTurns--;
        showNotification(`${playerEmojis[currentPlayer]} 턴을 건너뜁니다. (남은 스킵: ${player.skipTurns})`, 'warning');
        nextTurn();
        updateUI();
        drawBoard();
        return;
    }

    // Set cooldown
    diceRolling = true;
    const diceBtn = document.getElementById('diceBtn');
    if (diceBtn) {
        diceBtn.disabled = true;
        diceBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Roll dice (1-6, or double if has double dice power)
    let dice1 = Math.floor(Math.random() * 6) + 1;
    let dice2 = Math.floor(Math.random() * 6) + 1;
    let roll = dice1 + dice2;

    if (player.doubleDice > 0) {
        roll *= 2;
        player.doubleDice--;
        showNotification(`더블 다이스! ${dice1} + ${dice2} = ${roll / 2} × 2 = ${roll}`, 'success');
    } else {
        showNotification(`주사위: ${dice1} + ${dice2} = ${roll}`, 'info');
    }

    // Update market prices (random fluctuation on each roll)
    const priceChanges = updateMarketPrices();

    // Show price change notification for significant moves
    const significantChanges = priceChanges.filter(c => Math.abs(parseFloat(c.changePercent)) > 5);
    if (significantChanges.length > 0) {
        const change = significantChanges[0];
        const color = parseFloat(change.changePercent) > 0 ? 'success' : 'error';
        setTimeout(() => {
            showNotification(`${change.name} ${change.changePercent}%!`, color);
        }, 1000);
    }

    // Move player
    const spaces = gameState.inFastTrack ? fastTrackSpaces : ratRaceSpaces;
    gameState.position = (gameState.position + roll) % spaces.length;

    // Draw board with animation
    drawBoard();

    // Process landing after a delay
    setTimeout(() => {
        const space = spaces[gameState.position];
        handleSpaceLanding(space);

        // Reset cooldown after event is handled
        setTimeout(() => {
            diceRolling = false;
            if (diceBtn) {
                diceBtn.disabled = false;
                diceBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }, 500);
    }, 800);
}

// Handle landing on a space
function handleSpaceLanding(space) {
    // Set current event for reference
    currentEvent = { space, type: space.type };

    switch (space.type) {
        case 'payday':
            handlePayday();
            break;

        case 'opportunity':
            handleOpportunity(space);
            break;

        case 'market':
            handleMarket(space);
            break;

        case 'doodad':
            handleDoodad();
            break;

        case 'baby':
            handleBaby();
            break;

        case 'layoff':
            handleLayoff();
            break;

        case 'charity':
            handleCharity();
            break;

        case 'dream':
            handleDream(space);
            break;

        default:
            nextTurn();
            updateUI();
    }
}

// Payday handler
function handlePayday() {
    const cashflow = getCashflow();

    // Process staking rewards
    const stakingRewards = processStakingRewards();

    gameState.assets.cash += cashflow;

    let stakingMessage = '';
    if (stakingRewards.length > 0) {
        stakingMessage = `<div class="mt-3 text-sm text-purple-400">
            <div class="font-bold">스테이킹 보상:</div>
            ${stakingRewards.map(r =>
                `<div>+${r.reward.toFixed(4)} ${r.name} (₩${fmt(Math.round(r.value))}만)</div>`
            ).join('')}
        </div>`;
    }

    showEventModal(
        '💰 월급날!',
        `<p class="text-lg">캐시플로우: <span class="${cashflow >= 0 ? 'text-emerald-400' : 'text-red-400'} font-bold">₩${fmt(cashflow)}만</span></p>
         <p class="mt-2 text-gray-400">현금: ₩${fmt(gameState.assets.cash)}만</p>
         ${stakingMessage}`,
        [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
    );
}

// Opportunity handler
function handleOpportunity(space) {
    // Real estate opportunities only appear on real estate spaces
    if (space.name.includes('부동산') || space.name.includes('경매') || space.name.includes('원룸') || space.name.includes('상가')) {
        showRealEstateOpportunity();
    } else {
        // Stock/ETF/Crypto opportunity
        showEventModal(
            `${space.name} 기회!`,
            `<p>투자 기회가 찾아왔습니다!</p>
             <p class="mt-2 text-gray-400">투자 탭에서 주식, ETF, 가상자산을 매매할 수 있습니다.</p>`,
            [
                { text: '투자하러 가기', action: 'hideEventModal(); showTab("market");', primary: true },
                { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
            ]
        );
    }
}

// Market handler - 실제로 시장 가격 변동 적용
function handleMarket(space) {
    const isUp = space.name.includes('상승');

    // Apply market event to prices
    const changes = applyMarketEvent(isUp);

    // Create affected assets summary
    const topChanges = changes.slice(0, 5);
    const affectedSummary = topChanges.map(c =>
        `<div class="flex justify-between text-sm">
            <span>${c.name}</span>
            <span class="${isUp ? 'text-emerald-400' : 'text-red-400'}">${isUp ? '+' : ''}${c.changePercent}%</span>
        </div>`
    ).join('');

    showEventModal(
        space.name,
        `<p class="text-lg mb-3">시장이 ${isUp ? '상승' : '하락'}했습니다!</p>
         <div class="p-3 bg-gray-800 rounded-lg mb-3">
            <div class="text-xs text-gray-400 mb-2">영향받은 자산 (${changes.length}개)</div>
            ${affectedSummary}
            ${changes.length > 5 ? `<div class="text-xs text-gray-500 mt-2">외 ${changes.length - 5}개...</div>` : ''}
         </div>
         <p class="text-sm ${isUp ? 'text-emerald-400' : 'text-red-400'}">
            보유 자산 가치가 ${isUp ? '상승' : '하락'}했습니다.
         </p>`,
        [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
    );
}

// Doodad handler
function handleDoodad() {
    const doodads = [
        { name: '최신 스마트폰', cost: 150 },
        { name: '명품 가방', cost: 300 },
        { name: '고급 레스토랑', cost: 50 },
        { name: '해외여행', cost: 500 },
        { name: '게임기', cost: 80 },
        { name: '자동차 수리', cost: 200 },
        { name: '의료비', cost: 100 },
        { name: '가전제품', cost: 150 }
    ];

    const doodad = doodads[Math.floor(Math.random() * doodads.length)];
    gameState.assets.cash -= doodad.cost;

    showEventModal(
        '🛒 충동지출!',
        `<p class="text-lg">${doodad.name}</p>
         <p class="text-red-400 font-bold">-₩${fmt(doodad.cost)}만</p>
         <p class="mt-2 text-gray-400">현금: ₩${fmt(gameState.assets.cash)}만</p>`,
        [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
    );
}

// Baby handler
function handleBaby() {
    gameState.children++;

    showEventModal(
        '👶 아기 탄생!',
        `<p class="text-lg">축하합니다! 아기가 태어났습니다!</p>
         <p class="text-yellow-400 font-bold">자녀수: ${gameState.children}명</p>
         <p class="text-red-400 mt-2">월 지출 +₩30만 (양육비)</p>
         <div class="mt-3 p-3 bg-gray-800 rounded-lg text-sm">
            <div class="flex justify-between"><span>기존 지출</span><span>₩${fmt(getTotalExpenses() - 30)}만</span></div>
            <div class="flex justify-between text-red-400"><span>양육비 추가</span><span>+₩30만</span></div>
            <div class="border-t border-gray-600 my-2"></div>
            <div class="flex justify-between font-bold"><span>새 총 지출</span><span>₩${fmt(getTotalExpenses())}만</span></div>
         </div>`,
        [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
    );
}

// Layoff handler - 2턴 쉬기 적용
function handleLayoff() {
    const severance = gameState.income.salary * 2;
    gameState.assets.cash += severance;

    // 2턴 쉬기 적용
    getPlayer().skipTurns = 2;

    showEventModal(
        '😢 해고!',
        `<p class="text-lg">해고되었습니다...</p>
         <p class="text-emerald-400">퇴직금: +₩${fmt(severance)}만</p>
         <p class="text-yellow-400 mt-2 font-bold">⚠️ 다음 2턴을 쉬어야 합니다!</p>
         <p class="text-sm text-gray-400 mt-1">(재취업 활동 기간)</p>`,
        [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
    );
}

// Charity handler
function handleCharity() {
    const donation = Math.round(getTotalExpenses() * 0.1);

    showEventModal(
        '❤️ 기부 기회',
        `<p class="text-lg">월 지출의 10%를 기부하시겠습니까?</p>
         <p class="text-yellow-400 font-bold">기부금: ₩${fmt(donation)}만</p>
         <p class="mt-2 text-gray-400">기부하면 다음 3턴간 주사위 2배!</p>`,
        [
            {
                text: '기부하기',
                action: `gameState.assets.cash -= ${donation}; getPlayer().doubleDice = 3; hideEventModal(); nextTurn(); updateUI();`,
                primary: true
            },
            { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
        ]
    );
}

// Dream handler (Fast Track)
function handleDream(space) {
    const player = getPlayer();
    const dreamData = dreams.find(d => d.id === player.dream);

    if (!dreamData) {
        showEventModal(
            space.name,
            `<p>꿈을 달성할 수 있는 기회입니다!</p>`,
            [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
        );
        return;
    }

    if (checkDreamAchieved(space)) {
        showEventModal(
            '🎯 꿈 달성 기회!',
            `<p class="text-lg">${dreamData.name}</p>
             <p class="text-gray-400">${dreamData.desc}</p>
             <p class="text-yellow-400 font-bold mt-2">필요 자금: ₩${fmt(dreamData.cost)}만</p>
             <p class="text-emerald-400">보유 현금: ₩${fmt(gameState.assets.cash)}만</p>`,
            [
                { text: '꿈 달성!', action: `purchaseDream(); hideEventModal();`, primary: true },
                { text: '나중에', action: 'hideEventModal(); nextTurn(); updateUI();' }
            ]
        );
    } else if (dreamData.cost > 0 && gameState.assets.cash < dreamData.cost) {
        showEventModal(
            space.name,
            `<p>자금이 부족합니다.</p>
             <p class="text-yellow-400 mt-2">필요: ₩${fmt(dreamData.cost)}만</p>
             <p class="text-gray-400">보유: ₩${fmt(gameState.assets.cash)}만</p>`,
            [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
        );
    } else {
        showEventModal(
            space.name,
            `<p>다른 꿈을 향해 계속 전진하세요!</p>`,
            [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
        );
    }
}

// Show event modal
function showEventModal(title, content, actions) {
    const modal = document.getElementById('eventModal');
    const titleEl = document.getElementById('eventTitle');
    const contentEl = document.getElementById('eventContent');
    const actionsEl = document.getElementById('eventActions');

    if (!modal || !titleEl || !contentEl || !actionsEl) {
        console.error('Event modal elements not found');
        return;
    }

    titleEl.textContent = title;
    contentEl.innerHTML = content;
    actionsEl.innerHTML = actions.map(a =>
        `<button onclick="${a.action}"
            class="px-4 py-2 rounded-lg font-bold ${a.primary ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-600 hover:bg-gray-700'}">
            ${a.text}
        </button>`
    ).join('');

    modal.classList.remove('hidden');
}

// Hide event modal
function hideEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentEvent = null;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
