// ========== 游戏导航功能 ==========
function showGame(gameType) {
    // 隐藏所有游戏界面
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('rouletteGame').style.display = 'none';
    document.getElementById('rouletteAdvancedGame').style.display = 'none';
    document.getElementById('bombGame').style.display = 'none';
    document.getElementById('snakeGame').style.display = 'none';

    // 显示选中的游戏
    if (gameType === 'roulette') {
        document.getElementById('rouletteGame').style.display = 'block';
        initRoulette();
    } else if (gameType === 'rouletteAdvanced') {
        document.getElementById('rouletteAdvancedGame').style.display = 'block';
    } else if (gameType === 'bomb') {
        document.getElementById('bombGame').style.display = 'block';
        initBombGame();
    } else if (gameType === 'snake') {
        document.getElementById('snakeGame').style.display = 'block';
    }
}

function backToMenu() {
    // 如果是从贪吃蛇返回，需要断开WebSocket连接
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
        ws = null;
    }

    // 重置贪吃蛇游戏状态
    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    myPlayerId = null;
    hasShownDeathNotification = false;

    // 显示菜单
    document.getElementById('menuScreen').style.display = 'block';
    document.getElementById('rouletteGame').style.display = 'none';
    document.getElementById('rouletteAdvancedGame').style.display = 'none';
    document.getElementById('bombGame').style.display = 'none';
    document.getElementById('snakeGame').style.display = 'none';
}

// ========== 大转盘游戏 ==========
let rouletteCanvas, rouletteCtx;
let isSpinning = false;
let pointerAngle = 0; // 指针角度

function initRoulette() {
    rouletteCanvas = document.getElementById('rouletteCanvas');
    rouletteCtx = rouletteCanvas.getContext('2d');
    pointerAngle = -Math.PI / 2; // 初始指向上方
    document.getElementById('rouletteResult').textContent = '';
    drawRoulette();
}

