import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brainId, colors, assets } = await request.json() as { brainId: string; colors: string[]; assets?: unknown };
  if (!brainId) return NextResponse.json({ error: "brainId required" }, { status: 400 });

  const update: Record<string, unknown> = { identity_colors: colors };
  if (assets !== undefined) update.brand_assets = assets;

  const { error } = await supabase
    .from("brand_brains")
    .update(update)
    .eq("id", brainId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
