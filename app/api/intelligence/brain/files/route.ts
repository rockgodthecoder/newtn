import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const brainId = form.get("brainId") as string;
  const brandId = form.get("brandId") as string;
  const type = form.get("type") as string;

  if (!file || !brainId || !brandId || !type)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify brain ownership
  const { data: brain } = await supabase.from("brand_brains").select("id").eq("id", brainId).eq("user_id", user.id).single();
  if (!brain) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = admin();
  const filePath = `${user.id}/${brainId}/${brandId}/${type}/${Date.now()}_${file.name}`;
  const bytes = await file.arrayBuffer();

  const { error: storageErr } = await db.storage.from("brain-files").upload(filePath, bytes, { contentType: file.type || "text/csv", upsert: false });
  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 });

  const { data: record, error: dbErr } = await db.from("brain_files").insert({
    brain_id: brainId,
    brand_id: brandId,
    type,
    file_name: file.name,
    file_path: filePath,
  }).select().single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json(record);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json() as { id: string };
  const db = admin();

  const { data: file } = await db.from("brain_files").select("*").eq("id", id).single();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify ownership
  const { data: brain } = await supabase.from("brand_brains").select("id").eq("id", file.brain_id).eq("user_id", user.id).single();
  if (!brain) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.storage.from("brain-files").remove([file.file_path]);
  await db.from("brain_files").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
