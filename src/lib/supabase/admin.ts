import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SupabaseConfigurationError } from "@/lib/ai/errors";
import { getSupabaseConfig, isSupabaseAdminKey } from "@/lib/supabase/config";

export function createAdminClient() {
  const config = getSupabaseConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !isSupabaseAdminKey(secretKey)) throw new SupabaseConfigurationError("Secure assessment grading is not configured correctly.");
  return createSupabaseClient(config.url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
