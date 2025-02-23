const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// 添加音效
const eatSound = new Audio('sounds/eat.mp3');
const gameOverSound = new Audio('sounds/gameover.mp3');
const levelUpSound = new Audio('sounds/levelup.mp3');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

// 添加关卡系统
let level = 1;
let gameSpeed = 100;
const speedIncreasePerLevel = 10;
let requiredScoreForNextLevel = 50;

let snake = [
    { x: 10, y: 10 }
];
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};
let dx = 0;
let dy = 0;
let score = 0;

document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
    }
}

function drawGame() {
    // 清空画布
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画网格背景
    drawGrid();

    // 画食物
    drawFood();

    // 画蛇
    drawSnake();

    // 移动蛇
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        eatSound.play();
        
        // 检查是否升级
        if (score >= requiredScoreForNextLevel) {
            levelUp();
        }
        
        food = generateNewFood();
    } else {
        snake.pop();
    }

    // 检查游戏结束条件
    if (gameOver()) {
        gameOverSound.play();
        alert(`游戏结束！\n最终得分：${score}\n达到等级：${level}`);
        resetGame();
    }
}

function drawGrid() {
    ctx.strokeStyle = '#1a1a1a';
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

function drawFood() {
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function drawSnake() {
    snake.forEach((segment, index) => {
        // 蛇头
        if (index === 0) {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize/2,
                segment.y * gridSize + gridSize/2,
                gridSize/2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // 画眼睛
            ctx.fillStyle = 'black';
            const eyeSize = 3;
            ctx.fillRect(
                segment.x * gridSize + gridSize/3,
                segment.y * gridSize + gridSize/3,
                eyeSize,
                eyeSize
            );
            ctx.fillRect(
                segment.x * gridSize + gridSize*2/3,
                segment.y * gridSize + gridSize/3,
                eyeSize,
                eyeSize
            );
        } 
        // 蛇身
        else {
            ctx.fillStyle = `hsl(${120 + index * 5}, 100%, ${50 - index * 2}%)`;
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize/2,
                segment.y * gridSize + gridSize/2,
                gridSize/2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });
}

function gameOver() {
    // 撞墙
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= tileCount;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= tileCount;

    if (hitLeftWall || hitRightWall || hitTopWall || hitBottomWall) {
        return true;
    }

    // 撞到自己
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }

    return false;
}

function levelUp() {
    level++;
    levelUpSound.play();
    requiredScoreForNextLevel += 50;
    gameSpeed = Math.max(50, 100 - (level - 1) * speedIncreasePerLevel);
    
    // 重新设置游戏循环速度
    clearInterval(gameLoop);
    gameLoop = setInterval(drawGame, gameSpeed);
    
    // 显示升级消息
    const levelDiv = document.createElement('div');
    levelDiv.className = 'level-up';
    levelDiv.textContent = `Level ${level}!`;
    document.body.appendChild(levelDiv);
    setTimeout(() => levelDiv.remove(), 2000);
}

function generateNewFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    level = 1;
    gameSpeed = 100;
    requiredScoreForNextLevel = 50;
    scoreElement.textContent = score;
    clearInterval(gameLoop);
    gameLoop = setInterval(drawGame, gameSpeed);
}

// 游戏主循环
let gameLoop = setInterval(drawGame, gameSpeed); 