-- Migration 004: programs table
-- Stores AI-generated workout programs for users

CREATE TABLE IF NOT EXISTS public.programs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  weeks           INTEGER     NOT NULL DEFAULT 4,
  days_per_week   INTEGER     NOT NULL,
  schedule        JSONB       NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own programs
CREATE POLICY programs_owner ON public.programs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_programs_user_id ON public.programs (user_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON public.programs (created_at DESC);
