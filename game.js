// --- 1. SISTEMA DE PRE-CARGA DE ASSETS ---
const imgAssets = {};
const assetNames = [
    "manzana_roja", "manzana_verde", "bomba", "banana", "melon", "money", 
    "ojo", "paleta", "cabeza_serpiente", "helado", "fuego", "fuego_azul", 
    "fresa", "granada", "chile", "caramelo", "candy", "boom", "chocolate", 
    "corazón", "zombie"
];

// Carga automática de todos los archivos .png desde la carpeta assets
assetNames.forEach(name => {
    imgAssets[name] = new Image();
    imgAssets[name].src = `assets/${name}.png`;
});

// --- 2. ESTADO GLOBAL Y PERSISTENCIA (APP) ---
let userData = JSON.parse(localStorage.getItem('nibbleGridApp')) || {
    coins: 0,
    maxLevel: 1,
    maxScore: 0,
    unlockedSkins: ['classic'],
    currentSkin: 'classic'
};

function saveProgress() {
    localStorage.setItem('nibbleGridApp', JSON.stringify(userData));
}

// Catálogo de Skins para el cuerpo de la serpiente
const skinsConfig = {
    classic: { id: 'classic', name: 'Mamba Verde', price: 0, color: '#00cc52', light: '#00ff66' },
    neon:    { id: 'neon', name: 'Cyber Pitón', price: 50, color: '#0088cc', light: '#00d9ff' },
    gold:    { id: 'gold', name: 'Cobra Real', price: 150, color: '#ccac00', light: '#ffd700' },
    lava:    { id: 'lava', name: 'Víbora Magma', price: 300, color: '#cc2900', light: '#ff5500' }
};

// --- 3. NAVEGACIÓN DE PANTALLAS ---
function navTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// --- 4. ACTUALIZACIÓN DE UI (PERFIL Y TIENDA) ---
function updateProfileUI() {
    document.getElementById('prof-level').innerText = userData.maxLevel;
    document.getElementById('prof-score').innerText = userData.maxScore;
    document.getElementById('prof-coins').innerText = '$' + userData.coins;

    const list = document.getElementById('unlocked-skins-list');
    list.innerHTML = '';
    
    userData.unlockedSkins.forEach(skinId => {
        const skin = skinsConfig[skinId];
        const isEquipped = userData.currentSkin === skinId;
        
        list.innerHTML += `
            <div class="skin-card ${isEquipped ? 'equipped' : ''}">
                <div class="skin-preview" style="background: linear-gradient(135deg, ${skin.light}, ${skin.color})"></div>
                <strong>${skin.name}</strong>
                ${isEquipped 
                    ? `<span style="color:#00ff66; font-size:0.8rem;">Equipada</span>` 
                    : `<button class="btn-icon" onclick="equipSkin('${skinId}')">Equipar</button>`
                }
            </div>
        `;
    });
}

function updateShopUI() {
    document.getElementById('shop-coins').innerText = '$' + userData.coins;
    const list = document.getElementById('all-skins-list');
    list.innerHTML = '';
    
    Object.values(skinsConfig).forEach(skin => {
        const isOwned = userData.unlockedSkins.includes(skin.id);
        
        list.innerHTML += `
            <div class="skin-card">
                <div class="skin-preview" style="background: linear-gradient(135deg, ${skin.light}, ${skin.color})"></div>
                <strong>${skin.name}</strong>
                ${isOwned 
                    ? `<span style="color:#aaa; font-size:0.9rem;">Ya la tienes</span>` 
                    : `<button class="btn-icon" style="background:#00ff66; color:#000;" onclick="buySkin('${skin.id}', ${skin.price})">Comprar $${skin.price}</button>`
                }
            </div>
        `;
    });
}

function equipSkin(id) {
    userData.currentSkin = id;
    saveProgress();
    updateProfileUI();
}

function buySkin(id, price) {
    if (userData.coins >= price) {
        userData.coins -= price;
        userData.unlockedSkins.push(id);
        userData.currentSkin = id;
        saveProgress();
        updateShopUI();
    } else {
        alert("¡Te faltan monedas!");
    }
}

// --- 5. MOTOR DEL JUEGO (CANVAS CON NUEVOS ASSETS) ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const virtualSize = 400; 
canvas.width = virtualSize;
canvas.height = virtualSize;
const gridSize = 20; 
const tileCount = virtualSize / gridSize;

let snake = [];
let dir = { x: 0, y: 0 };
let nextDir = { x: 0, y: 0 };
let items = []; 
let currentScore = 0;
let currentLevel = 1;
let gameInterval = null;
let isImmune = false;
let gameSpeed = 150;
let animationFrame = 0;

