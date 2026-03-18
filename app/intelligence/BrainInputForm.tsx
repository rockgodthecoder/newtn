"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BrainInputForm() {
  const router = useRouter();
  const [ownUrl, setOwnUrl] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addCompetitor = () => {
    if (competitors.length < 2) setCompetitors((p) => [...p, ""]);
  };

  const updateCompetitor = (i: number, val: string) => {
    setCompetitors((p) => p.map((v, j) => (j === i ? val : v)));
  };

  const removeCompetitor = (i: number) => {
    setCompetitors((p) => p.filter((_, j) => j !== i));
  };

  const handleSubmit = async () => {
    setError("");
    if (!ownUrl.trim()) { setError("Enter your brand URL"); return; }
    if (!ownUrl.startsWith("http")) { setError("URL must start with https://"); return; }

    setLoading(true);
    const res = await fetch("/api/intelligence/brain/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        own_url: ownUrl.trim(),
        competitor_urls: competitors.filter((c) => c.trim()),
      }),
    });

    if (!res.ok) {
      try {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
      } catch {
        setError("Something went wrong — please try again");
      }
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-lg">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.15))",
              border: "1px solid var(--border)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"/>
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-bold text-center mb-1" style={{ color: "var(--text-primary)" }}>
          Build Your Brand Brain
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--text-secondary)" }}>
          Add your brand and up to 2 competitors. We&apos;ll analyse each one and build your intelligence layer.
        </p>

        <div className="space-y-4">
          {/* Own brand */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              YOUR BRAND URL
            </label>
            <input
              type="url"
              value={ownUrl}
              onChange={(e) => setOwnUrl(e.target.value)}
              placeholder="https://yourbrand.com"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Competitors */}
          {competitors.map((url, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  COMPETITOR {i + 1}
                </label>
                <button
                  onClick={() => removeCompetitor(i)}
                  className="text-[11px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Remove
                </button>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => updateCompetitor(i, e.target.value)}
                placeholder="https://competitor.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          ))}

          {/* Add competitor */}
          {competitors.length < 2 && (
            <button
              onClick={addCompetitor}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{
                border: "1px dashed var(--border)",
                color: "var(--text-secondary)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-light)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add a competitor
            </button>
          )}

          {error && (
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading ? "var(--surface-2)" : "var(--accent)",
              color: loading ? "var(--text-secondary)" : "white",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 0 24px rgba(124,58,237,0.35)",
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Starting…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"/>
                </svg>
                Build Brain
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
