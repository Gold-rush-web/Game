const BOARD_SIZE = 10;
const HOME_ROWS = {
    blue: (row) => row <= 4,
    red: (row) => row >= 5
};
const SETUP_REQUIREMENTS = { A: 2, D: 2, V: 3, C: 1, G: 4 };
const BOT_TEAM = 'red';
const BOT_MOVE_DELAY = 700;
const BOT_DIFFICULTY_LABELS = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard'
};
const DIRECTIONS = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 }
];
const DEFAULT_LAYOUT = [
    { row: 0, col: 4, team: 'blue', role: 'D' },
    { row: 0, col: 5, team: 'blue', role: 'D' },
    { row: 1, col: 3, team: 'blue', role: 'V' },
    { row: 1, col: 4, team: 'blue', role: 'G' },
    { row: 1, col: 5, team: 'blue', role: 'G' },
    { row: 1, col: 6, team: 'blue', role: 'V' },
    { row: 2, col: 3, team: 'blue', role: 'C' },
    { row: 2, col: 4, team: 'blue', role: 'G' },
    { row: 2, col: 5, team: 'blue', role: 'G' },
    { row: 2, col: 6, team: 'blue', role: 'V' },
    { row: 3, col: 2, team: 'blue', role: 'A' },
    { row: 3, col: 7, team: 'blue', role: 'A' },
    { row: 6, col: 2, team: 'red', role: 'A' },
    { row: 6, col: 7, team: 'red', role: 'A' },
    { row: 7, col: 3, team: 'red', role: 'V' },
    { row: 7, col: 4, team: 'red', role: 'G' },
    { row: 7, col: 5, team: 'red', role: 'G' },
    { row: 7, col: 6, team: 'red', role: 'V' },
    { row: 8, col: 3, team: 'red', role: 'C' },
    { row: 8, col: 4, team: 'red', role: 'G' },
    { row: 8, col: 5, team: 'red', role: 'G' },
    { row: 8, col: 6, team: 'red', role: 'V' },
    { row: 9, col: 4, team: 'red', role: 'D' },
    { row: 9, col: 5, team: 'red', role: 'D' }
];


let movesLeft = 0;
let currentPlayer = 'blue';
let selectedPos = null;
let lockedDir = null;
let boardState = [];
let setupPhase = true;
let securedGold = { blue: 0, red: 0 };
let goldHomePositions = { blue: [], red: [] };
let gameOver = false;
let dragState = null;
let setupSelection = null;
let turnSnapshot = null;
let introActive = true;
let botThinking = false;
let botEnabled = true;
let botDifficulty = 'normal';
let loadingComplete = false;
let transientBoardEffects = { movedTo: null, captures: [] };
let transientBoardEffectTimer = null;


const loadingScreen = document.getElementById('loading-screen');
const loadingStatus = document.getElementById('loading-status');
const board = document.getElementById('board');
const endgameOverlay = document.getElementById('endgame-overlay');
const endgameTitle = document.getElementById('endgame-title');
const endgameText = document.getElementById('endgame-text');
const dice = document.getElementById('dice');
const rollBtn = document.getElementById('roll-btn');
const turnIndicator = document.getElementById('turn-indicator');
const statusMsg = document.getElementById('status');
const music = document.getElementById('bg-music');
const trackStatus = document.getElementById('track-status');
const musicToggleBtn = document.getElementById('music-toggle');
const musicNextBtn = document.getElementById('music-next');
const setupPanel = document.getElementById('setup-panel');
const setupCounts = document.getElementById('setup-counts');
const setupTitle = document.getElementById('setup-title');
const setupHint = document.getElementById('setup-hint');
const clearSetupBtn = document.getElementById('clear-setup-btn');
const defaultSetupBtn = document.getElementById('default-setup-btn');
const startGameBtn = document.getElementById('start-game-btn');
const botEnabledToggle = document.getElementById('bot-enabled');
const botDifficultySelect = document.getElementById('bot-difficulty');
const blueTray = document.getElementById('blue-tray');
const redTray = document.getElementById('red-tray');


const modal = document.getElementById('rules-modal');
const openBtn = document.getElementById('open-rules');
const closeBtn = document.querySelector('.close-rules');
const modalContent = modal.querySelector('.modal-content');
const creditsModal = document.getElementById('credits-modal');
const openCreditsBtn = document.getElementById('open-credits');
const closeCreditsBtn = document.querySelector('.close-credits');
const creditsModalContent = creditsModal.querySelector('.modal-content');
const startScreen = document.getElementById('start-screen');
const enterGameBtn = document.getElementById('enter-game-btn');
const startRulesBtn = document.getElementById('start-rules-btn');


let statusToastTimer = null;


function showStatusToast() {
    if (!statusMsg) return;
    statusMsg.classList.remove('is-visible');
    void statusMsg.offsetWidth;
    statusMsg.classList.add('is-visible');
    if (statusToastTimer) clearTimeout(statusToastTimer);
    statusToastTimer = setTimeout(() => {
        statusMsg.classList.remove('is-visible');
    }, 3600);
}


if (statusMsg) {
    const statusObserver = new MutationObserver(() => {
        if (statusMsg.innerText.trim()) showStatusToast();
    });
    statusObserver.observe(statusMsg, {
        childList: true,
        subtree: true,
        characterData: true
    });
}


const playlist = ['2.mp3', '3.mp3', '4.mp3', '5.mp3'];
let currentTrackIndex = -1;
let musicStarted = false;
let userPausedMusic = false;
let lastFocusedElement = null;
let activeModal = null;


