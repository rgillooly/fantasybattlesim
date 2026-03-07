// src/components/UnitEditor.jsx
import { useState } from "react";

const CORE_STATS = ["maxHp", "ac", "speed", "range", "initiative"];

const ABILITY_STATS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export default function UnitEditor({ template, onSave, onCancel, abilities }) {
  const [edit, setEdit] = useState({
    ...template,
    stats: { ...template.stats },
    abilities: [...(template.abilities || [])],

    // Ensure these arrays always exist
    vulnerabilities: [...(template.vulnerabilities || [])],
    resistances: [...(template.resistances || [])],
  });

  function updateStat(stat, value) {
    setEdit({
      ...edit,
      stats: {
        ...edit.stats,
        [stat]: Number(value),
      },
    });
  }

  function addAbility(id) {
    if (!id) return;
    if (edit.abilities.includes(id)) return;
    setEdit({ ...edit, abilities: [...edit.abilities, id] });
  }

  function removeAbility(id) {
    setEdit({
      ...edit,
      abilities: edit.abilities.filter((a) => a !== id),
    });
  }

  function handleSave() {
    onSave(edit);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit Unit Template</h3>

        <label>Name:</label>
        <input
          value={edit.name}
          onChange={(e) => setEdit({ ...edit, name: e.target.value })}
        />

        <h4>Core Stats</h4>
        {CORE_STATS.map((key) => (
          <div
            key={key}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <label>{key}</label>
            <input
              type="number"
              value={edit.stats[key] ?? 0}
              onChange={(e) => updateStat(key, e.target.value)}
              style={{ width: 70 }}
            />
          </div>
        ))}

        <h4>Ability Scores</h4>
        {ABILITY_STATS.map((key) => (
          <div
            key={key}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <label>{key}</label>
            <input
              type="number"
              value={edit.stats[key] ?? 10}
              onChange={(e) => updateStat(key, e.target.value)}
              style={{ width: 70 }}
            />
          </div>
        ))}

        <h4>Abilities</h4>
        {edit.abilities.length === 0 && (
          <p style={{ fontStyle: "italic", opacity: 0.6 }}>
            No abilities assigned.
          </p>
        )}

        {edit.abilities.map((id) => {
          const ability = abilities.find((a) => a.id === id);
          if (!ability) return null;
          return (
            <div
              key={id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid #ccc",
                padding: "2px 4px",
                borderRadius: 4,
                marginBottom: 4,
              }}
            >
              <span>
                {ability.name} ({ability.type})
              </span>
              <button
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "0 6px",
                  cursor: "pointer",
                }}
                onClick={() => removeAbility(id)}
              >
                ✕
              </button>
            </div>
          );
        })}

        <select
          defaultValue=""
          onChange={(e) => addAbility(e.target.value)}
          style={{ marginTop: 4 }}
        >
          <option value="" disabled>
            Add ability…
          </option>
          {abilities
            .filter((a) => !edit.abilities.includes(a.id))
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
              </option>
            ))}
        </select>

        <h4>Damage Vulnerabilities</h4>
        <select
          defaultValue=""
          onChange={(e) => {
            const dmg = e.target.value;
            if (dmg && !edit.vulnerabilities.includes(dmg)) {
              setEdit({
                ...edit,
                vulnerabilities: [...edit.vulnerabilities, dmg],
              });
            }
          }}
        >
          <option value="" disabled>
            Add vulnerability…
          </option>
          {[
            "slashing",
            "bludgeoning",
            "piercing",
            "fire",
            "cold",
            "lightning",
            "acid",
            "poison",
            "psychic",
            "radiant",
            "necrotic",
          ]
            .filter((d) => !edit.vulnerabilities.includes(d))
            .map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
        </select>

        {edit.vulnerabilities.length === 0 && (
          <p style={{ opacity: 0.6, fontStyle: "italic" }}>None</p>
        )}

        {edit.vulnerabilities.map((dmg) => (
          <div
            key={dmg}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
              padding: "2px 6px",
              border: "1px solid #888",
              borderRadius: 4,
            }}
          >
            <span>{dmg}</span>
            <button
              onClick={() =>
                setEdit({
                  ...edit,
                  vulnerabilities: edit.vulnerabilities.filter(
                    (v) => v !== dmg
                  ),
                })
              }
              style={{
                background: "red",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "0 6px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}

        <h4>Damage Resistances</h4>

        <select
          defaultValue=""
          onChange={(e) => {
            const dmg = e.target.value;
            if (dmg && !edit.resistances.includes(dmg)) {
              setEdit({
                ...edit,
                resistances: [...edit.resistances, dmg],
              });
            }
          }}
        >
          <option value="" disabled>
            Add resistance…
          </option>

          {[
            "slashing",
            "bludgeoning",
            "piercing",
            "fire",
            "cold",
            "lightning",
            "acid",
            "poison",
            "psychic",
            "radiant",
            "necrotic",
          ]
            .filter((d) => !edit.resistances.includes(d))
            .map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
        </select>

        {edit.resistances.length === 0 && (
          <p style={{ opacity: 0.6, fontStyle: "italic" }}>None</p>
        )}

        {edit.resistances.map((dmg) => (
          <div
            key={dmg}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
              padding: "2px 6px",
              border: "1px solid #888",
              borderRadius: 4,
            }}
          >
            <span>{dmg}</span>

            <button
              onClick={() =>
                setEdit({
                  ...edit,
                  resistances: edit.resistances.filter((r) => r !== dmg),
                })
              }
              style={{
                background: "red",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "0 6px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}

        <div className="modal-buttons" style={{ marginTop: 12 }}>
          <button className="danger" onClick={handleSave}>
            Save
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
