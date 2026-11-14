import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, SUPABASE_CONFIG_ERROR } from "@/lib/supabase/config";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error(SUPABASE_CONFIG_ERROR);

  return createBrowserClient(
    config.url,
    config.anonKey,
  );
}
