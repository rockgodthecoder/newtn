import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import InspirationClient from "./InspirationClient";

export default async function InspirationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/intelligence/login");

  const { data: images } = await supabase
    .from("moodboard_images")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <InspirationClient initialImages={images ?? []} userId={user.id} />;
}
