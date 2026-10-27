-- ============================================================
-- COURSE SYSTEM: access + grading test. Run AFTER course_system_hardening.sql.
-- Changes nothing (rolled back). The result appears as a red message
-- starting "COURSE TEST REPORT". Send me the whole thing.
-- ============================================================
do $$
declare
  rep text := '';
  n int; ok boolean; j jsonb;
  c_pub uuid; c_mem uuid; c_draft uuid;
  m_pub uuid; m_mem uuid; l_pub uuid; l_mem uuid;
  quiz uuid; q1 uuid; o_right uuid; o_wrong uuid;
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
begin
  -- fixtures (owner role, bypasses RLS)
  insert into auth.users (id, email) values (u1, 'zz1@test.local'), (u2, 'zz2@test.local');
  insert into public.courses (title, published, visibility) values ('ZZ pub', true, 'public') returning id into c_pub;
  insert into public.courses (title, published, visibility) values ('ZZ mem', true, 'members') returning id into c_mem;
  insert into public.courses (title, published, visibility) values ('ZZ draft', false, 'public') returning id into c_draft;
  insert into public.course_modules (course_id, title, published) values (c_pub, 'M pub', true) returning id into m_pub;
  insert into public.course_modules (course_id, title, published) values (c_mem, 'M mem', true) returning id into m_mem;
  insert into public.course_lessons (module_id, title, published) values (m_pub, 'L pub', true) returning id into l_pub;
  insert into public.course_lessons (module_id, title, published) values (m_mem, 'L mem', true) returning id into l_mem;
  insert into public.course_blocks (lesson_id, type, content) values
    (l_pub, 'text', '{"text":"ZZ visible text"}'),
    (l_pub, 'quote', '{"quote_text":"ZZ unverified","verified":false}'),
    (l_pub, 'quote', '{"quote_text":"ZZ verified","verified":true}'),
    (l_mem, 'text', '{"text":"ZZ members only"}');
  insert into public.course_quizzes (module_id, kind, graded, published, max_attempts) values (m_pub, 'review', false, true, 2) returning id into quiz;
  insert into public.course_questions (quiz_id, type, prompt, explanation) values (quiz, 'multiple_choice', 'ZZ q', 'ZZ because') returning id into q1;
  insert into public.course_question_options (question_id, option_text, is_correct) values (q1, 'right', true) returning id into o_right;
  insert into public.course_question_options (question_id, option_text, is_correct) values (q1, 'wrong', false) returning id into o_wrong;

  ---------------- GUEST (not signed in) ----------------
  set local role anon;
  select count(*) into n from public.course_blocks where content::text like '%ZZ%';
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' guest sees only the public text + the VERIFIED quote (saw ' || n || ', want 2)' || E'\n';
  select count(*) into n from public.course_blocks where content::text like '%members only%';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guest cannot read members-only lesson blocks' || E'\n';
  select count(*) into n from public.course_lessons where title = 'L mem';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guest cannot read members-only lessons' || E'\n';
  select count(*) into n from public.course_questions;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guest cannot read quiz questions directly' || E'\n';
  select count(*) into n from public.course_question_options;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guest cannot read the answer key (options)' || E'\n';
  j := public.course_quiz_for_learner(quiz);
  rep := rep || case when j is not null and j::text not like '%is_correct%' and j::text not like '%ZZ because%' then 'PASS' else 'FAIL' end || ' quiz for learners contains no answer key or explanations' || E'\n';
  ok := false; begin perform public.course_submit_quiz(quiz, '{}'::jsonb); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' guest without a session cannot submit a quiz' || E'\n';
  reset role;

  ---------------- SIGNED-IN LEARNER (anonymous-session style) ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', u1::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin insert into public.course_quiz_attempts (user_id, quiz_id, score_percent, passed) values (u1, quiz, 100, true); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' learner cannot write a quiz score directly' || E'\n';
  j := public.course_submit_quiz(quiz, jsonb_build_object(q1::text, jsonb_build_array(o_wrong::text)));
  rep := rep || case when (j->>'score_percent')::numeric = 0 then 'PASS' else 'FAIL' end || ' wrong answer scores 0 (got ' || (j->>'score_percent') || ')' || E'\n';
  rep := rep || case when j::text like '%' || o_right::text || '%' then 'PASS' else 'FAIL' end || ' review quiz shows the correct answer after submitting' || E'\n';
  j := public.course_submit_quiz(quiz, jsonb_build_object(q1::text, jsonb_build_array(o_right::text)));
  rep := rep || case when (j->>'score_percent')::numeric = 100 and (j->>'passed')::boolean then 'PASS' else 'FAIL' end || ' right answer scores 100 and passes' || E'\n';
  ok := false; begin perform public.course_submit_quiz(quiz, '{}'::jsonb); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' third attempt refused (max 2)' || E'\n';
  select count(*) into n from public.course_quiz_attempts;
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' learner sees only their own 2 attempts (saw ' || n || ')' || E'\n';
  select count(*) into n from public.course_lessons where title = 'L mem';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' non-member learner cannot read members-only lessons' || E'\n';
  reset role;

  ---------------- A DIFFERENT LEARNER ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', u2::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.course_quiz_attempts;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another learner cannot see those attempts' || E'\n';
  reset role;

  raise exception E'COURSE TEST REPORT\n%', rep;
end $$;
