// src/data.js

export function createUnitTemplate(id, name, stats = {}) {
  return {
    id,
    name,
    stats: {
      maxHp: stats.maxHp ?? 10,
      defense: stats.defense ?? 10, // replaces old "defense"
      movement: stats.movement ?? 3,
      range: stats.range ?? 1,
      initiative: stats.initiative ?? 5,

      // D&D ability scores
      strength: stats.strength ?? 10,
      dexterity: stats.dexterity ?? 10,
      constitution: stats.constitution ?? 10,
      intelligence: stats.intelligence ?? 10,
      wisdom: stats.wisdom ?? 10,
      charisma: stats.charisma ?? 10,
    },

    abilities: stats.abilities || [],

    // NEW:
    resistances: stats.resistances || [],
    vulnerabilities: stats.vulnerabilities || [],
  };
}
