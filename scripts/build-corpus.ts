import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface RepoSource {
  owner: string;
  repo: string;
  ref: string;
  paths: string[];
  language: string;
  license: string;
}

export function filterAndTierSnippet(code: string): { valid: boolean; tier?: 'short' | 'medium' | 'long' } {
  const lines = code.split('\n');
  const lineCount = lines.length;

  if (lineCount < 3 || lineCount > 30) return { valid: false };
  if (lines.some(l => l.length > 100)) return { valid: false };
  if (code.includes('\t') && code.includes('  ')) return { valid: false }; // Mixed indentation
  
  const secretPatterns = [/password\s*=/i, /token\s*=/i, /secret\s*=/i, /api_key\s*=/i, /bearer\s+/i];
  if (secretPatterns.some(p => p.test(code))) return { valid: false };

  let tier: 'short' | 'medium' | 'long' = 'short';
  if (lineCount >= 18) tier = 'long';
  else if (lineCount >= 8) tier = 'medium';

  return { valid: true, tier };
}

export function splitIntoSnippets(rawCode: string, language: string): string[] {
  // Simple heuristic: split by double newlines to represent logical blocks
  // In a production AST-based tool, this would use a real parser.
  const blocks = rawCode.split(/(?:\r?\n){2,}/);
  return blocks.map(b => b.trim()).filter(b => b.length > 0);
}

async function buildCorpus() {
  const sourcesPath = path.join(process.cwd(), 'scripts', 'corpus-sources.json');
  const sources: { repositories: RepoSource[] } = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  
  const corpus = [];

  for (const repo of sources.repositories) {
    for (const filePath of repo.paths) {
      const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.ref}/${filePath}`;
      console.log(`Fetching ${url}...`);
      
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const rawCode = await res.text();
        
        const blocks = splitIntoSnippets(rawCode, repo.language);
        
        for (const block of blocks) {
          const { valid, tier } = filterAndTierSnippet(block);
          if (valid) {
            corpus.push({
              id: crypto.createHash('md5').update(block).digest('hex').slice(0, 10),
              langId: repo.language,
              code: block,
              repo: `${repo.owner}/${repo.repo}`,
              path: filePath,
              license: repo.license,
              tier
            });
          }
        }
      } catch (err) {
        console.error(`Failed to process ${url}`);
      }
    }
  }

  const outputPath = path.join(process.cwd(), 'data', 'corpus.json');
  fs.writeFileSync(outputPath, JSON.stringify(corpus, null, 2));
  console.log(`\n✅ Corpus built successfully with ${corpus.length} snippets. Saved to data/corpus.json`);
}

// Allow running directly
if (typeof require !== 'undefined' && require.main === module) {
  buildCorpus();
}
