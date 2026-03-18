import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InspirationClient from "./InspirationClient";

export default async function InspirationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intelligence/login");

  const [{ data: images }, { data: brain }] = await Promise.all([
    supabase.from("moodboard_images").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("brand_brains").select("id, identity_colors").eq("user_id", user.id).single(),
  ]);

  let competitors: Array<{ id: string; url: string }> = [];
  let ownBrandUrl: string | null = null;
  let savedColors: string[] = [];
  let brainId: string | null = brain?.id ?? null;
  if (brain) {
    const [{ data: brands }, { data: ownBrand }] = await Promise.all([
      supabase.from("brain_brands").select("id, url").eq("brain_id", brain.id).eq("role", "competitor"),
      supabase.from("brain_brands").select("url").eq("brain_id", brain.id).eq("role", "own").single(),
    ]);
    competitors = brands ?? [];
    ownBrandUrl = ownBrand?.url ?? null;
    savedColors = (brain as { identity_colors?: string[] }).identity_colors ?? [];
  }

  return (
    <InspirationClient
      initialImages={images ?? []}
      userId={user.id}
      competitors={competitors}
      hasFacebookToken={!!process.env.FACEBOOK_ACCESS_TOKEN}
      ownBrandUrl={ownBrandUrl}
      savedColors={savedColors}
      brainId={brainId}
    />
  );
}
