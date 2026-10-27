import { filterAndTierSnippet, splitIntoSnippets } from '../scripts/build-corpus';

describe('Corpus Builder Logic', () => {
  test('filterAndTierSnippet rejects long lines', () => {
    const longLineCode = 'const x = 1;\n' + 'a'.repeat(101) + '\nconst y = 2;';
    expect(filterAndTierSnippet(longLineCode).valid).toBe(false);
  });

  test('filterAndTierSnippet rejects mixed tabs and spaces', () => {
    const mixedCode = 'function a() {\n\tconst x = 1;\n  const y = 2;\n}';
    expect(filterAndTierSnippet(mixedCode).valid).toBe(false);
  });

  test('filterAndTierSnippet rejects potential secrets', () => {
    const secretCode = 'function auth() {\n  const api_key = "12345";\n  return true;\n}';
    expect(filterAndTierSnippet(secretCode).valid).toBe(false);
  });

  test('filterAndTierSnippet correctly assigns tiers', () => {
    const shortCode = 'a\nb\nc\nd\n'; // 4 lines
    expect(filterAndTierSnippet(shortCode).tier).toBe('short');

    const mediumCode = Array(10).fill('line').join('\n');
    expect(filterAndTierSnippet(mediumCode).tier).toBe('medium');

    const longCode = Array(20).fill('line').join('\n');
    expect(filterAndTierSnippet(longCode).tier).toBe('long');
  });

  test('splitIntoSnippets splits by double newlines', () => {
    const raw = 'const a = 1;\n\nconst b = 2;\n\nconst c = 3;';
    const snippets = splitIntoSnippets(raw, 'typescript');
    expect(snippets.length).toBe(3);
    expect(snippets[0]).toBe('const a = 1;');
  });
});

import { LANGUAGES } from '../src/constants/languages';
import corpusData from '../data/corpus.json';

describe('Corpus Readiness', () => {
  test('Every enabled language must have snippets in all tiers', () => {
    const enabledLangs = LANGUAGES.filter(l => l.enabled);
    const tiers = ['beginner', 'short', 'medium', 'long'];

    for (const lang of enabledLangs) {
      for (const tier of tiers) {
        if (tier === 'beginner') continue; // Beginner is synthetically generated via fallback
        
        const matchingSnippets = (corpusData as any[]).filter(
          c => c.langId === lang.id && c.tier === tier
        );
        
        if (matchingSnippets.length === 0) {
          throw new Error(`Missing ${tier} snippets for enabled language: ${lang.name}`);
        }
        
        expect(matchingSnippets.length).toBeGreaterThan(0);
      }
    }
  });
});
