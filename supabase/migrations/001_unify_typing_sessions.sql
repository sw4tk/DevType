DROP VIEW IF EXISTS public.daily_leaderboard;
DROP TABLE IF EXISTS public.typing_sessions CASCADE;

CREATE TABLE public.typing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lang_id text NOT NULL,
  mode text NOT NULL,
  tier text NOT NULL,
  wpm integer NOT NULL CHECK (wpm >= 0 AND wpm <= 350),
  raw_wpm integer NOT NULL CHECK (raw_wpm >= 0 AND raw_wpm <= 400),
  accuracy numeric(5,2) NOT NULL CHECK (accuracy >= 45.00 AND accuracy <= 100.00),
  consistency numeric(5,2) NOT NULL CHECK (consistency >= 0.00 AND consistency <= 100.00),
  chars integer NOT NULL CHECK (chars > 0),
  duration_ms integer NOT NULL CHECK (duration_ms >= 5000),
  seed text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_typing_sessions_user_created
  ON public.typing_sessions (user_id, created_at DESC);

CREATE INDEX idx_typing_sessions_seed_wpm
  ON public.typing_sessions (seed, wpm DESC)
  WHERE seed IS NOT NULL;

ALTER TABLE public.typing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "typing_sessions_select_own"
  ON public.typing_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "typing_sessions_insert_own"
  ON public.typing_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.daily_leaderboard AS
WITH best_per_user AS (
  SELECT DISTINCT ON (ts.seed, ts.user_id)
    ts.id,
    ts.seed,
    ts.user_id,
    COALESCE(dp.username, 'developer') AS username,
    ts.lang_id,
    ts.wpm,
    ts.raw_wpm,
    ts.accuracy,
    ts.consistency,
    ts.duration_ms,
    ts.created_at
  FROM public.typing_sessions ts
  LEFT JOIN public.developer_profiles dp
    ON dp.user_id::text = ts.user_id::text
  WHERE ts.seed IS NOT NULL
    AND ts.mode = 'daily'
  ORDER BY ts.seed, ts.user_id, ts.wpm DESC, ts.accuracy DESC, ts.created_at ASC
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY seed
      ORDER BY wpm DESC, accuracy DESC, created_at ASC
    ) AS rank
  FROM best_per_user
)
SELECT
  id,
  seed,
  rank,
  user_id,
  username,
  lang_id,
  wpm,
  raw_wpm,
  accuracy,
  consistency,
  duration_ms,
  created_at
FROM ranked
WHERE rank <= 20;

GRANT SELECT ON public.daily_leaderboard TO anon, authenticated;
