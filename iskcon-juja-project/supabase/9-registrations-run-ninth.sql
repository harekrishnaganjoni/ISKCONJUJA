-- ============================================================
-- ISKCON JUJA: program sign-ups (run once in the Supabase SQL Editor; safe to re-run)
-- A visitor can leave their name and phone/email to save a spot at a program and get reminders.
-- Only the admins can see the list. Also adds an optional start time to special events,
-- so calendar reminders can fire "the day before" and "3 hours before".
-- ============================================================
alter table public.events add column if not exists start_time time;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  program text not null,                         -- e.g. 'Tuesday & Friday evening program', or the event title
  event_id uuid references public.events(id) on delete set null,
  channel text not null default 'calendar',
  consent_at timestamptz not null default now(), -- they ticked "you may contact me"
  created_at timestamptz not null default now(),
  constraint registrations_len check (char_length(name) between 1 and 80 and char_length(contact) between 3 and 120 and char_length(program) between 1 and 160),
  constraint registrations_channel check (channel in ('calendar','telegram','sms'))
);

alter table public.registrations enable row level security;
drop policy if exists "registrations visitors add" on public.registrations;
create policy "registrations visitors add" on public.registrations for insert with check (true);
drop policy if exists "registrations admins read" on public.registrations;
create policy "registrations admins read" on public.registrations for select using (public.is_admin());
drop policy if exists "registrations admins delete" on public.registrations;
create policy "registrations admins delete" on public.registrations for delete using (public.is_admin());

-- same "20 per minute" brake as the other public forms
drop trigger if exists registrations_rate_limit on public.registrations;
create trigger registrations_rate_limit before insert on public.registrations
  for each row execute function public.limit_public_posts();
