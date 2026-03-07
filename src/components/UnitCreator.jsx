// src/components/UnitCreator.jsx
import { useState } from "react";

export default function UnitCreator({ onCreate }) {
  const [name, setName] = useState("");

  const [stats, setStats] = useState({
    // Combat stats
    maxHp: 20,
    armorclass: 3,
    speed: 3,
    range: 1,
    initiativebonus: 5,

    // D&D ability scores
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });

  function updateStat(key, val) {
    setStats({ ...stats, [key]: Number(val) });
  }

  function createUnit() {
    if (!name.trim()) return;

    onCreate({
      id: "unitTemplate-" + Date.now(),
      name,
      stats,
      abilities: [],
    });

    setName("");
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 10 }}>
      <h3>Create Unit</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Unit name"
        style={{ width: "100%", marginBottom: 10 }}
      />

      <h4>Combat Stats</h4>
      <div style={{ marginBottom: 10 }}>
        {["maxHp", "armorclass", "speed", "range", "initiativebonus"].map(
          (key) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <label>{key}</label>
              <input
                type="number"
                value={stats[key]}
                onChange={(e) => updateStat(key, e.target.value)}
                style={{ width: 60 }}
              />
            </div>
          )
        )}
      </div>

      <h4>Ability Scores</h4>
      <div>
        {[
          "strength",
          "dexterity",
          "constitution",
          "intelligence",
          "wisdom",
          "charisma",
        ].map((key) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <label>{key}</label>
            <input
              type="number"
              value={stats[key]}
              onChange={(e) => updateStat(key, e.target.value)}
              style={{ width: 60 }}
            />
          </div>
        ))}
      </div>

      <button onClick={createUnit} style={{ marginTop: 10 }}>
        Save Unit
      </button>
    </div>
  );
}
