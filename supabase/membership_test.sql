-- ISKCON JUJA: membership applications test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ok boolean; ad uuid := gen_random_uuid(); mem uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local'),(mem,'zz-m@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin'),(mem,'zz-m@test.local','member') on conflict (id) do update set role = excluded.role;

  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  ok := false; begin insert into public.membership_applications (name, phone) values ('ZZ Applicant','0700 000 000'); ok := true; exception when others then ok := false; end;
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' a visitor can apply' || E'\n';
  ok := false; begin insert into public.membership_applications (name, email, status) values ('ZZ Sneaky','a@b.co','approved'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a visitor cannot apply as already approved' || E'\n';
  ok := false; begin insert into public.membership_applications (name) values ('ZZ NoContact'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' an application without any contact is refused' || E'\n';
  select count(*) into n from public.membership_applications;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor cannot read applications' || E'\n';
  update public.membership_applications set status = 'approved'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor cannot approve' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', mem::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.membership_applications;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an ordinary member cannot read applications' || E'\n';
  update public.membership_applications set status = 'approved'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an ordinary member cannot approve' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.membership_applications;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' an admin sees the application (saw ' || n || ')' || E'\n';
  update public.membership_applications set status = 'approved'; get diagnostics n = row_count;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' an admin can approve' || E'\n';
  delete from public.membership_applications; get diagnostics n = row_count;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' an admin can delete' || E'\n';
  reset role;
  raise exception E'TEST REPORT\n%', rep;
end $$;
