// src/components/ResetAllData.jsx
import { useState } from "react";

export default function ResetAllData() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  function handleReset() {
    if (typed !== "DELETE") {
      alert("You must type DELETE to confirm.");
      return;
    }

    localStorage.clear();
    alert("All saved data has been erased!");

    // Reload page to return everything to default
    window.location.reload();
  }

  return (
    <div style={{ border: "1px solid #a00", padding: 10, marginTop: 20 }}>
      <h3 style={{ color: "#a00" }}>Danger Zone</h3>

      {!confirming ? (
        <button
          style={{
            background: "#a00",
            color: "white",
            padding: "6px 10px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={() => setConfirming(true)}
        >
          Delete ALL Saved Data
        </button>
      ) : (
        <div>
          <p style={{ fontWeight: "bold", color: "#a00" }}>
            Warning: This will permanently erase ALL templates, units,
            scenarios, terrain, and abilities.
          </p>
          <p>
            Type <strong>DELETE</strong> to confirm:
          </p>

          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type DELETE"
            style={{ width: "100%", marginBottom: 10 }}
          />

          <button
            onClick={handleReset}
            style={{
              background: "#d00",
              color: "white",
              padding: "6px 10px",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              marginRight: 10,
            }}
          >
            Confirm Delete
          </button>

          <button onClick={() => setConfirming(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
