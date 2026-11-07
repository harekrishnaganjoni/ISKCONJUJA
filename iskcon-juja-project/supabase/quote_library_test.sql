-- ISKCON JUJA: Quote Library test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; x text; ad uuid := gen_random_uuid(); mem uuid := gen_random_uuid(); a uuid; b uuid; j jsonb; d date := (now() at time zone 'Africa/Nairobi')::date;
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local'),(mem,'zz-m@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin') on conflict (id) do update set role='admin';
  insert into public.profiles (id, email, role) values (mem,'zz-m@test.local','member') on conflict (id) do update set role='member';
  select count(*) into n from public.quotes where book = 'Bhagavad-gita' and source_url like 'https://vedabase.io/en/library/bg/%';
  rep := rep || case when n >= 20 then 'PASS' else 'FAIL' end || ' starter Gita quotes are labelled with the book and a Vedabase link (' || n || ')' || E'\n';
  select source_url into x from public.quotes where source = 'Bhagavad-gita 6.6';
  rep := rep || case when x = 'https://vedabase.io/en/library/bg/6/6/' then 'PASS' else 'FAIL' end || ' link looks right (' || coalesce(x,'none') || ')' || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', mem::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform public.admin_import_quotes('[{"quote_text":"A member must not import quotes here.","source":"Bg. 1.1"}]'::jsonb); x := 'allowed';
  exception when others then x := 'blocked'; end;
  rep := rep || case when x = 'blocked' then 'PASS' else 'FAIL' end || ' a member cannot import quotes' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  j := public.admin_import_quotes('[{"quote_text":"Test quote number one for the library.","source":"Bg. 9.9","book":"Bhagavad-gita","source_url":"https://vedabase.io/en/library/bg/9/9/"},{"quote_text":"Test quote number one for the library.","source":"Bg. 9.9"},{"quote_text":"short","source":"Bg. 1.1"},{"quote_text":"Test quote two, daily only, no weekly.","source":"Bg. 9.10","use_weekly":false}]'::jsonb);
  rep := rep || case when (j->>'added')::int = 2 and (j->>'skipped')::int = 2 then 'PASS' else 'FAIL' end || ' import adds new quotes and skips duplicates and bad rows (' || j::text || ')' || E'\n';
  reset role;

  select id into a from public.quotes where quote_text like 'Test quote number one%';
  select id into b from public.quotes where quote_text like 'Test quote two%';
  -- weekly pool excludes quotes marked daily-only
  update public.quotes set use_weekly = false where id <> a;
  delete from public.weekly_quote where week_key = to_char(now(), 'IYYY-"W"IW');
  select id into x from public.get_weekly_quote();
  rep := rep || case when x::uuid = a then 'PASS' else 'FAIL' end || ' Quote of the Week only picks quotes marked for the week' || E'\n';
  -- scheduled Verse of the Day wins
  delete from public.votd_day where day = d;
  update public.quotes set verse_date = d, use_votd = true where id = b;
  select id into x from public.get_verse_of_day();
  rep := rep || case when x::uuid = b then 'PASS' else 'FAIL' end || ' a scheduled Verse of the Day is used on its date' || E'\n';
  select id into x from public.get_verse_of_day();
  rep := rep || case when x::uuid = b then 'PASS' else 'FAIL' end || ' it stays the same all day' || E'\n';
  -- rotation when nothing is scheduled
  update public.quotes set verse_date = null; delete from public.votd_day where day = d;
  select count(*) into n from public.get_verse_of_day();
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' with nothing scheduled, one quote is still chosen' || E'\n';
  raise exception 'TEST REPORT%', E'\n' || rep;
end $$;
