-- ============================================================
-- ISKCON JUJA: security hardening (Phase 0)
-- Run in the Supabase SQL Editor AFTER schema.sql. Safe to re-run.
-- Adds: (1) length limits on public text fields, (2) a global
-- rate limit (20 posts per minute) on public testimonials and board posts.
-- Limits are added as NOT VALID so existing rows never block the script;
-- they apply to every new or edited row.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'testimonials_len') then
    alter table public.testimonials add constraint testimonials_len
      check (char_length(name) between 1 and 80 and char_length(message) between 1 and 2000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'board_messages_len') then
    alter table public.board_messages add constraint board_messages_len
      check (char_length(author_name) between 1 and 80 and char_length(body) between 1 and 2000) not valid;
  end if;
end $$;

-- Rate limit. SECURITY DEFINER so the count sees ALL rows (including hidden
-- or unpublished ones that RLS would hide from the poster); otherwise the
-- limiter would never trip. Admins are exempt.
create or replace function public.limit_public_posts()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if public.is_admin() then
    return new;
  end if;
  execute format('select count(*) from public.%I where created_at > now() - interval ''1 minute''', tg_table_name) into n;
  if n >= 20 then
    raise exception 'Too many posts right now. Please try again in a minute.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists testimonials_rate_limit on public.testimonials;
create trigger testimonials_rate_limit before insert on public.testimonials
  for each row execute function public.limit_public_posts();

drop trigger if exists board_messages_rate_limit on public.board_messages;
create trigger board_messages_rate_limit before insert on public.board_messages
  for each row execute function public.limit_public_posts();
