import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "no_token" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/ads_archive?` +
      new URLSearchParams({
        access_token: token,
        search_terms: query,
        ad_type: "ALL",
        ad_reached_countries: '["GB","US","AU"]',
        fields: "ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,page_name,impressions,spend,ad_delivery_start_time",
        limit: "20",
      }),
      { signal: AbortSignal.timeout(12000) }
    );

    if (!res.ok) return NextResponse.json({ error: "Facebook API error" }, { status: res.status });

    const data = await res.json() as { data: unknown[] };
    return NextResponse.json({ ads: data.data ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to reach Facebook API" }, { status: 502 });
  }
}
