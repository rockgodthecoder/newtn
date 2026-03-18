import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brainId, colors } = await request.json() as { brainId: string; colors: string[] };
  if (!brainId) return NextResponse.json({ error: "brainId required" }, { status: 400 });

  const { error } = await supabase
    .from("brand_brains")
    .update({ identity_colors: colors })
    .eq("id", brainId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
