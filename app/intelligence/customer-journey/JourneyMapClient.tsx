"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import NodeDetailPanel from "./NodeDetailPanel";
import CEPView from "./CEPView";

type JourneyNode = {
  id: string;
  title: string;
  position: number;
  explanation: string;
  tactics: string[];
  category?: string;
};

type JourneyMap = {
  id: string;
  url: string;
  description: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  website: "#3b82f6",
  email:   "#f59e0b",
  ads:     "#ec4899",
  organic: "#22c55e",
  other:   "#a1a1aa",
};

function JourneyNodeComponent({ data }: NodeProps) {
  const d = data as { title: string; category: string; onDelete: () => void; onClick: () => void };
  const catColor = CATEGORY_COLORS[d.category] ?? "#7c3aed";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={d.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--surface)",
        border: `1px solid ${hovered ? catColor : "var(--border)"}`,
        borderRadius: 12,
        padding: "10px 14px",
        minWidth: 160,
        maxWidth: 200,
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.15s",
        boxShadow: hovered ? `0 0 16px ${catColor}33` : "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: catColor, border: "none", width: 8, height: 8 }} />

      {/* Delete button */}
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); d.onDelete(); }}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#ef4444",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: "bold",
            zIndex: 10,
          }}
        >
          ×
        </button>
      )}

      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: catColor,
          marginBottom: 4,
        }}
      >
        {d.category}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
        {d.title}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: catColor, border: "none", width: 8, height: 8 }} />
    </div>
  );
}

const nodeTypes = { journeyNode: JourneyNodeComponent };

function buildFlowNodes(
  journeyNodes: JourneyNode[],
  onNodeClick: (n: JourneyNode) => void,
  onNodeDelete: (id: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const sorted = [...journeyNodes].sort((a, b) => a.position - b.position);
  const NODE_WIDTH = 210;
  const NODE_HEIGHT = 80;
  const GAP = 60;

  const nodes: Node[] = sorted.map((n, i) => ({
    id: n.id,
    type: "journeyNode",
    position: { x: i * (NODE_WIDTH + GAP), y: 0 },
    data: {
      title: n.title,
      category: n.category ?? "awareness",
      onClick: () => onNodeClick(n),
      onDelete: () => onNodeDelete(n.id),
    },
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  }));

  const edges: Edge[] = sorted.slice(0, -1).map((n, i) => ({
    id: `e-${n.id}-${sorted[i + 1].id}`,
    source: n.id,
    target: sorted[i + 1].id,
    animated: true,
    style: { stroke: "var(--border)", strokeWidth: 2 },
  }));

  return { nodes, edges };
}

export default function JourneyMapClient({
  map,
  initialNodes,
  initialCeps = [],
  initialDecisions = [],
}: {
  map: JourneyMap;
  initialNodes: JourneyNode[];
  initialCeps?: unknown[];
  initialDecisions?: unknown[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"journey" | "cep">("journey");
  const [journeyNodes, setJourneyNodes] = useState<JourneyNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stageDescription, setStageDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMapLoading, setDeleteMapLoading] = useState(false);

  const handleNodeDelete = useCallback(async (nodeId: string) => {
    await fetch(`/api/intelligence/journey/nodes/${nodeId}`, { method: "DELETE" });
    setJourneyNodes((prev) => prev.filter((n) => n.id !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  }, [selectedNode]);

  const handleNodeClick = useCallback((node: JourneyNode) => {
    setSelectedNode(node);
  }, []);

  const { nodes: flowNodes, edges: flowEdges } = buildFlowNodes(journeyNodes, handleNodeClick, handleNodeDelete);
  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edges, , onEdgesChange] = useEdgesState(flowEdges);

  const handleAddNode = async () => {
    setAddError("");
    if (stageDescription.length < 5) { setAddError("Please describe the stage (5+ characters)"); return; }
    setAddLoading(true);
    const res = await fetch("/api/intelligence/journey/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_description: stageDescription }),
    });
    const data = await res.json();
    if (!res.ok) { setAddError(data.error ?? "Failed to add node"); setAddLoading(false); return; }
    setJourneyNodes((prev) => [...prev, data]);
    setStageDescription("");
    setShowAddModal(false);
    setAddLoading(false);
  };

  const handleDeleteMap = async () => {
    setDeleteMapLoading(true);
    await fetch("/api/intelligence/journey", { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)", background: "var(--background)" }}>

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Customer Journey Map
            </h1>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {journeyNodes.length} stages
            </span>
          </div>
          <p className="text-xs truncate max-w-sm" style={{ color: "var(--text-secondary)" }}>
            {map.url}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}
          >
            {(["journey", "cep"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="text-xs font-semibold px-3 py-1.5 transition-all"
                style={{
                  background: view === v ? "var(--accent)" : "transparent",
                  color: view === v ? "white" : "var(--text-secondary)",
                }}
              >
                {v === "journey" ? "Journey Map" : "CEP View"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            style={{ background: "var(--accent)", color: "white", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Stage
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            Delete Map
          </button>
        </div>
      </div>

      {/* CEP View */}
      {view === "cep" && (
        <CEPView
          ceps={initialCeps as Parameters<typeof CEPView>[0]["ceps"]}
          decisions={initialDecisions as Parameters<typeof CEPView>[0]["decisions"]}
          nodes={journeyNodes}
        />
      )}

      {/* Canvas */}
      {view === "journey" && <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          style={{ background: "var(--background)" }}
        >
          <Background color="var(--border)" gap={24} size={1} />
          <Controls style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
          <MiniMap
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
            nodeColor={(n) => CATEGORY_COLORS[(n.data as { category: string }).category] ?? "#7c3aed"}
          />
        </ReactFlow>
      </div>}

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {/* Add node modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowAddModal(false)} />
          <div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>Add a Stage</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Describe the stage you want to add and AI will generate it.</p>
            <textarea
              rows={3}
              value={stageDescription}
              onChange={(e) => setStageDescription(e.target.value)}
              placeholder="e.g. Email nurture sequence after first purchase…"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none mb-3"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            {addError && (
              <p className="text-xs mb-3" style={{ color: "#f87171" }}>{addError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-medium px-3 py-2 rounded-lg"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddNode}
                disabled={addLoading}
                className="text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
                style={{
                  background: addLoading ? "var(--surface-2)" : "var(--accent)",
                  color: addLoading ? "var(--text-secondary)" : "white",
                  cursor: addLoading ? "not-allowed" : "pointer",
                }}
              >
                {addLoading ? (
                  <>
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Generating…
                  </>
                ) : "Generate Stage"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete map confirm */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowDeleteConfirm(false)} />
          <div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>Delete journey map?</h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>This will permanently delete your map and all {journeyNodes.length} stages. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs font-medium px-3 py-2 rounded-lg"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMap}
                disabled={deleteMapLoading}
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{ background: "#ef4444", color: "white", cursor: deleteMapLoading ? "not-allowed" : "pointer" }}
              >
                {deleteMapLoading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
