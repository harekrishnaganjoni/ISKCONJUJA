-- ISKCON JUJA: "said today" test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ad uuid := gen_random_uuid(); j jsonb; x text; m text; a text; b text;
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin') on conflict (id) do update set role='admin';
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  j := public.admin_import_quotes('[
   {"quote_text":"Said-today quote A for lunar day 6.20, first.","source":"Srila Prabhupada, Lecture, Test, 20 Nov 1974","said_on":"1974-11-20","vaish_masa":6,"vaish_tithi":20},
   {"quote_text":"Said-today quote B for lunar day 6.20, second.","source":"Srila Prabhupada, Letter, Test, 2 Mar 1971","said_on":"1971-03-02","vaish_masa":6,"vaish_tithi":20},
   {"quote_text":"Said-today quote C for lunar day 6.20, third.","source":"Srila Prabhupada, Letter, Test, 5 May 1972","said_on":"1972-05-05","vaish_masa":6,"vaish_tithi":20},
   {"quote_text":"Said-today quote D only on date 07-07.","source":"Srila Prabhupada, Lecture, Test, 7 Jul 1973","said_on":"1973-07-07","vaish_masa":2,"vaish_tithi":3},
   {"quote_text":"Said-today quote E draft for lunar day 4.4.","source":"Srila Prabhupada, Lecture, Test","suggested_aud":"public","said_on":"1973-08-08","vaish_masa":4,"vaish_tithi":4},
   {"quote_text":"Said-today quote F bad tithi.","source":"Srila Prabhupada, Lecture, Test","said_on":"1973-05-05","vaish_masa":3,"vaish_tithi":77}]'::jsonb);
  rep := rep || case when (j->>'added')::int = 5 and (j->>'skipped')::int = 1 then 'PASS' else 'FAIL' end || ' import keeps dates and skips a bad tithi (' || j::text || ')' || E'\n';
  select g.quote_text, g.match into x, m from public.get_said_today(6, 20, '11-20', 2026) g;
  rep := rep || case when m = 'lunar' and x like 'Said-today quote%' then 'PASS' else 'FAIL' end || ' a member gets one quote for the lunar day' || E'\n';
  select count(*) into n from public.get_said_today(6, 20, '11-20', 2026);
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' only one quote is returned (' || n || ')' || E'\n';
  select quote_text into a from public.get_said_today(6, 20, '11-20', 2026);
  select quote_text into b from public.get_said_today(6, 20, '11-20', 2027);
  rep := rep || case when a is distinct from b then 'PASS' else 'FAIL' end || ' the next year shows a different quote' || E'\n';
  select count(distinct q) into n from (select (select quote_text from public.get_said_today(6, 20, '11-20', y)) q from generate_series(2026, 2028) y) s;
  rep := rep || case when n = 3 then 'PASS' else 'FAIL' end || ' three years in a row show three different quotes (' || n || ')' || E'\n';
  select g.match, g.quote_text into m, x from public.get_said_today(9, 9, '07-07', 2026) g;
  rep := rep || case when m = 'date' and x like '%only on date 07-07%' then 'PASS' else 'FAIL' end || ' with no quote for the lunar day it falls back to the same date' || E'\n';
  select count(*) into n from public.get_said_today(4, 4, '01-01', 2026);
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' drafts are never shown, and an empty day gives nothing' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin select count(*) into n from public.get_said_today(6, 20, '11-20', 2026); x := 'allowed'; exception when others then x := 'blocked'; end;
  rep := rep || case when x = 'blocked' or n = 0 then 'PASS' else 'FAIL' end || ' visitors who are not signed in get nothing' || E'\n';
  reset role;
  raise exception 'TEST REPORT%', E'\n' || rep;
end $$;
