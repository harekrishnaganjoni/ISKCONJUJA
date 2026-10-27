-- ============================================================
-- COURSE SYSTEM v2 (owner approved 27 Oct 2026). Run AFTER course_system_hardening.sql.
-- Safe to re-run.
--  1. Adds two lesson block types: 'table' and 'timeline'.
--  2. Courses are self-paced: new courses no longer force lessons in order
--     (sequential_unlock default false). Existing courses are switched to false too,
--     because there is no admin switch for it yet.
-- ============================================================
do $$
declare cname text;
begin
  select conname into cname from pg_constraint
   where conrelid = 'public.course_blocks'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%quiz_ref%' and pg_get_constraintdef(oid) not like '%timeline%';
  if cname is not null then
    execute format('alter table public.course_blocks drop constraint %I', cname);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'course_blocks_type_check_v2') then
    alter table public.course_blocks add constraint course_blocks_type_check_v2 check (type in
      ('text','quote','image','gallery','video','audio','analogy','key_point',
       'reflection','practice','download','callout','quiz_ref','table','timeline'));
  end if;
end $$;

alter table public.courses alter column sequential_unlock set default false;
update public.courses set sequential_unlock = false where sequential_unlock = true;
