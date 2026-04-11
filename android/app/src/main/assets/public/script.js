// ===== STORAGE KEY =====
const STORAGE_KEY = 'wfs_v1_storage';

// ===== THEMES =====
const THEMES = [
    { id: 'dark', label: 'Dunkel', colors: ['#111118', '#5b8dee'] },
    { id: 'slate', label: 'Slate', colors: ['#24242e', '#60a5fa'] },
    { id: 'charcoal', label: 'Kohle', colors: ['#272222', '#f97066'] },
    { id: 'forest', label: 'Wald', colors: ['#101a14', '#22c55e'] },

    { id: 'light', label: 'Hell', colors: ['#f5f5f7', '#2563eb'] },
    { id: 'stone', label: 'Stone', colors: ['#eaecf0', '#3b5bdb'] },
    { id: 'sand', label: 'Sand', colors: ['#f0ebe3', '#b45309'] },
    { id: 'midnight', label: 'Nacht', colors: ['#0d0d1f', '#8b5cf6'] },
    { id: 'sunset', label: 'Sunset', colors: ['#351b28', '#ff7b54'] },
    { id: 'lagoon', label: 'Lagoon', colors: ['#0b2730', '#19b5c9'] },
    { id: 'berry', label: 'Berry', colors: ['#2f1934', '#e85aad'] },
    { id: 'citrus', label: 'Citrus', colors: ['#fff7dd', '#84cc16'] },
];

const AVATARS = ['🎲', '🦊', '🐻', '🐼', '🐸', '🐙', '🐵', '🐯', '🐧', '🐱', '🐰', '🦁'];

const TURN_PROMPTS = [
    'Dein Zug wartet schon.',
    'Zeit für ein bisschen Würfelglück.',
    'Vielleicht kommt jetzt der große Wurf.',
    'Strategisch halten, mutig nachwürfeln.',
    'Die nächsten Punkte liegen im Becher.',
    'Auf geht’s, ein sauberer Zug wartet.'
];

// ===== GAME STATE =====
let settings = {
    rolls: 3,
    timerEnabled: false,
    timerSeconds: 30,
    theme: 'sand',
    timerStartMode: 'roll',
    elapsedStartMode: 'roll',
    directScoreConfirm: true,
    upperBonusEnabled: true,
    pointsBonusEnabled: true,
    yahtzeeBonusEnabled: true,
    holdDiceInTray: false,
    soundEnabled: true,
    toastsEnabled: true,
    headerInfoMode: 'off',
    fillOrderMode: 'off',
    mustHoldAfterRoll: false,
    carryOverRolls: false,
};
let playerData = { name: 'Spieler', avatar: '🎲', level: 0, xp: 0, bestScore: 0, games: [] }; // games: [{score, time, rolls, playerName, playedAt}]
let statsRollFilter = null;

let gameState = null;
let timerInterval = null;
let elapsedInterval = null;
let gameStartTime = 0;
let turnTimeLeft = 0;
let profileDraft = null;

let pauseStartTime = 0;
let totalPausedTime = 0;
let rollAudioContext = null;
let overlayPauseState = null;
let lastTurnPrompt = '';

const CATEGORIES = [
    // upper
    { id: 'ones', label: 'Einser', section: 'upper', diceVal: 1 },
    { id: 'twos', label: 'Zweier', section: 'upper', diceVal: 2 },
    { id: 'threes', label: 'Dreier', section: 'upper', diceVal: 3 },
    { id: 'fours', label: 'Vierer', section: 'upper', diceVal: 4 },
    { id: 'fives', label: 'Fünfer', section: 'upper', diceVal: 5 },
    { id: 'sixes', label: 'Sechser', section: 'upper', diceVal: 6 },
    // lower
    { id: 'three_of_a_kind', label: 'Dreierpasch', section: 'lower' },
    { id: 'four_of_a_kind', label: 'Viererpasch', section: 'lower' },
    { id: 'full_house', label: 'Full House (25)', section: 'lower' },
    { id: 'sm_straight', label: 'Kleine Straße (30)', section: 'lower' },
    { id: 'lg_straight', label: 'Große Straße (40)', section: 'lower' },
    { id: 'yahtzee', label: 'KNIFFEL (50)', section: 'lower' },
    { id: 'chance', label: 'Chance', section: 'lower' },
];

