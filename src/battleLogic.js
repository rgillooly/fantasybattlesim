// src/battleLogic.js
import { gridDistance } from "./gridUtils";

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

function hexKey(x, y) {
  return `${x},${y}`;
}

// ---- DICE HELPERS ----

export function rollDice(expression) {
  if (typeof expression === "number") return expression;
  if (!expression) return 0;
  const match = String(expression)
    .trim()
    .match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    const flat = parseInt(expression, 10);
    return isNaN(flat) ? 0 : flat;
  }
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  let total = modifier;
  for (let i = 0; i < count; i++)
    total += Math.floor(Math.random() * sides) + 1;
  return total;
}

function rollToHit(dc = 10) {
  const roll = Math.floor(Math.random() * 20) + 1;
  return { hit: roll >= dc, roll };
}

// ---- A* ----
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

  const getTileLocal = (x, y) => tiles.find((t) => t.x === x && t.y === y);

  while (open.size > 0) {
    let currentKey = null,
      current = null;
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
    for (const d of SQUARE_DIRS) {
      const nx = cx + d.x,
        ny = cy + d.y;
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
      const existing = open.get(nk);
      if (!existing || g < existing.g) {
        open.set(nk, { x: nx, y: ny, g, f: g + h });
        cameFrom.set(nk, currentKey);
      }
    }
  }
  return null;
}

