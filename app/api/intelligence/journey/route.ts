import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: map } = await supabase
    .from("journey_maps")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!map) return NextResponse.json({ map: null, nodes: [] });

  const { data: nodes } = await supabase
    .from("journey_nodes")
    .select("*")
    .eq("journey_map_id", map.id)
    .order("position", { ascending: true });

  return NextResponse.json({ map, nodes: nodes ?? [] });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: map } = await supabase
    .from("journey_maps")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!map) return NextResponse.json({ error: "No journey map found" }, { status: 404 });

  await supabase.from("journey_maps").delete().eq("id", map.id);

  return new NextResponse(null, { status: 204 });
}
