-- Solace data model. Clerk remains the identity provider; clerk_user_id stores
-- the stable Clerk subject and is used by the application for ownership.
create table if not exists public.profiles (
  clerk_user_id text primary key,
  display_name text,
  focus text,
  practice_time text,
  avatar_url text,
  privacy_consent_at timestamptz,
  privacy_consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists privacy_consent_at timestamptz;
alter table public.profiles add column if not exists privacy_consent_version text;

create table if not exists public.intentions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  category text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.visualizations (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  prompt text,
  mood text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listening_progress (
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  audio_key text not null,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (clerk_user_id, audio_key)
);

create table if not exists public.favorites (
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  audio_key text not null,
  created_at timestamptz not null default now(),
  primary key (clerk_user_id, audio_key)
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  label text not null default 'Daily practice',
  time_local time not null,
  timezone text not null default 'UTC',
  days smallint[] not null default '{0,1,2,3,4,5,6}',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists intentions_owner_idx on public.intentions (clerk_user_id, status, created_at desc);
create index if not exists reflections_owner_idx on public.reflections (clerk_user_id, created_at desc);
create index if not exists visualizations_owner_idx on public.visualizations (clerk_user_id, created_at desc);
create index if not exists reminders_owner_idx on public.reminders (clerk_user_id, enabled);

alter table public.profiles enable row level security;
alter table public.intentions enable row level security;
alter table public.reflections enable row level security;
alter table public.visualizations enable row level security;
alter table public.listening_progress enable row level security;
alter table public.favorites enable row level security;
alter table public.reminders enable row level security;

-- These policies expect Clerk to be configured as a Supabase third-party JWT
-- provider. Server-side mutations should still verify the Clerk session first.
create policy "profiles owner access" on public.profiles for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
create policy "intentions owner access" on public.intentions for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
create policy "reflections owner access" on public.reflections for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
create policy "visualizations owner access" on public.visualizations for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
create policy "progress owner access" on public.listening_progress for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
create policy "favorites owner access" on public.favorites for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
create policy "reminders owner access" on public.reminders for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
