"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JourneyInputForm() {
  const [url, setUrl]               = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.startsWith("http")) {
      setError("URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/intelligence/journey/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, description }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-[560px]">

        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-4"
            style={{ background: "var(--accent-glow)", color: "var(--accent-light)" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"/>
            </svg>
            Intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Customer Journey Mapper
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Enter your brand URL and a short description. Our AI will scrape your website and build a detailed, visual customer journey map.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Brand URL
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourbrand.com"
                className="rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)", transition: "border-color 0.15s" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Brand Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your brand, products, and target customer…"
                className="rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)", transition: "border-color 0.15s" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {description.length}/2000
              </p>
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? "var(--surface-2)" : "var(--accent)",
                color: loading ? "var(--text-secondary)" : "white",
                boxShadow: loading ? "none" : "0 0 28px rgba(124,58,237,0.4)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Starting build…
                </>
              ) : "Build My Journey Map"}
            </button>

          </form>
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: "var(--text-secondary)" }}>
          Takes up to 5 minutes · AI scrapes up to 20 pages
        </p>
      </div>
    </div>
  );
}
