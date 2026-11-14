import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig, SUPABASE_CONFIG_ERROR } from "@/lib/supabase/config";

export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error(SUPABASE_CONFIG_ERROR);

  const cookieStore = await cookies();
  return createServerClient(
    config.url,
    config.anonKey,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot write cookies. */ }
        },
      },
    },
  );
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
