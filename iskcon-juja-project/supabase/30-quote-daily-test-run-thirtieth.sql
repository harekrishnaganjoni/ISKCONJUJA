-- 30: TEST for 29 (optional). Makes sample quotes, checks the daily quote, then rolls back (nothing is kept).
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ad uuid := gen_random_uuid(); j jsonb; x text; a text; b text; t smallint;
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin') on conflict (id) do update set role='admin';
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  -- 4 Tuesday quotes (theme 2), 3 Wednesday quotes (theme 3), a draft theme-2 quote, one bad theme
  j := public.admin_import_quotes('[
   {"quote_text":"Daily test quote T1 about the soul.","source":"Srila Prabhupada, Test","theme":2},
   {"quote_text":"Daily test quote T2 about the soul.","source":"Srila Prabhupada, Test","theme":2},
   {"quote_text":"Daily test quote T3 about the soul.","source":"Srila Prabhupada, Test","theme":2},
   {"quote_text":"Daily test quote T4 about the soul.","source":"Srila Prabhupada, Test","theme":2},
   {"quote_text":"Daily test quote W1 about knowledge.","source":"Srila Prabhupada, Test","theme":3},
   {"quote_text":"Daily test quote W2 about knowledge.","source":"Srila Prabhupada, Test","theme":3},
   {"quote_text":"Daily test quote W3 about knowledge.","source":"Srila Prabhupada, Test","theme":3},
   {"quote_text":"Daily test quote DRAFT never shown.","source":"Srila Prabhupada, Test","theme":2,"suggested_aud":"public"},
   {"quote_text":"Daily test quote BAD theme nine.","source":"Srila Prabhupada, Test","theme":9}]'::jsonb);
  rep := rep || case when (j->>'added')::int = 8 and (j->>'skipped')::int = 1 then 'PASS' else 'FAIL' end || ' import keeps themes and skips a bad one (' || j::text || ')' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  -- 2026-11-17 is a Tuesday: it must be a theme-2 quote
  select quote_text, theme into x, t from public.get_daily_quote(date '2026-11-17');
  rep := rep || case when t = 2 and x like 'Daily test quote T%' then 'PASS' else 'FAIL' end || ' a visitor gets a Tuesday theme quote on a Tuesday (' || coalesce(x,'none') || ')' || E'\n';
  select quote_text, theme into x, t from public.get_daily_quote(date '2026-11-18');
  rep := rep || case when t = 3 and x like 'Daily test quote W%' then 'PASS' else 'FAIL' end || ' and a Wednesday theme quote on a Wednesday' || E'\n';
  select count(*) into n from public.get_daily_quote(date '2026-11-17');
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' only one quote a day' || E'\n';
  select quote_text into a from public.get_daily_quote(date '2026-11-17'); select quote_text into b from public.get_daily_quote(date '2026-11-17');
  rep := rep || case when a = b then 'PASS' else 'FAIL' end || ' the same day always gives the same quote' || E'\n';
  select count(distinct q) into n from (select (select quote_text from public.get_daily_quote(date '2026-11-17' + 7 * g.n)) q from generate_series(0, 3) as g(n)) s;
  rep := rep || case when n = 4 then 'PASS' else 'FAIL' end || ' four Tuesdays in a row show four different quotes (' || n || ')' || E'\n';
  select quote_text into a from public.get_daily_quote(date '2026-11-17'); select quote_text into b from public.get_daily_quote(date '2026-11-17' + 28);
  rep := rep || case when a = b then 'PASS' else 'FAIL' end || ' after all four it starts again' || E'\n';
  select count(*) into n from (select distinct quote_text from public.get_daily_quote(date '2026-11-17') union select quote_text from public.get_daily_quote(date '2026-11-24')) s where quote_text like '%DRAFT%' or quote_text like '%BAD%';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' drafts and rejected lines are never shown' || E'\n';
  -- Friday (theme 5) has nothing yet: falls back to any home-page quote
  select count(*) into n from public.get_daily_quote(date '2026-11-20');
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' a weekday with no themed quotes still gets a quote' || E'\n';
  -- today (no date given) works too
  select count(*) into n from public.get_daily_quote();
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' works without a date' || E'\n';
  reset role;
  raise exception 'TEST REPORT%', E'\n' || rep;
end $$;
