import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership via join
  const { data: node } = await supabase
    .from("journey_nodes")
    .select("id, journey_maps!inner(user_id)")
    .eq("id", id)
    .single();

  if (!node) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  await supabase.from("journey_nodes").delete().eq("id", id);

  return new NextResponse(null, { status: 204 });
}
