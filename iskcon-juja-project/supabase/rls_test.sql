-- ============================================================
-- ISKCON JUJA: role-by-role access test (read-only in effect)
-- Paste into the Supabase SQL Editor and Run. Everything is rolled
-- back at the end, so no data is changed.
-- The result appears as a message that begins "TEST REPORT" (it shows as an
-- error: that is how the rollback is forced. It is NOT a real failure).
-- Each line says PASS or FAIL. Send me the whole report.
-- ============================================================
do $$
declare
  rep text := '';
  n int;
  ok boolean;
  member_id uuid;
  fake uuid := gen_random_uuid();

begin
  -- fixtures created as the owner role (bypasses RLS)
  insert into public.courses (title, published, visibility) values ('ZZ test members', true, 'members');
  insert into public.courses (title, published, visibility) values ('ZZ test draft', false, 'public');
  insert into public.courses (title, published, visibility) values ('ZZ test public', true, 'public');
  insert into public.testimonials (name, message, published) values ('ZZ', 'ZZ hidden', false);
  insert into public.board_messages (author_name, body, hidden) values ('ZZ', 'ZZ hidden', true);

  ---------------- ANONYMOUS VISITOR ----------------
  set local role anon;
  select count(*) into n from public.courses where title like 'ZZ test%';
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' anon sees only the public published course (saw ' || n || ', want 1)' || E'\n';
  select count(*) into n from public.testimonials where message = 'ZZ hidden';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' anon cannot read unpublished testimonials' || E'\n';
  select count(*) into n from public.board_messages where body = 'ZZ hidden';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' anon cannot read hidden board posts' || E'\n';
  select count(*) into n from public.profiles;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' anon cannot read profiles' || E'\n';

  ok := false; begin insert into public.testimonials (name, message, published) values ('ZZ', 'ZZ ok', false); ok := true; exception when others then ok := false; end;
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' anon can submit an unpublished testimonial' || E'\n';
  ok := false; begin insert into public.testimonials (name, message, published) values ('ZZ', 'ZZ self-publish', true); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' anon cannot self-publish a testimonial' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body) values ('ZZ', 'ZZ post'); ok := true; exception when others then ok := false; end;
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' anon can post on the message board' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, is_admin_reply) values ('ZZ', 'ZZ fake admin', true); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' anon cannot post as Admin' || E'\n';
  ok := false; begin insert into public.site_settings (key, value) values ('zz_test', 'x'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' anon cannot write site settings' || E'\n';
  ok := false; begin insert into public.events (title, start_date, published) values ('ZZ', current_date, true); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' anon cannot create events' || E'\n';
  update public.board_messages set body = 'hacked'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' anon cannot edit board posts (changed ' || n || ')' || E'\n';
  delete from public.board_messages; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' anon cannot delete board posts (deleted ' || n || ')' || E'\n';
  ok := false; begin select count(*) into n from public.nectar_members; ok := (n = 0); exception when others then ok := true; end;
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' anon cannot read Nectar members' || E'\n';
  reset role;

  ---------------- LOGGED-IN PERSON WITH NO PROFILE ROLE (not member) ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', fake::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.courses where title like 'ZZ test%';
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' signed-in non-member sees only the public course (saw ' || n || ')' || E'\n';
  rep := rep || case when not public.is_admin() then 'PASS' else 'FAIL' end || ' signed-in non-member is not admin' || E'\n';
  ok := false; begin insert into public.site_settings (key, value) values ('zz_test', 'x'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' signed-in non-member cannot write site settings' || E'\n';
  reset role;

  ---------------- A REAL MEMBER (if one exists) ----------------
  select id into member_id from public.profiles where role = 'member' limit 1;
  if member_id is null then
    rep := rep || 'SKIP no member account exists yet (create one, then re-run to test members)' || E'\n';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', member_id::text, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*) into n from public.courses where title like 'ZZ test%';
    rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' member sees public + members courses, not drafts (saw ' || n || ', want 2)' || E'\n';
    update public.profiles set role = 'super_admin' where id = member_id; get diagnostics n = row_count;
    rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' member cannot promote themselves to admin' || E'\n';
    reset role;
  end if;

  raise exception E'TEST REPORT\n%', rep;   -- forces a full rollback; nothing is saved
end $$;
