# Car Racing Game

A lightweight browser-based car racing survival game built with HTML5 canvas and vanilla JavaScript. Dodge oncoming traffic, survive as long as you can, and challenge yourself by increasing the traffic density.

## How to Play

1. Open `index.html` in a modern browser.
2. Press the **space bar** or click **Restart** to begin the race.
3. Use the **left/right arrow keys** (or **A/D**) to change lanes.
4. Avoid collisions with the traffic cars. The longer you stay alive, the higher your score.
5. Adjust the traffic density using the dropdown to increase the difficulty.

## Features

- Three-lane highway with smoothly animated lane markers.
- Increasing difficulty as you score more points.
- Responsive layout with accessible controls and overlay instructions.
- No build tools or dependencies required.

## Customization Tips

- Tweak `LANES`, `PLAYER_SIZE`, or `OBSTACLE_SIZE` in `script.js` to adjust the layout.
- Modify the spawn logic in `spawnObstacle` or `update` to change pacing or add new car types.
- Extend the overlay with high-score tracking or sound effects for additional polish.

## Testing

The lab now includes a zero-dependency Node.js test harness that validates the core gameplay calculations. To run the tests:

```bash
cd "labs/CAR RACING GAME"
npm test
```

`npm install` is no longer required because the test runner relies only on built-in Node.js modules.
