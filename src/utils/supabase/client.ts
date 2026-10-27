import { createBrowserClient } from '@supabase/ssr';

export function cleanSupabaseBaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1.*$/i, '')
    .replace(/\/graphql\/v1.*$/i, '');
}

export function isSupabaseConfigured(): boolean {
  const envUrl = cleanSupabaseBaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const envKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  return Boolean(envUrl && envKey);
}

export function createClient() {
  const cleanUrl = cleanSupabaseBaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const cleanKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

  return createBrowserClient(cleanUrl, cleanKey);
}
