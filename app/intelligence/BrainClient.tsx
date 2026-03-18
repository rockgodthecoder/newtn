"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CEP = { title: string; description: string };
type TriggerPoint = { title: string; description: string };

type Brand = {
  id: string;
  url: string;
  role: "own" | "competitor";
  position: number;
  summary: string | null;
  ceps: CEP[];
  trigger_points: TriggerPoint[];
  status: string;
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getRoleColor(role: string) {
  return role === "own" ? "#7c3aed" : "#3b82f6";
}

function getRoleLabel(role: string) {
  return role === "own" ? "Your Brand" : "Competitor";
}

// Favicon via Google service (no key needed)
function FaviconImg({ url }: { url: string }) {
  const domain = extractDomain(url);
  return (
    <img
      src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`}
      alt=""
      width={20}
      height={20}
      className="rounded-sm flex-shrink-0"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}

function DetailPanel({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  const roleColor = getRoleColor(brand.role);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          width: "min(480px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <FaviconImg url={brand.url} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {extractDomain(brand.url)}
                </p>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${roleColor}22`, color: roleColor }}
                >
                  {getRoleLabel(brand.role)}
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {brand.url}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* Summary */}
          <div>
            <SectionHeader icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
            } title="Brand Summary" />
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {brand.summary ?? "Analysis pending…"}
            </p>
          </div>

          {/* CEPs */}
          {brand.ceps.length > 0 && (
            <div>
              <SectionHeader icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
              } title="Category Entry Points" />
              <div className="space-y-2.5">
                {brand.ceps.map((cep, i) => (
                  <InsightCard key={i} title={cep.title} description={cep.description} color="#7c3aed" />
                ))}
              </div>
            </div>
          )}

          {/* Trigger Points */}
          {brand.trigger_points.length > 0 && (
            <div>
              <SectionHeader icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              } title="Trigger Points" />
              <div className="space-y-2.5">
                {brand.trigger_points.map((tp, i) => (
                  <InsightCard key={i} title={tp.title} description={tp.description} color="#f59e0b" />
                ))}
              </div>
            </div>
          )}

          {/* Data sources */}
          <div>
            <SectionHeader icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>
              </svg>
            } title="Data Sources" />
            <div className="space-y-2">
              <DataSourceRow label="Website" status="active" />
              <DataSourceRow label="Reviews" status="soon" />
              <DataSourceRow label="Facebook Ads" status="soon" />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color: "var(--text-secondary)" }}>{icon}</span>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
    </div>
  );
}

function InsightCard({ title, description, color }: { title: string; description: string; color: string }) {
  return (
    <div
      className="rounded-xl p-3.5"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
      </div>
      <p className="text-[12px] leading-relaxed pl-3.5" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}

function DataSourceRow({ label, status }: { label: string; status: "active" | "soon" }) {
  return (
    <div
      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{label}</span>
      {status === "active" ? (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
        >
          Active
        </span>
      ) : (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          Coming soon
        </span>
      )}
    </div>
  );
}

export default function BrainClient({ initialBrands }: { initialBrands: Brand[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Brand | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const ownBrand = initialBrands.find((b) => b.role === "own");
  const competitors = initialBrands.filter((b) => b.role === "competitor");

  const handleDelete = async () => {
    setDeleteLoading(true);
    await fetch("/api/intelligence/brain", { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="min-h-full" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div
        className="px-6 py-5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(167,139,250,0.2))",
              border: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Brand Brain</h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {initialBrands.length} brand{initialBrands.length !== 1 ? "s" : ""} analysed — click to explore
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          Rebuild Brain
        </button>
      </div>

      {/* Brand grid */}
      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        {[...(ownBrand ? [ownBrand] : []), ...competitors].map((brand) => (
          <BrandCard key={brand.id} brand={brand} onClick={() => setSelected(brand)} />
        ))}
      </div>

      {/* Detail panel */}
      {selected && <DetailPanel brand={selected} onClose={() => setSelected(null)} />}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowDeleteConfirm(false)} />
          <div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>Rebuild brain?</h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              This will delete all current brand analysis and let you start fresh.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs font-medium px-3 py-2 rounded-lg"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{ background: "#ef4444", color: "white" }}
              >
                {deleteLoading ? "Deleting…" : "Yes, rebuild"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BrandCard({ brand, onClick }: { brand: Brand; onClick: () => void }) {
  const roleColor = getRoleColor(brand.role);
  const domain = extractDomain(brand.url);

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-5 transition-all group"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = roleColor;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${roleColor}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <FaviconImg url={brand.url} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{domain}</p>
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${roleColor}22`, color: roleColor }}
        >
          {getRoleLabel(brand.role)}
        </span>
      </div>

      {/* Summary preview */}
      <p
        className="text-xs leading-relaxed mb-4 line-clamp-3"
        style={{ color: "var(--text-secondary)" }}
      >
        {brand.summary ?? "Analysis pending…"}
      </p>

      {/* Stats */}
      <div className="flex gap-3">
        <StatPill label="CEPs" count={brand.ceps.length} color="#7c3aed" />
        <StatPill label="Triggers" count={brand.trigger_points.length} color="#f59e0b" />
      </div>

      {/* View CTA */}
      <div
        className="mt-4 flex items-center gap-1.5 text-xs font-semibold transition-all"
        style={{ color: "var(--text-secondary)" }}
      >
        View insights
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </button>
  );
}

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
      style={{ background: `${color}15`, color }}
    >
      <span className="font-bold">{count}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