function getIconMarkup(name) {
    if (name === 'play') {
        return '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M8 5.14v13.72L19 12 8 5.14Z" fill="currentColor"/></svg>';
    }
    if (name === 'pause') {
        return '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M5 5.5v13l9-6.5-9-6.5Zm10 0h2v13h-2z" fill="currentColor"/></svg>';
}


document.body.classList.add('loading');


function finishLoadingScreen() {
    if (loadingComplete) return;
    loadingComplete = true;
    if (loadingStatus) loadingStatus.innerText = 'Assets loaded. Opening the frontier table...';
    if (loadingScreen) loadingScreen.classList.add('is-hidden');
    document.body.classList.remove('loading');
}


window.addEventListener('load', () => {
    if (loadingStatus) loadingStatus.innerText = 'Finishing the last details...';
    setTimeout(finishLoadingScreen, 350);
});


function getRandomTrackIndex(excludeIndex = -1) {
    if (playlist.length === 1) return 0;
    let nextIndex = Math.floor(Math.random() * playlist.length);
    while (nextIndex === excludeIndex) nextIndex = Math.floor(Math.random() * playlist.length);
    return nextIndex;
}


function updateMusicControls() {
    const isPaused = music.paused;
    musicToggleBtn.innerHTML = isPaused ? getIconMarkup('play') : getIconMarkup('pause');
    musicToggleBtn.setAttribute('aria-label', isPaused ? 'Play music' : 'Pause music');
    musicToggleBtn.setAttribute('title', isPaused ? 'Play music' : 'Pause music');
}


function setTrackStatus(message) {
    trackStatus.innerText = message;
}


function setIntroState(isActive) {
    introActive = isActive;
    document.body.classList.toggle('intro-active', isActive);
    if (startScreen) {
        startScreen.classList.toggle('is-hidden', !isActive);
        startScreen.setAttribute('aria-hidden', String(!isActive));
    }
}


function getFocusableModalElements(targetModal = activeModal || modal) {
    return [...targetModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.disabled && !element.hidden);
}


function openModal(targetModal, targetContent) {
    lastFocusedElement = document.activeElement;
    activeModal = targetModal;
    targetModal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
        (getFocusableModalElements(targetModal)[0] || targetContent)?.focus();
    });
}


function closeModal(targetModal) {
    targetModal.hidden = true;
    if (activeModal === targetModal) activeModal = null;
    document.body.classList.remove('modal-open');
    if (lastFocusedElement?.focus) lastFocusedElement.focus();
}


function openRulesModal() {
    openModal(modal, modalContent);
}


function closeRulesModal() {
    closeModal(modal);
}


function openCreditsModal() {
    openModal(creditsModal, creditsModalContent);
}


function closeCreditsModal() {
    closeModal(creditsModal);
}


function enterGame() {
    setIntroState(false);
    tryStartMusic();
    statusMsg.innerText = 'Board is empty. Drag or tap pieces from the trays onto the board to set up a new match.';
}


function openRulesFromStart() {
    openRulesModal();
}


function formatTrackName(fileName) {
    return fileName.replace('.mp3', '');
}


function playTrack(trackIndex) {
    currentTrackIndex = trackIndex;
    const trackFile = playlist[trackIndex];
    music.src = trackFile;
    setTrackStatus(`Now playing: Track ${formatTrackName(trackFile)}`);
    return music.play().then(() => {
        musicStarted = true;
        userPausedMusic = false;
        updateMusicControls();
    }).catch(() => {
        musicStarted = false;
        setTrackStatus('Music ready. Click anywhere or press PLAY to start.');
        updateMusicControls();
    });
}


function playRandomTrack(excludeIndex = -1) {
    return playTrack(getRandomTrackIndex(excludeIndex));
}


function tryStartMusic() {
    if (musicStarted || userPausedMusic) return;
    if (music.src) {
        music.play().then(() => {
            musicStarted = true;
            userPausedMusic = false;
            setTrackStatus(`Now playing: Track ${formatTrackName(playlist[currentTrackIndex])}`);
            updateMusicControls();
        }).catch(() => {
            setTrackStatus('Music ready. Click anywhere or press PLAY to start.');
        });
        return;
    }
    playRandomTrack(currentTrackIndex);
}


music.addEventListener('ended', () => playRandomTrack(currentTrackIndex));
musicToggleBtn.onclick = () => {
    if (music.paused) {
        if (!music.src) {
            playRandomTrack();
            return;
        }
        music.play().then(() => {
            musicStarted = true;
            userPausedMusic = false;
            setTrackStatus(`Now playing: Track ${formatTrackName(playlist[currentTrackIndex])}`);
            updateMusicControls();
        }).catch(() => {
            setTrackStatus('Browser blocked autoplay. Click the page to start music.');
        });
        return;
    }
    music.pause();
    userPausedMusic = true;
    setTrackStatus('Music paused.');
    updateMusicControls();
};
musicNextBtn.onclick = () => {
    userPausedMusic = false;
    playRandomTrack(currentTrackIndex);
};
document.addEventListener('click', tryStartMusic, { once: true });
document.addEventListener('keydown', tryStartMusic, { once: true });


function getRoleLabel(role) {
    return {
        A: 'Attacker',
        D: 'Defender',
        V: 'Villager',
        C: 'Captain',
        G: 'Gold'
    }[role] || role;
}


function getPieceTokenMarkup(team, role) {
    if (role === 'G') {
        return `
            <span class="gold-stack" aria-hidden="true">
                <span class="gold-stack__glow"></span>
                <span class="gold-stack__cart">
                    <span class="gold-stack__ore"></span>
                    <span class="gold-stack__ore gold-stack__ore--rear"></span>
                    <span class="gold-stack__wheel gold-stack__wheel--left"></span>
                    <span class="gold-stack__wheel gold-stack__wheel--right"></span>
                </span>
            </span>
        `;
    }


    return `
        <span class="piece-avatar" aria-hidden="true">
            <span class="piece-base"></span>
            <span class="piece-tool"></span>
            <span class="piece-hat"></span>
            <span class="piece-face">
                <span class="piece-eyes"></span>
                <span class="piece-smile"></span>
            </span>
            <span class="piece-beard"></span>
            <span class="piece-arms"></span>
            <span class="piece-body"></span>
            <span class="piece-feet">
                <span></span>
                <span></span>
            </span>
            <span class="piece-role-badge">${role}</span>
        </span>
    `;
}


