import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: map } = await supabase
    .from("journey_maps")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!map) return NextResponse.json({ tactics: [], total: 0, unreviewed: 0, approved: 0, dismissed: 0 });

  const { searchParams } = new URL(request.url);
  const status  = searchParams.get("status");
  const channel = searchParams.get("channel");

  let query = supabase
    .from("journey_tactics")
    .select("*, journey_nodes!inner(title)")
    .eq("journey_map_id", map.id)
    .order("position");

  if (status)  query = query.eq("swipe_status", status);
  if (channel) query = query.eq("channel", channel);

  const { data: tactics } = await query;

  // Counts
  const { data: counts } = await supabase
    .from("journey_tactics")
    .select("swipe_status")
    .eq("journey_map_id", map.id);

  const unreviewed = counts?.filter((t) => t.swipe_status === "unreviewed").length ?? 0;
  const approved   = counts?.filter((t) => t.swipe_status === "approved").length ?? 0;
  const dismissed  = counts?.filter((t) => t.swipe_status === "dismissed").length ?? 0;

  const mapped = (tactics ?? []).map((t) => ({
    ...t,
    node_title: (t.journey_nodes as { title: string })?.title ?? "",
    journey_nodes: undefined,
  }));

  return NextResponse.json({
    tactics: mapped,
    total: (counts?.length ?? 0),
    unreviewed,
    approved,
    dismissed,
  });
}
