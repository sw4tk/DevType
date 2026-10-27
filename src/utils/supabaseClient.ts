import { createClient, isSupabaseConfigured } from '@/utils/supabase/client';

export { createClient, isSupabaseConfigured };

export async function signInWithGitHubOAuth(): Promise<boolean> {
  const supabase = createClient();
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo },
  });
  return !error;
}

export async function fetchSupabaseTableStats(): Promise<{
  sessionsCount: number;
  corpusCount: number;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { sessionsCount: 0, corpusCount: 0, error: 'Not configured' };
  }

  try {
    const supabase = createClient();
    const [sessRes, corpRes] = await Promise.all([
      supabase.from('typing_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('code_corpus').select('id', { count: 'exact', head: true }),
    ]);

    if (sessRes.error || corpRes.error) {
      const msg = sessRes.error?.message || corpRes.error?.message || 'Query error';
      return {
        sessionsCount: 0,
        corpusCount: 0,
        error: msg,
      };
    }

    return {
      sessionsCount: sessRes.count ?? 0,
      corpusCount: corpRes.count ?? 0,
    };
  } catch {
    return { sessionsCount: 0, corpusCount: 0, error: 'Failed to reach Supabase' };
  }
}
