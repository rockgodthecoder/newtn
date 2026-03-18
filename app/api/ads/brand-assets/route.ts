import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMeta(html: string, name: string): string {
  const m = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i").exec(html)
    ?? new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i").exec(html);
  return m?.[1]?.trim() ?? "";
}

function resolveUrl(src: string, origin: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  return `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
}

// ─── CSS fetching ─────────────────────────────────────────────────────────────

const THIRD_PARTY_CSS = /fonts\.googleapis\.com|cdnjs|jsdelivr|unpkg|stackpath|bootstrapcdn|fontawesome|typekit\.net/i;
const MAIN_CSS_HINTS = /main|app|style|theme|global|bundle|site|index/i;

async function fetchLinkedCss(html: string, origin: string): Promise<string> {
  const cssHrefs: string[] = [];
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    const href = m[1];
    if (!THIRD_PARTY_CSS.test(href)) cssHrefs.push(resolveUrl(href, origin));
  }

  // Prioritise "main"-looking stylesheets, take up to 3
  const sorted = [
    ...cssHrefs.filter((h) => MAIN_CSS_HINTS.test(h)),
    ...cssHrefs.filter((h) => !MAIN_CSS_HINTS.test(h)),
  ].slice(0, 3);

  const results = await Promise.allSettled(
    sorted.map((href) =>
      fetch(href, { headers: { "User-Agent": HEADERS["User-Agent"] }, signal: AbortSignal.timeout(6000) })
        .then((r) => r.text())
    )
  );

  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<string>).value)
    .join("\n");
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function extractLogo(html: string, origin: string): string {
  // apple-touch-icon
  const apple = /<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i.exec(html)
    ?? /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i.exec(html);
  if (apple?.[1]) return resolveUrl(apple[1], origin);

  // img tag with "logo" in src/alt/class/id
  const logoImg = /<img[^>]+(?:src=["']([^"']*logo[^"']*)["']|alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["'])/i.exec(html);
  if (logoImg) {
    const src = logoImg[1] ?? logoImg[2];
    if (src) return resolveUrl(src, origin);
  }

  // og:image fallback
  const og = extractMeta(html, "og:image");
  if (og) return resolveUrl(og, origin);

  return "";
}

// ─── Images ───────────────────────────────────────────────────────────────────

function extractImages(html: string, origin: string): string[] {
  const seen = new Set<string>();
  const images: string[] = [];

  const add = (src: string) => {
    if (!src || src.startsWith("data:")) return;
    if (src.match(/1x1|pixel|tracker|tracking|beacon|spacer/i)) return;
    const abs = resolveUrl(src, origin);
    if (abs && !seen.has(abs)) { seen.add(abs); images.push(abs); }
  };

  const og = extractMeta(html, "og:image");
  if (og) add(og);

  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null && images.length < 24) add(m[1]);

  return images;
}

// ─── Fonts ────────────────────────────────────────────────────────────────────

function parseFontsFromSource(source: string, fonts: Set<string>) {
  // Google Fonts URLs
  const gfRegex = /fonts\.googleapis\.com\/css[^"'\s)]*family=([^&"'\s)]+)/gi;
  let m;
  while ((m = gfRegex.exec(source)) !== null) {
    m[1].split("|").forEach((f) => fonts.add(f.split(":")[0].replace(/\+/g, " ").trim()));
  }

  // Adobe Fonts / Typekit CSS (font-family declarations in fetched typekit CSS)
  const systemFonts = /^(sans-serif|serif|monospace|cursive|fantasy|inherit|initial|unset|normal|arial|helvetica|verdana|georgia|times|new roman|courier|system-ui|-apple-system|blinkmacsystemfont|segoe ui|roboto|oxygen|ubuntu|cantarell|fira sans|droid sans|open sans)$/i;
  const ffRegex = /font-family\s*:\s*["']([^"',;]+)["']/gi;
  while ((m = ffRegex.exec(source)) !== null) {
    const name = m[1].trim();
    if (!systemFonts.test(name) && name.length > 1 && name.length < 60) fonts.add(name);
  }

  // @font-face src — extract filename as font name hint
  const fontFaceRegex = /@font-face\s*\{[^}]*font-family\s*:\s*["']([^"']+)["']/gi;
  while ((m = fontFaceRegex.exec(source)) !== null) {
    const name = m[1].trim();
    if (!systemFonts.test(name)) fonts.add(name);
  }
}

function extractFonts(html: string, externalCss: string): string[] {
  const fonts = new Set<string>();

  // Adobe Fonts link tag
  const typekitLink = /<link[^>]+href=["']([^"']*use\.typekit\.net[^"']*)["']/i.exec(html);
  if (typekitLink?.[1]) {
    // font names will be in the fetched CSS — parseFontsFromSource handles it
  }

  // preload font hints
  const preloadRegex = /<link[^>]+rel=["']preload["'][^>]+as=["']font["'][^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = preloadRegex.exec(html)) !== null) {
    const filename = m[1].split("/").pop()?.split(".")[0]?.replace(/[-_]/g, " ");
    if (filename && filename.length > 2 && filename.length < 40) fonts.add(filename);
  }

  // Parse HTML inline styles + external CSS
  const allStyleContent = [
    ...[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((x) => x[1]),
    externalCss,
  ].join("\n");

  parseFontsFromSource(allStyleContent, fonts);

  return Array.from(fonts).slice(0, 6);
}

// ─── Colours ──────────────────────────────────────────────────────────────────

function normalizeHex(hex: string): string {
  if (hex.length === 4) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return hex.toLowerCase();
}

function isBoringColor(hex: string): boolean {
  const h = normalizeHex(hex);
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const saturation = max === min ? 0 : (max - min) / (lightness < 0.5 ? max + min : 510 - max - min);
  return lightness < 0.07 || lightness > 0.93 || saturation < 0.12;
}

// CSS custom properties that strongly hint at brand colours
const BRAND_VAR_HINTS = /--(?:brand|primary|accent|secondary|main|highlight|cta|button|hero|feature|key)/i;

function extractColors(html: string, externalCss: string): string[] {
  const brandColors = new Map<string, number>(); // from brand CSS vars
  const allColors = new Map<string, number>();   // everything else

  const addColor = (hex: string, isBrand = false) => {
    const n = normalizeHex(hex);
    if (!isBoringColor(n)) {
      if (isBrand) brandColors.set(n, (brandColors.get(n) ?? 0) + 2);
      allColors.set(n, (allColors.get(n) ?? 0) + 1);
    }
  };

  // theme-color — highest signal
  const themeColor = extractMeta(html, "theme-color");
  if (themeColor?.startsWith("#")) addColor(themeColor, true);

  const allCss = [
    ...[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((x) => x[1]),
    externalCss,
  ].join("\n");

  // CSS custom properties — parse brand-hinting ones with high priority
  const varRegex = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g;
  let m;
  while ((m = varRegex.exec(allCss)) !== null) {
    addColor(m[2], BRAND_VAR_HINTS.test(m[1]));
  }

  // All hex values
  const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  while ((m = hexRegex.exec(allCss)) !== null) {
    addColor(`#${m[1]}`);
  }

  // Merge: brand vars first, then by frequency
  const merged = new Map<string, number>();
  for (const [hex, score] of brandColors) merged.set(hex, score);
  for (const [hex, freq] of allColors) merged.set(hex, (merged.get(hex) ?? 0) + freq);

  return Array.from(merged.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);
}

// ─── Languages ────────────────────────────────────────────────────────────────

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

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const normalised = url.startsWith("http") ? url : `https://${url}`;
  let origin: string;
  try { origin = new URL(normalised).origin; } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let html = "";
  try {
    const res = await fetch(normalised, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Could not reach this website" }, { status: 502 });
  }

  // Fetch external CSS concurrently with response prep
  const externalCss = await fetchLinkedCss(html, origin);

  return NextResponse.json({
    domain: new URL(normalised).hostname.replace(/^www\./, ""),
    logo: extractLogo(html, origin),
    images: extractImages(html, origin),
    fonts: extractFonts(html, externalCss),
    colors: extractColors(html, externalCss),
    languages: extractLanguages(html),
  });
}
