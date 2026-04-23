
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "view own profile" on public.profiles for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- health profile (latest snapshot per user)
create table public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  age int not null,
  gender text not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  activity_level text not null,
  goal text not null,
  dietary_preference text,
  allergies text,
  bmi numeric,
  bmr numeric,
  tdee numeric,
  target_calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.health_profiles enable row level security;
create policy "select own health" on public.health_profiles for select using (auth.uid() = user_id);
create policy "insert own health" on public.health_profiles for insert with check (auth.uid() = user_id);
create policy "update own health" on public.health_profiles for update using (auth.uid() = user_id);
create policy "delete own health" on public.health_profiles for delete using (auth.uid() = user_id);

-- meal plans
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null default current_date,
  plan_data jsonb not null,
  total_calories numeric,
  created_at timestamptz not null default now()
);
alter table public.meal_plans enable row level security;
create policy "select own plans" on public.meal_plans for select using (auth.uid() = user_id);
create policy "insert own plans" on public.meal_plans for insert with check (auth.uid() = user_id);
create policy "update own plans" on public.meal_plans for update using (auth.uid() = user_id);
create policy "delete own plans" on public.meal_plans for delete using (auth.uid() = user_id);
create index meal_plans_user_date_idx on public.meal_plans (user_id, plan_date desc);

-- weight logs
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric not null,
  logged_at timestamptz not null default now()
);
alter table public.weight_logs enable row level security;
create policy "select own weights" on public.weight_logs for select using (auth.uid() = user_id);
create policy "insert own weights" on public.weight_logs for insert with check (auth.uid() = user_id);
create policy "update own weights" on public.weight_logs for update using (auth.uid() = user_id);
create policy "delete own weights" on public.weight_logs for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger health_profiles_updated_at before update on public.health_profiles
  for each row execute function public.set_updated_at();

-- handle new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
