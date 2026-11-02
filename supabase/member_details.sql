-- ============================================================
-- ISKCON JUJA: member details + milestones (run once in the Supabase SQL Editor; safe to re-run)
-- Each member saves their own name and phone, and any number of "milestones": birthday, initiation,
-- marriage, anything with a date. The app converts each date to its Vaishnava (Gaurabda) date,
-- tracks it every year and reminds the member. Private: ONLY the member can read or change their own
-- rows. Not even the site admins can open them.
-- (Honest limit: whoever owns the Supabase project can technically see all database data.)
-- ============================================================
create table if not exists public.member_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  digest_weekly boolean not null default false,    -- optional: summary of major events at the start of each week
  digest_monthly boolean not null default false,   -- optional: summary of major events at the start of each month
  updated_at timestamptz not null default now(),
  constraint member_details_len check (coalesce(char_length(full_name),0) <= 100 and coalesce(char_length(phone),0) <= 40)
);

alter table public.member_details add column if not exists digest_weekly boolean not null default false;
alter table public.member_details add column if not exists digest_monthly boolean not null default false;

create table if not exists public.member_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'other',          -- birthday / initiation / marriage / other
  title text not null,                         -- e.g. 'My birthday', 'Harinama initiation'
  event_date date not null,
  remind boolean not null default true,
  created_at timestamptz not null default now(),
  constraint milestone_kind check (kind in ('birthday','initiation','marriage','other')),
  constraint milestone_len check (char_length(title) between 1 and 80),
  constraint milestone_date check (event_date >= date '1900-01-01' and event_date <= current_date)
);
create index if not exists member_milestones_user_idx on public.member_milestones (user_id);

-- at most 40 milestones per member
create or replace function public.member_milestones_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.member_milestones where user_id = new.user_id) >= 40 then
    raise exception 'You can save up to 40 milestones.';
  end if;
  return new;
end $$;
drop trigger if exists member_milestones_limit on public.member_milestones;
create trigger member_milestones_limit before insert on public.member_milestones for each row execute function public.member_milestones_limit();

alter table public.member_details enable row level security;
alter table public.member_milestones enable row level security;
do $$ declare t text; begin
  foreach t in array array['member_details','member_milestones'] loop
    execute format('drop policy if exists "%1$s own read" on public.%1$s', t);
    execute format('create policy "%1$s own read" on public.%1$s for select using (user_id = auth.uid() and public.is_member())', t);
    execute format('drop policy if exists "%1$s own insert" on public.%1$s', t);
    execute format('create policy "%1$s own insert" on public.%1$s for insert with check (user_id = auth.uid() and public.is_member())', t);
    execute format('drop policy if exists "%1$s own update" on public.%1$s', t);
    execute format('create policy "%1$s own update" on public.%1$s for update using (user_id = auth.uid() and public.is_member()) with check (user_id = auth.uid() and public.is_member())', t);
    execute format('drop policy if exists "%1$s own delete" on public.%1$s', t);
    execute format('create policy "%1$s own delete" on public.%1$s for delete using (user_id = auth.uid() and public.is_member())', t);
  end loop;
end $$;

create or replace function public.member_details_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists member_details_touch on public.member_details;
create trigger member_details_touch before update on public.member_details for each row execute function public.member_details_touch();
