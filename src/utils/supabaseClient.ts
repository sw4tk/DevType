import { createClient } from '@/utils/supabase/client';
import { DeveloperUser, HistoryRecord } from '@/constants/languages';

const STORAGE_URL_KEY = 'dt_sb_url';
const STORAGE_ANON_KEY = 'dt_sb_anon_key';

function cleanSupabaseBaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1.*$/i, '')
    .replace(/\/graphql\/v1.*$/i, '');
}

export function getSupabaseCredentials(): { url: string; key: string; configured: boolean } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (envUrl && envKey) {
    return {
      url: cleanSupabaseBaseUrl(envUrl),
      key: envKey.trim().replace(/^["']|["']$/g, ''),
      configured: true,
    };
  }
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
    const localKey = localStorage.getItem(STORAGE_ANON_KEY) || '';
    if (localUrl && localKey) {
      return {
        url: cleanSupabaseBaseUrl(localUrl),
        key: localKey.trim().replace(/^["']|["']$/g, ''),
        configured: true,
      };
    }
  }
  return { url: '', key: '', configured: false };
}

export function saveSupabaseCredentialsRuntime(url: string, key: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_URL_KEY, cleanSupabaseBaseUrl(url));
  localStorage.setItem(STORAGE_ANON_KEY, key.trim());
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials().configured;
}

export async function signInWithGitHubOAuth() {
  const supabase = createClient();
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo },
  });
  return !error;
}

export async function syncSessionToCloud(
  _user: DeveloperUser | null,
  record: HistoryRecord
): Promise<{ ok: boolean; error?: string; isGuest?: boolean }> {
  if (record.wpm <= 0 || record.accuracy < 45) {
    return { ok: false, error: 'Run skipped: Accuracy below 45% integrity threshold' };
  }

  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        ok: false,
        isGuest: true,
        error: 'Guest Mode: Sign in to save your runs to the cloud',
      };
    }

    const username =
      authUser.user_metadata?.user_name ||
      authUser.user_metadata?.preferred_username ||
      authUser.email?.split('@')[0] ||
      'developer';

    const avatarUrl =
      authUser.user_metadata?.avatar_url ||
      `https://github.com/${username}.png`;

    const { error } = await supabase.from('typing_sessions').insert({
      user_id: authUser.id,
      username,
      avatar_url: avatarUrl,
      lang_id: record.langId,
      game_mode: record.gameMode || 'standard',
      wpm: Math.round(record.wpm),
      raw_wpm: Math.round(record.rawWpm || record.wpm),
      accuracy: Number(record.accuracy.toFixed(1)),
      consistency: Math.round(record.consistency || 90),
      chars: record.chars,
      duration_sec: Math.max(1, Math.round(record.durationSec || 15)),
    });

    if (error) {
      return { ok: false, error: `Supabase Error: ${error.message}` };
    }

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network connection failed',
    };
  }
}

export async function pushCorpusBatchToSupabase(
  items: {
    lang_id: string;
    repo_source: string;
    filename: string;
    code: string;
    line_count: number;
    hash: string;
  }[]
): Promise<{ ok: boolean; inserted: number; error?: string }> {
  const { url, key, configured } = getSupabaseCredentials();
  if (!configured || items.length === 0) {
    return { ok: false, inserted: 0, error: 'Not configured or empty batch' };
  }

  try {
    const uniqueMap = new Map<string, (typeof items)[0]>();
    items.forEach((item) => uniqueMap.set(item.hash, item));
    const cleanBatch = Array.from(uniqueMap.values());

    const res = await fetch(`${url}/rest/v1/code_corpus?on_conflict=hash`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(cleanBatch),
    });

    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, inserted: 0, error: `HTTP ${res.status}: ${txt.slice(0, 100)}` };
    }
    return { ok: true, inserted: cleanBatch.length };
  } catch (err: unknown) {
    return {
      ok: false,
      inserted: 0,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export async function fetchSupabaseTableStats(): Promise<{
  sessionsCount: number;
  corpusCount: number;
  error?: string;
}> {
  const { url, key, configured } = getSupabaseCredentials();
  if (!configured) return { sessionsCount: 0, corpusCount: 0, error: 'Not configured' };

  try {
    const [sessRes, corpRes] = await Promise.all([
      fetch(`${url}/rest/v1/typing_sessions?select=id&limit=1000`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      }),
      fetch(`${url}/rest/v1/code_corpus?select=id&limit=1000`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      }),
    ]);

    if (!sessRes.ok || !corpRes.ok) {
      return {
        sessionsCount: 0,
        corpusCount: 0,
        error: `HTTP ${sessRes.status}/${corpRes.status}: Run SQL schema & reload PostgREST cache`,
      };
    }

    const sessRows = await sessRes.json();
    const corpRows = await corpRes.json();
    return {
      sessionsCount: Array.isArray(sessRows) ? sessRows.length : 0,
      corpusCount: Array.isArray(corpRows) ? corpRows.length : 0,
    };
  } catch {
    return { sessionsCount: 0, corpusCount: 0, error: 'Failed to reach Supabase URL' };
  }
}
