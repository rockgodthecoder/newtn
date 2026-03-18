"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

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
  {
    section: "Intelligence",
    color: "#a78bfa",
    items: [
      {
        href: "/intelligence/login",
        hrefAuthed: "/intelligence",
        label: "Intelligence",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"/></svg>,
        badge: "New",
      },
      {
        href: "/intelligence/customer-journey",
        label: "Customer Journey",
        greyedOut: true,
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0Z"/><path d="M15 5.764v15M9 3.236v15"/></svg>,
      },
      {
        href: "/intelligence/review",
        label: "Review Tactics",
        greyedOut: true,
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>,
      },
      {
        href: "/intelligence/todo",
        label: "To-Do",
        greyedOut: true,
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/></svg>,
      },
    ],
  },
  {
    section: "Ads",
    color: "#ec4899",
    items: [
      {
        href: "/ads/tinder",
        label: "Ads Tinder",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
      },
      {
        href: "/ads/inspiration",
        label: "Inspiration",
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
      },
      {
        href: "/ads/todo",
        label: "To-Do",
        greyedOut: true,
        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/></svg>,
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);

export default function Sidebar() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
    {/* ── Desktop Sidebar ── */}
    <aside
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      className="hidden sm:flex w-52 flex-shrink-0 flex-col h-full"
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
              const locked = !!(item as { greyedOut?: boolean; requiresAuth?: boolean }).greyedOut ||
                (!!(item as { requiresAuth?: boolean }).requiresAuth && !authed);
              const resolvedHref = authed && (item as { hrefAuthed?: string }).hrefAuthed
                ? (item as { hrefAuthed?: string }).hrefAuthed!
                : item.href;
              const active = !locked && (pathname === resolvedHref || pathname === item.href);
              return (
                <Link
                  key={item.href}
                  href={locked ? "#" : resolvedHref}
                  onClick={locked ? (e) => e.preventDefault() : undefined}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                  style={
                    locked
                      ? { color: "var(--text-secondary)", opacity: 0.35, cursor: "default" }
                      : active
                      ? { background: "var(--accent-glow)", color: "var(--accent-light)" }
                      : { color: "var(--text-secondary)" }
                  }
                  onMouseEnter={(e) => {
                    if (!active && !locked) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active && !locked) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                  }}
                >
                  <span className={active ? "text-[var(--accent-light)]" : ""}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {(item as { badge?: string }).badge && !locked && (
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

    {/* ── Mobile Bottom Nav ── */}
    <nav
      className="fixed bottom-0 left-0 right-0 sm:hidden z-50 flex"
      style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
    >
      {ALL_NAV_ITEMS.map((item) => {
        const locked = !!(item as { greyedOut?: boolean; requiresAuth?: boolean }).greyedOut ||
          (!!(item as { requiresAuth?: boolean }).requiresAuth && !authed);
        const resolvedHref = authed && (item as { hrefAuthed?: string }).hrefAuthed
          ? (item as { hrefAuthed?: string }).hrefAuthed!
          : item.href;
        const active = !locked && (pathname === resolvedHref || pathname === item.href);
        return (
          <Link
            key={item.href}
            href={locked ? "#" : resolvedHref}
            onClick={locked ? (e) => e.preventDefault() : undefined}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-medium transition-colors"
            style={{
              color: active ? "var(--accent-light)" : "var(--text-secondary)",
              opacity: locked ? 0.35 : 1,
              cursor: locked ? "default" : "pointer",
            }}
          >
            <span style={{ color: active ? "var(--accent-light)" : "var(--text-secondary)" }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
    </>
  );
}
