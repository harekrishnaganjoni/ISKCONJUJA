-- ISKCON JUJA: Vaishnava calendar test (nothing is kept). Paste into the Supabase SQL Editor and Run.
-- The result appears as a message beginning "TEST REPORT" (shown as an error: that is how the rollback is forced).
do $$
declare rep text := ''; n int; ok boolean; ad uuid := gen_random_uuid(); mem uuid := gen_random_uuid(); hid uuid;
begin
  insert into auth.users (id, email) values (ad,'zz-ad@test.local'),(mem,'zz-m@test.local');
  insert into public.profiles (id, email, role) values (ad,'zz-ad@test.local','admin'),(mem,'zz-m@test.local','member') on conflict (id) do update set role = excluded.role;
  select count(*) into n from public.vaishnava_days where kind = 'ekadashi';
  rep := rep || case when n >= 29 then 'PASS' else 'FAIL' end || ' the Ekadashi days are in place (' || n || ' rows)' || E'\n';
  select count(*) into n from public.vaishnava_days where day = '2026-11-21' and title = 'Utthana Ekadashi';
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' Utthana Ekadashi is on 21 Nov 2026' || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.vaishnava_days (day, title, kind, published) values ('2026-11-12','ZZ hidden festival','festival',false) returning id into hid;
  rep := rep || 'PASS an admin can add a festival day' || E'\n';
  ok := false; begin insert into public.vaishnava_days (day, title, kind) values ('2026-11-12','ZZ x','nonsense'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' an unknown kind is refused' || E'\n';
  ok := false; begin insert into public.vaishnava_days (day, title, kind) values ('2026-11-21','Utthana Ekadashi','ekadashi'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' the same day and title cannot be added twice' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.vaishnava_days where id = hid;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor does not see an unpublished day' || E'\n';
  select count(*) into n from public.vaishnava_days;
  rep := rep || case when n >= 29 then 'PASS' else 'FAIL' end || ' a visitor sees the published days' || E'\n';
  ok := false; begin insert into public.vaishnava_days (day, title) values ('2026-12-01','ZZ'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a visitor cannot add a day' || E'\n';
  update public.vaishnava_days set title = 'hacked'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a visitor cannot change a day' || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', mem::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.vaishnava_days; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' an ordinary member cannot delete days' || E'\n';
  reset role;
  raise exception E'TEST REPORT\n%', rep;
end $$;
