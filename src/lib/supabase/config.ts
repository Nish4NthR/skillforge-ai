export const SUPABASE_CONFIG_ERROR =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or the legacy NEXT_PUBLIC_SUPABASE_ANON_KEY).";

export function isSupabasePublicKey(value: string | undefined): value is string {
  return Boolean(value && (value.startsWith("sb_publishable_") || value.startsWith("eyJ")));
}

export function isSupabaseAdminKey(value: string | undefined): value is string {
  return Boolean(value && (value.startsWith("sb_secret_") || value.startsWith("eyJ")));
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}