// Configuración de mapas y obstáculos
const maps = {
    1: [], 
    2: [   
        {x: 4, y: 4}, {x: 4, y: 5}, {x: 5, y: 4},
        {x: 15, y: 4}, {x: 15, y: 5}, {x: 14, y: 4},
        {x: 4, y: 15}, {x: 4, y: 14}, {x: 5, y: 15},
        {x: 15, y: 15}, {x: 15, y: 14}, {x: 14, y: 15}
    ]
};

// Configuración de ítems usando tus imágenes cargadas
const itemTypes = [
    { name: 'apple', image: imgAssets.manzana_roja, points: 10, weight: 0.25 },
    { name: 'banana', image: imgAssets.banana, points: 15, weight: 0.2 },
    { name: 'melon', image: imgAssets.melon, points: 20, weight: 0.15 },
    { name: 'fresa', image: imgAssets.fresa, points: 25, weight: 0.15 },
    { name: 'candy', image: imgAssets.candy, points: 30, weight: 0.1 },
    { name: 'chocolate', image: imgAssets.chocolate, points: 35, weight: 0.05 },
    { name: 'money', image: imgAssets.money, points: 50, weight: 0.05 }, 
    { name: 'star', image: imgAssets.corazón, points: 5, weight: 0.05, power: 'immunity' } 
];

function startGame() {
    document.getElementById("game-over-overlay").classList.add("hidden");
    snake = [{ x: 10, y: 15 }, { x: 10, y: 16 }, { x: 10, y: 17 }];
    dir = { x: 0, y: -1 }; nextDir = { x: 0, y: -1 };
    currentScore = 0; currentLevel = 1; isImmune = false;
    items = [];
    document.getElementById("game-score").innerText = currentScore;
    
    spawnItem();
    if(gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    
    requestAnimationFrame(renderVisuals);
}

function exitGame() {
    clearInterval(gameInterval);
    navTo('screen-home');
}

function gameLoop() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (checkCollision(head)) {
        if (!isImmune) { handleGameOver(); return; } 
        else {
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
            currentScore += items[i].type.points;
            userData.coins += Math.floor(items[i].type.points / 2);
            document.getElementById("game-score").innerText = currentScore;
            
            if (items[i].type.power === 'immunity') activateImmunity();
            
            items.splice(i, 1);
            ate = true;
            spawnItem();
            break;
        }
    }
    if (!ate) snake.pop();
    
    if (currentScore > 150 && currentLevel === 1) { currentLevel = 2; spawnItem(); }
}

function checkCollision(pos) {
    if (pos.x < 0 || pos.x >= tileCount || pos.y < 0 || pos.y >= tileCount) return true;
    for (let i = 1; i < snake.length; i++) { if (pos.x === snake[i].x && pos.y === snake[i].y) return true; }
    for (let obs of (maps[currentLevel] || [])) { if (pos.x === obs.x && pos.y === obs.y) return true; }
    return false;
}

function spawnItem() {
    let x, y, valid = false;
    while (!valid) {
        x = Math.floor(Math.random() * tileCount);
        y = Math.floor(Math.random() * tileCount);
        valid = true;
        for (let cell of snake) if (cell.x === x && cell.y === y) valid = false;
        for (let obs of (maps[currentLevel] || [])) if (obs.x === x && obs.y === y) valid = false;
    }
    const rand = Math.random();
    let sel = itemTypes[0], w = 0;
    for (let type of itemTypes) {
        w += type.weight;
        if (rand <= w) { sel = type; break; }
    }
    items.push({ x, y, type: sel });
}

function activateImmunity() {
    isImmune = true;
    document.getElementById("powerup-status").classList.remove("hidden");
    setTimeout(() => {
        isImmune = false;
        document.getElementById("powerup-status").classList.add("hidden");
    }, 6000);
}

function handleGameOver() {
    clearInterval(gameInterval);
    if (currentScore > userData.maxScore) userData.maxScore = currentScore;
    if (currentLevel > userData.maxLevel) userData.maxLevel = currentLevel;
    saveProgress();
    
    document.getElementById("end-score").innerText = currentScore;
    document.getElementById("game-over-overlay").classList.remove("hidden");
}

