export const DEFAULT_VERIFIED_REDIRECT = '/auth/verified';

export function safeNext(next: string | null): string {
  if (!next) {
    return DEFAULT_VERIFIED_REDIRECT;
  }

  if (!next.startsWith('/') || next.startsWith('//')) {
    return DEFAULT_VERIFIED_REDIRECT;
  }

  const beforeNextSlash = next.slice(1).split('/')[0];
  if (beforeNextSlash.includes('\\') || beforeNextSlash.includes('@')) {
    return DEFAULT_VERIFIED_REDIRECT;
  }

  return next;
}
