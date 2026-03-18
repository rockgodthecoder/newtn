"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BrainFile = { id: string; brand_id: string; type: string; file_name: string };
type Brand = { id: string; role: string; position: number; name: string | null; url: string | null };
type Review = { id: string; reviewer_name: string | null; country_code: string | null; published_date: string | null; title: string | null; body: string | null; rating: number | null; likes: number | null; is_verified: boolean };

const FILE_SOURCES = [
  { key: "website", label: "Website", icon: "🌐", accept: ".csv,.txt,.html,.json", hint: "Export as CSV or text" },
  { key: "facebook_ads", label: "Facebook Ads", icon: "📢", accept: ".csv,.json", hint: "Ads Library export CSV" },
] as const;

function extractDomain(url: string): string {
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BrainUploadClient({
  brainId,
  initialBrands,
  initialFiles,
  initialReviewCounts,
}: {
  brainId: string;
  initialBrands: Brand[];
  initialFiles: BrainFile[];
  initialReviewCounts: Record<string, number>;
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
  const [reviewCounts, setReviewCounts] = useState(initialReviewCounts);
  const [reviewsModal, setReviewsModal] = useState<{ brandId: string; name: string } | null>(null);

  const addFile = (f: BrainFile) => setFiles((p) => [...p, f]);
  const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));
  const filesFor = (brandId: string, type: string) => files.filter((f) => f.brand_id === brandId && f.type === type);

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>
      <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Brand Brain</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Upload data for your brand and competitors</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl">
          {[
            { brand: ownBrand, label: "Your Brand", isOwn: true },
            { brand: comp1, label: "Competitor 1", isOwn: false },
            { brand: comp2, label: "Competitor 2", isOwn: false },
          ].map(({ brand, label, isOwn }) => (
            <BrandColumn
              key={brand.id}
              brand={brand}
              brainId={brainId}
              label={label}
              isOwn={isOwn}
              filesFor={(type) => filesFor(brand.id, type)}
              reviewCount={reviewCounts[brand.id] ?? 0}
              onAdd={addFile}
              onRemove={removeFile}
              onReviewsDone={(count) => setReviewCounts((p) => ({ ...p, [brand.id]: count }))}
              onViewReviews={() => setReviewsModal({ brandId: brand.id, name: brand.name ?? label })}
            />
          ))}
        </div>
      </div>

      {reviewsModal && (
        <ReviewsModal
          brandId={reviewsModal.brandId}
          brandName={reviewsModal.name}
          onClose={() => setReviewsModal(null)}
        />
      )}
    </div>
  );
}

// ─── Brand Column ─────────────────────────────────────────────────────────────

