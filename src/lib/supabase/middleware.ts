import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const protectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname.startsWith("/skills") || pathname.startsWith("/career") || pathname.startsWith("/learning") || pathname.startsWith("/roadmap") || pathname.startsWith("/mentor") || pathname.startsWith("/activity") || pathname.startsWith("/assessment") || pathname.startsWith("/insights");
  const config = getSupabaseConfig();

  if (!config) {
    if (protectedRoute) return NextResponse.redirect(new URL("/login?error=supabase-config", request.url));
    return response;
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && protectedRoute) return NextResponse.redirect(new URL("/login", request.url));
  if (user && (pathname === "/login" || pathname === "/signup")) return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}
