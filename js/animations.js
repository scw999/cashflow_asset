// ==========================================
// 게임 애니메이션 & 이펙트
// ==========================================

// ===== Confetti Effect =====
function createConfetti(count = 100) {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    container.id = 'confettiContainer';
    document.body.appendChild(container);

    const colors = ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#f97316'];
    const shapes = ['confetti-square', 'confetti-circle', 'confetti-triangle'];

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
        confetti.style.width = `${5 + Math.random() * 10}px`;
        confetti.style.height = `${5 + Math.random() * 10}px`;
        container.appendChild(confetti);
    }

    // Remove after animation
    setTimeout(() => {
        container.remove();
    }, 5000);
}

// ===== Sparkle Effect =====
function createSparkles(element, count = 8) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';

        const angle = (i / count) * Math.PI * 2;
        const distance = 30 + Math.random() * 30;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        sparkle.style.animationDelay = `${i * 0.05}s`;

        document.body.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 1000);
    }
}

// ===== Money Bounce Animation =====
function showMoneyBounce(element, amount, isPositive = true) {
    const rect = element.getBoundingClientRect();
    const moneyEl = document.createElement('div');
    // Use money-bounce for income (goes up), money-drop for expense (goes down)
    moneyEl.className = isPositive ? 'money-bounce' : 'money-drop';
    moneyEl.textContent = `${isPositive ? '+' : '-'}₩${fmt(Math.abs(amount))}만`;
    moneyEl.style.left = `${rect.left + rect.width / 2}px`;
    moneyEl.style.top = `${rect.top}px`;
    moneyEl.style.transform = 'translateX(-50%)';

    document.body.appendChild(moneyEl);

    setTimeout(() => moneyEl.remove(), 1000);
}

// ===== Number Pop Animation =====
function animateNumberPop(element, isPositive = true) {
    const animClass = isPositive ? 'number-pop' : 'number-pop-red';
    element.classList.add(animClass);
    setTimeout(() => element.classList.remove(animClass), 500);
}

// ===== Screen Shake =====
function shakeScreen(intensity = 'normal') {
    const body = document.body;
    body.classList.add(intensity === 'hard' ? 'shake-hard' : 'shake');
    setTimeout(() => body.classList.remove('shake', 'shake-hard'), 500);
}

// ===== Success/Failure Flash =====
function flashScreen(type = 'success') {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9998;
        background: ${type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
        animation: fadeOut 0.5s ease-out forwards;
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 500);
}

// ===== Dice Animation =====
function animateDice(diceElement, onComplete) {
    diceElement.classList.add('dice-rolling');

    // Random dice faces during animation
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    let rolls = 0;
    const maxRolls = 15;

    const rollInterval = setInterval(() => {
        diceElement.textContent = diceEmojis[Math.floor(Math.random() * 6)];
        rolls++;

        if (rolls >= maxRolls) {
            clearInterval(rollInterval);
            diceElement.classList.remove('dice-rolling');
            diceElement.classList.add('dice-result');

            setTimeout(() => {
                diceElement.classList.remove('dice-result');
                if (onComplete) onComplete();
            }, 300);
        }
    }, 80);
}

// ===== 3D Dice with Canvas =====
function create3DDice(container) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    canvas.style.cssText = 'width: 100px; height: 100px;';
    container.appendChild(canvas);

    return canvas;
}

// ===== Card Flip Animation =====
function flipCard(cardElement, onFlipped) {
    cardElement.classList.add('card-flip');

    setTimeout(() => {
        if (onFlipped) onFlipped();
        cardElement.classList.remove('card-flip');
        cardElement.classList.add('card-reveal');

        setTimeout(() => {
            cardElement.classList.remove('card-reveal');
        }, 600);
    }, 300);
}

// ===== Progress Bar Animation =====
function animateProgressBar(progressElement, targetWidth, duration = 1000) {
    progressElement.style.width = '0%';
    progressElement.classList.add('progress-animated');

    requestAnimationFrame(() => {
        progressElement.style.transition = `width ${duration}ms ease-out`;
        progressElement.style.width = `${targetWidth}%`;
    });
}

// ===== Economic Cycle Background =====
function updateCycleBackground(phase) {
    const gameContainer = document.querySelector('.min-h-screen');
    if (!gameContainer) return;

    // Remove existing cycle classes
    gameContainer.classList.remove('cycle-recovery', 'cycle-boom', 'cycle-recession', 'cycle-depression');
    gameContainer.classList.add('cycle-transition');

    // Add new cycle class
    const cycleClasses = {
        'recovery': 'cycle-recovery',
        'boom': 'cycle-boom',
        'recession': 'cycle-recession',
        'depression': 'cycle-depression'
    };

    if (cycleClasses[phase]) {
        gameContainer.classList.add(cycleClasses[phase]);
    }
}

