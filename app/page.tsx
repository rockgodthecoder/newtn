import ToolCard from "@/components/ToolCard";

// ─── SVG ICON HELPERS ────────────────────────────────────────
const I = (d: string, extra?: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {extra && <path d={extra} />}
  </svg>
);

const icons = {
  currency:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9 9h4a2 2 0 0 1 0 4H9a2 2 0 0 0 0 4h5M9 9H7m8 6h2"/></svg>,
  calculator:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg>,
  box:         I("M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z", "m3.3 7 8.7 5 8.7-5M12 22V12"),
  truck:       I("M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3", "M9 17h6m0 0h2a2 2 0 0 0 2-2v-4l-3.5-4H16V8m1 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"),
  warehouse:   I("M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.43a2 2 0 0 1 1.48 0l8 3.43A2 2 0 0 1 22 8.35Z", "M6 18h12M6 14h12"),
  trending:    I("M22 7 13.5 15.5l-5-5L2 17", "m22 7-5 5"),
  refresh:     I("M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 16h5v5"),
  brain:       I("M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z", "M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"),
  users:       I("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 0a3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 6a3 3 0 0 1 3 3v2"),
  barChart:    I("M3 3v18h18", "M7 16v-5m5 5V8m5 8v-3"),
  fileText:    I("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z", "M14 2v6h6M16 13H8m8 4H8m2-8H8"),
  star:        I("M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.122 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16Z"),
  sparkles:    I("m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"),
  layers:      I("m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z", "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"),
  layout:      I("M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z", "M3 9h18M9 21V9"),
  newspaper:   I("M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M8 7h8m-8 4h8m-8 4h4"),
  mic:         I("M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z", "M19 10v2a7 7 0 0 1-14 0v-2M12 19v3m-4 0h8"),
  list:        I("M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"),
  eye:         I("M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"),
  megaphone:   I("m3 11 19-9-9 19-2-8-8-2Z"),
  video:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>,
  mail:        I("M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8", "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7M16 19h6m-3-3v6"),
  message:     I("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"),
  map:         I("M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0Z", "M15 5.764v15M9 3.236v15"),
  battery:     I("M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2", "M10 7V5a2 2 0 0 1 4 0v2m-7 5h2"),
  pieChart:    I("M21.21 15.89A10 10 0 1 1 8 2.83", "M22 12A10 10 0 0 0 12 2v10Z"),
  monitor:     I("M20 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z", "M8 21h8M12 17v4"),
  rocket:      I("M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z", "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Zm-3 3H6s.18-3.24 2-4m5 5v-3s3.24-.18 4-2"),
  flask:       I("M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2", "M8.5 2h7"),
  code:        I("m16 18 2 2 4-4", "m16 6 2-2 4 4M5 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"),
  externalLink: I("M15 3h6v6", "M10 14 21 3m0 0L9 15m3 6H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"),
  film:        I("M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z", "M7 2v4h10V2M7 18v4h10v-4"),
};

// ─── TOOL CATEGORIES ─────────────────────────────────────────

const CATEGORIES = [
  {
    label: "Pricing & Finance",
    color: "#7c3aed",
    tools: [
      {
        href: "/tools/price-converter",
        title: "Global Price Calculator",
        description: "PPP-adjusted pricing across 47 countries. 4 strategies: Lazy FX, PPP Ratio, PPP Power, .99 rounding.",
        icon: icons.currency,
        badge: "Live",
      },
      {
        title: "Price Testing Algo",
        description: "Build margin-aware pricing models for different channels, regions, and customer segments.",
        icon: icons.calculator,
        comingSoon: true,
      },
    ],
  },
];

const TOTAL_TOOLS = CATEGORIES.reduce((n, c) => n + c.tools.length, 0);
const LIVE_TOOLS  = CATEGORIES.reduce((n, c) => n + c.tools.filter((t) => (t as { href?: string }).href).length, 0);

export default function Home() {
  return (
    <div className="min-h-full p-6 lg:p-8" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="mb-8">
        <div
          style={{ background: "var(--accent-glow)", color: "var(--accent-light)" }}
          className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
        >
          Dashboard
        </div>
        <h1
          style={{ color: "var(--text-primary)" }}
          className="text-3xl font-bold tracking-tight"
        >
          Welcome to{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            newtn
          </span>
        </h1>
        <p style={{ color: "var(--text-secondary)" }} className="mt-2 text-sm max-w-lg">
          A growing suite of ecommerce tools built to help you sell smarter, price better, and move faster.
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-10">
        {[
          { value: String(TOTAL_TOOLS), label: "Tools Planned" },
          { value: String(LIVE_TOOLS),  label: "Live Now" },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            className="rounded-xl px-5 py-3 flex items-center gap-3"
          >
            <p style={{ color: "var(--accent-light)" }} className="text-xl font-bold tabular-nums">
              {s.value}
            </p>
            <p style={{ color: "var(--text-secondary)" }} className="text-xs">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-10">
        {CATEGORIES.map((cat) => (
          <section key={cat.label}>
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: cat.color }}
              />
              <h2 style={{ color: "var(--text-primary)" }} className="font-semibold text-sm">
                {cat.label}
              </h2>
              <span
                style={{ color: "var(--text-secondary)", background: "var(--surface-2)" }}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              >
                {cat.tools.length}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {cat.tools.map((tool) => (
                <ToolCard
                  key={tool.title}
                  href={tool.href}
                  title={tool.title}
                  description={tool.description}
                  category={cat.label}
                  categoryColor={cat.color}
                  icon={tool.icon}
                  badge={tool.badge}
                  comingSoon={tool.comingSoon}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
