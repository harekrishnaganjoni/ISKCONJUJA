-- About me questions that the admins can add, edit, hide and remove (run once in the Supabase SQL editor; safe to re-run).
create table if not exists public.profile_questions (
  id uuid primary key default gen_random_uuid(),
  key text unique,                                   -- filled only for the 7 built-in questions
  label text not null check (char_length(label) between 3 and 300),
  kind text not null default 'text' check (kind in ('text','single','multi')),
  options jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now()
);
create table if not exists public.profile_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.profile_questions(id) on delete cascade,
  answer jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
alter table public.profile_questions enable row level security;
alter table public.profile_answers enable row level security;

drop policy if exists "pq read" on public.profile_questions;
drop policy if exists "pq admin insert" on public.profile_questions;
drop policy if exists "pq admin update" on public.profile_questions;
drop policy if exists "pq admin delete" on public.profile_questions;
create policy "pq read" on public.profile_questions for select to authenticated using (active or public.is_admin());
create policy "pq admin insert" on public.profile_questions for insert to authenticated with check (public.is_admin() and key is null);
create policy "pq admin update" on public.profile_questions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "pq admin delete" on public.profile_questions for delete to authenticated using (public.is_admin() and key is null);

drop policy if exists "pa read" on public.profile_answers;
drop policy if exists "pa insert" on public.profile_answers;
drop policy if exists "pa update" on public.profile_answers;
drop policy if exists "pa delete" on public.profile_answers;
create policy "pa read" on public.profile_answers for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "pa insert" on public.profile_answers for insert to authenticated with check (user_id = auth.uid());
create policy "pa update" on public.profile_answers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pa delete" on public.profile_answers for delete to authenticated using (user_id = auth.uid());

revoke all on public.profile_questions, public.profile_answers from anon;
grant select, insert, update, delete on public.profile_questions, public.profile_answers to authenticated;

insert into public.profile_questions (key, label, kind, sort) values
  ('rounds',       'How many rounds do you chant daily?', 'single', 10),
  ('principles',   'Which of the four regulative principles are part of your life at the moment?', 'multi', 20),
  ('why',          'What brought you to ISKCON?', 'multi', 30),
  ('hope',         'What do you hope to gain from this site and app?', 'multi', 40),
  ('how_heard',    'How did you hear about us?', 'single', 50),
  ('area',         'Where do you stay?', 'text', 60),
  ('contact_pref', 'How should we reach you?', 'single', 70)
on conflict (key) do nothing;