function drawRoulette() {
    const centerX = rouletteCanvas.width / 2;
    const centerY = rouletteCanvas.height / 2;
    const radius = 180;
    const sections = 8; // 8个扇形区域
    const anglePerSection = (Math.PI * 2) / sections;

    // 清空画布
    rouletteCtx.clearRect(0, 0, rouletteCanvas.width, rouletteCanvas.height);

    // 绘制外圈金属质感装饰
    const outerRingGradient = rouletteCtx.createLinearGradient(centerX - radius - 15, centerY - radius - 15, centerX + radius + 15, centerY + radius + 15);
    outerRingGradient.addColorStop(0, '#FFD700');
    outerRingGradient.addColorStop(0.5, '#FFA500');
    outerRingGradient.addColorStop(1, '#FF8C00');
    rouletteCtx.beginPath();
    rouletteCtx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
    rouletteCtx.strokeStyle = outerRingGradient;
    rouletteCtx.lineWidth = 12;
    rouletteCtx.stroke();

    // 绘制外圈阴影
    rouletteCtx.beginPath();
    rouletteCtx.arc(centerX, centerY, radius + 9, 0, Math.PI * 2);
    rouletteCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    rouletteCtx.lineWidth = 2;
    rouletteCtx.stroke();

    // 绘制转盘扇形（固定不动）- 更鲜艳的颜色
    const colors = [
        { base: '#FF3B3F', light: '#FF6B6F' },  // 红色
        { base: '#FFD700', light: '#FFE44D' },  // 金色
        { base: '#4169E1', light: '#6A89FF' },  // 蓝色
        { base: '#32CD32', light: '#5EE55E' },  // 绿色
        { base: '#FF1493', light: '#FF52B8' },  // 粉色
        { base: '#FF8C00', light: '#FFB347' },  // 橙色
        { base: '#9370DB', light: '#B89FE8' },  // 紫色
        { base: '#00CED1', light: '#4DE3E6' }   // 青色
    ];

    for (let i = 0; i < sections; i++) {
        const startAngle = i * anglePerSection;
        const endAngle = startAngle + anglePerSection;

        // 绘制扇形基础
        rouletteCtx.beginPath();
        rouletteCtx.moveTo(centerX, centerY);
        rouletteCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        rouletteCtx.closePath();

        // 创建径向渐变效果
        const sectorGradient = rouletteCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        sectorGradient.addColorStop(0, colors[i].light);
        sectorGradient.addColorStop(1, colors[i].base);
        rouletteCtx.fillStyle = sectorGradient;
        rouletteCtx.fill();

        // 白色边框
        rouletteCtx.strokeStyle = 'white';
        rouletteCtx.lineWidth = 4;
        rouletteCtx.stroke();

        // 添加光泽效果
        rouletteCtx.beginPath();
        rouletteCtx.moveTo(centerX, centerY);
        rouletteCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        rouletteCtx.closePath();
        const shineGradient = rouletteCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        shineGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
        rouletteCtx.fillStyle = shineGradient;
        rouletteCtx.fill();

        // 添加扇形装饰点
        rouletteCtx.save();
        rouletteCtx.translate(centerX, centerY);
        rouletteCtx.rotate(startAngle + anglePerSection / 2);

        // 绘制装饰圆点
        for (let j = 0; j < 3; j++) {
            const dotRadius = radius * (0.65 + j * 0.1);
            rouletteCtx.beginPath();
            rouletteCtx.arc(0, -dotRadius, 3, 0, Math.PI * 2);
            rouletteCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            rouletteCtx.fill();
        }

        rouletteCtx.restore();
    }

    // 绘制中间装饰圆环
    const middleRingGradient = rouletteCtx.createRadialGradient(centerX, centerY, 45, centerX, centerY, 55);
    middleRingGradient.addColorStop(0, '#FFD700');
    middleRingGradient.addColorStop(1, '#FFA500');
    rouletteCtx.beginPath();
    rouletteCtx.arc(centerX, centerY, 55, 0, Math.PI * 2);
    rouletteCtx.strokeStyle = middleRingGradient;
    rouletteCtx.lineWidth = 6;
    rouletteCtx.stroke();

    // 绘制中心圆 - 更立体的效果
    const centerGradient = rouletteCtx.createRadialGradient(centerX - 10, centerY - 10, 0, centerX, centerY, 45);
    centerGradient.addColorStop(0, '#FFE44D');
    centerGradient.addColorStop(0.4, '#FFD700');
    centerGradient.addColorStop(0.7, '#FFA500');
    centerGradient.addColorStop(1, '#FF8C00');
    rouletteCtx.beginPath();
    rouletteCtx.arc(centerX, centerY, 45, 0, Math.PI * 2);
    rouletteCtx.fillStyle = centerGradient;
    rouletteCtx.fill();

    // 中心圆白色边框
    rouletteCtx.strokeStyle = 'white';
    rouletteCtx.lineWidth = 4;
    rouletteCtx.stroke();

    // 中心圆光泽
    rouletteCtx.beginPath();
    rouletteCtx.arc(centerX - 8, centerY - 8, 15, 0, Math.PI * 2);
    rouletteCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    rouletteCtx.fill();

    // 绘制旋转的指针 - 更精致的设计
    rouletteCtx.save();
    rouletteCtx.translate(centerX, centerY);
    rouletteCtx.rotate(pointerAngle);

    // 指针阴影
    rouletteCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    rouletteCtx.shadowBlur = 15;
    rouletteCtx.shadowOffsetX = 0;
    rouletteCtx.shadowOffsetY = 8;

    // 指针主体（更细长的三角形）
    rouletteCtx.beginPath();
    rouletteCtx.moveTo(0, -radius + 25); // 指针尖端
    rouletteCtx.lineTo(-15, -radius + 85); // 左边
    rouletteCtx.lineTo(0, -radius + 75); // 底部中点
    rouletteCtx.lineTo(15, -radius + 85); // 右边
    rouletteCtx.closePath();

    const pointerGradient = rouletteCtx.createLinearGradient(0, -radius + 25, 0, -radius + 85);
    pointerGradient.addColorStop(0, '#ff1744');
    pointerGradient.addColorStop(0.5, '#ff5252');
    pointerGradient.addColorStop(1, '#d32f2f');
    rouletteCtx.fillStyle = pointerGradient;
    rouletteCtx.fill();

    // 指针白色边框
    rouletteCtx.strokeStyle = 'white';
    rouletteCtx.lineWidth = 3;
    rouletteCtx.stroke();

    // 指针上的光泽效果
    rouletteCtx.beginPath();
    rouletteCtx.moveTo(-5, -radius + 35);
    rouletteCtx.lineTo(-8, -radius + 75);
    rouletteCtx.lineTo(0, -radius + 70);
    rouletteCtx.closePath();
    rouletteCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    rouletteCtx.fill();

    // 指针基座
    rouletteCtx.shadowBlur = 5;
    rouletteCtx.beginPath();
    rouletteCtx.arc(0, 0, 20, 0, Math.PI * 2);
    const baseGradient = rouletteCtx.createRadialGradient(-3, -3, 0, 0, 0, 20);
    baseGradient.addColorStop(0, '#ff5252');
    baseGradient.addColorStop(1, '#d32f2f');
    rouletteCtx.fillStyle = baseGradient;
    rouletteCtx.fill();
    rouletteCtx.strokeStyle = 'white';
    rouletteCtx.lineWidth = 3;
    rouletteCtx.stroke();

    rouletteCtx.restore();
}

