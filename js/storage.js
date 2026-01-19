// ==========================================
// 저장/불러오기 기능
// ==========================================

// Save game to localStorage
function saveGame() {
    const saveData = {
        version: 2,
        timestamp: Date.now(),
        numPlayers,
        currentPlayer,
        turn,
        players: players.map(p => ({
            position: p.position,
            inFastTrack: p.inFastTrack,
            job: p.job,
            jobPreset: p.jobPreset,
            dream: p.dream,
            dreamAchieved: p.dreamAchieved,
            income: { ...p.income },
            expenses: { ...p.expenses },
            assets: { ...p.assets },
            liabilities: { ...p.liabilities },
            investments: [...p.investments],
            children: p.children,
            childcareCost: p.childcareCost,
            skipTurns: p.skipTurns,
            doubleDice: p.doubleDice,
            auctionCount: p.auctionCount
        })),
        marketPrices: { ...marketPrices },
        priceHistory: { ...priceHistory },
        realEstateMarketPrices: { ...realEstateMarketPrices },
        realEstatePriceHistory: { ...realEstatePriceHistory }
    };

    try {
        localStorage.setItem('cashflowGame', JSON.stringify(saveData));
        showNotification('게임이 저장되었습니다!', 'success');
        return true;
    } catch (e) {
        console.error('Save failed:', e);
        showNotification('저장 실패: 저장 공간이 부족합니다.', 'error');
        return false;
    }
}

// Load game from localStorage
function loadGame() {
    try {
        const saveData = localStorage.getItem('cashflowGame');
        if (!saveData) {
            showNotification('저장된 게임이 없습니다.', 'warning');
            return false;
        }

        const data = JSON.parse(saveData);

        // Version check
        if (data.version < 2) {
            showNotification('이전 버전의 저장 데이터입니다. 새 게임을 시작해주세요.', 'warning');
            return false;
        }

        numPlayers = data.numPlayers;
        currentPlayer = data.currentPlayer;
        turn = data.turn;

        players = data.players.map(p => ({
            position: p.position,
            inFastTrack: p.inFastTrack,
            job: p.job,
            jobPreset: p.jobPreset,
            dream: p.dream,
            dreamAchieved: p.dreamAchieved || false,
            income: { ...p.income },
            expenses: { ...p.expenses },
            assets: { ...p.assets },
            liabilities: { ...p.liabilities },
            investments: [...(p.investments || [])],
            children: p.children || 0,
            childcareCost: p.childcareCost || 30,
            skipTurns: p.skipTurns || 0,
            doubleDice: p.doubleDice || 0,
            auctionCount: p.auctionCount || 0
        }));

        if (data.marketPrices) {
            marketPrices = { ...data.marketPrices };
        }

        if (data.priceHistory) {
            priceHistory = { ...data.priceHistory };
        }

        if (data.realEstateMarketPrices) {
            realEstateMarketPrices = { ...data.realEstateMarketPrices };
        }

        if (data.realEstatePriceHistory) {
            realEstatePriceHistory = { ...data.realEstatePriceHistory };
        }

        // Hide setup modal and update UI
        document.getElementById('setupModal').classList.add('hidden');
        document.getElementById('turnCount').textContent = turn;
        updateCurrentPlayerDisplay();
        updateUI();
        drawBoard();

        showNotification('게임을 불러왔습니다!', 'success');
        return true;
    } catch (e) {
        console.error('Load failed:', e);
        showNotification('불러오기 실패: 저장 데이터가 손상되었습니다.', 'error');
        return false;
    }
}

