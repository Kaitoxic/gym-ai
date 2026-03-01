-- 005_workout_logs.sql
-- Tracks completed workout sessions

create table if not exists public.workout_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  program_id      uuid references public.programs(id) on delete set null,
  day_number      integer not null,
  day_name        text not null,
  sets_done       jsonb not null default '[]',
  duration_seconds integer,
  completed_at    timestamptz not null default now()
);

-- RLS
alter table public.workout_logs enable row level security;

create policy "Users can read own workout logs"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own workout logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- Index for fast history queries
create index if not exists workout_logs_user_date
  on public.workout_logs(user_id, completed_at desc);
