"use client";

import { useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BrainFile = { id: string; brand_id: string; type: string; file_name: string };
type Brand = { id: string; role: string; position: number; name: string | null; url: string | null };

const DATA_SOURCES = [
  { key: "website", label: "Website", icon: "🌐", accept: ".csv,.txt,.html,.json", hint: "Export as CSV or paste text" },
  { key: "reviews", label: "Reviews", icon: "⭐", accept: ".csv", hint: "CSV from Trustpilot, Google, etc." },
  { key: "facebook_ads", label: "Facebook Ads", icon: "📢", accept: ".csv,.json", hint: "Ads Library export CSV" },
] as const;

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BrainUploadClient({
  brainId,
  initialBrands,
  initialFiles,
}: {
  brainId: string;
  initialBrands: Brand[];
  initialFiles: BrainFile[];
}) {
  const ownBrand = initialBrands.find((b) => b.role === "own");
  const comp1 = initialBrands.find((b) => b.role === "competitor" && b.position === 1);
  const comp2 = initialBrands.find((b) => b.role === "competitor" && b.position === 2);

  if (!ownBrand || !comp1 || !comp2) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "var(--background)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Setting up your brain… refresh in a moment.</p>
      </div>
    );
  }

  const [files, setFiles] = useState<BrainFile[]>(initialFiles);

  const addFile = (f: BrainFile) => setFiles((p) => [...p, f]);
  const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));

  const filesFor = (brandId: string, type: string) =>
    files.filter((f) => f.brand_id === brandId && f.type === type);

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Brand Brain</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Upload data for your brand and competitors</p>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl">
          <BrandColumn
            brand={ownBrand}
            brainId={brainId}
            label="Your Brand"
            isOwn
            filesFor={(type) => filesFor(ownBrand.id, type)}
            onAdd={addFile}
            onRemove={removeFile}
          />
          <BrandColumn
            brand={comp1}
            brainId={brainId}
            label="Competitor 1"
            filesFor={(type) => filesFor(comp1.id, type)}
            onAdd={addFile}
            onRemove={removeFile}
          />
          <BrandColumn
            brand={comp2}
            brainId={brainId}
            label="Competitor 2"
            filesFor={(type) => filesFor(comp2.id, type)}
            onAdd={addFile}
            onRemove={removeFile}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Brand Column ─────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

function BrandColumn({
  brand,
  brainId,
  label,
  isOwn = false,
  filesFor,
  onAdd,
  onRemove,
}: {
  brand: Brand;
  brainId: string;
  label: string;
  isOwn?: boolean;
  filesFor: (type: string) => BrainFile[];
  onAdd: (f: BrainFile) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState(brand.name ?? "");
  const [url, setUrl] = useState(brand.url ?? "");
  const [saving, setSaving] = useState(false);

  const saveField = async (field: "name" | "url", value: string) => {
    setSaving(true);
    await fetch(`/api/intelligence/brain/brands/${brand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
  };

  const displayLabel = isOwn
    ? (url ? extractDomain(url) : "Your Brand")
    : null;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Column header */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>{label}</p>
        {isOwn ? (
          <div className="flex items-center gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={(e) => saveField("url", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              placeholder="yourbrand.com"
              className="flex-1 bg-transparent text-sm font-semibold outline-none"
              style={{ color: url ? "var(--text-primary)" : "var(--text-secondary)" }}
            />
            {saving && <Spinner />}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => saveField("name", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              placeholder="Competitor name…"
              className="flex-1 bg-transparent text-sm font-semibold outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            {saving && <Spinner />}
          </div>
        )}
        {displayLabel && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{displayLabel}</p>}
      </div>

      {/* Upload sections */}
      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {DATA_SOURCES.map((src) => (
          <UploadSection
            key={src.key}
            brainId={brainId}
            brandId={brand.id}
            source={src}
            files={filesFor(src.key)}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Upload Section ───────────────────────────────────────────────────────────

function UploadSection({
  brainId,
  brandId,
  source,
  files,
  onAdd,
  onRemove,
}: {
  brainId: string;
  brandId: string;
  source: typeof DATA_SOURCES[number];
  files: BrainFile[];
  onAdd: (f: BrainFile) => void;
  onRemove: (id: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("brainId", brainId);
    form.append("brandId", brandId);
    form.append("type", source.key);
    const res = await fetch("/api/intelligence/brain/files", { method: "POST", body: form });
    if (res.ok) onAdd(await res.json() as BrainFile);
    setUploading(false);
  };

  const remove = async (id: string) => {
    setDeleting(id);
    await fetch("/api/intelligence/brain/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onRemove(id);
    setDeleting(null);
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{source.icon}</span>
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{source.label}</span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
          style={{ background: uploading ? "var(--surface-2)" : "var(--accent)", color: uploading ? "var(--text-secondary)" : "white" }}
        >
          {uploading ? <><Spinner /> Uploading…</> : "+ Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={source.accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>

      {files.length === 0 && (
        <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{source.hint}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 group" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center gap-1.5 min-w-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{f.file_name}</span>
              </div>
              <button
                onClick={() => remove(f.id)}
                disabled={deleting === f.id}
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 text-[10px] font-bold"
                style={{ background: "#ef4444", color: "white" }}
              >{deleting === f.id ? "…" : "×"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function Spinner() {
  return <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
