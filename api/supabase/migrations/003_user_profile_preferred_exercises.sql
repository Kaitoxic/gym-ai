-- Migration 003: add preferred_exercises to user profile
-- Run in Supabase SQL Editor

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferred_exercises TEXT[] DEFAULT '{}';
