// src/components/BattleLog.jsx
import { useEffect, useRef } from "react";

const ACTION_STYLES = {
  attack: { icon: "⚔️", color: "#e0a030" },
  ability: { icon: "✨", color: "#a060e0" },
  kill: { icon: "💀", color: "#e05050" },
  miss: { icon: "💨", color: "#606080" },
  move: { icon: "👣", color: "#4090c0" },
  heal: { icon: "💚", color: "#40c070" },
  wait: { icon: "⏸", color: "#505060" },
};

const TEAM_COLORS = {
  A: "#5db8ff",
  B: "#ff7070",
};

export default function BattleLog({ log }) {
  const bottomRef = useRef(null);

  // Auto-scroll to latest entry
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Group entries by round
  const byRound = [];
  for (const entry of log) {
    const last = byRound[byRound.length - 1];
    if (!last || last.round !== entry.round) {
      byRound.push({ round: entry.round, entries: [entry] });
    } else {
      last.entries.push(entry);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>⚔ Battle Log</span>
        <span style={styles.headerCount}>{log.length} events</span>
      </div>

      <div style={styles.scroll}>
        {byRound.length === 0 && (
          <div style={styles.empty}>No activity yet. Start the simulation.</div>
        )}

        {byRound.map(({ round, entries }) => (
          <div key={round}>
            <div style={styles.roundBanner}>— Round {round} —</div>
            {entries.map((entry, i) => {
              const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.wait;
              return (
                <div key={i} style={styles.entry}>
                  <span style={styles.icon}>{style.icon}</span>
                  <span
                    style={{
                      ...styles.unitName,
                      color: TEAM_COLORS[entry.team] ?? "#ccc",
                    }}
                  >
                    [{entry.team}] {entry.unitName}
                  </span>
                  <span style={{ ...styles.detail, color: style.color }}>
                    {entry.detail}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    background: "#0d0d1a",
    border: "1px solid #2a2a4a",
    borderRadius: 8,
    fontFamily: "'Courier New', monospace",
    fontSize: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 12px",
    background: "#1a1a2e",
    borderBottom: "1px solid #2a2a4a",
  },
  headerTitle: {
    color: "#c8b8ff",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1,
  },
  headerCount: {
    color: "#606080",
    fontSize: 11,
  },
  scroll: {
    overflowY: "auto",
    maxHeight: 280,
    padding: "6px 0",
  },
  roundBanner: {
    textAlign: "center",
    color: "#404060",
    fontSize: 11,
    letterSpacing: 2,
    padding: "6px 0 2px",
    borderTop: "1px solid #1a1a30",
    marginTop: 4,
  },
  entry: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    padding: "2px 12px",
    lineHeight: 1.5,
  },
  icon: {
    fontSize: 11,
    flexShrink: 0,
    width: 18,
  },
  unitName: {
    fontWeight: 700,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  detail: {
    opacity: 0.9,
  },
  empty: {
    color: "#404060",
    textAlign: "center",
    padding: "20px 12px",
    fontStyle: "italic",
  },
};