function clearTransientBoardEffects(shouldRefresh = true) {
    if (transientBoardEffectTimer) {
        clearTimeout(transientBoardEffectTimer);
        transientBoardEffectTimer = null;
    }
    transientBoardEffects = { movedTo: null, captures: [] };
    if (!shouldRefresh || setupPhase) return;
    renderBoard();
    highlightSelectedTile();
    updateUI();
}


function scheduleTransientBoardEffects(movedTo = null, captures = []) {
    transientBoardEffects = {
        movedTo,
        captures: captures.map(({ row, col }) => ({ row, col }))
    };
    if (transientBoardEffectTimer) clearTimeout(transientBoardEffectTimer);
    transientBoardEffectTimer = setTimeout(() => {
        clearTransientBoardEffects();
    }, 720);
}


function isTransientMoveTile(row, col) {
    return transientBoardEffects.movedTo?.row === row && transientBoardEffects.movedTo?.col === col;
}


function isTransientCaptureTile(row, col) {
    return transientBoardEffects.captures.some((entry) => entry.row === row && entry.col === col);
}


function createPiece(team, role) {
    return { team, role, carrying: [] };
}


function createGold(team, homeRow = null, homeCol = null) {
    return { team, role: 'G', homeRow, homeCol };
}


function cloneCarriedGold(carrying = []) {
    return carrying.map((entry) => ({ ...entry }));
}


function emptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}


function cloneBoardState(state) {
    return state.map((row) => row.map((piece) => {
        if (!piece) return null;
        return {
            team: piece.team,
            role: piece.role,
            carrying: cloneCarriedGold(piece.carrying),
            homeRow: piece.homeRow ?? null,
            homeCol: piece.homeCol ?? null
        };
    }));
}


function getPieceAt(row, col) {
    return boardState[row]?.[col] || null;
}


function setPieceAt(row, col, piece) {
    boardState[row][col] = piece;
}


function clearSetupSelection() {
    setupSelection = null;
}


function clearSelection() {
    selectedPos = null;
    document.querySelectorAll('.tile.selected').forEach((tile) => tile.classList.remove('selected'));
}


function hideEndgameOverlay() {
    board.classList.remove('game-over');
    endgameOverlay.hidden = true;
    endgameTitle.innerText = 'Victory';
    endgameText.innerText = '';
}


function showEndgameOverlay(message) {
    const heading = message.includes('DRAW')
        ? 'Standoff'
        : message.includes('BLUE')
            ? 'Blue Wins'
            : message.includes('RED')
                ? 'Red Wins'
                : 'Match Over';
    board.classList.add('game-over');
    endgameTitle.innerText = heading;
    endgameText.innerText = message;
    endgameOverlay.hidden = false;
}


function countTeamPieces(team) {
    const counts = { A: 0, D: 0, V: 0, C: 0, G: 0 };
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = getPieceAt(row, col);
            if (piece && piece.team === team) counts[piece.role] += 1;
        }
    }
    return counts;
}


function teamSetupReady(team) {
    if (team === BOT_TEAM && botEnabled) return true;
    const counts = countTeamPieces(team);
    return Object.entries(SETUP_REQUIREMENTS).every(([role, amount]) => counts[role] === amount);
}


function allSetupReady() {
    return teamSetupReady('blue') && teamSetupReady('red');
}


function updateSetupCounts() {
    const fragments = [];
    ['blue', 'red'].forEach((team) => {
        if (team === BOT_TEAM && botEnabled) return;
        const counts = countTeamPieces(team);
        Object.entries(SETUP_REQUIREMENTS).forEach(([role, amount]) => {
            fragments.push(`<span class="setup-count ${counts[role] === amount ? 'done' : ''}">${team.toUpperCase()} ${role}: ${counts[role]}/${amount}</span>`);
        });
    });
    setupCounts.innerHTML = fragments.join('');
    startGameBtn.disabled = !allSetupReady();
}


function renderTrays() {
    const trays = [
        { team: 'blue', node: blueTray },
        { team: 'red', node: redTray }
    ];
    trays.forEach(({ team, node }) => {
        const trayBlock = node.parentElement;
        const counts = countTeamPieces(team);
        node.innerHTML = '';
        if (team === BOT_TEAM && botEnabled) {
            trayBlock.classList.add('is-bot-disabled');
            node.classList.add('is-bot-disabled');
            node.innerHTML = `<span>Red is bot-controlled on ${BOT_DIFFICULTY_LABELS[botDifficulty]}. Start the match to let the bot take over.</span>`;
            return;
        }
        trayBlock.classList.remove('is-bot-disabled');
        node.classList.remove('is-bot-disabled');
        Object.entries(SETUP_REQUIREMENTS).forEach(([role, amount]) => {
            const remaining = amount - counts[role];
            for (let index = 0; index < remaining; index++) {
                const token = document.createElement('button');
                token.type = 'button';
                token.className = `setup-token ${role === 'G' ? 'gold' : team} role-${role}`;
                if (setupSelection?.source === 'tray' && setupSelection.team === team && setupSelection.role === role && index === 0) {
                    token.classList.add('selected');
                }
                token.textContent = role;
                token.draggable = true;
                token.dataset.team = team;
                token.dataset.role = role;
                token.setAttribute('aria-label', `${team} ${getRoleLabel(role)}`);
                token.addEventListener('dragstart', (event) => handleTrayDragStart(event, team, role));
                token.addEventListener('dragend', clearDropHints);
                token.addEventListener('click', () => selectSetupTrayToken(team, role));
                node.appendChild(token);
            }
        });
    });
}


function isSetupDropValid(team, role, row, col) {
    if (team === BOT_TEAM && botEnabled) return false;
    if (getPieceAt(row, col)) return false;
    if (role !== 'G' && !HOME_ROWS[team](row)) return false;
    return true;
}


function clearTeamFromBoard(team) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = getPieceAt(row, col);
            if (piece?.team === team) setPieceAt(row, col, null);
        }
    }
}


function selectSetupTrayToken(team, role) {
    setupSelection = { source: 'tray', team, role };
    renderBoard();
    updateUI();
    statusMsg.innerText = `${team.toUpperCase()} ${role} selected. Tap an open square to place it.`;
}


