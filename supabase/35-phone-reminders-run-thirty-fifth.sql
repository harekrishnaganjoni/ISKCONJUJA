-- ============================================================
-- ISKCON JUJA: phone reminders (run once in the Supabase SQL Editor; safe to re-run)
-- Each member chooses which reminders they want and switches them on for each of their phones.
--   reminder_prefs   one row per member: their choices (private to the member)
--   reminder_devices one row per phone/computer that said "Yes, send me reminders" (private to the member)
--   reminder_log     what has already been sent, so nobody gets the same reminder twice (only the sender uses it)
-- The sender is the small scheduled worker in the website files (worker/reminders.js).
-- ============================================================
create table if not exists public.reminder_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint reminder_prefs_size check (pg_column_size(prefs) < 2000)
);

create table if not exists public.reminder_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  label text,
  created_at timestamptz not null default now(),
  constraint reminder_devices_len check (char_length(endpoint) between 20 and 1000 and char_length(p256dh) < 200 and char_length(auth) < 100)
);
create index if not exists reminder_devices_user_idx on public.reminder_devices (user_id);

create table if not exists public.reminder_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, reminder_key)
);

alter table public.reminder_prefs enable row level security;
alter table public.reminder_devices enable row level security;
alter table public.reminder_log enable row level security;   -- no policies: only the sender (service key) can use it

drop policy if exists "reminder_prefs own" on public.reminder_prefs;
create policy "reminder_prefs own" on public.reminder_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reminder_devices own" on public.reminder_devices;
create policy "reminder_devices own" on public.reminder_devices for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- a member may keep at most 8 devices
create or replace function public.reminder_devices_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.reminder_devices where user_id = new.user_id) >= 8 then
    raise exception 'You can switch reminders on for at most 8 phones. Remove one first.';
  end if;
  return new;
end $$;
drop trigger if exists reminder_devices_limit_t on public.reminder_devices;
create trigger reminder_devices_limit_t before insert on public.reminder_devices for each row execute function public.reminder_devices_limit();

-- old log lines are not needed after 60 days (the sender calls this now and then)
create or replace function public.reminder_log_clean() returns void language sql security definer set search_path = public as $$
  delete from public.reminder_log where sent_at < now() - interval '60 days';
$$;
revoke all on function public.reminder_log_clean() from public, anon, authenticated;

-- the public part of the sender's key pair is stored by the admin page (Settings, "Phone reminders"); empty until then
insert into public.site_settings (key, value) values ('vapid_public', ''), ('reminder_last_run', '') on conflict (key) do nothing;
