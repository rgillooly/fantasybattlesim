// src/components/EditAbilityModal.jsx
import { useState } from "react";

const DAMAGE_TYPES = [
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
];

const SAVE_STATS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export default function EditAbilityModal({ ability, onSave, onCancel }) {
  const [edit, setEdit] = useState({
    id: ability.id,
    name: ability.name || "",
    type: ability.type || "damage",

    // Damage + type
    damage: ability.damage ?? 0,
    damageType: ability.damageType || "physical",

    // Attack roll
    attackBonus: ability.attackBonus ?? 0,

    // Heal
    heal: ability.heal ?? 0,

    // Range & cooldown
    range: ability.range ?? 3,
    cooldown: ability.cooldown ?? 0,

    // Shape + geometry
    shape: ability.shape || "single", // single | radius | line | self
    radius: ability.radius ?? 1,
    lineLength: ability.lineLength ?? 3,

    // Flying buff toggle
    flying: ability.flying ?? false,

    // Saving throw info
    saveAbility: ability.saveAbility || "",
    saveDC: ability.saveDC ?? 12,
    halfOnSave: ability.halfOnSave ?? true,
  });

  function update(field, value) {
    setEdit({ ...edit, [field]: value });
  }

  function handleSave() {
    const cleaned = {
      id: edit.id,
      name: edit.name,
      type: edit.type,

      damage: Number(edit.damage) || 0,
      heal: Number(edit.heal) || 0,

      damageType: edit.damageType,
      attackBonus: Number(edit.attackBonus) || 0,

      range: Number(edit.range) || 0,
      cooldown: Number(edit.cooldown) || 0,

      shape: edit.shape,
      radius: Number(edit.radius) || 1,
      lineLength: Number(edit.lineLength) || 3,

      flying: !!edit.flying,

      saveAbility: edit.saveAbility || null,
      saveDC: edit.saveAbility ? Number(edit.saveDC) || 10 : null,
      halfOnSave: !!edit.halfOnSave,
    };

    onSave(cleaned);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit Ability</h3>

        {/* NAME */}
        <label>Name:</label>
        <input
          value={edit.name}
          onChange={(e) => update("name", e.target.value)}
        />

        {/* TYPE */}
        <label>Ability Type:</label>
        <select
          value={edit.type}
          onChange={(e) => update("type", e.target.value)}
        >
          <option value="damage">Damage</option>
          <option value="heal">Heal</option>
          <option value="buff">Buff</option>
          <option value="debuff">Debuff</option>
          <option value="slow">Slow</option>
          <option value="dot">Damage Over Time</option>
        </select>

        {/* DAMAGE AND ATTACK */}
        <h4>Damage</h4>
        <label>Damage Amount:</label>
        <input
          type="number"
          value={edit.damage}
          onChange={(e) => update("damage", e.target.value)}
        />

        <label>Damage Type:</label>
        <select
          value={edit.damageType}
          onChange={(e) => update("damageType", e.target.value)}
        >
          {DAMAGE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <label>Attack Bonus (d20 + bonus):</label>
        <input
          type="number"
          value={edit.attackBonus}
          onChange={(e) => update("attackBonus", e.target.value)}
        />

        {/* HEAL */}
        <h4>Healing</h4>
        <label>Healing Amount:</label>
        <input
          type="number"
          value={edit.heal}
          onChange={(e) => update("heal", e.target.value)}
        />

        {/* RANGE + COOLDOWN */}
        <h4>Ability Use</h4>
        <label>Range (tiles):</label>
        <input
          type="number"
          value={edit.range}
          onChange={(e) => update("range", e.target.value)}
        />

        <label>Cooldown (rounds):</label>
        <input
          type="number"
          value={edit.cooldown}
          onChange={(e) => update("cooldown", e.target.value)}
        />

        {/* SHAPE */}
        <h4>Shape</h4>
        <label>Shape:</label>
        <select
          value={edit.shape}
          onChange={(e) => update("shape", e.target.value)}
        >
          <option value="single">Single Target</option>
          <option value="radius">Radius (AoE)</option>
          <option value="line">Line</option>
          <option value="self">Self</option>
        </select>

        {edit.shape === "radius" && (
          <>
            <label>Radius (tiles):</label>
            <input
              type="number"
              value={edit.radius}
              onChange={(e) => update("radius", e.target.value)}
            />
          </>
        )}

        {edit.shape === "line" && (
          <>
            <label>Line Length (tiles):</label>
            <input
              type="number"
              value={edit.lineLength}
              onChange={(e) => update("lineLength", e.target.value)}
            />
          </>
        )}

        {/* FLYING TOGGLE */}
        <h4>Flight</h4>
        <label>
          <input
            type="checkbox"
            checked={edit.flying}
            onChange={(e) => update("flying", e.target.checked)}
          />
          Grants Flying (ignore terrain & LOS blockers)
        </label>

        {/* SAVING THROW */}
        <h4>Saving Throw</h4>
        <label>Save Ability:</label>
        <select
          value={edit.saveAbility || ""}
          onChange={(e) => update("saveAbility", e.target.value)}
        >
          <option value="">None</option>
          {SAVE_STATS.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        {edit.saveAbility && (
          <>
            <label>Save DC:</label>
            <input
              type="number"
              value={edit.saveDC}
              onChange={(e) => update("saveDC", e.target.value)}
            />

            <label>
              <input
                type="checkbox"
                checked={edit.halfOnSave}
                onChange={(e) => update("halfOnSave", e.target.checked)}
              />
              Half damage on successful save
            </label>
          </>
        )}

        {/* BUTTONS */}
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