function selectSetupBoardPiece(row, col, piece) {
    setupSelection = { source: 'board', fromRow: row, fromCol: col, team: piece.team, role: piece.role };
    renderBoard();
    updateUI();
    statusMsg.innerText = `${piece.team.toUpperCase()} ${piece.role} selected. Tap an open square to move it, or tap it again to return it to the tray.`;
}


function handleSetupTap(row, col) {
    const piece = getPieceAt(row, col);


    if (piece) {
        if (botEnabled && piece.team === BOT_TEAM) {
            statusMsg.innerText = 'Red is bot-controlled in this setup.';
            return;
        }
        if (setupSelection?.source === 'board' && setupSelection.fromRow === row && setupSelection.fromCol === col) {
            setPieceAt(row, col, null);
            clearSetupSelection();
            renderBoard();
            updateUI();
            statusMsg.innerText = `${piece.team.toUpperCase()} ${piece.role} returned to the tray.`;
            return;
        }
        selectSetupBoardPiece(row, col, piece);
        return;
    }


    if (!setupSelection) {
        statusMsg.innerText = 'Select a tray token or a placed piece first.';
        return;
    }


    if (!isSetupDropValid(setupSelection.team, setupSelection.role, row, col)) {
        statusMsg.innerText = setupSelection.role === 'G'
            ? 'Gold can go on any open square.'
            : `${setupSelection.team.toUpperCase()} ${setupSelection.role} must stay on its own half.`;
        return;
    }


    const nextPiece = setupSelection.role === 'G'
        ? createGold(setupSelection.team)
        : createPiece(setupSelection.team, setupSelection.role);
    setPieceAt(row, col, nextPiece);


    if (setupSelection.source === 'board') {
        setPieceAt(setupSelection.fromRow, setupSelection.fromCol, null);
    }


    clearSetupSelection();
    renderBoard();
    updateUI();
    statusMsg.innerText = `${nextPiece.team.toUpperCase()} ${nextPiece.role} placed.`;
}


function shuffleArray(items) {
    for (let index = items.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
}


function randomizeBotSetup() {
    clearTeamFromBoard(BOT_TEAM);
    const redHomeSquares = [];
    const redGoldSquares = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (!getPieceAt(row, col)) {
                if (HOME_ROWS[BOT_TEAM](row)) {
                    redHomeSquares.push({ row, col });
                    redGoldSquares.push({ row, col });
                }
            }
        }
    }


    const redPieces = shuffleArray([...redHomeSquares]).slice(0, 8);
    const roles = shuffleArray(['A', 'A', 'D', 'D', 'V', 'V', 'V', 'C']);


    redPieces.forEach(({ row, col }, index) => {
        setPieceAt(row, col, createPiece(BOT_TEAM, roles[index]));
    });
    const redGold = redGoldSquares.filter(({ row, col }) => !getPieceAt(row, col));
    shuffleArray(redGold).slice(0, 4).forEach(({ row, col }) => {
        setPieceAt(row, col, createGold(BOT_TEAM));
    });
}


function clearDropHints() {
    dragState = null;
    document.querySelectorAll('.tile.setup-valid, .tile.setup-invalid').forEach((tile) => {
        tile.classList.remove('setup-valid', 'setup-invalid');
    });
    document.querySelectorAll('.setup-token.dragging, .piece.dragging').forEach((token) => token.classList.remove('dragging'));
}


function saveTurnSnapshot() {
    turnSnapshot = {
        boardState: cloneBoardState(boardState),
        securedGold: { ...securedGold },
        currentPlayer,
        movesLeft
    };
}


function resetTurnFromSnapshot(message) {
    if (!turnSnapshot) {
        statusMsg.innerText = message;
        return;
    }


    boardState = cloneBoardState(turnSnapshot.boardState);
    securedGold = { ...turnSnapshot.securedGold };
    currentPlayer = turnSnapshot.currentPlayer;
    movesLeft = 0;
    lockedDir = null;
    clearTransientBoardEffects(false);
    clearSelection();
    renderBoard();
    updateUI();
    statusMsg.innerText = message;
}


function applyDropHint(tile, isValid) {
    tile.classList.remove('setup-valid', 'setup-invalid');
    tile.classList.add(isValid ? 'setup-valid' : 'setup-invalid');
}


function isBotTurn() {
    return botEnabled && !setupPhase && !gameOver && currentPlayer === BOT_TEAM;
}


function updateUI() {
    if (setupPhase) {
        turnIndicator.innerText = 'BOARD SETUP';
        turnIndicator.style.color = '#d4af37';
        rollBtn.disabled = true;
        rollBtn.innerText = 'SETUP MODE';
        setupPanel.hidden = false;
        setupTitle.innerText = 'BOARD SETUP';
        setupHint.innerText = botEnabled
            ? `Set up Blue manually. Drag or tap pieces into place. Red is bot-controlled for a ${BOT_DIFFICULTY_LABELS[botDifficulty]} match.`
            : 'Drag or tap team pieces to their own half. Gold can go on any open square. Each team still has a 4 gold limit.';
        updateSetupCounts();
        renderTrays();
        return;
    }


    setupPanel.hidden = true;
    turnIndicator.innerText = `${currentPlayer.toUpperCase()}'S TURN`;
    turnIndicator.style.color = currentPlayer === 'blue' ? '#2196f3' : '#f44336';
    rollBtn.innerText = movesLeft > 0 ? `${movesLeft} MOVE${movesLeft === 1 ? '' : 'S'} LEFT` : 'ROLL DICE';
    rollBtn.disabled = gameOver || movesLeft > 0 || botThinking || isBotTurn();
}


function attachBoardPieceDrag(token, row, col, piece) {
    if (!setupPhase) return;
    if (botEnabled && piece.team === BOT_TEAM) return;
    token.draggable = true;
    token.addEventListener('dragstart', (event) => {
        dragState = { source: 'board', fromRow: row, fromCol: col, team: piece.team, role: piece.role };
        setupSelection = { source: 'board', fromRow: row, fromCol: col, team: piece.team, role: piece.role };
        token.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
    });
    token.addEventListener('dragend', clearDropHints);
}


