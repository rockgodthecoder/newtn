"use client";

import { useEffect } from "react";

type Node = {
  id: string;
  title: string;
  position: number;
  explanation: string;
  tactics: string[];
  category?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  awareness:     "#3b82f6",
  consideration: "#f59e0b",
  conversion:    "#22c55e",
  retention:     "#8b5cf6",
  advocacy:      "#ec4899",
};

export default function NodeDetailPanel({ node, onClose }: { node: Node; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const catColor = CATEGORY_COLORS[node.category ?? ""] ?? "var(--accent-light)";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
        style={{
          width: "min(400px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex-1 pr-4">
            <div
              className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider"
              style={{ background: `${catColor}22`, color: catColor }}
            >
              {node.category ?? "stage"}
            </div>
            <h2 className="text-lg font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
              {node.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* Explanation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
              What&apos;s happening here
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {node.explanation}
            </p>
          </div>

          {/* Tactics */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
              What you need to do
            </p>
            <ul className="flex flex-col gap-2.5">
              {(node.tactics ?? []).map((tactic, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: catColor }}
                  />
                  <span style={{ color: "var(--text-secondary)" }}>{tactic}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </>
  );
}
