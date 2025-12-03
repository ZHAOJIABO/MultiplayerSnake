// 游戏状态
let ws = null;
let canvas, ctx;
let cellSize = 16;
let myPlayerId = null;
let hasShownDeathNotification = false; // 记录是否已显示过死亡通知

// DOM元素
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const playerNameInput = document.getElementById('playerName');
const connectionStatus = document.getElementById('connectionStatus');
const myScoreEl = document.getElementById('myScore');
const statusEl = document.getElementById('status');
const playerCountEl = document.getElementById('playerCount');
const leaderboardList = document.getElementById('leaderboardList');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    // 回车键也可以开始游戏
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });

    // 方向按钮事件 - 使用mousedown/touchstart避免延迟
    const directionButtons = document.querySelectorAll('.direction-btn');
    directionButtons.forEach(btn => {
        // 移动端：使用touchstart（无延迟）
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const direction = e.target.getAttribute('data-direction');
            sendDirection(direction);
        }, { passive: false });

        // PC端：使用mousedown（比click更快）
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const direction = e.target.getAttribute('data-direction');
            sendDirection(direction);
        });
    });
});

// 开始游戏
function startGame() {
    const playerName = playerNameInput.value.trim() || 'Player';

    // 隐藏开始界面，显示游戏界面
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    // 连接WebSocket
    connectWebSocket(playerName);

    // 监听键盘事件
    document.addEventListener('keydown', handleKeyPress);
}

// 重新开始游戏
function restartGame() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const playerName = playerNameInput.value.trim() || 'Player';
        // 重置玩家ID，以便重新加入
        myPlayerId = null;
        hasShownDeathNotification = false; // 重置死亡通知标记
        ws.send(JSON.stringify({
            type: 'join',
            playerName: playerName
        }));
        restartButton.style.display = 'none';
        statusEl.textContent = '存活';
        statusEl.style.color = '#27ae60';
    }
}

// 连接WebSocket
function connectWebSocket(playerName) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket连接成功');
        connectionStatus.textContent = '已连接';
        connectionStatus.className = 'connection-status connected';

        // 发送加入游戏消息
        ws.send(JSON.stringify({
            type: 'join',
            playerName: playerName
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'gameState') {
            handleGameState(data);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        connectionStatus.textContent = '连接错误';
        connectionStatus.className = 'connection-status disconnected';
    };

    ws.onclose = () => {
        console.log('WebSocket连接关闭');
        connectionStatus.textContent = '连接断开';
        connectionStatus.className = 'connection-status disconnected';
    };
}

// 处理游戏状态
function handleGameState(state) {
    // 设置Canvas尺寸（只在第一次或尺寸改变时）
    const canvasWidth = state.gridWidth * cellSize;
    const canvasHeight = state.gridHeight * cellSize;
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }

    // 清空画布
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    drawGrid(state.gridWidth, state.gridHeight);

    // 绘制食物
    state.foods.forEach(food => {
        drawFood(food.x, food.y);
    });

    // 绘制所有蛇
    state.players.forEach(player => {
        if (player.alive && player.snake.length > 0) {
            drawSnake(player);
        }
    });

    // 更新UI
    updateUI(state);
}

// 绘制网格
function drawGrid(gridWidth, gridHeight) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, gridHeight * cellSize);
        ctx.stroke();
    }

    for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(gridWidth * cellSize, y * cellSize);
        ctx.stroke();
    }
}

