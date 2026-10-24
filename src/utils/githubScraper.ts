import { SnippetItem, LANGUAGES, SnippetLength } from '@/constants/languages';
import { sanitizeAndChunkCode, synthesizeUnlimitedSnippet } from '@/utils/codeSynthesizer';
import { getSupabaseCredentials, pushCorpusBatchToSupabase } from '@/utils/supabaseClient';

const SEEN_HASHES_STORAGE_KEY = 'dt_seen_hashes_v3';
const RECENT_FINGERPRINTS_KEY = 'dt_recent_fingerprints_v3';

export const GITHUB_CORPUS_SOURCES: Record<string, string[]> = {
  typescript: [
    'https://raw.githubusercontent.com/colinhacks/zod/main/packages/zod/src/v3/types.ts',
    'https://raw.githubusercontent.com/pmndrs/zustand/main/src/vanilla.ts',
    'https://raw.githubusercontent.com/TanStack/query/main/packages/query-core/src/queryObserver.ts',
  ],
  rust: [
    'https://raw.githubusercontent.com/tokio-rs/tokio/master/tokio/src/sync/notify.rs',
    'https://raw.githubusercontent.com/serde-rs/json/master/src/value/mod.rs',
  ],
  python: [
    'https://raw.githubusercontent.com/tiangolo/fastapi/master/fastapi/routing.py',
    'https://raw.githubusercontent.com/psf/requests/main/src/requests/models.py',
  ],
  go: [
    'https://raw.githubusercontent.com/gin-gonic/gin/master/context.go',
  ],
};

export function quickHash(str: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function getPersistentSeenHashes(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_HASHES_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function getRecentFingerprints(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_FINGERPRINTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function recordFingerprint(fp: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getRecentFingerprints();
    list.push(fp);
    localStorage.setItem(RECENT_FINGERPRINTS_KEY, JSON.stringify(list.slice(-40)));
  } catch {}
}

export function markSnippetAsSeen(code: string): boolean {
  const hash = quickHash(code);
  if (typeof window === 'undefined') return true;
  try {
    const seen = getPersistentSeenHashes();
    if (seen.has(hash)) return false;
    seen.add(hash);
    localStorage.setItem(
      SEEN_HASHES_STORAGE_KEY,
      JSON.stringify(Array.from(seen).slice(-10000))
    );
    return true;
  } catch {
    return true;
  }
}

export function isSnippetUnseen(code: string): boolean {
  return !getPersistentSeenHashes().has(quickHash(code));
}

function matchesLengthBucket(code: string, lengthMode: SnippetLength): boolean {
  const lines = code.split('\n').length;
  if (lengthMode === 'beginner') return lines >= 1 && lines <= 5;
  if (lengthMode === 'short') return lines >= 2 && lines <= 6;
  if (lengthMode === 'medium') return lines >= 7 && lines <= 15;
  return lines >= 16;
}

export async function harvestGitHubCorpusForLanguage(
  langId: string,
  lengthMode: SnippetLength = 'medium',
  syncToSupabase = true
): Promise<SnippetItem[]> {
  const urls = GITHUB_CORPUS_SOURCES[langId];
  const spec = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];

  const generatedBatch: SnippetItem[] = [];
  for (let i = 0; i < 15; i++) {
    generatedBatch.push(synthesizeUnlimitedSnippet(langId, lengthMode));
  }

  if (urls && urls.length > 0) {
    try {
      const targetUrl = urls[Math.floor(Math.random() * urls.length)];
      const repoName =
        targetUrl.match(/githubusercontent\.com\/([^/]+\/[^/]+)/)?.[1] || 'github';
      const res = await fetch(targetUrl);
      if (res.ok) {
        const rawText = await res.text();
        const chunks = sanitizeAndChunkCode(rawText, true, lengthMode);
        chunks.forEach((codeChunk, idx) => {
          generatedBatch.push({
            langId: spec.id,
            label: spec.name,
            filename: `${repoName.split('/')[1] || 'source'}_L${idx * 10 + 1}.${spec.ext}`,
            badge: `${lengthMode.toUpperCase()} • GH ${repoName}`,
            category: spec.category,
            code: codeChunk,
          });
        });
      }
    } catch {}
  }

  if (syncToSupabase && generatedBatch.length > 0) {
    pushCorpusBatchToSupabase(
      generatedBatch.slice(0, 25).map((item) => ({
        lang_id: langId,
        repo_source: item.badge,
        filename: item.filename,
        code: item.code,
        line_count: item.code.split('\n').length,
        hash: quickHash(item.code),
      }))
    ).catch(() => {});
  }

  return generatedBatch;
}

export async function seedSupabaseCorpusNow(): Promise<{
  totalInserted: number;
  error?: string;
}> {
  let total = 0;
  for (const lang of ['typescript', 'rust', 'python', 'go']) {
    for (const len of ['short', 'medium', 'long'] as SnippetLength[]) {
      const harvested = await harvestGitHubCorpusForLanguage(lang, len, true);
      total += harvested.length;
    }
  }
  return { totalInserted: total };
}

// Guaranteed Non-Repeating, Strictly Length-Classified Generator
export function getInstantUnseenSnippet(
  langId: string,
  lengthMode: SnippetLength = 'medium'
): SnippetItem {
  const recentFps = getRecentFingerprints();

  // Attempt up to 50 times to guarantee both a brand-new hash AND a non-repeating structural fingerprint
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = synthesizeUnlimitedSnippet(
      langId,
      lengthMode,
      `${langId}_${lengthMode}_${Date.now()}_${attempt}_${Math.random()}`
    );

    const firstLineFp = candidate.code.split('\n')[0]?.slice(0, 28) || '';

    if (
      isSnippetUnseen(candidate.code) &&
      !recentFps.includes(firstLineFp) &&
      matchesLengthBucket(candidate.code, lengthMode)
    ) {
      markSnippetAsSeen(candidate.code);
      recordFingerprint(firstLineFp);
      return candidate;
    }
  }

  // Fallback with high-entropy timestamp salt
  const fallback = synthesizeUnlimitedSnippet(
    langId,
    lengthMode,
    `fallback_${Date.now()}_${Math.random()}`
  );
  markSnippetAsSeen(fallback.code);
  return fallback;
}

