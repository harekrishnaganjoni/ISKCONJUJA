-- ============================================================
-- COURSE SYSTEM: security hardening + server-side quiz grading
-- Run AFTER course_system_schema.sql. Safe to re-run.
-- Fixes found when reviewing the Phase 1 schema against
-- COURSE_SYSTEM_SPEC.md section 4, 11 and 12:
--  1. Learners could read quiz questions/options INCLUDING is_correct
--     (the answer key) straight from the database, and could insert
--     their own quiz attempts with any score. Now they can do neither:
--     quizzes are fetched with course_quiz_for_learner() (no answers)
--     and graded by course_submit_quiz() inside the database.
--  2. "questions visible" did not check that the parent course is
--     visible, so a hidden course's questions could be fetched by ID.
--  3. Quote blocks with verified <> true were readable by the public.
--     Now the database itself hides them (admins still see them).
--  4. course_visible() now pins its search_path.
-- ============================================================

-- 4. visibility helper (same rules as before, search_path pinned)
create or replace function public.course_visible(cid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.courses c
    where c.id = cid
      and (
        public.is_admin()
        or (c.published = true and (
              c.visibility = 'public'
              or (c.visibility = 'members' and exists (
                    select 1 from public.profiles p where p.id = auth.uid()
                    and p.role in ('member','admin','super_admin')))
              or (c.visibility = 'internal' and exists (
                    select 1 from public.course_group_members gm
                    where gm.group_id = c.course_group_id and gm.user_id = auth.uid()))
        ))
      )
  );
$$;
grant execute on function public.course_visible(uuid) to anon, authenticated;

-- helper: is this quiz published AND attached to a course the caller may see?
create or replace function public.course_quiz_visible(qid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.course_quizzes q
    left join public.course_modules m on m.id = q.module_id
    left join public.course_lessons l on l.id = q.lesson_id
    left join public.course_modules lm on lm.id = l.module_id
    where q.id = qid and q.published = true
      and public.course_visible(coalesce(q.course_id, m.course_id, lm.course_id))
  );
$$;
grant execute on function public.course_quiz_visible(uuid) to anon, authenticated;

-- 3. quote guard in the blocks policy
drop policy if exists "blocks visible" on public.course_blocks;
create policy "blocks visible" on public.course_blocks for select using (
  published = true
  and (type <> 'quote' or content->>'verified' = 'true')
  and exists (
    select 1 from public.course_lessons l join public.course_modules m on m.id = l.module_id
    where l.id = lesson_id and l.published = true and m.published = true and public.course_visible(m.course_id)
  )
);

-- 1 & 2. no direct learner access to questions/options (answer key) or attempt writes
drop policy if exists "questions visible" on public.course_questions;
drop policy if exists "options visible" on public.course_question_options;
drop policy if exists "own attempts write" on public.course_quiz_attempts;
drop policy if exists "own attempt answers write" on public.course_attempt_answers;

-- Quiz for a learner: questions and options WITHOUT is_correct or explanations.
create or replace function public.course_quiz_for_learner(p_quiz uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare result jsonb;
begin
  if not public.course_quiz_visible(p_quiz) then
    return null;
  end if;
  select jsonb_build_object(
    'id', q.id, 'kind', q.kind, 'graded', q.graded, 'pass_mark_percent', q.pass_mark_percent,
    'shuffle_questions', q.shuffle_questions, 'shuffle_options', q.shuffle_options,
    'max_attempts', q.max_attempts,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', qq.id, 'type', qq.type, 'prompt', qq.prompt, 'media_ref', qq.media_ref, 'points', qq.points,
        'options', coalesce((
          select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.option_text) order by o.order_index, o.id)
          from public.course_question_options o where o.question_id = qq.id), '[]'::jsonb)
      ) order by qq.order_index, qq.id)
      from public.course_questions qq where qq.quiz_id = q.id), '[]'::jsonb)
  ) into result
  from public.course_quizzes q where q.id = p_quiz;
  return result;
end;
$$;
grant execute on function public.course_quiz_for_learner(uuid) to anon, authenticated;

-- Grade a quiz inside the database.
-- p_answers = {"<question_id>": ["<option_id>", ...], ...}
-- Auto-marked types: multiple_choice, true_false, multi_select, audio_choice.
-- Other types (matching, short_answer, essay, file_submission) are not scored here.
-- Needs a signed-in user (an anonymous guest session counts as signed in).
create or replace function public.course_submit_quiz(p_quiz uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  qz public.course_quizzes%rowtype;
  tries int;
  attempt uuid;
  qq record;
  chosen text[]; right_ids text[];
  ok boolean; earned numeric := 0; total numeric := 0;
  pct numeric; did_pass boolean;
  results jsonb := '[]'::jsonb;
  reveal boolean;
begin
  if uid is null then raise exception 'Please sign in first.' using errcode = '42501'; end if;
  if not public.course_quiz_visible(p_quiz) then raise exception 'Quiz not available.' using errcode = '42501'; end if;
  select * into qz from public.course_quizzes where id = p_quiz;
  if qz.max_attempts is not null then
    select count(*) into tries from public.course_quiz_attempts where user_id = uid and quiz_id = p_quiz;
    if tries >= qz.max_attempts then raise exception 'No attempts left for this quiz.' using errcode = 'P0001'; end if;
  end if;
  reveal := (qz.kind <> 'final');

  insert into public.course_quiz_attempts (user_id, quiz_id) values (uid, p_quiz) returning id into attempt;

  for qq in select * from public.course_questions where quiz_id = p_quiz order by order_index, id loop
    if qq.type in ('multiple_choice','true_false','multi_select','audio_choice') then
      select coalesce(array_agg(x order by x), '{}') into chosen
        from jsonb_array_elements_text(coalesce(p_answers -> qq.id::text, '[]'::jsonb)) as t(x);
      select coalesce(array_agg(o.id::text order by o.id::text), '{}') into right_ids
        from public.course_question_options o where o.question_id = qq.id and o.is_correct;
      ok := (chosen = right_ids and array_length(right_ids,1) is not null);
      total := total + qq.points;
      if ok then earned := earned + qq.points; end if;
      insert into public.course_attempt_answers (attempt_id, question_id, answer, is_correct)
        values (attempt, qq.id, coalesce(p_answers -> qq.id::text, '[]'::jsonb), ok);
      results := results || jsonb_build_array(jsonb_build_object(
        'question_id', qq.id, 'correct', ok,
        'correct_option_ids', case when reveal then to_jsonb(right_ids) else null end,
        'explanation', case when reveal then qq.explanation else null end));
    end if;
  end loop;

  pct := case when total > 0 then round(earned / total * 100, 1) else null end;
  did_pass := case when pct is null then null else pct >= qz.pass_mark_percent end;
  update public.course_quiz_attempts set score_percent = pct, passed = did_pass where id = attempt;
  return jsonb_build_object('attempt_id', attempt, 'score_percent', pct, 'passed', did_pass,
                            'graded', qz.graded, 'results', results);
end;
$$;
grant execute on function public.course_submit_quiz(uuid, jsonb) to authenticated;
revoke execute on function public.course_submit_quiz(uuid, jsonb) from anon;
