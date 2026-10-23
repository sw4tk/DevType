import { SnippetItem, LANGUAGES, SnippetLength } from '@/constants/languages';
import { sanitizeAndChunkCode, synthesizeUnlimitedSnippet } from '@/utils/codeSynthesizer';
import { getSupabaseCredentials, pushCorpusBatchToSupabase } from '@/utils/supabaseClient';

const SEEN_HASHES_STORAGE_KEY = 'dt_seen_hashes_v2';
const CORPUS_CACHE_STORAGE_KEY = 'dt_corpus_buffer_v2';

export const GITHUB_CORPUS_SOURCES: Record<string, string[]> = {
  typescript: [
    'https://raw.githubusercontent.com/colinhacks/zod/main/packages/zod/src/v3/types.ts',
    'https://raw.githubusercontent.com/pmndrs/zustand/main/src/vanilla.ts',
    'https://raw.githubusercontent.com/TanStack/query/main/packages/query-core/src/queryCache.ts',
    'https://raw.githubusercontent.com/Remotion-dev/remotion/main/packages/core/src/interpolate.ts',
  ],
  javascript: [
    'https://raw.githubusercontent.com/facebook/react/main/packages/scheduler/src/forks/Scheduler.js',
    'https://raw.githubusercontent.com/axios/axios/v1.x/lib/core/Axios.js',
  ],
  rust: [
    'https://raw.githubusercontent.com/tokio-rs/tokio/master/tokio/src/sync/Notify.rs',
    'https://raw.githubusercontent.com/serde-rs/json/master/src/value/mod.rs',
  ],
  python: [
    'https://raw.githubusercontent.com/tiangolo/fastapi/master/fastapi/routing.py',
    'https://raw.githubusercontent.com/psf/requests/main/src/requests/models.py',
  ],
  go: [
    'https://raw.githubusercontent.com/gin-gonic/gin/master/gin.go',
    'https://raw.githubusercontent.com/gorilla/websocket/main/conn.go',
  ],
  cpp: [
    'https://raw.githubusercontent.com/nlohmann/json/develop/single_include/nlohmann/json_fwd.hpp',
  ],
  c: [
    'https://raw.githubusercontent.com/redis/redis/unstable/src/sds.c',
  ],
};

const snippetQueueByLang: Record<string, SnippetItem[]> = {};

export function quickHash(str: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h.toString(16);
}

function getPersistentSeenHashes(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_HASHES_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markSnippetAsSeen(code: string): boolean {
  const hash = quickHash(code);
  if (typeof window === 'undefined') return true;
  try {
    const seen = getPersistentSeenHashes();
    if (seen.has(hash)) return false;
    seen.add(hash);
    const arr = Array.from(seen).slice(-5000);
    localStorage.setItem(SEEN_HASHES_STORAGE_KEY, JSON.stringify(arr));
    return true;
  } catch {
    return true;
  }
}

export function isSnippetUnseen(code: string): boolean {
  const seen = getPersistentSeenHashes();
  return !seen.has(quickHash(code));
}

function getCachedCorpusByLang(langId: string): SnippetItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CORPUS_CACHE_STORAGE_KEY}_${langId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedCorpusByLang(langId: string, items: SnippetItem[]) {
  if (typeof window === 'undefined' || items.length === 0) return;
  try {
    const existing = getCachedCorpusByLang(langId);
    const merged = [...existing, ...items].slice(-80);
    localStorage.setItem(`${CORPUS_CACHE_STORAGE_KEY}_${langId}`, JSON.stringify(merged));
  } catch {}
}

async function fetchFromSupabaseCorpus(langId: string): Promise<SnippetItem[]> {
  const { url, key, configured } = getSupabaseCredentials();
  if (!configured) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/code_corpus?lang_id=eq.${langId}&limit=50`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const spec = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];
    return rows.map((r: any) => ({
      langId: spec.id,
      label: spec.name,
      filename: r.filename || `corpus.${spec.ext}`,
      badge: `SUPABASE DB • ${r.repo_source || spec.badge}`,
      category: spec.category,
      code: r.code,
    }));
  } catch {
    return [];
  }
}

export async function harvestGitHubCorpusForLanguage(
  langId: string,
  syncToSupabase = true
): Promise<SnippetItem[]> {
  const urls = GITHUB_CORPUS_SOURCES[langId];
  const spec = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];

  // If no GitHub URLs for this language, seed 12 diverse procedural snippets into Supabase
  if (!urls || urls.length === 0) {
    const synthBatch: SnippetItem[] = [];
    for (let i = 0; i < 12; i++) {
      synthBatch.push(synthesizeUnlimitedSnippet(langId, 'medium'));
    }
    if (syncToSupabase) {
      await pushCorpusBatchToSupabase(
        synthBatch.map((item) => ({
          lang_id: langId,
          repo_source: 'devtype/synthesizer',
          filename: item.filename,
          code: item.code,
          line_count: item.code.split('\n').length,
          hash: quickHash(item.code),
        }))
      );
    }
    return synthBatch;
  }

  const targetUrl = urls[Math.floor(Math.random() * urls.length)];
  const repoMatch = targetUrl.match(/githubusercontent\.com\/([^/]+\/[^/]+)/);
  const repoName = repoMatch ? repoMatch[1] : 'github/oss';
  const rawFilename = targetUrl.split('/').pop() || `source.${spec.ext}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) return [];
    const rawText = await res.text();
    const chunks = sanitizeAndChunkCode(rawText, true);

    const items: SnippetItem[] = chunks.map((codeChunk, idx) => ({
      langId: spec.id,
      label: spec.name,
      filename: `${rawFilename}:L${idx * 10 + 1}`,
      badge: `GH • ${repoName}`,
      category: spec.category,
      code: codeChunk,
    }));

    saveCachedCorpusByLang(langId, items);

    if (syncToSupabase && items.length > 0) {
      await pushCorpusBatchToSupabase(
        items.slice(0, 35).map((item) => ({
          lang_id: langId,
          repo_source: repoName,
          filename: item.filename,
          code: item.code,
          line_count: item.code.split('\n').length,
          hash: quickHash(item.code),
        }))
      );
    }

    return items;
  } catch {
    return [];
  }
}

