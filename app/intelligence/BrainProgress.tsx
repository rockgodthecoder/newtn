"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Brain = {
  status: string;
  progress_pct: number;
  progress_step: string | null;
};

export default function BrainProgress({ brain }: { brain: Brain }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/intelligence/brain");
      const data = await res.json();
      if (data.brain?.status === "complete" || data.brain?.status === "failed") {
        clearInterval(interval);
        router.refresh();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [router]);

  const steps = [
    { label: "Initialising brain", done: brain.progress_pct >= 15 },
    { label: "Analysing your brand", done: brain.progress_pct >= 50 },
    { label: "Analysing competitors", done: brain.progress_pct >= 75 },
    { label: "Generating insights", done: brain.progress_pct >= 95 },
  ];

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm text-center">

        {/* Pulsing brain icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.15))",
              border: "1px solid var(--border)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"/>
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Building your brain
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          Analysing brands and generating insights…
        </p>

        {/* Progress bar */}
        <div className="rounded-full overflow-hidden mb-3" style={{ background: "var(--surface-2)", height: 8 }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${brain.progress_pct}%`,
              background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
              boxShadow: "0 0 12px rgba(124,58,237,0.5)",
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs mb-8" style={{ color: "var(--text-secondary)" }}>
          <span>{brain.progress_step ?? "Starting…"}</span>
          <span className="font-semibold tabular-nums" style={{ color: "var(--accent-light)" }}>
            {brain.progress_pct}%
          </span>
        </div>

        {/* Steps */}
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3 py-2 text-sm text-left">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: step.done ? "var(--accent)" : "var(--surface-2)",
                border: `1px solid ${step.done ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {step.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              )}
            </div>
            <span style={{ color: step.done ? "var(--text-primary)" : "var(--text-secondary)" }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
