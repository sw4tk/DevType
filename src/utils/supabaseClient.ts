import { DeveloperUser, HistoryRecord, SnippetItem } from '@/constants/languages';

const STORAGE_URL_KEY = 'dt_sb_url';
const STORAGE_ANON_KEY = 'dt_sb_anon_key';

export function getSupabaseCredentials(): { url: string; key: string; configured: boolean } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (envUrl && envKey) {
    return { url: envUrl.replace(/\/$/, ''), key: envKey, configured: true };
  }
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
    const localKey = localStorage.getItem(STORAGE_ANON_KEY) || '';
    if (localUrl && localKey) {
      return { url: localUrl.replace(/\/$/, ''), key: localKey, configured: true };
    }
  }
  return { url: '', key: '', configured: false };
}

export function saveSupabaseCredentialsRuntime(url: string, key: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_URL_KEY, url.trim().replace(/\/$/, ''));
  localStorage.setItem(STORAGE_ANON_KEY, key.trim());
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials().configured;
}

export function signInWithGitHubOAuth() {
  const { url, configured } = getSupabaseCredentials();
  if (!configured) return false;
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : '';
  window.location.href = `${url}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(
    redirectTo
  )}`;
  return true;
}

// Push a completed typing session to Supabase PostgreSQL (Works for both logged-in users and guests!)
export async function syncSessionToCloud(
  user: DeveloperUser | null,
  record: HistoryRecord
): Promise<{ ok: boolean; error?: string }> {
  const { url, key, configured } = getSupabaseCredentials();
  if (!configured) return { ok: false, error: 'Supabase credentials not configured' };

  // Edge Case Guard: Do not pollute cloud DB with invalid or spammed runs (<45% accuracy or 0 WPM)
  if (record.wpm <= 0 || record.accuracy < 45) {
    return { ok: false, error: 'Run below minimum integrity threshold (45% ACC)' };
  }

  try {
    const res = await fetch(`${url}/rest/v1/typing_sessions`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: user?.id || 'guest_engineer',
        username: user?.username || 'guest_dev',
        avatar_url: user?.avatarUrl || 'https://github.com/identicons/devtype.png',
        lang_id: record.langId,
        game_mode: record.gameMode || 'standard',
        wpm: Math.round(record.wpm),
        raw_wpm: Math.round(record.rawWpm || record.wpm),
        accuracy: Number(record.accuracy.toFixed(1)),
        consistency: Math.round(record.consistency || 90),
        chars: record.chars,
        duration_sec: Math.max(1, Math.round(record.durationSec || 15)),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// Bulk Upsert Code Snippets into Supabase `code_corpus` (Fixed with ?on_conflict=hash)
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
    // Deduplicate hashes within the batch itself before sending to PostgREST
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
      return { ok: false, inserted: 0, error: `HTTP ${res.status}: ${txt.slice(0, 120)}` };
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

// Inspect live row counts in your Supabase tables
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
        error: 'Tables missing — run the SQL schema in Supabase SQL Editor',
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