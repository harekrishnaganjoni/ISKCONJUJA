-- ============================================================
-- ISKCON JUJA: registration + onboarding answers (run once in the Supabase SQL Editor; safe to re-run)
-- When someone registers, the form sends their details with the sign-up. This file:
--   1. keeps their name on their profile (so admins can recognise who is waiting for approval),
--   2. saves their answers in a new table `member_onboarding`.
-- WHO CAN READ THE ANSWERS: the person themselves and the site admins. No other member can.
-- (Their birth date is NOT stored here: it goes to their own private dates, which not even admins can read.)
-- A badly formed form can never block a sign-up: the answers part is skipped if anything is wrong.
-- ============================================================
create or replace function public.is_member()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('member','admin','super_admin'));
$$;

alter table public.profiles add column if not exists full_name text;

create table if not exists public.member_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  initiated_name text,
  phone text,
  rounds text,
  principles text[] not null default '{}',
  why text[] not null default '{}',
  why_other text,
  hope text[] not null default '{}',
  hope_other text,
  how_heard text,
  area text,
  contact_pref text,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_len check (
    coalesce(char_length(full_name),0) <= 100 and coalesce(char_length(initiated_name),0) <= 100 and coalesce(char_length(phone),0) <= 40 and
    coalesce(char_length(why_other),0) <= 300 and coalesce(char_length(hope_other),0) <= 300 and coalesce(char_length(how_heard),0) <= 100 and coalesce(char_length(area),0) <= 100)
);

-- keeps only the allowed choices (anything else in a submitted list is dropped)
create or replace function public.onboarding_pick(j jsonb, allowed text[])
returns text[] language sql immutable as $$
  select coalesce(array(select distinct x from jsonb_array_elements_text(case when jsonb_typeof(j) = 'array' then j else '[]'::jsonb end) x where x = any(allowed)), '{}');
$$;
create or replace function public.onboarding_txt(j jsonb, k text, n int)
returns text language sql immutable as $$
  select nullif(left(btrim(coalesce(j->>k, '')), n), '');
$$;
create or replace function public.onboarding_one(j jsonb, k text, allowed text[])
returns text language sql immutable as $$
  select case when (j->>k) = any(allowed) then j->>k else null end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  r := case when jsonb_typeof(new.raw_user_meta_data->'reg') = 'object' then new.raw_user_meta_data->'reg' else '{}'::jsonb end;
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, left(coalesce(nullif(btrim(r->>'full_name'), ''), nullif(btrim(new.raw_user_meta_data->>'full_name'), '')), 100));
  begin
    if r <> '{}'::jsonb then
      insert into public.member_onboarding (user_id, full_name, initiated_name, phone, rounds, principles, why, why_other, hope, hope_other, how_heard, area, contact_pref, consent_at)
      values (new.id,
        public.onboarding_txt(r,'full_name',100), public.onboarding_txt(r,'initiated_name',100), public.onboarding_txt(r,'phone',40),
        public.onboarding_one(r,'rounds', array['not_yet','1_3','4_8','9_15','16','more']),
        public.onboarding_pick(r->'principles', array['no_meat','no_intoxication','no_illicit_sex','no_gambling','still_learning','prefer_not']),
        public.onboarding_pick(r->'why', array['knowledge','peace','association','festivals','prasadam','kirtan','service','family','curiosity']),
        public.onboarding_txt(r,'why_other',300),
        public.onboarding_pick(r->'hope', array['courses','calendar','community','chanting','service','inspiration','news']),
        public.onboarding_txt(r,'hope_other',300),
        public.onboarding_txt(r,'how_heard',100), public.onboarding_txt(r,'area',100),
        public.onboarding_one(r,'contact_pref', array['whatsapp','call','email','any']),
        case when (r->>'consent') = 'true' then now() else null end);
    end if;
  exception when others then
    null;   -- never block a sign-up because of the extra answers
  end;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.member_onboarding enable row level security;
drop policy if exists "onboarding own or admin read" on public.member_onboarding;
create policy "onboarding own or admin read" on public.member_onboarding for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "onboarding own insert" on public.member_onboarding;
create policy "onboarding own insert" on public.member_onboarding for insert with check (user_id = auth.uid());
drop policy if exists "onboarding own update" on public.member_onboarding;
create policy "onboarding own update" on public.member_onboarding for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "onboarding own delete" on public.member_onboarding;
create policy "onboarding own delete" on public.member_onboarding for delete using (user_id = auth.uid());

create or replace function public.member_onboarding_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists member_onboarding_touch on public.member_onboarding;
create trigger member_onboarding_touch before update on public.member_onboarding for each row execute function public.member_onboarding_touch();
