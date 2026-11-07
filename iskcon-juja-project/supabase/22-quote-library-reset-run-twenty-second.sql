-- ISKCON JUJA: start the Quote Library afresh. REMOVES EVERY QUOTE (the 25 starter quotes and anything you added).
-- Run this once, BEFORE pasting your approved quotes. Safe to run again (it just finds nothing to remove).
-- Until you add quotes, the Quote of the Week and Verse of the Day cards stay hidden.
delete from public.votd_day;
delete from public.weekly_quote;
delete from public.quotes;
select 'Quote Library is empty: ' || (select count(*) from public.quotes) || ' quotes left' as result;
