-- Tables created via raw SQL migrations don't automatically pick up the
-- privilege grants Supabase applies when tables are created through the
-- Dashboard UI. service_role bypasses RLS but still needs the
-- coarse-grained table GRANTs below to read/write at all.

grant usage on schema public to service_role;
grant all on public.decks to service_role;
grant all on public.cards to service_role;
grant all on public.review_states to service_role;
