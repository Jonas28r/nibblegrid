const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20; 
const tileCount = canvas.width / gridSize;

let snake = [];
let dir = { x: 0, y: 0 };
let nextDir = { x: 0, y: 0 };
let items = []; 
let score = 0;
let coins = 0;
let level = 1;
let gameInterval = null;
let isImmune = false;
let gameSpeed = 150; // Un poco más lento para poder apreciar los gráficos

let currentSkin = 'classic';
let unlockedSkins = ['classic'];
const skinsConfig = {
    classic: { body: '#00cc52', head: '#00ff66', outline: '#004d1f' },
    neon: { body: '#0088cc', head: '#00d9ff', outline: '#00334d' },
    gold: { body: '#ccac00', head: '#ffd700', outline: '#4d4000' }
};

// Mapas (0 = Vacío, 1 = Obstáculo)
const maps = {
    1: [], 
    2: [   
        {x: 5, y: 5}, {x: 5, y: 6}, {x: 6, y: 5},
        {x: 14, y: 5}, {x: 14, y: 6}, {x: 13, y: 5},
        {x: 5, y: 14}, {x: 5, y: 13}, {x: 6, y: 14},
        {x: 14, y: 14}, {x: 14, y: 13}, {x: 13, y: 14}
    ],
    3: [   
        {x: 4, y: 10}, {x: 5, y: 10}, {x: 6, y: 10}, {x: 7, y: 10},
        {x: 12, y: 10}, {x: 13, y: 10}, {x: 14, y: 10}, {x: 15, y: 10},
        {x: 10, y: 4}, {x: 10, y: 5}, {x: 10, y: 15}, {x: 10, y: 16}
    ]
};

// Catálogo de ítems usando Emojis (¡Estilo Candy Crush!)
const itemTypes = [
    { name: 'apple', emoji: '🍎', points: 10, weight: 0.3 },
    { name: 'banana', emoji: '🍌', points: 15, weight: 0.2 },
    { name: 'cherry', emoji: '🍒', points: 20, weight: 0.2 },
    { name: 'candy', emoji: '🍬', points: 30, weight: 0.15 },
    { name: 'lollipop', emoji: '🍭', points: 40, weight: 0.1 },
    { name: 'star', emoji: '⭐', points: 10, weight: 0.05, power: 'immunity' }
];