function spinRoulette() {
    if (isSpinning) return;

    isSpinning = true;
    document.getElementById('spinBtn').disabled = true;
    document.getElementById('rouletteResult').textContent = '';

    // 随机旋转圈数和角度
    const extraSpins = 5 + Math.random() * 3; // 5-8圈
    const randomAngle = Math.random() * Math.PI * 2;
    const totalRotation = extraSpins * Math.PI * 2 + randomAngle;

    const duration = 3000; // 3秒
    const startTime = Date.now();
    const startAngle = pointerAngle;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数
        const easeOut = 1 - Math.pow(1 - progress, 3);
        pointerAngle = startAngle + totalRotation * easeOut;

        drawRoulette();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            document.getElementById('rouletteResult').textContent = '🍺 喝酒！';
        }
    }

    animate();
}

// ========== 大转盘增强版游戏 ==========
let advancedRouletteCanvas, advancedRouletteCtx;
let advancedRouletteItems = [];
let isAdvancedSpinning = false;
let advancedPointerAngle = 0;

function startAdvancedRoulette() {
    const itemsText = document.getElementById('advancedRouletteItems').value.trim();
    if (!itemsText) {
        alert('请至少输入一个扇形内容！');
        return;
    }

    advancedRouletteItems = itemsText.split('\n').filter(item => item.trim() !== '');
    if (advancedRouletteItems.length < 2) {
        alert('请至少输入两个扇形内容！');
        return;
    }

    document.getElementById('rouletteAdvancedSetup').style.display = 'none';
    document.getElementById('rouletteAdvancedContainer').style.display = 'block';

    advancedRouletteCanvas = document.getElementById('rouletteAdvancedCanvas');
    advancedRouletteCtx = advancedRouletteCanvas.getContext('2d');
    advancedPointerAngle = -Math.PI / 2;
    document.getElementById('rouletteAdvancedResult').textContent = '';

    drawAdvancedRoulette();
}

