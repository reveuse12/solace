create table if not exists public.push_subscriptions (
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  updated_at timestamptz not null default now(),
  primary key (clerk_user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
create policy "push subscriptions owner access" on public.push_subscriptions for all using (clerk_user_id = auth.jwt()->>'sub') with check (clerk_user_id = auth.jwt()->>'sub');
