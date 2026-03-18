"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

type MoodImage = {
  id: string;
  url: string;
  source: string;
  title: string | null;
};

type CompetitorAd = {
  id: string;
  brand: string;
  type: "image" | "video";
  platform: string;
  hook: string;
  description: string;
  angle: string;
};

const COMPETITOR_ADS: CompetitorAd[] = [
  { id: "1", brand: "Brand A", type: "video", platform: "Meta", hook: "Why 50,000 people switched to us this month", description: "UGC-style talking head, 15s. Person explains switching from competitor in casual tone. Product demo in second half.", angle: "Social proof + FOMO" },
  { id: "2", brand: "Brand B", type: "image", platform: "Meta", hook: "The only one that actually works (we have receipts)", description: "Carousel showing before/after results with customer names and dates. Each slide adds credibility.", angle: "Proof-based trust" },
  { id: "3", brand: "Brand C", type: "video", platform: "TikTok", hook: "POV: You just discovered the thing everyone's been hiding", description: "Trending audio. Fast cuts. Phone-filmed unboxing with dramatic reveal. Comment section seeding visible.", angle: "Trend + discovery" },
  { id: "4", brand: "Brand A", type: "image", platform: "Google", hook: "Free shipping on orders over £30 — today only", description: "Simple static banner. Clean product image, offer prominent, single CTA. High CTR on search intent.", angle: "Offer + urgency" },
  { id: "5", brand: "Brand D", type: "video", platform: "Meta", hook: "I spent £200 on competitors. This £25 product beat them all.", description: "Founder-style direct to camera. Honest comparison narrative. Not polished. Feels like advice from a friend.", angle: "Competitor contrast" },
  { id: "6", brand: "Brand B", type: "image", platform: "Instagram", hook: "As seen in Vogue, Glamour + The Sunday Times", description: "Press logos stacked on clean background. Single product image. Authority play targeting mid-funnel browsers.", angle: "Press authority" },
  { id: "7", brand: "Brand C", type: "video", platform: "TikTok", hook: "Rating every product I tried so you don't have to", description: "Review format. Competitor products get average scores. Brand's product saves the day at the end. Playful.", angle: "Comparison + entertainment" },
  { id: "8", brand: "Brand E", type: "image", platform: "Meta", hook: "Join 200,000+ who already made the switch", description: "Social proof counter front and centre. Diverse testimonial grid. Community feel. Aspirational not pushy.", angle: "Community + belonging" },
];

const PLATFORM_COLORS: Record<string, string> = {
  Meta: "#3b82f6",
  TikTok: "#ec4899",
  Google: "#f59e0b",
  Instagram: "#a855f7",
};