// --- 6. RENDERING GRÁFICO MEJORADO ---
function renderVisuals() {
    animationFrame++;
    
    // Suelo de Selva Estilo Tablero
    ctx.fillStyle = "#1b2a16";
    ctx.fillRect(0, 0, virtualSize, virtualSize);
    ctx.fillStyle = "#22351c";
    for (let r = 0; r < tileCount; r++) {
        for (let c = 0; c < tileCount; c++) {
            if ((r + c) % 2 === 0) ctx.fillRect(c * gridSize, r * gridSize, gridSize, gridSize);
        }
    }

    // Dibujar Ítems con Rebote y Efecto de Brillo Candy Crush
    items.forEach(item => {
        const cx = item.x * gridSize;
        const cy = item.y * gridSize;
        const bounce = Math.sin(animationFrame * 0.1 + item.x) * 3;
        
        ctx.save();
        // Sombra en el suelo
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); 
        ctx.ellipse(cx + gridSize/2, cy + gridSize - 2, 8, 4, 0, 0, Math.PI*2); 
        ctx.fill();

        // Efecto Glow (Brillo mágico de caramelos)
        ctx.shadowColor = "#fffb00";
        ctx.shadowBlur = 10;

        // Renderizado del Asset PNG
        if (item.type.image && item.type.image.complete) {
            ctx.drawImage(item.type.image, cx, cy + bounce, gridSize, gridSize);
        }
        ctx.restore();
    });

    // Dibujar Serpiente
    const activeSkin = skinsConfig[userData.currentSkin];
    snake.forEach((cell, index) => {
        const cx = cell.x * gridSize;
        const cy = cell.y * gridSize;
        
        if (index === 0) {
            // CABEZA: Tu asset "cabeza_serpiente.png"
            if (imgAssets.cabeza_serpiente && imgAssets.cabeza_serpiente.complete) {
                ctx.drawImage(imgAssets.cabeza_serpiente, cx, cy, gridSize, gridSize);
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.beginPath(); ctx.arc(cx + gridSize/2, cy + gridSize/2, gridSize/2, 0, Math.PI*2); ctx.fill();
            }
        } else {
            // CUERPO: Efecto Esferas 2.5D dinámicas
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath(); ctx.ellipse(cx + gridSize/2, cy + gridSize/2 + 4, gridSize/2, gridSize/4, 0, 0, Math.PI*2); ctx.fill();

            let grad = ctx.createRadialGradient(cx + gridSize/3, cy + gridSize/3, 2, cx + gridSize/2, cy + gridSize/2, gridSize/2);
            grad.addColorStop(0, isImmune ? '#ffffff' : activeSkin.light);
            grad.addColorStop(1, activeSkin.color);
            
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx + gridSize/2, cy + gridSize/2, gridSize/2 - 1, 0, Math.PI*2); ctx.fill();
        }
    });

    // Dibujar Obstáculos (Usando la bomba como asset por defecto por ahora)
    for (let obs of (maps[currentLevel] || [])) {
        const cx = obs.x * gridSize;
        const cy = obs.y * gridSize;
        
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath(); ctx.ellipse(cx + gridSize/2, cy + gridSize - 2, gridSize/1.5, gridSize/3, 0, 0, Math.PI*2); ctx.fill();
        
        if (imgAssets.bomba && imgAssets.bomba.complete) {
            ctx.drawImage(imgAssets.bomba, cx, cy, gridSize, gridSize);
        } else {
            ctx.fillStyle = "#4a2e15";
            ctx.fillRect(cx + 6, cy, 8, gridSize);
        }
    }

    if(gameInterval) requestAnimationFrame(renderVisuals);
}

// --- 7. CONTROLES PC ---
window.addEventListener("keydown", e => {
    if(document.getElementById('screen-game').classList.contains('active')){
        switch (e.key) {
            case "ArrowUp":    case "w": if (dir.y !== 1)  nextDir = { x: 0, y: -1 }; break;
            case "ArrowDown":  case "s": if (dir.y !== -1) nextDir = { x: 0, y: 1 };  break;
            case "ArrowLeft":  case "a": if (dir.x !== 1)  nextDir = { x: -1, y: 0 }; break;
            case "ArrowRight": case "d": if (dir.x !== -1) nextDir = { x: 1, y: 0 };  break;
        }
    }
});

// --- 8. CONTROLES MÓVILES (SIDESWIPE SIN SCROLL) ---
let startX=0, startY=0;

canvas.addEventListener('touchstart', e => {
    e.preventDefault(); 
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, {passive: false});

canvas.addEventListener('touchmove', e => {
    e.preventDefault(); 
}, {passive: false});

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;
    let diffX = endX - startX;
    let diffY = endY - startY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 20 && dir.x !== -1) nextDir = {x: 1, y: 0};
        else if (diffX < -20 && dir.x !== 1) nextDir = {x: -1, y: 0};
    } else {
        if (diffY > 20 && dir.y !== -1) nextDir = {x: 0, y: 1};
        else if (diffY < -20 && dir.y !== 0) nextDir = {x: 0, y: -1}; // Corrección de sintaxis en control vertical invertido
    }
}, {passive: false});
