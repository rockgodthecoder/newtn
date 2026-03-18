"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Tactic = {
  id: string;
  text: string;
  channel: string;
  node_title: string;
  swipe_status: string;
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

export default function SwipeClient({ initialTactics }: { initialTactics: Tactic[] }) {
  const [tactics, setTactics]       = useState<Tactic[]>(initialTactics);
  const [filter, setFilter]         = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  const filtered = filter === "all" ? tactics : tactics.filter((t) => t.channel === filter);
  const current  = filtered[currentIndex] ?? null;
  const remaining = filtered.length - currentIndex;

  const swipe = useCallback(async (id: string, status: "approved" | "dismissed") => {
    // Optimistic
    setTactics((prev) => prev.map((t) => t.id === id ? { ...t, swipe_status: status } : t));
    setCurrentIndex((i) => i + 1);
    await fetch(`/api/intelligence/tactics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swipe_status: status }),
    });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!current) return;
      if (e.key === "ArrowRight") swipe(current.id, "approved");
      if (e.key === "ArrowLeft")  swipe(current.id, "dismissed");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current, swipe]);

  // Reset index when filter changes
  const handleFilter = (f: string) => {
    setFilter(f);
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Review Tactics</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              → approve · ← dismiss · or use arrow keys
            </p>
          </div>
          <Link
            href="/intelligence/todo"
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            View To-Do →
          </Link>
        </div>

        {/* Channel filter */}
        <div className="flex gap-1.5 flex-wrap">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => handleFilter(ch)}
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

      {/* Swipe area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {current ? (
          <>
            {/* Progress */}
            <p className="text-xs mb-6" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>{remaining}</span> remaining
            </p>

            {/* Card */}
            <div
              className="w-full max-w-md rounded-2xl p-8 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
            >
              {/* Channel badge */}
              <div className="flex justify-center mb-4">
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{
                    background: `${CHANNEL_COLORS[current.channel] ?? "#a1a1aa"}22`,
                    color: CHANNEL_COLORS[current.channel] ?? "#a1a1aa",
                  }}
                >
                  {current.channel}
                </span>
              </div>

              {/* Node label */}
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                {current.node_title}
              </p>

              {/* Tactic text */}
              <p className="text-base font-semibold leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {current.text}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-6 mt-8">
              <button
                onClick={() => swipe(current.id, "dismissed")}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "2px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
              >
                ✕
              </button>
              <button
                onClick={() => swipe(current.id, "approved")}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "2px solid rgba(34,197,94,0.3)",
                  color: "#4ade80",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.1)")}
              >
                ✓
              </button>
            </div>

            <p className="text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
              ← dismiss &nbsp;·&nbsp; approve →
            </p>
          </>
        ) : (
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--border)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              {filter === "all" ? "All done!" : `All ${filter} tactics reviewed!`}
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Check your To-Do list for approved tactics.
            </p>
            <Link
              href="/intelligence/todo"
              className="text-sm font-semibold px-4 py-2 rounded-lg inline-block"
              style={{ background: "var(--accent)", color: "white" }}
            >
              View To-Do →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
