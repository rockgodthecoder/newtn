import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import JourneyInputForm from "./JourneyInputForm";
import JourneyProgress from "./JourneyProgress";
import JourneyMapClient from "./JourneyMapClient";

export default async function CustomerJourneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intelligence/login");

  const { data: map } = await supabase
    .from("journey_maps")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!map) return <JourneyInputForm />;
  if (map.status === "building") return <JourneyProgress map={map} />;

  if (map.status === "failed") {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-4" style={{ background: "var(--background)" }}>
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
            {map.progress_step ?? "Something went wrong. Please delete and try again."}
          </p>
          <form action={async () => {
            "use server";
            const s = await createClient();
            await s.from("journey_maps").delete().eq("id", map.id);
            redirect("/intelligence/customer-journey");
          }}>
            <button type="submit" className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--accent)", color: "white" }}>
              Delete & Try Again
            </button>
          </form>
        </div>
      </div>
    );
  }

  const [{ data: nodes }, { data: ceps }, { data: decisions }] = await Promise.all([
    supabase.from("journey_nodes").select("*").eq("journey_map_id", map.id).order("position"),
    supabase.from("journey_ceps").select("*").eq("journey_map_id", map.id).order("position"),
    supabase.from("journey_decisions").select("*").eq("journey_map_id", map.id).order("position"),
  ]);

  return (
    <JourneyMapClient
      map={map}
      initialNodes={nodes ?? []}
      initialCeps={ceps ?? []}
      initialDecisions={decisions ?? []}
    />
  );
}