// Reset game
function resetGame() {
    if (!confirm('정말로 게임을 초기화하시겠습니까? 모든 진행 상황이 삭제됩니다.')) {
        return;
    }

    // Reset market prices
    marketPrices = { ...basePrices };
    initPriceHistory();

    // Reset players
    numPlayers = 1;
    currentPlayer = 0;
    setupPlayer = 0;
    turn = 1;
    players = [createPlayer()];

    // Show setup modal
    document.getElementById('setupModal').classList.remove('hidden');
    document.getElementById('turnCount').textContent = turn;

    // Reset setup UI
    setNumPlayers(1);
    updateSetupPlayerTabs();
    loadSetupPlayerData();

    updateUI();
    drawBoard();

    showNotification('게임이 초기화되었습니다.', 'info');
}

// Delete saved game
function deleteSave() {
    if (!confirm('저장된 게임을 삭제하시겠습니까?')) {
        return;
    }

    localStorage.removeItem('cashflowGame');
    showNotification('저장된 게임이 삭제되었습니다.', 'info');
}

// Export game data as JSON file
function exportGame() {
    const saveData = {
        version: 2,
        timestamp: Date.now(),
        numPlayers,
        currentPlayer,
        turn,
        players: players.map(p => ({
            position: p.position,
            inFastTrack: p.inFastTrack,
            job: p.job,
            jobPreset: p.jobPreset,
            dream: p.dream,
            dreamAchieved: p.dreamAchieved,
            income: { ...p.income },
            expenses: { ...p.expenses },
            assets: { ...p.assets },
            liabilities: { ...p.liabilities },
            investments: [...p.investments],
            children: p.children,
            childcareCost: p.childcareCost,
            skipTurns: p.skipTurns,
            doubleDice: p.doubleDice,
            auctionCount: p.auctionCount
        })),
        marketPrices: { ...marketPrices },
        priceHistory: { ...priceHistory },
        realEstateMarketPrices: { ...realEstateMarketPrices },
        realEstatePriceHistory: { ...realEstatePriceHistory }
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow_save_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('게임 데이터가 내보내기되었습니다.', 'success');
}

// Import game data from JSON file
function importGame(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.version < 2) {
                showNotification('지원하지 않는 버전입니다.', 'error');
                return;
            }

            // Apply imported data
            numPlayers = data.numPlayers;
            currentPlayer = data.currentPlayer;
            turn = data.turn;

            players = data.players.map(p => ({
                position: p.position,
                inFastTrack: p.inFastTrack,
                job: p.job,
                jobPreset: p.jobPreset,
                dream: p.dream,
                dreamAchieved: p.dreamAchieved || false,
                income: { ...p.income },
                expenses: { ...p.expenses },
                assets: { ...p.assets },
                liabilities: { ...p.liabilities },
                investments: [...(p.investments || [])],
                children: p.children || 0,
                skipTurns: p.skipTurns || 0,
                doubleDice: p.doubleDice || 0
            }));

            if (data.marketPrices) {
                marketPrices = { ...data.marketPrices };
            }

            if (data.priceHistory) {
                priceHistory = { ...data.priceHistory };
            }

            if (data.realEstateMarketPrices) {
                realEstateMarketPrices = { ...data.realEstateMarketPrices };
            }

            if (data.realEstatePriceHistory) {
                realEstatePriceHistory = { ...data.realEstatePriceHistory };
            }

            document.getElementById('setupModal').classList.add('hidden');
            document.getElementById('turnCount').textContent = turn;
            updateCurrentPlayerDisplay();
            updateUI();
            drawBoard();

            showNotification('게임 데이터를 가져왔습니다!', 'success');
        } catch (e) {
            console.error('Import failed:', e);
            showNotification('가져오기 실패: 파일 형식이 올바르지 않습니다.', 'error');
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all transform translate-x-0`;

    const colors = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    notification.classList.add(colors[type] || colors.info);
    notification.innerHTML = `<span class="mr-2">${icons[type]}</span>${message}`;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Auto-save every 5 minutes
let autoSaveInterval = null;

function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
        // Only auto-save if game is in progress
        if (!document.getElementById('setupModal').classList.contains('hidden')) return;
        saveGame();
    }, 5 * 60 * 1000); // 5 minutes
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

