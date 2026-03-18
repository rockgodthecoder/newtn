import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.swipe_status !== undefined) {
    if (!["unreviewed", "approved", "dismissed"].includes(body.swipe_status)) {
      return NextResponse.json({ error: "Invalid swipe_status" }, { status: 400 });
    }
    updates.swipe_status = body.swipe_status;
  }

  if (body.completed !== undefined) {
    updates.completed = Boolean(body.completed);
  }

  const { data, error } = await supabase
    .from("journey_tactics")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json(data);
}
