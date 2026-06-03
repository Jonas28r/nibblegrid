let scene, camera, renderer;

let snake = [];
let enemy = [];
let food;
let obstacles = [];

let direction = new THREE.Vector3(1, 0, 0);

let score = 0;
let level = 1;

let tick = 0;
let speed = 10;
let running = false;

const levels = [
  { name: "Selva", bg: 0x0b3d0b, obstacle: "trees" },
  { name: "Ciudad", bg: 0x1f1f1f, obstacle: "buildings" },
  { name: "Ruinas", bg: 0x2b1d0e, obstacle: "ruins" },
  { name: "Desierto", bg: 0xd8c292, obstacle: "rocks" }
];

init();
animate();

/* ================= INIT ================= */

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onResize);

  camera.position.set(0, 12, 18);

  /* 🌟 ILUMINACIÓN PLAY STORE STYLE */
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  scene.add(sun);

  /* 🌍 SUELO CON PROFUNDIDAD */
  let floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.1
    })
  );

  floor.rotation.x = Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* 🐍 PLAYER SNAKE */
  for (let i = 0; i < 7; i++) {
    let seg = createSegment(0x00ff55);
    seg.position.x = -i;
    snake.push(seg);
    scene.add(seg);
  }

  /* 👾 ENEMY */
  for (let i = 0; i < 5; i++) {
    let seg = createSegment(0xff3355);
    seg.position.x = i + 10;
    enemy.push(seg);
    scene.add(seg);
  }

  spawnFood();
  loadLevel(1);

  setupControls();
  setupUI();
}

/* ================= SNAKE LOOK (MEJORADO) ================= */

function createSegment(color) {
  let geo = new THREE.SphereGeometry(0.55, 18, 18);
  let mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.2
  });

  let mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

  return mesh;
}

/* ================= CONTROLS ================= */

function setupControls() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && direction.z === 0) direction.set(0, 0, -1);
    if (e.key === "ArrowDown" && direction.z === 0) direction.set(0, 0, 1);
    if (e.key === "ArrowLeft" && direction.x === 0) direction.set(-1, 0, 0);
    if (e.key === "ArrowRight" && direction.x === 0) direction.set(1, 0, 0);
  });
}

/* ================= UI ================= */

function setupUI() {
  document.getElementById("startBtn").onclick = () => running = true;
  document.getElementById("pauseBtn").onclick = () => running = !running;
}

/* ================= FOOD ================= */

function spawnFood() {
  if (food) scene.remove(food);

  food = createSegment(0xffff00);
  food.scale.set(0.9, 0.9, 0.9);

  food.position.set(
    Math.floor(Math.random() * 30 - 15),
    0,
    Math.floor(Math.random() * 30 - 15)
  );

  scene.add(food);
}

/* ================= OBSTACLES ================= */

function spawnObstacles(type) {
  obstacles.forEach(o => scene.remove(o));
  obstacles = [];

  let color = 0x888888;

  if (type === "trees") color = 0x1e8449;
  if (type === "buildings") color = 0x555555;
  if (type === "ruins") color = 0x6e2c00;
  if (type === "rocks") color = 0x7f8c8d;

  for (let i = 0; i < 20; i++) {
    let obs = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        metalness: 0.1
      })
    );

    obs.castShadow = true;

    obs.position.set(
      Math.floor(Math.random() * 40 - 20),
      0,
      Math.floor(Math.random() * 40 - 20)
    );

    obstacles.push(obs);
    scene.add(obs);
  }
}

/* ================= MOVEMENT ================= */

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

  head.position.x += dir.x * 0.22;
  head.position.z += dir.z * 0.22;

  for (let i = enemy.length - 1; i > 0; i--) {
    enemy[i].position.copy(enemy[i - 1].position);
  }
}

/* ================= CAMERA (AAA FEEL) ================= */

function updateCamera() {
  let head = snake[0];

  camera.position.x += (head.position.x - camera.position.x) * 0.07;
  camera.position.z += (head.position.z + 14 - camera.position.z) * 0.07;

  camera.lookAt(head.position);
}

/* ================= EFFECT ================= */

function eatEffect(pos) {
  for (let i = 0; i < 6; i++) {
    let p = createSegment(0xffff00);
    p.position.copy(pos);
    p.scale.set(0.3, 0.3, 0.3);
    scene.add(p);

    let angle = Math.random() * Math.PI * 2;
    let vx = Math.cos(angle) * 0.2;
    let vz = Math.sin(angle) * 0.2;

    let life = 0;

    function animateP() {
      if (life > 18) {
        scene.remove(p);
        return;
      }

      p.position.x += vx;
      p.position.z += vz;
      p.position.y += 0.03;

      life++;
      requestAnimationFrame(animateP);
    }

    animateP();
  }
}

/* ================= GAME LOGIC ================= */

function checkGame() {
  let head = snake[0];

  if (head.position.distanceTo(food.position) < 1) {
    score += 10;

    eatEffect(food.position);

    let seg = createSegment(0x00ff55);
    seg.position.copy(snake[snake.length - 1].position);
    snake.push(seg);
    scene.add(seg);

    spawnFood();

    if (score % 50 === 0) levelUp();
  }

  if (head.position.distanceTo(enemy[0].position) < 1.2) {
    alert("💀 Perdiste");
    location.reload();
  }

  for (let o of obstacles) {
    if (head.position.distanceTo(o.position) < 1.2) {
      alert("💥 Choque");
      location.reload();
    }
  }

  document.getElementById("ui").innerText =
    `Score: ${score} | Level: ${level}`;
}

/* ================= LEVEL ================= */

function loadLevel(lvl) {
  level = lvl;

  scene.background = new THREE.Color(levels[lvl - 1].bg);

  spawnObstacles(levels[lvl - 1].obstacle);
}

function levelUp() {
  level++;

  if (level > levels.length) {
    alert("🏆 Ganaste todo");
    location.reload();
    return;
  }

  loadLevel(level);
  speed = Math.max(6, speed - 1);
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
  }

  updateCamera();

  renderer.render(scene, camera);
}

/* ================= RESPONSIVE ================= */

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
