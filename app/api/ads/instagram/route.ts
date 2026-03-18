import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.replace(/^@/, "").replace(/\/$/, "").trim();
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "x-ig-app-id": "936619743392459",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.instagram.com/",
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: AbortSignal.timeout(12000),
      }
    );

    if (res.status === 404) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (res.status === 401 || res.status === 403) return NextResponse.json({ error: "Account is private" }, { status: 403 });
    if (!res.ok) return NextResponse.json({ error: "Could not fetch Instagram profile" }, { status: res.status });

    const json = await res.json() as {
      data?: {
        user?: {
          full_name?: string;
          biography?: string;
          profile_pic_url_hd?: string;
          edge_owner_to_timeline_media?: {
            edges?: Array<{
              node: {
                id: string;
                display_url: string;
                is_video: boolean;
                edge_media_to_caption?: { edges?: Array<{ node: { text: string } }> };
                taken_at_timestamp?: number;
                edge_liked_by?: { count: number };
                edge_media_preview_comment?: { count: number };
              };
            }>;
          };
        };
      };
    };

    const profile = json?.data?.user;
    if (!profile) return NextResponse.json({ error: "Profile data not available" }, { status: 404 });

    const posts = (profile.edge_owner_to_timeline_media?.edges ?? []).map(({ node }) => ({
      id: node.id,
      image_url: node.display_url,
      is_video: node.is_video,
      caption: node.edge_media_to_caption?.edges?.[0]?.node?.text ?? "",
      likes: node.edge_liked_by?.count ?? 0,
      comments: node.edge_media_preview_comment?.count ?? 0,
      timestamp: node.taken_at_timestamp ?? 0,
    }));

    return NextResponse.json({
      username,
      full_name: profile.full_name ?? username,
      bio: profile.biography ?? "",
      avatar: profile.profile_pic_url_hd ?? "",
      posts,
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach Instagram" }, { status: 502 });
  }
}
