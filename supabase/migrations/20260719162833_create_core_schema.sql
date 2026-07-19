-- Deck/Card/ReviewState schema per docs/PLAN.md Section 3.
-- RLS is enabled with no anon/authenticated policies: only the backend,
-- using the service_role key (which bypasses RLS), is expected to read
-- or write these tables. The frontend never talks to Supabase directly
-- (docs/CHECKLIST.md Phase 4).

create extension if not exists pgcrypto;

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  topics text[] not null default '{}',
  visibility text not null default 'personal' check (visibility in ('personal', 'shared')),
  created_at timestamptz not null default now()
);

alter table public.decks enable row level security;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  front text not null,
  back text not null,
  why text,
  topic text not null,
  created_at timestamptz not null default now()
);

create index if not exists cards_deck_id_idx on public.cards (deck_id);
alter table public.cards enable row level security;

-- user_id is a stub text field for now (single fixed identity in v1, per
-- docs/PLAN.md Section 5) rather than a foreign key into auth.users,
-- since real Supabase Auth wiring is Phase 6.
create table if not exists public.review_states (
  card_id uuid not null references public.cards (id) on delete cascade,
  user_id text not null default 'default-user',
  interval_days integer not null default 0,
  ease_factor numeric not null default 2.5,
  next_review_date timestamptz not null default now(),
  last_reviewed_at timestamptz,
  review_count integer not null default 0,
  primary key (card_id, user_id)
);

create index if not exists review_states_next_review_date_idx on public.review_states (next_review_date);
alter table public.review_states enable row level security;
