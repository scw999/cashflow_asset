// ==========================================
// 메인 초기화 및 이벤트 바인딩
// ==========================================

// Initialize game
function init() {
    try {
        // Draw initial board
        drawBoard();
    } catch (e) { console.error('drawBoard error:', e); }

    try {
        // Setup player tabs
        setNumPlayers(1);
    } catch (e) { console.error('setNumPlayers error:', e); }

    try {
        // Initialize UI
        updateCurrentPlayerDisplay();
    } catch (e) { console.error('updateCurrentPlayerDisplay error:', e); }

    try {
        updateUI();
    } catch (e) { console.error('updateUI error:', e); }

    try {
        // Show setup modal on start
        showSetupModal();
    } catch (e) { console.error('showSetupModal error:', e); }

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
    const dice3d = document.getElementById('dice3d');
    if (diceBtn) {
        diceBtn.disabled = true;
        diceBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Start 3D dice rolling animation
    if (dice3d) {
        dice3d.className = 'dice-3d rolling';
    }

    // Roll dice: 쥐 레이스에서는 1개 (1-6), 패스트트랙에서는 2개 (2-12)
    let roll;
    let diceDisplay;
    let dice1, dice2;

    if (gameState.inFastTrack) {
        // 패스트트랙: 주사위 2개
        dice1 = Math.floor(Math.random() * 6) + 1;
        dice2 = Math.floor(Math.random() * 6) + 1;
        roll = dice1 + dice2;
        diceDisplay = `${dice1} + ${dice2} = ${roll}`;
    } else {
        // 쥐 레이스: 주사위 1개
        roll = Math.floor(Math.random() * 6) + 1;
        dice1 = roll;
        diceDisplay = `${roll}`;
    }

    // 기부 효과: 더블 다이스 (굴린 값 2배)
    let isDoubleDice = false;
    if (player.doubleDice > 0) {
        roll *= 2;
        player.doubleDice--;
        isDoubleDice = true;
    }

    // Update market prices (random fluctuation on each roll)
    const priceChanges = updateMarketPrices();

    // Calculate positions before animation
    const spaces = gameState.inFastTrack ? fastTrackSpaces : ratRaceSpaces;
    const oldPosition = gameState.position;
    const newPosition = (gameState.position + roll) % spaces.length;
    const passedPaydays = findPassedPaydays(oldPosition, newPosition, roll, spaces);

    // Step 1: After 800ms - Stop dice animation and show result
    setTimeout(() => {
        // Stop rolling animation and show final face
        if (dice3d) {
            dice3d.classList.remove('rolling');
            dice3d.className = `dice-3d show-${dice1}`;
        }

        // Show dice result next to dice button
        const resultDisplay = document.getElementById('diceResultDisplay');
        const resultValue = document.getElementById('diceResultValue');
        const resultText = document.getElementById('diceResultText');

        if (resultDisplay && resultValue && resultText) {
            resultDisplay.classList.remove('hidden');
            if (isDoubleDice) {
                resultValue.textContent = roll;
                resultText.innerHTML = `<span class="text-green-400">더블! ×2</span>`;
            } else if (gameState.inFastTrack) {
                resultValue.textContent = roll;
                resultText.textContent = `${dice1}+${dice2}`;
            } else {
                resultValue.textContent = roll;
                resultText.textContent = `${roll}칸 이동`;
            }
        }

        // Store data for next step
        window._diceRollData = {
            roll,
            oldPosition,
            newPosition,
            passedPaydays,
            spaces,
            diceBtn,
            priceChanges
        };

        // Immediately start moving player (no delay)
        animateTokenMovement();
    }, 800);
}

// Animate token moving one space at a time
function animateTokenMovement() {
    const data = window._diceRollData;
    if (!data) return;

    const { roll, oldPosition, newPosition, passedPaydays, spaces, diceBtn, priceChanges } = data;
    const totalSpaces = spaces.length;

    let currentPos = oldPosition;
    let stepsRemaining = roll;
    const stepDelay = 100; // 100ms per step

    function moveOneStep() {
        if (stepsRemaining <= 0) {
            // Animation complete - proceed to payday/landing
            onMovementComplete();
            return;
        }

        currentPos = (currentPos + 1) % totalSpaces;
        stepsRemaining--;
        gameState.position = currentPos;
        drawBoard();

        setTimeout(moveOneStep, stepDelay);
    }

    function onMovementComplete() {
        updateUI();

        // Show price change notification for significant moves
        const significantChanges = priceChanges.filter(c => Math.abs(parseFloat(c.changePercent)) > 5);
        if (significantChanges.length > 0) {
            const change = significantChanges[0];
            showNotification(`${change.name} ${change.changePercent}%!`, parseFloat(change.changePercent) > 0 ? 'success' : 'error');
        }

        // Small delay after movement so player can see the new position
        setTimeout(() => {
            showLandingEvents();
        }, 400);
    }

    function showLandingEvents() {
        // Check payday or show landing
        if (passedPaydays.length > 0) {
            if (gameState.inFastTrack) {
                // 패스트트랙: 자동 수령 (패시브 소득 * 100)
                const player = getPlayer();
                const passiveIncomeBase = player.income.other || 0;
                const fastTrackPayday = passiveIncomeBase * 100;
                const totalPayday = fastTrackPayday * passedPaydays.length;
                gameState.assets.cash += totalPayday;
                updateUI();

                showEventModal('💰 투자 소득', `
                    <div class="text-center">
                        <div class="text-5xl mb-4">💰</div>
                        <div class="text-2xl font-bold text-green-400 mb-2">+₩${fmt(totalPayday)}만</div>
                        <div class="text-gray-400">월 패시브 소득 ₩${fmt(passiveIncomeBase)}만 × 100</div>
                        ${passedPaydays.length > 1 ? `<div class="text-yellow-400 mt-2">${passedPaydays.length}회 수령!</div>` : ''}
                    </div>
                `, [
                    { text: '확인', action: 'proceedToLanding()', primary: true }
                ]);
            } else {
                // 쥐 레이스: 월급 모달 표시
                showPassedPaydayModal(passedPaydays.length, () => {
                    proceedToLanding();
                });
            }
        } else {
            // No payday - go directly to landing
            proceedToLanding();
        }
    }

    // Start animation
    moveOneStep();
}

// Step 4: Show landing space event
function proceedToLanding() {
    const data = window._diceRollData;
    if (!data) return;

    const { spaces, diceBtn } = data;
    const space = spaces[gameState.position];

    // Handle space landing
    handleSpaceLanding(space);
    resetDiceButton(diceBtn);

    // Clean up
    delete window._diceRollData;
}

// 주사위 버튼 리셋
function resetDiceButton(diceBtn) {
    setTimeout(() => {
        diceRolling = false;
        if (diceBtn) {
            diceBtn.disabled = false;
            diceBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }, 500);
}

// 지나간 월급칸 찾기 (착지 위치 제외)
function findPassedPaydays(oldPos, newPos, roll, spaces) {
    const passedPaydays = [];

    // 이동 경로상의 모든 칸 확인 (시작 위치 제외, 착지 위치 제외)
    for (let i = 1; i < roll; i++) {
        const checkPos = (oldPos + i) % spaces.length;
        if (spaces[checkPos].type === 'payday') {
            passedPaydays.push(checkPos);
        }
    }

    return passedPaydays;
}

// 지나간 월급칸에서 콜백 저장용
let passedPaydayCallback = null;

// 지나간 월급칸 모달 표시
function showPassedPaydayModal(paydayCount, onComplete) {
    const cashflow = getCashflow();
    const totalPayday = cashflow * paydayCount;
    const stakingRewards = processStakingRewards();

    // 콜백 저장
    passedPaydayCallback = onComplete;

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
        '💰 월급칸 통과!',
        `<div class="space-y-3">
            <p class="text-lg text-center">월급칸을 ${paydayCount}개 지나갔습니다!</p>
            <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex justify-between mb-2">
                    <span>캐시플로우</span>
                    <span class="${cashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}">${cashflow >= 0 ? '+' : ''}₩${fmt(cashflow)}만</span>
                </div>
                ${paydayCount > 1 ? `
                <div class="flex justify-between text-sm text-gray-400">
                    <span>× ${paydayCount}개 월급칸</span>
                    <span>= ${totalPayday >= 0 ? '+' : ''}₩${fmt(totalPayday)}만</span>
                </div>` : ''}
            </div>
            ${stakingMessage}
        </div>`,
        [
            {
                text: `월급 받기 (${totalPayday >= 0 ? '+' : ''}₩${fmt(totalPayday)}만)`,
                action: `collectPassedPayday(${totalPayday})`,
                primary: true
            }
        ]
    );
}

// 지나간 월급칸 수금 처리
function collectPassedPayday(totalPayday) {
    gameState.assets.cash += totalPayday;
    if (totalPayday >= 0) {
        showNotification(`월급 +₩${fmt(totalPayday)}만 받았습니다!`, 'success');
    } else {
        showNotification(`지출 ₩${fmt(Math.abs(totalPayday))}만`, 'warning');
    }
    updateUI();
    hideEventModal();

    // 저장된 콜백 실행 (착지 처리)
    if (passedPaydayCallback) {
        passedPaydayCallback();
        passedPaydayCallback = null;
    }
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

        case 'business':
            handleBusiness(space);
            break;

        case 'disaster':
            handleDisaster(space);
            break;

        default:
            nextTurn();
            updateUI();
    }
}

