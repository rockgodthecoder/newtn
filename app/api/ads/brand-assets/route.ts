import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function extractMeta(html: string, name: string): string {
  const m = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i").exec(html)
    ?? new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i").exec(html);
  return m?.[1]?.trim() ?? "";
}

function resolveUrl(src: string, origin: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  return `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
}

function extractLogo(html: string, origin: string): string {
  // apple-touch-icon (highest quality brand icon)
  const apple = /<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i.exec(html)
    ?? /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i.exec(html);
  if (apple?.[1]) return resolveUrl(apple[1], origin);

  // img tag with "logo" in src/alt/class/id
  const logoImg = /<img[^>]+(?:src=["']([^"']*logo[^"']*)["']|alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["'])/i.exec(html);
  if (logoImg) {
    const src = logoImg[1] ?? logoImg[2];
    if (src && !src.match(/\.(svg)$/i)) return resolveUrl(src, origin);
  }

  // og:image as last resort
  const og = extractMeta(html, "og:image");
  if (og) return resolveUrl(og, origin);

  return "";
}

function extractImages(html: string, origin: string): string[] {
  const seen = new Set<string>();
  const images: string[] = [];

  const add = (src: string) => {
    if (!src || src.startsWith("data:")) return;
    if (src.match(/\.(svg|ico|gif|webp)(\?.*)?$/i)) return;
    if (src.match(/1x1|pixel|tracker|tracking|beacon|spacer/i)) return;
    const abs = resolveUrl(src, origin);
    if (!seen.has(abs)) { seen.add(abs); images.push(abs); }
  };

  // og:image first
  const og = extractMeta(html, "og:image");
  if (og) add(og);

  // img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null && images.length < 24) {
    add(m[1]);
  }

  return images;
}

function extractFonts(html: string): string[] {
  const fonts = new Set<string>();

  // Google Fonts link tags
  const linkRegex = /<link[^>]+href=["']([^"']*fonts\.googleapis\.com[^"']*)["']/gi;
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    const familyMatch = /family=([^&"']+)/.exec(m[1]);
    if (familyMatch) {
      familyMatch[1].split("|").forEach((f) => {
        fonts.add(f.split(":")[0].replace(/\+/g, " ").trim());
      });
    }
  }

  // @import in style blocks
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = styleRegex.exec(html)) !== null) {
    const importRegex = /@import\s+url\(['"](https:\/\/fonts\.googleapis\.com[^'"]+)['"]\)/gi;
    let im;
    while ((im = importRegex.exec(m[1])) !== null) {
      const familyMatch = /family=([^&"']+)/.exec(im[1]);
      if (familyMatch) {
        familyMatch[1].split("|").forEach((f) => {
          fonts.add(f.split(":")[0].replace(/\+/g, " ").trim());
        });
      }
    }

    // font-family declarations (non-system fonts)
    const systemFonts = /^(sans-serif|serif|monospace|cursive|fantasy|inherit|initial|unset|normal|arial|helvetica|verdana|georgia|times|courier|system-ui|-apple-system)$/i;
    const fontFamilyRegex = /font-family\s*:\s*["']([^"',]+)["']/gi;
    let ff;
    while ((ff = fontFamilyRegex.exec(m[1])) !== null) {
      const name = ff[1].trim();
      if (!systemFonts.test(name)) fonts.add(name);
    }
  }

  return Array.from(fonts).slice(0, 6);
}

function normalizeHex(hex: string): string {
  if (hex.length === 4) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return hex.toLowerCase();
}

function isBoringColor(hex: string): boolean {
  const h = normalizeHex(hex);
  // Skip near-white, near-black, and pure greys
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const saturation = max === min ? 0 : (max - min) / (lightness < 0.5 ? max + min : 510 - max - min);
  return lightness < 0.08 || lightness > 0.92 || saturation < 0.1;
}

function extractColors(html: string): string[] {
  const colors = new Map<string, number>(); // hex → frequency

  const addColor = (hex: string) => {
    const n = normalizeHex(hex);
    if (!isBoringColor(n)) colors.set(n, (colors.get(n) ?? 0) + 1);
  };

  // theme-color (highest priority)
  const themeColor = extractMeta(html, "theme-color");
  if (themeColor?.startsWith("#")) addColor(themeColor);

  // Hex values from inline style blocks
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  let m;
  while ((m = styleRegex.exec(html)) !== null) {
    let hm;
    while ((hm = hexRegex.exec(m[1])) !== null) {
      addColor(`#${hm[1]}`);
    }
  }

  // Sort by frequency, return top 8
  return Array.from(colors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);
}

function extractLanguages(html: string): string[] {
  const langs = new Set<string>();

  const htmlLang = /<html[^>]+lang=["']([^"']+)["']/i.exec(html);
  if (htmlLang?.[1]) langs.add(htmlLang[1].split("-")[0].toLowerCase());

  const hreflangRegex = /<link[^>]+hreflang=["']([^"']+)["']/gi;
  let m;
  while ((m = hreflangRegex.exec(html)) !== null) {
    const lang = m[1].toLowerCase();
    if (lang !== "x-default") langs.add(lang.split("-")[0]);
  }

  return Array.from(langs);
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

  let html = "";
  try {
    const res = await fetch(normalised, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Could not reach this website" }, { status: 502 });
  }

  return NextResponse.json({
    domain: new URL(normalised).hostname.replace(/^www\./, ""),
    logo: extractLogo(html, origin),
    images: extractImages(html, origin),
    fonts: extractFonts(html),
    colors: extractColors(html),
    languages: extractLanguages(html),
  });
}
