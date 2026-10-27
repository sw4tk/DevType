import { describe, it, expect } from 'vitest';
import { safeNext } from '../src/utils/safeRedirect';

describe('safeNext open redirect guard', () => {
  it('allows valid internal paths starting with a single slash', () => {
    expect(safeNext('/profile')).toBe('/profile');
  });

  it('rejects protocol-relative URLs starting with //', () => {
    expect(safeNext('//evil.com')).toBe('/auth/verified');
  });

  it('rejects URLs starting with @ that trick origin parsing', () => {
    expect(safeNext('@evil.com')).toBe('/auth/verified');
  });

  it('rejects absolute external URLs', () => {
    expect(safeNext('https://evil.com')).toBe('/auth/verified');
  });

  it('rejects backslash-prefixed paths before the first slash', () => {
    expect(safeNext('/\\evil.com')).toBe('/auth/verified');
  });

  it('falls back to /auth/verified when next is null', () => {
    expect(safeNext(null)).toBe('/auth/verified');
  });
});