// Payday handler
function handlePayday() {
    const player = getPlayer();

    // 패스트트랙: 자동으로 캐시플로우 지급
    if (gameState.inFastTrack) {
        processPaydayAutomatic();
        return;
    }

    // 쥐 레이스: 월급 버튼 클릭 필요
    const cashflow = getCashflow();
    const stakingRewards = processStakingRewards();

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
        `<div class="space-y-3">
            <p class="text-lg text-center">월급날입니다!</p>
            <div class="p-4 bg-gray-800 rounded-lg">
                <div class="flex justify-between mb-2">
                    <span>총 소득</span>
                    <span class="text-emerald-400">+₩${fmt(Object.values(gameState.income).reduce((a,b)=>a+b,0))}만</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span>총 지출</span>
                    <span class="text-red-400">-₩${fmt(getTotalExpenses())}만</span>
                </div>
                <div class="border-t border-gray-600 my-2"></div>
                <div class="flex justify-between font-bold">
                    <span>캐시플로우</span>
                    <span class="${cashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}">₩${fmt(cashflow)}만</span>
                </div>
            </div>
            ${stakingMessage}
            <p class="text-sm text-gray-400 text-center">현재 현금: ₩${fmt(gameState.assets.cash)}만</p>
        </div>`,
        [
            { text: '💵 월급 받기', action: 'collectPayday();', primary: true, color: 'green' }
        ]
    );
}

// 월급 수령 (쥐 레이스)
function collectPayday() {
    const cashflow = getCashflow();
    gameState.assets.cash += cashflow;

    // Money bounce animation
    const cashDisplay = document.getElementById('cashDisplay') || document.querySelector('[data-cash-display]');
    if (cashDisplay && typeof showMoneyBounce === 'function') {
        showMoneyBounce(cashDisplay, cashflow, cashflow >= 0);
    }

    hideEventModal();
    showNotification(`월급 수령! 캐시플로우 ${cashflow >= 0 ? '+' : ''}₩${fmt(cashflow)}만`, cashflow >= 0 ? 'success' : 'warning');

    // Sparkle effect on success
    if (cashflow >= 0 && typeof createSparkles === 'function' && cashDisplay) {
        createSparkles(cashDisplay, 6);
    }

    nextTurn();
    updateUI();
}

// 자동 투자 소득 처리 (패스트트랙)
function processPaydayAutomatic() {
    // 패스트트랙 페이데이: 탈출 시 패시브 소득 * 100
    const player = getPlayer();
    const passiveIncomeBase = player.income.other || 0;  // 탈출 시 저장된 패시브 소득
    const fastTrackPayday = passiveIncomeBase * 100;

    gameState.assets.cash += fastTrackPayday;

    // Fast track passive income check
    const passiveIncome = getPassiveIncome();
    const progress = Math.min(100, (passiveIncome / FAST_TRACK_WIN_PASSIVE) * 100).toFixed(1);
    const fastTrackInfo = `
        <div class="mt-3 p-3 bg-purple-900/30 rounded-lg">
            <div class="text-sm text-purple-400">🏆 승리 조건 진행도</div>
            <div class="flex justify-between mt-1">
                <span>월 패시브 소득</span>
                <span class="text-emerald-400">₩${fmt(passiveIncome)}만 / ₩${fmt(FAST_TRACK_WIN_PASSIVE)}만</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div class="h-full bg-gradient-to-r from-purple-500 to-yellow-400 rounded-full" style="width: ${progress}%"></div>
            </div>
        </div>
    `;

    showEventModal(
        '💰 투자 소득! (자동)',
        `<div class="space-y-2">
            <p class="text-lg">투자 소득: <span class="text-emerald-400 font-bold">+₩${fmt(fastTrackPayday)}만</span></p>
            <p class="text-sm text-gray-400">(월 패시브 소득 ₩${fmt(passiveIncomeBase)}만 × 100)</p>
            <p class="text-gray-400">현금: ₩${fmt(gameState.assets.cash)}만</p>
        </div>
        ${fastTrackInfo}`,
        [{ text: '확인', action: 'hideEventModal(); checkFastTrackVictory(); nextTurn(); updateUI();', primary: true }]
    );
}

