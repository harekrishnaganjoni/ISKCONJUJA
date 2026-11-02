-- ISKCON JUJA: member details + milestones privacy test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ok boolean; a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); ad uuid := gen_random_uuid(); pe uuid := gen_random_uuid(); i int;
begin
  insert into auth.users (id, email) values (a,'zz-a@test.local'),(b,'zz-b@test.local'),(ad,'zz-ad@test.local'),(pe,'zz-p@test.local');
  insert into public.profiles (id, email, role) values (a,'zz-a@test.local','member'),(b,'zz-b@test.local','member'),(ad,'zz-ad@test.local','admin'),(pe,'zz-p@test.local','pending') on conflict (id) do update set role = excluded.role;

  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.member_details (user_id, full_name, phone) values (a, 'ZZ Member A', '0700 000 000');
  insert into public.member_milestones (user_id, kind, title, event_date) values (a, 'birthday', 'My birthday', '1999-08-28'), (a, 'initiation', 'Harinama initiation', '2015-03-14');
  rep := rep || 'PASS a member can save their details and milestones' || E'\n';
  select count(*) into n from public.member_milestones;
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' a member sees their own milestones (' || n || ')' || E'\n';
  update public.member_milestones set remind = false where user_id = a; get diagnostics n = row_count;
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' a member can change their own milestones' || E'\n';
  ok := false; begin insert into public.member_milestones (user_id, title, event_date) values (b, 'x', '2000-01-01'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a member cannot add a milestone for someone else' || E'\n';
  ok := false; begin insert into public.member_milestones (user_id, kind, title, event_date) values (a, 'party', 'x', '2000-01-01'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' an unknown kind is refused' || E'\n';
  ok := false; begin insert into public.member_milestones (user_id, title, event_date) values (a, 'future', '2999-01-01'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a date in the future is refused' || E'\n';
  ok := false; begin insert into public.member_milestones (user_id, title, event_date) values (a, 'old', '1800-01-01'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a date before 1900 is refused' || E'\n';
  ok := true; begin for i in 1..45 loop insert into public.member_milestones (user_id, title, event_date) values (a, 'm' || i, '2000-01-01'); end loop; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' more than 40 milestones are refused' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.member_milestones;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another member cannot see them' || E'\n';
  select count(*) into n from public.member_details;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another member cannot see the details' || E'\n';
  update public.member_milestones set title = 'hacked'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another member cannot change them' || E'\n';
  delete from public.member_milestones; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another member cannot delete them' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.member_milestones;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an admin cannot see members'' milestones' || E'\n';
  select count(*) into n from public.member_details;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an admin cannot see members'' details' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', pe::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin insert into public.member_milestones (user_id, title, event_date) values (pe, 'x', '2000-01-01'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a person still waiting for approval cannot save milestones' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.member_milestones;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor cannot see any milestones' || E'\n';
  reset role;
  raise exception E'TEST REPORT\n%', rep;
end $$;
