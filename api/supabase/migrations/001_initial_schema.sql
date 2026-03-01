-- Migration 001: initial schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users profile table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal            TEXT CHECK (goal IN ('muscle_gain', 'fat_loss', 'endurance', 'general_fitness')),
  fitness_level   TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  injury_notes    TEXT,
  available_days  INT[]   DEFAULT '{}',
  equipment       TEXT[]  DEFAULT '{}',
  body_weight     FLOAT,
  body_height     FLOAT,
  body_age        INT,
  ai_provider     TEXT    DEFAULT 'openrouter' CHECK (ai_provider IN ('openrouter', 'gemini', 'openai')),
  ai_model        TEXT    DEFAULT 'openai/gpt-4o',
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own profile
CREATE POLICY users_self_access ON public.users
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Per-user AI call quota tracking (one row per user per day)
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id        UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date      DATE  NOT NULL DEFAULT CURRENT_DATE,
  ai_calls  INT   NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- Users can read their own quota (backend uses service role to write)
CREATE POLICY quotas_self_read ON public.user_quotas
  FOR SELECT USING (user_id = auth.uid());
