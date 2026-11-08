-- ISKCON JUJA: Draft quotes test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ad uuid := gen_random_uuid(); j jsonb; x text; d text;
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin') on conflict (id) do update set role='admin';
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  j := public.admin_import_quotes('[{"quote_text":"Draft quote A for the review test.","source":"Bg. 9.9","suggested_aud":"public"},{"quote_text":"Draft quote B for the review test.","source":"Bg. 9.10","suggested_aud":"members"},{"quote_text":"Normal quote C for the review test.","source":"Bg. 9.11","use_weekly":true,"use_votd":true},{"quote_text":"Bad audience quote D for the test.","source":"Bg. 9.12","suggested_aud":"everyone"}]'::jsonb);
  rep := rep || case when (j->>'added')::int = 3 and (j->>'skipped')::int = 1 then 'PASS' else 'FAIL' end || ' import adds 3 and skips the bad audience (' || j::text || ')' || E'\n';
  select count(*) into n from public.quotes where quote_text like 'Draft quote %' and not use_weekly and not use_votd and suggested_aud is not null;
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' draft quotes are hidden (both ticks off) and remember the suggested audience (' || n || ')' || E'\n';
  select count(*) into n from public.quotes where quote_text like 'Normal quote C%' and use_weekly and use_votd and suggested_aud is null;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' a normal quote still publishes as before' || E'\n';
  update public.quotes set use_weekly = false, use_votd = false where quote_text not like 'Draft quote %';
  select quote_text into x from public.get_verse_of_day();
  rep := rep || case when x is null then 'PASS' else 'FAIL' end || ' Verse of the Day never picks a draft' || E'\n';
  select quote_text into x from public.get_weekly_quote();
  rep := rep || case when x is null then 'PASS' else 'FAIL' end || ' Quote of the Week never picks a draft' || E'\n';
  update public.quotes set use_weekly = true, use_votd = true, suggested_aud = null where quote_text like 'Draft quote A%';
  select quote_text into x from public.get_weekly_quote();
  rep := rep || case when x like 'Draft quote A%' then 'PASS' else 'FAIL' end || ' an approved draft is shown' || E'\n';
  reset role;
  raise exception 'TEST REPORT%', E'\n' || rep;
end $$;
