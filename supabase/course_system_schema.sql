-- ============================================================
-- COURSE SYSTEM — Phase 1: schema + security rules only.
-- Based on the owner's COURSE_SYSTEM_README.md spec (2 Oct 2026).
--
-- Run this AFTER supabase/schema.sql (it already created a basic
-- public.courses table — this file extends it rather than
-- replacing it, so nothing already entered is lost).
--
-- Safe to run more than once (same idempotency rules as the main
-- schema file: every policy has a matching "drop if exists" first).
--
-- WHAT THIS FILE DOES NOT DO YET (later phases, see the README spec
-- section 18 for the order): no learner-facing pages, no quiz
-- engine UI, no admin content editor, no anonymous-session identity
-- flow, no certificates, no cohorts/teachers, no forum. This file
-- only lays the foundation: tables + the visibility/security rules
-- they must obey. Building on an insecure foundation would be worse
-- than not building at all, which is why this step comes first and
-- alone.
-- ============================================================

-- ---------- Extend the existing courses table (section 3) ----------
alter table public.courses add column if not exists subtitle text;
alter table public.courses add column if not exists cover_image_url text;
alter table public.courses add column if not exists category text;
alter table public.courses add column if not exists level text check (level in ('beginner','intermediate','advanced'));
alter table public.courses add column if not exists course_type text not null default 'learn' check (course_type in ('learn','skill','certification'));
alter table public.courses add column if not exists delivery_mode text not null default 'self_paced' check (delivery_mode in ('self_paced','monitored'));
alter table public.courses add column if not exists visibility text not null default 'public' check (visibility in ('public','members','internal'));
alter table public.courses add column if not exists internal_group_id uuid;
alter table public.courses add column if not exists prerequisite_course_id uuid references public.courses(id);
alter table public.courses add column if not exists estimated_minutes integer;
alter table public.courses add column if not exists discussion_mode text not null default 'off' check (discussion_mode in ('off','ask_question','forum'));
alter table public.courses add column if not exists reviews_enabled boolean not null default false;
alter table public.courses add column if not exists lesson_feedback_enabled boolean not null default false;
alter table public.courses add column if not exists certificate_enabled boolean not null default false;
alter table public.courses add column if not exists pass_mark_percent integer not null default 70;
alter table public.courses add column if not exists accent_color text;
alter table public.courses add column if not exists sequential_unlock boolean not null default true;
alter table public.courses add column if not exists order_index integer not null default 0;
-- Note: this project keeps the existing `published` boolean (used by the
-- admin panel already built) as the single source of truth for whether a
-- course is live, rather than adding a separate draft/published/archived
-- "status" column. A course is visible to nobody while published = false.

-- ---------- Content hierarchy (section 2 & 14) ----------
create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  intro_text text,
  order_index integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  est_minutes integer,
  order_index integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.course_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  type text not null check (type in
    ('text','quote','image','gallery','video','audio','analogy','key_point',
     'reflection','practice','download','callout','quiz_ref')),
  content jsonb not null default '{}'::jsonb,
  order_index integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
-- Quote-publishing guard (section 11): a quote block's content JSON must
-- include "verified": true before it is treated as safe to show publicly.
-- Enforced in the (future) block renderer, not just trusted from the admin
-- form — the renderer must check content->>'verified' = 'true' itself.

create table if not exists public.course_lesson_faqs (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  question text not null,
  answer text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Quizzes & questions (section 12) ----------
create table if not exists public.course_quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete cascade,
  lesson_id uuid references public.course_lessons(id) on delete cascade,
  kind text not null check (kind in ('review','final','practice')),
  pass_mark_percent integer not null default 70,
  graded boolean not null default false,
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  max_attempts integer,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.course_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.course_quizzes(id) on delete cascade,
  type text not null check (type in
    ('multiple_choice','multi_select','true_false','matching',
     'audio_choice','short_answer','essay','file_submission')),
  prompt text not null,
  media_ref text,
  explanation text,
  points integer not null default 1,
  order_index integer not null default 0
);

create table if not exists public.course_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.course_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0
);

