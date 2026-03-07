import { useState, useEffect, useRef } from "react";

const TICK_MS = 1000; // ms between auto-run steps

export default function SimulationControls({ round, onStep, onReset }) {
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Start/stop the auto-run loop
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(onStep, TICK_MS);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, onStep]);

  function handleReset() {
    setRunning(false);
    onReset();
  }

  return (
    <div className="sim-controls">
      {/* Round counter */}
      <div className="sim-round">
        <span className="sim-round-label">ROUND</span>
        <span className="sim-round-number">{round}</span>
      </div>

      {/* Controls */}
      <div className="sim-buttons">
        {/* Step button — disabled while auto-running */}
        <button
          className="sim-btn sim-btn-step"
          onClick={onStep}
          disabled={running}
          title="Advance one round"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
          Step
        </button>

        {/* Play / Pause toggle */}
        <button
          className={`sim-btn sim-btn-play ${running ? "sim-btn-pause" : ""}`}
          onClick={() => setRunning((r) => !r)}
          title={running ? "Pause simulation" : "Auto-run simulation"}
        >
          {running ? (
            // Pause icon
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="4" width="4" height="16" rx="1" />
              <rect x="15" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
          {running ? "Pause" : "Auto-Run"}
        </button>

        {/* Reset */}
        <button
          className="sim-btn sim-btn-reset"
          onClick={handleReset}
          title="Reset battle"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
          </svg>
          Reset
        </button>
      </div>

      {/* Speed indicator when running */}
      {running && (
        <div className="sim-running-indicator">
          <span className="sim-pulse" />
          Simulating…
        </div>
      )}

      <style>{`
        .sim-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 10px 16px;
          background: #1a1a2e;
          border-bottom: 2px solid #2a2a4a;
          font-family: 'Courier New', monospace;
          flex-wrap: wrap;
        }

        .sim-round {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 56px;
          background: #0f0f1e;
          border: 1px solid #3a3a6a;
          border-radius: 6px;
          padding: 4px 12px;
        }

        .sim-round-label {
          font-size: 9px;
          letter-spacing: 2px;
          color: #6060a0;
          text-transform: uppercase;
        }

        .sim-round-number {
          font-size: 22px;
          font-weight: 700;
          color: #c8b8ff;
          line-height: 1.1;
        }

        .sim-buttons {
          display: flex;
          gap: 8px;
        }

        .sim-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border: none;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
          letter-spacing: 0.5px;
        }

        .sim-btn svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }

        .sim-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none;
        }

        .sim-btn:not(:disabled):active {
          transform: scale(0.96);
        }

        .sim-btn-step {
          background: #2a2a4a;
          color: #a0a0d0;
        }
        .sim-btn-step:not(:disabled):hover {
          background: #3a3a6a;
          color: #c8c8ff;
        }

        .sim-btn-play {
          background: #1e4d2b;
          color: #5ddb7a;
          border: 1px solid #2d7a40;
          min-width: 110px;
          justify-content: center;
        }
        .sim-btn-play:not(:disabled):hover {
          background: #265e34;
        }

        .sim-btn-pause {
          background: #4d3a00;
          color: #f0b429;
          border: 1px solid #8a6200;
        }
        .sim-btn-pause:hover {
          background: #5e4a00 !important;
        }

        .sim-btn-reset {
          background: #2a1a1a;
          color: #c06060;
          border: 1px solid #5a2a2a;
        }
        .sim-btn-reset:not(:disabled):hover {
          background: #3a2020;
          color: #e08080;
        }

        .sim-running-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #5ddb7a;
          letter-spacing: 1px;
        }

        .sim-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #5ddb7a;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
}