function renderBoard() {
    board.innerHTML = '';
    const midLine = document.createElement('div');
    midLine.className = 'mid-line';
    board.appendChild(midLine);
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.r = row;
            tile.dataset.c = col;
            if (!setupPhase && isReservedGoldHome(row, col)) {
                tile.classList.add('gold-home');
            }
            if (setupPhase) {
                tile.classList.add(HOME_ROWS.blue(row) ? 'setup-blue' : 'setup-red');
                tile.addEventListener('click', () => handleSetupTap(row, col));
                tile.addEventListener('dragover', (event) => handleTileDragOver(event, row, col, tile));
                tile.addEventListener('dragleave', () => tile.classList.remove('setup-valid', 'setup-invalid'));
                tile.addEventListener('drop', (event) => handleTileDrop(event, row, col));
            } else {
                tile.onclick = () => handleTileClick(row, col);
            }
            if (setupSelection?.source === 'board' && setupSelection.fromRow === row && setupSelection.fromCol === col) {
                tile.classList.add('setup-selected');
            }


            if (isTransientCaptureTile(row, col)) {
                tile.classList.add('tile--capture');
                const burst = document.createElement('div');
                burst.className = 'tile-burst';
                tile.appendChild(burst);
            }


            const piece = getPieceAt(row, col);
            if (piece) {
                const token = document.createElement('div');
                token.className = `piece ${piece.team} ${piece.role}`;
                token.textContent = piece.role;
                token.dataset.team = piece.team;
                token.dataset.role = piece.role;
                token.setAttribute('aria-label', `${piece.team} ${getRoleLabel(piece.role)}`);
                if (isTransientMoveTile(row, col)) {
                    token.classList.add('piece--walking');
                }
                if (piece.carrying?.length > 0) {
                    token.classList.add('carrying');
                    token.dataset.carrying = `${piece.carrying.length}`;
                }
                attachBoardPieceDrag(token, row, col, piece);
                tile.appendChild(token);
            }
            board.appendChild(tile);
        }
    }
    board.appendChild(endgameOverlay);
}


function loadDefaultSetup() {
    boardState = emptyBoard();
    setupPhase = true;
    gameOver = false;
    securedGold = { blue: 0, red: 0 };
    movesLeft = 0;
    lockedDir = null;
    clearSetupSelection();
    currentPlayer = 'blue';
    clearTransientBoardEffects(false);
    hideEndgameOverlay();
    DEFAULT_LAYOUT.forEach(({ row, col, team, role }) => {
        setPieceAt(row, col, role === 'G' ? createGold(team) : createPiece(team, role));
    });
    if (botEnabled) clearTeamFromBoard(BOT_TEAM);
    clearSelection();
    renderBoard();
    updateUI();
    statusMsg.innerText = 'Default setup loaded.';
}


function clearBoardForSetup() {
    boardState = emptyBoard();
    setupPhase = true;
    gameOver = false;
    securedGold = { blue: 0, red: 0 };
    movesLeft = 0;
    lockedDir = null;
    clearSetupSelection();
    currentPlayer = 'blue';
    clearTransientBoardEffects(false);
    hideEndgameOverlay();
    clearSelection();
    renderBoard();
    updateUI();
    statusMsg.innerText = 'Board cleared.';
}


function startMatch() {
    if (!allSetupReady()) {
        statusMsg.innerText = 'Finish setting up both teams first.';
        return;
    }
    if (botEnabled) randomizeBotSetup();
    hideEndgameOverlay();
    setupPhase = false;
    gameOver = false;
    dragState = null;
    clearSetupSelection();
    clearTransientBoardEffects(false);
    currentPlayer = 'blue';
    movesLeft = 0;
    lockedDir = null;
    goldHomePositions = captureGoldHomePositions();
    assignGoldHomeMetadata();
    clearSelection();
    renderBoard();
    updateUI();
    statusMsg.innerText = 'Board locked in. Blue rolls first.';
}


function handleTrayDragStart(event, team, role) {
    dragState = { source: 'tray', team, role };
    setupSelection = { source: 'tray', team, role };
    event.dataTransfer.effectAllowed = 'copy';
    event.target.classList.add('dragging');
}


function handleTileDragOver(event, row, col, tile) {
    if (!setupPhase || !dragState) return;
    event.preventDefault();
    applyDropHint(tile, isSetupDropValid(dragState.team, dragState.role, row, col));
}


function handleTileDrop(event, row, col) {
    event.preventDefault();
    if (!setupPhase || !dragState) return;


    if (!isSetupDropValid(dragState.team, dragState.role, row, col)) {
        statusMsg.innerText = dragState.role === 'G'
            ? 'Gold can go on any open square.'
            : `${dragState.team.toUpperCase()} ${dragState.role} must stay on its own half.`;
        clearDropHints();
        renderBoard();
        return;
    }


    const piece = dragState.role === 'G' ? createGold(dragState.team) : createPiece(dragState.team, dragState.role);
    setPieceAt(row, col, piece);


    if (dragState.source === 'board') {
        setPieceAt(dragState.fromRow, dragState.fromCol, null);
    }


    clearDropHints();
    clearSetupSelection();
    renderBoard();
    updateUI();
    statusMsg.innerText = `${dragState.team.toUpperCase()} ${dragState.role} placed.`;
}


function finishDiceRoll() {
    const roll = Math.floor(Math.random() * 6) + 1;
    movesLeft = roll;
    saveTurnSnapshot();
    const rotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(-90deg) rotateY(0deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(90deg) rotateY(0deg)',
        6: 'rotateX(0deg) rotateY(180deg)'
    };
    dice.style.transform = rotations[roll];
    setTimeout(() => {
        if (isBotTurn()) {
            statusMsg.innerText = `Red bot (${BOT_DIFFICULTY_LABELS[botDifficulty]}) rolled a ${roll}.`;
            updateUI();
            renderBoard();
            scheduleBotMove();
            return;
        }
        statusMsg.innerText = `Rolled a ${roll}. Move one piece in a single direction. Blue secured ${securedGold.blue}/4, Red secured ${securedGold.red}/4.`;
        updateUI();
        renderBoard();
    }, 600);
}


