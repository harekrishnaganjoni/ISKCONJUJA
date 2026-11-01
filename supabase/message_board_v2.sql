-- ============================================================
-- ISKCON JUJA: Message Board v2 (run once in the Supabase SQL Editor)
-- Safe to run again. Adds three kinds of message:
--   public  : everyone can read it (the public website board; visitors need no login)
--   admin   : "write to the admins only": a visitor or member writes; only the admins (and, for a
--             member, that member) can read it. A visitor must leave a contact (phone/email), because they cannot read a reply on the site
--   private : between exactly two members, in the member portal only; NOBODY else can read it,
--             not even admins
-- Also adds: member display names (with a name directory), reserved-name blocking,
-- and labels for Guest / Member / Admin posts.
-- ============================================================

-- 1. new columns ------------------------------------------------
alter table public.profiles add column if not exists display_name text;
create unique index if not exists profiles_display_name_uniq on public.profiles (lower(display_name)) where display_name is not null;

alter table public.board_messages
  add column if not exists visibility text not null default 'public',
  add column if not exists author_id uuid references auth.users(id) on delete set null,
  add column if not exists recipient_id uuid references auth.users(id) on delete set null,
  add column if not exists recipient_name text,
  add column if not exists author_kind text not null default 'guest',
  add column if not exists contact text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'board_visibility_ok') then
    alter table public.board_messages add constraint board_visibility_ok check (visibility in ('public','admin','private'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'board_kind_ok') then
    alter table public.board_messages add constraint board_kind_ok check (author_kind in ('guest','member','admin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'board_contact_len') then
    alter table public.board_messages add constraint board_contact_len check (contact is null or char_length(contact) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'board_private_has_two') then
    alter table public.board_messages add constraint board_private_has_two
      check (visibility <> 'private' or (author_id is not null and recipient_id is not null));
  end if;
end $$;

update public.board_messages set author_kind = 'admin' where is_admin_reply and author_kind = 'guest';
create index if not exists board_messages_people_idx on public.board_messages (author_id, recipient_id);

-- 2. helpers ----------------------------------------------------
create or replace function public.is_member()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('member','admin','super_admin'));
$$;

-- names that look official are reserved for real admins
create or replace function public.board_name_ok(n text)
returns boolean language sql immutable as $$
  select regexp_replace(lower(coalesce(n,'')), '[^a-z0-9]', '', 'g') !~ '(admin|moderator|iskcon|official)';
$$;

-- a member sets the name shown on the board and in the name directory
create or replace function public.set_my_display_name(n text)
returns void language plpgsql security definer set search_path = public as $$
declare clean text := btrim(regexp_replace(coalesce(n,''), '\s+', ' ', 'g'));
begin
  if not public.is_member() then raise exception 'Please sign in as a member first.'; end if;
  if char_length(clean) < 2 or char_length(clean) > 40 then raise exception 'Your name must be 2 to 40 characters.'; end if;
  if not public.is_admin() and not public.board_name_ok(clean) then raise exception 'That name is reserved. Please choose another.'; end if;
  if exists (select 1 from public.profiles where lower(display_name) = lower(clean) and id <> auth.uid()) then
    raise exception 'That name is already taken. Please choose another.';
  end if;
  update public.profiles set display_name = clean where id = auth.uid();
end;
$$;

-- who can I send a private message to? (names only, never emails)
create or replace function public.board_directory()
returns table (id uuid, name text) language sql security definer stable set search_path = public as $$
  select p.id, p.display_name
  from public.profiles p
  where public.is_member() and p.display_name is not null and p.id <> auth.uid()
    and p.role in ('member','admin','super_admin')
  order by lower(p.display_name);
$$;

-- 3. the rule keeper: runs on every new message ------------------
create or replace function public.board_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  adm boolean := public.is_admin();
  mem boolean := public.is_member();
  p public.board_messages;
  my_name text;
  owner_id uuid;
  other uuid;
begin
  new.body := btrim(coalesce(new.body, ''));
  new.author_name := btrim(coalesce(new.author_name, ''));
  if new.author_name = '' then new.author_name := 'Anonymous'; end if;
  if new.visibility is null then new.visibility := 'public'; end if;
  if new.visibility not in ('public','admin','private') then raise exception 'Unknown message type.'; end if;

  if new.parent_id is not null then
    select * into p from public.board_messages where id = new.parent_id;
    if not found then raise exception 'The message you are replying to was not found.'; end if;
    new.visibility := p.visibility;            -- a thread keeps the privacy it started with
  end if;

  select display_name into my_name from public.profiles where id = me;

  -------- PUBLIC --------
  if new.visibility = 'public' then
    new.recipient_id := null; new.recipient_name := null;
    if adm and new.is_admin_reply then
      new.author_kind := 'admin'; new.author_id := me;
      if new.author_name = 'Anonymous' then new.author_name := 'Admin'; end if;
    elsif mem then
      new.is_admin_reply := false; new.author_kind := 'member'; new.author_id := me;
      if my_name is null then raise exception 'Please choose your name for the board first.'; end if;
      new.author_name := my_name;
    else                                        -- guest (not signed in, or not yet approved)
      new.is_admin_reply := false; new.author_kind := 'guest'; new.author_id := null;
      if not public.board_name_ok(new.author_name) then
        raise exception 'That name is reserved. Please choose another name.';
      end if;
    end if;
    return new;
  end if;

  -------- a visitor (not signed in, or not yet approved) writes to the admins --------
  if new.visibility = 'admin' and new.parent_id is null and not mem then
    new.is_admin_reply := false; new.author_kind := 'guest'; new.author_id := null;
    new.recipient_id := null; new.recipient_name := null;
    new.contact := nullif(btrim(coalesce(new.contact, '')), '');
    if new.contact is null then
      raise exception 'Please leave a phone number or email so the admins can reply to you.';
    end if;
    if not public.board_name_ok(new.author_name) then
      raise exception 'That name is reserved. Please choose another name.';
    end if;
    return new;
  end if;

  -------- from here on a member (or admin) must be signed in --------
  if me is null or not mem then raise exception 'Please sign in to the member portal to send this kind of message.'; end if;
  if my_name is null and not (adm and new.visibility = 'admin' and new.parent_id is not null) then
    raise exception 'Please choose your name for the board first.';
  end if;

  -------- TO THE ADMINS --------
  if new.visibility = 'admin' then
    if new.parent_id is null then               -- a member starts a conversation with the admins
      new.is_admin_reply := false; new.author_kind := 'member'; new.author_id := me;
      new.author_name := my_name; new.recipient_id := null; new.recipient_name := null; new.contact := null;
    else
      owner_id := case when p.is_admin_reply then p.recipient_id else p.author_id end;
      if adm and new.is_admin_reply then         -- an admin answers the member privately
        new.author_kind := 'admin'; new.author_id := me; new.recipient_id := owner_id;
        select display_name into new.recipient_name from public.profiles where id = owner_id;
        if new.author_name = 'Anonymous' then new.author_name := 'Admin'; end if;
      elsif me = owner_id then                   -- the member adds to their own conversation
        new.is_admin_reply := false; new.author_kind := 'member'; new.author_id := me;
        new.author_name := my_name; new.recipient_id := null; new.recipient_name := null;
      else
        raise exception 'You cannot write in this conversation.';
      end if;
    end if;
    return new;
  end if;

  -------- PRIVATE, between exactly two members --------
  new.is_admin_reply := false; new.author_kind := 'member'; new.author_id := me; new.author_name := my_name;
  if new.parent_id is null then
    if new.recipient_id is null or new.recipient_id = me then raise exception 'Choose who this private message is for.'; end if;
    select display_name into new.recipient_name from public.profiles
      where id = new.recipient_id and role in ('member','admin','super_admin') and display_name is not null;
    if new.recipient_name is null then raise exception 'That person cannot receive private messages yet.'; end if;
  else
    if me <> p.author_id and me <> p.recipient_id then raise exception 'You cannot write in this conversation.'; end if;
    other := case when me = p.author_id then p.recipient_id else p.author_id end;
    new.recipient_id := other;
    select display_name into new.recipient_name from public.profiles where id = other;
  end if;
  return new;
end;
$$;

drop trigger if exists board_guard_trg on public.board_messages;
create trigger board_guard_trg before insert on public.board_messages
  for each row execute function public.board_guard();

-- 4. who can see / change what ------------------------------------
alter table public.board_messages enable row level security;
drop policy if exists "board public read" on public.board_messages;
drop policy if exists "board public post" on public.board_messages;
drop policy if exists "board admin reply" on public.board_messages;
drop policy if exists "board admin manage" on public.board_messages;
drop policy if exists "board admin delete" on public.board_messages;
drop policy if exists "board read v2" on public.board_messages;
drop policy if exists "board post v2" on public.board_messages;
drop policy if exists "board admin hide v2" on public.board_messages;
drop policy if exists "board delete v2" on public.board_messages;

create policy "board read v2" on public.board_messages for select using (
  (visibility = 'public' and (hidden = false or public.is_admin()))
  or (visibility = 'admin'   and (public.is_admin() or author_id = auth.uid() or recipient_id = auth.uid()))
  or (visibility = 'private' and (author_id = auth.uid() or recipient_id = auth.uid()))
);
-- the rule keeper above decides what is really saved; this only lets the insert reach it
create policy "board post v2" on public.board_messages for insert with check (true);
-- admins can hide public and admin messages, but can never touch private ones
create policy "board admin hide v2" on public.board_messages for update
  using (public.is_admin() and visibility <> 'private') with check (public.is_admin() and visibility <> 'private');
create policy "board delete v2" on public.board_messages for delete using (
  (public.is_admin() and visibility <> 'private') or author_id = auth.uid()
);

grant execute on function public.board_directory() to authenticated;
grant execute on function public.set_my_display_name(text) to authenticated;