// Opportunity handler
function handleOpportunity(space) {
    // Real estate opportunities - 부동산 칸
    if (space.name.includes('부동산')) {
        // 부동산 칸에서는 다양한 이벤트 발생
        handleRealEstateEvent();
    } else if (space.name.includes('주식') || space.name.includes('ETF')) {
        // 주식/ETF 투자 기회 - 랜덤 이벤트
        handleStockEvent();
    } else if (space.name.includes('가상자산') || space.name.includes('스테이킹')) {
        // 가상자산 이벤트
        handleCryptoEvent();
    } else {
        // 기타 투자 기회
        showEventModal(
            `${space.name} 기회!`,
            `<p>투자 기회가 찾아왔습니다!</p>
             <p class="mt-2 text-gray-400">투자 탭에서 투자할 수 있습니다.</p>`,
            [
                { text: '투자하러 가기', action: 'goToMarketTab();', primary: true },
                { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
            ]
        );
    }
}

// 부동산 이벤트 핸들러 (통합 - 구매, 매수자, 급매, 경매)
function handleRealEstateEvent() {
    const player = getPlayer();
    const realEstateInvestments = gameState.investments.filter(inv => inv.type === 'realEstate');

    // 급매/경매 카운트 증가 (발품 팔기)
    player.urgentSaleCount = (player.urgentSaleCount || 0) + 1;
    player.auctionCount = (player.auctionCount || 0) + 1;

    // 이벤트 결정 (랜덤)
    const roll = Math.random() * 100;

    // 급매 조건 충족 (2회) - 25% 확률로 급매 오퍼
    if (player.urgentSaleCount >= 2 && roll < 25) {
        showUrgentSaleOpportunity();
        return;
    }

    // 경매 조건 충족 (3회) - 20% 확률로 경매 오퍼
    if (player.auctionCount >= 3 && roll < 45 && roll >= 25) {
        showAuctionOpportunity();
        return;
    }

    // 매수자 등장 (부동산 보유 시) - 15% 확률
    if (realEstateInvestments.length > 0 && roll < 60 && roll >= 45) {
        showBuyerOpportunity(realEstateInvestments);
        return;
    }

    // 기본: 구매 기회 (항상 나옴)
    showRealEstateOpportunity();
}

// 실제 매도 가능한 자산 가치 계산
function getSellableAssetValue(assetType) {
    const investments = gameState.investments.filter(inv => inv.type === assetType);
    if (investments.length === 0) return 0;

    if (assetType === 'stocks') {
        return investments.reduce((sum, inv) => {
            const currentPrice = marketPrices[inv.name] || inv.pricePerShare || 0;
            return sum + (inv.shares || 0) * currentPrice;
        }, 0);
    } else if (assetType === 'crypto') {
        return investments.reduce((sum, inv) => {
            if (inv.isStable) return sum + (inv.amount || 0);
            const priceName = inv.baseName || inv.name;
            const currentPrice = marketPrices[priceName] || inv.pricePerUnit || 0;
            return sum + (inv.amount || 0) * currentPrice;
        }, 0);
    }
    return 0;
}

// 급매 기회 (20% 할인)
function showUrgentSaleOpportunity() {
    const player = getPlayer();
    player.urgentSaleCount = 0;  // 카운트 리셋

    updateRealEstatePrices();

    const opportunity = realEstateOpportunities[Math.floor(Math.random() * realEstateOpportunities.length)];
    const discountedCost = Math.round(opportunity.cost * 0.8);  // 20% 할인
    const discountedDownPayment = Math.round(opportunity.downPayment * 0.8);

    // 실제 매도 가능한 자산 확인
    const stockValue = getSellableAssetValue('stocks');
    const cryptoValue = getSellableAssetValue('crypto');

    // 자산 매도 HTML 생성
    const assetSellHtml = gameState.assets.cash < discountedDownPayment && (stockValue > 0 || cryptoValue > 0) ? `
        <div class="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p class="text-blue-400 text-sm font-bold mb-2">💼 자산 매도로 현금 마련</p>
            <div class="space-y-2 text-sm">
                ${stockValue > 0 ? `
                <div class="flex justify-between items-center">
                    <span>📈 주식/ETF: ₩${fmt(Math.round(stockValue))}만</span>
                    <button onclick="sellPortfolioForUrgentSale('stocks', ${discountedDownPayment}, '${JSON.stringify(opportunity).replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${discountedCost})"
                        class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">매도</button>
                </div>` : ''}
                ${cryptoValue > 0 ? `
                <div class="flex justify-between items-center">
                    <span>💎 가상자산: ₩${fmt(Math.round(cryptoValue))}만</span>
                    <button onclick="sellPortfolioForUrgentSale('crypto', ${discountedDownPayment}, '${JSON.stringify(opportunity).replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${discountedCost})"
                        class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs">매도</button>
                </div>` : ''}
            </div>
        </div>` : '';

    showEventModal(
        '🔥 급매 기회!',
        `<div class="space-y-4">
            <div class="text-center">
                <div class="text-3xl mb-2">🏠</div>
                <h3 class="text-xl font-bold">${opportunity.name}</h3>
                <p class="text-orange-400 font-bold">급매 20% 할인!</p>
            </div>

            <div class="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between">
                    <span>시세</span>
                    <span class="line-through text-gray-500">₩${fmt(opportunity.cost)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>급매가</span>
                    <span class="font-bold text-orange-400">₩${fmt(discountedCost)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>필요 계약금</span>
                    <span class="font-bold text-yellow-400">₩${fmt(discountedDownPayment)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>예상 월 임대수익</span>
                    <span class="font-bold text-emerald-400">₩${fmt(opportunity.monthlyIncome)}만</span>
                </div>
                <div class="border-t border-gray-600 my-2"></div>
                <div class="flex justify-between">
                    <span>📊 ROI (계약금 대비)</span>
                    <span class="font-bold text-cyan-400">${((opportunity.monthlyIncome * 12 / discountedDownPayment) * 100).toFixed(1)}%</span>
                </div>
                <div class="flex justify-between">
                    <span>📊 Cap Rate (총가 대비)</span>
                    <span class="font-bold text-blue-400">${((opportunity.monthlyIncome * 12 / discountedCost) * 100).toFixed(1)}%</span>
                </div>
            </div>

            <div class="text-sm text-gray-400">
                보유 현금: ₩${fmt(gameState.assets.cash)}만
                ${gameState.assets.cash < discountedDownPayment ? `<span class="text-red-400 ml-2">(₩${fmt(discountedDownPayment - gameState.assets.cash)}만 부족)</span>` : ''}
            </div>

            ${assetSellHtml}
        </div>`,
        gameState.assets.cash >= discountedDownPayment ? [
            {
                text: '급매 구매',
                action: `buyUrgentSaleProperty(${JSON.stringify(opportunity).replace(/"/g, '&quot;')}, ${discountedCost}, ${discountedDownPayment});`,
                primary: true,
                color: 'green'
            },
            { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
        ] : [
            { text: '패스 (계약금 부족)', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }
        ]
    );
}

// 급매용 자산 매도
function sellPortfolioForUrgentSale(assetType, neededAmount, opportunityJson, discountedCost) {
    const opportunity = JSON.parse(opportunityJson.replace(/&quot;/g, '"'));
    const shortage = neededAmount - gameState.assets.cash;

    if (assetType === 'stocks') {
        const stockInvestments = gameState.investments.filter(inv => inv.type === 'stocks' && inv.shares > 0);
        if (stockInvestments.length === 0) {
            showNotification('매도할 주식이 없습니다.', 'warning');
            return;
        }
        const stockValue = getSellableAssetValue('stocks');
        const sellAmount = Math.min(stockValue, shortage + 100);
        const sellRatio = sellAmount / stockValue;

        gameState.assets.cash += sellAmount;
        gameState.assets.stocks -= sellAmount;

        // 투자 기록 업데이트
        stockInvestments.forEach(inv => {
            const sellShares = Math.floor(inv.shares * sellRatio);
            inv.shares -= sellShares;
            inv.cost = Math.round(inv.cost * (1 - sellRatio));
            if (inv.monthlyIncome) {
                const reducedIncome = Math.round(inv.monthlyIncome * sellRatio);
                gameState.income.dividend -= reducedIncome;
                inv.monthlyIncome -= reducedIncome;
            }
        });
        gameState.investments = gameState.investments.filter(inv => inv.type !== 'stocks' || inv.shares > 0);
        showNotification(`주식 ₩${fmt(Math.round(sellAmount))}만 매도 완료!`, 'success');
    } else if (assetType === 'crypto') {
        const cryptoInvestments = gameState.investments.filter(inv => inv.type === 'crypto' && (inv.amount > 0 || inv.cost > 0));
        if (cryptoInvestments.length === 0) {
            showNotification('매도할 가상자산이 없습니다.', 'warning');
            return;
        }
        const cryptoValue = getSellableAssetValue('crypto');
        const sellAmount = Math.min(cryptoValue, shortage + 100);
        const sellRatio = sellAmount / cryptoValue;

        gameState.assets.cash += sellAmount;
        gameState.assets.crypto -= sellAmount;

        // 투자 기록 업데이트
        cryptoInvestments.forEach(inv => {
            if (inv.amount) {
                inv.amount = Math.round(inv.amount * (1 - sellRatio) * 10000) / 10000;
            }
            inv.cost = Math.round(inv.cost * (1 - sellRatio));
        });
        gameState.investments = gameState.investments.filter(inv => inv.type !== 'crypto' || inv.cost > 0);
        showNotification(`가상자산 ₩${fmt(Math.round(sellAmount))}만 매도 완료!`, 'success');
    }

    updateUI();
    // 급매 모달 다시 표시
    hideEventModal();
    setTimeout(() => {
        const discountedDownPayment = Math.round(opportunity.downPayment * 0.8);
        showUrgentSaleOpportunityWithData(opportunity, discountedCost, discountedDownPayment);
    }, 100);
}

// 데이터와 함께 급매 기회 표시
function showUrgentSaleOpportunityWithData(opportunity, discountedCost, discountedDownPayment) {
    showEventModal(
        '🔥 급매 기회!',
        `<div class="space-y-4">
            <div class="text-center">
                <div class="text-3xl mb-2">🏠</div>
                <h3 class="text-xl font-bold">${opportunity.name}</h3>
                <p class="text-orange-400 font-bold">급매 20% 할인!</p>
            </div>
            <div class="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between"><span>급매가</span><span class="font-bold text-orange-400">₩${fmt(discountedCost)}만</span></div>
                <div class="flex justify-between"><span>필요 계약금</span><span class="font-bold text-yellow-400">₩${fmt(discountedDownPayment)}만</span></div>
                <div class="flex justify-between"><span>예상 월 임대수익</span><span class="font-bold text-emerald-400">₩${fmt(opportunity.monthlyIncome)}만</span></div>
                <div class="border-t border-gray-600 my-2"></div>
                <div class="flex justify-between"><span>📊 ROI (계약금 대비)</span><span class="font-bold text-cyan-400">${((opportunity.monthlyIncome * 12 / discountedDownPayment) * 100).toFixed(1)}%</span></div>
                <div class="flex justify-between"><span>📊 Cap Rate (총가 대비)</span><span class="font-bold text-blue-400">${((opportunity.monthlyIncome * 12 / discountedCost) * 100).toFixed(1)}%</span></div>
            </div>
            <div class="text-sm text-gray-400">보유 현금: ₩${fmt(gameState.assets.cash)}만</div>
        </div>`,
        gameState.assets.cash >= discountedDownPayment ? [
            { text: '급매 구매', action: `buyUrgentSaleProperty(${JSON.stringify(opportunity).replace(/"/g, '&quot;')}, ${discountedCost}, ${discountedDownPayment});`, primary: true, color: 'green' },
            { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
        ] : [
            { text: '패스 (계약금 부족)', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }
        ]
    );
}

function buyUrgentSaleProperty(opportunity, discountedCost, discountedDownPayment) {
    if (gameState.assets.cash < discountedDownPayment) {
        alert('계약금이 부족합니다!');
        return;
    }

    const loanAmount = discountedCost - discountedDownPayment;
    const monthlyLoanPayment = Math.round(loanAmount * 0.04 / 12);

    gameState.assets.cash -= discountedDownPayment;
    gameState.assets.realEstate += discountedCost;
    // 투자부동산 담보대출은 별도 관리 (liabilities.mortgage에 추가하지 않음)
    gameState.income.rental += opportunity.monthlyIncome;
    gameState.expenses.loan += monthlyLoanPayment;

    gameState.investments.push({
        type: 'realEstate',
        name: opportunity.name + ' (급매)',
        cost: discountedCost,
        downPayment: discountedDownPayment,
        loan: loanAmount,
        monthlyLoanPayment: monthlyLoanPayment,
        monthlyIncome: opportunity.monthlyIncome,
        purchaseTurn: turn
    });

    hideEventModal();
    showNotification(`${opportunity.name} 급매 매입 완료! 20% 할인!`, 'success');
    nextTurn();
    updateUI();
}

// 경매 기회 (40% 할인, 주사위로 낙찰 성공/실패 결정)
function showAuctionOpportunity() {
    const player = getPlayer();
    player.auctionCount = 0;  // 카운트 리셋

    updateRealEstatePrices();

    const opportunity = realEstateOpportunities[Math.floor(Math.random() * realEstateOpportunities.length)];
    const discountedCost = Math.round(opportunity.cost * 0.6);  // 40% 할인
    const discountedDownPayment = Math.round(opportunity.downPayment * 0.6);

    // 경매 정보를 전역으로 저장
    window.currentAuctionOpportunity = {
        opportunity: opportunity,
        discountedCost: discountedCost,
        discountedDownPayment: discountedDownPayment
    };

    // 실제 매도 가능한 자산 확인
    const stockValue = getSellableAssetValue('stocks');
    const cryptoValue = getSellableAssetValue('crypto');

    // 자산 매도 HTML 생성
    const assetSellHtml = gameState.assets.cash < discountedDownPayment && (stockValue > 0 || cryptoValue > 0) ? `
        <div class="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p class="text-blue-400 text-sm font-bold mb-2">💼 자산 매도로 현금 마련</p>
            <div class="space-y-2 text-sm">
                ${stockValue > 0 ? `
                <div class="flex justify-between items-center">
                    <span>📈 주식/ETF: ₩${fmt(Math.round(stockValue))}만</span>
                    <button onclick="sellPortfolioForAuction('stocks', ${discountedDownPayment})"
                        class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">매도</button>
                </div>` : ''}
                ${cryptoValue > 0 ? `
                <div class="flex justify-between items-center">
                    <span>💎 가상자산: ₩${fmt(Math.round(cryptoValue))}만</span>
                    <button onclick="sellPortfolioForAuction('crypto', ${discountedDownPayment})"
                        class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs">매도</button>
                </div>` : ''}
            </div>
        </div>` : '';

    showEventModal(
        '⚖️ 경매 기회!',
        `<div class="space-y-4">
            <div class="text-center">
                <div class="text-3xl mb-2">🏛️</div>
                <h3 class="text-xl font-bold">${opportunity.name}</h3>
                <p class="text-emerald-400 font-bold">경매 40% 할인!</p>
            </div>

            <div class="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between">
                    <span>감정가</span>
                    <span class="line-through text-gray-500">₩${fmt(opportunity.cost)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>경매가</span>
                    <span class="font-bold text-emerald-400">₩${fmt(discountedCost)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>필요 보증금</span>
                    <span class="font-bold text-yellow-400">₩${fmt(discountedDownPayment)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>예상 월 임대수익</span>
                    <span class="font-bold text-emerald-400">₩${fmt(opportunity.monthlyIncome)}만</span>
                </div>
                <div class="border-t border-gray-600 my-2"></div>
                <div class="flex justify-between">
                    <span>📊 ROI (보증금 대비)</span>
                    <span class="font-bold text-cyan-400">${((opportunity.monthlyIncome * 12 / discountedDownPayment) * 100).toFixed(1)}%</span>
                </div>
                <div class="flex justify-between">
                    <span>📊 Cap Rate (총가 대비)</span>
                    <span class="font-bold text-blue-400">${((opportunity.monthlyIncome * 12 / discountedCost) * 100).toFixed(1)}%</span>
                </div>
            </div>

            <div class="p-3 bg-orange-900/30 border border-orange-500/50 rounded-lg">
                <p class="text-orange-400 text-sm font-bold">⚠️ 경매 주의사항</p>
                <p class="text-orange-300 text-xs mt-1">주사위를 굴려 4 이상이면 낙찰 성공!</p>
                <p class="text-orange-300 text-xs">3 이하면 낙찰 실패 (다른 입찰자에게 넘어감)</p>
            </div>

            <div class="text-sm text-gray-400">
                보유 현금: ₩${fmt(gameState.assets.cash)}만
                ${gameState.assets.cash < discountedDownPayment ? `<span class="text-red-400 ml-2">(₩${fmt(discountedDownPayment - gameState.assets.cash)}만 부족)</span>` : ''}
            </div>

            ${assetSellHtml}
        </div>`,
        gameState.assets.cash >= discountedDownPayment ? [
            {
                text: '🎲 경매 참여',
                action: `rollForAuction();`,
                primary: true,
                color: 'green'
            },
            { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
        ] : [
            { text: '패스 (보증금 부족)', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }
        ]
    );
}

// 경매용 자산 매도
function sellPortfolioForAuction(assetType, neededAmount) {
    const shortage = neededAmount - gameState.assets.cash;

    if (assetType === 'stocks') {
        const stockInvestments = gameState.investments.filter(inv => inv.type === 'stocks' && inv.shares > 0);
        if (stockInvestments.length === 0) {
            showNotification('매도할 주식이 없습니다.', 'warning');
            return;
        }
        const stockValue = getSellableAssetValue('stocks');
        const sellAmount = Math.min(stockValue, shortage + 100);
        const sellRatio = sellAmount / stockValue;

        gameState.assets.cash += sellAmount;
        gameState.assets.stocks -= sellAmount;

        stockInvestments.forEach(inv => {
            const sellShares = Math.floor(inv.shares * sellRatio);
            inv.shares -= sellShares;
            inv.cost = Math.round(inv.cost * (1 - sellRatio));
            if (inv.monthlyIncome) {
                const reducedIncome = Math.round(inv.monthlyIncome * sellRatio);
                gameState.income.dividend -= reducedIncome;
                inv.monthlyIncome -= reducedIncome;
            }
        });
        gameState.investments = gameState.investments.filter(inv => inv.type !== 'stocks' || inv.shares > 0);
        showNotification(`주식 ₩${fmt(Math.round(sellAmount))}만 매도 완료!`, 'success');
    } else if (assetType === 'crypto') {
        const cryptoInvestments = gameState.investments.filter(inv => inv.type === 'crypto' && (inv.amount > 0 || inv.cost > 0));
        if (cryptoInvestments.length === 0) {
            showNotification('매도할 가상자산이 없습니다.', 'warning');
            return;
        }
        const cryptoValue = getSellableAssetValue('crypto');
        const sellAmount = Math.min(cryptoValue, shortage + 100);
        const sellRatio = sellAmount / cryptoValue;

        gameState.assets.cash += sellAmount;
        gameState.assets.crypto -= sellAmount;

        cryptoInvestments.forEach(inv => {
            if (inv.amount) {
                inv.amount = Math.round(inv.amount * (1 - sellRatio) * 10000) / 10000;
            }
            inv.cost = Math.round(inv.cost * (1 - sellRatio));
        });
        gameState.investments = gameState.investments.filter(inv => inv.type !== 'crypto' || inv.cost > 0);
        showNotification(`가상자산 ₩${fmt(Math.round(sellAmount))}만 매도 완료!`, 'success');
    }

    updateUI();
    // 경매 모달 다시 표시
    hideEventModal();
    setTimeout(() => showAuctionOpportunity(), 100);
}

// 경매 주사위 굴리기
function rollForAuction() {
    const auctionData = window.currentAuctionOpportunity;
    if (!auctionData) {
        hideEventModal();
        nextTurn();
        updateUI();
        return;
    }

    const { opportunity, discountedCost, discountedDownPayment } = auctionData;

    // 주사위 굴리기
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const isSuccess = diceRoll >= 4;

    if (isSuccess) {
        // 낙찰 성공!
        showEventModal(
            '🎉 경매 낙찰 성공!',
            `<div class="space-y-4">
                <div class="text-center">
                    <div class="text-6xl mb-4">🎲</div>
                    <div class="text-4xl font-bold text-emerald-400 mb-2">${diceRoll}</div>
                    <p class="text-emerald-400 font-bold text-xl">낙찰 성공!</p>
                </div>

                <div class="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4">
                    <p class="text-center text-emerald-400">🏠 ${opportunity.name}</p>
                    <p class="text-center text-lg font-bold text-yellow-400">₩${fmt(discountedCost)}만에 낙찰!</p>
                </div>
            </div>`,
            [
                {
                    text: '경매 구매',
                    action: `completeAuctionPurchase();`,
                    primary: true,
                    color: 'green'
                }
            ]
        );
    } else {
        // 낙찰 실패
        showEventModal(
            '😢 경매 낙찰 실패',
            `<div class="space-y-4">
                <div class="text-center">
                    <div class="text-6xl mb-4">🎲</div>
                    <div class="text-4xl font-bold text-red-400 mb-2">${diceRoll}</div>
                    <p class="text-red-400 font-bold text-xl">낙찰 실패...</p>
                </div>

                <div class="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                    <p class="text-center text-red-300">다른 입찰자가 더 높은 가격을 제시했습니다.</p>
                    <p class="text-center text-gray-400 text-sm mt-2">4 이상이 필요했습니다.</p>
                </div>
            </div>`,
            [
                { text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }
            ]
        );
        window.currentAuctionOpportunity = null;
    }
}

// 경매 구매 완료
function completeAuctionPurchase() {
    const auctionData = window.currentAuctionOpportunity;
    if (!auctionData) {
        hideEventModal();
        nextTurn();
        updateUI();
        return;
    }

    const { opportunity, discountedCost, discountedDownPayment } = auctionData;

    if (gameState.assets.cash < discountedDownPayment) {
        alert('보증금이 부족합니다!');
        return;
    }

    const loanAmount = discountedCost - discountedDownPayment;
    const monthlyLoanPayment = Math.round(loanAmount * 0.04 / 12);

    gameState.assets.cash -= discountedDownPayment;
    gameState.assets.realEstate += discountedCost;
    // 투자부동산 담보대출은 별도 관리 (liabilities.mortgage에 추가하지 않음)
    gameState.income.rental += opportunity.monthlyIncome;
    gameState.expenses.loan += monthlyLoanPayment;

    gameState.investments.push({
        type: 'realEstate',
        name: opportunity.name + ' (경매)',
        cost: discountedCost,
        downPayment: discountedDownPayment,
        loan: loanAmount,
        monthlyLoanPayment: monthlyLoanPayment,
        monthlyIncome: opportunity.monthlyIncome,
        purchaseTurn: turn
    });

    window.currentAuctionOpportunity = null;
    hideEventModal();
    showNotification(`${opportunity.name} 경매 낙찰! 40% 할인!`, 'success');
    nextTurn();
    updateUI();
}

// 매수자 등장 (프리미엄에 매도)
function showBuyerOpportunity(realEstateInvestments) {
    const targetProperty = realEstateInvestments[Math.floor(Math.random() * realEstateInvestments.length)];
    const premium = 10 + Math.floor(Math.random() * 20);  // 10~30% 프리미엄
    const offerPrice = Math.round(targetProperty.cost * (1 + premium / 100));

    showEventModal(
        '🤵 매수자 등장!',
        `<div class="space-y-4">
            <p class="text-lg">당신의 부동산에 관심있는 매수자가 나타났습니다!</p>

            <div class="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between">
                    <span>매물</span>
                    <span class="font-bold">${targetProperty.name}</span>
                </div>
                <div class="flex justify-between">
                    <span>매입가</span>
                    <span>₩${fmt(targetProperty.cost)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>제시가</span>
                    <span class="font-bold text-emerald-400">₩${fmt(offerPrice)}만 (+${premium}%)</span>
                </div>
                <div class="flex justify-between">
                    <span>대출 잔액</span>
                    <span class="text-orange-400">₩${fmt(targetProperty.loan || 0)}만</span>
                </div>
                <div class="border-t border-gray-600 my-2"></div>
                <div class="flex justify-between">
                    <span>예상 순이익</span>
                    <span class="font-bold text-yellow-400">₩${fmt(offerPrice - (targetProperty.loan || 0))}만</span>
                </div>
            </div>
        </div>`,
        [
            {
                text: '매도하기',
                action: `sellToBuyer(${gameState.investments.indexOf(targetProperty)}, ${offerPrice});`,
                primary: true
            },
            { text: '거절', action: 'hideEventModal(); nextTurn(); updateUI();' }
        ]
    );
}

function sellToBuyer(investmentIdx, offerPrice) {
    const inv = gameState.investments[investmentIdx];
    if (!inv) {
        hideEventModal();
        nextTurn();
        updateUI();
        return;
    }

    // 부동산 매도 처리
    const profit = offerPrice - inv.cost;
    gameState.assets.cash += offerPrice;
    gameState.assets.realEstate -= inv.cost;

    if (inv.loan) {
        gameState.assets.cash -= inv.loan;  // 대출 상환
        // 투자부동산 담보대출은 별도 관리되므로 liabilities.mortgage에서 차감하지 않음
        const monthlyLoanPayment = inv.monthlyLoanPayment || Math.round(inv.loan * 0.04 / 12);
        gameState.expenses.loan = Math.max(0, gameState.expenses.loan - monthlyLoanPayment);
    }

    if (inv.monthlyIncome) {
        gameState.income.rental = Math.max(0, gameState.income.rental - inv.monthlyIncome);
    }

    gameState.investments.splice(investmentIdx, 1);

    hideEventModal();
    showNotification(`${inv.name} 매도 완료! 수익 +₩${fmt(profit)}만`, 'success');
    nextTurn();
    updateUI();
}

// 부동산 시장 정보만 보기
function showRealEstateMarketInfo() {
    const priceChanges = updateRealEstatePrices();

    const upCount = priceChanges.filter(c => parseFloat(c.changePercent) > 0).length;
    const downCount = priceChanges.filter(c => parseFloat(c.changePercent) < 0).length;
    const marketTrend = upCount > downCount ? '상승세' : (upCount < downCount ? '하락세' : '보합');
    const trendColor = upCount > downCount ? 'text-emerald-400' : (upCount < downCount ? 'text-red-400' : 'text-gray-400');

    showEventModal(
        '🏠 부동산 시장 동향',
        `<div class="space-y-4">
            <p class="text-center">
                <span class="text-gray-400">현재 부동산 시장: </span>
                <span class="${trendColor} font-bold text-xl">${marketTrend}</span>
            </p>

            <div class="bg-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                ${priceChanges.map(c => `
                    <div class="flex justify-between text-sm">
                        <span>${c.name}</span>
                        <span class="${parseFloat(c.changePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                            ${parseFloat(c.changePercent) >= 0 ? '+' : ''}${c.changePercent}%
                        </span>
                    </div>
                `).join('')}
            </div>

            <p class="text-sm text-gray-400">투자 탭에서 현재 시세를 확인할 수 있습니다.</p>
        </div>`,
        [
            { text: '투자하러 가기', action: 'goToMarketTab();', primary: true },
            { text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();' }
        ]
    );
}

// 주식/ETF 이벤트 핸들러
function handleStockEvent() {
    const stockEvents = [
        {
            name: '📉 감자 (자본감소)',
            desc: '보유 주식 중 하나가 감자를 실시합니다!',
            type: 'reduction',
            effect: '보유 주식 수량 -30%'
        },
        {
            name: '📈 무상증자',
            desc: '회사가 무상증자를 실시하여 보너스 주식을 받습니다!',
            type: 'bonus',
            effect: '보유 주식 수량 +20%'
        },
        {
            name: '💰 유상증자 참여 기회',
            desc: '할인된 가격으로 추가 주식을 매수할 수 있습니다!',
            type: 'rights',
            effect: '현재가의 70%에 매수 가능'
        },
        {
            name: '✂️ 액면분할',
            desc: '주식이 분할되어 수량이 늘어납니다!',
            type: 'split',
            effect: '주식 수량 2배, 가격 1/2'
        },
        {
            name: '💵 특별배당',
            desc: '회사가 특별배당을 지급합니다!',
            type: 'dividend',
            effect: '보유 주식 가치의 5% 현금 지급'
        },
        {
            name: '🔥 상장폐지 위기',
            desc: '보유 주식 중 하나가 상장폐지 위기에 처했습니다!',
            type: 'delist',
            effect: '해당 주식 가치 -50%'
        },
        {
            name: '🚀 기관 대량매수',
            desc: '기관투자자가 대량 매수하여 주가가 급등합니다!',
            type: 'surge',
            effect: '보유 주식 가치 +25%'
        }
    ];

    const event = stockEvents[Math.floor(Math.random() * stockEvents.length)];

    // 보유 주식 확인
    const stockInvestments = gameState.investments.filter(inv => inv.type === 'stocks' && inv.shares > 0);

    if (stockInvestments.length === 0 && ['reduction', 'bonus', 'split', 'dividend', 'delist', 'surge'].includes(event.type)) {
        // 보유 주식이 없으면 유상증자만 가능
        showEventModal(
            '📊 주식 투자 기회!',
            `<p>주식 관련 이벤트가 발생했지만, 보유 중인 주식이 없습니다.</p>
             <p class="mt-2 text-gray-400">투자 탭에서 주식을 매수해보세요!</p>`,
            [
                { text: '투자하러 가기', action: 'goToMarketTab();', primary: true },
                { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
            ]
        );
        return;
    }

    // 랜덤 주식 선택 (이벤트에 영향받을 주식)
    const targetStock = stockInvestments.length > 0 ? stockInvestments[Math.floor(Math.random() * stockInvestments.length)] : null;

    showEventModal(
        event.name,
        `<p class="text-lg">${event.desc}</p>
         ${targetStock ? `<p class="mt-2 text-yellow-400">대상: ${targetStock.name} (${targetStock.shares}주)</p>` : ''}
         <p class="mt-2 p-2 bg-gray-800 rounded text-sm">${event.effect}</p>`,
        getStockEventActions(event, targetStock)
    );
}

// 주식 이벤트 액션 생성
function getStockEventActions(event, targetStock) {
    switch (event.type) {
        case 'reduction': // 감자
            return [
                { text: '확인 (가치 -30%)', action: `applyStockReduction(${gameState.investments.indexOf(targetStock)});`, primary: true }
            ];
        case 'bonus': // 무상증자
            return [
                { text: '보너스 주식 받기', action: `applyBonusShares(${gameState.investments.indexOf(targetStock)});`, primary: true }
            ];
        case 'rights': // 유상증자
            return [
                { text: '70% 가격에 매수', action: `showRightsOfferingModal();`, primary: true },
                { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
            ];
        case 'split': // 액면분할
            return [
                { text: '확인', action: `applyStockSplit(${gameState.investments.indexOf(targetStock)});`, primary: true }
            ];
        case 'dividend': // 특별배당
            return [
                { text: '배당금 받기', action: `applySpecialDividend(${gameState.investments.indexOf(targetStock)});`, primary: true }
            ];
        case 'delist': // 상장폐지 위기
            return [
                { text: '확인 (가치 -50%)', action: `applyDelistRisk(${gameState.investments.indexOf(targetStock)});`, primary: true }
            ];
        case 'surge': // 기관 대량매수
            return [
                { text: '확인 (가치 +25%)', action: `applyInstitutionalBuy(${gameState.investments.indexOf(targetStock)});`, primary: true }
            ];
        default:
            return [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }];
    }
}

// 감자 적용 (주식 수량 감소)
function applyStockReduction(idx) {
    const inv = gameState.investments[idx];
    if (!inv) { hideEventModal(); nextTurn(); updateUI(); return; }

    // 주식 수량 30% 감소 (감자)
    const reducedShares = Math.floor(inv.shares * 0.3);
    const oldShares = inv.shares;
    inv.shares -= reducedShares;

    // 수량에 비례하여 원가도 감소
    const costReduction = Math.round(inv.cost * (reducedShares / oldShares));
    inv.cost -= costReduction;
    gameState.assets.stocks -= costReduction;

    showNotification(`${inv.name} 감자로 주식 ${reducedShares}주 감소 (${oldShares}주 → ${inv.shares}주)`, 'error');
    hideEventModal();
    nextTurn();
    updateUI();
}

// 무상증자 적용
function applyBonusShares(idx) {
    const inv = gameState.investments[idx];
    if (!inv) { hideEventModal(); nextTurn(); updateUI(); return; }

    const bonusShares = Math.floor(inv.shares * 0.2);
    inv.shares += bonusShares;

    showNotification(`${inv.name} 무상증자 +${bonusShares}주!`, 'success');
    hideEventModal();
    nextTurn();
    updateUI();
}

// 유상증자 모달
function showRightsOfferingModal() {
    hideEventModal();

    const stocks = ['삼성전자', 'SK하이닉스', '네이버', '애플', '테슬라', '엔비디아'];
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    const currentPrice = marketPrices[randomStock];
    const discountPrice = Math.round(currentPrice * 0.7 * 100) / 100;
    const maxShares = Math.floor(gameState.assets.cash / discountPrice);

    if (maxShares <= 0) {
        showNotification('현금이 부족하여 유상증자에 참여할 수 없습니다.', 'error');
        nextTurn();
        updateUI();
        return;
    }

    // Store for callback
    window._rightsOfferingData = { randomStock, discountPrice };

    showPurchaseModal({
        title: '💰 유상증자 참여',
        itemName: randomStock,
        price: discountPrice,
        maxQuantity: maxShares,
        step: 1,
        unit: '주',
        description: `30% 할인 (원래가: ₩${fmt(currentPrice)}만)`,
        buttonText: '유상증자 참여',
        onConfirm: (shares) => {
            executeRightsOffering(shares);
        }
    });
}

function executeRightsOffering(shares) {
    const { randomStock, discountPrice } = window._rightsOfferingData || {};
    if (!randomStock) return;

    const totalCost = Math.round(discountPrice * shares * 100) / 100;

    gameState.assets.cash -= totalCost;
    gameState.assets.stocks += totalCost;

    // 기존 보유 주식에 추가하거나 새로 생성
    const existing = gameState.investments.find(inv => inv.type === 'stocks' && inv.name === randomStock);
    if (existing) {
        existing.shares += shares;
        existing.cost += totalCost;
    } else {
        gameState.investments.push({
            type: 'stocks',
            name: randomStock,
            cost: totalCost,
            shares: shares,
            pricePerShare: discountPrice,
            monthlyIncome: 0
        });
    }

    showNotification(`${randomStock} ${shares}주 유상증자 참여 완료!`, 'success');
    delete window._rightsOfferingData;
    nextTurn();
    updateUI();
}

// 액면분할 적용
function applyStockSplit(idx) {
    const inv = gameState.investments[idx];
    if (!inv) { hideEventModal(); nextTurn(); updateUI(); return; }

    inv.shares *= 2;
    inv.pricePerShare = inv.pricePerShare ? inv.pricePerShare / 2 : marketPrices[inv.name] / 2;

    showNotification(`${inv.name} 액면분할! ${inv.shares}주로 증가`, 'success');
    hideEventModal();
    nextTurn();
    updateUI();
}

// 특별배당 적용
function applySpecialDividend(idx) {
    const inv = gameState.investments[idx];
    if (!inv) { hideEventModal(); nextTurn(); updateUI(); return; }

    const dividend = Math.round(inv.cost * 0.05);
    gameState.assets.cash += dividend;

    showNotification(`${inv.name} 특별배당 +₩${fmt(dividend)}만!`, 'success');
    hideEventModal();
    nextTurn();
    updateUI();
}

// 상장폐지 위기 적용
function applyDelistRisk(idx) {
    const inv = gameState.investments[idx];
    if (!inv) { hideEventModal(); nextTurn(); updateUI(); return; }

    const loss = Math.round(inv.cost * 0.5);
    inv.cost -= loss;
    gameState.assets.stocks -= loss;

    showNotification(`${inv.name} 상장폐지 위기 -₩${fmt(loss)}만`, 'error');
    hideEventModal();
    nextTurn();
    updateUI();
}

// 기관 대량매수 적용
function applyInstitutionalBuy(idx) {
    const inv = gameState.investments[idx];
    if (!inv) { hideEventModal(); nextTurn(); updateUI(); return; }

    const gain = Math.round(inv.cost * 0.25);
    inv.cost += gain;
    gameState.assets.stocks += gain;

    showNotification(`${inv.name} 기관매수로 +₩${fmt(gain)}만!`, 'success');
    hideEventModal();
    nextTurn();
    updateUI();
}

// 가상자산 이벤트
function handleCryptoEvent() {
    const cryptoEvents = [
        { name: '🔥 하드포크', desc: '새로운 코인이 에어드랍됩니다!', type: 'airdrop', effect: '보유 코인 수량 +10%' },
        { name: '🐋 고래 매도', desc: '대량 매도로 가격이 급락합니다!', type: 'dump', effect: '가상자산 가치 -20%' },
        { name: '🚀 호재 발표', desc: '대형 호재로 가격이 급등합니다!', type: 'pump', effect: '가상자산 가치 +30%' },
        { name: '💰 스테이킹 보너스', desc: '특별 스테이킹 이벤트!', type: 'stakingBonus', effect: '스테이킹 보상 2배 지급' }
    ];

    const event = cryptoEvents[Math.floor(Math.random() * cryptoEvents.length)];
    const cryptoInvestments = gameState.investments.filter(inv => inv.type === 'crypto');

    if (cryptoInvestments.length === 0) {
        showEventModal(
            '💎 가상자산 기회!',
            `<p>가상자산 관련 이벤트가 발생했지만, 보유 중인 코인이 없습니다.</p>
             <p class="mt-2 text-gray-400">투자 탭에서 가상자산을 매수해보세요!</p>`,
            [
                { text: '투자하러 가기', action: 'goToMarketTab();', primary: true },
                { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
            ]
        );
        return;
    }

    showEventModal(
        event.name,
        `<p class="text-lg">${event.desc}</p>
         <p class="mt-2 p-2 bg-gray-800 rounded text-sm">${event.effect}</p>`,
        [{ text: '확인', action: `applyCryptoEvent('${event.type}');`, primary: true }]
    );
}

// 가상자산 이벤트 적용
function applyCryptoEvent(type) {
    const cryptoInvestments = gameState.investments.filter(inv => inv.type === 'crypto');

    switch (type) {
        case 'airdrop':
            cryptoInvestments.forEach(inv => {
                if (inv.amount) inv.amount *= 1.1;
            });
            showNotification('에어드랍으로 코인 +10%!', 'success');
            break;
        case 'dump':
            cryptoInvestments.forEach(inv => {
                inv.cost = Math.round(inv.cost * 0.8);
            });
            gameState.assets.crypto = Math.round(gameState.assets.crypto * 0.8);
            showNotification('고래 매도로 가치 -20%', 'error');
            break;
        case 'pump':
            cryptoInvestments.forEach(inv => {
                inv.cost = Math.round(inv.cost * 1.3);
            });
            gameState.assets.crypto = Math.round(gameState.assets.crypto * 1.3);
            showNotification('호재로 가치 +30%!', 'success');
            break;
        case 'stakingBonus':
            const stakingInvs = cryptoInvestments.filter(inv => inv.isStaking);
            if (stakingInvs.length > 0) {
                stakingInvs.forEach(inv => {
                    const bonus = inv.monthlyReward || 0;
                    inv.amount += bonus;
                });
                showNotification('스테이킹 보너스 2배 지급!', 'success');
            } else {
                showNotification('스테이킹 중인 코인이 없습니다.', 'warning');
            }
            break;
    }

    hideEventModal();
    nextTurn();
    updateUI();
}

// Go to market tab function
function goToMarketTab() {
    hideEventModal();
    showTab('market');
    nextTurn();
    updateUI();
}

// Market handler - 실제로 시장 가격 변동 적용 (자산별 다른 비율)
function handleMarket(space) {
    const isUp = space.name.includes('상승');

    // Apply market event to prices (now with different rates per asset)
    const changes = applyMarketEvent(isUp);

    // Sort changes by absolute change percent (most dramatic first)
    changes.sort((a, b) => Math.abs(parseFloat(b.changePercent)) - Math.abs(parseFloat(a.changePercent)));

    // Create affected assets summary with individual percentages
    const topChanges = changes.slice(0, 7);
    const affectedSummary = topChanges.map(c => {
        const pct = parseFloat(c.changePercent);
        const colorClass = pct >= 0 ? 'text-emerald-400' : 'text-red-400';
        const sign = pct >= 0 ? '+' : '';
        return `<div class="flex justify-between text-sm">
            <span>${c.name}</span>
            <span class="${colorClass}">${sign}${c.changePercent}%</span>
        </div>`;
    }).join('');

    showEventModal(
        space.name,
        `<p class="text-lg mb-3">시장이 ${isUp ? '상승' : '하락'}했습니다!</p>
         <p class="text-xs text-gray-400 mb-2">자산별로 서로 다른 비율로 변동합니다.</p>
         <div class="p-3 bg-gray-800 rounded-lg mb-3">
            <div class="text-xs text-gray-400 mb-2">영향받은 자산 (${changes.length}개)</div>
            ${affectedSummary}
            ${changes.length > 7 ? `<div class="text-xs text-gray-500 mt-2">외 ${changes.length - 7}개...</div>` : ''}
         </div>
         <p class="text-sm text-gray-400">
            보유 자산 가치가 자산 특성에 따라 변동되었습니다.
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

// Baby handler (최대 3명까지, 직업별 양육비)
function handleBaby() {
    const player = getPlayer();
    const childcareCost = player.childcareCost || 30;
    const MAX_CHILDREN = 3;

    // 이미 3명이면 더 이상 추가 안됨
    if (gameState.children >= MAX_CHILDREN) {
        showEventModal(
            '👶 출산 소식!',
            `<p class="text-lg">아기가 태어날 뻔했지만...</p>
             <p class="text-yellow-400 font-bold mt-2">이미 자녀가 ${MAX_CHILDREN}명입니다!</p>
             <p class="text-gray-400 mt-2">더 이상 자녀를 가질 수 없습니다.</p>
             <div class="mt-3 p-3 bg-gray-800 rounded-lg text-sm">
                <div class="flex justify-between"><span>현재 자녀수</span><span>${gameState.children}명</span></div>
                <div class="flex justify-between"><span>월 양육비</span><span class="text-red-400">₩${fmt(childcareCost * gameState.children)}만</span></div>
             </div>`,
            [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
        );
        return;
    }

    const oldExpenses = getTotalExpenses();
    gameState.children++;
    const newExpenses = getTotalExpenses();

    showEventModal(
        '👶 아기 탄생!',
        `<p class="text-lg">축하합니다! 아기가 태어났습니다!</p>
         <p class="text-yellow-400 font-bold">자녀수: ${gameState.children}명 / ${MAX_CHILDREN}명</p>
         <p class="text-red-400 mt-2">월 지출 +₩${fmt(childcareCost)}만 (양육비)</p>
         <div class="mt-3 p-3 bg-gray-800 rounded-lg text-sm">
            <div class="flex justify-between"><span>기존 지출</span><span>₩${fmt(oldExpenses)}만</span></div>
            <div class="flex justify-between text-red-400"><span>양육비 추가 (${player.job || '기본'})</span><span>+₩${fmt(childcareCost)}만</span></div>
            <div class="border-t border-gray-600 my-2"></div>
            <div class="flex justify-between font-bold"><span>새 총 지출</span><span>₩${fmt(newExpenses)}만</span></div>
            <div class="flex justify-between text-gray-400"><span>총 양육비</span><span>₩${fmt(childcareCost * gameState.children)}만/월</span></div>
         </div>`,
        [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
    );
}

// Layoff handler - 2턴 쉬기 적용
function handleLayoff() {
    const expenses = getTotalExpenses();

    // 지출 1회분 차감
    gameState.assets.cash -= expenses;

    // 현금이 부족하면 신용대출 발생
    if (gameState.assets.cash < 0) {
        const shortage = Math.abs(gameState.assets.cash);
        gameState.liabilities.credit += shortage;
        gameState.expenses.loan += Math.round(shortage * getCreditRate() / 100 / 12);
        gameState.assets.cash = 0;
    }

    showEventModal(
        '😢 퇴사!',
        `<div class="space-y-3">
            <p class="text-lg text-center">퇴사하게 되었습니다...</p>
            <div class="p-4 bg-red-900/30 rounded-lg">
                <div class="flex justify-between mb-2">
                    <span>지출 1회 납부</span>
                    <span class="text-red-400 font-bold">-₩${fmt(expenses)}만</span>
                </div>
                <div class="text-xs text-gray-400">퇴직금 없이 바로 지출을 내야합니다.</div>
            </div>
            <p class="text-sm text-gray-400 text-center">현재 현금: ₩${fmt(gameState.assets.cash)}만</p>
        </div>`,
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

// Business handler (Fast Track) - 사업 투자
function handleBusiness(space) {
    const cost = space.cost;
    const monthlyIncome = space.monthlyIncome;

    if (gameState.assets.cash < cost) {
        showEventModal(
            `${space.name} 투자 기회`,
            `<p class="text-lg">${space.name}</p>
             <p class="text-gray-400 mt-2">월 수익: ₩${fmt(monthlyIncome)}만</p>
             <p class="text-red-400 mt-3 font-bold">자금이 부족합니다!</p>
             <p class="text-yellow-400">필요: ₩${fmt(cost)}만</p>
             <p class="text-gray-400">보유: ₩${fmt(gameState.assets.cash)}만</p>`,
            [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
        );
        return;
    }

    showEventModal(
        `${space.name} 투자 기회`,
        `<p class="text-lg font-bold text-emerald-400">${space.name}</p>
         <p class="text-gray-400 mt-2">사업에 투자하여 월 패시브 소득을 올리세요!</p>
         <div class="mt-3 p-3 bg-gray-800 rounded-lg">
            <div class="flex justify-between text-sm"><span>투자 비용</span><span class="text-yellow-400">₩${fmt(cost)}만</span></div>
            <div class="flex justify-between text-sm"><span>월 수익</span><span class="text-emerald-400">+₩${fmt(monthlyIncome)}만</span></div>
         </div>
         <p class="mt-3 text-sm text-gray-400">보유 현금: ₩${fmt(gameState.assets.cash)}만</p>`,
        [
            { text: '투자하기', action: `investBusiness('${space.name}', ${cost}, ${monthlyIncome});`, primary: true },
            { text: '패스', action: 'hideEventModal(); nextTurn(); updateUI();' }
        ]
    );
}

// Invest in business
function investBusiness(name, cost, monthlyIncome) {
    if (gameState.assets.cash < cost) {
        showNotification('현금이 부족합니다!', 'error');
        return;
    }

    gameState.assets.cash -= cost;
    gameState.income.other += monthlyIncome;

    // Add to investments for tracking
    gameState.investments.push({
        type: 'business',
        name: name,
        cost: cost,
        monthlyIncome: monthlyIncome
    });

    hideEventModal();

    showNotification(`${name}에 투자 완료! 월 수익 +₩${fmt(monthlyIncome)}만`, 'success');

    // Check for fast track victory
    checkFastTrackVictory();

    nextTurn();
    updateUI();
}

// Disaster handler (Fast Track) - 이혼, 세무감사, 소송
function handleDisaster(space) {
    const currentCash = gameState.assets.cash;
    const lostAmount = Math.floor(currentCash / 2);

    // 화면 흔들림 효과
    if (typeof shakeScreen === 'function') {
        shakeScreen('hard');
    }

    // 화면 플래시 효과
    if (typeof flashScreen === 'function') {
        flashScreen('error');
    }

    let message = '';
    let emoji = '';

    if (space.name.includes('이혼')) {
        emoji = '💔';
        message = '이혼 소송으로 재산의 절반을 잃었습니다...';
    } else if (space.name.includes('세무감사')) {
        emoji = '📋';
        message = '세무감사에서 탈세가 적발되어 과징금을 내야 합니다!';
    } else if (space.name.includes('소송')) {
        emoji = '⚖️';
        message = '소송에서 패소하여 거액의 합의금을 지불해야 합니다!';
    }

    gameState.assets.cash -= lostAmount;

    showEventModal(
        `${emoji} ${space.name}`,
        `<div class="text-center">
            <div class="text-5xl mb-4">${emoji}</div>
            <p class="text-lg text-red-400 font-bold">${message}</p>
            <div class="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div class="text-sm text-gray-400">손실 금액</div>
                <div class="text-2xl font-bold text-red-400">-₩${fmt(lostAmount)}만</div>
                <div class="text-sm text-gray-500 mt-1">(보유 현금의 50%)</div>
            </div>
            <p class="mt-3 text-gray-400">남은 현금: ₩${fmt(gameState.assets.cash)}만</p>
        </div>`,
        [{ text: '확인', action: 'hideEventModal(); nextTurn(); updateUI();', primary: true }]
    );
}

// Check fast track victory condition (월 패시브 소득 5000만원)
function checkFastTrackVictory() {
    if (!gameState.inFastTrack) return;

    const passiveIncome = getPassiveIncome();

    if (passiveIncome >= FAST_TRACK_WIN_PASSIVE) {
        const player = getPlayer();

        document.getElementById('victoryMessage').textContent =
            `월 패시브 소득 ₩${fmt(passiveIncome)}만 달성! 진정한 부자가 되었습니다!`;
        document.getElementById('victoryModal').classList.remove('hidden');

        player.dreamAchieved = true;
    }
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
    actionsEl.innerHTML = actions.map(a => {
        let btnClass = 'bg-gray-600 hover:bg-gray-700';
        if (a.primary) {
            if (a.color === 'green') {
                btnClass = 'bg-green-600 hover:bg-green-700';
            } else {
                btnClass = 'bg-emerald-600 hover:bg-emerald-700';
            }
        }
        return `<button onclick="${a.action}"
            class="px-4 py-2 rounded-lg font-bold ${btnClass}">
            ${a.text}
        </button>`;
    }).join('');

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
