import { createClient } from '@/utils/supabase/client';

export interface TypingSessionRecord {
  id?: string;
  language: string;
  ext: string;
  mode: string;
  length_tier: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  lines_typed: number;
  duration_seconds: number;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'devtype_real_sessions_v1';

export async function recordTypingSession(
  session: Omit<TypingSessionRecord, 'created_at'>
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Guest Mode: Do not save data locally or to the cloud if not logged in
  if (!user) {
    return;
  }

  const payload: TypingSessionRecord = {
    ...session,
    created_at: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    existing.unshift(payload);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.slice(0, 500)));
  } catch {}

  await supabase.from('typing_sessions').insert({
    user_id: user.id,
    language: session.language,
    ext: session.ext,
    mode: session.mode,
    length_tier: session.length_tier,
    wpm: Math.round(session.wpm),
    raw_wpm: Math.round(session.raw_wpm),
    accuracy: Number(session.accuracy.toFixed(2)),
    lines_typed: session.lines_typed,
    duration_seconds: Math.round(session.duration_seconds),
  });
}

export async function fetchUserTelemetry() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let sessions: TypingSessionRecord[] = [];
  let profileMeta = {
    bio: 'Synthesizing real-world syntax at 120Hz.',
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
      sessions = dbSessions;
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

  // Merge with local sessions if DB is empty or not yet migrated
  if (sessions.length === 0 && typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      sessions = local;
    } catch {}
  }

  return { user, sessions, profileMeta };
}
