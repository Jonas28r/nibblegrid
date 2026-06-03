let scene, camera, renderer;

let snake = [];
let enemy = [];
let food;
let obstacles = [];

let direction = new THREE.Vector3(1, 0, 0);

let score = 0;
let level = 1;

let tick = 0;
let speed = 12;
let running = false;

const levels = [
  {
    name: "Selva",
    bg: 0x0b3d0b,
    obstacles: "trees"
  },
  {
    name: "Ciudad",
    bg: 0x222222,
    obstacles: "buildings"
  },
  {
    name: "Ruinas",
    bg: 0x3b2f2f,
    obstacles: "ruins"
  },
  {
    name: "Desierto",
    bg: 0xd2b48c,
    obstacles: "rocks"
  }
];

init();
animate();

/* ================= INIT ================= */

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.set(0, 14, 18);
  camera.lookAt(0, 0, 0);

  window.addEventListener("resize", onResize);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  let floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide })
  );
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);

  // 🐍 jugador
  for (let i = 0; i < 6; i++) {
    let seg = createSegment(0x00ff00);
    seg.position.x = -i;
    snake.push(seg);
    scene.add(seg);
  }

  // 👾 enemigo
  for (let i = 0; i < 5; i++) {
    let seg = createSegment(0xff0000);
    seg.position.x = i + 10;
    enemy.push(seg);
    scene.add(seg);
  }

  spawnFood();

  loadLevel(1);
  setupControls();
  setupUI();
}

/* ================= CONTROLES ================= */

function setupControls() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && direction.z === 0) direction.set(0, 0, -1);
    if (e.key === "ArrowDown" && direction.z === 0) direction.set(0, 0, 1);
    if (e.key === "ArrowLeft" && direction.x === 0) direction.set(-1, 0, 0);
    if (e.key === "ArrowRight" && direction.x === 0) direction.set(1, 0, 0);
  });
}

function setupUI() {
  document.getElementById("startBtn").onclick = () => running = true;
  document.getElementById("pauseBtn").onclick = () => running = !running;
}

/* ================= ENTIDADES ================= */

function createSegment(color) {
  let geo = new THREE.SphereGeometry(0.5, 14, 14);
  let mat = new THREE.MeshStandardMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

/* ================= FOOD ================= */

function spawnFood() {
  if (food) scene.remove(food);

  food = createSegment(0xffff00);

  food.position.set(
    Math.floor(Math.random() * 30 - 15),
    0,
    Math.floor(Math.random() * 30 - 15)
  );

  scene.add(food);
}

/* ================= OBSTÁCULOS (🔥 NUEVO) ================= */

function clearObstacles() {
  obstacles.forEach(o => scene.remove(o));
  obstacles = [];
}

function spawnObstacles(type) {
  clearObstacles();

  let count = 15;

  for (let i = 0; i < count; i++) {
    let obs = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );

    if (type === "trees") obs.material.color.set(0x145a32);
    if (type === "buildings") obs.material.color.set(0x555555);
    if (type === "ruins") obs.material.color.set(0x6e2c00);
    if (type === "rocks") obs.material.color.set(0x7f8c8d);

    obs.position.set(
      Math.floor(Math.random() * 40 - 20),
      0,
      Math.floor(Math.random() * 40 - 20)
    );

    obstacles.push(obs);
    scene.add(obs);
  }
}

/* ================= MOVIMIENTO ================= */

function moveSnake() {
  for (let i = snake.length - 1; i > 0; i--) {
    snake[i].position.copy(snake[i - 1].position);
  }

  snake[0].position.x += direction.x;
  snake[0].position.z += direction.z;
}

function moveEnemy() {
  let head = enemy[0];
  let target = snake[0].position;

  let dir = new THREE.Vector3(
    target.x - head.position.x,
    0,
    target.z - head.position.z
  ).normalize();

  head.position.x += dir.x * 0.25;
  head.position.z += dir.z * 0.25;

  for (let i = enemy.length - 1; i > 0; i--) {
    enemy[i].position.copy(enemy[i - 1].position);
  }
}

/* ================= COLISIONES ================= */

function checkGame() {
  let head = snake[0];

  // 🍎 comida
  if (head.position.distanceTo(food.position) < 1) {
    score += 10;

    let seg = createSegment(0x00ff00);
    seg.position.copy(snake[snake.length - 1].position);
    snake.push(seg);
    scene.add(seg);

    spawnFood();
  }

  // 👾 enemigo
  if (head.position.distanceTo(enemy[0].position) < 1.2) {
    alert("💀 Te atrapó el enemigo");
    location.reload();
  }

  // 🧱 obstáculos (🔥 NUEVO)
  for (let o of obstacles) {
    if (head.position.distanceTo(o.position) < 1) {
      alert("💥 Chocaste con un obstáculo");
      location.reload();
    }
  }

  document.getElementById("ui").innerText =
    `Score: ${score} | Level: ${level}`;
}

/* ================= LEVEL SYSTEM ================= */

function loadLevel(lvl) {
  level = lvl;

  scene.background = new THREE.Color(levels[lvl - 1].bg);

  spawnObstacles(levels[lvl - 1].obstacles);
}

function levelUp() {
  level++;

  if (level > levels.length) {
    alert("🏆 Ganaste todos los mundos");
    location.reload();
    return;
  }

  loadLevel(level);
  speed = Math.max(6, speed - 2);
}

/* ================= LOOP ================= */

function animate() {
  requestAnimationFrame(animate);

  if (!running) {
    renderer.render(scene, camera);
    return;
  }

  tick++;

  if (tick % speed === 0) {
    moveSnake();
    moveEnemy();
    checkGame();

    if (score > 0 && score % 50 === 0) {
      levelUp();
    }
  }

  renderer.render(scene, camera);
}

/* ================= RESPONSIVE ================= */

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
