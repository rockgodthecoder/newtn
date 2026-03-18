import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const boardUrl = searchParams.get("url");
  if (!boardUrl) return NextResponse.json({ error: "url parameter required" }, { status: 400 });

  // Normalize to RSS URL
  let rssUrl: string;
  try {
    const parsed = new URL(boardUrl.startsWith("http") ? boardUrl : `https://${boardUrl}`);
    rssUrl = `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}.rss`;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let xml: string;
  try {
    const res = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Board not found or is private" }, { status: 404 });
    }
    xml = await res.text();
  } catch {
    return NextResponse.json({ error: "Could not reach Pinterest — check the board URL" }, { status: 502 });
  }

  // Parse items from RSS XML
  const images: Array<{ url: string; title: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(item);
    const titleMatch = /<title><!\[CDATA\[([^\]]+)\]\]>/i.exec(item) ?? /<title>([^<]+)<\/title>/i.exec(item);
    if (imgMatch) {
      // Upgrade from 236px to 736px thumbnails
      const url = imgMatch[1].replace("/236x/", "/736x/").replace("/170x/", "/736x/");
      images.push({ url, title: titleMatch?.[1]?.trim() ?? "" });
    }
  }

  if (images.length === 0) {
    return NextResponse.json({ error: "No images found — make sure the board is public" }, { status: 404 });
  }

  return NextResponse.json({ images });
}