-- ---------- People & access (section 5 & 6) ----------
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists consent_at timestamptz;
-- Note: this project already has a role column on profiles (pending /
-- member / admin / super_admin). The spec's richer role list (guest,
-- learner, teacher, editor) is layered on top in a later phase, once
-- the anonymous-session identity flow (section 5) is actually built —
-- adding unused role values now would be a half-finished promise.

create table if not exists public.course_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
create table if not exists public.course_group_members (
  group_id uuid not null references public.course_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (group_id, user_id)
);
alter table public.courses add column if not exists course_group_id uuid references public.course_groups(id);

-- ---------- Delivery: enrolments, cohorts (section 8) ----------
create table if not exists public.course_enrolments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  cohort_id uuid,
  status text not null default 'active' check (status in ('active','completed','dropped')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create table if not exists public.course_cohorts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date
);
create table if not exists public.course_cohort_teachers (
  cohort_id uuid not null references public.course_cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (cohort_id, user_id)
);
create table if not exists public.course_cohort_students (
  cohort_id uuid not null references public.course_cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (cohort_id, user_id)
);
create table if not exists public.course_module_unlocks (
  cohort_id uuid not null references public.course_cohorts(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (cohort_id, module_id)
);
alter table public.course_enrolments
  add constraint course_enrolments_cohort_fk foreign key (cohort_id) references public.course_cohorts(id) on delete set null;

-- ---------- Progress & results (section 12 & 14) ----------
create table if not exists public.course_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','complete')),
  last_position text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.course_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.course_quizzes(id) on delete cascade,
  score_percent numeric,
  passed boolean,
  attempted_at timestamptz not null default now()
);
create table if not exists public.course_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.course_quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.course_questions(id) on delete cascade,
  answer jsonb,
  is_correct boolean
);

create table if not exists public.course_practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  logged_at timestamptz not null default now(),
  minutes integer,
  note text
);

create table if not exists public.course_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.course_questions(id) on delete cascade,
  file_url text,
  text_answer text,
  teacher_id uuid references auth.users(id),
  mark numeric,
  feedback text,
  status text not null default 'pending' check (status in ('pending','marked')),
  submitted_at timestamptz not null default now()
);

create table if not exists public.course_reflection_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- ---------- Community & feedback (section 9 & 10) ----------
create table if not exists public.course_questions_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  body text not null,
  status text not null default 'open' check (status in ('open','answered','published_faq')),
  answered_by uuid references auth.users(id),
  answer text,
  created_at timestamptz not null default now()
);

