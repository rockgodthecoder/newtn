"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    section: null,
    items: [
      {
        href: "/",
        label: "Home",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
      },
    ],
  },
  {
    section: "Pricing & Finance",
    color: "#7c3aed",
    items: [
      {
        href: "/tools/price-converter",
        label: "Global Price Calc",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9 9h4a2 2 0 0 1 0 4H9a2 2 0 0 0 0 4h5M9 9H7m8 6h2"/></svg>,
        badge: "Live",
      },
    ],
  },
];

const COMING_SOON_COUNT = 33;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      className="w-52 flex-shrink-0 flex flex-col h-full"
    >
      {/* Logo */}
      <div
        style={{ borderBottom: "1px solid var(--border)" }}
        className="px-4 py-4 flex items-center gap-2.5"
      >
        <div
          style={{ background: "var(--accent)", boxShadow: "0 0 16px var(--accent-glow)" }}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span
          style={{ color: "var(--text-primary)" }}
          className="font-bold text-base tracking-tight"
        >
          newtn
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-3" : ""}>
            {group.section && (
              <div className="flex items-center gap-1.5 px-2 pt-1 pb-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: (group as { color?: string }).color ?? "var(--text-secondary)" }}
                />
                <p
                  style={{ color: "var(--text-secondary)" }}
                  className="text-[10px] font-semibold uppercase tracking-wider"
                >
                  {group.section}
                </p>
              </div>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                  style={
                    active
                      ? { background: "var(--accent-glow)", color: "var(--accent-light)" }
                      : { color: "var(--text-secondary)" }
                  }
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                  }}
                >
                  <span className={active ? "text-[var(--accent-light)]" : ""}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {(item as { badge?: string }).badge && (
                    <span
                      style={{ background: "var(--accent)", color: "white" }}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
                    >
                      {(item as { badge?: string }).badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Coming soon indicator */}
        <div
          className="mt-4 mx-1 rounded-xl px-3 py-2.5"
          style={{ background: "var(--surface-2)", border: "1px dashed var(--border)" }}
        >
          <p style={{ color: "var(--text-secondary)" }} className="text-[10px] font-semibold">
            {COMING_SOON_COUNT} more tools
          </p>
          <p style={{ color: "var(--text-secondary)" }} className="text-[10px] opacity-60 mt-0.5">
            in development
          </p>
        </div>
      </nav>

      {/* Footer */}
      <div
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
        className="px-4 py-3 text-[10px]"
      >
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>newtn</p>
        <p className="mt-0.5 opacity-60">Ecom tools platform</p>
      </div>
    </aside>
  );
}
