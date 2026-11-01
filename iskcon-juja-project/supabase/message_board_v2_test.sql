-- ============================================================
-- ISKCON JUJA: Message Board v2 access test (nothing is kept)
-- Paste into the Supabase SQL Editor and Run (after message_board_v2.sql).
-- Everything is rolled back at the end. The result shows as a message that
-- begins "TEST REPORT" (it appears as an error: that is how the rollback is
-- forced, it is NOT a real failure). Each line says PASS or FAIL.
-- ============================================================
do $$
declare
  rep text := '';
  n int; ok boolean; msg text; root uuid; rid uuid;
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  ad uuid := gen_random_uuid(); pend uuid := gen_random_uuid();
  procedure_dummy int;
begin
  -- people (created as the owner role, which bypasses the rules)
  insert into auth.users (id, email) values (a,'zz-a@test.local'),(b,'zz-b@test.local'),(c,'zz-c@test.local'),(ad,'zz-ad@test.local'),(pend,'zz-p@test.local');
  insert into public.profiles (id, email, role) values (a,'zz-a@test.local','member'),(b,'zz-b@test.local','member'),(c,'zz-c@test.local','member'),(ad,'zz-ad@test.local','admin'),(pend,'zz-p@test.local','pending')
    on conflict (id) do update set role = excluded.role;

  ---------------- GUEST ----------------
  set local role anon;
  ok := false; begin insert into public.board_messages (author_name, body) values ('Guest Gina', 'ZZ hello'); ok := true; exception when others then msg := sqlerrm; end;
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' guest can post publicly' || E'\n';
  select author_kind into msg from public.board_messages where body = 'ZZ hello';
  rep := rep || case when msg = 'guest' then 'PASS' else 'FAIL' end || ' guest post is labelled guest (' || coalesce(msg,'none') || ')' || E'\n';
  foreach msg in array array['Admin','ADMIN Juja','iskcon juja','A.d.m.i.n','Moderator Mike','Official'] loop
    ok := false; begin insert into public.board_messages (author_name, body) values (msg, 'ZZ reserved'); ok := true; exception when others then ok := false; end;
    rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' guest cannot use the reserved name "' || msg || '"' || E'\n';
  end loop;
  ok := false; begin insert into public.board_messages (author_name, body, is_admin_reply) values ('Gina','ZZ fake admin', true); ok := true; exception when others then ok := false; end;
  select author_kind into msg from public.board_messages where body = 'ZZ fake admin';
  rep := rep || case when (not ok) or msg = 'guest' then 'PASS' else 'FAIL' end || ' guest cannot post as Admin' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, visibility, contact) values ('Gina','ZZ guest to admins','admin','0700 000 000'); ok := true; exception when others then msg := sqlerrm; end;
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' guest can write to the admins only (with a contact)' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, visibility) values ('Gina','ZZ no contact','admin'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a visitor cannot write to the admins without a contact' || E'\n';
  select count(*) into n from public.board_messages where body = 'ZZ guest to admins';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' ...and guests cannot read it back or anyone else''s' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, visibility, contact) values ('Admin','ZZ reserved to admins','admin','0700 111 111'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' reserved names are blocked there too' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, visibility, recipient_id, author_id) values ('Gina','ZZ sneaky private','private', a, b); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' guest cannot send a private message' || E'\n';
  update public.board_messages set body = 'hacked'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guest cannot edit messages' || E'\n';
  delete from public.board_messages; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guest cannot delete messages' || E'\n';
  select count(*) into n from public.board_directory();
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guest sees nobody in the member name directory' || E'\n';
  reset role;

  ---------------- NAMES ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.set_my_display_name('Admin Asha'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' member cannot take a reserved name' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body) values ('X','ZZ no name yet'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' member must choose a name before posting' || E'\n';
  perform public.set_my_display_name('Asha');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated; perform public.set_my_display_name('Baraka'); reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c::text, 'role', 'authenticated')::text, true);
  set local role authenticated; perform public.set_my_display_name('Chebet'); reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.set_my_display_name('asha'); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' two members cannot share a name' || E'\n';
  select count(*) into n from public.board_directory();
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' directory lists the other named members (saw ' || n || ', want 2)' || E'\n';
  reset role;

  ---------------- MEMBER PUBLIC POST ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.board_messages (author_name, body, author_kind, author_id) values ('Fake Name','ZZ member public','admin', c);
  select author_kind || '/' || author_name || '/' || (author_id = a)::text into msg from public.board_messages where body = 'ZZ member public';
  rep := rep || case when msg = 'member/Asha/true' then 'PASS' else 'FAIL' end || ' member post is forced to member / own name / own id (' || msg || ')' || E'\n';

  ---------------- MEMBER -> ADMINS ----------------
  insert into public.board_messages (author_name, body, visibility) values ('x','ZZ to admins from Asha','admin');
  select id into root from public.board_messages where body = 'ZZ to admins from Asha';
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon; select count(*) into n from public.board_messages where visibility = 'admin';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guest cannot read messages to the admins' || E'\n'; reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated; select count(*) into n from public.board_messages where visibility = 'admin';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' another member cannot read them' || E'\n'; reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.board_messages where visibility = 'admin';
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' an admin can read them, including the visitor''s (saw ' || n || ', want 2)' || E'\n';
  select count(*) into n from public.board_messages where body = 'ZZ guest to admins' and contact = '0700 000 000';
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' the visitor''s contact is kept for the admins' || E'\n';
  insert into public.board_messages (author_name, body, is_admin_reply, parent_id) values ('Admin','ZZ admin answer', true, root);
  select visibility || '/' || author_kind || '/' || (recipient_id = a)::text into msg from public.board_messages where body = 'ZZ admin answer';
  rep := rep || case when msg = 'admin/admin/true' then 'PASS' else 'FAIL' end || ' admin answer stays private to Asha (' || msg || ')' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.board_messages where visibility = 'admin';
  rep := rep || case when n = 2 then 'PASS' else 'FAIL' end || ' Asha sees her message and the admin answer (saw ' || n || ')' || E'\n';
  insert into public.board_messages (author_name, body, parent_id) values ('x','ZZ Asha follows up', root);
  rep := rep || 'PASS Asha can follow up in her own conversation' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin insert into public.board_messages (author_name, body, parent_id) values ('x','ZZ Baraka barges in', root); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' another member cannot write in Asha''s conversation with the admins' || E'\n';
  reset role;

  ---------------- PRIVATE: ASHA <-> BARAKA ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.board_messages (author_name, body, visibility, recipient_id) values ('x','ZZ secret from Asha','private', b);
  select id into rid from public.board_messages where body = 'ZZ secret from Asha';
  select recipient_name into msg from public.board_messages where id = rid;
  rep := rep || case when msg = 'Baraka' then 'PASS' else 'FAIL' end || ' private message records who it is for (' || coalesce(msg,'none') || ')' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, visibility, recipient_id) values ('x','ZZ to myself','private', a); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' cannot send a private message to yourself' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, visibility, recipient_id) values ('x','ZZ to a pending person','private', pend); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' cannot send a private message to someone who is not a member' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.board_messages where visibility = 'private';
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' Baraka can read it' || E'\n';
  insert into public.board_messages (author_name, body, parent_id) values ('x','ZZ Baraka answers', rid);
  select recipient_id = a into ok from public.board_messages where body = 'ZZ Baraka answers';
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' Baraka can answer and it goes back to Asha' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.board_messages where visibility = 'private';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' a third member (Chebet) cannot read it (saw ' || n || ')' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, parent_id) values ('x','ZZ Chebet joins in', rid); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' a third member cannot write in it' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.board_messages where visibility = 'private';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' admins CANNOT read private messages (saw ' || n || ')' || E'\n';
  update public.board_messages set hidden = true where visibility = 'private'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' admins cannot change private messages' || E'\n';
  delete from public.board_messages where visibility = 'private'; get diagnostics n = row_count;
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' admins cannot delete private messages' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon; select count(*) into n from public.board_messages where visibility = 'private';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' guests cannot read private messages' || E'\n'; reset role;

  ---------------- ADMIN POWERS ON PUBLIC ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', ad::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.board_messages (author_name, body, is_admin_reply, parent_id) select 'Admin','ZZ public admin reply', true, id from public.board_messages where body = 'ZZ hello';
  select author_kind into msg from public.board_messages where body = 'ZZ public admin reply';
  rep := rep || case when msg = 'admin' then 'PASS' else 'FAIL' end || ' admin public reply is labelled admin' || E'\n';
  update public.board_messages set hidden = true where body = 'ZZ hello'; get diagnostics n = row_count;
  rep := rep || case when n = 1 then 'PASS' else 'FAIL' end || ' admin can hide a public message' || E'\n';
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon; select count(*) into n from public.board_messages where body = 'ZZ hello';
  rep := rep || case when n = 0 then 'PASS' else 'FAIL' end || ' hidden public message disappears for guests' || E'\n'; reset role;

  ---------------- PENDING (not yet approved) ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', pend::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin insert into public.board_messages (author_name, body, visibility, contact) values ('Pat','ZZ pending to admins','admin','0711 111 111'); ok := true; exception when others then ok := false; end;
  rep := rep || case when ok then 'PASS' else 'FAIL' end || ' a not-yet-approved person can still write to the admins (as a visitor)' || E'\n';
  ok := false; begin insert into public.board_messages (author_name, body, visibility, recipient_id) values ('Pat','ZZ pending private','private', a); ok := true; exception when others then ok := false; end;
  rep := rep || case when not ok then 'PASS' else 'FAIL' end || ' ...but cannot send private messages' || E'\n';
  reset role;

  raise exception E'TEST REPORT\n%', rep;
end $$;
