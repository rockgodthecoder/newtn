"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type MoodImage = { id: string; url: string; source: string; title: string | null };
type Competitor = { id: string; url: string };

type WebPage = { url: string; title: string; description: string; text: string };
type IgPost = { id: string; image_url: string; is_video: boolean; caption: string; likes: number; comments: number };
type IgProfile = { username: string; full_name: string; bio: string; avatar: string; posts: IgPost[] };
type FbAd = { page_name?: string; ad_creative_bodies?: string[]; ad_creative_link_titles?: string[]; ad_snapshot_url?: string; impressions?: { lower_bound: string } };
type BrandAssets = { domain: string; logo: string; images: string[]; fonts: string[]; colors: string[]; languages: string[] };

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InspirationClient({
  initialImages,
  userId,
  competitors,
  hasFacebookToken,
  ownBrandUrl,
}: {
  initialImages: MoodImage[];
  userId: string;
  competitors: Competitor[];
  hasFacebookToken: boolean;
  ownBrandUrl: string | null;
}) {
  const [tab, setTab] = useState<"brand" | "moodboard" | "competitor">("brand");
  const [compTab, setCompTab] = useState<"website" | "socials" | "ads">("website");
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [showPinterest, setShowPinterest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    const supabase = createClient();
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: sd, error: se } = await supabase.storage.from("moodboard").upload(path, file, { contentType: file.type });
      if (se || !sd) continue;
      const { data: { publicUrl } } = supabase.storage.from("moodboard").getPublicUrl(sd.path);
      const res = await fetch("/api/ads/moodboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: publicUrl, source: "upload", title: file.name }),
      });
      if (res.ok) { const img = await res.json() as MoodImage; setImages((p) => [img, ...p]); }
    }
    setUploading(false);
  }, [userId]);

  const handleDelete = useCallback(async (id: string) => {
    setImages((p) => p.filter((i) => i.id !== id));
    await fetch(`/api/ads/moodboard/${id}`, { method: "DELETE" });
  }, []);

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div>
          <h1 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>Inspiration</h1>
          <TabBar
            tabs={[{ key: "brand", label: "Brand" }, { key: "moodboard", label: "Moodboard" }, { key: "competitor", label: "Competitor" }]}
            active={tab}
            onChange={(v) => setTab(v as typeof tab)}
          />
        </div>
        {tab === "moodboard" && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPinterest(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
              <PinterestIcon /> Import from Pinterest
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: uploading ? "var(--surface-2)" : "var(--accent)", color: uploading ? "var(--text-secondary)" : "white", cursor: uploading ? "not-allowed" : "pointer" }}>
              {uploading ? <Spinner /> : <UploadIcon />}
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "brand" ? (
          <BrandTab ownBrandUrl={ownBrandUrl} />
        ) : tab === "moodboard" ? (
          <div className="p-6">
            {images.length === 0 ? (
              <EmptyMoodboard onPinterest={() => setShowPinterest(true)} onUpload={() => fileInputRef.current?.click()} />
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 max-w-6xl">
                {images.map((img) => <ImageTile key={img.id} image={img} onDelete={handleDelete} />)}
              </div>
            )}
          </div>
        ) : (
          <CompetitorSection
            compTab={compTab}
            setCompTab={setCompTab}
            competitors={competitors}
            hasFacebookToken={hasFacebookToken}
          />
        )}
      </div>

      {showPinterest && (
        <PinterestModal
          onClose={() => setShowPinterest(false)}
          onAdd={(added) => setImages((p) => [...added, ...p])}
        />
      )}
    </div>
  );
}

// ─── Brand Tab ────────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  en: "English", fr: "French", de: "German", es: "Spanish", it: "Italian",
  nl: "Dutch", pt: "Portuguese", sv: "Swedish", da: "Danish", nb: "Norwegian",
  fi: "Finnish", pl: "Polish", cs: "Czech", ro: "Romanian", hu: "Hungarian",
  ar: "Arabic", zh: "Chinese", ja: "Japanese", ko: "Korean",
};

