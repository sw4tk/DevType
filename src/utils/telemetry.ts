import { createClient } from '@/utils/supabase/client';
import { SessionSubmissionInput } from '@/utils/sessionValidation';

export interface TypingSessionRecord {
  id: string;
  user_id: string;
  lang_id: string;
  mode: string;
  tier: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency: number;
  chars: number;
  duration_ms: number;
  seed: string | null;
  created_at: string;
}

export interface DailyLeaderboardRow {
  id: string;
  seed: string;
  rank: number;
  user_id: string;
  username: string;
  lang_id: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency: number;
  duration_ms: number;
  created_at: string;
}

export interface SubmitSessionResponse {
  ok: boolean;
  code?: string;
  error?: string;
}

export async function submitTypingSession(
  payload: SessionSubmissionInput
): Promise<SubmitSessionResponse> {
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as {
      ok?: boolean;
      code?: string;
      error?: string;
    };

    if (!res.ok || !data.ok) {
      return {
        ok: false,
        code: data.code || `HTTP_${res.status}`,
        error: data.error || `Failed to save session (HTTP ${res.status})`,
      };
    }

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error: err instanceof Error ? err.message : 'Network error while saving session',
    };
  }
}

export async function fetchDailyLeaderboard(seed: string): Promise<{
  rows: DailyLeaderboardRow[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('daily_leaderboard')
      .select('*')
      .eq('seed', seed)
      .order('rank', { ascending: true })
      .limit(20);

    if (error) {
      return { rows: [], error: error.message };
    }
    return { rows: (data as DailyLeaderboardRow[]) || [] };
  } catch (err: unknown) {
    return {
      rows: [],
      error: err instanceof Error ? err.message : 'Failed to load daily leaderboard',
    };
  }
}

export async function fetchUserTelemetry() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sessions: TypingSessionRecord[] = [];
  let profileMeta = {
    bio: 'Practicing real-world open-source code snippets.',
    keyboard_gear: '65% Mechanical Studio Deck',
    website: '',
  };

  if (user) {
    const { data: dbSessions } = await supabase
      .from('typing_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (dbSessions && dbSessions.length > 0) {
      sessions = dbSessions as TypingSessionRecord[];
    }

    const { data: dbProfile } = await supabase
      .from('developer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbProfile) {
      profileMeta = {
        bio: dbProfile.bio || profileMeta.bio,
        keyboard_gear: dbProfile.keyboard_gear || profileMeta.keyboard_gear,
        website: dbProfile.website || '',
      };
    }
  }

  return { user, sessions, profileMeta };
}