function startGame() {
    document.getElementById("overlay").classList.add("hidden");
    resetGameState();
    spawnItem();
    if(gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function resetGameState() {
    snake = [{ x: 10, y: 15 }, { x: 10, y: 16 }, { x: 10, y: 17 }];
    dir = { x: 0, y: -1 };
    nextDir = { x: 0, y: -1 };
    score = 0;
    level = 1;
    isImmune = false;
    gameSpeed = 150;
    items = [];
    updateHUD();
}

function gameLoop() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (checkCollision(head)) {
        if (!isImmune) {
            endGame();
            return;
        } else {
            if (head.x < 0) head.x = tileCount - 1;
            if (head.x >= tileCount) head.x = 0;
            if (head.y < 0) head.y = tileCount - 1;
            if (head.y >= tileCount) head.y = 0;
        }
    }

    snake.unshift(head);

    let ate = false;
    for (let i = 0; i < items.length; i++) {
        if (head.x === items[i].x && head.y === items[i].y) {
            handleItemConsumption(items[i]);
            items.splice(i, 1);
            ate = true;
            spawnItem();
            break;
        }
    }

    if (!ate) snake.pop();
    draw();
}

function checkCollision(position) {
    if (position.x < 0 || position.x >= tileCount || position.y < 0 || position.y >= tileCount) return true;
    for (let i = 1; i < snake.length; i++) {
        if (position.x === snake[i].x && position.y === snake[i].y) return true;
    }
    const currentObstacles = maps[level] || [];
    for (let obs of currentObstacles) {
        if (position.x === obs.x && position.y === obs.y) return true;
    }
    return false;
}

function handleItemConsumption(item) {
    score += item.type.points;
    coins += Math.floor(item.type.points / 2);

    if (item.type.power === 'immunity') activateImmunity();

    if (score >= 200 && level === 1) triggerNextLevel(2, 130);
    else if (score >= 500 && level === 2) triggerNextLevel(3, 110);

    updateHUD();
}

function activateImmunity() {
    isImmune = true;
    document.getElementById("powerup-status").classList.remove("hidden");
    setTimeout(() => {
        isImmune = false;
        document.getElementById("powerup-status").classList.add("hidden");
    }, 6000);
}

function triggerNextLevel(nextLvl, speed) {
    level = nextLvl;
    gameSpeed = speed;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    items = [];
}

function spawnItem() {
    let x, y, valid = false;
    while (!valid) {
        x = Math.floor(Math.random() * tileCount);
        y = Math.floor(Math.random() * tileCount);
        valid = true;

        for (let cell of snake) if (cell.x === x && cell.y === y) valid = false;
        
        const currentObstacles = maps[level] || [];
        for (let obs of currentObstacles) if (obs.x === x && obs.y === y) valid = false;
    }

    const rand = Math.random();
    let selectedType = itemTypes[0];
    let cumulativeWeight = 0;
    for (let type of itemTypes) {
        cumulativeWeight += type.weight;
        if (rand <= cumulativeWeight) {
            selectedType = type;
            break;
        }
    }
    items.push({ x, y, type: selectedType });
}

// RENDERIZADO VISUAL MEJORADO
function draw() {
    // 1. Fondo del nivel (Tablero de ajedrez sutil)
    ctx.fillStyle = "#1a1e24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#20252b";
    for (let row = 0; row < tileCount; row++) {
        for (let col = 0; col < tileCount; col++) {
            if ((row + col) % 2 === 0) {
                ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
            }
        }
    }

    // 2. Obstáculos (Paredes estilo bloque 3D)
    const currentObstacles = maps[level] || [];
    for (let obs of currentObstacles) {
        const x = obs.x * gridSize;
        const y = obs.y * gridSize;
        
        ctx.fillStyle = "#4a4e59"; // Color base
        ctx.fillRect(x, y, gridSize, gridSize);
        
        // Bordes para dar volumen
        ctx.fillStyle = "#656a78"; // Brillo arriba
        ctx.fillRect(x, y, gridSize, 3);
        ctx.fillStyle = "#2d3038"; // Sombra abajo
        ctx.fillRect(x, y + gridSize - 3, gridSize, 3);
    }

    // 3. Dibujar Ítems (Emojis)
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let item of items) {
        const cx = (item.x * gridSize) + gridSize / 2;
        const cy = (item.y * gridSize) + gridSize / 2 + 2; // +2 para centrar verticalmente mejor
        ctx.fillText(item.type.emoji, cx, cy);
    }

    // 4. Dibujar la Serpiente (Curvas y Ojos)
    const colors = skinsConfig[currentSkin];
    
    snake.forEach((cell, index) => {
        const cx = (cell.x * gridSize) + gridSize / 2;
        const cy = (cell.y * gridSize) + gridSize / 2;
        
        ctx.fillStyle = index === 0 ? colors.head : colors.body;
        
        if (isImmune) ctx.fillStyle = `hsl(${Date.now() % 360}, 100%, 60%)`;

        // Dibujar cuerpo como círculos conectados
        ctx.beginPath();
        ctx.arc(cx, cy, gridSize/2 - 1, 0, 2 * Math.PI);
        ctx.fill();
        
        // Si no es el último, dibujar un puente hacia el siguiente segmento para que se vea continua
        if (index < snake.length - 1) {
            const nextCell = snake[index + 1];
            const nx = (nextCell.x * gridSize) + gridSize / 2;
            const ny = (nextCell.y * gridSize) + gridSize / 2;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.lineWidth = gridSize - 2;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.stroke();
        }

        // Dibujar Ojos en la cabeza
        if (index === 0) {
            ctx.fillStyle = "white";
            let eye1 = { x: 0, y: 0 }, eye2 = { x: 0, y: 0 };
            const offset = 4;
            
            // Posicionar ojos según dirección
            if (dir.x === 1) { eye1 = {x: cx+offset, y: cy-offset}; eye2 = {x: cx+offset, y: cy+offset}; }
            else if (dir.x === -1) { eye1 = {x: cx-offset, y: cy-offset}; eye2 = {x: cx-offset, y: cy+offset}; }
            else if (dir.y === 1) { eye1 = {x: cx-offset, y: cy+offset}; eye2 = {x: cx+offset, y: cy+offset}; }
            else if (dir.y === -1) { eye1 = {x: cx-offset, y: cy-offset}; eye2 = {x: cx+offset, y: cy-offset}; }
            else { eye1 = {x: cx-offset, y: cy-offset}; eye2 = {x: cx+offset, y: cy-offset}; } // Default arriba

            // Blancos del ojo
            ctx.beginPath(); ctx.arc(eye1.x, eye1.y, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(eye2.x, eye2.y, 3, 0, Math.PI*2); ctx.fill();
            
            // Pupilas
            ctx.fillStyle = "black";
            ctx.beginPath(); ctx.arc(eye1.x, eye1.y, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(eye2.x, eye2.y, 1.5, 0, Math.PI*2); ctx.fill();
        }
    });
}

function updateHUD() {
    document.getElementById("score-val").innerText = score;
    document.getElementById("coins-val").innerText = coins;
    document.getElementById("level-val").innerText = level;
}

function endGame() {
    clearInterval(gameInterval);
    document.getElementById("overlay").classList.remove("hidden");
    document.getElementById("overlay-title").innerText = "FIN DEL JUEGO";
    document.getElementById("overlay-desc").innerText = `¡Llegaste al nivel ${level} con ${score} puntos!`;
    document.getElementById("start-btn").innerText = "Volver a Intentar";
}

function buySkin(skinId, price) {
    if (unlockedSkins.includes(skinId)) {
        currentSkin = skinId;
    } else if (coins >= price) {
        coins -= price;
        unlockedSkins.push(skinId);
        currentSkin = skinId;
        updateHUD();
    } else {
        alert("¡No tienes suficientes monedas!");
        return;
    }
    
    Object.keys(skinsConfig).forEach(id => {
        const itemEl = document.getElementById(`skin-${id}`);
        const btn = itemEl.querySelector("button");
        if (currentSkin === id) {
            btn.innerText = "Equipado";
            btn.className = "active";
        } else if (unlockedSkins.includes(id)) {
            btn.innerText = "Equipar";
            btn.className = "";
        } else {
            btn.className = "";
        }
    });
    draw();
}

// Controles Teclado PC
window.addEventListener("keydown", e => {
    switch (e.key) {
        case "ArrowUp":    case "w": case "W": if (dir.y !== 1)  nextDir = { x: 0, y: -1 }; break;
        case "ArrowDown":  case "s": case "S": if (dir.y !== -1) nextDir = { x: 0, y: 1 };  break;
        case "ArrowLeft":  case "a": case "A": if (dir.x !== 1)  nextDir = { x: -1, y: 0 }; break;
        case "ArrowRight": case "d": case "D": if (dir.x !== -1) nextDir = { x: 1, y: 0 };  break;
    }
});

// Controles Táctiles Celular (Swipe)
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

canvas.addEventListener('touchend', function(e) {
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, false);

function handleSwipe(startX, startY, endX, endY) {
    let dx = endX - startX;
    let dy = endY - startY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        // Movimiento horizontal
        if (dx > 30 && dir.x !== -1) nextDir = { x: 1, y: 0 }; // Derecha
        else if (dx < -30 && dir.x !== 1) nextDir = { x: -1, y: 0 }; // Izquierda
    } else {
        // Movimiento vertical
        if (dy > 30 && dir.y !== -1) nextDir = { x: 0, y: 1 }; // Abajo
        else if (dy < -30 && dir.y !== 1) nextDir = { x: 0, y: -1 }; // Arriba
    }
}
