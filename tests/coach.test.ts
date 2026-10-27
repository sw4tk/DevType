import { describe, it, expect } from 'vitest';
import {
  scoreSnippet,
  pickCoachSnippet,
  applyMistakeTimeDecay,
  FOURTEEN_DAYS_MS,
  CorpusEntry,
} from '../src/utils/codeSynthesizer';

const MOCK_SNIPPETS: CorpusEntry[] = [
  {
    id: 'snip_arrows',
    langId: 'typescript',
    code: 'const add = (a: number, b: number) => a + b;\nconst mul = (x: number) => x * 2;\nconst fn = () => ({ ok: true });',
    repo: 'microsoft/TypeScript',
    path: 'src/arrows.ts',
    license: 'Apache-2.0',
    tier: 'short',
  },
  {
    id: 'snip_plain',
    langId: 'typescript',
    code: 'function greet(name: string): string {\n  return "Hello " + name;\n}',
    repo: 'microsoft/TypeScript',
    path: 'src/greet.ts',
    license: 'Apache-2.0',
    tier: 'short',
  },
];

describe('Weak spots Coach Mode (scoreSnippet & pickCoachSnippet)', () => {
  it('scoreSnippet scores snippets higher when they contain dense missed keys and weak patterns', () => {
    const missedKeys = { '=': 12, '>': 10, '(': 5 };
    const weakPatterns = { '=>': 8 };

    const arrowScore = scoreSnippet(MOCK_SNIPPETS[0].code, missedKeys, weakPatterns);
    const plainScore = scoreSnippet(MOCK_SNIPPETS[1].code, missedKeys, weakPatterns);

    expect(arrowScore).toBeGreaterThan(plainScore);
  });

  it('scoreSnippet normalizes by snippet length so padding does not inflate score', () => {
    const missedKeys = { ';': 10 };
    const compact = 'const a = 1;\nconst b = 2;';
    const padded = compact + '\n' + 'x'.repeat(200);

    expect(scoreSnippet(compact, missedKeys)).toBeGreaterThan(scoreSnippet(padded, missedKeys));
  });

  it('pickCoachSnippet falls back to a random snippet and explains in badge when total mistakes < 20', () => {
    const missedKeys = { ';': 5, '{': 4 }; // Total = 9 (< 20)
    const result = pickCoachSnippet(MOCK_SNIPPETS, missedKeys, {}, 'short', () => true, () => 0);

    expect(result.label).toBe('Weak spots • TypeScript');
    expect(result.badge).toContain('NEED 20+ MISTAKES (9/20)');
    expect(result.badge).toContain('RANDOM SNIPPET');
  });

  it('pickCoachSnippet returns highest-scoring unseen snippet and lists only real present targets with counts', () => {
    const missedKeys = { '=': 10, '>': 8, '@': 50 }; // '@' has high weight but is NOT in the snippet
    const weakPatterns = { '=>': 6, '::': 30 }; // '::' is NOT in the snippet

    const result = pickCoachSnippet(MOCK_SNIPPETS, missedKeys, weakPatterns, 'short', () => true);

    expect(result.filename).toBe('arrows.ts');
    expect(result.label).toBe('Weak spots • TypeScript');
    // Must contain real counts for targets present in snip_arrows
    expect(result.badge).toContain('=> (3×)');
    expect(result.badge).toContain('= (6×)');
    expect(result.badge).toContain('> (3×)');
    // Must NOT include '@' or '::' since they do not appear in snip_arrows
    expect(result.badge).not.toContain('@');
    expect(result.badge).not.toContain('::');
  });

  it('applyMistakeTimeDecay halves mistake counts older than 14 days and drops zeroed keys', () => {
    const initial = { ';': 10, '{': 3, '}': 1 };
    const t0 = 1_700_000_000_000;

    // 5 days later: no decay
    const recent = applyMistakeTimeDecay(initial, t0, t0 + 5 * 24 * 60 * 60 * 1000);
    expect(recent.didDecay).toBe(false);
    expect(recent.decayed).toEqual({ ';': 10, '{': 3, '}': 1 });

    // 15 days later: halved (10 -> 5, 3 -> 1, 1 -> 0 dropped)
    const older = applyMistakeTimeDecay(initial, t0, t0 + FOURTEEN_DAYS_MS + 1000);
    expect(older.didDecay).toBe(true);
    expect(older.decayed).toEqual({ ';': 5, '{': 1 });
  });
});
