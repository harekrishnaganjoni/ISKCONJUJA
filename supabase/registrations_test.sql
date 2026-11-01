-- ISKCON JUJA: sign-ups access test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ok boolean; ad uuid := gen_random_uuid(); mem uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local'),(mem,'zz-m@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin'),(mem,'zz-m@test.local','member') on conflict (id) do update set role = excluded.role;

  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  ok := false; begin insert into public.registrations (name, contact, program) values ('ZZ Visitor','0700 000 000','Tuesday & Friday evening program'); ok := true; exception when others then ok := false; end;
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' a visitor can sign up' || E'\n';
  select count(*) into n from public.registrations;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor cannot read the sign-up list' || E'\n';
  ok := false; begin insert into public.registrations (name, contact, program, channel) values ('ZZ','0700 000 000','x','whatsapp'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' an unknown channel is refused' || E'\n';
  ok := false; begin insert into public.registrations (name, contact, program) values ('','1','x'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' an empty name or tiny contact is refused' || E'\n';
  delete from public.registrations; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor cannot delete sign-ups' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', mem::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.registrations;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an ordinary member cannot read the list' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.registrations;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' an admin can read the list (saw ' || n || ')' || E'\n';
  delete from public.registrations; get diagnostics n = row_count;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' an admin can delete a sign-up' || E'\n';
  reset role;
  raise exception E'TEST REPORT\n%', rep;
end $$;
