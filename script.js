// ── 常數 ──────────────────────────────────────────
const FLOORS = 10;
const MAX_PLAYERS = 4;
const STORAGE_KEY = 'colorGameRooms';

// ── 玩家狀態 ──────────────────────────────────────
let currentPlayer = {
    nickname: '',
    roomId: '',
    color: null
};

// ── 房間資料操作 (localStorage) ────────────────────

function loadRooms() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveRooms(rooms) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

function getRoom(roomId) {
    const rooms = loadRooms();
    return rooms[roomId] || null;
}

function saveRoom(roomId, data) {
    const rooms = loadRooms();
    rooms[roomId] = data;
    saveRooms(rooms);
}

function createEmptyRoom() {
    return {
        players: [],
        gameBoard: Array.from({ length: FLOORS }, () => Array(4).fill(null))
    };
}

// ── 登入邏輯 ───────────────────────────────────────

function generateRoomId() {
    return String(Math.floor(Math.random() * (9999999 - 1000000 + 1)) + 1000000);
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

    let room = getRoom(roomId);
    if (!room) {
        room = createEmptyRoom();
    }

    // 同一暱稱視為重新進入（允許）
    const existingIndex = room.players.findIndex(function(p) { return p.nickname === nickname; });
    if (existingIndex === -1) {
        if (room.players.length >= MAX_PLAYERS) {
            showLoginError('超出人數限制');
            return;
        }
        room.players.push({ nickname: nickname, color: null });
        saveRoom(roomId, room);
    }

    currentPlayer.nickname = nickname;
    currentPlayer.roomId = roomId;
    const existing = room.players.find(function(p) { return p.nickname === nickname; });
    currentPlayer.color = existing ? existing.color : null;

    showLoginError('');
    enterGame();
}

// ── 切換畫面 ───────────────────────────────────────

function enterGame() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    document.getElementById('roomDisplay').textContent = currentPlayer.roomId;
    document.getElementById('nicknameDisplay').textContent = currentPlayer.nickname;

    initColorOptions();
    renderGameBoard();
}

// ── 顏色選擇 ───────────────────────────────────────

function initColorOptions() {
    const buttons = document.querySelectorAll('.color-option');
    buttons.forEach(function(btn) {
        btn.classList.remove('selected');
        // Remove old listener before adding new one
        btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll('.color-option').forEach(function(btn) {
        btn.addEventListener('click', handleColorSelect);
    });

    if (currentPlayer.color) {
        applyColorSelection(currentPlayer.color);
    } else {
        document.getElementById('currentColorSwatch').style.background = '';
        document.getElementById('currentColorLabel').textContent = '尚未選擇';
    }
}

function handleColorSelect() {
    const color = this.dataset.color;
    currentPlayer.color = color;

    const room = getRoom(currentPlayer.roomId);
    if (room) {
        const player = room.players.find(function(p) { return p.nickname === currentPlayer.nickname; });
        if (player) {
            player.color = color;
            saveRoom(currentPlayer.roomId, room);
        }
    }

    applyColorSelection(color);
    renderGameBoard();
}

function applyColorSelection(color) {
    document.querySelectorAll('.color-option').forEach(function(btn) {
        btn.classList.toggle('selected', btn.dataset.color === color);
    });
    document.getElementById('currentColorSwatch').style.background = color;
    document.getElementById('currentColorLabel').textContent = color;
}

// ── 遊戲板渲染 ─────────────────────────────────────

function renderGameBoard() {
    const room = getRoom(currentPlayer.roomId);
    const gameBoard = room ? room.gameBoard : createEmptyRoom().gameBoard;

    const boardEl = document.getElementById('gameBoard');
    boardEl.innerHTML = '';

    for (let floor = 0; floor < FLOORS; floor++) {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'floor';

        const label = document.createElement('div');
        label.className = 'floor-label';
        label.textContent = '第' + (floor + 1) + '層';
        floorDiv.appendChild(label);

        const boxesDiv = document.createElement('div');
        boxesDiv.className = 'number-boxes';

        for (let pos = 0; pos < 4; pos++) {
            const cell = gameBoard[floor][pos];
            const box = document.createElement('div');
            box.className = 'number-box';
            box.textContent = pos + 1;
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

    const room = getRoom(currentPlayer.roomId);
    if (!room) return;

    const cell = room.gameBoard[floor][pos];

    // 本人在此樓已有的選擇
    let myCurrentPos = -1;
    for (let i = 0; i < 4; i++) {
        const c = room.gameBoard[floor][i];
        if (c && c.nickname === currentPlayer.nickname) {
            myCurrentPos = i;
            break;
        }
    }

    // 點擊已是本人選擇的同一格，不做任何事
    if (myCurrentPos === pos) {
        return;
    }

    // 目標格被他人佔據，詢問覆蓋
    if (cell && cell.nickname !== currentPlayer.nickname) {
        if (!confirm('是否確定要覆蓋？')) return;
    }

    // 清除本人在此樓的舊選擇
    if (myCurrentPos !== -1) {
        room.gameBoard[floor][myCurrentPos] = null;
    }

    room.gameBoard[floor][pos] = { nickname: currentPlayer.nickname, color: currentPlayer.color };
    saveRoom(currentPlayer.roomId, room);
    renderGameBoard();
}

// ── 重設 ───────────────────────────────────────────

function handleReset() {
    const room = getRoom(currentPlayer.roomId);
    if (!room) return;
    room.gameBoard = Array.from({ length: FLOORS }, function() { return Array(4).fill(null); });
    saveRoom(currentPlayer.roomId, room);
    renderGameBoard();
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
