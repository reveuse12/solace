create table if not exists public.desires (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  category text,
  status text not null default 'active' check (status in ('active', 'manifested', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists desires_owner_idx on public.desires (clerk_user_id, status, created_at desc);
alter table public.desires enable row level security;
create policy "desires owner access" on public.desires for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
