"use client";

import { useState } from "react";

type CEP = {
  id: string;
  title: string;
  description: string;
  connected_node_ids: string[];
  position: number;
};

type Decision = {
  id: string;
  question: string;
  answer_approach: string;
  position: number;
};

type JourneyNode = {
  id: string;
  title: string;
  category?: string;
};

const CHANNEL_COLORS: Record<string, string> = {
  website: "#3b82f6",
  email:   "#f59e0b",
  ads:     "#ec4899",
  organic: "#22c55e",
  other:   "#a1a1aa",
};

export default function CEPView({
  ceps,
  decisions,
  nodes,
}: {
  ceps: CEP[];
  decisions: Decision[];
  nodes: JourneyNode[];
}) {
  const [selectedCep, setSelectedCep] = useState<CEP | null>(null);

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: "var(--background)" }}>

      {/* CEPs Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Category Entry Points
          </h2>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--accent)", color: "white" }}
          >
            {ceps.length}
          </span>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            — Situations that bring customers into your category
          </p>
        </div>

        {ceps.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            No CEPs found. Rebuild your journey map to generate them.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ceps.map((cep) => (
              <button
                key={cep.id}
                onClick={() => setSelectedCep(cep)}
                className="text-left rounded-xl p-4 transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid var(--accent)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  {cep.title}
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                  {cep.description}
                </p>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--accent-glow)", color: "var(--accent-light)" }}
                >
                  {cep.connected_node_ids.length} touchpoints →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Decision Mechanisms Section */}
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Decision Mechanisms
          </h2>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "#f59e0b33", color: "#f59e0b" }}
          >
            {decisions.length}
          </span>
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--text-secondary)" }}>
          Trust questions customers ask before buying
        </p>

        {decisions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            No decision mechanisms found. Rebuild your journey map to generate them.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {decisions.map((d) => (
              <div
                key={d.id}
                className="rounded-xl p-4"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid #f59e0b",
                }}
              >
                <p className="text-sm font-semibold mb-2 leading-snug" style={{ color: "var(--text-primary)" }}>
                  &ldquo;{d.question}&rdquo;
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {d.answer_approach}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CEP Detail Drawer */}
      {selectedCep && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setSelectedCep(null)}
          />
          <div
            className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{
              width: "min(400px, 100vw)",
              background: "var(--surface)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex items-start justify-between p-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex-1 pr-4">
                <div
                  className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider"
                  style={{ background: "var(--accent-glow)", color: "var(--accent-light)" }}
                >
                  Category Entry Point
                </div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {selectedCep.title}
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {selectedCep.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedCep(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
                Journey touchpoints that address this
              </p>
              {selectedCep.connected_node_ids.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No connected stages found.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedCep.connected_node_ids.map((nodeId) => {
                    const node = nodeById[nodeId];
                    if (!node) return null;
                    const color = CHANNEL_COLORS[node.category ?? "other"] ?? "#a1a1aa";
                    return (
                      <div
                        key={nodeId}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {node.title}
                        </span>
                        <span
                          className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
                          style={{ background: `${color}22`, color }}
                        >
                          {node.category ?? "other"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                These are the stages in your journey that address this entry point.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
