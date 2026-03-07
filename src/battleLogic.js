// src/battleLogic.js
import { gridDistance } from "./gridUtils";

// 8 directions, diagonals allowed
const SQUARE_DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: -1 },
];

function getTile(tiles, x, y) {
  return tiles.find((t) => t.x === x && t.y === y);
}

function getNeighbors(tiles, tile) {
  return SQUARE_DIRS.map((d) =>
    getTile(tiles, tile.x + d.x, tile.y + d.y)
  ).filter(Boolean);
}

function hexKey(x, y) {
  return `${x},${y}`;
}

// ---- A* PATHFINDING (square grid) ----
function aStar(start, goal, tiles, ignoreTerrain = false) {
  const startKey = hexKey(start.x, start.y);
  const goalKey = hexKey(goal.x, goal.y);

  const open = new Map();
  const closed = new Set();
  const cameFrom = new Map();

  open.set(startKey, {
    x: start.x,
    y: start.y,
    g: 0,
    f: gridDistance(start, goal),
  });

  function getTileLocal(x, y) {
    return tiles.find((t) => t.x === x && t.y === y);
  }

  while (open.size > 0) {
    let currentKey = null;
    let current = null;

    for (const [key, node] of open.entries()) {
      if (!current || node.f < current.f) {
        current = node;
        currentKey = key;
      }
    }

    if (currentKey === goalKey) {
      const path = [];
      let ck = currentKey;
      while (ck) {
        const [x, y] = ck.split(",").map(Number);
        path.push({ x, y });
        ck = cameFrom.get(ck);
      }
      return path.reverse();
    }

    open.delete(currentKey);
    closed.add(currentKey);

    const [cx, cy] = currentKey.split(",").map(Number);
    const currentTile = getTileLocal(cx, cy);
    if (!currentTile) continue;

    for (const d of SQUARE_DIRS) {
      const nx = cx + d.x;
      const ny = cy + d.y;
      const neighborTile = getTileLocal(nx, ny);
      if (!neighborTile) continue;

      if (!ignoreTerrain && neighborTile.terrain?.blocksMovement) continue;

      const nk = hexKey(nx, ny);
      if (closed.has(nk)) continue;

      const moveCost = ignoreTerrain
        ? 1
        : neighborTile.terrain?.movementCost || 1;
      const g = current.g + moveCost;
      const h = gridDistance(neighborTile, goal);
      const f = g + h;

      const existing = open.get(nk);
      if (!existing || g < existing.g) {
        open.set(nk, { x: nx, y: ny, g, f });
        cameFrom.set(nk, currentKey);
      }
    }
  }

  return null; // no path
}

