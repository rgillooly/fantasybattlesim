// src/components/ScenarioControls.jsx
import { useState } from "react";

export default function ScenarioControls({
  scenarios,
  saveScenario,
  loadScenario,
  deleteScenario,
}) {
  const [scenarioName, setScenarioName] = useState("");

  return (
    <div style={{ border: "1px solid #aaa", padding: 10 }}>
      <h3>Scenarios</h3>

      <input
        type="text"
        placeholder="Scenario name"
        value={scenarioName}
        onChange={(e) => setScenarioName(e.target.value)}
      />

      <button
        onClick={() => {
          saveScenario(scenarioName);
          setScenarioName("");
        }}
      >
        Save Scenario
      </button>

      <h4>Saved Scenarios:</h4>

      {Object.keys(scenarios).length === 0 && (
        <div style={{ opacity: 0.6 }}>No scenarios saved.</div>
      )}

      {Object.keys(scenarios).map((name) => (
        <div
          key={name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
            alignItems: "center",
          }}
        >
          <span>{name}</span>

          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => loadScenario(name)}>Load</button>

            <button
              style={{
                background: "red",
                color: "white",
                border: "none",
                borderRadius: 3,
                padding: "2px 6px",
                cursor: "pointer",
              }}
              onClick={() => {
                if (confirm(`Delete scenario "${name}"?`)) {
                  deleteScenario(name);
                }
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
