const path = require("node:path");
const { strict: assert } = require("node:assert");

const GAME_PATH = path.join(__dirname, "..", "script.js");

function createStubContext() {
  return {
    fillRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    fill() {},
    roundRect() {},
  };
}

function setupEnvironment() {
  const canvas = {
    id: "gameCanvas",
    width: 400,
    height: 600,
    getContext: () => createStubContext(),
  };

  const elements = {
    gameCanvas: canvas,
    scoreValue: { textContent: "0" },
    overlay: { hidden: true },
    overlayTitle: { textContent: "" },
    overlayMessage: { textContent: "" },
    restartButton: { addEventListener() {} },
    speedSelect: {
      value: "1.35",
      addEventListener() {},
    },
  };

  const document = {
    body: { innerHTML: "" },
    getElementById(id) {
      return elements[id] || null;
    },
  };

  global.document = document;
  global.window = {
    addEventListener() {},
  };
  global.performance = { now: () => 0 };
  global.requestAnimationFrame = () => {};

  function HTMLCanvasElement() {}
  HTMLCanvasElement.prototype.getContext = () => createStubContext();
  global.HTMLCanvasElement = HTMLCanvasElement;

  return {
    elements,
    cleanup() {
      delete global.document;
      delete global.window;
      delete global.performance;
      delete global.requestAnimationFrame;
      delete global.HTMLCanvasElement;
    },
  };
}

function loadGame() {
  delete require.cache[GAME_PATH];
  const environment = setupEnvironment();
  const game = require(GAME_PATH);
  return { game, environment };
}

module.exports = (test) => {
  test("calculates correct lane positions", () => {
    const { game, environment } = loadGame();
    try {
      const state = game.getState();
      const expectedLaneWidth = (state.canvas.width - 80) / 3;
      const expectedLaneOneX = 40 + expectedLaneWidth * 1 + expectedLaneWidth / 2 - 24;

      assert.ok(
        Math.abs(game.laneWidth() - expectedLaneWidth) < 1e-6,
        "laneWidth should match the computed width"
      );
      assert.ok(
        Math.abs(game.laneToX(1) - expectedLaneOneX) < 1e-6,
        "laneToX should convert lane index to x coordinate"
      );
    } finally {
      environment.cleanup();
    }
  });

  test("spawns obstacles and records them", () => {
    const originalRandom = Math.random;
    Math.random = () => 0.2;

    const { game, environment } = loadGame();
    try {
      game.resetGame();
      game.spawnObstacle();
      const { obstacles } = game.getState();

      assert.equal(obstacles.length, 1, "one obstacle should be added");
      assert.equal(obstacles[0].lane, 0, "mocked random should choose lane 0");
    } finally {
      Math.random = originalRandom;
      environment.cleanup();
    }
  });

  test("detects collisions when obstacle overlaps player", () => {
    const { game, environment } = loadGame();
    try {
      game.resetGame();
      const { player, obstacles } = game.getState();

      obstacles.push({
        lane: player.lane,
        x: player.x,
        y: player.y,
        speed: 0,
        color: "#fff",
      });

      assert.equal(game.checkCollisions(), true, "overlapping obstacle should trigger collision");
    } finally {
      environment.cleanup();
    }
  });
};