function rollDice() {
    if (setupPhase || gameOver || isBotTurn()) return;
    clearDropHints();
    clearSelection();
    lockedDir = null;
    rollBtn.disabled = true;
    renderBoard();
    dice.classList.add('rolling');


    setTimeout(() => {
        dice.classList.remove('rolling');
        finishDiceRoll();
    }, 800);
}


function switchTurn(message = 'Turn complete.') {
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    movesLeft = 0;
    lockedDir = null;
    clearSelection();
    renderBoard();
    updateUI();
    statusMsg.innerText = `${message} Blue secured ${securedGold.blue}/4, Red secured ${securedGold.red}/4.`;
    scheduleBotTurn();
}


function isStraightLine(deltaRow, deltaCol) {
    if (deltaRow === 0 && deltaCol === 0) return false;
    return deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol);
}


function normalizeDirection(deltaRow, deltaCol) {
    return { row: Math.sign(deltaRow), col: Math.sign(deltaCol) };
}


function canCarryGold(piece) {
    return piece.role === 'A' || piece.role === 'C';
}


function canCapture(piece) {
    return piece.role === 'D' || piece.role === 'V' || piece.role === 'C';
}


function defenderCanEnter(row, piece) {
    return piece.role !== 'D' || HOME_ROWS[piece.team](row);
}


function secureGoldIfHome(piece, row) {
    if (!piece.carrying.length || !HOME_ROWS[piece.team](row)) return 0;
    const delivered = piece.carrying.filter((gold) => gold.owner !== piece.team);
    if (!delivered.length) return 0;
    securedGold[piece.team] += delivered.length;
    piece.carrying = piece.carrying.filter((gold) => gold.owner === piece.team);
    return delivered.length;
}


function captureGoldHomePositions() {
    const positions = { blue: [], red: [] };
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = getPieceAt(row, col);
            if (piece?.role === 'G') positions[piece.team].push({ row, col });
        }
    }
    return positions;
}


function assignGoldHomeMetadata() {
    Object.entries(goldHomePositions).forEach(([team, positions]) => {
        positions.forEach(({ row, col }) => {
            const piece = getPieceAt(row, col);
            if (piece?.role === 'G' && piece.team === team) {
                piece.homeRow = row;
                piece.homeCol = col;
            }
        });
    });
}


function placeGoldAtHome(gold) {
    const preferredHomes = [];
    if (gold.homeRow !== null && gold.homeCol !== null) {
        preferredHomes.push({ row: gold.homeRow, col: gold.homeCol });
    }
    preferredHomes.push(...(goldHomePositions[gold.owner] || []).filter((pos) => pos.row !== gold.homeRow || pos.col !== gold.homeCol));
    for (const { row, col } of preferredHomes) {
        if (!getPieceAt(row, col)) {
            setPieceAt(row, col, createGold(gold.owner, row, col));
            return;
        }
    }


    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (HOME_ROWS[gold.owner](row) && !getPieceAt(row, col)) {
                setPieceAt(row, col, createGold(gold.owner, gold.homeRow, gold.homeCol));
                return;
            }
        }
    }


    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (!getPieceAt(row, col)) {
                setPieceAt(row, col, createGold(gold.owner, gold.homeRow, gold.homeCol));
                return;
            }
        }
    }
}


function isReservedGoldHome(row, col) {
    return Object.values(goldHomePositions).some((positions) => positions.some((pos) => pos.row === row && pos.col === col));
}


function respawnCarriedGold(goldList) {
    goldList.forEach((gold) => placeGoldAtHome(gold));
}


function teamHasGoldCarrier(team) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = getPieceAt(row, col);
            if (piece && piece.team === team && (piece.role === 'A' || piece.role === 'C')) return true;
        }
    }
    return false;
}


function teamHasPlayers(team) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = getPieceAt(row, col);
            if (piece && piece.team === team && piece.role !== 'G') return true;
        }
    }
    return false;
}


function checkEndGame() {
    if (securedGold.blue >= 4 || securedGold.red >= 4) {
        gameOver = true;
        const winner = securedGold.blue >= 4 ? 'BLUE' : 'RED';
        const message = `${winner} TEAM WINS BY SECURING ALL 4 GOLD BARS.`;
        statusMsg.innerText = message;
        movesLeft = 0;
        clearSelection();
        showEndgameOverlay(message);
        updateUI();
        return true;
    }
    const blueHasPlayers = teamHasPlayers('blue');
    const redHasPlayers = teamHasPlayers('red');
    if (!blueHasPlayers || !redHasPlayers) {
        gameOver = true;
        const message = !blueHasPlayers && !redHasPlayers
            ? 'DRAW. Both teams have no players left.'
            : `${blueHasPlayers ? 'BLUE' : 'RED'} TEAM WINS BY ELIMINATING THE OTHER TEAM.`;
        statusMsg.innerText = message;
        movesLeft = 0;
        clearSelection();
        showEndgameOverlay(message);
        updateUI();
        return true;
    }
    if (!teamHasGoldCarrier('blue') && !teamHasGoldCarrier('red')) {
        gameOver = true;
        const message = securedGold.blue === securedGold.red
            ? 'DRAW. No attackers or captains remain, and secured gold is tied.'
            : `${securedGold.blue > securedGold.red ? 'BLUE' : 'RED'} TEAM WINS ON SECURED GOLD ADVANTAGE.`;
        statusMsg.innerText = message;
        movesLeft = 0;
        clearSelection();
        showEndgameOverlay(message);
        updateUI();
        return true;
    }
    return false;
}


