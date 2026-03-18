import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as { name?: string; url?: string };

  const db = admin();

  // Verify ownership via brain (admin reads to bypass RLS)
  const { data: brand } = await db.from("brain_brands").select("brain_id").eq("id", id).single();
  if (!brand) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: brain } = await db.from("brand_brains").select("id").eq("id", brand.brain_id).eq("user_id", user.id).single();
  if (!brain) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const update: Record<string, string> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.url !== undefined) update.url = body.url;

  const { error } = await db.from("brain_brands").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
