import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: map } = await supabase
    .from("journey_maps")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!map) return NextResponse.json({ ceps: [], decisions: [] });

  const [{ data: ceps }, { data: decisions }] = await Promise.all([
    supabase.from("journey_ceps").select("*").eq("journey_map_id", map.id).order("position"),
    supabase.from("journey_decisions").select("*").eq("journey_map_id", map.id).order("position"),
  ]);

  return NextResponse.json({ ceps: ceps ?? [], decisions: decisions ?? [] });
}
