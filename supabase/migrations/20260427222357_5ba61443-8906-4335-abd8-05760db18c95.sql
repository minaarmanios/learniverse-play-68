
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Friend',
  avatar_id int not null default 1,
  age_band text not null default '5-7' check (age_band in ('5-7','8-10','11-12')),
  xp int not null default 0,
  level int not null default 1,
  coins int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

-- lessons (public read)
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('english','math')),
  order_index int not null,
  title text not null,
  description text,
  age_band text not null default '5-7',
  difficulty int not null default 1,
  xp_reward int not null default 10,
  content jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.lessons enable row level security;
create policy "lessons public read" on public.lessons for select using (true);

-- lesson progress
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  stars int not null default 0,
  score int not null default 0,
  completed_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
create policy "progress select own" on public.lesson_progress for select using (auth.uid() = user_id);
create policy "progress insert own" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "progress update own" on public.lesson_progress for update using (auth.uid() = user_id);

-- badges
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  icon text not null default '⭐'
);
alter table public.badges enable row level security;
create policy "badges public read" on public.badges for select using (true);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "user_badges select own" on public.user_badges for select using (auth.uid() = user_id);
create policy "user_badges insert own" on public.user_badges for insert with check (auth.uid() = user_id);

-- chess progress
create table public.chess_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  puzzles_solved int not null default 0,
  ai_wins int not null default 0,
  ai_losses int not null default 0,
  current_difficulty text not null default 'beginner',
  updated_at timestamptz not null default now()
);
alter table public.chess_progress enable row level security;
create policy "chess select own" on public.chess_progress for select using (auth.uid() = user_id);
create policy "chess insert own" on public.chess_progress for insert with check (auth.uid() = user_id);
create policy "chess update own" on public.chess_progress for update using (auth.uid() = user_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Friend'));
  insert into public.chess_progress (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
