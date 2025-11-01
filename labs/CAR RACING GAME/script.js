const doc = typeof document !== "undefined" ? document : null;
const canvas = doc ? doc.getElementById("gameCanvas") : null;
const ctx = canvas && typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
const scoreValue = doc ? doc.getElementById("scoreValue") : null;
const overlay = doc ? doc.getElementById("overlay") : null;
const overlayTitle = doc ? doc.getElementById("overlayTitle") : null;
const overlayMessage = doc ? doc.getElementById("overlayMessage") : null;
const restartButton = doc ? doc.getElementById("restartButton") : null;
const speedSelect = doc ? doc.getElementById("speedSelect") : null;

const LANES = 3;
const ROAD_PADDING = 40;
const PLAYER_SIZE = { width: 48, height: 82 };
const OBSTACLE_SIZE = { width: 48, height: 82 };
const COLORS = ["#f97316", "#38bdf8", "#22c55e", "#eab308", "#f87171"];

let lastTimestamp = 0;
let elapsed = 0;
let score = 0;
let gameSpeed = speedSelect ? Number(speedSelect.value) || 1.35 : 1.35;
let isRunning = false;
let gameOver = false;
let spawnCooldown = 0;

const player = {
  lane: 1,
  x: 0,
  y: (canvas ? canvas.height : 600) - PLAYER_SIZE.height - 20,
  speed: 6,
};

const inputs = {
  left: false,
  right: false,
};

let obstacles = [];

function laneWidth() {
  if (!canvas) return 0;
  return (canvas.width - ROAD_PADDING * 2) / LANES;
}

function laneToX(lane) {
  return ROAD_PADDING + lane * laneWidth() + laneWidth() / 2 - PLAYER_SIZE.width / 2;
}

function resetGame(startImmediately = false) {
  score = 0;
  elapsed = 0;
  spawnCooldown = 0;
  lastTimestamp =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  if (speedSelect) {
    gameSpeed = Number(speedSelect.value) || gameSpeed;
  }
  obstacles = [];
  player.lane = 1;
  player.x = laneToX(player.lane);
  gameOver = false;
  if (scoreValue) {
    scoreValue.textContent = "0";
  }
  if (overlay) {
    overlay.hidden = true;
  }
  if (startImmediately) {
    startLoop();
  } else {
    isRunning = false;
  }
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * LANES);
  obstacles.push({
    lane,
    x: laneToX(lane),
    y: -OBSTACLE_SIZE.height,
    speed: (2.4 + Math.random() * 1.5) * gameSpeed,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  });
}

function updatePlayerPosition() {
  if (inputs.left && player.lane > 0) {
    player.lane -= 1;
    inputs.left = false;
  } else if (inputs.right && player.lane < LANES - 1) {
    player.lane += 1;
    inputs.right = false;
  }
  player.x = laneToX(player.lane);
}

function updateObstacles(delta) {
  const speedMultiplier = 1 + score / 1000;
  for (const obstacle of obstacles) {
    obstacle.y += obstacle.speed * delta * speedMultiplier;
  }
  obstacles = obstacles.filter(
    (obstacle) => !canvas || obstacle.y < canvas.height + OBSTACLE_SIZE.height
  );
}

function checkCollisions() {
  return obstacles.some((obstacle) => {
    const overlapX =
      player.x < obstacle.x + OBSTACLE_SIZE.width &&
      player.x + PLAYER_SIZE.width > obstacle.x;
    const overlapY =
      player.y < obstacle.y + OBSTACLE_SIZE.height &&
      player.y + PLAYER_SIZE.height > obstacle.y;
    return overlapX && overlapY;
  });
}

function drawRoad() {
  if (!ctx || !canvas) return;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const dashHeight = 40;
  const dashGap = 28;
  const laneW = laneWidth();

  ctx.fillStyle = "#e2e8f0";
  for (let i = 1; i < LANES; i += 1) {
    const x = ROAD_PADDING + i * laneW - laneW / 2;
    for (let y = -dashHeight; y < canvas.height + dashHeight; y += dashHeight + dashGap) {
      ctx.fillRect(x, y + (elapsed % (dashHeight + dashGap)), 6, dashHeight);
    }
  }
}

