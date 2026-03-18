import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { stage_description } = body;

  if (!stage_description || stage_description.length < 5 || stage_description.length > 500) {
    return NextResponse.json({ error: "stage_description must be 5–500 characters" }, { status: 400 });
  }

  const { data: map } = await supabase
    .from("journey_maps")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!map) return NextResponse.json({ error: "No journey map found" }, { status: 404 });
  if (map.status !== "complete") {
    return NextResponse.json({ error: "Cannot add nodes while map is building" }, { status: 409 });
  }

  const { data: existingNodes } = await supabase
    .from("journey_nodes")
    .select("*")
    .eq("journey_map_id", map.id)
    .order("position", { ascending: true });

  const prompt = `You are an expert ecommerce strategist. A user wants to add a new stage to their customer journey map.

Existing journey stages (in order):
${(existingNodes ?? []).map((n: { position: number; title: string }) => `${n.position}. ${n.title}`).join("\n")}

New stage requested: "${stage_description}"

Generate the new node and determine the best position to insert it within the existing journey.

Return a JSON object:
{
  "title": "Stage name (2-5 words)",
  "position": <integer — where it fits best in the existing sequence>,
  "explanation": "2-4 sentences explaining what happens at this stage and why it matters.",
  "tactics": ["Specific actionable tactic 1", "tactic 2", "tactic 3", "tactic 4", "tactic 5"]
}

Return ONLY valid JSON.`;

  const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://newtn-nine.vercel.app",
      "X-Title": "Newtn Intelligence",
    },
    body: JSON.stringify({
      model: "anthropic/claude-opus-4-5",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    }),
  });

  const aiData = await aiResponse.json();
  let newNode;
  try {
    const raw = aiData.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
    newNode = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "AI returned invalid data" }, { status: 500 });
  }

  const insertPosition = newNode.position;

  // Shift existing nodes at or after insertion point
  const nodesToShift = (existingNodes ?? []).filter((n: { position: number }) => n.position >= insertPosition);
  for (const node of nodesToShift) {
    await supabase
      .from("journey_nodes")
      .update({ position: node.position + 1 })
      .eq("id", node.id);
  }

  const { data: inserted } = await supabase
    .from("journey_nodes")
    .insert({
      journey_map_id: map.id,
      title: newNode.title,
      position: insertPosition,
      explanation: newNode.explanation,
      tactics: newNode.tactics,
    })
    .select()
    .single();

  return NextResponse.json(inserted, { status: 201 });
}