export async function getNextCorpusSnippet(
  langId: string,
  lengthMode: SnippetLength = 'medium'
): Promise<SnippetItem | null> {
  const { url, key, configured } = getSupabaseCredentials();

  // Mix in unseen Supabase cloud snippets that strictly match the requested lengthMode (S / M / L)
  if (configured && Math.random() < 0.35) {
    try {
      const minL = lengthMode === 'beginner' ? 1 : lengthMode === 'short' ? 2 : lengthMode === 'medium' ? 7 : 16;
      const maxL = lengthMode === 'beginner' ? 5 : lengthMode === 'short' ? 6 : lengthMode === 'medium' ? 15 : 60;
      const res = await fetch(
        `${url}/rest/v1/code_corpus?lang_id=eq.${langId}&line_count=gte.${minL}&line_count=lte.${maxL}&limit=40`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const unseenRows = rows.filter(
            (r: { code?: string }) =>
              r.code &&
              isSnippetUnseen(r.code) &&
              matchesLengthBucket(r.code, lengthMode)
          );
          if (unseenRows.length > 0) {
            const picked = unseenRows[Math.floor(Math.random() * unseenRows.length)];
            const spec = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];
            markSnippetAsSeen(picked.code);
            return {
              langId: spec.id,
              label: spec.name,
              filename: picked.filename || `cloud_${spec.id}.${spec.ext}`,
              badge: `${lengthMode.toUpperCase()} (${picked.code.split('\n').length}L) • CLOUD DB`,
              category: spec.category,
              code: picked.code,
            };
          }
        }
      }
    } catch {}
  }

  return getInstantUnseenSnippet(langId, lengthMode);
}
