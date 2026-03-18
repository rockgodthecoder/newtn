import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: brain } = await supabase
    .from("brand_brains")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!brain) return NextResponse.json({ brain: null, brands: [] });

  const { data: brands } = await supabase
    .from("brain_brands")
    .select("*")
    .eq("brain_id", brain.id)
    .order("position");

  return NextResponse.json({ brain, brands: brands ?? [] });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: brain } = await supabase
    .from("brand_brains")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!brain) return NextResponse.json({ error: "No brain found" }, { status: 404 });

  await supabase.from("brand_brains").delete().eq("id", brain.id);

  return new NextResponse(null, { status: 204 });
}
