// src/components/UnitLibrary.jsx
import { useState } from "react";

export default function UnitLibrary({
  templates,
  setTemplates,
  setTemplateToEdit, // <-- NEW: from BattleApp
}) {
  const [team, setTeam] = useState("A");
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // ---------------------------------------------
  // DELETE LOGIC
  // ---------------------------------------------
  function confirmDeleteTemplate(template) {
    setTemplateToDelete(template);
  }

  function deleteTemplate() {
    setTemplates(templates.filter((t) => t.id !== templateToDelete.id));
    setTemplateToDelete(null);
  }

  function cancelDelete() {
    setTemplateToDelete(null);
  }

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  return (
    <div
      style={{
        border: "1px solid #aaa",
        padding: 10,
        marginTop: 10,
        background: "#f8f8f8",
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxHeight: 300,
        overflowY: "auto",
      }}
    >
      {/* DELETE CONFIRMATION MODAL */}
      {templateToDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Delete Unit Template?</h3>
            <p>This will remove it permanently.</p>

            <div className="modal-buttons">
              <button className="danger" onClick={deleteTemplate}>
                Delete
              </button>
              <button onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <h3>Unit Library</h3>

      {/* TEAM SELECTOR */}
      <label>Team:</label>
      <select
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        style={{ marginBottom: 10 }}
      >
        <option value="A">Team A</option>
        <option value="B">Team B</option>
      </select>

      {/* TEMPLATE LIST */}
      {templates.map((t) => (
        <div
          key={t.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/template-id", t.id);
            e.dataTransfer.setData("text/team", team);
            e.dataTransfer.effectAllowed = "copy";
          }}
          className="library-item"
          style={{
            padding: 6,
            border: "1px solid gray",
            background: "#eee",
            borderRadius: 4,
            position: "relative",
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {/* TEMPLATE NAME */}
          <span>{t.name}</span>

          <div style={{ display: "flex", gap: 4 }}>
            {/* EDIT BUTTON */}
            <button
              className="edit-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTemplateToEdit(t); // <-- OPEN MODAL in BattleApp
              }}
              style={{
                padding: "0 6px",
                background: "#0080ff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 10,
              }}
            >
              ✎
            </button>

            {/* DELETE BUTTON */}
            <button
              className="delete-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                confirmDeleteTemplate(t);
              }}
              style={{
                padding: "0 6px",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 10,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