// 1-Click Bulk Seeder: Harvests GitHub + Procedural Corpus across top languages and pushes to Supabase
export async function seedSupabaseCorpusNow(): Promise<{ totalInserted: number; error?: string }> {
  const targetLangs = ['typescript', 'rust', 'python', 'go', 'javascript', 'cpp', 'sql'];
  let total = 0;
  for (const lang of targetLangs) {
    const harvested = await harvestGitHubCorpusForLanguage(lang, true);
    total += harvested.length;
  }
  return { totalInserted: total };
}

export function getInstantUnseenSnippet(
  langId: string,
  lengthMode: SnippetLength = 'medium'
): SnippetItem {
  const cached = getCachedCorpusByLang(langId);
  const unseenCached = cached.filter((item) => isSnippetUnseen(item.code));
  if (unseenCached.length > 0 && Math.random() < 0.55) {
    const chosen = unseenCached[Math.floor(Math.random() * unseenCached.length)];
    markSnippetAsSeen(chosen.code);
    return chosen;
  }

  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = synthesizeUnlimitedSnippet(langId, lengthMode);
    if (isSnippetUnseen(candidate.code)) {
      markSnippetAsSeen(candidate.code);
      return candidate;
    }
  }

  const fallback = synthesizeUnlimitedSnippet(langId, lengthMode);
  markSnippetAsSeen(fallback.code);
  return fallback;
}

export async function getNextCorpusSnippet(langId: string): Promise<SnippetItem | null> {
  if (!snippetQueueByLang[langId] || snippetQueueByLang[langId].length < 4) {
    const dbItems = await fetchFromSupabaseCorpus(langId);
    const ghItems = dbItems.length > 0 ? dbItems : await harvestGitHubCorpusForLanguage(langId, true);
    if (ghItems.length > 0) {
      for (let i = ghItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ghItems[i], ghItems[j]] = [ghItems[j], ghItems[i]];
      }
      saveCachedCorpusByLang(langId, ghItems);
      snippetQueueByLang[langId] = [...(snippetQueueByLang[langId] || []), ...ghItems];
    }
  }

  const queue = snippetQueueByLang[langId];
  if (!queue || queue.length === 0) return null;

  while (queue.length > 0) {
    const candidate = queue.pop()!;
    if (isSnippetUnseen(candidate.code)) {
      markSnippetAsSeen(candidate.code);
      return candidate;
    }
  }

  return null;
}