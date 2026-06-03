let scene, camera, renderer;

let snake = [];
let enemy = [];
let food;

let direction = new THREE.Vector3(1, 0, 0);

let score = 0;
let level = 1;

let tick = 0;
let speed = 12;

const levels = [
  { name: "Selva", bg: 0x0b3d0b },
  { name: "Ciudad", bg: 0x222222 },
  { name: "Ruinas", bg: 0x3b2f2f },
  { name: "Desierto", bg: 0xd2b48c }
];

init();
animate();

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

  camera.position.set(0, 12, 18);
  camera.lookAt(0, 0, 0);

  // 🌍 suelo
  let floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide })
  );
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);

  // 🔆 luz básica (para que no se vea plano)
  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

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

  window.addEventListener("keydown", control);
}

function createSegment(color) {
  let geo = new THREE.SphereGeometry(0.5, 12, 12);
  let mat = new THREE.MeshStandardMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

function control(e) {
  if (e.key === "ArrowUp" && direction.z === 0) direction.set(0, 0, -1);
  if (e.key === "ArrowDown" && direction.z === 0) direction.set(0, 0, 1);
  if (e.key === "ArrowLeft" && direction.x === 0) direction.set(-1, 0, 0);
  if (e.key === "ArrowRight" && direction.x === 0) direction.set(1, 0, 0);
}

function spawnFood() {
  if (food) scene.remove(food);

  food = createSegment(0xffff00);

  food.position.set(
    Math.floor(Math.random() * 20 - 10),
    0,
    Math.floor(Math.random() * 20 - 10)
  );

  scene.add(food);
}

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

  head.position.x += dir.x * 0.3;
  head.position.z += dir.z * 0.3;

  for (let i = enemy.length - 1; i > 0; i--) {
    enemy[i].position.copy(enemy[i - 1].position);
  }
}

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

    if (score % 50 === 0) {
      levelUp();
    }
  }

  // 💀 enemigo
  if (head.position.distanceTo(enemy[0].position) < 1.2) {
    alert("💀 Perdiste");
    location.reload();
  }

  document.getElementById("ui").innerText =
    `Score: ${score} | Level: ${level}`;
}

function levelUp() {
  level++;

  if (level > levels.length) {
    alert("🏆 Ganaste todos los mundos");
    location.reload();
    return;
  }

  scene.background = new THREE.Color(levels[level - 1].bg);
  speed = Math.max(6, speed - 2);

  alert("🌍 Nivel " + level + " - " + levels[level - 1].name);
}

function loadLevel(lvl) {
  scene.background = new THREE.Color(levels[lvl - 1].bg);
}

function animate() {
  requestAnimationFrame(animate);

  tick++;

  if (tick % speed === 0) {
    moveSnake();
    moveEnemy();
    checkGame();
  }

  renderer.render(scene, camera);
}
