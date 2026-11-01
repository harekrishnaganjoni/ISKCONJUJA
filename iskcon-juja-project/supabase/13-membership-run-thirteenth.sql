-- ============================================================
-- ISKCON JUJA: membership applications (run once in the Supabase SQL Editor; safe to re-run)
-- A visitor asks to become a member of the portal. Only the admins see the list,
-- and they approve or decline. Approving does not create a login by itself:
-- the admin then uses People > Add a member.
-- ============================================================
create table if not exists public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  note text,                                   -- optional: why they would like to join
  consent_at timestamptz not null default now(),
  status text not null default 'new',          -- new / approved / declined
  created_at timestamptz not null default now(),
  constraint membership_len check (char_length(name) between 1 and 80 and coalesce(char_length(phone),0) <= 40 and coalesce(char_length(email),0) <= 120 and coalesce(char_length(note),0) <= 600),
  constraint membership_contact check (coalesce(char_length(trim(phone)),0) >= 6 or coalesce(char_length(trim(email)),0) >= 5),
  constraint membership_status check (status in ('new','approved','declined'))
);

alter table public.membership_applications enable row level security;
drop policy if exists "applications visitors add" on public.membership_applications;
create policy "applications visitors add" on public.membership_applications for insert with check (status = 'new');
drop policy if exists "applications admins read" on public.membership_applications;
create policy "applications admins read" on public.membership_applications for select using (public.is_admin());
drop policy if exists "applications admins update" on public.membership_applications;
create policy "applications admins update" on public.membership_applications for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "applications admins delete" on public.membership_applications;
create policy "applications admins delete" on public.membership_applications for delete using (public.is_admin());

drop trigger if exists membership_rate_limit on public.membership_applications;
create trigger membership_rate_limit before insert on public.membership_applications
  for each row execute function public.limit_public_posts();
