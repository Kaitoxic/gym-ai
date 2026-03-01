-- Migration 002: exercises table
-- Run in Supabase SQL Editor after 001_initial_schema.sql

CREATE TABLE IF NOT EXISTS public.exercises (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT    UNIQUE NOT NULL,
  name          TEXT    NOT NULL,
  muscle_groups TEXT[]  NOT NULL,
  equipment     TEXT[]  NOT NULL,
  difficulty    TEXT    NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  instructions  TEXT[]  NOT NULL,
  image_url     TEXT,
  video_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (anon or authenticated) can SELECT
CREATE POLICY exercises_public_read ON public.exercises
  FOR SELECT TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies: only the service role key can write

CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON public.exercises USING GIN (muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment     ON public.exercises USING GIN (equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty    ON public.exercises (difficulty);
