-- ============================================================
-- ISKCON JUJA: editable weekly programs (run once in the Supabase SQL Editor; safe to re-run)
-- The Events page shows these, and the "Add to my calendar" button uses them.
-- The two current programs (Tuesday and Friday) are added for you the first time.
-- ============================================================
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  weekday int not null,                 -- 0 = Sunday ... 6 = Saturday
  title text not null,                  -- e.g. 'Tuesday program'
  description text,
  start_time time not null,             -- Nairobi time
  end_time time not null,
  place text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint programs_weekday check (weekday between 0 and 6),
  constraint programs_len check (char_length(title) between 1 and 100 and coalesce(char_length(description),0) <= 600 and coalesce(char_length(place),0) <= 200),
  constraint programs_times check (end_time > start_time)
);

alter table public.programs enable row level security;
drop policy if exists "programs public read" on public.programs;
create policy "programs public read" on public.programs for select using (published or public.is_admin());
drop policy if exists "programs admin write" on public.programs;
create policy "programs admin write" on public.programs for all using (public.is_admin()) with check (public.is_admin());

insert into public.programs (weekday, title, description, start_time, end_time, place)
select 2, 'Tuesday', 'Music, a talk or open discussion (often with a guest speaker visiting from the ISKCON Nairobi/Ngara temple), and a free vegetarian feast.', '17:30', '19:00', 'Anthusia Apartments, Muraya Access Road, Juja'
where not exists (select 1 from public.programs);
insert into public.programs (weekday, title, description, start_time, end_time, place)
select 5, 'Friday', 'Music, group book reading & discussion in place of a talk, and a free vegetarian feast.', '17:30', '19:00', 'Anthusia Apartments, Muraya Access Road, Juja'
where (select count(*) from public.programs) = 1 and exists (select 1 from public.programs where weekday = 2 and title = 'Tuesday');
