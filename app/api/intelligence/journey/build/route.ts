export const maxDuration = 300;

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-opus-4-5";
const HEADERS = {
  "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "https://newtn-nine.vercel.app",
  "X-Title": "Newtn Intelligence",
};

async function callAI(prompt: string, temperature: number): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned);
}

async function scrapeWebsite(url: string): Promise<string> {
  const normalize = (u: string) => u.startsWith("http") ? u : `https://${u}`;
  const baseUrl = normalize(url);
  const origin = new URL(baseUrl).origin;

  // Fetch homepage
  const homepageRes = await fetch(baseUrl, { signal: AbortSignal.timeout(10000) });
  const homepageHtml = await homepageRes.text();

  // Extract internal links
  const linkRegex = /href=["']([^"'#?]+)["']/g;
  const links = new Set<string>();
  let match;
  while ((match = linkRegex.exec(homepageHtml)) !== null) {
    const href = match[1];
    try {
      const absolute = href.startsWith("http") ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
      const linkUrl = new URL(absolute);
      if (linkUrl.origin === origin && !href.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico|xml|zip)$/i)) {
        links.add(absolute);
      }
    } catch { /* invalid url, skip */ }
  }

  const pagesToFetch = Array.from(links).slice(0, 19);

  // Fetch all pages in parallel
  const pageResults = await Promise.allSettled(
    pagesToFetch.map(async (pageUrl) => {
      const res = await fetch(pageUrl, { signal: AbortSignal.timeout(10000) });
      const html = await res.text();
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
      return `\n\n--- Page: ${pageUrl} ---\n${text}`;
    })
  );

  const homepageText = homepageHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
  let combined = `--- Page: ${baseUrl} ---\n${homepageText}`;

  for (const result of pageResults) {
    if (result.status === "fulfilled") combined += result.value;
  }

  return combined;
}

async function updateProgress(supabase: Awaited<ReturnType<typeof createClient>>, mapId: string, pct: number, step: string) {
  await supabase
    .from("journey_maps")
    .update({ progress_pct: pct, progress_step: step, updated_at: new Date().toISOString() })
    .eq("id", mapId);
}

async function buildJourney(mapId: string, url: string, description: string) {
  const supabase = await createClient();

  try {
    // Step 1: Scrape
    await updateProgress(supabase, mapId, 5, "Scraping website content…");
    const scrapedContent = await scrapeWebsite(url);
    await updateProgress(supabase, mapId, 20, "Website scraped — analyzing brand…");

    // Step 2: Business analysis
    const analysisPrompt = `You are an expert ecommerce strategist. Analyze the following website content and brand description.

Brand URL: ${url}
Brand Description: ${description}

Scraped Website Content:
${scrapedContent.slice(0, 15000)}

Output a JSON object with these fields:
- business_type: string (e.g. "DTC skincare brand", "B2B SaaS", "marketplace")
- target_audience: string (who their customer is)
- product_summary: string (what they sell)
- key_channels: string[] (marketing channels visible from the site)
- brand_tone: string (e.g. "premium", "playful", "clinical")
- funnel_complexity: "simple" | "moderate" | "complex"

Return ONLY valid JSON.`;

    const analysisRaw = await callAI(analysisPrompt, 0.3);
    const businessProfile = parseJSON<Record<string, unknown>>(analysisRaw);
    await updateProgress(supabase, mapId, 40, "Brand analyzed — building journey stages…");

    // Step 3: Journey architecture
    const architecturePrompt = `You are an expert customer journey strategist. Based on this brand profile, design a detailed customer journey map.

Brand Profile:
${JSON.stringify(businessProfile, null, 2)}

Brand URL: ${url}
Brand Description: ${description}

Create a comprehensive customer journey with 20-28 stages. Each stage is a specific touchpoint or moment in the customer's experience, from first awareness through post-purchase retention and advocacy.

Be highly specific to this brand — reference their actual channels, products, and audience. Do not use generic stage names.

Output a JSON array of stages:
[
  {
    "title": "Stage name (short, 2-5 words)",
    "position": 0,
    "category": "awareness|consideration|conversion|retention|advocacy"
  }
]

Positions start at 0 and increment by 1. Return ONLY valid JSON.`;

    const architectureRaw = await callAI(architecturePrompt, 0.4);
    const stageOutlines = parseJSON<Array<{ title: string; position: number; category: string }>>(architectureRaw);
    await updateProgress(supabase, mapId, 60, "Journey stages built — generating details…");

    // Step 4: Node detail generation in batches of 5
    const batchSize = 5;
    const allNodes: Array<{ title: string; position: number; category: string; explanation: string; tactics: string[] }> = [];
    const batches = [];
    for (let i = 0; i < stageOutlines.length; i += batchSize) {
      batches.push(stageOutlines.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPrompt = `You are an expert ecommerce strategist. For each of the following customer journey stages, generate detailed content specific to this brand.

Brand Profile:
${JSON.stringify(businessProfile, null, 2)}

Stages to detail:
${JSON.stringify(batch, null, 2)}

For each stage, output a JSON object with:
- position: <same as input>
- title: <same as input>
- category: <same as input>
- explanation: "2-4 sentences explaining what happens at this stage, why it matters, and what the customer is thinking/feeling."
- tactics: ["Specific actionable tactic 1", "tactic 2", "tactic 3", "tactic 4", "tactic 5", "tactic 6"]

Be specific to this brand. Return a JSON array of the detailed stages. Return ONLY valid JSON.`;

      const batchRaw = await callAI(batchPrompt, 0.5);
      const batchNodes = parseJSON<Array<{ title: string; position: number; category: string; explanation: string; tactics: string[] }>>(batchRaw);
      allNodes.push(...batchNodes);

      const pct = 60 + Math.round(((i + 1) / batches.length) * 35);
      await updateProgress(supabase, mapId, pct, `Detailing stage ${Math.min((i + 1) * batchSize, stageOutlines.length)} of ${stageOutlines.length}…`);
    }

    // Step 5: Save nodes
    await updateProgress(supabase, mapId, 97, "Saving your journey map…");
    const nodeInserts = allNodes.map((n) => ({
      journey_map_id: mapId,
      title: n.title,
      position: n.position,
      explanation: n.explanation,
      tactics: n.tactics,
    }));
    await supabase.from("journey_nodes").insert(nodeInserts);

    await supabase
      .from("journey_maps")
      .update({ status: "complete", progress_pct: 100, progress_step: null, updated_at: new Date().toISOString() })
      .eq("id", mapId);

  } catch (err) {
    console.error("Journey build failed:", err);
    await supabase
      .from("journey_maps")
      .update({
        status: "failed",
        progress_step: "Build failed. Please delete and try again.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", mapId);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { url, description } = body;

  // Validate
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "URL must start with http:// or https://" }, { status: 400 });
  }
  if (!description || description.length < 10 || description.length > 2000) {
    return NextResponse.json({ error: "Description must be 10–2000 characters" }, { status: 400 });
  }

  // Check for existing map
  const { data: existing } = await supabase
    .from("journey_maps")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "A journey map already exists. Delete it before creating a new one." },
      { status: 409 }
    );
  }

  // Create map record
  const { data: map, error } = await supabase
    .from("journey_maps")
    .insert({ user_id: user.id, url, description, status: "building", progress_pct: 0 })
    .select()
    .single();

  if (error || !map) {
    return NextResponse.json({ error: "Failed to create journey map" }, { status: 500 });
  }

  // Run build pipeline (async — does not block response)
  buildJourney(map.id, url, description);

  return NextResponse.json({ id: map.id }, { status: 202 });
}