// ---- LOS (Bresenham, square) ----
function hasLineOfSight(attacker, target, tiles, ignoreTerrain) {
  if (ignoreTerrain) return true;

  let x1 = attacker.x;
  let y1 = attacker.y;
  const x2 = target.x;
  const y2 = target.y;

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  while (!(x1 === x2 && y1 === y2)) {
    const tile = getTile(tiles, x1, y1);

    if (tile && (tile.terrain?.blocksAttacks || tile.terrain?.blocksMovement)) {
      const isSource = x1 === attacker.x && y1 === attacker.y;
      const isTarget = x1 === target.x && y1 === target.y;
      if (!isSource && !isTarget) {
        return false;
      }
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
  }

  const targetTile = getTile(tiles, target.x, target.y);
  if (targetTile?.terrain?.blocksAttacks) return false;

  return true;
}

// ---- GENERAL HELPERS ----
function getTemplate(templates, id) {
  return templates.find((t) => t.id === id);
}

function isOccupied(units, x, y, ignoreId = null) {
  return units.some(
    (u) =>
      u.currentHp > 0 &&
      u.x === x &&
      u.y === y &&
      (!ignoreId || u.id !== ignoreId)
  );
}

function abilityBonus(score) {
  return Math.floor((score - 10) / 2);
}

function getCoverBonusForTarget(target, tiles) {
  const tile = getTile(tiles, target.x, target.y);
  return tile?.terrain?.defenseBonus || 0;
}

function unitHasFlying(unit, templates, abilities) {
  const tpl = getTemplate(templates, unit.templateId);
  if (!tpl || !tpl.abilities) return false;
  return tpl.abilities.some((id) => {
    const ab = abilities.find((a) => a.id === id);
    return ab?.flying === true;
  });
}

function abilityScoreForSave(target, ability, templates) {
  if (!ability.saveAbility) return 10;
  const tpl = getTemplate(templates, target.templateId);
  if (!tpl || !tpl.stats) return 10;
  return tpl.stats[ability.saveAbility] ?? 10;
}

function rollSavingThrow(target, ability, templates) {
  const score = abilityScoreForSave(target, ability, templates);
  const bonus = abilityBonus(score);
  const roll = Math.floor(Math.random() * 20) + 1; // d20
  const total = roll + bonus;
  return total >= (ability.saveDC || 10);
}

// ---- ATTACK / ABILITY SELECTION ----

// We keep this as a helper but don't rely on it for damage anymore.
// You can remove it entirely if you no longer want weapon attacks.
function canAttackWithWeapon(attacker, target, tiles, templates, abilities) {
  const tpl = getTemplate(templates, attacker.templateId);
  if (!tpl) return { allowed: false };

  const range = tpl.stats.range || 1;
  const dist = gridDistance(attacker, target);
  if (dist > range) return { allowed: false };

  const ignoreTerrain = unitHasFlying(attacker, templates, abilities);
  if (!hasLineOfSight(attacker, target, tiles, ignoreTerrain)) {
    return { allowed: false };
  }

  const cover = getCoverBonusForTarget(target, tiles);
  return { allowed: true, cover };
}

// Also kept for backward compatibility; you can safely delete if not using.
function applyWeaponDamage(attacker, target, coverBonus, templates) {
  const attTpl = getTemplate(templates, attacker.templateId);
  const tgtTpl = getTemplate(templates, target.templateId);
  if (!attTpl || !tgtTpl) return;
  const atk = attTpl.stats.attack || 0;
  const def = (tgtTpl.stats.defense || 0) + (coverBonus || 0);
  const dmg = Math.max(1, atk - def);
  target.currentHp -= dmg;
}

// Offensive abilities: choose best target & ability, prioritizing vulnerability
function chooseOffensiveAbility(unit, enemies, tiles, templates, abilities) {
  const tpl = getTemplate(templates, unit.templateId);
  if (!tpl || !tpl.abilities || tpl.abilities.length === 0) return null;

  const unitAbilities = tpl.abilities
    .map((id) => abilities.find((a) => a.id === id))
    .filter(
      (a) =>
        a &&
        ["damage", "dot", "debuff", "slow"].includes(a.type) &&
        a.shape !== "self"
    );

  if (unitAbilities.length === 0) return null;

  let bestChoice = null;
  let bestScore = -Infinity;

  for (const ab of unitAbilities) {
    const range = ab.range || 3;
    const dmg = ab.damage || 0;
    const damageType = ab.damageType || "physical";
    const ignoreTerrain = unitHasFlying(unit, templates, abilities);

    for (const enemy of enemies) {
      const dist = gridDistance(unit, enemy);
      if (dist > range) continue;
      if (!hasLineOfSight(unit, enemy, tiles, ignoreTerrain)) continue;

      const enemyTpl = getTemplate(templates, enemy.templateId);
      if (!enemyTpl) continue;

      const cover = getCoverBonusForTarget(enemy, tiles);
      const maxHp = enemyTpl.stats.maxHp || 1;
      const hpMissing = maxHp - enemy.currentHp;

      const isVulnerable =
        enemyTpl.vulnerabilities?.includes(damageType) || false;
      const isResistant = enemyTpl.resistances?.includes(damageType) || false;

      // Scoring:
      // - Big bonus for hitting vulnerabilities
      // - Penalty if resistant
      // - Prefer more damage, less cover, closer, and lower hp
      let score = 0;
      if (isVulnerable) score += 100; // <<< big bias toward vuln targets
      if (isResistant) score -= 40;

      score += dmg; // raw power
      score -= cover * 2; // avoid high cover
      score -= dist; // prefer closer
      score += hpMissing * 0.1; // prefer finishing wounded targets

      if (score > bestScore) {
        bestScore = score;
        bestChoice = { ability: ab, target: enemy };
      }
    }
  }

  return bestChoice;
}

function applyAbilityEffect(caster, target, ability, templates) {
  const targetTemplate = getTemplate(templates, target.templateId);
  if (!targetTemplate) return;

  let damage = ability.damage || 0;
  let heal = ability.heal || 0;
  const damageType = ability.damageType || "physical";

  // -----------------------------------------
  // 1. Attack roll (if ability has attackBonus)
  // -----------------------------------------
  if (ability.attackBonus !== undefined) {
    const roll = Math.floor(Math.random() * 20) + 1; // d20
    const attackTotal = roll + (ability.attackBonus || 0);

    // target "AC": support both ac and defense field names
    const targetAC =
      targetTemplate.stats.ac ?? targetTemplate.stats.defense ?? 10;

    if (attackTotal < targetAC) {
      // MISS
      return;
    }
  }

  // -----------------------------------------
  // 2. Saving Throw (optional)
  // -----------------------------------------
  if (ability.saveAbility) {
    const success = rollSavingThrow(target, ability, templates);
    if (success) {
      if (ability.halfOnSave) {
        damage = Math.floor(damage / 2);
        heal = Math.floor(heal / 2);
      } else {
        // Completely negated
        damage = 0;
        heal = 0;
      }
    }
  }

  // -----------------------------------------
  // 3. Resistances and Vulnerabilities
  // -----------------------------------------
  if (targetTemplate.resistances?.includes(damageType)) {
    damage = Math.floor(damage / 2);
  }

  if (targetTemplate.vulnerabilities?.includes(damageType)) {
    damage = damage * 2;
  }

  // -----------------------------------------
  // 4. Apply damage or healing
  // -----------------------------------------
  if (damage > 0) {
    target.currentHp -= damage;
  }

  if (heal > 0) {
    target.currentHp += heal;
  }
}

// ---- TARGET / MOVEMENT CHOICE ----
function findNearestEnemy(unit, enemies) {
  let best = null;
  let bestDist = Infinity;
  for (const e of enemies) {
    const d = gridDistance(unit, e);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

// ---- MAIN SIMULATION ----
export function simulateRound(battleState, templates, abilities) {
  const tiles = battleState.tiles;

  const units = battleState.units.map((u) => ({
    ...u,
    x: Number(u.x),
    y: Number(u.y),
  }));

  // Sort by initiative
  const order = [...units].sort((a, b) => {
    const ta = getTemplate(templates, a.templateId);
    const tb = getTemplate(templates, b.templateId);
    const ia = ta?.stats?.initiative ?? 0;
    const ib = tb?.stats?.initiative ?? 0;
    return ib - ia;
  });

  for (const acting of order) {
    const unit = units.find((u) => u.id === acting.id);
    if (!unit || unit.currentHp <= 0) continue;

    const tpl = getTemplate(templates, unit.templateId);
    if (!tpl) continue;

    const enemies = units.filter(
      (u) => u.team !== unit.team && u.currentHp > 0
    );
    if (enemies.length === 0) break;

    const hasFly = unitHasFlying(unit, templates, abilities);

    // 1) Try to use an offensive ability (if any)
    const abilityChoice = chooseOffensiveAbility(
      unit,
      enemies,
      tiles,
      templates,
      abilities
    );

    if (abilityChoice) {
      applyAbilityEffect(
        unit,
        abilityChoice.target,
        abilityChoice.ability,
        templates
      );
      continue;
    }

    // 2) (Optional) Try weapon attack as fallback
    // If you don't want this at all, you can delete this whole block.
    let bestWeaponTarget = null;
    let bestScore = -Infinity;

    for (const enemy of enemies) {
      const check = canAttackWithWeapon(
        unit,
        enemy,
        tiles,
        templates,
        abilities
      );
      if (!check.allowed) continue;

      const dist = gridDistance(unit, enemy);
      const cover = check.cover;
      const hpMissing =
        (getTemplate(templates, enemy.templateId)?.stats.maxHp || 0) -
        enemy.currentHp;

      const score = -cover * 2 - dist + hpMissing * 0.1;
      if (score > bestScore) {
        bestScore = score;
        bestWeaponTarget = { enemy, cover };
      }
    }

    if (bestWeaponTarget) {
      applyWeaponDamage(
        unit,
        bestWeaponTarget.enemy,
        bestWeaponTarget.cover,
        templates
      );
      continue;
    }

    // 3) Move toward nearest enemy using A*
    const nearest = findNearestEnemy(unit, enemies);
    if (!nearest) continue;

    const path = aStar(
      { x: unit.x, y: unit.y },
      { x: nearest.x, y: nearest.y },
      tiles,
      hasFly // flyers ignore terrain in pathfinding
    );

    if (!path || path.length <= 1) continue;

    const movePoints = tpl.stats.speed ?? tpl.stats.movement ?? 3;
    let remaining = movePoints;
    let stepIndex = 1;
    let finalPos = { x: unit.x, y: unit.y };

    while (stepIndex < path.length) {
      const step = path[stepIndex];
      const tile = getTile(tiles, step.x, step.y);
      const cost = hasFly ? 1 : tile.terrain?.movementCost || 1;
      if (remaining < cost) break;

      // avoid walking into another unit
      if (isOccupied(units, step.x, step.y, unit.id)) break;

      remaining -= cost;
      finalPos = { x: step.x, y: step.y };
      stepIndex++;
    }

    unit.x = finalPos.x;
    unit.y = finalPos.y;
  }

  const alive = units.filter((u) => u.currentHp > 0);

  return {
    ...battleState,
    units: alive,
    round: battleState.round + 1,
  };
}