// ===== ICONS =====
const TROPHY_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:1.3em; height:1.3em; vertical-align:middle; fill:currentColor;">
                        <path d="M30,20 h40 v30 c0,15 -10,25 -20,25 s-20,-10 -20,-25 V20 Z" />
                        <path d="M30,30 H15 v10 c0,10 5,15 15,15 V30 Z M70,30 h15 v10 c0,10 -5,15 -15,15 V30 Z" opacity="0.7" />
                        <rect x="40" y="75" width="20" height="10" />
                        <rect x="30" y="85" width="40" height="5" rx="2" />
                        </svg>`;

// ===== LOAD / SAVE =====
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d.settings) settings = { ...settings, ...d.settings };
        if (d.playerData) playerData = { ...playerData, ...d.playerData };
        playerData.name = normalizePlayerName(playerData.name);
        if (!AVATARS.includes(playerData.avatar)) playerData.avatar = AVATARS[0];
    } catch (e) { }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, playerData }));
    } catch (e) { }
}

function normalizePlayerName(name) {
    return (name || '').trim().slice(0, 20) || 'Spieler';
}

function hasGameStarted() {
    return !!(gameState && !gameState.gameOver && gameStartTime > 0);
}

function isFillOrderMode() {
    return (settings.fillOrderMode || 'off') !== 'off';
}

function isMustHoldMode() {
    return settings.mustHoldAfterRoll !== false;
}

function isCarryOverMode() {
    return settings.carryOverRolls !== false;
}

function getFillOrderIds() {
    const ids = CATEGORIES.map(c => c.id);
    return settings.fillOrderMode === 'bottom' ? [...ids].reverse() : ids;
}

function getNextFillOrderCategoryId(scores) {
    if (!isFillOrderMode()) return null;
    return getFillOrderIds().find(id => !(id in scores)) || null;
}

function isCategoryAllowedByOrder(id, scores = gameState?.scores || {}) {
    if (!isFillOrderMode()) return true;
    return getNextFillOrderCategoryId(scores) === id;
}

function calcLowerSum(scores) {
    return ['three_of_a_kind', 'four_of_a_kind', 'full_house', 'sm_straight', 'lg_straight', 'yahtzee', 'chance']
        .reduce((s, id) => s + (scores[id] ?? 0), 0);
}

function getUpperBonusValue(scores) {
    if (!settings.upperBonusEnabled) return 0;
    return calcUpperSum(scores) >= 63 ? 35 : 0;
}

function getYahtzeeBonusValue(state = gameState) {
    if (!settings.yahtzeeBonusEnabled) return 0;
    if (!state || (state.scores?.yahtzee ?? 0) <= 0) return 0;
    return state.yahtzeeBonus || 0;
}

function getTurnRollLimit(state = gameState) {
    if (isCarryOverMode()) {
        return settings.rolls + (state?.schemaCarryover || 0);
    }
    return settings.rolls;
}

function getPointsBonusValue(elapsedSeconds) {
    if (!settings.pointsBonusEnabled) return 0;
    const secs = Math.max(0, elapsedSeconds || 0);
    if (secs <= 180) return 25;
    if (secs <= 210) return 20;
    if (secs <= 240) return 15;
    if (secs <= 270) return 10;
    if (secs <= 300) return 5;
    return 0;
}

function maybeToast(msg, force = false) {
    if (!force && settings.toastsEnabled === false) return;
    showToast(msg);
}

function updateHeaderCenterInfo() {
    const el = document.getElementById('gameHeaderCenter');
    if (!el) return;
    let text = '';
    if (settings.headerInfoMode === 'player') text = normalizePlayerName(playerData.name);
    if (settings.headerInfoMode === 'best') text = `Bestleistung ${playerData.bestScore || 0}`;
    el.textContent = text;
    el.style.visibility = text ? 'visible' : 'hidden';
}

function formatScoreName(label) {
    return label.replace(/\s*(\([^)]*\))$/, ` <span class="score-name-meta">$1</span>`);
}

function updateHeldDiceLabel() {
    const label = document.getElementById('heldDiceLabel');
    if (!label) return;
    label.classList.toggle('hidden', !hasGameStarted() || !settings.holdDiceInTray);
}

function updateHeldAreaVisibility() {
    const area = document.querySelector('.held-dice-area');
    if (!area) return;
    area.classList.toggle('hidden-mode', !settings.holdDiceInTray);
}

function syncPregameSettingsToState() {
    if (!gameState || hasGameStarted() || gameState.currentDice.length > 0) return;
    gameState.turnRollLimit = getTurnRollLimit(gameState);
    gameState.rollsLeft = gameState.turnRollLimit;
    gameState.rollsUsed = 0;
    updateRollBtn();
}

function updateSettingsAvailability() {
    const locked = hasGameStarted();
    const carryOverLocked = settings.rolls <= 1;
    const fillOrderLocked = isFillOrderMode();
    const ids = [
        'rollsDown', 'rollsUp', 'timeDown', 'timeUp',
        'timeLimitOn', 'timeLimitOff', 'timerStartRoll', 'timerStartGame',
        'elapsedStartRoll', 'elapsedStartGame', 'scoreConfirmDirect', 'scoreConfirmTwoStep',
        'upperBonusOff', 'upperBonusOn', 'pointsBonusOff', 'pointsBonusOn',
        'yahtzeeBonusOff', 'yahtzeeBonusOn', 'holdDiceOff', 'holdDiceOn',
        'fillOrderOff', 'fillOrderTop', 'fillOrderBottom',
        'mustHoldOff', 'mustHoldOn', 'carryOverOff', 'carryOverOn',
        'toastOff', 'toastOn'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = locked
            || (carryOverLocked && (id === 'carryOverOff' || id === 'carryOverOn'))
            || (fillOrderLocked && (id === 'scoreConfirmDirect' || id === 'scoreConfirmTwoStep'));
    });
    const rollsRow = document.getElementById('rollsSettingRow');
    const timeLimitRow = document.getElementById('timeLimitSettingRow');
    const timerStartModeRow = document.getElementById('timerStartModeRow');
    const elapsedStartModeRow = document.getElementById('elapsedStartModeRow');
    const zugzeitRow = document.getElementById('zugzeitRow');
    const scoreConfirmModeRow = document.getElementById('scoreConfirmModeRow');
    const upperBonusRow = document.getElementById('upperBonusRow');
    const pointsBonusRow = document.getElementById('pointsBonusRow');
    const yahtzeeBonusRow = document.getElementById('yahtzeeBonusRow');
    const holdDiceRow = document.getElementById('holdDiceRow');
    const fillOrderRow = document.getElementById('fillOrderRow');
    const mustHoldRow = document.getElementById('mustHoldRow');
    const carryOverRow = document.getElementById('carryOverRow');
    const toastRow = document.getElementById('toastRow');
    if (rollsRow) rollsRow.classList.toggle('locked', locked);
    if (timeLimitRow) timeLimitRow.classList.toggle('locked', locked);
    if (timerStartModeRow) timerStartModeRow.classList.toggle('locked', locked);
    if (elapsedStartModeRow) elapsedStartModeRow.classList.toggle('locked', locked);
    if (zugzeitRow) zugzeitRow.classList.toggle('locked', locked);
    if (scoreConfirmModeRow) scoreConfirmModeRow.classList.toggle('locked', locked || fillOrderLocked);
    if (upperBonusRow) upperBonusRow.classList.toggle('locked', locked);
    if (pointsBonusRow) pointsBonusRow.classList.toggle('locked', locked);
    if (yahtzeeBonusRow) yahtzeeBonusRow.classList.toggle('locked', locked);
    if (holdDiceRow) holdDiceRow.classList.toggle('locked', locked);
    if (fillOrderRow) fillOrderRow.classList.toggle('locked', locked);
    if (mustHoldRow) mustHoldRow.classList.toggle('locked', locked);
    if (carryOverRow) carryOverRow.classList.toggle('locked', locked || carryOverLocked);
    if (toastRow) toastRow.classList.toggle('locked', locked);
}

function isLandscapeGameLayout() {
    return window.matchMedia('(orientation: landscape) and (min-width: 900px)').matches;
}

function isCompactPortraitGameLayout() {
    return window.matchMedia('(orientation: portrait) and (max-width: 560px)').matches;
}

function getEmptyDicePrompt() {
    if (!gameState) return 'Würfle, um zu beginnen';
    if (gameState.emptyPrompt) return gameState.emptyPrompt;
    const isVeryFirstPrompt = Object.keys(gameState.scores).length === 0 && gameState.rollsUsed === 0;
    if (isVeryFirstPrompt) {
        gameState.emptyPrompt = '<div class="dice-prompt-start"><div class="dice-prompt-start-main">Würfle</div><div class="dice-prompt-start-sub">um zu beginnen</div></div>';
        return gameState.emptyPrompt;
    }

    const choices = TURN_PROMPTS.filter(prompt => prompt !== lastTurnPrompt);
    const next = choices[Math.floor(Math.random() * choices.length)] || TURN_PROMPTS[0];
    lastTurnPrompt = next;
    gameState.emptyPrompt = next;
    return next;
}

function pauseGameForOverlay() {
    if (!gameState || gameState.gameOver || overlayPauseState) return;
    overlayPauseState = {
        timerWasRunning: !!timerInterval,
        remainingTurnTime: turnTimeLeft,
        elapsedWasRunning: !!elapsedInterval
    };
    clearInterval(timerInterval);
    clearInterval(elapsedInterval);
    pauseStartTime = Date.now();
}

function resumeGameFromOverlay() {
    if (!overlayPauseState) return;
    if (pauseStartTime) {
        totalPausedTime += Date.now() - pauseStartTime;
        pauseStartTime = 0;
    }
    const state = overlayPauseState;
    overlayPauseState = null;

    if (!gameState || gameState.gameOver) return;

    if (state.elapsedWasRunning) startElapsedTimer();
    if (settings.timerEnabled && state.timerWasRunning && gameState.rollsLeft > 0 && (gameState.currentDice.length > 0 || settings.timerStartMode === 'start')) {
        turnTimeLeft = Math.max(1, state.remainingTurnTime || settings.timerSeconds);
        startTurnTimer(false);
    }
}

function ensureAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!rollAudioContext) rollAudioContext = new AudioCtx();
    if (rollAudioContext.state === 'suspended') {
        rollAudioContext.resume().catch(() => { });
    }
    return rollAudioContext;
}

function playBrowserSound(type) {
    try {
        const ctx = ensureAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.connect(ctx.destination);

        if (type === 'roll') {
            master.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

            [0, 0.045, 0.09].forEach((offset, index) => {
                const click = ctx.createOscillator();
                const clickGain = ctx.createGain();
                const t = now + offset;
                click.type = 'triangle';
                click.frequency.setValueAtTime(430 - index * 55, t);
                clickGain.gain.setValueAtTime(0.0001, t);
                clickGain.gain.exponentialRampToValueAtTime(0.045, t + 0.008);
                clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
                click.connect(clickGain);
                clickGain.connect(master);
                click.start(t);
                click.stop(t + 0.065);
            });

            const rumble = ctx.createOscillator();
            const rumbleGain = ctx.createGain();
            rumble.type = 'sine';
            rumble.frequency.setValueAtTime(160, now);
            rumble.frequency.exponentialRampToValueAtTime(115, now + 0.22);
            rumbleGain.gain.setValueAtTime(0.0001, now);
            rumbleGain.gain.exponentialRampToValueAtTime(0.035, now + 0.02);
            rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
            rumble.connect(rumbleGain);
            rumbleGain.connect(master);
            rumble.start(now);
            rumble.stop(now + 0.25);
            return;
        }

        if (type === 'kniffel') {
            master.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + index * 0.11;
                osc.type = index < 3 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(0.085, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
                osc.connect(gain);
                gain.connect(master);
                osc.start(start);
                osc.stop(start + 0.24);
            });
            return;
        }

        if (type === 'gameover') {
            master.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
            [392, 523.25, 659.25, 783.99].forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + index * 0.16;
                osc.type = index === 3 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(0.08, start + 0.025);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
                osc.connect(gain);
                gain.connect(master);
                osc.start(start);
                osc.stop(start + 0.28);
            });
        }
    } catch (e) { }
}

function playSoundEffect(type) {
    if (!settings.soundEnabled) return;
    try {
        if (typeof AndroidBridge !== 'undefined' && AndroidBridge && typeof AndroidBridge.playSound === 'function') {
            AndroidBridge.playSound(type);
            return;
        }
    } catch (e) { }
    playBrowserSound(type);
}

function playRollSound() {
    playSoundEffect('roll');
}

// ===== XP / LEVEL =====
function xpForLevel(lvl) { return 100 + lvl * 50; }
function addXP(xp) {
    playerData.xp += xp;
    while (playerData.xp >= xpForLevel(playerData.level)) {
        playerData.xp -= xpForLevel(playerData.level);
        playerData.level++;
    }
}

function xpPercent() {
    return Math.round((playerData.xp / xpForLevel(playerData.level)) * 100);
}

// ===== DICE SVG =====
function dieSVG(val, color = 'currentColor') {
    const dots = {
        1: [[50, 50]],
        2: [[25, 25], [75, 75]],
        3: [[25, 25], [50, 50], [75, 75]],
        4: [[25, 25], [75, 25], [25, 75], [75, 75]],
        5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
        6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
    };
    const d = dots[val] || dots[1];
    const circles = d.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="8" fill="${color}"/>`).join('');
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${circles}</svg>`;
}

function dieSmallSVG(val) {
    const dots = {
        1: [[50, 50]], 2: [[25, 25], [75, 75]], 3: [[25, 25], [50, 50], [75, 75]],
        4: [[25, 25], [75, 25], [25, 75], [75, 75]], 5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
        6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
    };
    const d = dots[val] || dots[1];
    return `<svg viewBox="0 0 100 100"><g>${d.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--dice-dot)"/>`).join('')}</g></svg>`;
}

