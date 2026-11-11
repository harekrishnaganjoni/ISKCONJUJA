-- ISKCON JUJA: "said today" test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ad uuid := gen_random_uuid(); j jsonb; x text; m text;
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin') on conflict (id) do update set role='admin';
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  j := public.admin_import_quotes('[
   {"quote_text":"Said-today quote A, public, both calendars.","source":"Srila Prabhupada, Lecture, Test, 20 Nov 1974","use_weekly":true,"use_votd":true,"said_on":"1974-11-20","vaish_masa":6,"vaish_tithi":20},
   {"quote_text":"Said-today quote B, public, same date only.","source":"Srila Prabhupada, Letter, Test","use_weekly":true,"use_votd":true,"said_on":"1969-11-20","vaish_masa":2,"vaish_tithi":3},
   {"quote_text":"Said-today quote C, public, same tithi only.","source":"Srila Prabhupada, Lecture, Test","use_weekly":true,"use_votd":true,"said_on":"1971-03-02","vaish_masa":6,"vaish_tithi":20},
   {"quote_text":"Said-today quote D, members only, same date.","source":"Srila Prabhupada, Lecture, Test","use_weekly":false,"use_votd":true,"said_on":"1972-11-20","vaish_masa":1,"vaish_tithi":1},
   {"quote_text":"Said-today quote E, draft, same date.","source":"Srila Prabhupada, Lecture, Test","suggested_aud":"public","said_on":"1973-11-20","vaish_masa":1,"vaish_tithi":2},
   {"quote_text":"Said-today quote F, other day.","source":"Srila Prabhupada, Lecture, Test","use_weekly":true,"use_votd":true,"said_on":"1973-05-05","vaish_masa":3,"vaish_tithi":9},
   {"quote_text":"Said-today quote G bad tithi.","source":"Srila Prabhupada, Lecture, Test","said_on":"1973-05-05","vaish_masa":3,"vaish_tithi":77}]'::jsonb);
  rep := rep || case when (j->>'added')::int = 6 and (j->>'skipped')::int = 1 then 'PASS' else 'FAIL' end || ' import keeps dates and skips a bad tithi (' || j::text || ')' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.get_said_today('11-20', 6, 20);
  rep := rep || case when n = 3 then 'PASS' else 'FAIL' end || ' a visitor gets only public quotes for the date or the tithi (' || n || ')' || E'\n';
  select g.match into m from public.get_said_today('11-20', 6, 20) g limit 1;
  rep := rep || case when m = 'both' then 'PASS' else 'FAIL' end || ' a quote matching both calendars comes first' || E'\n';
  select count(*) into n from public.get_said_today('11-20', 6, 20) g where g.quote_text like '%members only%' or g.quote_text like '%draft%';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' visitors never see members-only or draft quotes' || E'\n';
  select count(*) into n from public.get_said_today('01-01', 0, 0);
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a day with no quotes gives an empty list' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.get_said_today('11-20', 6, 20);
  rep := rep || case when n = 4 then 'PASS' else 'FAIL' end || ' a signed-in member also gets members quotes but never drafts (' || n || ')' || E'\n';
  reset role;
  raise exception 'TEST REPORT%', E'\n' || rep;
end $$;
