import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateSessionSubmission } from '@/utils/sessionValidation';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', error: 'You must be signed in to save typing sessions.' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_JSON', error: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  const validation = validateSessionSubmission(body);
  if (!validation.ok || !validation.data) {
    return NextResponse.json(
      { code: validation.code, error: validation.message },
      { status: 422 }
    );
  }

  // Rate limit: maximum 10 submissions per minute per user
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from('typing_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo);

  if (countError) {
    return NextResponse.json(
      { code: 'DB_ERROR', error: countError.message },
      { status: 500 }
    );
  }

  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      {
        code: 'RATE_LIMITED',
        error: 'Rate limit exceeded: maximum 10 session submissions per minute.',
      },
      { status: 429 }
    );
  }

  const d = validation.data;
  const { data: inserted, error: insertError } = await supabase
    .from('typing_sessions')
    .insert({
      user_id: user.id,
      lang_id: d.lang_id,
      mode: d.mode,
      tier: d.tier,
      wpm: d.wpm,
      raw_wpm: d.raw_wpm,
      accuracy: Number(d.accuracy.toFixed(2)),
      consistency: Number(d.consistency.toFixed(2)),
      chars: d.chars,
      duration_ms: d.duration_ms,
      seed: d.seed ?? null,
    })
    .select('id, created_at')
    .single();

  if (insertError) {
    return NextResponse.json(
      { code: 'DB_INSERT_ERROR', error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, session: inserted }, { status: 201 });
}
