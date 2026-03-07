// src/components/EditTemplateModal.jsx
import { useState } from "react";

export default function EditTemplateModal({ template, onSave, onCancel }) {
  // Make a copy so editing doesn't mutate original until saved
  const [edit, setEdit] = useState({
    id: template.id,
    name: template.name,
    stats: { ...template.stats },
    abilities: template.abilities || [],
  });

  function updateStat(stat, value) {
    setEdit({
      ...edit,
      stats: { ...edit.stats, [stat]: Number(value) },
    });
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

        <h4 style={{ marginTop: 10 }}>Stats</h4>
        <div>
          {Object.keys(edit.stats).map((key) => (
            <div
              key={key}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <label>{key}</label>
              <input
                type="number"
                value={edit.stats[key]}
                onChange={(e) => updateStat(key, e.target.value)}
                style={{ width: 60 }}
              />
            </div>
          ))}
        </div>

        <div className="modal-buttons" style={{ marginTop: 15 }}>
          <button className="danger" onClick={() => onSave(edit)}>
            Save
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
