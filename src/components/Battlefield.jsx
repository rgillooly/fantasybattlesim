import { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import "./battlefield.css";

const TILE_SIZE = 40; // px

// How strongly units prefer cover over shorter distance.
// Higher = will travel further to reach better cover.
const COVER_WEIGHT = 3;

// Default movement range (in movement points) if a template doesn't define one.
const DEFAULT_MOVE = 4;

/**
 * Dijkstra's algorithm — returns { "x,y": costToReach } for every tile
 * reachable within `maxCost` movement points from (startX, startY).
 * Impassable tiles and tiles occupied by other units are blocked.
 */
function getReachableTiles(startX, startY, maxCost, tiles, units, selfId) {
  const tileMap = {};
  for (const t of tiles) tileMap[`${t.x},${t.y}`] = t;

  const occupied = new Set(
    units.filter((u) => u.id !== selfId).map((u) => `${u.x},${u.y}`),
  );

  const dist = { [`${startX},${startY}`]: 0 };
  const queue = [{ x: startX, y: startY, cost: 0 }];

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const { x, y, cost } = queue.shift();

    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      const tile = tileMap[key];
      if (!tile) continue;
      if (tile.terrain.blocksMovement) continue;
      if (occupied.has(key)) continue;

      const newCost = cost + tile.terrain.movementCost;
      if (newCost > maxCost) continue;
      if (dist[key] !== undefined && dist[key] <= newCost) continue;

      dist[key] = newCost;
      queue.push({ x: nx, y: ny, cost: newCost });
    }
  }

  return dist;
}

/**
 * Score a destination tile. Higher = better.
 * Rewards defense bonus, penalises distance spent getting there.
 */
function scoreTile(tile, costToReach, maxCost) {
  const defense = Math.min(tile.terrain.defenseBonus, 10); // cap total-cover at 10
  const distancePenalty = costToReach / maxCost; // 0–1
  return defense * COVER_WEIGHT - distancePenalty;
}

