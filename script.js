// 遊戲狀態
let currentPlayerColor = null;
let gameBoard = [];
const FLOORS = 10;
const POSITIONS_PER_FLOOR = 4;
const COLORS = {
    red: { name: '紅色', emoji: '🔴' },
    blue: { name: '藍色', emoji: '🔵' },
    orange: { name: '橘色', emoji: '🟠' },
    green: { name: '綠色', emoji: '🟢' }
};

// 初始化遊戲
function initGame() {
    gameBoard = [];
    for (let i = 0; i < FLOORS; i++) {
        gameBoard.push([null, null, null, null]);
    }
    renderGameBoard();
    updateStats();
    setupEventListeners();
}

// 渲染遊戲板
function renderGameBoard() {
    const gameBoardElement = document.getElementById('gameBoard');
    gameBoardElement.innerHTML = '';
    
    for (let floor = 0; floor < FLOORS; floor++) {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'floor';
        
        const floorLabel = document.createElement('div');
        floorLabel.className = 'floor-label';
        floorLabel.textContent = `第 ${floor + 1} 層`;
        floorDiv.appendChild(floorLabel);
        
        const positionsDiv = document.createElement('div');
        positionsDiv.className = 'positions';
        
        for (let pos = 0; pos < POSITIONS_PER_FLOOR; pos++) {
            const positionDiv = document.createElement('div');
            positionDiv.className = 'position';
            positionDiv.dataset.floor = floor;
            positionDiv.dataset.position = pos;
            
            const currentColor = gameBoard[floor][pos];
            if (currentColor) {
                positionDiv.classList.add('filled', currentColor);
                positionDiv.textContent = COLORS[currentColor].emoji;
            }
            
            positionDiv.addEventListener('click', handlePositionClick);
            positionsDiv.appendChild(positionDiv);
        }
        
        floorDiv.appendChild(positionsDiv);
        gameBoardElement.appendChild(floorDiv);
    }
}

// 處理位置點擊
function handlePositionClick(e) {
    if (!currentPlayerColor) {
        alert('請先選擇你的顏色！');
        return;
    }
    
    const floor = parseInt(e.currentTarget.dataset.floor);
    const position = parseInt(e.currentTarget.dataset.position);
    const currentColor = gameBoard[floor][position];
    
    // 檢查該層樓是否已有相同顏色
    if (gameBoard[floor].includes(currentPlayerColor)) {
        alert(`第 ${floor + 1} 層已經有 ${COLORS[currentPlayerColor].name} 了！每層樓每種顏色只能出現一次。`);
        return;
    }
    
    // 如果位置已被佔據
    if (currentColor) {
        const colorName = COLORS[currentColor].name;
        const myColorName = COLORS[currentPlayerColor].name;
        
        if (currentColor === currentPlayerColor) {
            alert('這已經是你的顏色了！');
            return;
        }
        
        const confirmed = confirm(
            `這個位置已經被 ${colorName} 佔據了！\n\n你確定要用 ${myColorName} 覆蓋 ${colorName} 嗎？`
        );
        
        if (!confirmed) {
            return;
        }
    }
    
    // 放置顏色
    gameBoard[floor][position] = currentPlayerColor;
    
    // 添加動畫效果
    e.currentTarget.style.transform = 'scale(0.8)';
    setTimeout(() => {
        e.currentTarget.style.transform = '';
        renderGameBoard();
        updateStats();
        checkGameOver();
    }, 150);
}

// 更新統計
function updateStats() {
    const colorCounts = {
        red: 0,
        blue: 0,
        orange: 0,
        green: 0
    };
    
    let filledCount = 0;
    
    gameBoard.forEach(floor => {
        floor.forEach(color => {
            if (color) {
                colorCounts[color]++;
                filledCount++;
            }
        });
    });
    
    // 更新各顏色計數
    document.getElementById('redCount').textContent = colorCounts.red;
    document.getElementById('blueCount').textContent = colorCounts.blue;
    document.getElementById('orangeCount').textContent = colorCounts.orange;
    document.getElementById('greenCount').textContent = colorCounts.green;
    
    // 更新已填滿數量
    document.getElementById('filledCount').textContent = filledCount;
    
    // 更新進度條
    const totalPositions = FLOORS * POSITIONS_PER_FLOOR;
    const progress = (filledCount / totalPositions) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

// 檢查遊戲是否結束
function checkGameOver() {
    const totalPositions = FLOORS * POSITIONS_PER_FLOOR;
    let filledCount = 0;
    
    gameBoard.forEach(floor => {
        floor.forEach(color => {
            if (color) filledCount++;
        });
    });
    
    if (filledCount === totalPositions) {
        setTimeout(() => showGameOver(), 500);
    }
}

// 顯示遊戲結束
function showGameOver() {
    const colorCounts = {
        red: 0,
        blue: 0,
        orange: 0,
        green: 0
    };
    
    gameBoard.forEach(floor => {
        floor.forEach(color => {
            if (color) colorCounts[color]++;
        });
    });
    
    // 找出獲勝者
    const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1]);
    
    const winnerDisplay = document.getElementById('winnerDisplay');
    winnerDisplay.innerHTML = '<h3>最終結果：</h3>';
    
    sortedColors.forEach(([color, count], index) => {
        const item = document.createElement('div');
        item.className = `winner-item ${color}`;
        const medal = index === 0 ? '🏆 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : '';
        item.textContent = `${medal}${COLORS[color].emoji} ${COLORS[color].name}：${count} 個位置`;
        winnerDisplay.appendChild(item);
    });
    
    document.getElementById('gameOverModal').classList.add('show');
}

// 設置事件監聽器
function setupEventListeners() {
    // 顏色選擇按鈕
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const color = this.dataset.color;
            const colorName = this.dataset.name;
            
            currentPlayerColor = color;
            
            // 更新按鈕樣式
            document.querySelectorAll('.color-btn').forEach(b => {
                b.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // 更新當前玩家顯示
            const display = document.getElementById('playerColorDisplay');
            display.textContent = `${COLORS[color].emoji} ${colorName}`;
            display.className = `color-display ${color}`;
            display.style.background = window.getComputedStyle(this).background;
            display.style.color = 'white';
            display.style.fontWeight = 'bold';
        });
    });
    
    // 重置按鈕
    document.getElementById('resetBtn').addEventListener('click', function() {
        if (confirm('確定要重新開始遊戲嗎？所有進度將會清除。')) {
            resetGame();
        }
    });
    
    // 再玩一次按鈕
    document.getElementById('playAgainBtn').addEventListener('click', function() {
        document.getElementById('gameOverModal').classList.remove('show');
        resetGame();
    });
}

// 重置遊戲
function resetGame() {
    gameBoard = [];
    for (let i = 0; i < FLOORS; i++) {
        gameBoard.push([null, null, null, null]);
    }
    renderGameBoard();
    updateStats();
}

// 頁面載入時初始化
window.addEventListener('DOMContentLoaded', initGame);
