let scene, camera, renderer;

let snake = [];
let direction = new THREE.Vector3(1, 0, 0);
let enemySnake = [];

let food;
let score = 0;

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

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.set(0, 10, 15);
  camera.lookAt(0, 0, 0);

  // 🐍 jugador
  for (let i = 0; i < 5; i++) {
    let cube = createCube(0x00ff00);
    cube.position.x = -i;
    snake.push(cube);
    scene.add(cube);
  }

  // 🐍 enemigo
  for (let i = 0; i < 5; i++) {
    let cube = createCube(0xff0000);
    cube.position.x = i + 5;
    enemySnake.push(cube);
    scene.add(cube);
  }

  spawnFood();

  window.addEventListener("keydown", move);
}

function createCube(color) {
  let geometry = new THREE.BoxGeometry(1, 1, 1);
  let material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

function spawnFood() {
  if (food) scene.remove(food);

  food = createCube(0xffff00);
  food.position.set(
    Math.floor(Math.random() * 10 - 5),
    0,
    Math.floor(Math.random() * 10 - 5)
  );

  scene.add(food);
}

function move(e) {
  if (e.key === "ArrowUp") direction.set(0, 0, -1);
  if (e.key === "ArrowDown") direction.set(0, 0, 1);
  if (e.key === "ArrowLeft") direction.set(-1, 0, 0);
  if (e.key === "ArrowRight") direction.set(1, 0, 0);
}

function updateSnake(snakeArray) {
  for (let i = snakeArray.length - 1; i > 0; i--) {
    snakeArray[i].position.copy(snakeArray[i - 1].position);
  }
  snakeArray[0].position.add(direction);
}

function checkCollision() {
  let head = snake[0];

  // comida
  if (head.position.distanceTo(food.position) < 1) {
    score += 10;
    document.getElementById("score").innerText = "Score: " + score;

    let tail = createCube(0x00ff00);
    tail.position.copy(snake[snake.length - 1].position);
    snake.push(tail);
    scene.add(tail);

    spawnFood();
  }

  // enemigo (colisión simple)
  if (head.position.distanceTo(enemySnake[0].position) < 1) {
    alert("¡Perdiste contra la serpiente enemiga!");
    location.reload();
  }
}

function moveEnemy() {
  let head = enemySnake[0];

  let target = snake[0].position;

  let dir = new THREE.Vector3(
    target.x - head.position.x,
    0,
    target.z - head.position.z
  ).normalize();

  for (let i = enemySnake.length - 1; i > 0; i--) {
    enemySnake[i].position.copy(enemySnake[i - 1].position);
  }

  head.position.add(dir);
}

function animate() {
  requestAnimationFrame(animate);

  updateSnake(snake);
  moveEnemy();
  checkCollision();

  renderer.render(scene, camera);
}