export default function Battlefield({
  tiles,
  units,
  templates,
  setUnits,
  terrainEditMode,
  setTiles,
}) {
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [brushSize, setBrushSize] = useState(1);
  const [currentTerrainType, setCurrentTerrainType] = useState("normal");
  const [isPainting, setIsPainting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [turnLog, setTurnLog] = useState([]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function unitAt(x, y) {
    return units.find((u) => Number(u.x) === x && Number(u.y) === y);
  }

  function computeTerrain(type) {
    switch (type) {
      case "difficult":
        return {
          type,
          movementCost: 2,
          defenseBonus: 0,
          blocksMovement: false,
          blocksAttacks: false,
        };
      case "cover-half":
        return {
          type,
          movementCost: 1,
          defenseBonus: 2,
          blocksMovement: false,
          blocksAttacks: false,
        };
      case "cover-three":
        return {
          type,
          movementCost: 1,
          defenseBonus: 5,
          blocksMovement: false,
          blocksAttacks: false,
        };
      case "cover-total":
        return {
          type,
          movementCost: 1,
          defenseBonus: 999,
          blocksMovement: false,
          blocksAttacks: true,
        };
      case "impassable":
        return {
          type,
          movementCost: 99,
          defenseBonus: 0,
          blocksMovement: true,
          blocksAttacks: false,
        };
      default:
        return {
          type: "normal",
          movementCost: 1,
          defenseBonus: 0,
          blocksMovement: false,
          blocksAttacks: false,
        };
    }
  }

  // ── AI: one turn of cover-seeking movement ───────────────────────────────────

  const advanceTurn = useCallback(() => {
    const tileMap = {};
    for (const t of tiles) tileMap[`${t.x},${t.y}`] = t;

    // Process units sequentially so movers don't block each other mid-turn.
    let workingUnits = [...units];
    const log = [];

    for (const unit of workingUnits) {
      const template = templates.find((t) => t.id === unit.templateId);
      const maxCost = template?.stats?.move ?? DEFAULT_MOVE;

      const reachable = getReachableTiles(
        unit.x,
        unit.y,
        maxCost,
        tiles,
        workingUnits,
        unit.id,
      );

      let bestKey = `${unit.x},${unit.y}`;
      let bestScore = -Infinity;

      for (const [key, cost] of Object.entries(reachable)) {
        const tile = tileMap[key];
        if (!tile) continue;
        const score = scoreTile(tile, cost, maxCost);
        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }

      const [bx, by] = bestKey.split(",").map(Number);
      const destTile = tileMap[bestKey];
      const coverName = destTile?.terrain?.type ?? "normal";
      const unitName = template?.name ?? "Unit";

      if (bx !== unit.x || by !== unit.y) {
        log.push(`${unitName} → (${bx},${by}) [${coverName}]`);
      } else {
        log.push(
          `${unitName} stayed at (${unit.x},${unit.y}) — already optimal`,
        );
      }

      workingUnits = workingUnits.map((u) =>
        u.id === unit.id ? { ...u, x: bx, y: by } : u,
      );
    }

    setUnits(workingUnits);
    setTurnLog(log);
  }, [units, tiles, templates, setUnits]);

  // ── Auto-run loop ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(advanceTurn, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, advanceTurn]);

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  function handleDropOnTile(tile, event) {
    if (terrainEditMode) return;
    event.preventDefault();

    const templateId = event.dataTransfer.getData("text/template-id");
    const movingUnitId = event.dataTransfer.getData("text/unit-id");
    const team = event.dataTransfer.getData("text/team") || "A";

    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;
      setUnits([
        ...units,
        {
          id: "unit-" + Date.now(),
          templateId: template.id,
          team,
          currentHp: template.stats.maxHp,
          x: tile.x,
          y: tile.y,
        },
      ]);
      return;
    }

    if (movingUnitId) {
      setUnits(
        units.map((u) =>
          u.id === movingUnitId ? { ...u, x: tile.x, y: tile.y } : u,
        ),
      );
    }
  }

  // ── Delete modal ─────────────────────────────────────────────────────────────

  function confirmDelete(unit) {
    setUnitToDelete(unit);
  }
  function deleteUnit() {
    setUnits(units.filter((u) => u.id !== unitToDelete.id));
    setUnitToDelete(null);
  }
  function cancelDelete() {
    setUnitToDelete(null);
  }

  // ── Terrain painting ─────────────────────────────────────────────────────────

  const paintTerrain = (tile) => {
    setTiles(
      tiles.map((t) => {
        const inBrush =
          Math.abs(t.x - tile.x) <= brushSize &&
          Math.abs(t.y - tile.y) <= brushSize;
        return inBrush
          ? { ...t, terrain: computeTerrain(currentTerrainType) }
          : t;
      }),
    );
  };

  const handleMouseDown = (tile) => {
    if (!terrainEditMode) return;
    setIsPainting(true);
    paintTerrain(tile);
  };
  const handleMouseUp = () => {
    if (!terrainEditMode) return;
    setIsPainting(false);
  };
  const handleMouseMove = (tile) => {
    if (isPainting && terrainEditMode) paintTerrain(tile);
  };

  useEffect(() => {
    const up = () => setIsPainting(false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  const maxX = Math.max(...tiles.map((t) => t.x));
  const maxY = Math.max(...tiles.map((t) => t.y));
  const width = (maxX + 1) * TILE_SIZE;
  const height = (maxY + 1) * TILE_SIZE;

  return (
    <>
      {/* DELETE MODAL */}
      {unitToDelete &&
        ReactDOM.createPortal(
          <div className="modal-backdrop">
            <div className="modal">
              <h3>Delete Unit?</h3>
              <p>Are you sure you want to delete this unit?</p>
              <div className="modal-buttons">
                <button className="danger" onClick={deleteUnit}>
                  Delete
                </button>
                <button onClick={cancelDelete}>Cancel</button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* TERRAIN EDIT MODAL */}
      {terrainEditMode &&
        ReactDOM.createPortal(
          <div className="modal-backdrop">
            <div className="modal">
              <h3>Edit Terrain</h3>
              <select
                value={currentTerrainType}
                onChange={(e) => setCurrentTerrainType(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="difficult">Difficult (Half Speed)</option>
                <option value="cover-half">½ Cover (+2 Defense)</option>
                <option value="cover-three">¾ Cover (+5 Defense)</option>
                <option value="cover-total">Total Cover (Cannot Hit)</option>
                <option value="impassable">Impassable (Cannot Move)</option>
              </select>
              <input
                type="number"
                min="1"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* TURN LOG */}
      {turnLog.length > 0 && (
        <div className="turn-log">
          <strong>Last turn:</strong>
          <ul>
            {turnLog.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>
      )}

      {/* BATTLEFIELD GRID */}
      <div
        className="battlefield"
        style={{ position: "relative", width, height }}
      >
        {tiles.map((tile) => {
          const unit = unitAt(tile.x, tile.y);
          return (
            <div
              key={`${tile.x},${tile.y}`}
              className={`square-tile terrain-${tile.terrain.type}`}
              style={{
                left: tile.x * TILE_SIZE,
                top: tile.y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
              }}
              onMouseDown={() => handleMouseDown(tile)}
              onMouseUp={handleMouseUp}
              onMouseMove={() => handleMouseMove(tile)}
              onDragOver={(e) => !terrainEditMode && e.preventDefault()}
              onDrop={(e) => handleDropOnTile(tile, e)}
            >
              {unit && (
                <div className="unit-anchor">
                  <div
                    className={`unit team-${unit.team}`}
                    draggable={!terrainEditMode}
                    onDragStart={(e) => {
                      if (terrainEditMode) return;
                      e.dataTransfer.setData("text/unit-id", unit.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <span>
                      {templates.find((t) => t.id === unit.templateId)?.name ??
                        "Unknown"}
                    </span>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(unit);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