// ---- LOS ----
function hasLineOfSight(attacker, target, tiles, ignoreTerrain) {
  if (ignoreTerrain) return true;
  let x1 = attacker.x,
    y1 = attacker.y;
  const x2 = target.x,
    y2 = target.y;
  const dx = Math.abs(x2 - x1),
    dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1,
    sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  while (!(x1 === x2 && y1 === y2)) {
    const tile = getTile(tiles, x1, y1);
    if (tile && (tile.terrain?.blocksAttacks || tile.terrain?.blocksMovement)) {
      if (
        !(x1 === attacker.x && y1 === attacker.y) &&
        !(x1 === target.x && y1 === target.y)
      )
        return false;
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

// ---- HELPERS ----
function getTemplate(templates, id) {
  return templates.find((t) => t.id === id);
}

function isOccupied(units, x, y, ignoreId = null) {
  return units.some(
    (u) =>
      u.currentHp > 0 &&
      u.x === x &&
      u.y === y &&
      (!ignoreId || u.id !== ignoreId),
  );
}

function abilityBonus(score) {
  return Math.floor((score - 10) / 2);
}

function getCoverBonusForTarget(target, tiles) {
  return getTile(tiles, target.x, target.y)?.terrain?.defenseBonus || 0;
}

function unitHasFlying(unit, templates, abilities) {
  const tpl = getTemplate(templates, unit.templateId);
  if (!tpl?.abilities) return false;
  return tpl.abilities.some(
    (id) => abilities.find((a) => a.id === id)?.flying === true,
  );
}

function rollSavingThrow(target, ability, templates) {
  const tpl = getTemplate(templates, target.templateId);
  const score =
    (ability.saveAbility && tpl?.stats?.[ability.saveAbility]) ?? 10;
  return (
    Math.floor(Math.random() * 20) + 1 + abilityBonus(score) >=
    (ability.saveDC || 10)
  );
}

// ---- WEAPON ATTACK ----
function canAttackWithWeapon(attacker, target, tiles, templates, abilities) {
  const tpl = getTemplate(templates, attacker.templateId);
  if (!tpl) return { allowed: false };
  const range = tpl.stats.range || 1;
  if (gridDistance(attacker, target) > range) return { allowed: false };
  const ignoreTerrain = unitHasFlying(attacker, templates, abilities);
  if (!hasLineOfSight(attacker, target, tiles, ignoreTerrain))
    return { allowed: false };
  return { allowed: true, cover: getCoverBonusForTarget(target, tiles) };
}

/**
 * Returns { dmg, hit, miss, reason } so the caller can log what happened.
 */
function resolveWeaponDamage(attacker, target, coverBonus, templates) {
  const attTpl = getTemplate(templates, attacker.templateId);
  const tgtTpl = getTemplate(templates, target.templateId);
  if (!attTpl || !tgtTpl)
    return { dmg: 0, miss: true, reason: "missing template" };

  const stats = attTpl.stats;

  if (stats.useHitRoll) {
    const dc = (stats.hitDC ?? 10) + (coverBonus ?? 0);
    const { hit, roll } = rollToHit(dc);
    if (!hit)
      return { dmg: 0, miss: true, reason: `rolled ${roll} (needed ${dc})` };
  }

  let dmg;
  if (stats.damageMode === "dice") {
    dmg = rollDice(stats.damageDice || "1d6");
  } else {
    const atk = stats.attack || 0;
    const def = (tgtTpl.stats.defense || 0) + (coverBonus || 0);
    dmg = Math.max(1, atk - def);
  }

  return { dmg, miss: false };
}

// ---- ABILITY SYSTEM ----
function chooseOffensiveAbility(unit, enemies, tiles, templates, abilities) {
  const tpl = getTemplate(templates, unit.templateId);
  if (!tpl?.abilities?.length) return null;

  const unitAbilities = tpl.abilities
    .map((id) => abilities.find((a) => a.id === id))
    .filter(
      (a) =>
        a &&
        ["damage", "dot", "debuff", "slow"].includes(a.type) &&
        a.shape !== "self",
    );

  if (!unitAbilities.length) return null;

  let bestChoice = null,
    bestScore = -Infinity;

  for (const ab of unitAbilities) {
    const range = ab.range || 3;
    const damageType = ab.damageType || "physical";
    const ignoreTerrain = unitHasFlying(unit, templates, abilities);

    let estimatedDmg = ab.damage || 0;
    if (ab.damageMode === "dice" && ab.damageDice) {
      const m = String(ab.damageDice).match(/^(\d+)d(\d+)([+-]\d+)?$/i);
      if (m)
        estimatedDmg =
          parseInt(m[1]) * ((parseInt(m[2]) + 1) / 2) +
          (m[3] ? parseInt(m[3]) : 0);
    }

    for (const enemy of enemies) {
      const dist = gridDistance(unit, enemy);
      if (dist > range) continue;
      if (!hasLineOfSight(unit, enemy, tiles, ignoreTerrain)) continue;
      const enemyTpl = getTemplate(templates, enemy.templateId);
      if (!enemyTpl) continue;

      const cover = getCoverBonusForTarget(enemy, tiles);
      const hpMissing = (enemyTpl.stats.maxHp || 1) - enemy.currentHp;
      const isVulnerable =
        enemyTpl.vulnerabilities?.includes(damageType) || false;
      const isResistant = enemyTpl.resistances?.includes(damageType) || false;

      let score = 0;
      if (isVulnerable) score += 100;
      if (isResistant) score -= 40;
      score += estimatedDmg - cover * 2 - dist + hpMissing * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestChoice = { ability: ab, target: enemy };
      }
    }
  }
  return bestChoice;
}

/**
 * Returns { dmg, heal, miss, reason } for logging.
 */
function resolveAbilityEffect(
  caster,
  target,
  ability,
  templates,
  coverBonus = 0,
) {
  const targetTemplate = getTemplate(templates, target.templateId);
  if (!targetTemplate)
    return { dmg: 0, miss: true, reason: "missing template" };

  // Hit roll
  if (ability.useHitRoll) {
    const dc = (ability.hitDC ?? 10) + coverBonus;
    const { hit, roll } = rollToHit(dc);
    if (!hit)
      return { dmg: 0, miss: true, reason: `rolled ${roll} (needed ${dc})` };
  }

  // Legacy attack bonus
  if (!ability.useHitRoll && ability.attackBonus !== undefined) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + (ability.attackBonus || 0);
    const ac = targetTemplate.stats.ac ?? targetTemplate.stats.defense ?? 10;
    if (total < ac)
      return { dmg: 0, miss: true, reason: `rolled ${total} vs AC ${ac}` };
  }

  const damageType = ability.damageType || "physical";
  let damage =
    ability.damageMode === "dice" && ability.damageDice
      ? rollDice(ability.damageDice)
      : ability.damage || 0;
  let heal = ability.heal || 0;
  let savedNote = "";

  if (ability.saveAbility) {
    const success = rollSavingThrow(target, ability, templates);
    if (success) {
      if (ability.halfOnSave) {
        damage = Math.floor(damage / 2);
        heal = Math.floor(heal / 2);
        savedNote = " (save: half)";
      } else {
        damage = 0;
        heal = 0;
        savedNote = " (save: negated)";
      }
    }
  }

  if (targetTemplate.resistances?.includes(damageType)) {
    damage = Math.floor(damage / 2);
  }
  if (targetTemplate.vulnerabilities?.includes(damageType)) {
    damage = damage * 2;
  }

  return { dmg: damage, heal, miss: false, note: savedNote };
}

// ---- TARGETING ----
function findNearestEnemy(unit, enemies) {
  return enemies.reduce((best, e) => {
    const d = gridDistance(unit, e);
    return !best || d < gridDistance(unit, best) ? e : best;
  }, null);
}

// ---- MAIN SIMULATION ----
export function simulateRound(battleState, templates, abilities) {
  const tiles = battleState.tiles;
  const roundNum = battleState.round + 1;

  const units = battleState.units.map((u) => ({
    ...u,
    x: Number(u.x),
    y: Number(u.y),
  }));

  const order = [...units].sort((a, b) => {
    const ia = getTemplate(templates, a.templateId)?.stats?.initiative ?? 0;
    const ib = getTemplate(templates, b.templateId)?.stats?.initiative ?? 0;
    return ib - ia;
  });

  // Log for this round: array of { unitName, team, action, detail }
  const roundLog = [];

  const log = (unit, tpl, action, detail = "") => {
    roundLog.push({
      round: roundNum,
      unitName: tpl?.name ?? unit.id,
      team: unit.team,
      action,
      detail,
    });
  };

  for (const acting of order) {
    const unit = units.find((u) => u.id === acting.id);
    if (!unit || unit.currentHp <= 0) continue;

    const tpl = getTemplate(templates, unit.templateId);
    if (!tpl) continue;

    const enemies = units.filter(
      (u) => u.team !== unit.team && u.currentHp > 0,
    );
    if (enemies.length === 0) break;

    const hasFly = unitHasFlying(unit, templates, abilities);

    // 1) Offensive ability
    const abilityChoice = chooseOffensiveAbility(
      unit,
      enemies,
      tiles,
      templates,
      abilities,
    );
    if (abilityChoice) {
      const { ability, target } = abilityChoice;
      const cover = getCoverBonusForTarget(target, tiles);
      const targetTpl = getTemplate(templates, target.templateId);
      const result = resolveAbilityEffect(
        unit,
        target,
        ability,
        templates,
        cover,
      );

      if (result.miss) {
        log(
          unit,
          tpl,
          "miss",
          `used ${ability.name} on ${targetTpl?.name} — missed${result.reason ? ` (${result.reason})` : ""}`,
        );
      } else if (result.heal > 0) {
        log(
          unit,
          tpl,
          "heal",
          `used ${ability.name} → healed ${result.heal} HP${result.note || ""}`,
        );
        target.currentHp += result.heal;
      } else {
        const hpBefore = target.currentHp;
        target.currentHp -= result.dmg;
        const died = target.currentHp <= 0;
        log(
          unit,
          tpl,
          died ? "kill" : "ability",
          `used ${ability.name} on ${targetTpl?.name} — ${result.dmg} dmg${result.note || ""}${died ? " (killed)" : ` (${target.currentHp}/${targetTpl?.stats?.maxHp} HP left)`}`,
        );
      }
      continue;
    }

    // 2) Weapon attack
    let bestWeaponTarget = null,
      bestScore = -Infinity;
    for (const enemy of enemies) {
      const check = canAttackWithWeapon(
        unit,
        enemy,
        tiles,
        templates,
        abilities,
      );
      if (!check.allowed) continue;
      const dist = gridDistance(unit, enemy);
      const hpMissing =
        (getTemplate(templates, enemy.templateId)?.stats.maxHp || 0) -
        enemy.currentHp;
      const score = -check.cover * 2 - dist + hpMissing * 0.1;
      if (score > bestScore) {
        bestScore = score;
        bestWeaponTarget = { enemy, cover: check.cover };
      }
    }

    if (bestWeaponTarget) {
      const { enemy, cover } = bestWeaponTarget;
      const targetTpl = getTemplate(templates, enemy.templateId);
      const result = resolveWeaponDamage(unit, enemy, cover, templates);

      if (result.miss) {
        log(
          unit,
          tpl,
          "miss",
          `attacked ${targetTpl?.name} — missed (${result.reason})`,
        );
      } else {
        enemy.currentHp -= result.dmg;
        const died = enemy.currentHp <= 0;
        log(
          unit,
          tpl,
          died ? "kill" : "attack",
          `attacked ${targetTpl?.name} — ${result.dmg} dmg${died ? " (killed)" : ` (${enemy.currentHp}/${targetTpl?.stats?.maxHp} HP left)`}`,
        );
      }
      continue;
    }

    // 3) Move
    const nearest = findNearestEnemy(unit, enemies);
    if (!nearest) continue;

    const path = aStar(
      { x: unit.x, y: unit.y },
      { x: nearest.x, y: nearest.y },
      tiles,
      hasFly,
    );
    if (!path || path.length <= 1) continue;

    const movePoints = tpl.stats.speed ?? tpl.stats.movement ?? 3;
    let remaining = movePoints,
      stepIndex = 1;
    let finalPos = { x: unit.x, y: unit.y };

    while (stepIndex < path.length) {
      const step = path[stepIndex];
      const tile = getTile(tiles, step.x, step.y);
      const cost = hasFly ? 1 : tile?.terrain?.movementCost || 1;
      if (remaining < cost) break;
      if (isOccupied(units, step.x, step.y, unit.id)) break;
      remaining -= cost;
      finalPos = { x: step.x, y: step.y };
      stepIndex++;
    }

    const nearestTpl = getTemplate(templates, nearest.templateId);
    const moved = finalPos.x !== unit.x || finalPos.y !== unit.y;
    if (moved) {
      const destTile = getTile(tiles, finalPos.x, finalPos.y);
      const terrain = destTile?.terrain?.type ?? "normal";
      log(
        unit,
        tpl,
        "move",
        `moved to (${finalPos.x},${finalPos.y}) [${terrain}] toward ${nearestTpl?.name}`,
      );
    } else {
      log(unit, tpl, "wait", `couldn't move toward ${nearestTpl?.name}`);
    }

    unit.x = finalPos.x;
    unit.y = finalPos.y;
  }

  return {
    ...battleState,
    units: units.filter((u) => u.currentHp > 0),
    round: roundNum,
    roundLog, // <-- new: array of log entries for this round
  };
}