function drawAdvancedRoulette() {
    const centerX = advancedRouletteCanvas.width / 2;
    const centerY = advancedRouletteCanvas.height / 2;
    const radius = 230;
    const sections = advancedRouletteItems.length;
    const anglePerSection = (Math.PI * 2) / sections;

    // 清空画布
    advancedRouletteCtx.clearRect(0, 0, advancedRouletteCanvas.width, advancedRouletteCanvas.height);

    // 绘制外圈金属质感装饰
    const outerRingGradient = advancedRouletteCtx.createLinearGradient(centerX - radius - 18, centerY - radius - 18, centerX + radius + 18, centerY + radius + 18);
    outerRingGradient.addColorStop(0, '#FFD700');
    outerRingGradient.addColorStop(0.5, '#FFA500');
    outerRingGradient.addColorStop(1, '#FF8C00');
    advancedRouletteCtx.beginPath();
    advancedRouletteCtx.arc(centerX, centerY, radius + 18, 0, Math.PI * 2);
    advancedRouletteCtx.strokeStyle = outerRingGradient;
    advancedRouletteCtx.lineWidth = 14;
    advancedRouletteCtx.stroke();

    // 绘制外圈阴影
    advancedRouletteCtx.beginPath();
    advancedRouletteCtx.arc(centerX, centerY, radius + 11, 0, Math.PI * 2);
    advancedRouletteCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    advancedRouletteCtx.lineWidth = 2;
    advancedRouletteCtx.stroke();

    // 绘制转盘扇形（固定不动）- 更丰富的颜色
    const colorPalette = [
        { base: '#FF3B3F', light: '#FF6B6F' },  // 红色
        { base: '#FFD700', light: '#FFE44D' },  // 金色
        { base: '#4169E1', light: '#6A89FF' },  // 蓝色
        { base: '#32CD32', light: '#5EE55E' },  // 绿色
        { base: '#FF1493', light: '#FF52B8' },  // 粉色
        { base: '#FF8C00', light: '#FFB347' },  // 橙色
        { base: '#9370DB', light: '#B89FE8' },  // 紫色
        { base: '#00CED1', light: '#4DE3E6' },  // 青色
        { base: '#FF6347', light: '#FF8A75' },  // 番茄红
        { base: '#8B4789', light: '#B575B3' }   // 深紫
    ];

    for (let i = 0; i < sections; i++) {
        const startAngle = i * anglePerSection;
        const endAngle = startAngle + anglePerSection;
        const colorIndex = i % colorPalette.length;

        // 绘制扇形基础
        advancedRouletteCtx.beginPath();
        advancedRouletteCtx.moveTo(centerX, centerY);
        advancedRouletteCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        advancedRouletteCtx.closePath();

        // 创建径向渐变效果
        const sectorGradient = advancedRouletteCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        sectorGradient.addColorStop(0, colorPalette[colorIndex].light);
        sectorGradient.addColorStop(1, colorPalette[colorIndex].base);
        advancedRouletteCtx.fillStyle = sectorGradient;
        advancedRouletteCtx.fill();

        // 白色边框
        advancedRouletteCtx.strokeStyle = 'white';
        advancedRouletteCtx.lineWidth = 4;
        advancedRouletteCtx.stroke();

        // 添加光泽效果
        advancedRouletteCtx.beginPath();
        advancedRouletteCtx.moveTo(centerX, centerY);
        advancedRouletteCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        advancedRouletteCtx.closePath();
        const shineGradient = advancedRouletteCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        shineGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
        advancedRouletteCtx.fillStyle = shineGradient;
        advancedRouletteCtx.fill();

        // 绘制文字
        advancedRouletteCtx.save();
        advancedRouletteCtx.translate(centerX, centerY);
        advancedRouletteCtx.rotate(startAngle + anglePerSection / 2);
        advancedRouletteCtx.textAlign = 'center';
        advancedRouletteCtx.fillStyle = 'white';
        advancedRouletteCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        advancedRouletteCtx.lineWidth = 3;

        // 根据扇形数量调整字体大小
        const fontSize = Math.max(14, Math.min(20, 220 / sections));
        advancedRouletteCtx.font = `bold ${fontSize}px Arial`;

        // 处理长文本换行
        const text = advancedRouletteItems[i];
        const maxWidth = radius * 0.5;
        const words = text.split('');
        let line = '';
        const lines = [];

        for (let j = 0; j < words.length; j++) {
            const testLine = line + words[j];
            const metrics = advancedRouletteCtx.measureText(testLine);
            if (metrics.width > maxWidth && j > 0) {
                lines.push(line);
                line = words[j];
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        // 绘制多行文字（带描边）
        const lineHeight = fontSize + 4;
        const totalHeight = lines.length * lineHeight;
        const startY = -totalHeight / 2 + lineHeight / 2;

        for (let k = 0; k < lines.length; k++) {
            const y = startY + k * lineHeight;
            advancedRouletteCtx.strokeText(lines[k], radius * 0.65, y);
            advancedRouletteCtx.fillText(lines[k], radius * 0.65, y);
        }

        advancedRouletteCtx.restore();
    }

    // 绘制中间装饰圆环
    const middleRingGradient = advancedRouletteCtx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 62);
    middleRingGradient.addColorStop(0, '#FFD700');
    middleRingGradient.addColorStop(1, '#FFA500');
    advancedRouletteCtx.beginPath();
    advancedRouletteCtx.arc(centerX, centerY, 62, 0, Math.PI * 2);
    advancedRouletteCtx.strokeStyle = middleRingGradient;
    advancedRouletteCtx.lineWidth = 7;
    advancedRouletteCtx.stroke();

    // 绘制中心圆 - 更立体的效果
    const centerGradient = advancedRouletteCtx.createRadialGradient(centerX - 12, centerY - 12, 0, centerX, centerY, 50);
    centerGradient.addColorStop(0, '#FFE44D');
    centerGradient.addColorStop(0.4, '#FFD700');
    centerGradient.addColorStop(0.7, '#FFA500');
    centerGradient.addColorStop(1, '#FF8C00');
    advancedRouletteCtx.beginPath();
    advancedRouletteCtx.arc(centerX, centerY, 50, 0, Math.PI * 2);
    advancedRouletteCtx.fillStyle = centerGradient;
    advancedRouletteCtx.fill();

    // 中心圆白色边框
    advancedRouletteCtx.strokeStyle = 'white';
    advancedRouletteCtx.lineWidth = 5;
    advancedRouletteCtx.stroke();

    // 中心圆光泽
    advancedRouletteCtx.beginPath();
    advancedRouletteCtx.arc(centerX - 10, centerY - 10, 18, 0, Math.PI * 2);
    advancedRouletteCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    advancedRouletteCtx.fill();

    // 绘制旋转的指针 - 更精致的设计
    advancedRouletteCtx.save();
    advancedRouletteCtx.translate(centerX, centerY);
    advancedRouletteCtx.rotate(advancedPointerAngle);

    // 指针阴影
    advancedRouletteCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    advancedRouletteCtx.shadowBlur = 18;
    advancedRouletteCtx.shadowOffsetX = 0;
    advancedRouletteCtx.shadowOffsetY = 10;

    // 指针主体（更细长的三角形）
    advancedRouletteCtx.beginPath();
    advancedRouletteCtx.moveTo(0, -radius + 28);
    advancedRouletteCtx.lineTo(-18, -radius + 95);
    advancedRouletteCtx.lineTo(0, -radius + 83);
    advancedRouletteCtx.lineTo(18, -radius + 95);
    advancedRouletteCtx.closePath();

    const pointerGradient = advancedRouletteCtx.createLinearGradient(0, -radius + 28, 0, -radius + 95);
    pointerGradient.addColorStop(0, '#ff1744');
    pointerGradient.addColorStop(0.5, '#ff5252');
    pointerGradient.addColorStop(1, '#d32f2f');
    advancedRouletteCtx.fillStyle = pointerGradient;
    advancedRouletteCtx.fill();

    // 指针白色边框
    advancedRouletteCtx.strokeStyle = 'white';
    advancedRouletteCtx.lineWidth = 3;
    advancedRouletteCtx.stroke();

    // 指针上的光泽效果
    advancedRouletteCtx.beginPath();
    advancedRouletteCtx.moveTo(-6, -radius + 40);
    advancedRouletteCtx.lineTo(-9, -radius + 85);
    advancedRouletteCtx.lineTo(0, -radius + 78);
    advancedRouletteCtx.closePath();
    advancedRouletteCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    advancedRouletteCtx.fill();

    // 指针基座
    advancedRouletteCtx.shadowBlur = 6;
    advancedRouletteCtx.beginPath();
    advancedRouletteCtx.arc(0, 0, 23, 0, Math.PI * 2);
    const baseGradient = advancedRouletteCtx.createRadialGradient(-4, -4, 0, 0, 0, 23);
    baseGradient.addColorStop(0, '#ff5252');
    baseGradient.addColorStop(1, '#d32f2f');
    advancedRouletteCtx.fillStyle = baseGradient;
    advancedRouletteCtx.fill();
    advancedRouletteCtx.strokeStyle = 'white';
    advancedRouletteCtx.lineWidth = 3;
    advancedRouletteCtx.stroke();

    advancedRouletteCtx.restore();
}

function spinAdvancedRoulette() {
    if (isAdvancedSpinning) return;

    isAdvancedSpinning = true;
    document.getElementById('spinAdvancedBtn').disabled = true;
    document.getElementById('rouletteAdvancedResult').textContent = '';

    // 随机旋转圈数和角度
    const extraSpins = 5 + Math.random() * 3;
    const randomAngle = Math.random() * Math.PI * 2;
    const totalRotation = extraSpins * Math.PI * 2 + randomAngle;

    const duration = 3000;
    const startTime = Date.now();
    const startAngle = advancedPointerAngle;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);
        advancedPointerAngle = startAngle + totalRotation * easeOut;

        drawAdvancedRoulette();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isAdvancedSpinning = false;
            document.getElementById('spinAdvancedBtn').disabled = false;

            // 计算获胜者
            const normalizedAngle = ((advancedPointerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const pointerAngle = Math.PI / 2;
            const winnerAngle = (pointerAngle - normalizedAngle + Math.PI * 2) % (Math.PI * 2);
            const anglePerSection = (Math.PI * 2) / advancedRouletteItems.length;
            const winnerIndex = Math.floor(winnerAngle / anglePerSection);

            document.getElementById('rouletteAdvancedResult').textContent =
                `🎯 ${advancedRouletteItems[winnerIndex]}`;
        }
    }

    animate();
}