function BrandColumn({
  brand, brainId, label, isOwn, filesFor, reviewCount, onAdd, onRemove, onReviewsDone, onViewReviews,
}: {
  brand: Brand; brainId: string; label: string; isOwn: boolean;
  filesFor: (type: string) => BrainFile[]; reviewCount: number;
  onAdd: (f: BrainFile) => void; onRemove: (id: string) => void;
  onReviewsDone: (count: number) => void; onViewReviews: () => void;
}) {
  const [url, setUrl] = useState(brand.url ?? "");
  const [name, setName] = useState(brand.name ?? "");
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

  const domain = url ? extractDomain(url) : null;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>{label}</p>
        {isOwn ? (
          <div className="flex items-center gap-2">
            <input value={url} onChange={(e) => setUrl(e.target.value)} onBlur={(e) => saveField("url", e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} placeholder="yourbrand.com" className="flex-1 bg-transparent text-sm font-semibold outline-none" style={{ color: url ? "var(--text-primary)" : "var(--text-secondary)" }} />
            {saving && <Spinner />}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} onBlur={(e) => saveField("name", e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} placeholder="Competitor name…" className="flex-1 bg-transparent text-sm font-semibold outline-none" style={{ color: "var(--text-primary)" }} />
            {saving && <Spinner />}
          </div>
        )}
        {domain && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{domain}</p>}
      </div>

      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {FILE_SOURCES.map((src) => (
          <UploadSection key={src.key} brainId={brainId} brandId={brand.id} source={src} files={filesFor(src.key)} onAdd={onAdd} onRemove={onRemove} />
        ))}
        <ReviewsSection
          brainId={brainId}
          brandId={brand.id}
          brandUrl={url}
          reviewCount={reviewCount}
          onDone={onReviewsDone}
          onView={onViewReviews}
        />
      </div>
    </div>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────

function ReviewsSection({ brainId, brandId, brandUrl, reviewCount, onDone, onView }: {
  brainId: string; brandId: string; brandUrl: string;
  reviewCount: number; onDone: (count: number) => void; onView: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "running" | "failed">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrape = async () => {
    const domain = brandUrl ? extractDomain(brandUrl) : null;
    if (!domain) { alert("Set a brand URL first"); return; }
    const trustpilotUrl = `https://www.trustpilot.com/review/${domain}`;

    setStatus("running");
    const res = await fetch("/api/intelligence/brain/reviews/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brainId, brandId, trustpilotUrl }),
    });
    if (!res.ok) { setStatus("failed"); return; }
    const { runId, datasetId } = await res.json() as { runId: string; datasetId: string };

    // Poll every 4s
    pollRef.current = setInterval(async () => {
      const poll = await fetch(`/api/intelligence/brain/reviews/scrape?runId=${runId}&datasetId=${datasetId}&brainId=${brainId}&brandId=${brandId}`);
      const result = await poll.json() as { status: string; count?: number };
      if (result.status === "done") {
        clearInterval(pollRef.current!);
        setStatus("idle");
        onDone(result.count ?? 0);
      } else if (result.status === "failed") {
        clearInterval(pollRef.current!);
        setStatus("failed");
      }
    }, 4000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">⭐</span>
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Reviews</span>
        </div>
        <div className="flex items-center gap-1.5">
          {reviewCount > 0 && (
            <button onClick={onView} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--accent-light)" }}>
              View {reviewCount}
            </button>
          )}
          <button onClick={scrape} disabled={status === "running"} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: status === "running" ? "var(--surface-2)" : "var(--accent)", color: status === "running" ? "var(--text-secondary)" : "white" }}>
            {status === "running" ? <><Spinner /> Scraping…</> : reviewCount > 0 ? "Re-scrape" : "Scrape"}
          </button>
        </div>
      </div>
      {status === "failed" && <p className="text-[11px]" style={{ color: "#f87171" }}>Scrape failed. Check the URL and try again.</p>}
      {status === "idle" && reviewCount === 0 && <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Pulls from Trustpilot via Apify</p>}
    </div>
  );
}

// ─── Upload Section ───────────────────────────────────────────────────────────

function UploadSection({ brainId, brandId, source, files, onAdd, onRemove }: {
  brainId: string; brandId: string; source: typeof FILE_SOURCES[number];
  files: BrainFile[]; onAdd: (f: BrainFile) => void; onRemove: (id: string) => void;
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
    await fetch("/api/intelligence/brain/files", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
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
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: uploading ? "var(--surface-2)" : "var(--accent)", color: uploading ? "var(--text-secondary)" : "white" }}>
          {uploading ? <><Spinner /> Uploading…</> : "+ Upload"}
        </button>
        <input ref={inputRef} type="file" accept={source.accept} className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      {files.length === 0 && <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{source.hint}</p>}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 group" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center gap-1.5 min-w-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{f.file_name}</span>
              </div>
              <button onClick={() => remove(f.id)} disabled={deleting === f.id} className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 text-[10px] font-bold" style={{ background: "#ef4444", color: "white" }}>
                {deleting === f.id ? "…" : "×"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reviews Modal ────────────────────────────────────────────────────────────

function ReviewsModal({ brandId, brandName, onClose }: { brandId: string; brandName: string; onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/intelligence/brain/reviews?brandId=${brandId}`)
      .then((r) => r.json())
      .then((d: { reviews: Review[] }) => { setReviews(d.reviews); setLoading(false); });
  }, [brandId]);

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden" style={{ width: "min(560px, 100vw)", background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Reviews — {brandName}</h2>
            {!loading && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{reviews.length} reviews</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16"><Spinner /></div>
          )}
          {!loading && reviews.length === 0 && (
            <p className="text-sm text-center py-16" style={{ color: "var(--text-secondary)" }}>No reviews yet.</p>
          )}
          {!loading && reviews.map((r) => (
            <div key={r.id} className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating ?? 0} />
                  {r.is_verified && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)" }}>Verified</span>}
                </div>
                <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                  {r.published_date ? new Date(r.published_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{r.reviewer_name ?? "Anonymous"}</p>
                {r.country_code && <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.country_code}</span>}
              </div>
              {r.title && <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{r.title}</p>}
              {r.body && <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= rating ? "#22c55e" : "var(--surface-2)"} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function Spinner() {
  return <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
