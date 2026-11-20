-- Run once in the Supabase SQL editor (safe to run again).
-- Adds "Repeats" to events: none / by Gaurabda (Vaishnava lunar) date / same ordinary date every year.
alter table public.events add column if not exists repeat_mode text not null default 'none';
alter table public.events add column if not exists g_masa smallint;
alter table public.events add column if not exists g_tithi smallint;
alter table public.events drop constraint if exists events_repeat_mode_ok;
alter table public.events add constraint events_repeat_mode_ok check (repeat_mode in ('none','gaurabda','date'));
