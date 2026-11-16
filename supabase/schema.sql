-- CodeLingo Supabase PostgreSQL Schema & Migrations
-- Paste into Supabase SQL Editor to provision profiles, lesson progress, and live leaderboard view.

-- 1. Extensions
create extension if not exists pgcrypto;

-- 2. User Profiles Table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null default 'Tarek',
  handle text not null default '@tarek_dev',
  avatar_url text,
  active_lang text not null default 'python',
  xp integer not null default 1450 check (xp >= 0),
  weekly_xp integer not null default 320 check (weekly_xp >= 0),
  gems integer not null default 450 check (gems >= 0),
  hearts integer not null default 5 check (hearts >= 0),
  max_hearts integer not null default 5 check (max_hearts > 0),
  streak integer not null default 5 check (streak >= 0),
  last_active_date date,
  league text not null default 'Obsidian',
  bugs_crushed integer not null default 24 check (bugs_crushed >= 0),
  blitz_best integer not null default 5 check (blitz_best >= 0),
  executions integer not null default 12 check (executions >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_xp_desc
  on public.profiles (xp desc, updated_at asc);

create index if not exists idx_profiles_league_xp
  on public.profiles (league, xp desc);

-- 3. Lesson & Unit Progress Table
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  language text not null,
  unit_id text not null,
  node_id text not null,
  completed boolean not null default true,
  accuracy integer not null default 100 check (accuracy >= 0 and accuracy <= 100),
  completed_at timestamptz not null default now(),
  constraint uq_user_progress_node unique (user_id, node_id)
);

create index if not exists idx_user_progress_user_lang
  on public.user_progress (user_id, language);

-- 4. Real-Time Leaderboard View (ordered by xp DESC)
create or replace view public.leaderboard_view as
select
  id,
  username,
  handle,
  avatar_url,
  active_lang,
  xp,
  weekly_xp,
  streak,
  league,
  dense_rank() over (order by xp desc, updated_at asc) as rank
from public.profiles
order by xp desc, updated_at asc;

-- 5. Updated-At Trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- 6. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;

-- Public read access for leaderboard rankings
drop policy if exists "Public profiles read access" on public.profiles;
create policy "Public profiles read access"
  on public.profiles
  for select
  using (true);

-- Authenticated user or anon guest upsert scoped to matching row id
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() is null or auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles
  for update
  using (auth.uid() is null or auth.uid() = id)
  with check (auth.uid() is null or auth.uid() = id);

drop policy if exists "Users read own progress" on public.user_progress;
create policy "Users read own progress"
  on public.user_progress
  for select
  using (auth.uid() is null or auth.uid() = user_id);

drop policy if exists "Users upsert own progress" on public.user_progress;
create policy "Users upsert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() is null or auth.uid() = user_id);

drop policy if exists "Users update own progress" on public.user_progress;
create policy "Users update own progress"
  on public.user_progress
  for update
  using (auth.uid() is null or auth.uid() = user_id)
  with check (auth.uid() is null or auth.uid() = user_id);
