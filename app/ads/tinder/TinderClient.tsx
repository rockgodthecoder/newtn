"use client";

import { useState, useEffect, useCallback } from "react";

type AdType = "image" | "video";

type Ad = {
  id: string;
  idea: string;
  type: AdType;
  hook: string;
  copy: string;
  creative: string;
};

const ADS: Ad[] = [
  {
    id: "1",
    idea: "Morning Ritual Hook",
    type: "video",
    hook: "You've been doing your morning routine wrong for years.",
    copy: "Most people reach for their phone first thing. We reach for something that actually changes your day. The ritual that sets the tone — try it free for 14 days.",
    creative: "Close-up slow-motion of hands wrapping a warm mug at golden hour. No text for first 3s. Product reveal at 4s on clean white background. Soft ambient music.",
  },
  {
    id: "2",
    idea: "Before / After Social Proof",
    type: "image",
    hook: "3 months. Same person. Completely different results.",
    copy: "Sarah wasn't sure it would work. Now she won't stop telling her friends. Real results, real people — no filters, no exceptions.",
    creative: "Split image: left slightly desaturated 'before', right vibrant 'after'. Same pose, same person. Verified badge in corner. No filter disclaimer below.",
  },
  {
    id: "3",
    idea: "Competitor Comparison",
    type: "image",
    hook: "Why pay more for less?",
    copy: "We did the research so you don't have to. Same quality, half the price. The only difference? We don't spend millions on celebrity endorsements.",
    creative: "Clean comparison table. Brand column highlighted in accent color. Competitor columns greyed. Checkmarks on key differentiators. Minimal white background.",
  },
  {
    id: "4",
    idea: "Founder Story",
    type: "video",
    hook: "I built this because I was sick of being lied to.",
    copy: "Four years ago I couldn't find a product that did what it claimed. So I made one. This is the brand I wish existed when I needed it most.",
    creative: "Founder speaking direct to camera, casual home office. Raw, unpolished. B-roll cuts to manufacturing. Authentic feel — no teleprompter, no studio lighting.",
  },
  {
    id: "5",
    idea: "FOMO Urgency",
    type: "image",
    hook: "47 people are looking at this right now.",
    copy: "Our bestseller sells out every restock within 48 hours. We just got 200 units back in. You know what to do.",
    creative: "Product hero shot with live stock counter overlay. Warm urgency tones. CTA button prominent at bottom. Timer if applicable.",
  },
  {
    id: "6",
    idea: "UGC Testimonial",
    type: "video",
    hook: "I was today years old when I discovered this.",
    copy: "Okay I wasn't going to post about this but I genuinely can't stop using it. My friends keep asking what changed. It's this.",
    creative: "Vertical format, filmed on phone. Person talking casually to camera. Messy authentic background. Product shown naturally, not staged. Brand watermark end card only.",
  },
  {
    id: "7",
    idea: "Problem Agitation",
    type: "image",
    hook: "Still wasting money on things that don't work?",
    copy: "The average person tries 4 solutions before finding one that works. We're the last one you'll need.",
    creative: "Text-heavy graphic, bold typography. Dark background, white text. Problem statement oversized. Solution revealed smaller below. Zero imagery needed.",
  },
  {
    id: "8",
    idea: "Press Authority",
    type: "image",
    hook: "\"The best we've tested in 2024\" — The Times",
    copy: "When independent reviewers put us against every competitor and we came out on top, we weren't surprised. Our customers already knew.",
    creative: "Editorial layout. Publication logos prominent. Pull-quote typography. Product image centered. Trust-building hierarchy from top to bottom.",
  },
  {
    id: "9",
    idea: "Limited Edition Drop",
    type: "video",
    hook: "Once it's gone, it's gone. Forever.",
    copy: "We made 500 of these. Not 500,000. Five hundred. Each numbered. When they're sold we retire the design. This isn't restocking — this is history.",
    creative: "Dark, moody product showcase. Each unit shown with numbered tag. Countdown from 500. Luxury aesthetic, slow reveal. Music-driven pacing, no voiceover.",
  },
  {
    id: "10",
    idea: "Value Stack Reveal",
    type: "image",
    hook: "Everything you get for less than your daily coffee.",
    copy: "People pay £80 for a gym membership they never use. £12/month gets you everything in our starter kit — and you'll actually use it every day.",
    creative: "Bundle flat lay with price callouts per item. Total retail value crossed out. Monthly price highlighted in green. Clean white background, clean type.",
  },
];