function resetAdvancedRoulette() {
    document.getElementById('rouletteAdvancedSetup').style.display = 'block';
    document.getElementById('rouletteAdvancedContainer').style.display = 'none';
    advancedRouletteItems = [];
}

// ========== 炸弹游戏 ==========
let bombPositions = [];
let explodedPosition = -1;

function initBombGame() {
    explodedPosition = Math.floor(Math.random() * 9);
    bombPositions = new Array(9).fill(false);

    document.getElementById('bombResult').textContent = '';

    const bombGrid = document.getElementById('bombGrid');
    bombGrid.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const bombItem = document.createElement('button');
        bombItem.className = 'bomb-item';
        bombItem.textContent = '💣';
        bombItem.onclick = () => clickBomb(i, bombItem);
        bombGrid.appendChild(bombItem);
    }
}

function clickBomb(position, element) {
    if (bombPositions[position]) return; // 已经点击过

    bombPositions[position] = true;
    element.classList.add('clicked');

    if (position === explodedPosition) {
        // 炸弹爆炸
        element.classList.add('exploded');
        element.textContent = '💥';

        // 创建爆炸粒子效果
        createExplosionParticles(element);

        // 添加震动效果
        vibrateScreen();

        document.getElementById('bombResult').textContent = '💥 中弹了！喝酒！';

        // 禁用所有炸弹
        document.querySelectorAll('.bomb-item').forEach(item => {
            item.style.pointerEvents = 'none';
        });
    } else {
        // 安全
        element.textContent = '✓';
    }
}

