-- 1. Enable Row-Level Security (RLS) on all three tables.
ALTER TABLE public.code_corpus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

-- 2. code_corpus: Read-only for everyone; no client insert/update/delete policies exist.
DROP POLICY IF EXISTS "code_corpus_select_all" ON public.code_corpus;

CREATE POLICY "code_corpus_select_all"
  ON public.code_corpus
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. typing_sessions: Authenticated users can only select and insert their own rows.
-- Casting both sides to ::text prevents `uuid = text` operator errors regardless of column type.
DROP POLICY IF EXISTS "typing_sessions_select_own" ON public.typing_sessions;
DROP POLICY IF EXISTS "typing_sessions_insert_own" ON public.typing_sessions;

CREATE POLICY "typing_sessions_select_own"
  ON public.typing_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "typing_sessions_insert_own"
  ON public.typing_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

-- 4. developer_profiles: Authenticated users can only select, insert, and update their own profile.
DROP POLICY IF EXISTS "developer_profiles_select_own" ON public.developer_profiles;
DROP POLICY IF EXISTS "developer_profiles_insert_own" ON public.developer_profiles;
DROP POLICY IF EXISTS "developer_profiles_update_own" ON public.developer_profiles;

CREATE POLICY "developer_profiles_select_own"
  ON public.developer_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "developer_profiles_insert_own"
  ON public.developer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "developer_profiles_update_own"
  ON public.developer_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);