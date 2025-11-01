beforeEach(() => {
  jest.resetModules();

  global.performance = {
    now: jest.fn(() => 0),
  };

  global.requestAnimationFrame = jest.fn();

  document.body.innerHTML = `
    <main>
      <canvas id="gameCanvas"></canvas>
      <div id="scoreValue">0</div>
      <section id="overlay"></section>
      <h2 id="overlayTitle"></h2>
      <p id="overlayMessage"></p>
      <button id="restartButton"></button>
      <select id="speedSelect">
        <option value="1">Light</option>
        <option value="1.35" selected>Moderate</option>
        <option value="1.7">Heavy</option>
      </select>
    </main>
  `;

  const canvas = document.getElementById("gameCanvas");
  canvas.width = 400;
  canvas.height = 600;

  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    fill: jest.fn(),
  }));
});

describe("Car Racing Game logic", () => {
  test("calculates correct lane positions", () => {
    const game = require("../script.js");
    const state = game.getState();
    const expectedLaneWidth = (state.canvas.width - 80) / 3;

    expect(game.laneWidth()).toBeCloseTo(expectedLaneWidth);
    expect(game.laneToX(1)).toBeCloseTo(40 + expectedLaneWidth * 1 + expectedLaneWidth / 2 - 24);
  });

  test("spawns obstacles and records them", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.2);
    const game = require("../script.js");
    game.resetGame();
    game.spawnObstacle();

    const { obstacles } = game.getState();
    expect(obstacles).toHaveLength(1);
    expect(obstacles[0].lane).toBe(0);
    Math.random.mockRestore();
  });

  test("detects collisions when obstacle overlaps player", () => {
    const game = require("../script.js");
    game.resetGame();

    const { player, obstacles } = game.getState();
    obstacles.push({
      lane: player.lane,
      x: player.x,
      y: player.y,
      speed: 0,
      color: "#fff",
    });

    expect(game.checkCollisions()).toBe(true);
  });
});
