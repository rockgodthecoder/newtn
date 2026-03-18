import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const SCRAPE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function extractText(html: string, maxChars = 2000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

function extractTitle(html: string): string {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m?.[1]?.trim() ?? "";
}

function extractMeta(html: string, name: string): string {
  const m = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i").exec(html)
    ?? new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i").exec(html);
  return m?.[1]?.trim() ?? "";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const normalised = url.startsWith("http") ? url : `https://${url}`;
  let origin: string;
  try {
    origin = new URL(normalised).origin;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch homepage
  let homepageHtml = "";
  try {
    const res = await fetch(normalised, { headers: SCRAPE_HEADERS, signal: AbortSignal.timeout(12000) });
    homepageHtml = await res.text();
  } catch {
    return NextResponse.json({ error: "Could not reach this website" }, { status: 502 });
  }

  const homepage = {
    url: normalised,
    title: extractTitle(homepageHtml),
    description: extractMeta(homepageHtml, "description") || extractMeta(homepageHtml, "og:description"),
    text: extractText(homepageHtml),
  };

  // Extract internal links and fetch up to 4 key pages
  const linkRegex = /href=["']([^"'#?]+)["']/g;
  const links = new Set<string>();
  let m;
  while ((m = linkRegex.exec(homepageHtml)) !== null) {
    const href = m[1];
    try {
      const abs = href.startsWith("http") ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
      const u = new URL(abs);
      if (u.origin === origin && !href.match(/\.(jpg|jpeg|png|gif|svg|css|js|ico|xml|pdf|zip)$/i)) {
        links.add(abs);
      }
    } catch { /* skip */ }
  }

  // Prioritise "about", "shop", "products", "pricing", "features" pages
  const priority = ["about", "shop", "product", "pricing", "features", "collection", "story", "why"];
  const sorted = Array.from(links).sort((a, b) => {
    const aScore = priority.findIndex((p) => a.toLowerCase().includes(p));
    const bScore = priority.findIndex((p) => b.toLowerCase().includes(p));
    return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
  });

  const subPages = await Promise.allSettled(
    sorted.slice(0, 4).map(async (pageUrl) => {
      const r = await fetch(pageUrl, { headers: SCRAPE_HEADERS, signal: AbortSignal.timeout(8000) });
      const html = await r.text();
      return {
        url: pageUrl,
        title: extractTitle(html) || new URL(pageUrl).pathname,
        description: extractMeta(html, "description") || extractMeta(html, "og:description"),
        text: extractText(html),
      };
    })
  );

  const pages = [
    homepage,
    ...subPages.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<typeof homepage>).value),
  ];

  return NextResponse.json({ pages });
}
