import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import BrainUploadClient from "./BrainUploadClient";
import SignOutButton from "./SignOutButton";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function IntelligencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intelligence/login");

  const db = admin();

  // Get or create brain
  let { data: brain } = await supabase.from("brand_brains").select("id").eq("user_id", user.id).single();
  if (!brain) {
    const { data: newBrain } = await db.from("brand_brains").insert({ user_id: user.id, status: "ready", progress_pct: 100 }).select("id").single();
    brain = newBrain;
  }
  if (!brain) redirect("/intelligence/login");

  // Ensure 3 brand slots (own + 2 competitors) — use admin to bypass RLS
  const { data: existingBrands } = await db.from("brain_brands").select("id, role, position, name, url").eq("brain_id", brain.id).order("position");
  const brands = existingBrands ?? [];

  const slots: { role: string; position: number }[] = [
    { role: "own", position: 0 },
    { role: "competitor", position: 1 },
    { role: "competitor", position: 2 },
  ];

  const toCreate = slots.filter((s) =>
    !brands.some((b) => b.role === s.role && b.position === s.position)
  );

  if (toCreate.length > 0) {
    await db.from("brain_brands").insert(toCreate.map((s) => ({ brain_id: brain!.id, url: "", ...s })));
  }

  // Re-fetch brands (use admin to avoid RLS issues after insert)
  const { data: rawBrands } = await db.from("brain_brands").select("id, role, position, name, url").eq("brain_id", brain.id).order("position");

  // Deduplicate: keep the record with the most data per slot, delete stale duplicates
  const seen = new Map<string, { id: string; role: string; position: number; name: string | null; url: string | null }>();
  for (const b of (rawBrands ?? [])) {
    const key = `${b.role}:${b.position}`;
    const existing = seen.get(key);
    if (!existing || (b.url && !existing.url) || (b.name && !existing.name)) {
      seen.set(key, b);
    }
  }
  const allBrands = Array.from(seen.values()).sort((a, b) => a.position - b.position);
  const keepIds = new Set(allBrands.map((b) => b.id));
  const staleIds = (rawBrands ?? []).filter((b) => !keepIds.has(b.id)).map((b) => b.id);
  if (staleIds.length > 0) {
    await db.from("brain_brands").delete().in("id", staleIds);
  }

  // Fetch uploaded files + review counts
  const [{ data: files }, { data: reviewRows }] = await Promise.all([
    db.from("brain_files").select("id, brand_id, type, file_name").eq("brain_id", brain.id),
    db.from("brand_reviews").select("brand_id").eq("brain_id", brain.id),
  ]);

  const reviewCounts = (reviewRows ?? []).reduce((acc, r) => {
    acc[r.brand_id] = (acc[r.brand_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-full relative" style={{ background: "var(--background)" }}>
      <div className="absolute top-4 right-4 z-10">
        <SignOutButton />
      </div>
      <BrainUploadClient
        brainId={brain.id}
        initialBrands={allBrands}
        initialFiles={files ?? []}
        initialReviewCounts={reviewCounts}
      />
    </div>
  );
}