function drawCar(x, y, color) {
  if (!ctx) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, PLAYER_SIZE.width, PLAYER_SIZE.height, 12);
  } else {
    const radius = 12;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + PLAYER_SIZE.width - radius, y);
    ctx.quadraticCurveTo(
      x + PLAYER_SIZE.width,
      y,
      x + PLAYER_SIZE.width,
      y + radius
    );
    ctx.lineTo(x + PLAYER_SIZE.width, y + PLAYER_SIZE.height - radius);
    ctx.quadraticCurveTo(
      x + PLAYER_SIZE.width,
      y + PLAYER_SIZE.height,
      x + PLAYER_SIZE.width - radius,
      y + PLAYER_SIZE.height
    );
    ctx.lineTo(x + radius, y + PLAYER_SIZE.height);
    ctx.quadraticCurveTo(x, y + PLAYER_SIZE.height, x, y + PLAYER_SIZE.height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
  ctx.fill();

  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.fillRect(x + 8, y + 16, PLAYER_SIZE.width - 16, PLAYER_SIZE.height - 32);

  ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
  ctx.fillRect(x + 10, y + 24, PLAYER_SIZE.width - 20, PLAYER_SIZE.height / 2 - 14);
}

function draw() {
  if (!ctx) return;
  drawRoad();
  drawCar(player.x, player.y, "#6366f1");
  for (const obstacle of obstacles) {
    drawCar(obstacle.x, obstacle.y, obstacle.color);
  }
}

function update(delta) {
  if (!isRunning) return;

  elapsed += delta * 600 * gameSpeed;
  score += delta * 100 * gameSpeed;
  if (scoreValue) {
    scoreValue.textContent = Math.floor(score).toString();
  }

  spawnCooldown -= delta * 1000;
  const spawnThreshold = Math.max(450 - score / 2, 220) / gameSpeed;
  if (spawnCooldown <= 0) {
    spawnObstacle();
    spawnCooldown = spawnThreshold;
  }

  updatePlayerPosition();
  updateObstacles(delta);

  if (checkCollisions()) {
    endGame();
  }
}

function endGame() {
  isRunning = false;
  gameOver = true;
  if (overlayTitle) {
    overlayTitle.textContent = "Game Over";
  }
  if (overlayMessage) {
    overlayMessage.textContent = `You scored ${Math.floor(
      score
    )} points. Press space or click restart to try again.`;
  }
  if (overlay) {
    overlay.hidden = false;
  }
}

function frame(timestamp) {
  if (!isRunning) {
    lastTimestamp = timestamp;
    draw();
    return;
  }

  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  update(delta);
  draw();
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(frame);
  }
}

function startLoop() {
  if (!isRunning) {
    isRunning = true;
    lastTimestamp =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(frame);
    }
  }
}

function handleStart() {
  if (isRunning) return;
  if (overlay) {
    overlay.hidden = true;
  }
  gameOver = false;
  resetGame(true);
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (event) => {
    switch (event.key.toLowerCase()) {
      case "arrowleft":
      case "a":
        inputs.left = true;
        break;
      case "arrowright":
      case "d":
        inputs.right = true;
        break;
      case " ":
        if (!isRunning) {
          event.preventDefault();
          handleStart();
        }
        break;
    }
  });

  window.addEventListener("keyup", (event) => {
    switch (event.key.toLowerCase()) {
      case "arrowleft":
      case "a":
        inputs.left = false;
        break;
      case "arrowright":
      case "d":
        inputs.right = false;
        break;
    }
  });
}

if (restartButton) {
  restartButton.addEventListener("click", handleStart);
}

if (speedSelect) {
  speedSelect.addEventListener("change", () => {
    gameSpeed = Number(speedSelect.value) || gameSpeed;
    if (!isRunning) {
      resetGame();
      draw();
    }
  });
}

player.x = laneToX(player.lane);
draw();
if (overlay) {
  overlay.hidden = false;
}
if (overlayTitle) {
  overlayTitle.textContent = "Ready to Race";
}
if (overlayMessage) {
  overlayMessage.textContent = "Press the space bar or tap Restart to begin the game.";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    laneWidth,
    laneToX,
    resetGame,
    spawnObstacle,
    updatePlayerPosition,
    updateObstacles,
    checkCollisions,
    getState: () => ({
      player,
      obstacles,
      inputs,
      canvas,
      overlay,
      scoreValue,
    }),
  };
}
