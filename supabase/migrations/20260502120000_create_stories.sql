-- StoryBox: run in Supabase SQL Editor or via `supabase db push` after linking.
-- "Success. No rows returned" is normal here — DDL does not return result rows.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,
  clean_text text not null,
  theme text not null,
  age_group text not null,
  mood text not null,
  summary text not null,
  rating_positive integer not null default 0,
  rating_negative integer not null default 0,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists stories_approved_rating_idx
  on public.stories (is_approved, rating_positive desc);

alter table public.stories enable row level security;

-- Kiosk / public reads: approved stories only (publishable key + anon).
create policy "Public read approved stories"
  on public.stories
  for select
  to anon, authenticated
  using (is_approved = true);

-- Inserts and privileged operations use the secret (service) key from Next.js API routes.