function scorecardDiceSVG(val) {
    const dots = {
        1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[25, 25], [50, 50], [75, 75]],
        4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
        6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]]
    };
    const d = dots[val] || dots[1];
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" rx="14" fill="none" stroke="var(--text3)" stroke-width="8"/>${d.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="9" fill="var(--text3)"/>`).join('')}</svg>`;
}

// ===== SCORING =====
function scoreCategory(id, dice) {
    const counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const vals = Object.values(counts);
    const sum = dice.reduce((a, b) => a + b, 0);

    switch (id) {
        case 'ones': return dice.filter(d => d === 1).reduce((a, b) => a + b, 0);
        case 'twos': return dice.filter(d => d === 2).reduce((a, b) => a + b, 0);
        case 'threes': return dice.filter(d => d === 3).reduce((a, b) => a + b, 0);
        case 'fours': return dice.filter(d => d === 4).reduce((a, b) => a + b, 0);
        case 'fives': return dice.filter(d => d === 5).reduce((a, b) => a + b, 0);
        case 'sixes': return dice.filter(d => d === 6).reduce((a, b) => a + b, 0);
        case 'three_of_a_kind': return vals.some(v => v >= 3) ? sum : 0;
        case 'four_of_a_kind': return vals.some(v => v >= 4) ? sum : 0;
        case 'full_house': return (vals.includes(3) && vals.includes(2)) ? 25 : 0;
        case 'sm_straight': {
            const u = [...new Set(dice)].sort((a, b) => a - b);
            let best = 1, cur = 1;
            for (let i = 1; i < u.length; i++) { if (u[i] === u[i - 1] + 1) { cur++; best = Math.max(best, cur); } else { cur = 1; } }
            return best >= 4 ? 30 : 0;
        }
        case 'lg_straight': {
            const u = [...new Set(dice)].sort((a, b) => a - b);
            let best = 1, cur = 1;
            for (let i = 1; i < u.length; i++) { if (u[i] === u[i - 1] + 1) { cur++; best = Math.max(best, cur); } else { cur = 1; } }
            return best >= 5 ? 40 : 0;
        }
        case 'yahtzee': return vals.includes(5) ? 50 : 0;
        case 'chance': return sum;
        default: return 0;
    }
}

function calcUpperSum(scores) {
    return ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']
        .reduce((s, id) => s + (scores[id] ?? 0), 0);
}

function calcBonus(scores) {
    return getUpperBonusValue(scores);
}

function calcTotal(scores) {
    const upper = calcUpperSum(scores);
    const bonus = getUpperBonusValue(scores);
    const lower = calcLowerSum(scores);
    return upper + bonus + lower + getYahtzeeBonusValue();
}

// ===== GAME START =====
function initNewGame() {
    totalPausedTime = 0;
    pauseStartTime = 0;
    overlayPauseState = null;
    lastTurnPrompt = '';
    gameStartTime = 0;

    gameState = {
        scores: {},
        dice: [],
        held: [],
        rollsLeft: getTurnRollLimit({ schemaCarryover: 0 }),
        rollsUsed: 0,
        currentDice: [],
        emptyPrompt: 'Würfle, um zu beginnen',
        turnActive: false,
        gameOver: false,
        pendingScore: null,
        yahtzeeBonus: 0,
        schemaCarryover: 0,
        turnRollLimit: getTurnRollLimit({ schemaCarryover: 0 }),
        holdRequired: false,
        lastHeldCount: 0,
    };
}

function startGame() {
    initNewGame();
    showScreen('game-screen');
    updateHeaderCenterInfo();
    renderScorecard();
    renderDice();
    updateRollBtn();
    updateHeldAreaVisibility();
    updateHeldDiceLabel();
    const el = document.getElementById('gameTimer');
    if (el) { el.textContent = '–:––'; el.className = 'game-timer'; }
    if (settings.elapsedStartMode === 'start') {
        gameStartTime = Date.now();
        totalPausedTime = 0;
        startElapsedTimer();
    }
    if (settings.timerEnabled && settings.timerStartMode === 'start') {
        if (!gameStartTime) {
            gameStartTime = Date.now();
            totalPausedTime = 0;
            startElapsedTimer();
        }
        startTurnTimer(true);
    }
}

// ===== ELAPSED TIMER =====
function startElapsedTimer() {
    clearInterval(elapsedInterval);
    elapsedInterval = setInterval(() => {
        const secs = Math.floor((Date.now() - gameStartTime - totalPausedTime) / 1000);
        const m = Math.floor(secs / 60), s = secs % 60;
        const el = document.getElementById('gameTimer');
        if (el && !settings.timerEnabled) el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }, 1000);
}

