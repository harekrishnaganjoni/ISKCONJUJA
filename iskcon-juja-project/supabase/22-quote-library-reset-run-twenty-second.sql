-- ISKCON JUJA: start the Quote Library afresh. REMOVES EVERY QUOTE (the 25 starter quotes and anything you added).
-- Works whether or not file 20 has been run yet (but run 20 as well: the new Quote Library needs it).
-- Safe to run again. Until you add quotes, the Quote of the Week and Verse of the Day cards stay hidden.
do $$
begin
  if to_regclass('public.votd_day') is not null then execute 'delete from public.votd_day'; end if;
  if to_regclass('public.weekly_quote') is not null then execute 'delete from public.weekly_quote'; end if;
  if to_regclass('public.quotes') is not null then execute 'delete from public.quotes'; end if;
end $$;
select 'Quote Library is empty: ' || (select count(*) from public.quotes) || ' quotes left' as result;