export default function InspirationClient({
  initialImages,
  userId,
}: {
  initialImages: MoodImage[];
  userId: string;
}) {
  const [tab, setTab] = useState<"moodboard" | "competitor">("moodboard");
  const [images, setImages] = useState<MoodImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [showPinterest, setShowPinterest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from("moodboard")
        .upload(path, file, { contentType: file.type });

      if (storageError || !storageData) continue;

      const { data: { publicUrl } } = supabase.storage.from("moodboard").getPublicUrl(storageData.path);

      const res = await fetch("/api/ads/moodboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: publicUrl, source: "upload", title: file.name }),
      });

      if (res.ok) {
        const saved = await res.json() as MoodImage;
        setImages((prev) => [saved, ...prev]);
      }
    }
    setUploading(false);
  }, [userId]);

  const handleDelete = useCallback(async (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    await fetch(`/api/ads/moodboard/${id}`, { method: "DELETE" });
  }, []);

  const handlePinterestAdd = useCallback((added: MoodImage[]) => {
    setImages((prev) => [...added, ...prev]);
  }, []);

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div>
          <h1 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>Inspiration</h1>
          <div
            className="flex rounded-xl overflow-hidden w-fit"
            style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}
          >
            {(["moodboard", "competitor"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="text-xs font-semibold px-4 py-2 transition-all"
                style={{
                  background: tab === t ? "var(--accent)" : "transparent",
                  color: tab === t ? "white" : "var(--text-secondary)",
                }}
              >
                {t === "competitor" ? "Competitor Ads" : "Moodboard"}
              </button>
            ))}
          </div>
        </div>

        {/* Moodboard actions */}
        {tab === "moodboard" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPinterest(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.64 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.565 0-2.386-1.715-4.052-4.163-4.052-2.837 0-4.501 2.127-4.501 4.328 0 .857.33 1.776.741 2.279a.3.3 0 0 1 .069.286c-.076.315-.244.995-.277 1.134-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
              Import from Pinterest
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
              style={{
                background: uploading ? "var(--surface-2)" : "var(--accent)",
                color: uploading ? "var(--text-secondary)" : "white",
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              )}
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "moodboard" ? (
          images.length === 0 ? (
            <EmptyMoodboard
              onPinterest={() => setShowPinterest(true)}
              onUpload={() => fileInputRef.current?.click()}
            />
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 max-w-6xl">
              {images.map((img) => (
                <ImageTile key={img.id} image={img} onDelete={handleDelete} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4 max-w-2xl">
            {COMPETITOR_ADS.map((ad) => (
              <CompetitorAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>

      {/* Pinterest modal */}
      {showPinterest && (
        <PinterestModal
          onClose={() => setShowPinterest(false)}
          onAdd={handlePinterestAdd}
        />
      )}
    </div>
  );
}

function ImageTile({ image, onDelete }: { image: MoodImage; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="break-inside-avoid mb-3 rounded-xl overflow-hidden relative group"
      style={{ border: "1px solid var(--border)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.title ?? ""}
        className="w-full h-auto block"
        style={{ display: "block" }}
      />
      {hovered && (
        <button
          onClick={() => onDelete(image.id)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(0,0,0,0.7)", color: "white" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
      {image.source === "pinterest" && (
        <div className="absolute bottom-2 left-2">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
          >
            Pinterest
          </span>
        </div>
      )}
    </div>
  );
}

function EmptyMoodboard({ onPinterest, onUpload }: { onPinterest: () => void; onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Your moodboard is empty</p>
      <p className="text-xs mb-6 max-w-xs" style={{ color: "var(--text-secondary)" }}>
        Import images from a Pinterest board or upload your own.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onPinterest}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#e60023" strokeWidth="0">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.64 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.565 0-2.386-1.715-4.052-4.163-4.052-2.837 0-4.501 2.127-4.501 4.328 0 .857.33 1.776.741 2.279a.3.3 0 0 1 .069.286c-.076.315-.244.995-.277 1.134-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
          </svg>
          Import from Pinterest
        </button>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl"
          style={{ background: "var(--accent)", color: "white" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          Upload Images
        </button>
      </div>
    </div>
  );
}

function PinterestModal({ onClose, onAdd }: { onClose: () => void; onAdd: (imgs: MoodImage[]) => void }) {
  const [boardUrl, setBoardUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState<Array<{ url: string; title: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBoard = async () => {
    setError("");
    setFetched([]);
    setSelected(new Set());
    if (!boardUrl.trim()) { setError("Enter a Pinterest board URL"); return; }
    setLoading(true);
    const res = await fetch(`/api/ads/pinterest?url=${encodeURIComponent(boardUrl.trim())}`);
    const data = await res.json() as { images?: Array<{ url: string; title: string }>; error?: string };
    if (!res.ok) { setError(data.error ?? "Failed to fetch board"); setLoading(false); return; }
    setFetched(data.images ?? []);
    // Select all by default
    setSelected(new Set(data.images?.map((i) => i.url) ?? []));
    setLoading(false);
  };

  const toggleSelect = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  };

  const handleAdd = async () => {
    setSaving(true);
    const toAdd = fetched.filter((img) => selected.has(img.url));
    const saved: MoodImage[] = [];
    for (const img of toAdd) {
      const res = await fetch("/api/ads/moodboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: img.url, source: "pinterest", title: img.title }),
      });
      if (res.ok) saved.push(await res.json() as MoodImage);
    }
    onAdd(saved);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <div
        className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: "min(680px, 95vw)",
          maxHeight: "85vh",
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#e60023" strokeWidth="0">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.64 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.565 0-2.386-1.715-4.052-4.163-4.052-2.837 0-4.501 2.127-4.501 4.328 0 .857.33 1.776.741 2.279a.3.3 0 0 1 .069.286c-.076.315-.244.995-.277 1.134-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
            </svg>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Import from Pinterest</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* URL input */}
        <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
            Paste a public Pinterest board URL (e.g. pinterest.com/username/boardname/)
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={boardUrl}
              onChange={(e) => setBoardUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchBoard()}
              placeholder="https://pinterest.com/username/board-name/"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              onClick={fetchBoard}
              disabled={loading}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 flex-shrink-0"
              style={{ background: loading ? "var(--surface-2)" : "var(--accent)", color: loading ? "var(--text-secondary)" : "white" }}
            >
              {loading ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : "Fetch"}
            </button>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: "#f87171" }}>{error}</p>}
        </div>

        {/* Image grid */}
        {fetched.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {fetched.length} pins found — {selected.size} selected
                </p>
                <button
                  className="text-xs font-medium"
                  style={{ color: "var(--accent-light)" }}
                  onClick={() => setSelected(selected.size === fetched.length ? new Set() : new Set(fetched.map(i => i.url)))}
                >
                  {selected.size === fetched.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {fetched.map((img) => (
                  <button
                    key={img.url}
                    onClick={() => toggleSelect(img.url)}
                    className="relative rounded-xl overflow-hidden aspect-square"
                    style={{
                      outline: selected.has(img.url) ? "2px solid var(--accent)" : "2px solid transparent",
                      outlineOffset: 2,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    {selected.has(img.url) && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-end gap-2 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={onClose}
                className="text-xs font-medium px-4 py-2 rounded-lg"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={selected.size === 0 || saving}
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{
                  background: selected.size === 0 || saving ? "var(--surface-2)" : "var(--accent)",
                  color: selected.size === 0 || saving ? "var(--text-secondary)" : "white",
                }}
              >
                {saving ? "Saving…" : `Add ${selected.size} to Moodboard`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CompetitorAdCard({ ad }: { ad: CompetitorAd }) {
  const platformColor = PLATFORM_COLORS[ad.platform] ?? "#a1a1aa";
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
            {ad.brand.replace("Brand ", "")}
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{ad.brand}</p>
            <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{ad.angle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${platformColor}18`, color: platformColor }}>{ad.platform}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: ad.type === "video" ? "rgba(236,72,153,0.12)" : "rgba(59,130,246,0.12)", color: ad.type === "video" ? "#ec4899" : "#3b82f6" }}>{ad.type}</span>
        </div>
      </div>
      <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>Hook</p>
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>&ldquo;{ad.hook}&rdquo;</p>
      </div>
      <div className="px-5 py-3">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ad.description}</p>
      </div>
    </div>
  );
}
