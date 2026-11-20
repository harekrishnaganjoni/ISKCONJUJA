-- Run once in the Supabase SQL editor. THIS ERASES every message on the old message board for good (you asked for that).
-- The message board has been removed from the website and the admin portal.
drop table if exists public.board_messages cascade;
drop function if exists public.board_guard() cascade;
drop function if exists public.board_directory() cascade;
drop function if exists public.set_my_display_name(text) cascade;
drop function if exists public.board_name_ok(text) cascade;