function BrandTab({ ownBrandUrl }: { ownBrandUrl: string | null }) {
  const [assets, setAssets] = useState<BrandAssets | "loading" | "error" | null>(null);

  const analyse = async () => {
    if (!ownBrandUrl) return;
    setAssets("loading");
    const res = await fetch(`/api/ads/brand-assets?url=${encodeURIComponent(ownBrandUrl)}`);
    if (!res.ok) { setAssets("error"); return; }
    setAssets(await res.json() as BrandAssets);
  };

  if (!ownBrandUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No brand set up yet</p>
        <p className="text-xs mb-5" style={{ color: "var(--text-secondary)" }}>Add your brand URL in the Brain to unlock visual analysis.</p>
        <a href="/intelligence" className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--accent)", color: "white" }}>Go to Brain</a>
      </div>
    );
  }

  const domain = extractDomain(ownBrandUrl);

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`} alt="" width={20} height={20} className="rounded-sm" />
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{domain}</span>
        </div>
        {assets !== "loading" && (
          <button onClick={analyse} className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--accent)", color: "white" }}>
            {assets ? "Re-analyse" : "Analyse Brand"}
          </button>
        )}
        {assets === "loading" && <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}><Spinner />Analysing…</div>}
      </div>

      {!assets && (
        <div className="rounded-2xl p-8 flex flex-col items-center text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Extract brand assets</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Pull logo, colours, typography, images and language info directly from your website.</p>
        </div>
      )}

      {assets === "error" && (
        <p className="text-sm" style={{ color: "#f87171" }}>Could not reach this website. Check the URL in your Brain.</p>
      )}

      {assets && assets !== "loading" && assets !== "error" && (
        <div className="space-y-6">
          {/* Logo + Colours + Typography row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Logo */}
            <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>Logo</p>
              {assets.logo ? (
                <div className="flex items-center justify-center h-24 rounded-xl" style={{ background: "var(--surface-2)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assets.logo} alt="Brand logo" className="max-h-16 max-w-full object-contain" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 rounded-xl" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Not found</p>
                </div>
              )}
            </div>

            {/* Colours */}
            <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>Colours</p>
              {assets.colors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assets.colors.map((hex) => (
                    <div key={hex} className="flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-xl shadow-sm" style={{ background: hex, border: "1px solid rgba(255,255,255,0.08)" }} title={hex} />
                      <span className="text-[9px] font-mono" style={{ color: "var(--text-secondary)" }}>{hex}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>No brand colours detected in inline styles.</p>
              )}
            </div>

            {/* Typography + Language */}
            <div className="rounded-2xl p-5 space-y-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>Typography</p>
                {assets.fonts.length > 0 ? (
                  <div className="space-y-2">
                    {assets.fonts.map((font) => (
                      <div key={font}>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: `"${font}", sans-serif` }}>{font}</p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: `"${font}", sans-serif` }}>Aa Bb Cc 123</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>No Google Fonts detected.</p>
                )}
              </div>
              {assets.languages.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {assets.languages.map((lang) => (
                      <span key={lang} className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}>
                        {LANG_NAMES[lang] ?? lang.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          {assets.images.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>Images from site</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {assets.images.slice(0, 18).map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden" style={{ background: "var(--surface-2)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Competitor Section ───────────────────────────────────────────────────────

function CompetitorSection({ compTab, setCompTab, competitors, hasFacebookToken }: {
  compTab: "website" | "socials" | "ads";
  setCompTab: (t: "website" | "socials" | "ads") => void;
  competitors: Competitor[];
  hasFacebookToken: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4 pb-0 flex-shrink-0">
        <TabBar
          tabs={[{ key: "website", label: "Website" }, { key: "socials", label: "Socials" }, { key: "ads", label: "Ads" }]}
          active={compTab}
          onChange={(v) => setCompTab(v as typeof compTab)}
          small
        />
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {compTab === "website" && <WebsiteTab competitors={competitors} />}
        {compTab === "socials" && <SocialsTab competitors={competitors} />}
        {compTab === "ads" && <AdsTab competitors={competitors} hasFacebookToken={hasFacebookToken} />}
      </div>
    </div>
  );
}

// ─── Website Tab ──────────────────────────────────────────────────────────────

function WebsiteTab({ competitors }: { competitors: Competitor[] }) {
  const [results, setResults] = useState<Record<string, WebPage[] | "loading" | "error">>({});

  const scrape = async (url: string) => {
    setResults((p) => ({ ...p, [url]: "loading" }));
    const res = await fetch(`/api/ads/competitor-website?url=${encodeURIComponent(url)}`);
    if (!res.ok) { setResults((p) => ({ ...p, [url]: "error" })); return; }
    const data = await res.json() as { pages: WebPage[] };
    setResults((p) => ({ ...p, [url]: data.pages }));
  };

  if (competitors.length === 0) return <NoBrain />;

  return (
    <div className="space-y-6 max-w-3xl">
      {competitors.map((comp) => {
        const state = results[comp.url];
        const domain = extractDomain(comp.url);
        return (
          <div key={comp.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`} alt="" width={18} height={18} className="rounded-sm" />
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{domain}</p>
              </div>
              {!state && (
                <button onClick={() => scrape(comp.url)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--accent)", color: "white" }}>
                  Scrape website
                </button>
              )}
              {state === "loading" && <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}><Spinner />Scraping…</div>}
            </div>
            {state === "error" && <p className="px-5 py-4 text-sm" style={{ color: "#f87171" }}>Could not reach this website.</p>}
            {Array.isArray(state) && (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {state.map((page) => (
                  <div key={page.url} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{page.title || page.url}</p>
                      <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-[10px] flex-shrink-0" style={{ color: "var(--accent-light)" }}>Open ↗</a>
                    </div>
                    {page.description && <p className="text-xs mb-2 font-medium" style={{ color: "var(--accent-light)" }}>{page.description}</p>}
                    <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "var(--text-secondary)" }}>{page.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Socials Tab ─────────────────────────────────────────────────────────────

function SocialsTab({ competitors }: { competitors: Competitor[] }) {
  const [handles, setHandles] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    competitors.forEach((c) => { init[c.id] = guessHandle(c.url); });
    return init;
  });
  const [profiles, setProfiles] = useState<Record<string, IgProfile | "loading" | "error" | string>>({});

  const fetchProfile = async (compId: string) => {
    const handle = handles[compId]?.trim().replace(/^@/, "");
    if (!handle) return;
    setProfiles((p) => ({ ...p, [compId]: "loading" }));
    const res = await fetch(`/api/ads/instagram?username=${encodeURIComponent(handle)}`);
    const data = await res.json();
    if (!res.ok) { setProfiles((p) => ({ ...p, [compId]: data.error ?? "error" })); return; }
    setProfiles((p) => ({ ...p, [compId]: data as IgProfile }));
  };

  if (competitors.length === 0) return <NoBrain />;

  return (
    <div className="space-y-6 max-w-3xl">
      {competitors.map((comp) => {
        const state = profiles[comp.id];
        const domain = extractDomain(comp.url);
        return (
          <div key={comp.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {/* Handle input */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`} alt="" width={18} height={18} className="rounded-sm flex-shrink-0" />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>@</span>
                <input
                  value={handles[comp.id] ?? ""}
                  onChange={(e) => setHandles((p) => ({ ...p, [comp.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && fetchProfile(comp.id)}
                  placeholder="instagram_handle"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              {state !== "loading" && (
                <button onClick={() => fetchProfile(comp.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: "var(--accent)", color: "white" }}>
                  {typeof state === "object" ? "Refresh" : "Fetch"}
                </button>
              )}
              {state === "loading" && <div className="flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: "var(--text-secondary)" }}><Spinner />Loading…</div>}
            </div>

            {/* Error */}
            {typeof state === "string" && state !== "loading" && (
              <p className="px-5 py-4 text-sm" style={{ color: "#f87171" }}>{state}</p>
            )}

            {/* Posts grid */}
            {typeof state === "object" && state !== null && "posts" in state && (
              <>
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{state.full_name || `@${state.username}`}</p>
                  {state.bio && <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{state.bio}</p>}
                </div>
                <div className="grid grid-cols-3 gap-1 p-1">
                  {state.posts.map((post) => (
                    <div key={post.id} className="relative aspect-square overflow-hidden rounded-lg group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                      {post.is_video && (
                        <div className="absolute top-1.5 right-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.55)" }}>
                        <span className="text-xs font-bold text-white">♥ {fmtNum(post.likes)}</span>
                        <span className="text-xs font-bold text-white">💬 {fmtNum(post.comments)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {state.posts.length === 0 && (
                  <p className="px-5 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>No posts found.</p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Ads Tab ──────────────────────────────────────────────────────────────────

function AdsTab({ competitors, hasFacebookToken }: { competitors: Competitor[]; hasFacebookToken: boolean }) {
  const [queries, setQueries] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    competitors.forEach((c) => { init[c.id] = extractDomain(c.url).split(".")[0]; });
    return init;
  });
  const [results, setResults] = useState<Record<string, FbAd[] | "loading" | "error">>({});

  const search = async (compId: string) => {
    const q = queries[compId]?.trim();
    if (!q) return;
    setResults((p) => ({ ...p, [compId]: "loading" }));
    const res = await fetch(`/api/ads/facebook-ads?query=${encodeURIComponent(q)}`);
    const data = await res.json() as { ads?: FbAd[]; error?: string };
    if (!res.ok || data.error) { setResults((p) => ({ ...p, [compId]: "error" })); return; }
    setResults((p) => ({ ...p, [compId]: data.ads ?? [] }));
  };

  if (!hasFacebookToken) {
    return (
      <div className="max-w-lg">
        <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </div>
          <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>Connect Meta Ad Library</h3>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Add a Facebook Graph API token to search the public Meta Ad Library for competitor ads.
          </p>
          <ol className="space-y-2 text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            <li>1. Go to <span style={{ color: "var(--accent-light)" }}>developers.facebook.com</span> → create an app (type: Business)</li>
            <li>2. Add the <strong style={{ color: "var(--text-primary)" }}>Ads Library API</strong> product</li>
            <li>3. Generate a User Access Token with <code style={{ color: "var(--accent-light)" }}>ads_read</code> permission</li>
            <li>4. Add to Vercel env vars: <code style={{ color: "var(--accent-light)" }}>FACEBOOK_ACCESS_TOKEN=your_token</code></li>
          </ol>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>The Ad Library API is free — no spend required.</p>
        </div>
      </div>
    );
  }

  if (competitors.length === 0) return <NoBrain />;

  return (
    <div className="space-y-6 max-w-3xl">
      {competitors.map((comp) => {
        const state = results[comp.id];
        const domain = extractDomain(comp.url);
        return (
          <div key={comp.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`} alt="" width={18} height={18} className="rounded-sm flex-shrink-0" />
              <input
                value={queries[comp.id] ?? ""}
                onChange={(e) => setQueries((p) => ({ ...p, [comp.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && search(comp.id)}
                placeholder="Search brand name…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
              {state !== "loading" && (
                <button onClick={() => search(comp.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: "var(--accent)", color: "white" }}>
                  {Array.isArray(state) ? "Refresh" : "Search"}
                </button>
              )}
              {state === "loading" && <div className="flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: "var(--text-secondary)" }}><Spinner />Searching…</div>}
            </div>

            {state === "error" && <p className="px-5 py-4 text-sm" style={{ color: "#f87171" }}>Search failed — check your Facebook token.</p>}

            {Array.isArray(state) && state.length === 0 && (
              <p className="px-5 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>No active ads found for this brand.</p>
            )}

            {Array.isArray(state) && state.length > 0 && (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {state.map((ad, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{ad.page_name ?? "Unknown page"}</p>
                      {ad.ad_snapshot_url && (
                        <a href={ad.ad_snapshot_url} target="_blank" rel="noopener noreferrer" className="text-[10px]" style={{ color: "var(--accent-light)" }}>View ad ↗</a>
                      )}
                    </div>
                    {ad.ad_creative_link_titles?.[0] && (
                      <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>{ad.ad_creative_link_titles[0]}</p>
                    )}
                    {ad.ad_creative_bodies?.[0] && (
                      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>{ad.ad_creative_bodies[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Moodboard components ─────────────────────────────────────────────────────

function ImageTile({ image, onDelete }: { image: MoodImage; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="break-inside-avoid mb-3 rounded-xl overflow-hidden relative" style={{ border: "1px solid var(--border)" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={image.title ?? ""} className="w-full h-auto block" />
      {hovered && (
        <button onClick={() => onDelete(image.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
      {image.source === "pinterest" && (
        <div className="absolute bottom-2 left-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>Pinterest</span></div>
      )}
    </div>
  );
}

function EmptyMoodboard({ onPinterest, onUpload }: { onPinterest: () => void; onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Your moodboard is empty</p>
      <p className="text-xs mb-6" style={{ color: "var(--text-secondary)" }}>Import from Pinterest or upload your own images.</p>
      <div className="flex gap-3">
        <button onClick={onPinterest} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
          <PinterestIcon /> Import from Pinterest
        </button>
        <button onClick={onUpload} className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl" style={{ background: "var(--accent)", color: "white" }}>
          <UploadIcon /> Upload Images
        </button>
      </div>
    </div>
  );
}

function NoBrain() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No competitors added</p>
      <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>Add competitor URLs in your Brand Brain to unlock this section.</p>
      <a href="/intelligence" className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--accent)", color: "white" }}>Go to Brain</a>
    </div>
  );
}

// ─── Pinterest Modal ──────────────────────────────────────────────────────────

function PinterestModal({ onClose, onAdd }: { onClose: () => void; onAdd: (imgs: MoodImage[]) => void }) {
  const [boardUrl, setBoardUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState<Array<{ url: string; title: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBoard = async () => {
    setError(""); setFetched([]); setSelected(new Set());
    if (!boardUrl.trim()) { setError("Enter a Pinterest board URL"); return; }
    setLoading(true);
    const res = await fetch(`/api/ads/pinterest?url=${encodeURIComponent(boardUrl.trim())}`);
    const data = await res.json() as { images?: Array<{ url: string; title: string }>; error?: string };
    if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
    setFetched(data.images ?? []);
    setSelected(new Set(data.images?.map((i) => i.url) ?? []));
    setLoading(false);
  };

  const toggleSelect = (url: string) => setSelected((p) => { const n = new Set(p); n.has(url) ? n.delete(url) : n.add(url); return n; });

  const handleAdd = async () => {
    setSaving(true);
    const saved: MoodImage[] = [];
    for (const img of fetched.filter((i) => selected.has(i.url))) {
      const res = await fetch("/api/ads/moodboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: img.url, source: "pinterest", title: img.title }) });
      if (res.ok) saved.push(await res.json() as MoodImage);
    }
    onAdd(saved);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-2xl overflow-hidden" style={{ width: "min(680px, 95vw)", maxHeight: "85vh", background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2"><PinterestIcon /><h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Import from Pinterest</h3></div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
        <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>Paste a public Pinterest board URL</p>
          <div className="flex gap-2">
            <input type="url" value={boardUrl} onChange={(e) => setBoardUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchBoard()} placeholder="https://pinterest.com/username/board-name/" className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }} onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")} onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} />
            <button onClick={fetchBoard} disabled={loading} className="text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 flex-shrink-0" style={{ background: loading ? "var(--surface-2)" : "var(--accent)", color: loading ? "var(--text-secondary)" : "white" }}>
              {loading ? <Spinner /> : "Fetch"}
            </button>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: "#f87171" }}>{error}</p>}
        </div>
        {fetched.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{fetched.length} pins — {selected.size} selected</p>
                <button className="text-xs font-medium" style={{ color: "var(--accent-light)" }} onClick={() => setSelected(selected.size === fetched.length ? new Set() : new Set(fetched.map((i) => i.url)))}>
                  {selected.size === fetched.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {fetched.map((img) => (
                  <button key={img.url} onClick={() => toggleSelect(img.url)} className="relative rounded-xl overflow-hidden aspect-square" style={{ outline: selected.has(img.url) ? "2px solid var(--accent)" : "2px solid transparent", outlineOffset: 2 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    {selected.has(img.url) && <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg></div>}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={onClose} className="text-xs font-medium px-4 py-2 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={handleAdd} disabled={selected.size === 0 || saving} className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: selected.size === 0 || saving ? "var(--surface-2)" : "var(--accent)", color: selected.size === 0 || saving ? "var(--text-secondary)" : "white" }}>
                {saving ? "Saving…" : `Add ${selected.size} to Moodboard`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange, small }: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void; small?: boolean }) {
  return (
    <div className="flex rounded-xl overflow-hidden w-fit" style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} className={`font-semibold transition-all ${small ? "text-[11px] px-3 py-1.5" : "text-xs px-4 py-2"}`} style={{ background: active === t.key ? "var(--accent)" : "transparent", color: active === t.key ? "white" : "var(--text-secondary)" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Spinner() {
  return <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}

function PinterestIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="#e60023" strokeWidth="0"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.64 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.565 0-2.386-1.715-4.052-4.163-4.052-2.837 0-4.501 2.127-4.501 4.328 0 .857.33 1.776.741 2.279a.3.3 0 0 1 .069.286c-.076.315-.244.995-.277 1.134-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>;
}

function UploadIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

function guessHandle(url: string): string {
  return extractDomain(url).split(".")[0];
}

function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
