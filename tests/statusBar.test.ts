import { describe, it, expect } from 'vitest';
import {
  detectSnippetIndentation,
  formatStatusBarMode,
} from '../src/components/typing/IdeCodeViewport';

describe('IDE Status Bar Helpers', () => {
  it('detects 2-space indentation from TypeScript snippets', () => {
    const code = 'export function add(a: number, b: number) {\n  return a + b;\n}';
    expect(detectSnippetIndentation(code)).toBe('Spaces: 2');
  });

  it('detects 4-space indentation from Python snippets', () => {
    const code = 'def resolve_flag() -> bool:\n    return True';
    expect(detectSnippetIndentation(code)).toBe('Spaces: 4');
  });

  it('detects tab indentation when leading tabs are used', () => {
    const code = 'func main() {\n\tfmt.Println("ok")\n}';
    expect(detectSnippetIndentation(code)).toBe('Tabs');
  });

  it('maps gameMode values to status bar mode labels', () => {
    expect(formatStatusBarMode('standard')).toBe('sprint');
    expect(formatStatusBarMode('60')).toBe('60s');
    expect(formatStatusBarMode('smartcoach')).toBe('weak spots');
  });
});
