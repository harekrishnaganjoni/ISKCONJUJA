-- ISKCON JUJA: Draft quotes (quotes waiting for the owner's review; never shown on the site until approved).
-- Safe to run more than once. Run AFTER file 20 (Quote Library). Paste the whole file into the Supabase SQL Editor and Run.

-- "suggested_aud" is the audience Claude suggests for a draft quote ('public' or 'members').
-- A draft quote has suggested_aud filled in and both use_weekly and use_votd off, so the home page and the Verse of the Day never pick it.
-- Approving it (Admin > Quotes) turns the right ticks on and clears suggested_aud.
alter table public.quotes add column if not exists suggested_aud text;
alter table public.quotes drop constraint if exists quotes_suggested_aud_chk;
alter table public.quotes add constraint quotes_suggested_aud_chk check (suggested_aud is null or suggested_aud in ('public','members'));

create or replace function public.admin_import_quotes(rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; added int := 0; skipped int := 0; t text; s text; sg text;
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
    insert into public.quotes (quote_text, source, book, source_url, use_weekly, use_votd, suggested_aud)
    values (t, s, nullif(btrim(coalesce(r->>'book','')), ''), nullif(btrim(coalesce(r->>'source_url','')), ''),
            case when sg is not null then false else coalesce((r->>'use_weekly')::boolean, true) end,
            case when sg is not null then false else coalesce((r->>'use_votd')::boolean, true) end,
            sg);
    added := added + 1;
  end loop;
  return jsonb_build_object('added', added, 'skipped', skipped);
end;
$$;
grant execute on function public.admin_import_quotes(jsonb) to authenticated;
