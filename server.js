const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 4;
const FLOORS = 10;

// 房間資料
// rooms[roomId] = { players: [{id, nickname, color}], gameState: {...} }
const rooms = {};

function createGameState() {
    const state = {};
    for (let f = 1; f <= FLOORS; f++) {
        state[f] = { 1: null, 2: null, 3: null, 4: null };
    }
    return state;
}

function getOrCreateRoom(roomId) {
    if (!rooms[roomId]) {
        rooms[roomId] = {
            players: [],
            gameState: createGameState()
        };
    }
    return rooms[roomId];
}

// 伺服器靜態檔案
app.use(express.static(path.join(__dirname)));

// Socket.IO 事件
io.on('connection', function(socket) {

    // 玩家加入房間
    socket.on('join-room', function(data) {
        const { nickname, roomId } = data;

        if (!nickname || !roomId) return;

        const room = getOrCreateRoom(roomId);

        // 同暱稱視為重新連線，允許
        const existing = room.players.find(function(p) { return p.nickname === nickname; });
        if (!existing) {
            if (room.players.length >= MAX_PLAYERS) {
                socket.emit('room-full');
                return;
            }
            room.players.push({ id: socket.id, nickname: nickname, color: null });
        } else {
            // 更新 socket id
            existing.id = socket.id;
        }

        socket.join(roomId);
        socket.data.nickname = nickname;
        socket.data.roomId = roomId;

        // 通知加入者目前狀態
        socket.emit('game-state-updated', {
            players: room.players,
            gameState: room.gameState
        });

        // 廣播新玩家加入
        socket.to(roomId).emit('player-joined', {
            players: room.players
        });
    });

    // 玩家選擇顏色
    socket.on('select-color', function(data) {
        const { color } = data;
        const roomId = socket.data.roomId;
        const nickname = socket.data.nickname;
        if (!roomId || !nickname) return;

        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(function(p) { return p.nickname === nickname; });
        if (player) {
            player.color = color;
        }

        io.to(roomId).emit('game-state-updated', {
            players: room.players,
            gameState: room.gameState
        });
    });

    // 玩家選擇位置
    socket.on('select-position', function(data) {
        const { floor, position } = data;
        const roomId = socket.data.roomId;
        const nickname = socket.data.nickname;
        if (!roomId || !nickname) return;

        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(function(p) { return p.nickname === nickname; });
        if (!player || !player.color) return;

        // 清除此玩家在此樓的舊選擇
        for (let pos = 1; pos <= 4; pos++) {
            const cell = room.gameState[floor][pos];
            if (cell && cell.nickname === nickname) {
                room.gameState[floor][pos] = null;
            }
        }

        room.gameState[floor][position] = { nickname: nickname, color: player.color };

        io.to(roomId).emit('game-state-updated', {
            players: room.players,
            gameState: room.gameState
        });
    });

    // 重設遊戲
    socket.on('reset-game', function() {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = rooms[roomId];
        if (!room) return;

        room.gameState = createGameState();

        io.to(roomId).emit('game-state-updated', {
            players: room.players,
            gameState: room.gameState
        });
    });

    // 玩家斷線
    socket.on('disconnect', function() {
        const roomId = socket.data.roomId;
        const nickname = socket.data.nickname;
        if (!roomId || !nickname) return;

        const room = rooms[roomId];
        if (!room) return;

        room.players = room.players.filter(function(p) { return p.nickname !== nickname; });

        if (room.players.length === 0) {
            delete rooms[roomId];
            return;
        }

        io.to(roomId).emit('player-left', {
            players: room.players
        });
    });
});

server.listen(PORT, function() {
    console.log('伺服器啟動於 http://localhost:' + PORT);
});
