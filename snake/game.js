const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 600;
const STEP = 20;
const WALL_LIMIT = 280;
const START_TICK_MS = 100;
const MIN_TICK_MS = 50;
const SPEED_UP_MS = 5;
const HIGH_SCORE_KEY = "snake-high-score";

const UP = 90;
const DOWN = 270;
const LEFT = 180;
const RIGHT = 0;
const OPPOSITE = { [UP]: DOWN, [DOWN]: UP, [LEFT]: RIGHT, [RIGHT]: LEFT };
const STARTING_POSITIONS = [
  [0, 0],
  [-STEP, 0],
  [-2 * STEP, 0],
];
const RAINBOW_COLORS = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
const KEY_DIRECTIONS = {
  ArrowUp: UP,
  ArrowDown: DOWN,
  ArrowLeft: LEFT,
  ArrowRight: RIGHT,
};

const canvas = document.getElementById("board");
const hint = document.getElementById("hint");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const ctx = canvas.getContext("2d");

let segments = [];
let direction = RIGHT;
let food = { x: 0, y: 0 };
let score = 0;
let highScore = readHighScore();
let running = false;
let lastTick = 0;
let tickMs = START_TICK_MS;

function readHighScore() {
  try {
    const value = Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "", 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function saveHighScore() {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  } catch {
    return;
  }
}

function createSnake() {
  segments = STARTING_POSITIONS.map(([x, y]) => ({ x, y }));
  direction = RIGHT;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function refreshFood() {
  const occupied = new Set(segments.map((segment) => `${segment.x},${segment.y}`));
  const free = [];
  for (let x = -WALL_LIMIT; x <= WALL_LIMIT; x += STEP) {
    for (let y = -WALL_LIMIT; y <= WALL_LIMIT; y += STEP) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length > 0) {
    food = free[Math.floor(Math.random() * free.length)];
  }
}

function turn(newDirection) {
  if (newDirection !== OPPOSITE[direction]) {
    direction = newDirection;
  }
}

function move() {
  for (let index = segments.length - 1; index > 0; index -= 1) {
    segments[index] = { x: segments[index - 1].x, y: segments[index - 1].y };
  }
  const head = segments[0];
  if (direction === RIGHT) {
    head.x += STEP;
  } else if (direction === LEFT) {
    head.x -= STEP;
  } else if (direction === UP) {
    head.y += STEP;
  } else if (direction === DOWN) {
    head.y -= STEP;
  }
}

function extend() {
  const tail = segments[segments.length - 1];
  segments.push({ x: tail.x, y: tail.y });
}

function hitWall() {
  const head = segments[0];
  return Math.abs(head.x) > WALL_LIMIT || Math.abs(head.y) > WALL_LIMIT;
}

function hitTail() {
  const head = segments[0];
  return segments.slice(1).some((segment) => distance(head, segment) < STEP / 2);
}

function increaseScore() {
  score += 1;
  tickMs = Math.max(MIN_TICK_MS, tickMs - SPEED_UP_MS);
}

function resetScore() {
  if (score > highScore) {
    highScore = score;
    saveHighScore();
  }
  score = 0;
  tickMs = START_TICK_MS;
}

function step() {
  move();
  if (distance(segments[0], food) < STEP / 2) {
    extend();
    increaseScore();
    refreshFood();
  }
  if (hitWall() || hitTail()) {
    resetScore();
    createSnake();
    refreshFood();
  }
}

function toCanvas(point) {
  return {
    x: point.x + SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT / 2 - point.y,
  };
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const foodPoint = toCanvas(food);
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(foodPoint.x, foodPoint.y, STEP / 2, 0, Math.PI * 2);
  ctx.fill();

  segments.forEach((segment, index) => {
    const point = toCanvas(segment);
    ctx.fillStyle = RAINBOW_COLORS[index % RAINBOW_COLORS.length];
    ctx.fillRect(point.x - STEP / 2, point.y - STEP / 2, STEP, STEP);
  });

  ctx.fillStyle = "white";
  ctx.font = "bold 12px Courier";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`SCORE = ${score}   High score = ${highScore}`, SCREEN_WIDTH / 2, 20);
}

function frame(now) {
  if (!running) {
    return;
  }
  if (now - lastTick >= tickMs) {
    lastTick = now;
    step();
  }
  draw();
  requestAnimationFrame(frame);
}

function updateControls() {
  startButton.disabled = running;
  stopButton.disabled = !running;
}

function startGame() {
  if (running) {
    return;
  }
  running = true;
  lastTick = performance.now();
  hint.textContent = "Use the arrow keys. Stop or Escape pauses the game.";
  updateControls();
  canvas.focus();
  requestAnimationFrame(frame);
}

function stopGame() {
  if (!running) {
    return;
  }
  running = false;
  hint.textContent = "Game stopped. Press Start to continue.";
  updateControls();
  draw();
}

canvas.addEventListener("click", () => {
  canvas.focus();
});

startButton.addEventListener("click", startGame);
stopButton.addEventListener("click", stopGame);

window.addEventListener("keydown", (event) => {
  if (document.activeElement !== canvas) {
    return;
  }
  const newDirection = KEY_DIRECTIONS[event.key];
  if (newDirection !== undefined) {
    event.preventDefault();
    turn(newDirection);
  } else if (event.key === "Escape") {
    event.preventDefault();
    stopGame();
  }
});

createSnake();
refreshFood();
draw();
updateControls();
