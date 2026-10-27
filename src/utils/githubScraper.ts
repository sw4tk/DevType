import { SnippetItem, LANGUAGES, SnippetLength } from '@/constants/languages';
import { synthesizeUnlimitedSnippet, pickCoachSnippet, CorpusEntry } from '@/utils/codeSynthesizer';
import corpusData from '../../data/corpus.json';

const SEEN_HASHES_STORAGE_KEY = 'dt_seen_hashes_v3';

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

// Retrieve from Corpus
export function getInstantUnseenSnippet(
  langId: string,
  lengthMode: SnippetLength = 'medium'
): SnippetItem {
  const spec = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];
  
  if (!spec.enabled) {
    throw new Error(`Cannot generate snippet for disabled language: ${spec.name}`);
  }

  if (lengthMode === 'beginner') {
    return synthesizeUnlimitedSnippet(langId, 'beginner');
  }

  const candidates = (corpusData as { langId: string; tier: string; code: string; path: string; repo: string; license: string }[]).filter(c => c.langId === langId && c.tier === lengthMode);
  
  if (candidates.length === 0) {
    // Honest Empty State Fallback
    return {
      langId: spec.id,
      label: spec.name,
      filename: 'no_corpus_data.ts',
      badge: 'EMPTY CORPUS',
      category: spec.category,
      code: `// No ${lengthMode} snippets found in data/corpus.json for ${spec.name}.\n// Run scripts/build-corpus.ts to fetch real open-source code.`,
      difficulty: 'medium',
      sourceType: 'synthetic'
    };
  }

  // Shuffle and pick unseen
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  for (const candidate of shuffled) {
    if (isSnippetUnseen(candidate.code)) {
      markSnippetAsSeen(candidate.code);
      return {
        langId: spec.id,
        label: spec.name,
        filename: candidate.path.split('/').pop() || `${candidate.repo}.${spec.ext}`,
        badge: `${candidate.repo} • ${candidate.license}`,
        category: spec.category,
        code: candidate.code,
        difficulty: lengthMode === 'long' ? 'hard' : lengthMode === 'medium' ? 'medium' : 'easy',
        sourceType: 'github'
      };
    }
  }

  // Fallback: pick randomly if all are seen
  const fallback = shuffled[0];
  return {
    langId: spec.id,
    label: spec.name,
    filename: fallback.path.split('/').pop() || `${fallback.repo}.${spec.ext}`,
    badge: `${fallback.repo} • ${fallback.license}`,
    category: spec.category,
    code: fallback.code,
    difficulty: lengthMode === 'long' ? 'hard' : lengthMode === 'medium' ? 'medium' : 'easy',
    sourceType: 'github'
  };
}

export async function getNextCorpusSnippet(
  langId: string,
  lengthMode: SnippetLength = 'medium'
): Promise<SnippetItem | null> {
  return getInstantUnseenSnippet(langId, lengthMode);
}

export function getWeakSpotsSnippet(
  langId: string,
  lengthMode: SnippetLength = 'medium',
  missedKeys: Record<string, number> = {},
  weakPatterns: Record<string, number> = {}
): SnippetItem {
  const spec = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];
  if (!spec.enabled) {
    throw new Error(`Cannot generate snippet for disabled language: ${spec.name}`);
  }

  const effectiveTier: SnippetLength = lengthMode === 'beginner' ? 'short' : lengthMode;
  const langSnippets = (corpusData as CorpusEntry[]).filter((c) => c.langId === langId);

  const chosen = pickCoachSnippet(
    langSnippets,
    missedKeys,
    weakPatterns,
    effectiveTier,
    isSnippetUnseen
  );

  markSnippetAsSeen(chosen.code);
  return chosen;
}
