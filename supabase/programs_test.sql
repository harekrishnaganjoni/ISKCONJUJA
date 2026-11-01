-- ISKCON JUJA: weekly programs test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ok boolean; ad uuid := gen_random_uuid(); mem uuid := gen_random_uuid(); hid uuid;
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local'),(mem,'zz-m@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin'),(mem,'zz-m@test.local','member') on conflict (id) do update set role = excluded.role;
  select count(*) into n from public.programs;
  rep := rep || case when n >= 2 then 'PASS' else 'FAIL' end || ' the Tuesday and Friday programs are in place (' || n || ' rows)' || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.programs (weekday, title, start_time, end_time, published) values (3,'ZZ hidden','10:00','11:00',false) returning id into hid;
  rep := rep || 'PASS an admin can add a program' || E'\n';
  ok := false; begin insert into public.programs (weekday, title, start_time, end_time) values (9,'x','10:00','11:00'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a day that is not 0-6 is refused' || E'\n';
  ok := false; begin insert into public.programs (weekday, title, start_time, end_time) values (3,'x','12:00','11:00'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' an end time before the start time is refused' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.programs where id = hid;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor does not see an unpublished program' || E'\n';
  select count(*) into n from public.programs;
  rep := rep || case when n >= 2 then 'PASS' else 'FAIL' end || ' a visitor sees the published programs' || E'\n';
  ok := false; begin insert into public.programs (weekday, title, start_time, end_time) values (3,'x','10:00','11:00'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a visitor cannot add a program' || E'\n';
  update public.programs set title = 'hacked'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor cannot change a program' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', mem::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.programs; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an ordinary member cannot delete programs' || E'\n';
  reset role;
  raise exception E'TEST REPORT\n%', rep;
end $$;
