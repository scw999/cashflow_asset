// ==========================================
// 게임 보드 렌더링
// ==========================================

// Icon mapping for spaces
function getSpaceIcon(name) {
    if (name.includes('월급')) return '💰';
    if (name.includes('부동산') || name.includes('원룸') || name.includes('경매')) return '🏠';
    if (name.includes('상승')) return '📈';
    if (name.includes('하락')) return '📉';
    if (name.includes('충동')) return '🛒';
    if (name.includes('주식') || name.includes('ETF')) return '📊';
    if (name.includes('기부')) return '❤️';
    if (name.includes('가상') || name.includes('스테이킹')) return '💎';
    if (name.includes('아기')) return '👶';
    if (name.includes('상가')) return '🏢';
    if (name.includes('해고')) return '😢';
    if (name.includes('섬')) return '🏝️';
    if (name.includes('우주')) return '🚀';
    if (name.includes('성구매')) return '🏰';
    if (name.includes('예술')) return '🎨';
    if (name.includes('슈퍼카')) return '🏎️';
    if (name.includes('세계')) return '🌍';
    if (name.includes('자선')) return '🏥';
    if (name.includes('꿈달성')) return '🎯';
    return '●';
}

// Draw the game board
function drawBoard() {
    const svg = document.getElementById('gameBoard');
    let html = '';
    const cx = 300, cy = 300;
    const r1 = 250; // Outer track (Rat Race) - 크기 증가
    const r2 = 140; // Inner track (Fast Track)
    const spaceRadius = 28; // 칸 크기 증가
    const fastSpaceRadius = 26;

    // Draw track paths (neon effect)
    // Outer track path
    html += `<circle cx="${cx}" cy="${cy}" r="${r1}" class="track-path track-path-outer" />`;
    // Inner track path
    html += `<circle cx="${cx}" cy="${cy}" r="${r2}" class="track-path track-path-inner" />`;

    // Draw Rat Race spaces
    ratRaceSpaces.forEach((space, i) => {
        const angle = (i / ratRaceSpaces.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r1 * Math.cos(angle);
        const y = cy + r1 * Math.sin(angle);

        html += `
            <g class="track-space" onclick="showSpaceInfo(${i}, false)" data-space="${i}">
                <circle cx="${x}" cy="${y}" r="${spaceRadius}" fill="${space.color}"
                    stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
                <text x="${x}" y="${y + 2}" text-anchor="middle" dominant-baseline="middle"
                    font-size="20" style="font-family: 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif; pointer-events: none;">
                    ${getSpaceIcon(space.name)}
                </text>
            </g>
        `;
    });

    // Draw Fast Track spaces
    fastTrackSpaces.forEach((space, i) => {
        const angle = (i / fastTrackSpaces.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r2 * Math.cos(angle);
        const y = cy + r2 * Math.sin(angle);

        // Highlight if this is player's dream
        const player = getPlayer();
        const isDream = player.dream && space.name.toLowerCase().includes(
            dreams.find(d => d.id === player.dream)?.name.substring(2).toLowerCase() || ''
        );

        html += `
            <g class="track-space" onclick="showSpaceInfo(${i}, true)" data-space="${i}">
                <circle cx="${x}" cy="${y}" r="${fastSpaceRadius}" fill="${space.color}"
                    stroke="${isDream ? '#fff' : 'rgba(251,191,36,0.4)'}"
                    stroke-width="${isDream ? 4 : 2}"/>
                <text x="${x}" y="${y + 2}" text-anchor="middle" dominant-baseline="middle"
                    font-size="18" style="font-family: 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif; pointer-events: none;">
                    ${getSpaceIcon(space.name)}
                </text>
            </g>
        `;
    });

    // Draw Player Tokens
    players.forEach((player, pIdx) => {
        const track = player.inFastTrack ? fastTrackSpaces : ratRaceSpaces;
        const radius = player.inFastTrack ? r2 : r1;
        const trackLength = track.length;

        const baseAngle = (player.position / trackLength) * Math.PI * 2 - Math.PI / 2;
        // Offset tokens slightly if multiple players on same space
        const offset = pIdx * 0.08;
        const angle = baseAngle + offset;

        const tokenRadius = player.inFastTrack ? r2 - 45 : r1 - 45;
        const px = cx + tokenRadius * Math.cos(angle);
        const py = cy + tokenRadius * Math.sin(angle);

        const isCurrentTurn = pIdx === currentPlayer;
        const tokenSize = isCurrentTurn ? 18 : 14;

        html += `
            <g class="${isCurrentTurn ? 'token-current' : ''}">
                <circle class="token" cx="${px}" cy="${py}" r="${tokenSize}"
                    fill="${isCurrentTurn ? '#fff' : '#333'}"
                    stroke="${playerColors[pIdx]}" stroke-width="4"/>
                <text x="${px}" y="${py + 2}" text-anchor="middle" dominant-baseline="middle"
                    font-size="${isCurrentTurn ? 18 : 14}"
                    style="font-family: 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif; pointer-events: none;">
                    ${playerEmojis[pIdx]}
                </text>
            </g>
        `;
    });

    // Center display
    const currentP = getPlayer();
    html += `
        <circle cx="${cx}" cy="${cy}" r="60" fill="rgba(30, 41, 59, 0.9)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        <text x="${cx}" y="${cy - 20}" text-anchor="middle" font-size="14" fill="#9ca3af">
            ${currentP.inFastTrack ? '패스트 트랙' : '쥐 레이스'}
        </text>
        <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="22" fill="#fbbf24" font-weight="bold">
            턴 ${turn}
        </text>
        <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="14" fill="${playerColors[currentPlayer]}">
            P${currentPlayer + 1} ${currentP.job || ''}
        </text>
    `;

    svg.innerHTML = html;
}

// Show space information
function showSpaceInfo(idx, isFast) {
    const space = isFast ? fastTrackSpaces[idx] : ratRaceSpaces[idx];
    let info = `${space.name}\n타입: ${space.type}`;

    if (space.cost) {
        info += `\n비용: ₩${fmt(space.cost)}만`;
    }

    if (space.type === 'opportunity' && !isFast) {
        info += '\n\n이 칸에 도착하면 투자 기회를 얻습니다!';
    }

    alert(info);
}

// Dice rolling
function rollDice() {
    const player = getPlayer();

    // Check if player needs to skip turn
    if (player.skipTurns > 0) {
        player.skipTurns--;
        alert(`해고로 인해 ${player.skipTurns + 1}턴을 쉬어야 합니다.`);
        nextTurn();
        updateUI();
        return;
    }

    const dice = document.getElementById('dice');
    dice.classList.add('rolling');
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    let rolls = 0;
    const interval = setInterval(() => {
        dice.textContent = diceEmojis[Math.floor(Math.random() * 6)];
        if (++rolls > 10) {
            clearInterval(interval);
            dice.classList.remove('rolling');

            let result = Math.floor(Math.random() * 6) + 1;

            // Double dice if charity bonus active
            if (player.doubleDice > 0) {
                const second = Math.floor(Math.random() * 6) + 1;
                result += second;
                player.doubleDice--;
                dice.textContent = `${diceEmojis[result - second - 1]} + ${diceEmojis[second - 1]}`;
            } else {
                dice.textContent = diceEmojis[result - 1];
            }

            movePlayer(result);
        }
    }, 100);
}

// Move player
function movePlayer(steps) {
    const track = gameState.inFastTrack ? fastTrackSpaces : ratRaceSpaces;
    gameState.position = (gameState.position + steps) % track.length;
    drawBoard();
    setTimeout(() => triggerEvent(track[gameState.position]), 500);
}

// Trigger event based on space
function triggerEvent(space) {
    const card = document.getElementById('eventCard');
    const title = document.getElementById('eventTitle');
    const desc = document.getElementById('eventDesc');
    const priceInfo = document.getElementById('priceChangeInfo');

    currentEvent = { type: space.type, space };
    title.textContent = space.name;
    priceInfo.classList.add('hidden');

    switch (space.type) {
        case 'payday':
            const cf = getCashflow();
            desc.textContent = `월급날입니다! 캐시플로우 ₩${fmt(cf)}만원이 들어옵니다.`;
            break;

        case 'opportunity':
            if (space.name.includes('부동산') || space.name.includes('원룸') ||
                space.name.includes('경매') || space.name.includes('상가')) {
                // Real estate opportunity
                desc.textContent = '부동산 투자 기회가 왔습니다! 매물을 확인하세요.';
                currentEvent.isRealEstate = true;
            } else {
                desc.textContent = '투자 기회가 왔습니다! 투자시장 탭에서 주식/가상자산을 확인하세요.';
            }
            break;

        case 'doodad':
            const doodadCost = Math.floor(Math.random() * 50 + 20);
            currentEvent.cost = doodadCost;
            desc.textContent = `충동구매! ₩${doodadCost}만원을 지출합니다.`;
            break;

        case 'market':
            const change = space.name.includes('상승')
                ? Math.floor(Math.random() * 20 + 10)
                : -Math.floor(Math.random() * 20 + 10);
            currentEvent.change = change;
            desc.textContent = `시장이 ${change > 0 ? '상승' : '하락'}했습니다! 투자자산 ${Math.abs(change)}% ${change > 0 ? '상승' : '하락'}.`;
            break;

        case 'baby':
            desc.textContent = '축하합니다! 아기가 태어났습니다. 월 지출이 ₩30만원 증가합니다.';
            break;

        case 'charity':
            const charityAmount = Math.floor(getTotalExpenses() * 0.1);
            currentEvent.cost = charityAmount;
            desc.textContent = `기부 기회! ₩${fmt(charityAmount)}만원을 기부하면 다음 3턴간 주사위 2개를 굴릴 수 있습니다.`;
            break;

        case 'layoff':
            desc.textContent = '해고되었습니다! 2턴을 쉬어야 합니다. (월급은 받지 못합니다)';
            break;

        case 'dream':
            if (space.cost > 0) {
                const player = getPlayer();
                const canAfford = gameState.assets.cash >= space.cost;
                const isDream = checkDreamAchieved(space);

                if (isDream) {
                    desc.textContent = `🌟 당신의 꿈입니다! ${space.name}을 ₩${fmt(space.cost)}만원에 달성할 수 있습니다!`;
                } else if (canAfford) {
                    desc.textContent = `${space.name}을 ₩${fmt(space.cost)}만원에 구매할 수 있습니다.`;
                } else {
                    desc.textContent = `${space.name}을 구매하려면 ₩${fmt(space.cost)}만원이 필요합니다. (보유: ₩${fmt(gameState.assets.cash)}만)`;
                }
            } else {
                desc.textContent = '🎯 축하합니다! 경제적 자유를 달성했습니다!';
            }
            break;
    }

    card.classList.remove('hidden');
}

// Handle event confirmation
function handleEvent() {
    if (!currentEvent) return;

    const player = getPlayer();

    switch (currentEvent.type) {
        case 'payday':
            gameState.assets.cash += getCashflow();
            // Process staking rewards
            const rewards = processStakingRewards();
            if (rewards.length > 0) {
                rewards.forEach(r => {
                    console.log(`${r.name} 스테이킹 보상: +${r.reward.toFixed(4)} (₩${fmt(r.value)}만)`);
                });
            }
            break;

        case 'opportunity':
            if (currentEvent.isRealEstate) {
                // Show real estate opportunity modal
                showRealEstateOpportunity();
            }
            break;

        case 'doodad':
            gameState.assets.cash -= currentEvent.cost;
            if (gameState.assets.cash < 0) {
                // Take out loan if not enough cash
                const shortage = Math.abs(gameState.assets.cash);
                gameState.liabilities.credit += shortage;
                gameState.expenses.loan += Math.round(shortage * 0.08 / 12);
                gameState.assets.cash = 0;
                alert(`현금 부족! ₩${fmt(shortage)}만원 신용대출 발생`);
            }
            break;

        case 'market':
            const pct = 1 + currentEvent.change / 100;
            gameState.assets.stocks = Math.floor(gameState.assets.stocks * pct);
            gameState.assets.crypto = Math.floor(gameState.assets.crypto * pct);

            // Update individual investments
            gameState.investments.forEach(inv => {
                if (inv.type === 'stocks' || inv.type === 'crypto') {
                    if (inv.shares) {
                        inv.cost = Math.floor(inv.cost * pct);
                    } else if (inv.amount && !inv.isStable) {
                        inv.cost = Math.floor(inv.cost * pct);
                    }
                }
            });
            break;

        case 'baby':
            gameState.children++;
            gameState.expenses.living += 30;
            break;

        case 'charity':
            if (gameState.assets.cash >= currentEvent.cost) {
                gameState.assets.cash -= currentEvent.cost;
                player.doubleDice = 3;
                alert('기부 완료! 3턴간 주사위 2개를 굴립니다.');
            } else {
                alert('현금이 부족하여 기부할 수 없습니다.');
            }
            break;

        case 'layoff':
            player.skipTurns = 2;
            break;

        case 'dream':
            if (checkDreamAchieved(currentEvent.space)) {
                purchaseDream(currentEvent.space);
            } else if (currentEvent.space.cost > 0 && gameState.assets.cash >= currentEvent.space.cost) {
                if (confirm(`${currentEvent.space.name}을 ₩${fmt(currentEvent.space.cost)}만원에 구매하시겠습니까?`)) {
                    gameState.assets.cash -= currentEvent.space.cost;
                    alert(`${currentEvent.space.name}을 구매했습니다!`);
                }
            } else if (currentEvent.space.cost === 0) {
                // 꿈달성! 칸
                if (player.dream === 'freedom') {
                    player.dreamAchieved = true;
                    document.getElementById('victoryMessage').textContent = '경제적 자유를 달성했습니다!';
                    document.getElementById('victoryModal').classList.remove('hidden');
                }
            }
            break;
    }

    document.getElementById('eventCard').classList.add('hidden');

    // Update market prices
    const priceChanges = updateMarketPrices();
    showPriceChangesNotification(priceChanges);

    // Next turn
    nextTurn();

    updateUI();
    checkEscape();
    currentEvent = null;
}

// Show price changes notification
function showPriceChangesNotification(changes) {
    const sorted = [...changes].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    const topMovers = sorted.slice(0, 5);

    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 card rounded-xl p-4 z-40 notification';
    notification.innerHTML = `
        <div class="text-sm font-bold mb-2">📊 시장 변동</div>
        ${topMovers.map(m => `
            <div class="text-xs flex justify-between gap-4">
                <span>${m.name}</span>
                <span class="${parseFloat(m.changePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                    ${parseFloat(m.changePercent) >= 0 ? '+' : ''}${m.changePercent}%
                </span>
            </div>
        `).join('')}
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Show real estate opportunity
function showRealEstateOpportunity() {
    // 부동산 시세 업데이트 (부동산 칸에 도착시 등락)
    const priceChanges = updateRealEstatePrices();

    // 상승한 부동산 개수 계산
    const upCount = priceChanges.filter(c => parseFloat(c.changePercent) > 0).length;
    const downCount = priceChanges.filter(c => parseFloat(c.changePercent) < 0).length;
    const marketTrend = upCount > downCount ? '상승세' : (upCount < downCount ? '하락세' : '보합');
    const trendColor = upCount > downCount ? 'text-emerald-400' : (upCount < downCount ? 'text-red-400' : 'text-gray-400');

    const opportunity = realEstateOpportunities[Math.floor(Math.random() * realEstateOpportunities.length)];
    const content = document.getElementById('opportunityContent');

    // 추가 이벤트 체크 (30% 확률로 매수자 등장)
    const realEstateInvestments = gameState.investments.filter(inv => inv.type === 'realEstate');
    const hasBuyerEvent = realEstateInvestments.length > 0 && Math.random() < 0.3;
    let buyerEventHtml = '';

    if (hasBuyerEvent) {
        const targetProperty = realEstateInvestments[Math.floor(Math.random() * realEstateInvestments.length)];
        const premium = 10 + Math.floor(Math.random() * 20);
        const offerPrice = Math.round(targetProperty.cost * (1 + premium / 100));
        buyerEventHtml = `
            <div class="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xl">🤵</span>
                    <span class="font-bold text-yellow-400">매수자 등장!</span>
                </div>
                <p class="text-sm text-gray-300">당신의 <span class="text-yellow-300">${targetProperty.name}</span>을 <span class="text-emerald-400">₩${fmt(offerPrice)}만 (+${premium}%)</span>에 사고 싶어합니다!</p>
                <button onclick="sellToBuyerFromOpportunity(${gameState.investments.indexOf(targetProperty)}, ${offerPrice})"
                    class="mt-2 w-full py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-bold">
                    매도하기
                </button>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="space-y-4">
            <div class="text-center">
                <div class="text-3xl mb-2">🏠</div>
                <h3 class="text-xl font-bold">${opportunity.name}</h3>
                <p class="text-gray-400 text-sm">${opportunity.desc}</p>
            </div>

            <div class="p-2 bg-gray-800 rounded-lg text-center text-sm mb-2">
                <span class="text-gray-400">부동산 시장: </span>
                <span class="${trendColor} font-bold">${marketTrend}</span>
                <span class="text-xs text-gray-500 ml-2">(${upCount}개 상승, ${downCount}개 하락)</span>
            </div>

            <div class="p-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-sm space-y-1">
                <div class="flex justify-between items-center">
                    <span class="text-orange-400">🔥 급매 (20%↓):</span>
                    <span class="font-bold ${getPlayer().urgentSaleCount >= 2 ? 'text-emerald-400' : 'text-yellow-400'}">${getPlayer().urgentSaleCount || 0} / 2</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-purple-400">⚖️ 경매 (40%↓):</span>
                    <span class="font-bold ${getPlayer().auctionCount >= 3 ? 'text-emerald-400' : 'text-yellow-400'}">${getPlayer().auctionCount || 0} / 3</span>
                </div>
                <div class="text-xs text-gray-500 text-center mt-1 pt-1 border-t border-gray-600">
                    ${getPlayer().urgentSaleCount >= 2 || getPlayer().auctionCount >= 3
                        ? '✨ 카운트 충족! 할인 기회 등장 확률 발생'
                        : '카운트가 차면 할인 기회가 나타날 확률이 생깁니다'}
                </div>
            </div>

            <div class="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between">
                    <span>매매가</span>
                    <span class="font-bold">₩${fmt(opportunity.cost)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>필요 계약금 (20%)</span>
                    <span class="font-bold text-yellow-400">₩${fmt(opportunity.downPayment)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>예상 월 임대수익</span>
                    <span class="font-bold text-emerald-400">₩${fmt(opportunity.monthlyIncome)}만</span>
                </div>
                <div class="flex justify-between">
                    <span>대출금</span>
                    <span class="text-orange-400">₩${fmt(opportunity.cost - opportunity.downPayment)}만</span>
                </div>
            </div>

            <div class="text-sm text-gray-400">
                보유 현금: ₩${fmt(gameState.assets.cash)}만
                ${gameState.assets.cash < opportunity.downPayment ? `<span class="text-red-400 ml-2">(₩${fmt(opportunity.downPayment - gameState.assets.cash)}만 부족)</span>` : ''}
            </div>

            ${gameState.assets.cash < opportunity.downPayment && (gameState.assets.stocks > 0 || gameState.assets.crypto > 0) ? `
            <div class="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <p class="text-blue-400 text-sm font-bold mb-2">💼 자산 매도로 현금 마련</p>
                <div class="space-y-2 text-sm">
                    ${gameState.assets.stocks > 0 ? `
                    <div class="flex justify-between items-center">
                        <span>📈 주식/ETF: ₩${fmt(gameState.assets.stocks)}만</span>
                        <button onclick="sellPortfolioForPurchase('stocks', ${opportunity.downPayment})"
                            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">매도</button>
                    </div>` : ''}
                    ${gameState.assets.crypto > 0 ? `
                    <div class="flex justify-between items-center">
                        <span>💎 가상자산: ₩${fmt(gameState.assets.crypto)}만</span>
                        <button onclick="sellPortfolioForPurchase('crypto', ${opportunity.downPayment})"
                            class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs">매도</button>
                    </div>` : ''}
                </div>
            </div>` : ''}

            <div class="flex gap-2">
                <button onclick="buyRealEstateOpportunity(${JSON.stringify(opportunity).replace(/"/g, '&quot;')})"
                    class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold ${gameState.assets.cash < opportunity.downPayment ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${gameState.assets.cash < opportunity.downPayment ? 'disabled' : ''}>
                    구매하기
                </button>
                <button onclick="hideOpportunityModal()"
                    class="flex-1 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg">
                    패스
                </button>
            </div>

            ${buyerEventHtml}
        </div>
    `;

    document.getElementById('opportunityModal').classList.remove('hidden');
}

// 부동산 기회창에서 매도하기
function sellToBuyerFromOpportunity(investmentIdx, offerPrice) {
    const inv = gameState.investments[investmentIdx];
    if (!inv) {
        hideOpportunityModal();
        return;
    }

    const profit = offerPrice - inv.cost;
    gameState.assets.cash += offerPrice;
    gameState.assets.realEstate -= inv.cost;

    if (inv.loan) {
        gameState.assets.cash -= inv.loan;
        gameState.liabilities.mortgage -= inv.loan;
        const monthlyLoanPayment = Math.round(inv.loan * 0.04 / 12);
        gameState.expenses.loan -= monthlyLoanPayment;
    }

    if (inv.monthlyIncome) {
        gameState.income.rental -= inv.monthlyIncome;
    }

    gameState.investments.splice(investmentIdx, 1);

    closeOpportunityModalOnly();
    showNotification(`${inv.name} 매도 완료! 수익 +₩${fmt(profit)}만`, 'success');
    nextTurn();
    updateUI();
}

// 포트폴리오 자산 매도 (부동산 구매를 위해)
function sellPortfolioForPurchase(assetType, neededAmount) {
    const shortage = neededAmount - gameState.assets.cash;

    if (assetType === 'stocks') {
        const stockInvestments = gameState.investments.filter(inv => inv.type === 'stocks');
        if (stockInvestments.length === 0 || gameState.assets.stocks <= 0) {
            showNotification('매도할 주식이 없습니다.', 'warning');
            return;
        }

        // 필요한 만큼만 매도 (부족한 금액 + 여유분)
        const sellAmount = Math.min(gameState.assets.stocks, shortage + 100);
        const sellRatio = sellAmount / gameState.assets.stocks;

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

        // 빈 투자 제거
        gameState.investments = gameState.investments.filter(inv => inv.type !== 'stocks' || inv.shares > 0);

        showNotification(`주식 ₩${fmt(sellAmount)}만 매도 완료!`, 'success');

    } else if (assetType === 'crypto') {
        const cryptoInvestments = gameState.investments.filter(inv => inv.type === 'crypto');
        if (cryptoInvestments.length === 0 || gameState.assets.crypto <= 0) {
            showNotification('매도할 가상자산이 없습니다.', 'warning');
            return;
        }

        const sellAmount = Math.min(gameState.assets.crypto, shortage + 100);
        const sellRatio = sellAmount / gameState.assets.crypto;

        gameState.assets.cash += sellAmount;
        gameState.assets.crypto -= sellAmount;

        // 투자 기록 업데이트
        cryptoInvestments.forEach(inv => {
            if (inv.amount) {
                inv.amount = Math.round(inv.amount * (1 - sellRatio) * 10000) / 10000;
            }
            inv.cost = Math.round(inv.cost * (1 - sellRatio));
        });

        // 빈 투자 제거
        gameState.investments = gameState.investments.filter(inv => inv.type !== 'crypto' || inv.cost > 0);

        showNotification(`가상자산 ₩${fmt(sellAmount)}만 매도 완료!`, 'success');
    }

    // 모달 갱신
    updateUI();
    showRealEstateOpportunity();
}

// Buy real estate from opportunity
function buyRealEstateOpportunity(opportunity) {
    if (gameState.assets.cash < opportunity.downPayment) {
        alert('계약금이 부족합니다!');
        return;
    }

    gameState.assets.cash -= opportunity.downPayment;
    gameState.assets.realEstate += opportunity.cost;
    gameState.liabilities.mortgage += (opportunity.cost - opportunity.downPayment);
    gameState.income.rental += opportunity.monthlyIncome;

    // Add monthly loan payment
    const monthlyLoanPayment = Math.round((opportunity.cost - opportunity.downPayment) * 0.04 / 12);
    gameState.expenses.loan += monthlyLoanPayment;

    gameState.investments.push({
        type: 'realEstate',
        name: opportunity.name,
        cost: opportunity.cost,
        downPayment: opportunity.downPayment,
        loan: opportunity.cost - opportunity.downPayment,
        monthlyIncome: opportunity.monthlyIncome
    });

    closeOpportunityModalOnly();
    showNotification(`${opportunity.name} 구매 완료! 월 임대수익: ₩${fmt(opportunity.monthlyIncome)}만`, 'success');
    nextTurn();
    updateUI();
}

// 모달만 닫기 (턴 진행 없음)
function closeOpportunityModalOnly() {
    document.getElementById('opportunityModal').classList.add('hidden');
}

// 모달 닫고 턴 진행
function hideOpportunityModal() {
    closeOpportunityModalOnly();
    nextTurn();
    updateUI();
}
