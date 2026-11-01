-- ============================================================
-- ISKCON JUJA: Vaishnava calendar (run once in the Supabase SQL Editor; safe to re-run)
-- Ekadashi fasting days for Juja/Nairobi, 2026-2027, calculated from the moon and sun positions
-- (see iskcon-juja-project/tools/build_vaishnava_sql.py). Festival days are added by the admin.
-- ============================================================
create table if not exists public.vaishnava_days (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  title text not null,
  kind text not null default 'ekadashi',        -- ekadashi / festival / other
  note text,
  to_confirm boolean not null default false,    -- shows "date to be confirmed with the temple"
  published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint vaishnava_kind check (kind in ('ekadashi','festival','other')),
  constraint vaishnava_len check (char_length(title) between 1 and 120 and coalesce(char_length(note),0) <= 400),
  unique (day, title)
);
alter table public.vaishnava_days enable row level security;
drop policy if exists "vaishnava public read" on public.vaishnava_days;
create policy "vaishnava public read" on public.vaishnava_days for select using (published or public.is_admin());
drop policy if exists "vaishnava admin write" on public.vaishnava_days;
create policy "vaishnava admin write" on public.vaishnava_days for all using (public.is_admin()) with check (public.is_admin());

insert into public.vaishnava_days (day, title, kind, note, to_confirm) values
('2026-11-05', 'Rama Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:11 AM).', false),
('2026-11-21', 'Utthana Ekadashi', 'ekadashi', 'Fast on this Dvadashi day (Ekadashi was touched by Dashami at dawn). Break the fast tomorrow after sunrise (about 6:13 AM).', true),
('2026-12-04', 'Utpanna Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:17 AM).', false),
('2026-12-20', 'Mokshada Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:24 AM).', false),
('2027-01-03', 'Saphala Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:31 AM).', false),
('2027-01-19', 'Putrada Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:38 AM).', false),
('2027-02-02', 'Shat Tila Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:41 AM).', true),
('2027-02-17', 'Bhaimi Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:42 AM).', false),
('2027-03-03', 'Vijaya Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:40 AM).', false),
('2027-03-18', 'Amalaki Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:37 AM).', false),
('2027-04-02', 'Papamochani Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:33 AM).', false),
('2027-04-17', 'Kamada Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:29 AM).', true),
('2027-05-02', 'Varuthini Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:27 AM).', false),
('2027-05-16', 'Mohini Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:27 AM).', false),
('2027-06-01', 'Apara Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:29 AM).', true),
('2027-06-14', 'Pandava Nirjala Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:31 AM).', false),
('2027-06-30', 'Yogini Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:35 AM).', false),
('2027-07-14', 'Sayana Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:37 AM).', false),
('2027-07-30', 'Kamika Ekadashi', 'ekadashi', 'Fast on this Dvadashi day (Ekadashi was touched by Dashami at dawn). Break the fast tomorrow after sunrise (about 6:37 AM).', true),
('2027-08-12', 'Pavitropana Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:35 AM).', false),
('2027-08-28', 'Annada Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:31 AM).', false),
('2027-09-11', 'Parshva Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:26 AM).', false),
('2027-09-26', 'Indira Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:20 AM).', false),
('2027-10-11', 'Pashankusha Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:15 AM).', false),
('2027-10-25', 'Rama Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:12 AM).', false),
('2027-11-10', 'Utthana Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:11 AM).', true),
('2027-11-24', 'Utpanna Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:14 AM).', false),
('2027-12-09', 'Mokshada Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:19 AM).', false),
('2027-12-23', 'Saphala Ekadashi', 'ekadashi', 'Fast today. Break the fast tomorrow morning after sunrise (about 6:26 AM).', false)
on conflict (day, title) do nothing;
