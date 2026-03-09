// src/BattleApp.jsx
import { useState, useMemo, useEffect } from "react";
import { generateGridTiles } from "./gridUtils";
import { simulateRound } from "./battleLogic";
import { createUnitTemplate } from "./data";

import Battlefield from "./components/Battlefield";
import UnitCreator from "./components/UnitCreator";
import UnitLibrary from "./components/UnitLibrary";
import SimulationControls from "./components/SimulationControls";
import AbilityLibrary from "./components/AbilityLibrary";
import UnitEditor from "./components/UnitEditor";
import ScenarioControls from "./components/ScenarioControls";
import ResetAllData from "./components/ResetAllData";
import BattleLog from "./components/BattleLog";

export default function BattleApp() {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);

  const tiles = useMemo(() => generateGridTiles(rows, cols), [rows, cols]);

  // ---------- LIBRARY STATE ----------
  const [templates, setTemplates] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("templates") || "[]");
    return saved.length > 0
      ? saved
      : [
          createUnitTemplate("warrior", "Warrior", {
            maxHp: 30,
            attack: 8,
            defense: 6,
            movement: 3,
            range: 1,
            initiative: 5,
          }),
        ];
  });

  const [abilities, setAbilities] = useState(() =>
    JSON.parse(localStorage.getItem("abilities") || "[]"),
  );

  // ---------- BATTLE STATE ----------
  const [battleState, setBattleState] = useState(() => {
    const savedUnits = JSON.parse(localStorage.getItem("units") || "[]");
    return { tiles, units: savedUnits, round: 1 };
  });

  // ---------- BATTLE LOG ----------
  // Accumulates entries across all rounds; cleared on reset.
  const [battleLog, setBattleLog] = useState([]);

  const [templateToEdit, setTemplateToEdit] = useState(null);
  const [terrainEditMode, setTerrainEditMode] = useState(false);

  const [scenarios, setScenarios] = useState(() =>
    JSON.parse(localStorage.getItem("scenarios") || "{}"),
  );

  // ---------- PERSIST ----------
  useEffect(() => {
    localStorage.setItem("templates", JSON.stringify(templates));
  }, [templates]);
  useEffect(() => {
    localStorage.setItem("abilities", JSON.stringify(abilities));
  }, [abilities]);
  useEffect(() => {
    localStorage.setItem("units", JSON.stringify(battleState.units));
  }, [battleState.units]);
  useEffect(() => {
    localStorage.setItem("scenarios", JSON.stringify(scenarios));
  }, [scenarios]);

  // ---------- SCENARIOS ----------
  function saveScenario(name) {
    if (!name) return;
    setScenarios({
      ...scenarios,
      [name]: { tiles: battleState.tiles, units: battleState.units },
    });
    alert(`Scenario "${name}" saved.`);
  }

  function loadScenario(name) {
    const sc = scenarios[name];
    if (!sc) return;
    setBattleState({ tiles: sc.tiles, units: sc.units, round: 1 });
    setBattleLog([]); // clear log when loading a new scenario
    alert(`Scenario "${name}" loaded.`);
  }

  function deleteScenario(name) {
    const updated = { ...scenarios };
    delete updated[name];
    setScenarios(updated);
    localStorage.setItem("scenarios", JSON.stringify(updated));
  }

  // ---------- ACTIONS ----------
  function addTemplate(template) {
    setTemplates([...templates, template]);
  }

  function updateUnits(units) {
    setBattleState({ ...battleState, units });
  }

  function handleStep() {
    setBattleState((prev) => {
      const next = simulateRound(prev, templates, abilities);
      // Accumulate this round's log entries
      if (next.roundLog?.length) {
        setBattleLog((log) => [...log, ...next.roundLog]);
      }
      return next;
    });
  }

  function handleReset() {
    localStorage.removeItem("units");
    setBattleState({ tiles, units: [], round: 1 });
    setBattleLog([]);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Fantasy Battle Simulator</h1>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* LEFT SIDE */}
        <div
          style={{
            width: 300,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <UnitCreator onCreate={addTemplate} />
          <UnitLibrary
            templates={templates}
            setTemplates={setTemplates}
            setTemplateToEdit={setTemplateToEdit}
          />
          {templateToEdit && (
            <UnitEditor
              template={templateToEdit}
              onSave={(updated) => {
                setTemplates(
                  templates.map((t) => (t.id === updated.id ? updated : t)),
                );
                setTemplateToEdit(null);
              }}
              onCancel={() => setTemplateToEdit(null)}
              abilities={abilities}
            />
          )}
          <AbilityLibrary
            abilities={abilities}
            setAbilities={setAbilities}
            templates={templates}
            setTemplates={setTemplates}
          />
          <SimulationControls
            round={battleState.round}
            onStep={handleStep}
            onReset={handleReset}
          />
          <ScenarioControls
            scenarios={scenarios}
            saveScenario={saveScenario}
            loadScenario={loadScenario}
            deleteScenario={deleteScenario}
          />
          <button
            onClick={() => setTerrainEditMode(!terrainEditMode)}
            style={{ marginBottom: 10 }}
          >
            {terrainEditMode ? "Exit Terrain Edit" : "Edit Terrain"}
          </button>
          <div style={{ border: "1px solid #aaa", padding: 10 }}>
            <h3>Map Settings</h3>
            <label>Rows</label>
            <input
              type="number"
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
            />
            <label>Columns</label>
            <input
              type="number"
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
            />
            <button onClick={handleReset}>Regenerate Map</button>
          </div>
          <ResetAllData />
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{ display: "flex", flexDirection: "column", flex: 1, gap: 0 }}
        >
          <Battlefield
            tiles={battleState.tiles}
            units={battleState.units}
            templates={templates}
            setUnits={updateUnits}
            terrainEditMode={terrainEditMode}
            setTiles={(newTiles) =>
              setBattleState({ ...battleState, tiles: newTiles })
            }
          />
          <BattleLog log={battleLog} />
        </div>
      </div>
    </div>
  );
}
