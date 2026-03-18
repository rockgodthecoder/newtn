import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SwipeClient from "./SwipeClient";

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intelligence/login");

  const { data: map } = await supabase
    .from("journey_maps")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!map) redirect("/intelligence/customer-journey");

  const { data: tactics } = await supabase
    .from("journey_tactics")
    .select("*, journey_nodes!inner(title)")
    .eq("journey_map_id", map.id)
    .eq("swipe_status", "unreviewed")
    .order("position");

  const mapped = (tactics ?? []).map((t) => ({
    ...t,
    node_title: (t.journey_nodes as { title: string })?.title ?? "",
    journey_nodes: undefined,
  }));

  return <SwipeClient initialTactics={mapped} />;
}
