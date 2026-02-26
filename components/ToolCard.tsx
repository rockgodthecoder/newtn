"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface ToolCardProps {
  href?: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  icon: ReactNode;
  badge?: string;
  comingSoon?: boolean;
}

export default function ToolCard({
  href,
  title,
  description,
  category,
  categoryColor,
  icon,
  badge,
  comingSoon,
}: ToolCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: comingSoon ? "var(--surface-2)" : `${categoryColor}22`,
            color: comingSoon ? "var(--text-secondary)" : categoryColor,
          }}
        >
          {icon}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {comingSoon && (
            <span
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
            >
              Soon
            </span>
          )}
          {badge && !comingSoon && (
            <span
              style={{ background: categoryColor, color: "white" }}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
            >
              {badge}
            </span>
          )}
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            {category}
          </span>
        </div>
      </div>
      <h3
        className="font-semibold text-xs mb-1"
        style={{ color: comingSoon ? "var(--text-secondary)" : "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p style={{ color: "var(--text-secondary)" }} className="text-[11px] leading-relaxed opacity-70">
        {description}
      </p>
      {!comingSoon && (
        <div
          className="flex items-center gap-1 mt-3 text-[11px] font-medium"
          style={{ color: categoryColor }}
        >
          Open tool
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:translate-x-0.5 transition-transform"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </>
  );

  if (comingSoon) {
    return (
      <div
        className="rounded-xl p-4 cursor-default"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          opacity: 0.55,
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href!}
      className="group block rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 tool-card"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <style>{`.tool-card:hover { border-color: ${categoryColor} !important; box-shadow: 0 0 20px ${categoryColor}22; }`}</style>
      {inner}
    </Link>
  );
}
