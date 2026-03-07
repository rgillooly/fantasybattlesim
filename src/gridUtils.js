// src/gridUtils.js

// Chebyshev distance for square grid with diagonals allowed
export function gridDistance(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.max(dx, dy);
}

// Generate a rows x cols square grid
export function generateGridTiles(rows, cols) {
  const tiles = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      tiles.push({
        x,
        y,
        terrain: {
          type: "normal",
          movementCost: 1,
          defenseBonus: 0,
          blocksMovement: false,
          blocksAttacks: false,
        },
      });
    }
  }
  return tiles;
}