function highlightSelectedTile() {
    document.querySelectorAll('.tile.selected').forEach((tile) => tile.classList.remove('selected'));
    if (!selectedPos) return;
    const tile = board.querySelector(`[data-r="${selectedPos.row}"][data-c="${selectedPos.col}"]`);
    if (tile) tile.classList.add('selected');
}


function movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = getPieceAt(fromRow, fromCol);
    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;
    if (!piece || !isStraightLine(deltaRow, deltaCol)) {
        statusMsg.innerText = 'Choose a straight-line path.';
        return;
    }


    const distance = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
    if (distance > movesLeft) {
        statusMsg.innerText = `You can move up to ${movesLeft} spaces.`;
        return;
    }
    if (!getPieceAt(toRow, toCol) && isReservedGoldHome(toRow, toCol)) {
        statusMsg.innerText = 'That home gold square must stay open for returning gold.';
        return;
    }


    const direction = normalizeDirection(deltaRow, deltaCol);
    if (lockedDir && (lockedDir.row !== direction.row || lockedDir.col !== direction.col)) {
        resetTurnFromSnapshot('Direction changed. Turn reset.');
        return;
    }


    const captures = [];
    const gold = [];
    for (let step = 1; step <= distance; step++) {
        const row = fromRow + direction.row * step;
        const col = fromCol + direction.col * step;
        const occupant = getPieceAt(row, col);
        if (!defenderCanEnter(row, piece)) {
            resetTurnFromSnapshot('Defender crossed the middle line. Turn reset.');
            return;
        }
        if (occupant && occupant.team === piece.team) {
            statusMsg.innerText = 'You cannot move through your own pieces.';
            return;
        }
        if (!occupant) continue;
        if (occupant.role === 'G') {
            if (!canCarryGold(piece)) {
                resetTurnFromSnapshot(`${piece.role === 'D' ? 'Defenders' : 'Villagers'} cannot take gold. Turn reset.`);
                return;
            }
            gold.push({
                row,
                col,
                owner: occupant.team,
                homeRow: occupant.homeRow ?? row,
                homeCol: occupant.homeCol ?? col
            });
            continue;
        }
        if (!canCapture(piece)) {
            if (step === distance) {
                statusMsg.innerText = 'Attackers cannot land on enemy pieces.';
                return;
            }
            continue;
        }
        captures.push({ row, col, piece: occupant });
    }


    setPieceAt(fromRow, fromCol, null);
    const attackerGoldToRestore = [];
    const droppedGoldToRespawn = [];
    captures.forEach(({ row, col, piece: captured }) => {
        if (captured.carrying?.length) {
            if (captured.role === 'A') {
                attackerGoldToRestore.push(...captured.carrying);
            } else {
                droppedGoldToRespawn.push({ goldList: cloneCarriedGold(captured.carrying) });
            }
        }
        setPieceAt(row, col, null);
    });
    gold.forEach(({ row, col, owner, homeRow, homeCol }) => {
        piece.carrying.push({
            owner,
            homeRow,
            homeCol
        });
        setPieceAt(row, col, null);
    });
    setPieceAt(toRow, toCol, piece);
    attackerGoldToRestore.forEach((goldEntry) => placeGoldAtHome(goldEntry));
    droppedGoldToRespawn.forEach(({ goldList }) => respawnCarriedGold(goldList));
    movesLeft -= distance;
    selectedPos = { row: toRow, col: toCol };
    lockedDir = direction;
    const delivered = secureGoldIfHome(piece, toRow);
    scheduleTransientBoardEffects({ row: toRow, col: toCol }, captures.map(({ row, col }) => ({ row, col })));


    renderBoard();
    if (checkEndGame()) return;


    const notes = [];
    if (gold.length) notes.push(`picked up ${gold.length} gold`);
    if (captures.length) notes.push(`captured ${captures.length} piece${captures.length === 1 ? '' : 's'}`);
    if (delivered) notes.push(`secured ${delivered} gold`);
    statusMsg.innerText = notes.length
        ? `${currentPlayer.toUpperCase()} ${notes.join(', ')}. ${movesLeft} move${movesLeft === 1 ? '' : 's'} left.`
        : `${movesLeft} move${movesLeft === 1 ? '' : 's'} left.`;


    if (movesLeft <= 0) {
        switchTurn();
        return;
    }


    highlightSelectedTile();
    updateUI();
}


function handleTileClick(row, col) {
    if (gameOver || setupPhase || botThinking || isBotTurn()) return;
    if (movesLeft <= 0) {
        statusMsg.innerText = 'Roll the dice to begin your turn.';
        return;
    }


    const piece = getPieceAt(row, col);
    if (piece && piece.team === currentPlayer && piece.role !== 'G' && !lockedDir) {
        if (selectedPos && selectedPos.row === row && selectedPos.col === col) {
            clearSelection();
            renderBoard();
            return;
        }
        selectedPos = { row, col };
        highlightSelectedTile();
        statusMsg.innerText = `${currentPlayer.toUpperCase()} selected ${piece.role}.`;
        return;
    }


    if (!selectedPos) {
        statusMsg.innerText = 'Select one of your pieces first.';
        return;
    }


    movePiece(selectedPos.row, selectedPos.col, row, col);
}


function inBounds(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}


function scoreMove(piece, toRow, captures, gold, delivered, distance) {
    let score = 0;
    if (delivered) score += delivered * 200;
    if (gold.length) score += gold.length * 80;
    if (captures.length) score += captures.length * 45;


    if (piece.carrying?.length) {
        const targetRow = piece.team === 'blue' ? 0 : BOARD_SIZE - 1;
        score += Math.abs(targetRow - toRow) * -8;
    } else {
        const enemyHomeRow = piece.team === 'blue' ? BOARD_SIZE - 1 : 0;
        score += (BOARD_SIZE - Math.abs(enemyHomeRow - toRow)) * 4;
    }


    if (piece.role === 'C') score += 8;
    if (piece.role === 'A' && gold.length) score += 16;
    score += distance;
    return score;
}


