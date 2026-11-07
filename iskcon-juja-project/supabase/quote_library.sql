-- ISKCON JUJA: Quote Library (book, Vedabase link, where each quote may appear, Verse of the Day).
-- Safe to run more than once. Paste the whole file into the Supabase SQL Editor and Run.
-- Needs: schema.sql (quotes table, is_admin()).

alter table public.quotes add column if not exists book text;
alter table public.quotes add column if not exists source_url text;
alter table public.quotes add column if not exists use_weekly boolean not null default true;
alter table public.quotes add column if not exists use_votd boolean not null default true;
alter table public.quotes add column if not exists verse_date date;      -- admin-scheduled Verse of the Day
alter table public.quotes add column if not exists last_votd date;
create unique index if not exists quotes_verse_date_uq on public.quotes (verse_date) where verse_date is not null;

-- Label the 25 starter quotes by book, and link the Gita ones to Vedabase.
update public.quotes set book = 'Bhagavad-gita' where book is null and source like 'Bhagavad-gita %';
update public.quotes set book = 'Letters and lectures' where book is null and source like 'Srila Prabhupada,%';
update public.quotes set source_url = 'https://vedabase.io/en/library/bg/' || replace(substring(source from 'Bhagavad-gita ([0-9]+\.[0-9]+)'), '.', '/') || '/'
 where source_url is null and source ~ '^Bhagavad-gita [0-9]+\.[0-9]+$';

-- One verse per day, kept steady for the whole day.
create table if not exists public.votd_day (
  day date primary key,
  quote_id uuid references public.quotes(id) on delete cascade
);
alter table public.votd_day enable row level security;
drop policy if exists "votd_day public read" on public.votd_day;
create policy "votd_day public read" on public.votd_day for select using (true);

-- Quote of the Week: only quotes marked "weekly", never repeating until all were used.
drop function if exists public.get_weekly_quote();
create or replace function public.get_weekly_quote()
returns table(id uuid, quote_text text, source text, source_url text)
language plpgsql security definer set search_path = public as $$
declare
  wk text := to_char(now(), 'IYYY-"W"IW');
  qid uuid;
begin
  select weekly_quote.quote_id into qid from public.weekly_quote where week_key = wk;
  if qid is null then
    select q.id into qid from public.quotes q where q.use_weekly order by q.last_used_week asc nulls first, random() limit 1;
    if qid is not null then
      insert into public.weekly_quote(week_key, quote_id) values (wk, qid) on conflict (week_key) do nothing;
      select weekly_quote.quote_id into qid from public.weekly_quote where week_key = wk;
      update public.quotes set last_used_week = wk where quotes.id = qid;
    end if;
  end if;
  return query select q.id, q.quote_text, q.source, q.source_url from public.quotes q where q.id = qid;
end;
$$;
grant execute on function public.get_weekly_quote() to anon, authenticated;

-- Verse of the Day (Nairobi date): a scheduled quote if there is one, else the least recently shown "daily" quote.
create or replace function public.get_verse_of_day()
returns table(id uuid, quote_text text, source text, source_url text)
language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'Africa/Nairobi')::date;
  qid uuid;
begin
  select votd_day.quote_id into qid from public.votd_day where day = d;
  if qid is null then
    select q.id into qid from public.quotes q where q.verse_date = d and q.use_votd limit 1;
    if qid is null then
      select q.id into qid from public.quotes q where q.use_votd and q.verse_date is null
       order by q.last_votd asc nulls first, random() limit 1;
    end if;
    if qid is not null then
      insert into public.votd_day(day, quote_id) values (d, qid) on conflict (day) do nothing;
      select votd_day.quote_id into qid from public.votd_day where day = d;
      update public.quotes set last_votd = d where quotes.id = qid;
    end if;
  end if;
  return query select q.id, q.quote_text, q.source, q.source_url from public.quotes q where q.id = qid;
end;
$$;
grant execute on function public.get_verse_of_day() to anon, authenticated;

-- Admin only: add many quotes at once. rows = [{"quote_text":"...","source":"Bg. 2.13","book":"Bhagavad-gita","source_url":"https://..."}]
-- Quotes already in the library (same text) are skipped. Returns how many were added and skipped.
create or replace function public.admin_import_quotes(rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; added int := 0; skipped int := 0; t text; s text;
begin
  if not public.is_admin() then raise exception 'Only an admin can import quotes'; end if;
  if jsonb_typeof(rows) <> 'array' then raise exception 'Expected a list of quotes'; end if;
  if jsonb_array_length(rows) > 1000 then raise exception 'Import at most 1000 quotes at a time'; end if;
  for r in select * from jsonb_array_elements(rows) loop
    t := btrim(coalesce(r->>'quote_text', '')); s := btrim(coalesce(r->>'source', ''));
    if length(t) < 10 or length(t) > 2000 or length(s) < 2 or length(s) > 200 then skipped := skipped + 1; continue; end if;
    if exists (select 1 from public.quotes q where q.quote_text = t) then skipped := skipped + 1; continue; end if;
    insert into public.quotes (quote_text, source, book, source_url, use_weekly, use_votd)
    values (t, s, nullif(btrim(coalesce(r->>'book','')), ''), nullif(btrim(coalesce(r->>'source_url','')), ''),
            coalesce((r->>'use_weekly')::boolean, true), coalesce((r->>'use_votd')::boolean, true));
    added := added + 1;
  end loop;
  return jsonb_build_object('added', added, 'skipped', skipped);
end;
$$;
grant execute on function public.admin_import_quotes(jsonb) to authenticated;
