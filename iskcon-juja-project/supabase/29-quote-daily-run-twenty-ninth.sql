-- ISKCON JUJA: daily quote for the public home page, by weekday theme. Safe to run more than once. Run AFTER file 25 (and after 27 if you are resetting the quotes).
-- Each quote can have a theme number 0-6 (the weekday it belongs to: 0 Sunday ... 6 Saturday):
--   0 Devotion and service   1 The mind and self-control   2 Who we are   3 Knowledge and wisdom
--   4 Peace and real happiness   5 Chanting, good company and community   6 Work, duty and detachment
-- get_daily_quote() gives everyone (signed in or not) one quote a day: it takes the quotes marked for the home page (use_weekly)
-- whose theme matches today's weekday (Nairobi date) and goes through them one week at a time in a fixed shuffled order, so a quote
-- does not come back until the whole theme has been shown. If a weekday has no themed quotes yet, any home-page quote is used.
alter table public.quotes add column if not exists theme smallint;
alter table public.quotes drop constraint if exists quotes_theme_chk;
alter table public.quotes add constraint quotes_theme_chk check (theme is null or (theme >= 0 and theme <= 6));
create index if not exists quotes_theme_idx on public.quotes (theme) where use_weekly;

-- the same import function as before, now also accepting "theme"
create or replace function public.admin_import_quotes(rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; added int := 0; skipped int := 0; t text; s text; sg text; sd date; vm smallint; vt smallint; th smallint;
begin
  if not public.is_admin() then raise exception 'Only an admin can import quotes'; end if;
  if jsonb_typeof(rows) <> 'array' then raise exception 'Expected a list of quotes'; end if;
  if jsonb_array_length(rows) > 1000 then raise exception 'Import at most 1000 quotes at a time'; end if;
  for r in select * from jsonb_array_elements(rows) loop
    t := btrim(coalesce(r->>'quote_text', '')); s := btrim(coalesce(r->>'source', ''));
    sg := nullif(btrim(coalesce(r->>'suggested_aud', '')), '');
    if length(t) < 10 or length(t) > 2000 or length(s) < 2 or length(s) > 200 then skipped := skipped + 1; continue; end if;
    if sg is not null and sg not in ('public','members') then skipped := skipped + 1; continue; end if;
    if exists (select 1 from public.quotes q where q.quote_text = t) then skipped := skipped + 1; continue; end if;
    begin
      sd := nullif(r->>'said_on', '')::date;
      vm := nullif(r->>'vaish_masa', '')::smallint; vt := nullif(r->>'vaish_tithi', '')::smallint; th := nullif(r->>'theme', '')::smallint;
    exception when others then skipped := skipped + 1; continue; end;
    if (vm is not null and (vm < 0 or vm > 12)) or (vt is not null and (vt < 0 or vt > 29)) or (th is not null and (th < 0 or th > 6)) then skipped := skipped + 1; continue; end if;
    insert into public.quotes (quote_text, source, book, source_url, use_weekly, use_votd, suggested_aud, said_on, vaish_masa, vaish_tithi, theme)
    values (t, s, nullif(btrim(coalesce(r->>'book','')), ''), nullif(btrim(coalesce(r->>'source_url','')), ''),
            case when sg is not null then false else coalesce((r->>'use_weekly')::boolean, true) end,
            case when sg is not null then false else coalesce((r->>'use_votd')::boolean, true) end,
            sg, sd, vm, vt, th);
    added := added + 1;
  end loop;
  return jsonb_build_object('added', added, 'skipped', skipped);
end;
$$;
grant execute on function public.admin_import_quotes(jsonb) to authenticated;

drop function if exists public.get_daily_quote(date);
create or replace function public.get_daily_quote(p_date date default null)
returns table(id uuid, quote_text text, source text, source_url text, theme smallint)
language plpgsql stable security definer set search_path = public as $$
declare d date := coalesce(p_date, (now() at time zone 'Africa/Nairobi')::date); w int := extract(dow from d)::int; n int; k int; days int;
begin
  days := d - date '2024-01-07';   -- 7 Jan 2024 was a Sunday, so days / 7 counts whole weeks
  select count(*) into n from public.quotes q where q.use_weekly and q.theme = w;
  if n > 0 then
    k := ((floor(days / 7.0)::int % n) + n) % n;
    return query select q.id, q.quote_text, q.source, q.source_url, q.theme from public.quotes q
     where q.use_weekly and q.theme = w order by md5(q.id::text) limit 1 offset k;
    return;
  end if;
  select count(*) into n from public.quotes q where q.use_weekly;
  if n = 0 then return; end if;
  k := ((days % n) + n) % n;
  return query select q.id, q.quote_text, q.source, q.source_url, q.theme from public.quotes q
   where q.use_weekly order by md5(q.id::text) limit 1 offset k;
end;
$$;
grant execute on function public.get_daily_quote(date) to anon, authenticated;
select 'DONE: daily quote ready' as result;
