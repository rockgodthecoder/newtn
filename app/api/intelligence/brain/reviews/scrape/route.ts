import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const ACTOR_ID = "Omb7MeKVdwRZUOhCK";
const MAX_REVIEWS = 500;

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function apifyUrl(path: string) {
  return `https://api.apify.com/v2${path}?token=${process.env.APIFY_TOKEN}`;
}

// POST — start Apify run
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brainId, brandId, trustpilotUrl } = await request.json() as {
    brainId: string;
    brandId: string;
    trustpilotUrl: string;
  };

  if (!brainId || !brandId || !trustpilotUrl)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify ownership
  const { data: brain } = await supabase.from("brand_brains").select("id").eq("id", brainId).eq("user_id", user.id).single();
  if (!brain) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = await fetch(apifyUrl(`/acts/${ACTOR_ID}/runs`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startUrls: [trustpilotUrl],
      maxItems: MAX_REVIEWS,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Apify error: ${err}` }, { status: 502 });
  }

  const { data: run } = await res.json() as { data: { id: string; defaultDatasetId: string } };
  return NextResponse.json({ runId: run.id, datasetId: run.defaultDatasetId });
}

// GET — poll status; when done, fetch + save reviews
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const datasetId = searchParams.get("datasetId");
  const brainId = searchParams.get("brainId");
  const brandId = searchParams.get("brandId");

  if (!runId || !datasetId || !brainId || !brandId)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const runRes = await fetch(apifyUrl(`/actor-runs/${runId}`));
  if (!runRes.ok) return NextResponse.json({ error: "Failed to fetch run status" }, { status: 502 });

  const { data: run } = await runRes.json() as { data: { status: string; statusMessage?: string } };

  if (run.status === "RUNNING" || run.status === "READY" || run.status === "TIMING-OUT")
    return NextResponse.json({ status: "running" });

  if (run.status === "FAILED" || run.status === "ABORTED" || run.status === "TIMED-OUT")
    return NextResponse.json({ status: "failed", reason: run.statusMessage ?? run.status });

  if (run.status !== "SUCCEEDED")
    return NextResponse.json({ status: "running" });

  // Fetch dataset items
  const dataRes = await fetch(apifyUrl(`/datasets/${datasetId}/items`) + `&limit=${MAX_REVIEWS}`);
  if (!dataRes.ok) return NextResponse.json({ error: "Failed to fetch results" }, { status: 502 });

  const items = await dataRes.json() as Array<{
    id?: string;
    user?: { name?: string; countryCode?: string };
    experiencedDate?: string;
    publishedDate?: string;
    title?: string;
    body?: string;
    rating?: number;
    likes?: number;
    isVerified?: boolean;
  }>;

  if (!items.length) return NextResponse.json({ status: "done", count: 0 });

  const db = admin();

  // Delete old reviews for this brand before inserting fresh ones
  await db.from("brand_reviews").delete().eq("brand_id", brandId).eq("brain_id", brainId);

  const rows = items.map((item) => ({
    brain_id: brainId,
    brand_id: brandId,
    external_id: item.id ?? null,
    reviewer_name: item.user?.name ?? null,
    country_code: item.user?.countryCode ?? null,
    experienced_date: item.experiencedDate ?? null,
    published_date: item.publishedDate ?? null,
    title: item.title ?? null,
    body: item.body ?? null,
    rating: item.rating ?? null,
    likes: item.likes ?? null,
    is_verified: item.isVerified ?? false,
  }));

  const { error } = await db.from("brand_reviews").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: "done", count: rows.length });
}
