"use client";

import { useState } from "react";

type MoodboardItem = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  accent: string;
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

const MOODBOARD: MoodboardItem[] = [
  { id: "1", title: "Soft luxury editorial", category: "Visual Style", tags: ["beige", "minimal", "editorial"], description: "Clean whites and warm neutrals. Negative space heavy. Product treated as art object on pedestal.", accent: "#f59e0b" },
  { id: "2", title: "Bold typographic statement", category: "Typography", tags: ["oversized", "high contrast", "B&W"], description: "Single word dominates the entire frame. Black on white. No imagery — the type IS the visual.", accent: "#a1a1aa" },
  { id: "3", title: "Raw UGC authenticity", category: "Visual Style", tags: ["phone-filmed", "lo-fi", "vertical"], description: "Handheld, slightly shaky. Natural indoor lighting. Real home environment visible. Trust through imperfection.", accent: "#22c55e" },
  { id: "4", title: "Flat lay product story", category: "Layout", tags: ["overhead", "props", "lifestyle"], description: "Overhead product surrounded by relevant lifestyle objects. Each item contributes context. Tight colour palette.", accent: "#3b82f6" },
  { id: "5", title: "Dark moody premium", category: "Visual Style", tags: ["dark", "luxury", "shadow"], description: "Deep blacks and rich midtones. Product lit from single source. Shadow play adds depth and desire.", accent: "#7c3aed" },
  { id: "6", title: "Pastel Gen-Z palette", category: "Colour", tags: ["pastel", "playful", "Gen-Z"], description: "Soft lavender, mint, and blush. Rounded fonts, imperfect layouts. Designed to stop the scroll of under-35s.", accent: "#ec4899" },
  { id: "7", title: "Split-screen comparison", category: "Layout", tags: ["before/after", "split", "proof"], description: "Frame divided cleanly in two. Left: the problem. Right: the solution. No words needed. Visual proof.", accent: "#f59e0b" },
  { id: "8", title: "Countdown urgency", category: "CTA Design", tags: ["urgency", "timer", "red"], description: "Timer ticking down dominates top third. Stock number below. Single bold CTA. Warm red tones signal urgency.", accent: "#ef4444" },
  { id: "9", title: "White space minimalism", category: "Layout", tags: ["minimal", "white space", "premium"], description: "70% white space. Product in centre, tiny. One line of copy. Signals confidence and premium positioning.", accent: "#a78bfa" },
  { id: "10", title: "Text-on-face overlay", category: "Typography", tags: ["portrait", "overlay", "bold"], description: "Large bold text overlaid directly on a person's face. Creates intrigue and stops the scroll instantly.", accent: "#ec4899" },
  { id: "11", title: "Process / behind the scenes", category: "Visual Style", tags: ["BTS", "trust", "craft"], description: "Hands at work. Ingredients. Manufacturing close-ups. Story of care and craft. Builds trust through transparency.", accent: "#22c55e" },
  { id: "12", title: "Green credentials proof", category: "Trust Signals", tags: ["eco", "certifications", "clean"], description: "Certifications and badges front and centre. Ingredient list legible and proud. Earthy tones reinforce values.", accent: "#22c55e" },
];

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

export default function InspirationClient() {
  const [tab, setTab] = useState<"moodboard" | "competitor">("moodboard");

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <h1 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>Inspiration</h1>

        {/* Tabs */}
        <div
          className="flex rounded-xl overflow-hidden w-fit"
          style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}
        >
          {(["moodboard", "competitor"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-xs font-semibold px-4 py-2 capitalize transition-all"
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "moodboard" ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 max-w-5xl">
            {MOODBOARD.map((item) => (
              <MoodCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-2xl">
            {COMPETITOR_ADS.map((ad) => (
              <CompetitorAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MoodCard({ item }: { item: MoodboardItem }) {
  return (
    <div
      className="break-inside-avoid mb-4 rounded-2xl p-4 transition-all"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = item.accent;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${item.accent}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Visual placeholder */}
      <div
        className="rounded-xl mb-3 flex items-center justify-center"
        style={{
          height: 80 + (parseInt(item.id) % 3) * 24,
          background: `${item.accent}12`,
          border: `1px solid ${item.accent}30`,
        }}
      >
        <div className="w-8 h-8 rounded-xl" style={{ background: `${item.accent}30` }} />
      </div>

      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide"
          style={{ background: `${item.accent}18`, color: item.accent }}
        >
          {item.category}
        </span>
      </div>

      <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{item.description}</p>

      <div className="flex flex-wrap gap-1">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function CompetitorAdCard({ ad }: { ad: CompetitorAd }) {
  const platformColor = PLATFORM_COLORS[ad.platform] ?? "#a1a1aa";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Card header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            {ad.brand.replace("Brand ", "")}
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{ad.brand}</p>
            <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{ad.angle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${platformColor}18`, color: platformColor }}
          >
            {ad.platform}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
            style={{
              background: ad.type === "video" ? "rgba(236,72,153,0.12)" : "rgba(59,130,246,0.12)",
              color: ad.type === "video" ? "#ec4899" : "#3b82f6",
            }}
          >
            {ad.type}
          </span>
        </div>
      </div>

      {/* Hook */}
      <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>Hook</p>
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
          &ldquo;{ad.hook}&rdquo;
        </p>
      </div>

      {/* Description */}
      <div className="px-5 py-3">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ad.description}</p>
      </div>
    </div>
  );
}
