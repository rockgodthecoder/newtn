import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InspirationClient from "./InspirationClient";

export default async function InspirationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intelligence/login");

  const [{ data: images }, { data: brain }] = await Promise.all([
    supabase.from("moodboard_images").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("brand_brains").select("id").eq("user_id", user.id).single(),
  ]);

  let competitors: Array<{ id: string; url: string }> = [];
  if (brain) {
    const { data: brands } = await supabase
      .from("brain_brands")
      .select("id, url")
      .eq("brain_id", brain.id)
      .eq("role", "competitor");
    competitors = brands ?? [];
  }

  return (
    <InspirationClient
      initialImages={images ?? []}
      userId={user.id}
      competitors={competitors}
      hasFacebookToken={!!process.env.FACEBOOK_ACCESS_TOKEN}
    />
  );
}
