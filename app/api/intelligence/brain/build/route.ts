export const maxDuration = 60;

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Use service role key for background functions — no cookie context needed
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function updateProgress(
  supabase: ReturnType<typeof getAdminClient>,
  brainId: string,
  pct: number,
  step: string | null
) {
  await supabase
    .from("brand_brains")
    .update({ progress_pct: pct, progress_step: step, updated_at: new Date().toISOString() })
    .eq("id", brainId);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function toPrettyName(domain: string): string {
  const name = domain.split(".")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateFakeSummary(url: string, role: string): string {
  const name = toPrettyName(extractDomain(url));
  if (role === "own") {
    return `${name} is a direct-to-consumer brand targeting lifestyle-conscious consumers aged 25–40. The website emphasises premium product quality, strong social proof through customer reviews, and a frictionless purchase experience. Core marketing channels include paid social (Meta/TikTok), email automation, and organic search. The brand positions itself on quality over price, with a clear hero product driving the majority of revenue. Post-purchase experience is a key differentiator — loyalty and referral loops are embedded throughout the funnel.`;
  }
  return `${name} operates in the same product category and targets a similar customer profile. Their digital presence leans heavily on aggressive paid advertising and influencer partnerships. They compete primarily on price point and wide product variety, with a loyalty program designed to drive repeat purchase. The brand is weaker on organic content strategy and post-purchase experience compared to category leaders, presenting a clear gap to exploit.`;
}

const FAKE_CEPS = [
  {
    title: "Seasonal Gifting",
    description: "Customer is searching for a gift for a special occasion or upcoming holiday and enters the category with gift intent.",
  },
  {
    title: "Problem Discovery",
    description: "Customer has just become aware of a specific pain point that this product category directly solves for them.",
  },
  {
    title: "Social Proof Moment",
    description: "Customer encountered the brand via a friend recommendation, influencer post, or organic social content.",
  },
  {
    title: "Active Comparison",
    description: "Customer is in active research mode, comparing this brand against 2–3 alternatives before making a decision.",
  },
  {
    title: "Repurchase Trigger",
    description: "Existing customer is running low and is re-entering the category to repurchase — loyalty and familiarity drive this entry.",
  },
  {
    title: "Trend Adoption",
    description: "The product category is having a cultural moment and the customer wants to participate in the trend.",
  },
];

const FAKE_TRIGGER_POINTS = [
  {
    title: "Price Justification",
    description: "Customer questions whether the price is worth it compared to a cheaper alternative — needs clear value articulation.",
  },
  {
    title: "First-Visit Trust Gap",
    description: "New visitor hasn't seen enough proof of brand legitimacy or product quality to feel confident purchasing.",
  },
  {
    title: "Fit Uncertainty",
    description: "Customer isn't sure the product will work for their specific situation, body type, or use case.",
  },
  {
    title: "Checkout Hesitation",
    description: "Cart is loaded but customer stalls before entering payment details — often due to second thoughts or distraction.",
  },
  {
    title: "Return Policy Doubt",
    description: "Customer is concerned about what happens if the product doesn't meet expectations — unclear returns kill conversions.",
  },
  {
    title: "Competitive Pull",
    description: "Customer is being retargeted by a competitor mid-consideration and risks being pulled away from this brand.",
  },
];

async function buildBrain(
  brainId: string,
  brands: Array<{ id: string; url: string; role: string }>
) {
  const supabase = getAdminClient();

  try {
    await updateProgress(supabase, brainId, 10, "Initialising brain…");
    await sleep(800);

    const ownBrand = brands.find((b) => b.role === "own");
    const competitors = brands.filter((b) => b.role === "competitor");

    if (ownBrand) {
      await updateProgress(supabase, brainId, 30, `Analysing ${extractDomain(ownBrand.url)}…`);
      await sleep(1400);
      await supabase.from("brain_brands").update({
        summary: generateFakeSummary(ownBrand.url, "own"),
        ceps: FAKE_CEPS,
        trigger_points: FAKE_TRIGGER_POINTS,
        status: "complete",
      }).eq("id", ownBrand.id);
    }

    for (let i = 0; i < competitors.length; i++) {
      const comp = competitors[i];
      const pct = 55 + i * 20;
      await updateProgress(supabase, brainId, pct, `Analysing competitor: ${extractDomain(comp.url)}…`);
      await sleep(1200);
      await supabase.from("brain_brands").update({
        summary: generateFakeSummary(comp.url, "competitor"),
        ceps: FAKE_CEPS.slice(0, 4),
        trigger_points: FAKE_TRIGGER_POINTS.slice(0, 4),
        status: "complete",
      }).eq("id", comp.id);
    }

    await updateProgress(supabase, brainId, 95, "Finalising insights…");
    await sleep(600);

    await supabase
      .from("brand_brains")
      .update({ status: "complete", progress_pct: 100, progress_step: null, updated_at: new Date().toISOString() })
      .eq("id", brainId);
  } catch (err) {
    console.error("Brain build failed:", err);
    await supabase
      .from("brand_brains")
      .update({ status: "failed", progress_step: "Build failed. Please delete and try again.", updated_at: new Date().toISOString() })
      .eq("id", brainId);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { own_url, competitor_urls } = await request.json() as {
    own_url: string;
    competitor_urls: string[];
  };

  if (!own_url) return NextResponse.json({ error: "Brand URL is required" }, { status: 400 });

  // Delete any existing brain first
  const { data: existing } = await supabase
    .from("brand_brains")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("brand_brains").delete().eq("id", existing.id);
  }

  // Create brain
  const { data: brain, error } = await supabase
    .from("brand_brains")
    .insert({ user_id: user.id, status: "building", progress_pct: 0 })
    .select()
    .single();

  if (error || !brain) {
    return NextResponse.json({ error: "Failed to create brain" }, { status: 500 });
  }

  // Create brand records
  const brandInserts = [
    { brain_id: brain.id, url: own_url, role: "own", position: 0 },
    ...competitor_urls
      .filter((u) => u.trim())
      .slice(0, 2)
      .map((url, i) => ({ brain_id: brain.id, url, role: "competitor", position: i + 1 })),
  ];

  const { data: brands } = await supabase
    .from("brain_brands")
    .insert(brandInserts)
    .select();

  waitUntil(buildBrain(brain.id, brands ?? []));

  return NextResponse.json({ id: brain.id }, { status: 202 });
}