// ===== TURN TIMER =====
function startTurnTimer(reset = true) {
    clearInterval(timerInterval);
    if (reset) turnTimeLeft = settings.timerSeconds;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        turnTimeLeft--;
        updateTimerDisplay();
        if (turnTimeLeft <= 0) {
            clearInterval(timerInterval);
            autoScore();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const el = document.getElementById('gameTimer');
    if (!el) return;
    if (settings.timerEnabled) {
        const m = Math.floor(turnTimeLeft / 60), s = turnTimeLeft % 60;
        el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        el.className = 'game-timer' + (turnTimeLeft <= 5 ? ' urgent' : '');
    }
}

function autoScore() {
    if (!gameState || gameState.gameOver) return;
    gameState.pendingScore = null;
    if (gameState.currentDice.length === 0) {
        if (settings.timerEnabled && settings.timerStartMode === 'start') {
            const avail = CATEGORIES.filter(c => !(c.id in gameState.scores) && isCategoryAllowedByOrder(c.id, gameState.scores));
            if (avail.length > 0) registerScore(avail[0].id, 0);
        }
        return;
    }
    // Force-assign to first unfilled category with its actual score value
    const avail = CATEGORIES.filter(c => !(c.id in gameState.scores) && isCategoryAllowedByOrder(c.id, gameState.scores));
    if (avail.length > 0) {
        const id = avail[0].id;
        const val = scoreCategory(id, gameState.currentDice);
        registerScore(id, val);
    }
}

// ===== ROLL DICE =====
function rollDice(playSound = true) {
    if (!gameState || gameState.rollsLeft <= 0 || gameState.gameOver) return;
    if (isMustHoldMode() && gameState.currentDice.length > 0 && gameState.holdRequired && gameState.held.length < 5) return;
    gameState.pendingScore = null;
    if (playSound) playRollSound();

    const numDice = 5;
    const isFirstRoll = gameState.currentDice.length === 0 && gameState.rollsUsed === 0
        && Object.keys(gameState.scores).length === 0;

    // Start game clock on very first roll of the game
    if (isFirstRoll && settings.elapsedStartMode === 'roll') {
        gameStartTime = Date.now();
        totalPausedTime = 0;
        startElapsedTimer();
    }

    if (gameState.currentDice.length === 0) {
        // First roll of this turn
        gameState.currentDice = Array.from({ length: numDice }, () => Math.ceil(Math.random() * 6));
    } else {
        // Re-roll non-held
        gameState.currentDice = gameState.currentDice.map((d, i) =>
            gameState.held.includes(i) ? d : Math.ceil(Math.random() * 6)
        );
    }

    gameState.rollsLeft--;
    gameState.rollsUsed++;
    gameState.emptyPrompt = '';
    gameState.lastHeldCount = gameState.held.length;
    gameState.holdRequired = isMustHoldMode() && gameState.held.length < 5;

    if (playSound && scoreCategory('yahtzee', gameState.currentDice) === 50) {
        setTimeout(() => playSoundEffect('kniffel'), 220);
    }

    renderDice(true);
    renderScorecard();
    updateRollBtn();
    if (settings.timerEnabled) startTurnTimer();
    if (isFillOrderMode() && (gameState.rollsLeft <= 0 || gameState.held.length >= 5)) {
        setTimeout(() => autoScore(), 320);
    }
}

// ===== HOLD DICE =====
function toggleHold(idx) {
    if (!gameState || gameState.currentDice.length === 0) return;
    if (gameState.rollsLeft <= 0) return;
    const pos = gameState.held.indexOf(idx);
    if (pos === -1) {
        gameState.held.push(idx);
        if (isMustHoldMode() && gameState.held.length > gameState.lastHeldCount) {
            gameState.holdRequired = false;
        }
    } else if (!isMustHoldMode()) {
        gameState.held.splice(pos, 1);
    }
    renderDice();
    updateRollBtn();
}

// ===== RENDER DICE — with animation + sorted held =====
let _prevHeld = []; // track previous held state for animation

function renderDice(animate = false) {
    const active = document.getElementById('activeDice');
    const held = document.getElementById('heldDice');
    if (!gameState) { active.innerHTML = ''; held.innerHTML = ''; _prevHeld = []; return; }
    updateHeldAreaVisibility();

    if (gameState.currentDice.length === 0) {
        active.innerHTML = `<div class="dice-prompt">${getEmptyDicePrompt()}</div>`;
        held.innerHTML = '';
        _prevHeld = [];
        updateHeldDiceLabel();
        return;
    }

    _renderDiceStatic(animate);
}

function _renderDiceStatic(animate = false) {
    const active = document.getElementById('activeDice');
    const held = document.getElementById('heldDice');
    if (!gameState) return;

    if (gameState.currentDice.length === 0) {
        active.innerHTML = `<div class="dice-prompt">${getEmptyDicePrompt()}</div>`;
        held.innerHTML = '';
        updateHeldDiceLabel();
        return;
    }

    active.innerHTML = '';
    held.innerHTML = '';

    const newlyHeld = gameState.held.filter(i => !_prevHeld.includes(i));
    const newlyUnheld = _prevHeld.filter(i => !gameState.held.includes(i));

    gameState.currentDice.forEach((val, i) => {
        const isHeld = gameState.held.includes(i);
        if (!isHeld || !settings.holdDiceInTray) {
            const d = document.createElement('div');
            const isReturning = newlyUnheld.includes(i);
            d.className = 'die' + (animate && !isHeld ? ' rolling' : '') + (isReturning ? ' entering' : '') + (isHeld ? ' held' : '');
            d.setAttribute('data-idx', i);
            d.innerHTML = dieSmallSVG(val);
            if (animate) d.style.animationDelay = (i * 0.08) + 's';
            d.addEventListener('click', () => toggleHold(i));
            d.addEventListener('touchstart', (e) => { e.preventDefault(); toggleHold(i); }, { passive: false });
            active.appendChild(d);
        }
    });

    const heldWithIdx = gameState.held
        .map(idx => ({ idx, val: gameState.currentDice[idx] }))
        .sort((a, b) => a.val - b.val || a.idx - b.idx);

    heldWithIdx.forEach(({ idx, val }) => {
        if (!settings.holdDiceInTray) return;
        const d = document.createElement('div');
        d.className = 'die-small' + (newlyHeld.includes(idx) ? ' entering' : '');
        d.setAttribute('data-idx', idx);
        d.innerHTML = dieSmallSVG(val);
        d.addEventListener('click', () => toggleHold(idx));
        d.addEventListener('touchstart', (e) => { e.preventDefault(); toggleHold(idx); }, { passive: false });
        held.appendChild(d);
    });

    if (!settings.holdDiceInTray) {
        held.innerHTML = '';
    } else if (held.children.length === 0) {
        held.innerHTML = `<div style="color:var(--text3);font-size:12px">Tippe auf einen Würfel zum Aufheben</div>`;
    }

    _prevHeld = [...gameState.held];
    updateHeldDiceLabel();
}

// ===== RENDER SCORECARD =====
function renderScorecardSection(sectionIds, includeDiceIcons = false, footerRows = '') {
    const allDice = gameState.currentDice;
    const canScore = allDice.length > 0;
    const pendingId = gameState.pendingScore ? gameState.pendingScore.id : null;
    let html = '';

    sectionIds.forEach(({ title, ids, isUpper }) => {
        html += `<div class="score-section"><div class="score-section-title">${title}</div>`;
        ids.forEach(id => {
            const cat = CATEGORIES.find(c => c.id === id);
            const filled = id in gameState.scores;
            const allowedByOrder = !filled && isCategoryAllowedByOrder(id, gameState.scores);
            const possible = canScore && !filled && allowedByOrder ? scoreCategory(id, allDice) : null;
            const filledValue = filled && id === 'yahtzee'
                ? (gameState.scores[id] || 0) + getYahtzeeBonusValue()
                : gameState.scores[id];
            const displayVal = filled ? filledValue : (possible !== null ? possible : '');
            const isPending = id === pendingId;
            const cls = filled ? 'filled' : isPending ? 'pending available' : (possible !== null ? 'available' : '');
            html += `<div class="score-row ${cls}" data-cat="${id}" onpointerup="clickScore('${id}', event)">
      <div class="score-row-left">
        ${includeDiceIcons && cat.diceVal ? `<div class="score-dice-icon">${scorecardDiceSVG(cat.diceVal)}</div>` : ''}
        <div class="score-name">${isUpper ? cat.label : formatScoreName(cat.label)}</div>
      </div>
      <div class="score-value">${displayVal}</div>
    </div>`;
        });
        if (isUpper) {
            const upperSum = calcUpperSum(gameState.scores);
            const bonus = calcBonus(gameState.scores);
            html += `<div class="score-row total-row"><div class="score-row-left"><div class="score-name">Summe</div></div><div class="score-value">${upperSum}</div></div>`;
            const bonusLabel = !settings.upperBonusEnabled
                ? 'Aus'
                : (bonus > 0 ? bonus : upperSum < 63 ? `${upperSum}/63` : '');
            html += `<div class="score-row bonus-row"><div class="score-row-left"><div class="score-name">Bonus <span class="score-name-meta">(+35 ab 63)</span></div></div><div class="score-value">${bonusLabel}</div></div>`;
        }
        html += footerRows;
        html += `</div>`;
    });
    return html;
}

function renderTotalRow(total) {
    return `<div class="score-row total-row accent-total"><div class="score-row-left"><div class="score-name">Gesamt</div></div><div class="score-value">${total}</div></div>`;
}

function renderScorecard() {
    const left = document.getElementById('scorecardLeft');
    const right = document.getElementById('scorecardRight');
    if (!left || !right || !gameState) return;

    const upperSection = [{ title: 'Obere Sektion', ids: ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'], isUpper: true }];
    const lowerSection = [{ title: 'Untere Sektion', ids: ['three_of_a_kind', 'four_of_a_kind', 'full_house', 'sm_straight', 'lg_straight', 'yahtzee', 'chance'], isUpper: false }];
    const total = calcTotal(gameState.scores);

    if (isLandscapeGameLayout() || isCompactPortraitGameLayout()) {
        left.innerHTML = renderScorecardSection(upperSection, true);
        right.innerHTML = renderScorecardSection(lowerSection, false, renderTotalRow(total));
    } else {
        left.innerHTML = renderScorecardSection(upperSection, true) + renderScorecardSection(lowerSection, false, renderTotalRow(total));
        right.innerHTML = '';
    }
}

function clickScore(id, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!gameState || gameState.gameOver) return;
    if (id in gameState.scores) return;
    if (gameState.currentDice.length === 0) return;
    if (!isCategoryAllowedByOrder(id, gameState.scores)) return;

    const val = scoreCategory(id, gameState.currentDice);
    if (settings.directScoreConfirm) {
        registerScore(id, val);
        return;
    }

    if (gameState.pendingScore && gameState.pendingScore.id === id) {
        registerScore(id, val);
        return;
    }

    gameState.pendingScore = { id, val };
    renderScorecard();
}

function registerScore(id, val) {
    if (!gameState || gameState.gameOver) return;
    const previousUpper = calcUpperSum(gameState.scores);
    if (settings.yahtzeeBonusEnabled && scoreCategory('yahtzee', gameState.currentDice) === 50 && (gameState.scores.yahtzee ?? null) === 50 && id !== 'yahtzee') {
        gameState.yahtzeeBonus += 50;
        maybeToast('Kniffel-Bonus: +50 Punkte wurden dem Kniffel-Feld gutgeschrieben.');
    }
    gameState.scores[id] = val;
    const nextUpper = calcUpperSum(gameState.scores);
    if (settings.upperBonusEnabled && previousUpper < 63 && nextUpper >= 63) {
        maybeToast('Bonus sicher: Der obere Bonus ist erreicht.');
    }
    gameState.pendingScore = null;
    clearInterval(timerInterval);
    const savedRolls = isCarryOverMode() ? gameState.rollsLeft : 0;
    gameState.currentDice = [];
    gameState.held = [];
    gameState.schemaCarryover = savedRolls;
    gameState.turnRollLimit = getTurnRollLimit(gameState);
    gameState.rollsLeft = gameState.turnRollLimit;
    gameState.rollsUsed = 0;
    gameState.emptyPrompt = '';
    gameState.holdRequired = false;
    gameState.lastHeldCount = 0;
    _prevHeld = [];

    renderDice();
    renderScorecard();
    updateRollBtn();
    updateHeldDiceLabel();

    if (Object.keys(gameState.scores).length >= 13) {
        endGame();
    } else {
        if (settings.timerEnabled && settings.timerStartMode === 'start') {
            startTurnTimer(true);
        } else {
            const el = document.getElementById('gameTimer');
            if (el) {
                if (settings.timerEnabled) {
                    el.textContent = '–:––';
                    el.className = 'game-timer';
                } else {
                    el.textContent = formatElapsed();
                    el.className = 'game-timer';
                }
            }
        }
    }
}

function formatElapsed() {
    const secs = Math.floor((Date.now() - gameStartTime - totalPausedTime) / 1000);
    return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
}

function updateRollBtn() {
    const btn = document.getElementById('rollBtn');
    if (!btn || !gameState) return;
    const nextRoll = gameState.rollsUsed + 1;
    const turnLimit = gameState.turnRollLimit || getTurnRollLimit(gameState);
    if (isMustHoldMode() && gameState.currentDice.length > 0 && gameState.held.length >= 5) {
        btn.textContent = 'Alle Würfel fixiert';
        btn.disabled = true;
    } else if (gameState.rollsLeft <= 0) {
        btn.textContent = 'Keine Würfe mehr übrig';
        btn.disabled = true;
    } else if (gameState.currentDice.length === 0) {
        btn.textContent = `Würfeln (${nextRoll}/${turnLimit})`;
        btn.disabled = false;
    } else {
        btn.textContent = isMustHoldMode() && gameState.holdRequired
            ? 'Lege erst einen Würfel ab'
            : `Nochmal würfeln (${nextRoll}/${turnLimit})`;
        btn.disabled = isMustHoldMode() && gameState.holdRequired;
    }
}

// ===== GAME OVER =====
function endGame() {
    clearInterval(timerInterval);
    clearInterval(elapsedInterval);
    gameState.gameOver = true;
    playSoundEffect('gameover');

    const elapsed = Math.floor((Date.now() - gameStartTime - totalPausedTime) / 1000);
    const baseScore = calcTotal(gameState.scores);
    const pointsBonus = getPointsBonusValue(elapsed);
    const score = baseScore + pointsBonus;
    const upper = calcUpperSum(gameState.scores);
    const bonus = calcBonus(gameState.scores);
    const lower = calcLowerSum(gameState.scores) + getYahtzeeBonusValue();

    const xpEarned = Math.floor(score / 2);
    addXP(xpEarned);
    if (score > playerData.bestScore) playerData.bestScore = score;
    playerData.games.push({ score, time: elapsed, rolls: isCarryOverMode() ? 5 : settings.rolls, playerName: playerData.name || 'Spieler', playedAt: new Date().toISOString() });
    if (playerData.games.length > 50) playerData.games = playerData.games.slice(-50);
    saveData();
    updateHeaderCenterInfo();

    const isNew = playerData.bestScore === score;
    showGameOver(score, upper, bonus, lower, xpEarned, elapsed, isNew, pointsBonus);
}

function showGameOver(score, upper, bonus, lower, xpEarned, elapsed, isNew, pointsBonus = 0) {
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
    const emoji = score >= 300 ? '🏆' : score >= 200 ? '🎯' : score >= 100 ? '🎲' : '🎰';
    // <div class="modal-icon">${emoji}${isNew ? '⭐ ' : ''}</div>

    document.getElementById('gameOverContent').innerHTML = `
    <div class="modal-title">${isNew ? 'Neuer Rekord!' : 'Spiel beendet'}</div>
    <div class="modal-score">${score}</div>
    <div class="modal-score-label">Punkte ${isNew ? '— Neuer Rekord!' : ''}</div>
    <div class="modal-xp">+${xpEarned} XP verdient • Stufe ${playerData.level}</div>
    <div class="modal-breakdown">
      <div class="modal-bd-row"><span>Obere Sektion</span><span>${upper}</span></div>
      <div class="modal-bd-row"><span>Untere Sektion</span><span>${lower}</span></div>
      <div class="modal-bd-row"><span>Sektions-Bonus</span><span>${bonus}</span></div>
      <div class="modal-bd-row"><span>Kniffel-Bonus</span><span>${getYahtzeeBonusValue()}</span></div>
      <div class="modal-bd-row"><span>Zeit-Bonus</span><span>${pointsBonus}</span></div>
      <div class="modal-bd-row"><span>Spielzeit</span><span>${timeStr}</span></div>
      <div class="modal-bd-row modal-bd-total"><span>Gesamt</span><span>${score}</span></div>
    </div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="restartGame()">Nochmal spielen</button>
      <button class="btn-secondary" onclick="goHome()">Zum Menü</button>
    </div>
  `;
    openModal('gameOverModal');
    if (score >= 250) spawnConfetti();
}

function restartGame() {
    closeModal('gameOverModal');
    startGame();
}

function goHome() {
    closeModal('gameOverModal');
    showScreen('home-screen');
    updateHomeUI();
}

// ===== PAUSE =====
function confirmPause() {
    if (gameState && !gameState.gameOver) {
        clearInterval(timerInterval);
        clearInterval(elapsedInterval);
        pauseStartTime = Date.now();
        openModal('pauseModal');
    } else {
        showScreen('home-screen');
        updateHomeUI();
    }
}

function resumeGame() {
    if (pauseStartTime) {
        totalPausedTime += Date.now() - pauseStartTime;
        pauseStartTime = 0;
    }
    closeModal('pauseModal');
    if (gameState && !gameState.gameOver && gameStartTime) startElapsedTimer();
    if (settings.timerEnabled && gameState && !gameState.gameOver && gameState.rollsLeft > 0 && (gameState.currentDice.length > 0 || settings.timerStartMode === 'start')) {
        startTurnTimer(false);
    }
}

function quitGame() {
    closeModal('pauseModal');
    clearInterval(timerInterval);
    clearInterval(elapsedInterval);
    gameStartTime = 0;
    if (gameState) gameState.pendingScore = null;
    gameState = null;
    showScreen('home-screen');
    updateHomeUI();
}

// ===== SETTINGS =====
function changeSetting(type, delta) {
    if (hasGameStarted()) return;
    if (type === 'rolls') {
        settings.rolls = Math.max(1, Math.min(5, settings.rolls + delta));
        if (settings.rolls <= 1 && settings.carryOverRolls) {
            settings.carryOverRolls = false;
            applyCarryOverUI(false);
        }
        document.getElementById('rollsVal').textContent = settings.rolls;
        document.getElementById('rollsDown').disabled = settings.rolls <= 1;
        document.getElementById('rollsUp').disabled = settings.rolls >= 5;
        syncPregameSettingsToState();
    } else if (type === 'time') {
        settings.timerSeconds = Math.max(10, Math.min(60, settings.timerSeconds + delta));
        document.getElementById('timeVal').textContent = settings.timerSeconds;
        document.getElementById('timeDown').disabled = settings.timerSeconds <= 10;
        document.getElementById('timeUp').disabled = settings.timerSeconds >= 60;
    }
    saveData();
    updateSettingsAvailability();
}

function applyTimerLimitUI(on) {
    document.getElementById('timeLimitOn').classList.toggle('active', on);
    document.getElementById('timeLimitOff').classList.toggle('active', !on);
    document.getElementById('zugzeitRow').style.opacity = on ? '1' : '0.4';
    document.getElementById('zugzeitRow').style.pointerEvents = on ? 'auto' : 'none';
    document.getElementById('timerStartModeRow').style.opacity = on ? '1' : '0.4';
    document.getElementById('timerStartModeRow').style.pointerEvents = on ? 'auto' : 'none';
}

function applyTimerStartModeUI(mode) {
    document.getElementById('timerStartRoll').classList.toggle('active', mode === 'roll');
    document.getElementById('timerStartGame').classList.toggle('active', mode === 'start');
}

function applyElapsedStartModeUI(mode) {
    document.getElementById('elapsedStartRoll').classList.toggle('active', mode === 'roll');
    document.getElementById('elapsedStartGame').classList.toggle('active', mode === 'start');
}

function applyScoreConfirmModeUI(direct) {
    document.getElementById('scoreConfirmDirect').classList.toggle('active', direct);
    document.getElementById('scoreConfirmTwoStep').classList.toggle('active', !direct);
}

function applyUpperBonusUI(on) {
    document.getElementById('upperBonusOn').classList.toggle('active', on);
    document.getElementById('upperBonusOff').classList.toggle('active', !on);
}

function applyPointsBonusUI(on) {
    document.getElementById('pointsBonusOn').classList.toggle('active', on);
    document.getElementById('pointsBonusOff').classList.toggle('active', !on);
}

function applyYahtzeeBonusUI(on) {
    document.getElementById('yahtzeeBonusOn').classList.toggle('active', on);
    document.getElementById('yahtzeeBonusOff').classList.toggle('active', !on);
}

function applyHoldDiceUI(on) {
    document.getElementById('holdDiceOn').classList.toggle('active', on);
    document.getElementById('holdDiceOff').classList.toggle('active', !on);
}

function applySoundUI(on) {
    document.getElementById('soundOn').classList.toggle('active', on);
    document.getElementById('soundOff').classList.toggle('active', !on);
}

function applyHeaderInfoUI(mode) {
    document.getElementById('headerInfoOff').classList.toggle('active', mode === 'off');
    document.getElementById('headerInfoPlayer').classList.toggle('active', mode === 'player');
    document.getElementById('headerInfoBest').classList.toggle('active', mode === 'best');
}

function applyFillOrderUI(mode) {
    document.getElementById('fillOrderOff').classList.toggle('active', mode === 'off');
    document.getElementById('fillOrderTop').classList.toggle('active', mode === 'top');
    document.getElementById('fillOrderBottom').classList.toggle('active', mode === 'bottom');
}

function applyMustHoldUI(on) {
    document.getElementById('mustHoldOn').classList.toggle('active', on);
    document.getElementById('mustHoldOff').classList.toggle('active', !on);
}

function applyCarryOverUI(on) {
    document.getElementById('carryOverOn').classList.toggle('active', on);
    document.getElementById('carryOverOff').classList.toggle('active', !on);
}

function applyToastsUI(on) {
    document.getElementById('toastOn').classList.toggle('active', on);
    document.getElementById('toastOff').classList.toggle('active', !on);
}

function setTimerLimit(on) {
    if (hasGameStarted()) return;
    settings.timerEnabled = on;
    applyTimerLimitUI(on);
    saveData();
    updateSettingsAvailability();
}

function setTimerStartMode(mode) {
    if (hasGameStarted()) return;
    settings.timerStartMode = mode;
    applyTimerStartModeUI(mode);
    saveData();
}

function setElapsedStartMode(mode) {
    if (hasGameStarted()) return;
    settings.elapsedStartMode = mode;
    applyElapsedStartModeUI(mode);
    saveData();
}

function setScoreConfirmMode(direct) {
    if (hasGameStarted()) return;
    settings.directScoreConfirm = direct;
    applyScoreConfirmModeUI(direct);
    saveData();
}

function setUpperBonusEnabled(on) {
    if (hasGameStarted()) return;
    settings.upperBonusEnabled = on;
    applyUpperBonusUI(on);
    renderScorecard();
    saveData();
}

function setPointsBonusEnabled(on) {
    if (hasGameStarted()) return;
    settings.pointsBonusEnabled = on;
    applyPointsBonusUI(on);
    renderScorecard();
    saveData();
}

function setYahtzeeBonusEnabled(on) {
    if (hasGameStarted()) return;
    settings.yahtzeeBonusEnabled = on;
    applyYahtzeeBonusUI(on);
    renderScorecard();
    saveData();
}

function setHoldDiceInTray(on) {
    if (hasGameStarted()) return;
    settings.holdDiceInTray = on;
    applyHoldDiceUI(on);
    renderDice();
    saveData();
}

function setSoundEnabled(on) {
    settings.soundEnabled = on;
    applySoundUI(on);
    saveData();
}

function setHeaderInfoMode(mode) {
    settings.headerInfoMode = mode;
    applyHeaderInfoUI(mode);
    updateHeaderCenterInfo();
    saveData();
}

function setFillOrderMode(mode) {
    if (hasGameStarted()) return;
    settings.fillOrderMode = mode;
    applyFillOrderUI(mode);
    updateSettingsAvailability();
    renderScorecard();
    saveData();
}

function setMustHoldAfterRoll(on) {
    if (hasGameStarted()) return;
    settings.mustHoldAfterRoll = on;
    applyMustHoldUI(on);
    saveData();
}

function setCarryOverRolls(on) {
    if (hasGameStarted()) return;
    if (settings.rolls <= 1 && on) return;
    settings.carryOverRolls = on;
    applyCarryOverUI(on);
    syncPregameSettingsToState();
    updateSettingsAvailability();
    saveData();
}

function setToastsEnabled(on) {
    if (hasGameStarted()) return;
    settings.toastsEnabled = on;
    applyToastsUI(on);
    saveData();
}

function openSettings() {
    pauseGameForOverlay();
    document.getElementById('rollsVal').textContent = settings.rolls;
    document.getElementById('timeVal').textContent = settings.timerSeconds;
    document.getElementById('rollsDown').disabled = settings.rolls <= 1;
    document.getElementById('rollsUp').disabled = settings.rolls >= 5;
    document.getElementById('timeDown').disabled = settings.timerSeconds <= 10;
    document.getElementById('timeUp').disabled = settings.timerSeconds >= 60;
    applyTimerLimitUI(settings.timerEnabled);
    applyTimerStartModeUI(settings.timerStartMode || 'roll');
    applyElapsedStartModeUI(settings.elapsedStartMode || 'roll');
    applyScoreConfirmModeUI(!!settings.directScoreConfirm);
    applyUpperBonusUI(settings.upperBonusEnabled !== false);
    applyPointsBonusUI(settings.pointsBonusEnabled !== false);
    applyYahtzeeBonusUI(settings.yahtzeeBonusEnabled !== false);
    applyHoldDiceUI(settings.holdDiceInTray !== false);
    applySoundUI(settings.soundEnabled !== false);
    applyHeaderInfoUI(settings.headerInfoMode || 'off');
    applyFillOrderUI(settings.fillOrderMode || 'off');
    applyMustHoldUI(settings.mustHoldAfterRoll !== false);
    applyCarryOverUI(settings.carryOverRolls !== false);
    applyToastsUI(settings.toastsEnabled !== false);
    updateSettingsAvailability();
    renderThemeGrid();
    openOverlay('settingsOverlay');
}

function renderThemeGrid() {
    const grid = document.getElementById('themeGrid');
    grid.innerHTML = THEMES.map(t => `
    <div class="theme-swatch${settings.theme === t.id ? ' active' : ''}" onclick="setTheme('${t.id}')">
      <div class="theme-swatch-circle" style="background:linear-gradient(135deg,${t.colors[0]} 50%,${t.colors[1]} 50%)"></div>
      <div class="theme-swatch-label">${t.label}</div>
    </div>
  `).join('');
}

function setTheme(id) {
    settings.theme = id;
    document.documentElement.setAttribute('data-theme', id);
    saveData();
    renderThemeGrid();
}

// ===== STATS =====
function openStats() {
    pauseGameForOverlay();
    const body = document.getElementById('statsBody');
    const games = playerData.games;
    if (!statsRollFilter) statsRollFilter = settings.rolls;
    const filteredGames = games.filter(g => (g.rolls || 3) === statsRollFilter);
    const avgScore = filteredGames.length ? Math.round(filteredGames.reduce((s, g) => s + g.score, 0) / filteredGames.length) : 0;
    const avgTime = filteredGames.length ? Math.round(filteredGames.reduce((s, g) => s + g.time, 0) / filteredGames.length) : 0;
    const at = Math.floor(avgTime / 60) + ':' + (avgTime % 60).toString().padStart(2, '0');

    const xpNeeded = xpForLevel(playerData.level);
    const sorted = [...filteredGames].sort((a, b) => b.score - a.score || a.time - b.time).slice(0, 10);
    const bestFilteredScore = filteredGames.length ? Math.max(...filteredGames.map(g => g.score || 0)) : 0;

    body.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-title">Spieler-Stufe</div>
      <div class="stat-card-value">Level ${playerData.level}</div>
      <div style="font-size:13px;color:var(--text2);margin-top:4px">${playerData.xp} / ${xpNeeded} XP</div>
      <div class="level-bar-wrap"><div class="level-bar-fill" style="width:${xpPercent()}%"></div></div>
    </div>
    <div class="stat-grid">
      <div class="stat-mini"><div class="stat-mini-label">Spiele</div><div class="stat-mini-val">${filteredGames.length}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Ø Score</div><div class="stat-mini-val">${avgScore}</div></div>
      <div class="stat-mini"><div class="stat-mini-label">Ø Zeit</div><div class="stat-mini-val">${at}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-card-title">Bestleistung</div>
      <div class="stat-card-value" style="color:var(--gold)">${bestFilteredScore}</div>
    </div>
    <div>
      <div class="setting-group-title" style="margin-bottom:10px">Bestenliste</div>
      <div class="stats-tabs">
        ${[1, 2, 3, 4, 5].map(rolls => `<button class="stats-tab${statsRollFilter === rolls ? ' active' : ''}" onclick="setStatsRollFilter(${rolls})">${rolls} Würfe</button>`).join('')}
      </div>
      ${sorted.length === 0
            ? `<div class="empty-state">Noch keine Spiele mit ${statsRollFilter} Würfen gespielt</div>`
            : `<table class="hs-table">
      <thead>
        <tr><th>#</th><th>Name</th><th>Datum</th><th>Punkte</th><th>Zeit</th></tr>
      </thead>
      <tbody>
        ${sorted.map((g, i) => {
                const m = Math.floor(g.time / 60), s = g.time % 60;
                const rankDisplay = (i === 0) ? TROPHY_SVG : (i + 1);
                const playedAt = formatPlayedAt(g.playedAt);

                return `<tr class="${i === 0 ? 'hs-gold' : ''}">
            <td class="hs-rank">${rankDisplay}</td>
            <td>${g.playerName || 'Spieler'}</td>
            <td>${playedAt}</td>
            <td class="hs-score">${g.score}</td>
            <td class="hs-time">${m}:${s.toString().padStart(2, '0')}</td>
          </tr>`;
            }).join('')}
      </tbody>
    </table>`
        }
    </div>
  `;
    openOverlay('statsOverlay');
}

function setStatsRollFilter(rolls) {
    statsRollFilter = rolls;
    openStats();
}

function formatPlayedAt(playedAt) {
    if (!playedAt) return 'Unbekannt';
    const date = new Date(playedAt);
    if (Number.isNaN(date.getTime())) return 'Unbekannt';
    return date.toLocaleDateString('de-DE');
}

// ===== PROFILE =====
function renderAvatarGrid() {
    const grid = document.getElementById('avatarGrid');
    if (!grid) return;
    grid.innerHTML = AVATARS.map(avatar => `
    <button class="avatar-option${profileDraft && profileDraft.avatar === avatar ? ' active' : ''}" onclick="selectAvatar('${avatar}')" aria-label="Avatar ${avatar}">
      ${avatar}
    </button>
  `).join('');
}

function selectAvatar(avatar) {
    if (!profileDraft) profileDraft = { name: playerData.name, avatar: playerData.avatar };
    profileDraft.avatar = avatar;
    renderAvatarGrid();
    updateProfilePreview();
}

function updateProfilePreview() {
    const input = document.getElementById('profileNameInput');
    const previewName = document.getElementById('profilePreviewName');
    const previewAvatar = document.getElementById('profilePreviewAvatar');
    if (!input || !previewName || !previewAvatar) return;
    previewName.textContent = normalizePlayerName(input.value);
    previewAvatar.textContent = (profileDraft && profileDraft.avatar) || playerData.avatar || '🎲';
}

function openProfileEditor(e) {
    if (e) e.stopPropagation();
    profileDraft = { name: playerData.name || 'Spieler', avatar: playerData.avatar || '🎲' };
    const input = document.getElementById('profileNameInput');
    if (input) input.value = profileDraft.name;
    renderAvatarGrid();
    updateProfilePreview();
    openOverlay('profileOverlay');
    setTimeout(() => {
        if (input) input.focus();
    }, 0);
}

function closeProfileEditor() {
    profileDraft = null;
    closeOverlay('profileOverlay');
}

function handleProfileOverlayClick(e) {
    if (e.target.id === 'profileOverlay') closeProfileEditor();
}

function handleProfileNameKeydown(e) {
    if (e.key === 'Enter') saveProfile();
    if (e.key === 'Escape') closeProfileEditor();
}

function saveProfile() {
    const input = document.getElementById('profileNameInput');
    playerData.name = normalizePlayerName(input ? input.value : playerData.name);
    playerData.avatar = profileDraft && AVATARS.includes(profileDraft.avatar) ? profileDraft.avatar : AVATARS[0];
    profileDraft = null;
    saveData();
    updateHomeUI();
    updateHeaderCenterInfo();
    closeOverlay('profileOverlay');
}

// ===== UI HELPERS =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function openOverlay(id) { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) {
    document.getElementById(id).classList.remove('open');
    if (id === 'settingsOverlay' || id === 'statsOverlay') resumeGameFromOverlay();
    // Scroll panel back to top after close animation
    const overlay = document.getElementById(id);
    const panel = overlay ? overlay.querySelector('.panel') : null;
    if (panel) setTimeout(() => { panel.scrollTop = 0; }, 350);
}
function handleOverlayClick(e, id) { if (e.target.id === id) closeOverlay(id); }

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function updateHomeUI() {
    document.getElementById('homeAvatar').textContent = playerData.avatar || '🎲';
    document.getElementById('homePlayerName').textContent = playerData.name || 'Spieler';
    document.getElementById('homeLvl').textContent = playerData.level;
    document.getElementById('homeXP').textContent = playerData.xp;
    document.getElementById('homeXPBar').style.width = xpPercent() + '%';
    updateHeaderCenterInfo();
}

// ===== CONFETTI =====
function spawnConfetti() {
    const wrap = document.getElementById('confettiWrap');
    wrap.innerHTML = '';
    const colors = ['var(--accent)', 'var(--green)', 'var(--gold)', 'var(--orange)'];
    for (let i = 0; i < 80; i++) {
        const el = document.createElement('div');
        el.className = 'confetto';
        el.style.cssText = `
      left:${Math.random() * 100}%;
      background:${colors[i % colors.length]};
      animation-duration:${2 + Math.random() * 2}s;
      animation-delay:${Math.random() * 0.5}s;
      transform:rotate(${Math.random() * 360}deg);
    `;
        wrap.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
}

// ===== HOME LOGO DICE =====
function renderHomeDice() {
    const vals = [1, 2, 3, 4, 5, 6];
    const wrap = document.getElementById('homeDiceDisplay');
    if (!wrap) return;
    wrap.innerHTML = vals.slice(0, 6).map(v => `
    <div class="home-logo-die">
      ${dieSmallSVG(v)}
    </div>
  `).join('');
}

// ===== LOCALSTORAGE EXPORT / IMPORT =====
const isAndroidApp = window.location.hostname === 'appassets.androidplatform.net' || window.location.protocol === 'file:';

function exportStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { alert('Keine gespeicherten Daten vorhanden.'); return; }
        const date = new Date().toISOString().slice(0, 10);
        if (isAndroidApp && window.AndroidBridge && typeof window.AndroidBridge.saveBackup === 'function') {
            const saved = window.AndroidBridge.saveBackup(raw, `kniffel-backup-${date}.json`);
            if (!saved) throw new Error('Die Datei konnte nicht gespeichert werden.');
            showToast('Backup im Download-Ordner gespeichert', true);
            return;
        }
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kniffel-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('Export fehlgeschlagen: ' + e.message);
    }
}

function importStorage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                // Validate minimal structure
                if (!parsed.settings && !parsed.playerData) {
                    throw new Error('Ungültiges Dateiformat – keine Kniffel-Daten erkannt.');
                }
                localStorage.setItem(STORAGE_KEY, ev.target.result);
                loadData();
                document.documentElement.setAttribute('data-theme', settings.theme);
                updateHomeUI();
                // Show success toast
                showToast('✅ Daten erfolgreich importiert!', true);
            } catch (err) {
                alert('Import fehlgeschlagen: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Simple toast notification
function showToast(msg, force = false) {
    if (!force && settings.toastsEnabled === false) return;
    let t = document.getElementById('appToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'appToast';
        /*
        t.style.cssText = `
          position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(20px);
          background:var(--bg3); border:1px solid var(--border2); color:var(--text);
          padding:12px 20px; border-radius:12px; font-size:14px; font-weight:500;
          box-shadow:var(--shadow); z-index:9999; opacity:0;
          transition: opacity 0.25s, transform 0.25s; white-space:nowrap;
          font-family:var(--font);
        `;
        */
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2800);
}

window.handleAndroidBack = function () {
    const openModalEl = document.querySelector('.modal-overlay.open');
    if (openModalEl) {
        if (openModalEl.id === 'pauseModal') resumeGame();
        else closeModal(openModalEl.id);
        return true;
    }

    const openOverlayEl = document.querySelector('.overlay.open');
    if (openOverlayEl) {
        if (openOverlayEl.id === 'profileOverlay') closeProfileEditor();
        else closeOverlay(openOverlayEl.id);
        return true;
    }

    const gameScreen = document.getElementById('game-screen');
    if (gameScreen && gameScreen.classList.contains('active')) {
        confirmPause();
        return true;
    }

    return false;
};

// ===== INIT =====
function init() {
    document.body.classList.toggle('native-android', isAndroidApp);
    document.documentElement.setAttribute('data-platform', isAndroidApp ? 'android-app' : 'web');
    document.addEventListener('selectstart', (e) => {
        if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLElement && e.target.isContentEditable)) {
            e.preventDefault();
        }
    });
    document.addEventListener('contextmenu', (e) => {
        if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLElement && e.target.isContentEditable)) {
            e.preventDefault();
        }
    });
    loadData();
    document.documentElement.setAttribute('data-theme', settings.theme);
    updateHeaderCenterInfo();
    updateHeldAreaVisibility();
    const unlockAudio = () => { ensureAudioContext(); };
    document.addEventListener('pointerdown', unlockAudio, { passive: true });
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('resize', () => {
        if (gameState) renderScorecard();
    });
    const rollBtn = document.getElementById('rollBtn');
    if (rollBtn) rollBtn.textContent = `Würfeln (1/${settings.rolls})`;
    updateHomeUI();
    renderHomeDice();
    /*
      // Register SW
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(()=>{});
      }*/
}

init();