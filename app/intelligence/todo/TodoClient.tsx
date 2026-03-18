"use client";

import { useState } from "react";

type Tactic = {
  id: string;
  text: string;
  channel: string;
  node_title: string;
  completed: boolean;
};

const CHANNELS = ["all", "website", "email", "ads", "organic", "other"] as const;

const CHANNEL_COLORS: Record<string, string> = {
  website: "#3b82f6",
  email:   "#f59e0b",
  ads:     "#ec4899",
  organic: "#22c55e",
  other:   "#a1a1aa",
};

export default function TodoClient({ initialTactics }: { initialTactics: Tactic[] }) {
  const [tactics, setTactics] = useState<Tactic[]>(initialTactics);
  const [filter, setFilter]   = useState<string>("all");

  const filtered = filter === "all" ? tactics : tactics.filter((t) => t.channel === filter);
  const incomplete = filtered.filter((t) => !t.completed);
  const complete   = filtered.filter((t) => t.completed);

  const toggle = async (id: string, completed: boolean) => {
    setTactics((prev) => prev.map((t) => t.id === id ? { ...t, completed } : t));
    await fetch(`/api/intelligence/tactics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  };

  const TacticItem = ({ tactic }: { tactic: Tactic }) => {
    const color = CHANNEL_COLORS[tactic.channel] ?? "#a1a1aa";
    return (
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all"
        style={{
          background: tactic.completed ? "transparent" : "var(--surface)",
          border: `1px solid ${tactic.completed ? "transparent" : "var(--border)"}`,
          opacity: tactic.completed ? 0.5 : 1,
        }}
      >
        <button
          onClick={() => toggle(tactic.id, !tactic.completed)}
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={{
            background: tactic.completed ? "#22c55e" : "var(--surface-2)",
            border: `1px solid ${tactic.completed ? "#22c55e" : "var(--border)"}`,
          }}
        >
          {tactic.completed && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm leading-snug"
            style={{
              color: tactic.completed ? "var(--text-secondary)" : "var(--text-primary)",
              textDecoration: tactic.completed ? "line-through" : "none",
            }}
          >
            {tactic.text}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
            {tactic.node_title}
          </p>
        </div>

        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: color }} />
      </div>
    );
  };

  return (
    <div className="min-h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>To-Do</h1>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--accent)", color: "white" }}
          >
            {incomplete.length} remaining
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
          Your approved tactics — check them off as you action them
        </p>

        {/* Channel filter */}
        <div className="flex gap-1.5 flex-wrap">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => setFilter(ch)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize transition-all"
              style={{
                background: filter === ch ? (ch === "all" ? "var(--accent)" : `${CHANNEL_COLORS[ch]}22`) : "var(--surface-2)",
                color: filter === ch ? (ch === "all" ? "white" : CHANNEL_COLORS[ch]) : "var(--text-secondary)",
                border: `1px solid ${filter === ch ? (ch === "all" ? "var(--accent)" : CHANNEL_COLORS[ch]) : "var(--border)"}`,
              }}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="p-6 max-w-2xl">
        {tactics.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No approved tactics yet</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Go to <a href="/intelligence/review" style={{ color: "var(--accent-light)" }}>Review Tactics</a> to approve some.
            </p>
          </div>
        ) : (
          <>
            {incomplete.length > 0 && (
              <div className="flex flex-col gap-2 mb-6">
                {incomplete.map((t) => <TacticItem key={t.id} tactic={t} />)}
              </div>
            )}

            {complete.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
                  Completed ({complete.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {complete.map((t) => <TacticItem key={t.id} tactic={t} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
