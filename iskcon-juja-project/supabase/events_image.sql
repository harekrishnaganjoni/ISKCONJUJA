-- Event pictures (28 Oct 2026). Run in the Supabase SQL Editor. Safe to re-run.
alter table public.events add column if not exists image_url text;
