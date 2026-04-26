// ── 常數 ──────────────────────────────────────────
const FLOORS = 10;
const MIN_ROOM_ID = 1000000;
const MAX_ROOM_ID = 9999999;

// ── 玩家狀態 ──────────────────────────────────────
let currentPlayer = {
    nickname: '',
    roomId: '',
    color: null
};

// 最新遊戲狀態（由伺服器同步）
let gameState = null;
let playersList = [];

// ── Socket.IO 連線 ─────────────────────────────────
const socket = io();

socket.on('connect', function() {
    setConnectionStatus(true);
});

socket.on('disconnect', function() {
    setConnectionStatus(false);
});

// 伺服器廣播：完整遊戲狀態更新
socket.on('game-state-updated', function(data) {
    playersList = data.players;
    gameState = data.gameState;
    renderPlayersList();
    renderGameBoard();
    syncColorSelection();
});

// 伺服器廣播：新玩家加入
socket.on('player-joined', function(data) {
    playersList = data.players;
    renderPlayersList();
});

// 伺服器廣播：玩家離開
socket.on('player-left', function(data) {
    playersList = data.players;
    renderPlayersList();
});

// 房間已滿
socket.on('room-full', function() {
    showLoginError('超出人數限制');
});

// ── 連線狀態 ───────────────────────────────────────
function setConnectionStatus(connected) {
    const el = document.getElementById('connectionIndicator');
    if (!el) return;
    if (connected) {
        el.textContent = '🟢 已連線';
        el.className = 'connection-indicator connected';
    } else {
        el.textContent = '🔴 已斷線';
        el.className = 'connection-indicator disconnected';
    }
}

// ── 登入邏輯 ───────────────────────────────────────
function generateRoomId() {
    return String(Math.floor(Math.random() * (MAX_ROOM_ID - MIN_ROOM_ID + 1)) + MIN_ROOM_ID);
}

function showLoginError(msg) {
    document.getElementById('loginError').textContent = msg;
}

function handleCreateRoom() {
    document.getElementById('roomInput').value = generateRoomId();
    showLoginError('');
}

function handleEnterGame() {
    const nickname = document.getElementById('nicknameInput').value.trim();
    const roomId = document.getElementById('roomInput').value.trim();

    if (!nickname) {
        showLoginError('請輸入玩家暱稱！');
        return;
    }
    if (!roomId || !/^\d{7}$/.test(roomId)) {
        showLoginError('請輸入或建立 7 碼數字房間號碼！');
        return;
    }

    currentPlayer.nickname = nickname;
    currentPlayer.roomId = roomId;
    currentPlayer.color = null;

    showLoginError('');

    // 先切換畫面，再發送 join-room
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    document.getElementById('roomDisplay').textContent = roomId;
    document.getElementById('nicknameDisplay').textContent = nickname;

    initColorOptions();

    socket.emit('join-room', { nickname: nickname, roomId: roomId });
}

// ── 顏色選擇 ───────────────────────────────────────
function initColorOptions() {
    // 移除舊監聽器（clone and replace）
    document.querySelectorAll('.color-option').forEach(function(btn) {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
    });

    document.querySelectorAll('.color-option').forEach(function(btn) {
        btn.addEventListener('click', handleColorSelect);
    });

    document.getElementById('currentColorSwatch').style.background = '';
    document.getElementById('currentColorLabel').textContent = '尚未選擇';
}

function handleColorSelect() {
    const color = this.dataset.color;
    currentPlayer.color = color;
    applyColorSelection(color);
    socket.emit('select-color', { color: color });
}

function applyColorSelection(color) {
    document.querySelectorAll('.color-option').forEach(function(btn) {
        btn.classList.toggle('selected', btn.dataset.color === color);
    });
    document.getElementById('currentColorSwatch').style.background = color;
    document.getElementById('currentColorLabel').textContent = color;
}

// 當收到伺服器更新時，同步自己的顏色（例如重連後）
function syncColorSelection() {
    const me = playersList.find(function(p) { return p.nickname === currentPlayer.nickname; });
    if (me && me.color && me.color !== currentPlayer.color) {
        currentPlayer.color = me.color;
        applyColorSelection(me.color);
    }
}

// ── 玩家列表渲染 ───────────────────────────────────
function renderPlayersList() {
    const container = document.getElementById('playersList');
    if (!container) return;
    container.innerHTML = '';

    playersList.forEach(function(player) {
        const tag = document.createElement('div');
        tag.className = 'player-tag' + (player.nickname === currentPlayer.nickname ? ' me' : '');

        const dot = document.createElement('span');
        dot.className = 'player-dot';
        dot.style.background = player.color || '#ccc';
        dot.style.borderColor = player.color || '#ccc';

        const label = document.createElement('span');
        label.textContent = player.nickname + (player.nickname === currentPlayer.nickname ? '（你）' : '');

        tag.appendChild(dot);
        tag.appendChild(label);
        container.appendChild(tag);
    });
}

// ── 遊戲板渲染 ─────────────────────────────────────
function renderGameBoard() {
    if (!gameState) return;

    const boardEl = document.getElementById('gameBoard');
    boardEl.innerHTML = '';

    // 產生 floor 1 ~ 10（CSS flex-direction:column-reverse 讓 floor 1 顯示在最下方）
    for (let floor = 1; floor <= FLOORS; floor++) {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'floor';

        const label = document.createElement('div');
        label.className = 'floor-label';
        label.textContent = '第' + floor + '層';
        floorDiv.appendChild(label);

        const boxesDiv = document.createElement('div');
        boxesDiv.className = 'number-boxes';

        for (let pos = 1; pos <= 4; pos++) {
            const cell = gameState[floor] ? gameState[floor][pos] : null;
            const box = document.createElement('div');
            box.className = 'number-box';
            box.textContent = pos;
            box.dataset.floor = floor;
            box.dataset.pos = pos;

            if (cell) {
                box.classList.add('occupied');
                box.style.background = cell.color;
                box.style.borderColor = cell.color;
            }

            box.addEventListener('click', handleBoxClick);
            boxesDiv.appendChild(box);
        }

        floorDiv.appendChild(boxesDiv);
        boardEl.appendChild(floorDiv);
    }
}

// ── 點擊數字方框 ───────────────────────────────────
function handleBoxClick() {
    if (!currentPlayer.color) {
        alert('請先選擇你的代表顏色！');
        return;
    }

    const floor = parseInt(this.dataset.floor);
    const pos = parseInt(this.dataset.pos);

    if (!gameState || !gameState[floor]) return;

    const cell = gameState[floor][pos];

    // 點擊的是本人已選的同一格，不做任何事
    if (cell && cell.nickname === currentPlayer.nickname) {
        return;
    }

    // 目標格被他人佔據，詢問覆蓋
    if (cell && cell.nickname !== currentPlayer.nickname) {
        if (!confirm('是否確定要覆蓋？')) return;
    }

    socket.emit('select-position', { floor: floor, position: pos });
}

// ── 重設 ───────────────────────────────────────────
function handleReset() {
    socket.emit('reset-game');
}

// ── 初始化 ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('createRoomBtn').addEventListener('click', handleCreateRoom);
    document.getElementById('enterGameBtn').addEventListener('click', handleEnterGame);
    document.getElementById('resetBtn').addEventListener('click', handleReset);

    document.getElementById('nicknameInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleEnterGame();
    });
    document.getElementById('roomInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleEnterGame();
    });
});
