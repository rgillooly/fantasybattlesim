import { useState } from "react";
import EditAbilityModal from "./EditAbilityModal";

export default function AbilityLibrary({
  abilities,
  setAbilities,
  templates,
  setTemplates,
}) {
  const [abilityToDelete, setAbilityToDelete] = useState(null);
  const [abilityToEdit, setAbilityToEdit] = useState(null);

  // Delete ability
  function deleteAbility() {
    setAbilities(abilities.filter((a) => a.id !== abilityToDelete.id));

    // Remove this ability from all templates
    setTemplates(
      templates.map((t) => ({
        ...t,
        abilities: (t.abilities || []).filter(
          (id) => id !== abilityToDelete.id
        ),
      }))
    );

    setAbilityToDelete(null);
  }

  return (
    <div style={{ border: "1px solid #aaa", padding: 10, marginTop: 10 }}>
      <h3>Ability Library</h3>

      {/* Edit Modal */}
      {abilityToEdit && (
        <EditAbilityModal
          ability={abilityToEdit}
          onSave={(updated) => {
            const exists = abilities.some((a) => a.id === updated.id);

            if (exists) {
              // EDIT EXISTING
              setAbilities(
                abilities.map((a) => (a.id === updated.id ? updated : a))
              );
            } else {
              // ADD NEW
              setAbilities([...abilities, updated]);
            }

            setAbilityToEdit(null);
          }}
          onCancel={() => setAbilityToEdit(null)}
        />
      )}

      {/* Delete Modal */}
      {abilityToDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Delete Ability?</h3>
            <p>This will remove it and unassign from all units.</p>

            <div className="modal-buttons">
              <button className="danger" onClick={deleteAbility}>
                Delete
              </button>
              <button onClick={() => setAbilityToDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Ability List */}
      {abilities.map((a) => (
        <div
          key={a.id}
          style={{
            padding: 6,
            marginBottom: 6,
            border: "1px solid gray",
            background: "#eee",
            position: "relative",
          }}
        >
          <strong>{a.name}</strong> ({a.type}){/* Edit */}
          <button className="edit-btn" onClick={() => setAbilityToEdit(a)}>
            ✎
          </button>
          {/* Delete */}
          <button className="delete-btn" onClick={() => setAbilityToDelete(a)}>
            ✕
          </button>
        </div>
      ))}

      <button
        style={{ marginTop: 10 }}
        onClick={() =>
          setAbilityToEdit({
            id: "ability-" + Date.now(),
            name: "",
            type: "damage",
            magnitude: 10,
            range: 1,
            cooldown: 2,
          })
        }
      >
        + Create Ability
      </button>
    </div>
  );
}