function getLegalMovesForPiece(row, col, piece, maxDistance) {
    const legalMoves = [];
    for (const direction of DIRECTIONS) {
        for (let distance = 1; distance <= maxDistance; distance++) {
            const toRow = row + direction.row * distance;
            const toCol = col + direction.col * distance;
            if (!inBounds(toRow, toCol)) break;


            let blocked = false;
            const captures = [];
            const gold = [];
            let delivered = 0;


            for (let step = 1; step <= distance; step++) {
                const nextRow = row + direction.row * step;
                const nextCol = col + direction.col * step;
                if (!defenderCanEnter(nextRow, piece)) {
                    blocked = true;
                    break;
                }


                const occupant = getPieceAt(nextRow, nextCol);
                if (!occupant) continue;


                if (occupant.team === piece.team) {
                    blocked = true;
                    break;
                }


                if (occupant.role === 'G') {
                    if (!canCarryGold(piece)) {
                        blocked = true;
                        break;
                    }
                    gold.push({
                        row: nextRow,
                        col: nextCol,
                        owner: occupant.team,
                        homeRow: occupant.homeRow ?? nextRow,
                        homeCol: occupant.homeCol ?? nextCol
                    });
                    continue;
                }


                if (!canCapture(piece)) {
                    if (step === distance) blocked = true;
                    continue;
                }


                captures.push({ row: nextRow, col: nextCol, piece: occupant });
            }


            if (blocked) continue;
            if (!getPieceAt(toRow, toCol) && isReservedGoldHome(toRow, toCol)) continue;


            const carryingAfterMove = (piece.carrying || []).concat(gold.map((entry) => ({
                owner: entry.owner,
                homeRow: entry.homeRow,
                homeCol: entry.homeCol
            })));
            if (carryingAfterMove.length && HOME_ROWS[piece.team](toRow)) {
                delivered = carryingAfterMove.filter((goldEntry) => goldEntry.owner !== piece.team).length;
            }


            legalMoves.push({
                fromRow: row,
                fromCol: col,
                toRow,
                toCol,
                score: scoreMove(piece, toRow, captures, gold, delivered, distance)
            });
        }
    }
    return legalMoves;
}


function chooseBotMove() {
    const fullDistanceMoves = [];
    const fallbackMoves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = getPieceAt(row, col);
            if (!piece || piece.team !== currentPlayer || piece.role === 'G') continue;
            const pieceMoves = getLegalMovesForPiece(row, col, piece, movesLeft);
            pieceMoves.forEach((move) => {
                const distance = Math.max(Math.abs(move.toRow - move.fromRow), Math.abs(move.toCol - move.fromCol));
                if (distance === movesLeft) {
                    fullDistanceMoves.push(move);
                    return;
                }
                fallbackMoves.push(move);
            });
        }
    }


    const legalMoves = fullDistanceMoves.length ? fullDistanceMoves : fallbackMoves;
    if (!legalMoves.length) return null;
    legalMoves.sort((a, b) => b.score - a.score);
    if (botDifficulty === 'easy') {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    if (botDifficulty === 'normal') {
        const pool = legalMoves.slice(0, Math.min(3, legalMoves.length));
        return pool[Math.floor(Math.random() * pool.length)];
    }
    return legalMoves[0];
}


function scheduleBotMove() {
    if (!isBotTurn() || gameOver) return;
    botThinking = true;
    updateUI();
    setTimeout(() => {
        const move = chooseBotMove();
        botThinking = false;
        if (!move) {
            switchTurn('Red bot had no legal move.');
            return;
        }
        movePiece(move.fromRow, move.fromCol, move.toRow, move.toCol);
        if (isBotTurn() && movesLeft > 0 && !gameOver) {
            switchTurn('Red bot ended its turn.');
        }
    }, BOT_MOVE_DELAY);
}


function scheduleBotTurn() {
    if (!isBotTurn() || gameOver) return;
    botThinking = true;
    updateUI();
    setTimeout(() => {
        botThinking = false;
        clearDropHints();
        clearSelection();
        lockedDir = null;
        renderBoard();
        dice.classList.add('rolling');
        statusMsg.innerText = 'Red bot is rolling...';
        setTimeout(() => {
            dice.classList.remove('rolling');
            finishDiceRoll();
        }, 800);
    }, BOT_MOVE_DELAY);
}


function initBoard() {
    botEnabled = botEnabledToggle.checked;
    botDifficulty = botDifficultySelect.value;
    clearBoardForSetup();
    hideEndgameOverlay();
    statusMsg.innerText = 'Board is empty. Drag or tap pieces from the trays onto the board to set up a new match.';
    setIntroState(true);
}


botEnabledToggle.onchange = () => {
    botEnabled = botEnabledToggle.checked;
    if (botEnabled) clearTeamFromBoard(BOT_TEAM);
    clearSetupSelection();
    clearSelection();
    renderBoard();
    updateUI();
};
botDifficultySelect.onchange = () => {
    botDifficulty = botDifficultySelect.value;
    updateUI();
};
clearSetupBtn.onclick = clearBoardForSetup;
defaultSetupBtn.onclick = loadDefaultSetup;
startGameBtn.onclick = startMatch;
rollBtn.onclick = rollDice;
enterGameBtn.onclick = enterGame;
startRulesBtn.onclick = openRulesFromStart;
openBtn.onclick = (e) => {
    e.preventDefault();
    openRulesModal();
};
openCreditsBtn.onclick = (e) => {
    e.preventDefault();
    openCreditsModal();
};
closeBtn.onclick = closeRulesModal;
closeCreditsBtn.onclick = closeCreditsModal;
window.onclick = (e) => {
    if (e.target === modal) closeRulesModal();
    if (e.target === creditsModal) closeCreditsModal();
};
document.addEventListener('keydown', (event) => {
    if (!activeModal || activeModal.hidden) return;
    if (event.key === 'Escape') {
        if (activeModal === modal) closeRulesModal();
        if (activeModal === creditsModal) closeCreditsModal();
        return;
    }
    if (event.key !== 'Tab') return;


    const focusable = getFocusableModalElements(activeModal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});


initBoard();
updateMusicControls();












