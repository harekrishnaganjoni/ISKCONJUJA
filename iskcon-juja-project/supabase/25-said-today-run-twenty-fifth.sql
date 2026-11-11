-- ISKCON JUJA: "What Srila Prabhupada said today" (members' dashboard). Safe to run more than once. Run AFTER files 20 and 23.
-- Each dated quote remembers the day it was written or spoken (said_on) and where that day fell in the Vaishnava calendar
-- (vaish_masa 0-12 and vaish_tithi 0-29, same numbers as /calendar-data/). Today's quotes are the ones said on the same
-- date in any year, or on the same lunar day (month + tithi) of the Vaishnava calendar.
alter table public.quotes add column if not exists said_on date;
alter table public.quotes add column if not exists vaish_masa smallint;
alter table public.quotes add column if not exists vaish_tithi smallint;
create index if not exists quotes_said_vt_idx on public.quotes (vaish_masa, vaish_tithi);

create or replace function public.admin_import_quotes(rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; added int := 0; skipped int := 0; t text; s text; sg text; sd date; vm smallint; vt smallint;
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
      vm := nullif(r->>'vaish_masa', '')::smallint; vt := nullif(r->>'vaish_tithi', '')::smallint;
    exception when others then skipped := skipped + 1; continue; end;
    if (vm is not null and (vm < 0 or vm > 12)) or (vt is not null and (vt < 0 or vt > 29)) then skipped := skipped + 1; continue; end if;
    insert into public.quotes (quote_text, source, book, source_url, use_weekly, use_votd, suggested_aud, said_on, vaish_masa, vaish_tithi)
    values (t, s, nullif(btrim(coalesce(r->>'book','')), ''), nullif(btrim(coalesce(r->>'source_url','')), ''),
            case when sg is not null then false else coalesce((r->>'use_weekly')::boolean, true) end,
            case when sg is not null then false else coalesce((r->>'use_votd')::boolean, true) end,
            sg, sd, vm, vt);
    added := added + 1;
  end loop;
  return jsonb_build_object('added', added, 'skipped', skipped);
end;
$$;
grant execute on function public.admin_import_quotes(jsonb) to authenticated;

-- Today's quote for MEMBERS ONLY (signed-in). One quote a day, chosen by today's Vaishnava lunar day (p_masa, p_tithi).
-- When several quotes share that lunar day, the year picks one in turn, so the same quote does not come back until the others
-- have been used. If no quote exists yet for that lunar day, a quote said on today's normal date (p_md = 'MM-DD') is used.
-- Returns said_on (the normal calendar date the quote was said) and match ('lunar' or 'date').
drop function if exists public.get_said_today(text, int, int, int);
drop function if exists public.get_said_today(int, int, text, int);
create or replace function public.get_said_today(p_masa int, p_tithi int, p_md text, p_year int)
returns table(id uuid, quote_text text, source text, source_url text, said_on date, match text)
language plpgsql stable security definer set search_path = public as $$
declare n int; k int;
begin
  if auth.uid() is null then return; end if;
  select count(*) into n from public.quotes q
   where q.said_on is not null and (q.use_votd or q.use_weekly) and q.vaish_masa = p_masa and q.vaish_tithi = p_tithi;
  if n > 0 then
    k := ((p_year % n) + n) % n;
    return query
    select q.id, q.quote_text, q.source, q.source_url, q.said_on, 'lunar'::text
      from public.quotes q
     where q.said_on is not null and (q.use_votd or q.use_weekly) and q.vaish_masa = p_masa and q.vaish_tithi = p_tithi
     order by md5(q.id::text) limit 1 offset k;
    return;
  end if;
  select count(*) into n from public.quotes q
   where q.said_on is not null and (q.use_votd or q.use_weekly) and to_char(q.said_on, 'MM-DD') = p_md;
  if n > 0 then
    k := ((p_year % n) + n) % n;
    return query
    select q.id, q.quote_text, q.source, q.source_url, q.said_on, 'date'::text
      from public.quotes q
     where q.said_on is not null and (q.use_votd or q.use_weekly) and to_char(q.said_on, 'MM-DD') = p_md
     order by md5(q.id::text) limit 1 offset k;
  end if;
end;
$$;
revoke execute on function public.get_said_today(int, int, text, int) from public, anon;
grant execute on function public.get_said_today(int, int, text, int) to authenticated;
