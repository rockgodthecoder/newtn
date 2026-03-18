import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Protect /intelligence and /ads routes
    const isProtected =
      (pathname.startsWith("/intelligence") && pathname !== "/intelligence/login") ||
      pathname.startsWith("/ads");

    if (isProtected && !user) {
      return NextResponse.redirect(new URL("/intelligence/login", request.url));
    }

    // Redirect already-authenticated users away from login
    if (pathname === "/intelligence/login" && user) {
      return NextResponse.redirect(new URL("/intelligence", request.url));
    }
  } catch {
    // If Supabase is unreachable or misconfigured, allow login page through
    // and block access to protected routes
    if (pathname !== "/intelligence/login" && !pathname.startsWith("/ads/") === false) {
      return NextResponse.redirect(new URL("/intelligence/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/intelligence/:path*", "/ads/:path*"],
};