create table if not exists public.course_lesson_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  clear boolean not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  course_id uuid not null references public.courses(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  worked text,
  improve text,
  publishable boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Certificates (section 13) ----------
create table if not exists public.course_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  name_on_certificate text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- ============================================================
-- SECURITY (section 4 — the core requirement). A course's modules,
-- lessons, blocks, quizzes and questions are only ever selectable
-- if the course itself is visible to the requesting user. This is
-- enforced here in the database, not just hidden in the UI, so a
-- hidden course's content can never be fetched by guessing an ID.
-- ============================================================
create or replace function public.course_visible(cid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.courses c
    where c.id = cid
      and c.published = true
      and (
        c.visibility = 'public'
        or (c.visibility = 'members' and public.is_admin())
        or (c.visibility = 'members' and exists (
              select 1 from public.profiles p where p.id = auth.uid()
              and p.role in ('member','admin','super_admin')))
        or (c.visibility = 'internal' and exists (
              select 1 from public.course_group_members gm
              where gm.group_id = c.course_group_id and gm.user_id = auth.uid()))
        or public.is_admin()
      )
  );
$$;

alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_blocks enable row level security;
alter table public.course_lesson_faqs enable row level security;
alter table public.course_quizzes enable row level security;
alter table public.course_questions enable row level security;
alter table public.course_question_options enable row level security;
alter table public.course_enrolments enable row level security;
alter table public.course_lesson_progress enable row level security;
alter table public.course_quiz_attempts enable row level security;
alter table public.course_attempt_answers enable row level security;
alter table public.course_practice_logs enable row level security;
alter table public.course_submissions enable row level security;
alter table public.course_reflection_notes enable row level security;
alter table public.course_questions_inbox enable row level security;
alter table public.course_lesson_feedback enable row level security;
alter table public.course_reviews enable row level security;
alter table public.course_certificates enable row level security;
alter table public.course_groups enable row level security;
alter table public.course_group_members enable row level security;
alter table public.course_cohorts enable row level security;
alter table public.course_cohort_teachers enable row level security;
alter table public.course_cohort_students enable row level security;
alter table public.course_module_unlocks enable row level security;

-- Content: visible only if the parent course is visible; admins write.
drop policy if exists "modules visible" on public.course_modules;
create policy "modules visible" on public.course_modules for select using (published = true and public.course_visible(course_id));
drop policy if exists "modules admin write" on public.course_modules;
create policy "modules admin write" on public.course_modules for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lessons visible" on public.course_lessons;
create policy "lessons visible" on public.course_lessons for select using (
  published = true and exists (select 1 from public.course_modules m where m.id = module_id and m.published = true and public.course_visible(m.course_id))
);
drop policy if exists "lessons admin write" on public.course_lessons;
create policy "lessons admin write" on public.course_lessons for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "blocks visible" on public.course_blocks;
create policy "blocks visible" on public.course_blocks for select using (
  published = true and exists (
    select 1 from public.course_lessons l join public.course_modules m on m.id = l.module_id
    where l.id = lesson_id and l.published = true and m.published = true and public.course_visible(m.course_id)
  )
);
drop policy if exists "blocks admin write" on public.course_blocks;
create policy "blocks admin write" on public.course_blocks for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lesson_faqs visible" on public.course_lesson_faqs;
create policy "lesson_faqs visible" on public.course_lesson_faqs for select using (
  published = true and exists (
    select 1 from public.course_lessons l join public.course_modules m on m.id = l.module_id
    where l.id = lesson_id and public.course_visible(m.course_id)
  )
);
drop policy if exists "lesson_faqs admin write" on public.course_lesson_faqs;
create policy "lesson_faqs admin write" on public.course_lesson_faqs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quizzes visible" on public.course_quizzes;
create policy "quizzes visible" on public.course_quizzes for select using (
  published = true and (
    (course_id is not null and public.course_visible(course_id)) or
    (module_id is not null and exists (select 1 from public.course_modules m where m.id = module_id and public.course_visible(m.course_id))) or
    (lesson_id is not null and exists (select 1 from public.course_lessons l join public.course_modules m on m.id = l.module_id where l.id = lesson_id and public.course_visible(m.course_id)))
  )
);
drop policy if exists "quizzes admin write" on public.course_quizzes;
create policy "quizzes admin write" on public.course_quizzes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "questions visible" on public.course_questions;
create policy "questions visible" on public.course_questions for select using (
  exists (select 1 from public.course_quizzes q where q.id = quiz_id and q.published = true)
);
drop policy if exists "questions admin write" on public.course_questions;
create policy "questions admin write" on public.course_questions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "options visible" on public.course_question_options;
create policy "options visible" on public.course_question_options for select using (
  exists (select 1 from public.course_questions qq where qq.id = question_id)
);
drop policy if exists "options admin write" on public.course_question_options;
create policy "options admin write" on public.course_question_options for all using (public.is_admin()) with check (public.is_admin());

-- Personal data: a learner can only see/write their own rows; admins/teachers see all for now
-- (per-course teacher scoping is a later phase, once cohorts/teacher roles are actually built).
drop policy if exists "own enrolments" on public.course_enrolments;
create policy "own enrolments" on public.course_enrolments for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own enrolments write" on public.course_enrolments;
create policy "own enrolments write" on public.course_enrolments for insert with check (user_id = auth.uid());
drop policy if exists "own enrolments admin manage" on public.course_enrolments;
create policy "own enrolments admin manage" on public.course_enrolments for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own progress" on public.course_lesson_progress;
create policy "own progress" on public.course_lesson_progress for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own progress write" on public.course_lesson_progress;
create policy "own progress write" on public.course_lesson_progress for insert with check (user_id = auth.uid());
drop policy if exists "own progress update" on public.course_lesson_progress;
create policy "own progress update" on public.course_lesson_progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own attempts" on public.course_quiz_attempts;
create policy "own attempts" on public.course_quiz_attempts for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own attempts write" on public.course_quiz_attempts;
create policy "own attempts write" on public.course_quiz_attempts for insert with check (user_id = auth.uid());

drop policy if exists "own attempt answers" on public.course_attempt_answers;
create policy "own attempt answers" on public.course_attempt_answers for select using (
  exists (select 1 from public.course_quiz_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin()))
);
drop policy if exists "own attempt answers write" on public.course_attempt_answers;
create policy "own attempt answers write" on public.course_attempt_answers for insert with check (
  exists (select 1 from public.course_quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

drop policy if exists "own practice logs" on public.course_practice_logs;
create policy "own practice logs" on public.course_practice_logs for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own practice logs write" on public.course_practice_logs;
create policy "own practice logs write" on public.course_practice_logs for insert with check (user_id = auth.uid());

drop policy if exists "own submissions" on public.course_submissions;
create policy "own submissions" on public.course_submissions for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own submissions write" on public.course_submissions;
create policy "own submissions write" on public.course_submissions for insert with check (user_id = auth.uid());
drop policy if exists "own submissions admin mark" on public.course_submissions;
create policy "own submissions admin mark" on public.course_submissions for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own reflection notes" on public.course_reflection_notes;
create policy "own reflection notes" on public.course_reflection_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Community: public-facing questions/FAQ and reviews are pre-moderated (section 9/10).
drop policy if exists "own inbox questions" on public.course_questions_inbox;
create policy "own inbox questions" on public.course_questions_inbox for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "submit inbox questions" on public.course_questions_inbox;
create policy "submit inbox questions" on public.course_questions_inbox for insert with check (true);
drop policy if exists "admin manage inbox" on public.course_questions_inbox;
create policy "admin manage inbox" on public.course_questions_inbox for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "submit lesson feedback" on public.course_lesson_feedback;
create policy "submit lesson feedback" on public.course_lesson_feedback for insert with check (true);
drop policy if exists "admin read lesson feedback" on public.course_lesson_feedback;
create policy "admin read lesson feedback" on public.course_lesson_feedback for select using (public.is_admin());

drop policy if exists "submit reviews" on public.course_reviews;
create policy "submit reviews" on public.course_reviews for insert with check (true);
drop policy if exists "read publishable reviews" on public.course_reviews;
create policy "read publishable reviews" on public.course_reviews for select using (publishable = true or public.is_admin());
drop policy if exists "admin manage reviews" on public.course_reviews;
create policy "admin manage reviews" on public.course_reviews for update using (public.is_admin()) with check (public.is_admin());

-- Certificates: the verification page needs public read of name/course/date
-- for a specific known code — but never a full public listing of everyone's
-- certificates. Enforced by requiring the exact code via a function, not a
-- blanket "select using (true)" on the table.
drop policy if exists "own certificates" on public.course_certificates;
create policy "own certificates" on public.course_certificates for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin manage certificates" on public.course_certificates;
create policy "admin manage certificates" on public.course_certificates for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.verify_certificate(code text)
returns table(name_on_certificate text, course_title text, issued_at timestamptz)
language sql security definer stable as $$
  select c.name_on_certificate, co.title, c.issued_at
  from public.course_certificates c join public.courses co on co.id = c.course_id
  where c.certificate_code = code and c.revoked_at is null;
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;
grant execute on function public.course_visible(uuid) to anon, authenticated;

-- Groups/cohorts: admin-managed only for now (no teacher role built yet).
drop policy if exists "groups admin" on public.course_groups;
create policy "groups admin" on public.course_groups for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "group members admin" on public.course_group_members;
create policy "group members admin" on public.course_group_members for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "group members self read" on public.course_group_members;
create policy "group members self read" on public.course_group_members for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "cohorts admin" on public.course_cohorts;
create policy "cohorts admin" on public.course_cohorts for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "cohort teachers admin" on public.course_cohort_teachers;
create policy "cohort teachers admin" on public.course_cohort_teachers for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "cohort students admin" on public.course_cohort_students;
create policy "cohort students admin" on public.course_cohort_students for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "module unlocks admin" on public.course_module_unlocks;
create policy "module unlocks admin" on public.course_module_unlocks for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- END OF PHASE 1. Nothing above changes what visitors currently
-- see on the site — these are new, empty tables with security
-- rules attached. The existing simple course catalog (title,
-- description, schedule, how_to_join) keeps working exactly as
-- it does today until the new learner-facing pages are built.
-- ============================================================
