const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configuración de la cuadrícula
const gridSize = 20; 
const tileCount = canvas.width / gridSize;

// Variables de Estado del Juego
let snake = [];
let dir = { x: 0, y: 0 };
let nextDir = { x: 0, y: 0 };
let items = []; // Almacena frutas/caramelos activos
let score = 0;
let coins = 0;
let level = 1;
let gameInterval = null;
let isImmune = false;
let gameSpeed = 130;

// Configuración de Skins
let currentSkin = 'classic';
let unlockedSkins = ['classic'];
const skinsConfig = {
    classic: { body: '#00ff66', head: '#00cc52' },
    neon: { body: '#00d9ff', head: '#0088cc' },
    gold: { body: '#ffd700', head: '#ccac00' }
};

// Mapas de los Niveles (0 = Vacío, 1 = Obstáculo)
const maps = {
    1: [], // Totalmente limpio
    2: [   // Columnas en las esquinas interiores
        {x: 5, y: 5}, {x: 5, y: 6}, {x: 6, y: 5},
        {x: 14, y: 5}, {x: 14, y: 6}, {x: 13, y: 5},
        {x: 5, y: 14}, {x: 5, y: 13}, {x: 6, y: 14},
        {x: 14, y: 14}, {x: 14, y: 13}, {x: 13, y: 14}
    ],
    3: [   // Barreras divisorias estilo laberinto horizontal
        {x: 4, y: 10}, {x: 5, y: 10}, {x: 6, y: 10}, {x: 7, y: 10},
        {x: 12, y: 10}, {x: 13, y: 10}, {x: 14, y: 10}, {x: 15, y: 10},
        {x: 10, y: 4}, {x: 10, y: 5}, {x: 10, y: 15}, {x: 10, y: 16}
    ]
};

// Tipos de Ítems Disponibles en el Grid
const itemTypes = [
    { name: 'apple', color: '#ff3333', points: 10, weight: 0.6 },
    { name: 'candy', color: '#ff33ff', points: 25, weight: 0.3 },
    { name: 'star', color: '#ffff33', points: 5, weight: 0.1, power: 'immunity' }
];

// Inicialización del Juego
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
    gameSpeed = 130;
    items = [];
    updateHUD();
}

// Bucle Principal de Renderizado y Física
function gameLoop() {
    dir = nextDir;
    
    // Mover Cabeza
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Validar Colisiones con Bordes o Mapas
    if (checkCollision(head)) {
        if (!isImmune) {
            endGame();
            return;
        } else {
            // Si es inmune, rebota o atraviesa el borde de forma segura
            if (head.x < 0) head.x = tileCount - 1;
            if (head.x >= tileCount) head.x = 0;
            if (head.y < 0) head.y = tileCount - 1;
            if (head.y >= tileCount) head.y = 0;
        }
    }

    snake.unshift(head);

    // Verificar si come algo
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

    if (!ate) {
        snake.pop();
    }

    // Dibujar Todo en Pantalla
    draw();
}

function checkCollision(position) {
    // Bordes del Mapa
    if (position.x < 0 || position.x >= tileCount || position.y < 0 || position.y >= tileCount) {
        return true;
    }
    // Chocar contra sí misma
    for (let i = 1; i < snake.length; i++) {
        if (position.x === snake[i].x && position.y === snake[i].y) return true;
    }
    // Obstáculos del mapa del nivel actual
    const currentObstacles = maps[level] || [];
    for (let obs of currentObstacles) {
        if (position.x === obs.x && position.y === obs.y) return true;
    }
    return false;
}

function handleItemConsumption(item) {
    score += item.type.points;
    coins += Math.floor(item.type.points / 2); // Ganancia de monedas reflectiva

    if (item.type.power === 'immunity') {
        activateImmunity();
    }

    // Sistema de Progresión de Niveles Basado en Puntuación
    if (score >= 100 && level === 1) triggerNextLevel(2, 110);
    else if (score >= 250 && level === 2) triggerNextLevel(3, 90);

    updateHUD();
}

function activateImmunity() {
    isImmune = true;
    document.getElementById("powerup-status").classList.remove("hidden");
    setTimeout(() => {
        isImmune = false;
        document.getElementById("powerup-status").classList.add("hidden");
    }, 6000); // 6 segundos de inmunidad dorada
}

function triggerNextLevel(nextLvl, speed) {
    level = nextLvl;
    gameSpeed = speed;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    items = [];
}

// Generación de ítems asegurando que no caigan sobre la serpiente ni paredes
function spawnItem() {
    let x, y, valid = false;
    while (!valid) {
        x = Math.floor(Math.random() * tileCount);
        y = Math.floor(Math.random() * tileCount);
        valid = true;

        // Comprobar colisión con la serpiente
        for (let cell of snake) {
            if (cell.x === x && cell.y === y) valid = false;
        }
        // Comprobar colisión con obstáculos del nivel
        const currentObstacles = maps[level] || [];
        for (let obs of currentObstacles) {
            if (obs.x === x && obs.y === y) valid = false;
        }
    }

    // Selección probabilística de ítems
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

// Renderizado Gráfico Completo
function draw() {
    // Limpiar Canvas
    ctx.fillStyle = "#0d0d0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar Obstáculos del Nivel Activo
    ctx.fillStyle = "#3a3a45";
    const currentObstacles = maps[level] || [];
    for (let obs of currentObstacles) {
        ctx.fillRect(obs.x * gridSize, obs.y * gridSize, gridSize - 1, gridSize - 1);
    }

    // Dibujar ítems activos en pantalla
    for (let item of items) {
        ctx.fillStyle = item.type.color;
        ctx.beginPath();
        ctx.arc((item.x * gridSize) + gridSize/2, (item.y * gridSize) + gridSize/2, gridSize/2 - 2, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Dibujar la Serpiente con el Skin seleccionado
    const colors = skinsConfig[currentSkin];
    snake.forEach((cell, index) => {
        ctx.fillStyle = index === 0 ? colors.head : colors.body;
        // Efecto visual si la inmunidad está encendida
        if (isImmune) ctx.fillStyle = `hsl(${Date.now() % 360}, 100%, 50%)`;
        
        ctx.fillRect(cell.x * gridSize, cell.y * gridSize, gridSize - 1, gridSize - 1);
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
    document.getElementById("overlay-desc").innerText = `¡Buen intento! Lograste llegar al nivel ${level} con ${score} puntos.`;
    document.getElementById("start-btn").innerText = "Volver a Intentar";
}

// Sistema de Gestión de Tienda (Persistente durante la sesión)
function buySkin(skinId, price) {
    if (unlockedSkins.includes(skinId)) {
        currentSkin = skinId;
    } else if (coins >= price) {
        coins -= price;
        unlockedSkins.push(skinId);
        currentSkin = skinId;
        updateHUD();
    } else {
        alert("¡No tienes suficientes puntos/monedas Nibble!");
        return;
    }
    
    // Actualizar UI de botones en la tienda
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

// Escuchador de Teclado (Controles WASD + Flechas con protección anti-suicidio)
window.addEventListener("keydown", e => {
    switch (e.key) {
        case "ArrowUp":    case "w": case "W": if (dir.y !== 1)  nextDir = { x: 0, y: -1 }; break;
        case "ArrowDown":  case "s": case "S": if (dir.y !== -1) nextDir = { x: 0, y: 1 };  break;
        case "ArrowLeft":  case "a": case "A": if (dir.x !== 1)  nextDir = { x: -1, y: 0 }; break;
        case "ArrowRight": case "d": case "D": if (dir.x !== -1) nextDir = { x: 1, y: 0 };  break;
    }
});
