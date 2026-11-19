-- About me, round 2 (run once in the Supabase SQL editor, AFTER file 31; safe to re-run).
--  * "Initiated?" flag, two new questions (hope from the ISKCON movement, how far they would commit),
--    a contact field, and the choice to share answers by name or anonymously.
--  * Anonymous answers: the admins can read the answers but never see whose they are.
alter table public.member_onboarding add column if not exists initiated boolean not null default false;
alter table public.member_onboarding add column if not exists movement_hope text[] not null default '{}';
alter table public.member_onboarding add column if not exists movement_hope_other text;
alter table public.member_onboarding add column if not exists commitment text;
alter table public.member_onboarding add column if not exists contact_value text;
alter table public.member_onboarding add column if not exists share_mode text not null default 'named';
do $$ begin
  alter table public.member_onboarding add constraint onboarding_share_check check (share_mode in ('named','anonymous'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.member_onboarding add constraint onboarding_len2 check (coalesce(char_length(contact_value),0) <= 200 and coalesce(char_length(movement_hope_other),0) <= 300 and coalesce(char_length(commitment),0) <= 40);
exception when duplicate_object then null; end $$;

insert into public.profile_questions (key, label, kind, sort) values
  ('movement_hope', 'What do you hope to gain from the ISKCON movement?', 'multi', 35),
  ('commitment',    'How far would you be willing to commit to the movement?', 'single', 38)
on conflict (key) do nothing;
update public.profile_questions set sort = v.s from (values ('rounds',10),('principles',20),('why',30),('hope',40),('how_heard',50),('area',60),('contact_pref',70)) as v(k, s)
  where profile_questions.key = v.k and profile_questions.sort in (10,20,30,40,50,60,70);

-- Admins read answers only when the member shares them by name.
drop policy if exists "onboarding own or admin read" on public.member_onboarding;
create policy "onboarding own or admin read" on public.member_onboarding for select
  using (user_id = auth.uid() or (public.is_admin() and share_mode = 'named'));
-- (a helper, because the check must see anonymous rows that the admin is not allowed to read)
create or replace function public.member_is_anonymous(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.member_onboarding where user_id = uid and share_mode = 'anonymous');
$$;
revoke all on function public.member_is_anonymous(uuid) from public, anon;
grant execute on function public.member_is_anonymous(uuid) to authenticated;
drop policy if exists "pa read" on public.profile_answers;
create policy "pa read" on public.profile_answers for select to authenticated
  using (user_id = auth.uid() or (public.is_admin() and not public.member_is_anonymous(user_id)));

-- Admin only: every response, named or anonymous. Anonymous ones carry no name, no date and no initiated name.
create or replace function public.admin_about_responses()
returns table(anonymous boolean, who text, submitted timestamptz, data jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can do this.'; end if;
  return query
  select (o.share_mode = 'anonymous'),
         case when o.share_mode = 'anonymous' then null else coalesce(o.full_name, p.full_name, p.email) end,
         case when o.share_mode = 'anonymous' then null else o.updated_at end,
         ((to_jsonb(o) - 'user_id' - 'full_name' - 'phone' - 'created_at' - 'updated_at' - 'consent_at' - 'share_mode' - 'initiated')
            - case when o.share_mode = 'anonymous' then 'initiated_name' else '' end)
         || jsonb_build_object('initiated', o.initiated,
              'custom', coalesce((select jsonb_agg(jsonb_build_object('label', q.label, 'answer', a.answer) order by q.sort) from public.profile_answers a join public.profile_questions q on q.id = a.question_id where a.user_id = o.user_id), '[]'::jsonb))
  from public.member_onboarding o left join public.profiles p on p.id = o.user_id
  where exists (select 1 from jsonb_each(to_jsonb(o) - 'user_id' - 'full_name' - 'phone' - 'created_at' - 'updated_at' - 'consent_at' - 'share_mode' - 'initiated' - 'initiated_name') e where e.value not in ('null'::jsonb, '[]'::jsonb, '""'::jsonb))
     or exists (select 1 from public.profile_answers a where a.user_id = o.user_id)
  order by (o.share_mode = 'anonymous'), o.updated_at desc nulls last;
end;
$$;
revoke all on function public.admin_about_responses() from public, anon;
grant execute on function public.admin_about_responses() to authenticated;