type Decision = "keep" | "throw" | "skip";

export default function TinderClient() {
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [animating, setAnimating] = useState<Decision | null>(null);
  const [done, setDone] = useState(false);

  const current = ADS[index];

  const decide = useCallback((decision: Decision) => {
    if (animating || done) return;
    setAnimating(decision);
    setTimeout(() => {
      setDecisions((prev) => ({ ...prev, [current.id]: decision }));
      setAnimating(null);
      if (index + 1 >= ADS.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
      }
    }, 280);
  }, [animating, done, current, index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") decide("throw");
      if (e.key === "ArrowRight") decide("keep");
      if (e.key === "ArrowUp" || e.key === " ") { e.preventDefault(); decide("skip"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [decide]);

  const kept = Object.values(decisions).filter((d) => d === "keep").length;

  if (done) {
    return (
      <div className="min-h-full flex items-center justify-center p-6" style={{ background: "var(--background)" }}>
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>All done</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            You reviewed {ADS.length} ads — kept {kept}, skipped {Object.values(decisions).filter(d => d === "skip").length}, threw {Object.values(decisions).filter(d => d === "throw").length}.
          </p>
          <button
            onClick={() => { setIndex(0); setDecisions({}); setDone(false); }}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  const cardStyle = {
    transform: animating === "throw" ? "translateX(-120%) rotate(-12deg)"
      : animating === "keep" ? "translateX(120%) rotate(12deg)"
      : animating === "skip" ? "translateY(-60px) scale(0.95)"
      : "none",
    opacity: animating ? 0 : 1,
    transition: "transform 0.28s ease, opacity 0.28s ease",
  };

  return (
    <div className="min-h-full flex flex-col" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Ads Tinder</h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>← throw &nbsp;·&nbsp; space skip &nbsp;·&nbsp; → keep</p>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{index + 1}</span>
          <span>/ {ADS.length}</span>
          {kept > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
            >
              {kept} kept
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--surface-2)" }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${((index) / ADS.length) * 100}%`, background: "var(--accent)" }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg" style={cardStyle}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Card header */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{current.idea}</h2>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex-shrink-0"
                style={{
                  background: current.type === "video" ? "rgba(236,72,153,0.12)" : "rgba(59,130,246,0.12)",
                  color: current.type === "video" ? "#ec4899" : "#3b82f6",
                }}
              >
                {current.type}
              </span>
            </div>

            {/* Hook */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Hook</p>
              <p className="text-lg font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                &ldquo;{current.hook}&rdquo;
              </p>
            </div>

            {/* Copy */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Copy</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{current.copy}</p>
            </div>

            {/* Creative */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Creative Brief</p>
              <div
                className="rounded-xl p-4 flex gap-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {current.type === "video" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="6 3 20 12 6 21 6 3"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{current.creative}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center justify-center gap-4 px-6 py-5 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <ActionButton onClick={() => decide("throw")} color="#ef4444" label="Throw" active={animating === "throw"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </ActionButton>

        <ActionButton onClick={() => decide("skip")} color="var(--text-secondary)" label="Skip" active={animating === "skip"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M15 6l6 6-6 6"/></svg>
        </ActionButton>

        <ActionButton onClick={() => decide("keep")} color="#22c55e" label="Keep" active={animating === "keep"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
        </ActionButton>
      </div>
    </div>
  );
}

function ActionButton({
  onClick, color, label, active, children,
}: {
  onClick: () => void;
  color: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
        style={{
          background: active ? `${color}22` : "var(--surface-2)",
          border: `2px solid ${active ? color : "var(--border)"}`,
          color,
          transform: active ? "scale(1.12)" : "scale(1)",
        }}
      >
        {children}
      </div>
      <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</span>
    </button>
  );
}
