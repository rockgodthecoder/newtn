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

  // Ensure 3 brand slots (own + 2 competitors)
  const { data: existingBrands } = await supabase.from("brain_brands").select("id, role, position, name, url").eq("brain_id", brain.id).order("position");
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
    await db.from("brain_brands").insert(toCreate.map((s) => ({ brain_id: brain!.id, ...s })));
  }

  // Re-fetch brands (use admin to avoid RLS issues after insert)
  const { data: allBrands } = await db.from("brain_brands").select("id, role, position, name, url").eq("brain_id", brain.id).order("position");

  // Fetch uploaded files
  const { data: files } = await supabase.from("brain_files").select("id, brand_id, type, file_name").eq("brain_id", brain.id);

  return (
    <div className="min-h-full relative" style={{ background: "var(--background)" }}>
      <div className="absolute top-4 right-4 z-10">
        <SignOutButton />
      </div>
      <BrainUploadClient
        brainId={brain.id}
        initialBrands={allBrands ?? []}
        initialFiles={files ?? []}
      />
    </div>
  );
}
