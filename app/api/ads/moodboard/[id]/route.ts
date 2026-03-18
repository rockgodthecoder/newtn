import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("moodboard_images")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return new NextResponse(null, { status: 204 });
}
