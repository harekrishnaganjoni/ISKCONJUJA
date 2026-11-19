-- Run once in the Supabase SQL editor (safe to run again).
-- Adds the "repeats every year" switch to events. Past events that do not repeat disappear from the site by themselves.
alter table public.events add column if not exists repeat_yearly boolean not null default false;
