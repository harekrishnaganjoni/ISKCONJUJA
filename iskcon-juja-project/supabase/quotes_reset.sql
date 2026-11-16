-- 27: QUOTES RESET (run once, BEFORE pasting the new master quote list)
-- Deletes every quote and the saved "Quote of the Week" / "Verse of the Day" picks.
-- It does NOT touch any other data. Safe to run twice: the second run finds nothing to delete.
-- After it runs, paste all-quotes-master.txt in Admin > Quotes > Paste many quotes.

delete from public.weekly_quote;
delete from public.votd_day;
delete from public.quotes;

select (select count(*) from public.quotes) as quotes_left,
       (select count(*) from public.weekly_quote) as weekly_picks_left,
       (select count(*) from public.votd_day) as verse_picks_left;
