-- ISKCON JUJA: registration/onboarding test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ok boolean; a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); ad uuid := gen_random_uuid(); g uuid := gen_random_uuid(); x text; arr text[];
begin
  insert into auth.users (id, email, raw_user_meta_data) values
   (a,'zz-a@test.local', jsonb_build_object('reg', jsonb_build_object('full_name','ZZ Alpha','initiated_name','Test Das','phone','0700000000','rounds','16','principles',jsonb_build_array('no_meat','hack','prefer_not'),'why',jsonb_build_array('peace','festivals','<script>'),'why_other','friends told me','hope',jsonb_build_array('calendar'),'how_heard','a friend','area','Juja','contact_pref','whatsapp','consent','true'))),
   (b,'zz-b@test.local', '{}'::jsonb),
   (g,'zz-g@test.local', jsonb_build_object('reg', 'not an object')),
   (ad,'zz-ad@test.local', '{}'::jsonb);
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin') on conflict (id) do update set role = 'admin';
  select role || '/' || approval into x from public.profiles where id = a;
  rep := rep || case when x = 'member/pending' then 'PASS' else 'FAIL' end || ' a new sign-up can use the member area at once, marked pending approval (' || x || ')' || E'\n';
  select full_name into x from public.profiles where id = a;
  rep := rep || case when x = 'ZZ Alpha' then 'PASS' else 'FAIL' end || ' the name is kept on the profile' || E'\n';
  select count(*) into n from public.member_onboarding where user_id = a;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' the answers are saved at sign-up' || E'\n';
  select principles into arr from public.member_onboarding where user_id = a;
  rep := rep || case when arr @> array['no_meat','prefer_not'] and not (arr @> array['hack']) then 'PASS' else 'FAIL' end || ' unknown choices are dropped' || E'\n';
  select why into arr from public.member_onboarding where user_id = a;
  rep := rep || case when arr @> array['peace','festivals'] and cardinality(arr) = 2 then 'PASS' else 'FAIL' end || ' only allowed reasons are kept' || E'\n';
  select count(*) into n from public.member_onboarding where user_id = a and consent_at is not null and rounds = '16' and contact_pref = 'whatsapp';
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' consent time, rounds and contact choice saved' || E'\n';
  select count(*) into n from public.member_onboarding where user_id in (b, g);
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a sign-up without answers (or with garbage answers) still works and saves nothing' || E'\n';
  select count(*) into n from public.profiles where id in (b, g);
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' those sign-ups still got a profile' || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.member_onboarding;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' a member sees only their own answers' || E'\n';
  update public.member_onboarding set rounds = '4_8' where user_id = a; get diagnostics n = row_count;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' a member can change their own answers' || E'\n';
  ok := true; begin update public.member_onboarding set area = repeat('x', 500) where user_id = a; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' over-long text is refused' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.member_onboarding;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another member cannot see them' || E'\n';
  update public.member_onboarding set rounds = 'more'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another member cannot change them' || E'\n';
  delete from public.member_onboarding; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another member cannot delete them' || E'\n';
  ok := false; begin insert into public.member_onboarding (user_id, rounds) values (a, '16'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a member cannot write answers for someone else' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.member_onboarding;
  rep := rep || case when n >= 1 then 'PASS' else 'FAIL' end || ' an admin can read the answers' || E'\n';
  update public.member_onboarding set rounds = 'more'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an admin cannot change them' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.member_onboarding;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor sees nothing' || E'\n';
  reset role;

  -- approval
  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.review_member(a, true); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a member cannot approve anyone' || E'\n';
  ok := false; begin update public.profiles set approval = 'approved' where id = b; get diagnostics n = row_count; ok := n > 0; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a member cannot approve themselves' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.review_member(a, true);
  select approval into x from public.profiles where id = a;
  rep := rep || case when x = 'approved' then 'PASS' else 'FAIL' end || ' an admin can approve' || E'\n';
  perform public.review_member(b, false, 'We could not confirm you are a devotee of our temple.');
  select role || '/' || approval || '/' || reject_reason into x from public.profiles where id = b;
  rep := rep || case when x like 'pending/rejected/We could%' then 'PASS' else 'FAIL' end || ' an admin can reject with a reason, and access is removed' || E'\n';
  ok := false; begin perform public.review_member(ad, false, 'x'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' admins cannot be rejected here' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select reject_reason into x from public.profiles where id = b;
  rep := rep || case when x like 'We could%' then 'PASS' else 'FAIL' end || ' the rejected person can read the reason' || E'\n';
  perform public.finish_rejection();
  reset role;
  select count(*) into n from auth.users where id = b;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' after reading it, the rejected account is deleted' || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.finish_rejection();
  reset role;
  select count(*) into n from auth.users where id = a;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' finish_rejection never deletes an approved account' || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.admin_delete_member(g);
  reset role;
  select count(*) into n from auth.users where id = g;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an admin can delete an ordinary member' || E'\n';
  raise exception 'TEST REPORT%', E'\n' || rep;
end $$;
