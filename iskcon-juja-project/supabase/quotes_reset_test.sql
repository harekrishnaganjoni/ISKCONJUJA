-- 28: TEST for 27 (optional). It makes 3 sample quotes, runs the same deletes as file 27,
-- checks everything is gone and that it can run twice, then rolls back (changes nothing).
begin;
insert into public.quotes(quote_text, source, use_weekly, use_votd) values
  ('Test quote one for reset check', 'TEST', true, true),
  ('Test quote two for reset check', 'TEST', true, false),
  ('Test quote three for reset check', 'TEST', false, true);
insert into public.weekly_quote(week_key, quote_id) select '2099-W01', id from public.quotes where quote_text like 'Test quote one%';
insert into public.votd_day(day, quote_id) select date '2099-01-01', id from public.quotes where quote_text like 'Test quote three%';

delete from public.weekly_quote;
delete from public.votd_day;
delete from public.quotes;
delete from public.weekly_quote;
delete from public.votd_day;
delete from public.quotes;

do $$
begin
  if (select count(*) from public.quotes) <> 0 then raise exception 'FAIL: quotes left'; end if;
  if (select count(*) from public.weekly_quote) <> 0 then raise exception 'FAIL: weekly picks left'; end if;
  if (select count(*) from public.votd_day) <> 0 then raise exception 'FAIL: verse picks left'; end if;
  raise notice 'PASS: reset removes everything and can run twice';
end $$;
rollback;
select 'TEST FINISHED: rolled back, nothing was changed' as result;
