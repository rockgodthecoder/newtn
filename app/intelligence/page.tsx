import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function IntelligencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/intelligence/login");

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div
            style={{ background: "var(--accent-glow)", color: "var(--accent-light)" }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24Z"/>
            </svg>
            Intelligence
          </div>
          <h1
            style={{ color: "var(--text-primary)" }}
            className="text-2xl sm:text-3xl font-bold tracking-tight"
          >
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)" }} className="mt-1.5 text-sm">
            {user.email}
          </p>
        </div>

        <SignOutButton />
      </div>

      {/* Placeholder */}
      <div
        className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
        style={{
          background: "var(--surface)",
          border: "1px dashed var(--border)",
          minHeight: 320,
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: "linear-gradient(135deg, #7c3aed22, #a78bfa22)",
            border: "1px solid var(--border)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
          </svg>
        </div>
        <p style={{ color: "var(--text-primary)" }} className="font-semibold text-base mb-1">
          Intelligence is coming
        </p>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm max-w-xs">
          You&apos;re in. Features are being built — check back soon.
        </p>
      </div>
    </div>
  );
}
