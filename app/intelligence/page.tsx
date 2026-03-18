import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BrainInputForm from "./BrainInputForm";
import BrainProgress from "./BrainProgress";
import BrainClient from "./BrainClient";
import SignOutButton from "./SignOutButton";

export default async function IntelligencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intelligence/login");

  const { data: brain } = await supabase
    .from("brand_brains")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // No brain yet — show setup form
  if (!brain) {
    return (
      <div className="min-h-full relative" style={{ background: "var(--background)" }}>
        <div className="absolute top-4 right-4 z-10">
          <SignOutButton />
        </div>
        <BrainInputForm />
      </div>
    );
  }

  // Building
  if (brain.status === "building") return <BrainProgress brain={brain} />;

  // Failed
  if (brain.status === "failed") {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-md text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Build failed</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {brain.progress_step ?? "Something went wrong. Please try again."}
          </p>
          <form action={async () => {
            "use server";
            const s = await createClient();
            const { data: { user: u } } = await s.auth.getUser();
            if (u) await s.from("brand_brains").delete().eq("user_id", u.id);
            redirect("/intelligence");
          }}>
            <button type="submit" className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--accent)", color: "white" }}>
              Delete & Try Again
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Complete — load brands
  const { data: brands } = await supabase
    .from("brain_brands")
    .select("*")
    .eq("brain_id", brain.id)
    .order("position");

  return (
    <div className="min-h-full" style={{ background: "var(--background)" }}>
      <div className="absolute top-4 right-4 z-10">
        <SignOutButton />
      </div>
      <BrainClient initialBrands={brands ?? []} />
    </div>
  );
}