// ===== Notification with Animation =====
function showAnimatedNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-xl shadow-lg z-50 notification-enter ${
        type === 'success' ? 'bg-emerald-600' :
        type === 'error' ? 'bg-red-600' :
        type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
    }`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xl">${
                type === 'success' ? '✅' :
                type === 'error' ? '❌' :
                type === 'warning' ? '⚠️' : 'ℹ️'
            }</span>
            <span class="text-white font-medium">${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('notification-enter');
        notification.classList.add('notification-exit');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ===== Modal Animation =====
function showAnimatedModal(modalElement) {
    modalElement.classList.remove('hidden');
    const content = modalElement.querySelector('.modal-content, > div > div');
    if (content) {
        content.classList.add('modal-enter');
        setTimeout(() => content.classList.remove('modal-enter'), 300);
    }
}

function hideAnimatedModal(modalElement) {
    const content = modalElement.querySelector('.modal-content, > div > div');
    if (content) {
        content.classList.add('modal-exit');
        setTimeout(() => {
            modalElement.classList.add('hidden');
            content.classList.remove('modal-exit');
        }, 200);
    } else {
        modalElement.classList.add('hidden');
    }
}

// ===== Token Movement Animation =====
function animateTokenMove(tokenElement, fromPos, toPos) {
    tokenElement.classList.add('token-move');
    // The actual position change is handled by redrawing the board
    setTimeout(() => {
        tokenElement.classList.add('token-bounce');
        setTimeout(() => tokenElement.classList.remove('token-bounce'), 500);
    }, 500);
}

// ===== Passive Income Bar =====
function createIncomeExpenseBar(container, income, expenses) {
    const maxValue = Math.max(income, expenses) * 1.2;
    const incomePercent = (income / maxValue) * 50;
    const expensePercent = (expenses / maxValue) * 50;

    container.innerHTML = `
        <div class="income-expense-bar">
            <div class="expense-bar" style="width: ${expensePercent}%"></div>
            <div class="income-expense-divider"></div>
            <div class="income-bar" style="width: ${incomePercent}%"></div>
            <div class="progress-bar-shine"></div>
        </div>
        <div class="flex justify-between mt-1 text-xs">
            <span class="text-red-400">지출 ₩${fmt(expenses)}만</span>
            <span class="text-emerald-400">소득 ₩${fmt(income)}만</span>
        </div>
    `;
}

// ===== Hover Sound Effect (optional) =====
let hoverSoundEnabled = false;

function enableHoverSound() {
    hoverSoundEnabled = true;
}

function playHoverSound() {
    if (!hoverSoundEnabled) return;
    // Would need audio files to implement
}

// ===== Fast Track Entry Celebration =====
function celebrateFastTrackEntry() {
    // Confetti
    createConfetti(150);

    // Screen flash
    flashScreen('success');

    // Shake
    setTimeout(() => shakeScreen('normal'), 200);

    // Multiple sparkle bursts
    const gameBoard = document.getElementById('gameBoard');
    if (gameBoard) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => createSparkles(gameBoard, 12), i * 300);
        }
    }
}

// ===== Victory Celebration =====
function celebrateVictory() {
    // Rainbow confetti
    createConfetti(200);

    // Multiple flashes
    for (let i = 0; i < 3; i++) {
        setTimeout(() => flashScreen('success'), i * 200);
    }

    // Screen shake
    shakeScreen('hard');

    // Continuous sparkles
    const victoryModal = document.getElementById('victoryModal');
    if (victoryModal) {
        let sparkleCount = 0;
        const sparkleInterval = setInterval(() => {
            createSparkles(victoryModal, 8);
            sparkleCount++;
            if (sparkleCount >= 10) clearInterval(sparkleInterval);
        }, 500);
    }
}

// ===== Real Estate Card with Animation =====
function createRealEstateCard(property, isLarge = false) {
    const cardClass = isLarge ? 'real-estate-card real-estate-card-premium' : 'real-estate-card';

    return `
        <div class="${cardClass} card-hover p-4">
            <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">${isLarge ? '🏢' : '🏠'}</span>
                ${isLarge ? '<span class="px-2 py-1 bg-yellow-600 rounded-full text-xs font-bold">프리미엄</span>' : ''}
            </div>
            <h3 class="font-bold text-lg mb-1">${property.name}</h3>
            <p class="text-gray-400 text-sm mb-3">${property.desc}</p>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-400">매매가</span>
                    <span class="font-bold">₩${fmt(property.cost)}만</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">계약금</span>
                    <span class="text-yellow-400 font-bold">₩${fmt(property.downPayment)}만</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">월 수익</span>
                    <span class="text-emerald-400 font-bold">₩${fmt(property.monthlyIncome)}만</span>
                </div>
            </div>
        </div>
    `;
}

// ===== Dice Visual Upgrade =====
function createVisualDice(value, isDouble = false) {
    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const diceColors = ['', '#ef4444', '#f97316', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];

    if (isDouble) {
        const dice1 = Math.ceil(value / 2);
        const dice2 = value - dice1;
        return `
            <div class="flex items-center justify-center gap-2">
                <span class="text-4xl" style="color: ${diceColors[dice1]}; text-shadow: 0 0 10px ${diceColors[dice1]};">${diceEmojis[dice1]}</span>
                <span class="text-2xl">+</span>
                <span class="text-4xl" style="color: ${diceColors[dice2]}; text-shadow: 0 0 10px ${diceColors[dice2]};">${diceEmojis[dice2]}</span>
            </div>
        `;
    }

    return `
        <span class="text-5xl" style="color: ${diceColors[value]}; text-shadow: 0 0 15px ${diceColors[value]};">
            ${diceEmojis[value]}
        </span>
    `;
}

// ===== Player Avatar =====
function createPlayerAvatar(playerIndex, isActive = false) {
    const colors = ['#fbbf24', '#3b82f6', '#ef4444', '#10b981'];
    const emojis = ['😀', '😎', '🤠', '🦊'];

    return `
        <div class="player-avatar ${isActive ? 'player-avatar-active' : ''}"
             style="border-color: ${colors[playerIndex]};">
            <span>${emojis[playerIndex]}</span>
        </div>
    `;
}

// ===== Initialize Animations =====
function initAnimations() {
    // Add hover effects to buttons
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.classList.contains('ripple')) {
            btn.classList.add('ripple', 'btn-shine');
        }
    });

    // Add hover effects to cards
    document.querySelectorAll('.card').forEach(card => {
        if (!card.classList.contains('card-hover')) {
            card.classList.add('card-hover');
        }
    });
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
} else {
    initAnimations();
}