// 创建爆炸粒子效果
function createExplosionParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 创建多个粒子
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        // 随机颜色
        const colors = ['#ff6b6b', '#ffa500', '#ffff00', '#ff4500'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        // 随机大小
        const size = Math.random() * 15 + 5;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        // 起始位置
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';

        document.body.appendChild(particle);

        // 随机方向和速度
        const angle = (Math.PI * 2 * i) / 20;
        const velocity = Math.random() * 100 + 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        // 动画
        particle.animate([
            {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => particle.remove();
    }

    // 创建冲击波效果
    const shockwave = document.createElement('div');
    shockwave.className = 'shockwave';
    shockwave.style.left = centerX + 'px';
    shockwave.style.top = centerY + 'px';
    document.body.appendChild(shockwave);

    shockwave.animate([
        {
            transform: 'translate(-50%, -50%) scale(0)',
            opacity: 0.8
        },
        {
            transform: 'translate(-50%, -50%) scale(3)',
            opacity: 0
        }
    ], {
        duration: 600,
        easing: 'ease-out'
    }).onfinish = () => shockwave.remove();
}

// 震动效果
function vibrateScreen() {
    // 如果支持振动API，触发设备振动
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }

    // 屏幕震动动画
    const container = document.querySelector('.game-container');
    container.classList.add('shake');
    setTimeout(() => {
        container.classList.remove('shake');
    }, 500);
}

function resetBombGame() {
    initBombGame();
}

// ========== 贪吃蛇游戏（原有代码） ==========
// 游戏状态
let ws = null;
let canvas, ctx;
let cellSize = 16;
let myPlayerId = null;
let hasShownDeathNotification = false; // 记录是否已显示过死亡通知
let lastDirection = null; // 记录上次发送的方向，避免重复发送
let directionQueue = []; // 方向指令队列

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

// 发送方向指令（优化：避免重复发送相同方向）
function sendDirection(direction) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    // 避免重复发送相同方向
    if (direction === lastDirection) {
        return;
    }

    lastDirection = direction;

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
