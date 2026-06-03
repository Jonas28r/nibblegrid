let scene, camera, renderer;

let snake = [];
let enemy = [];
let food;

let direction = new THREE.Vector3(1, 0, 0);

let score = 0;
let level = 1;
let frame = 0;

let gameSpeed = 10; // menor = más rápido
let enemySpeed = 0.12;

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

  // 🐍 jugador (serpiente realista)
  for (let i = 0; i < 8; i++) {
    let segment = createSegment(0x00ff00);
    segment.position.x = -i * 0.6;
    snake.push(segment);
    scene.add(segment);
  }

  // 👾 enemigo
  for (let i = 0; i < 6; i++) {
    let segment = createSegment(0xff0000);
    segment.position.x = i + 6;
    enemy.push(segment);
    scene.add(segment);
  }

  spawnFood();
  loadLevel(1);

  window.addEventListener("keydown", control);
}
function createSegment(color) {
  let geometry = new THREE.SphereGeometry(0.4, 16, 16);
  let material = new THREE.MeshStandardMaterial({ color });
  let mesh = new THREE.Mesh(geometry, material);

  return mesh;
}
function control(e) {
  if (e.key === "ArrowUp") direction.set(0, 0, -1);
  if (e.key === "ArrowDown") direction.set(0, 0, 1);
  if (e.key === "ArrowLeft") direction.set(-1, 0, 0);
  if (e.key === "ArrowRight") direction.set(1, 0, 0);
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
    snake[i].position.lerp(snake[i - 1].position, 0.6);
  }

  snake[0].position.x += direction.x * 0.6;
  snake[0].position.z += direction.z * 0.6;
      }
function moveEnemy() {
  let head = enemy[0];
  let target = snake[0].position;

  let dir = new THREE.Vector3(
    target.x - head.position.x,
    0,
    target.z - head.position.z
  ).normalize();

  head.position.x += dir.x * enemySpeed;
  head.position.z += dir.z * enemySpeed;

  for (let i = enemy.length - 1; i > 0; i--) {
    enemy[i].position.lerp(enemy[i - 1].position, 0.5);
  }
    }
function checkGame() {
  let head = snake[0];

  // comida
  if (head.position.distanceTo(food.position) < 1) {
    score += 10;

    let tail = createSegment(0x00ff00);
    tail.position.copy(snake[snake.length - 1].position);
    snake.push(tail);
    scene.add(tail);

    spawnFood();
    checkLevelUp();
  }

  // enemigo
  if (head.position.distanceTo(enemy[0].position) < 1) {
    alert("💀 Perdiste contra el enemigo");
    location.reload();
  }

  document.getElementById("ui").innerText =
    `Score: ${score} | Level: ${level}`;
       }
function loadLevel(lvl) {
  level = lvl;

  scene.background = new THREE.Color(levels[lvl - 1].bg);

  enemySpeed += 0.02;
  gameSpeed = Math.max(5, gameSpeed - 1);
    }
function checkLevelUp() {
  if (score >= level * 50) {
    level++;

    if (level > levels.length) {
      alert("🏆 Ganaste todos los mundos");
      location.reload();
      return;
    }

    alert("🌍 Nivel " + level + " - " + levels[level - 1].name);
    loadLevel(level);
  }
}
function animate() {
  requestAnimationFrame(animate);

  frame++;

  if (frame % gameSpeed === 0) {
    moveSnake();
    moveEnemy();
    checkGame();
  }

  renderer.render(scene, camera);
}