// 绘制食物
function drawFood(x, y) {
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(
        x * cellSize + cellSize / 2,
        y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// 绘制蛇
function drawSnake(player) {
    player.snake.forEach((segment, index) => {
        // 蛇头稍微大一点，颜色深一点
        if (index === 0) {
            ctx.fillStyle = player.color;
            ctx.fillRect(
                segment.x * cellSize + 1,
                segment.y * cellSize + 1,
                cellSize - 2,
                cellSize - 2
            );
            // 画眼睛
            ctx.fillStyle = 'white';
            ctx.fillRect(
                segment.x * cellSize + 4,
                segment.y * cellSize + 4,
                3,
                3
            );
            ctx.fillRect(
                segment.x * cellSize + cellSize - 7,
                segment.y * cellSize + 4,
                3,
                3
            );
        } else {
            // 蛇身体，稍微透明
            ctx.fillStyle = player.color + 'CC';
            ctx.fillRect(
                segment.x * cellSize + 2,
                segment.y * cellSize + 2,
                cellSize - 4,
                cellSize - 4
            );
        }
    });

    // 显示玩家名称在蛇头上方
    if (player.snake.length > 0) {
        const head = player.snake[0];
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            player.name,
            head.x * cellSize + cellSize / 2,
            head.y * cellSize - 5
        );
    }
}

// 更新UI信息
function updateUI(state) {
    // 更新在线玩家数
    playerCountEl.textContent = state.players.length;

    // 查找自己的玩家
    const myPlayer = state.players.find(p => p.id === myPlayerId);

    if (!myPlayer) {
        // 如果还没有ID，找第一个匹配名字的玩家
        const playerName = playerNameInput.value.trim() || 'Player';
        const foundPlayer = state.players.find(p => p.name === playerName && !myPlayerId);
        if (foundPlayer) {
            myPlayerId = foundPlayer.id;
        }
    }

    // 更新自己的分数和状态
    if (myPlayer) {
        myScoreEl.textContent = myPlayer.score;
        if (myPlayer.alive) {
            statusEl.textContent = '存活';
            statusEl.style.color = '#27ae60';
            restartButton.style.display = 'none';
            hasShownDeathNotification = false; // 存活时重置标记
        } else {
            // 显示死亡原因
            let deathMessage = '已死亡';
            if (myPlayer.deathReason === 'wall') {
                deathMessage = '已死亡 - 撞墙了';
            } else if (myPlayer.deathReason === 'eaten' && myPlayer.killerName) {
                deathMessage = `已死亡 - 被 ${myPlayer.killerName} 吃掉了`;
            }
            statusEl.textContent = deathMessage;
            statusEl.style.color = '#e74c3c';
            restartButton.style.display = 'inline-block';

            // 显示弹窗提示（仅一次）
            if (!hasShownDeathNotification) {
                showDeathNotification(myPlayer);
                hasShownDeathNotification = true;
            }
        }
    }

    // 更新排行榜
    updateLeaderboard(state.players);
}

// 显示死亡通知
function showDeathNotification(player) {
    let message = '你被淘汰了！';
    if (player.deathReason === 'wall') {
        message = '你撞墙了！';
    } else if (player.deathReason === 'eaten' && player.killerName) {
        message = `你被 ${player.killerName} 吃掉了！`;
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(231, 76, 60, 0.95);
        color: white;
        padding: 30px 50px;
        border-radius: 15px;
        font-size: 24px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: fadeIn 0.3s ease-in;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 3秒后移除
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 更新排行榜
function updateLeaderboard(players) {
    // 按分数排序
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    leaderboardList.innerHTML = '';
    sortedPlayers.forEach((player, index) => {
        const li = document.createElement('li');

        const rank = document.createElement('span');
        rank.textContent = `${index + 1}.`;

        const name = document.createElement('span');
        name.className = 'player-name';
        name.textContent = player.name;
        name.style.color = player.color;

        const score = document.createElement('span');
        score.className = 'player-score';
        score.textContent = player.score;

        const status = document.createElement('span');
        status.className = `player-status ${player.alive ? '' : 'dead'}`;
        status.textContent = player.alive ? '✓' : '✗';

        li.appendChild(rank);
        li.appendChild(name);
        li.appendChild(score);
        li.appendChild(status);

        leaderboardList.appendChild(li);
    });
}

// 发送方向指令
function sendDirection(direction) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    ws.send(JSON.stringify({
        type: 'direction',
        direction: direction
    }));
}

// 处理键盘按键
function handleKeyPress(event) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    let direction = null;

    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            direction = 'up';
            event.preventDefault();
            break;
        case 's':
        case 'arrowdown':
            direction = 'down';
            event.preventDefault();
            break;
        case 'a':
        case 'arrowleft':
            direction = 'left';
            event.preventDefault();
            break;
        case 'd':
        case 'arrowright':
            direction = 'right';
            event.preventDefault();
            break;
    }

    if (direction) {
        sendDirection(direction);
    }
}
