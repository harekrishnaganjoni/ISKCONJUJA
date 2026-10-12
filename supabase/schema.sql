-- ============================================================
-- ISKCON JUJA — Phase 2 database schema
-- Run this once, in full, in the Supabase SQL Editor
-- (your project -> left sidebar -> "SQL Editor" -> "New query").
-- Safe to re-run: it drops and recreates these objects only.
-- ============================================================

-- ---------- ADMIN ROLES ----------
-- One row per admin. Created automatically when someone signs up,
-- but starts with role 'pending' (no power) until a super_admin
-- approves them. Dan is set as the first super_admin by hand below.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'pending' check (role in ('pending','member','admin','super_admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- SITE SETTINGS ----------
-- Replaces the SITE_SETTINGS block in site.js. One row per key.
-- Admin edits these from the dashboard; the public site reads them.
create table if not exists public.site_settings (
  key text primary key,
  value text not null default ''
);

insert into public.site_settings (key, value) values
  ('mpesa_till',''), ('pesapal_donate_url',''),
  ('facebook_url',''), ('instagram_url',''), ('youtube_url',''),
  ('whatsapp_group_invite','https://chat.whatsapp.com/Bov3QCpBdmZ8dUt6oGfQqM'),
  ('store_enabled','false'), ('articles_enabled','false'),
  ('special_events_enabled','false'), ('members_enabled','false')
on conflict (key) do nothing;

-- ---------- ARTICLES (homepage blog) ----------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author text not null,
  article_date date not null default current_date,
  source text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- EVENTS (special events, flexible fields) ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  speakers text,
  schedule text,
  description text,
  extra jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS (merged Resources + Merchandise) ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_kes numeric,               -- null/0 = free download
  category text not null default 'other',  -- 'book','audio','wallpaper','apparel','other'
  file_url text,                   -- for free downloads
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY: public can only READ published rows.
-- Only signed-in admins/super_admins can write.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.articles enable row level security;
alter table public.events enable row level security;
alter table public.products enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin')
  );
$$;

-- profiles: you can see your own row; admins can see/manage all
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);

-- site_settings: everyone can read, only admins can write
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select using (true);
drop policy if exists "settings admin write" on public.site_settings;
create policy "settings admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- articles: public reads published only; admins do everything
drop policy if exists "articles public read" on public.articles;
create policy "articles public read" on public.articles for select using (published = true or public.is_admin());
drop policy if exists "articles admin write" on public.articles;
create policy "articles admin write" on public.articles for all using (public.is_admin()) with check (public.is_admin());

-- events: same pattern
drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events for select using (published = true or public.is_admin());
drop policy if exists "events admin write" on public.events;
create policy "events admin write" on public.events for all using (public.is_admin()) with check (public.is_admin());

-- products: same pattern
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (published = true or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- LAST STEP (do this manually, once, after you sign up on the
-- site's real login page): turn your own account into the first
-- super_admin. Replace the email, then run just this one line:
--
-- update public.profiles set role = 'super_admin' where email = 'YOUR-EMAIL-HERE';
-- ============================================================

-- ============================================================
-- PHASE 2, BATCH 2 — quotes, testimonials, message board,
-- admin-editable homepage photo, admin-only member creation.
-- Safe to run after the section above; run this whole block too.
-- ============================================================

-- ---------- QUOTES (weekly rotation, avoids repeats) ----------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null,
  source text not null,
  last_used_week text,   -- e.g. '2026-W40', set automatically
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_quote (
  week_key text primary key,  -- ISO week, e.g. '2026-W40'
  quote_id uuid references public.quotes(id),
  set_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Returns (and assigns, if not already assigned) this week's quote.
-- Anyone can call this; it never lets an admin's picks or the
-- rotation repeat a quote until every quote has been used once.
create or replace function public.get_weekly_quote()
returns table(id uuid, quote_text text, source text)
language plpgsql security definer as $$
declare
  wk text := to_char(now(), 'IYYY-"W"IW');
  qid uuid;
begin
  select weekly_quote.quote_id into qid from public.weekly_quote where week_key = wk;
  if qid is null then
    select q.id into qid from public.quotes q order by q.last_used_week asc nulls first, random() limit 1;
    if qid is not null then
      insert into public.weekly_quote(week_key, quote_id) values (wk, qid) on conflict (week_key) do nothing;
      select weekly_quote.quote_id into qid from public.weekly_quote where week_key = wk;
      update public.quotes set last_used_week = wk where id = qid;
    end if;
  end if;
  return query select q.id, q.quote_text, q.source from public.quotes q where q.id = qid;
end;
$$;

-- The 25 quotes supplied by the owner, as starter/reserve content.
insert into public.quotes (quote_text, source) values
('For one who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his mind will remain the greatest enemy.', 'Bhagavad-gita 6.6'),
('One who is not connected with the Supreme can have neither steady intelligence nor a peaceful mind, without which there is no possibility of happiness.', 'Bhagavad-gita 2.66'),
('A person who is not disturbed by the incessant flow of desires can alone achieve peace, and not the man who strives to satisfy such desires.', 'Bhagavad-gita 2.70'),
('A person who has given up all desires for sense gratification, who lives free from desires and false ego, alone can attain real peace.', 'Bhagavad-gita 2.71'),
('As a lamp in a windless place does not waver, so the transcendentalist, whose mind is controlled, remains always steady in meditation.', 'Bhagavad-gita 6.19'),
('There is no possibility of one becoming a yogi if one eats too much or eats too little, sleeps too much or does not sleep enough.', 'Bhagavad-gita 6.16'),
('He who is regulated in eating, sleeping, recreation and work can mitigate all material pains by practicing the yoga system.', 'Bhagavad-gita 6.17'),
('The nonpermanent appearance of happiness and distress arise from sense perception, and one must learn to tolerate them without being disturbed.', 'Bhagavad-gita 2.14'),
('That which at first tastes like poison but at last tastes like nectar, and which awakens one to self-realization, is happiness in the mode of goodness.', 'Bhagavad-gita 18.37'),
('It is undoubtedly very difficult to curb the restless mind, but it is possible by suitable practice and by detachment.', 'Bhagavad-gita 6.35'),
('For one who has conquered the mind, happiness and distress, heat and cold, honor and dishonor are all the same.', 'Bhagavad-gita 6.7'),
('One who is not disturbed in mind amidst the threefold miseries, or elated by happiness, and is free from attachment, fear and anger, is a sage of steady mind.', 'Bhagavad-gita 2.56'),
('A person free from all attachment and aversion, able to control the senses through regulative principles, can obtain the complete mercy of the Lord.', 'Bhagavad-gita 2.64'),
('For one thus satisfied, the threefold miseries of material existence exist no longer; one''s intelligence is soon well established.', 'Bhagavad-gita 2.65'),
('The self-realized person is always in trance, enjoying pleasure within, and in this way enjoys unlimited happiness by concentrating on the Supreme.', 'Bhagavad-gita 5.21'),
('Those who are free from anger and all material desires, self-realized and constantly endeavoring for perfection, are assured of liberation very soon.', 'Bhagavad-gita 5.26'),
('One must deliver himself with the help of his own mind, and not degrade himself. The mind is the friend of the soul, and its enemy as well.', 'Bhagavad-gita 6.5'),
('When one''s mental activities are disciplined and situated in transcendence, devoid of all material desires, one is said to be well established in yoga.', 'Bhagavad-gita 6.18'),
('Established thus, one is never shaken, even in the midst of the greatest difficulty.', 'Bhagavad-gita 6.22'),
('From wherever the mind wanders due to its flickering and unsteady nature, one must certainly withdraw it and bring it back under control.', 'Bhagavad-gita 6.26'),
('He by whom no one is put into difficulty, and who is not disturbed by anyone, equal in happiness and distress, is very dear to the Lord.', 'Bhagavad-gita 12.15'),
('You cannot stop thinking, but you can change the quality of your thinking.', 'Srila Prabhupada, Lecture, Los Angeles, 8 Jan 1974'),
('Peace cannot be achieved by mechanical means; peace is a state of consciousness.', 'Srila Prabhupada, Lecture, New York, 20 Dec 1966'),
('Simple living and high thinking is the solution to all problems.', 'Srila Prabhupada, Letter to Vrindavan, 12 Aug 1971'),
('Krishna consciousness is not a sectarian religious cult. It is a science of the soul, a universal cultural movement for the spiritual re-education of all human society.', 'Srila Prabhupada, Letter to Dr. Bigelow, 26 Mar 1971')
on conflict do nothing;

-- ---------- TESTIMONIALS (homepage; public submit, admin approves) ----------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- MESSAGE BOARD (public, visible replies) ----------
create table if not exists public.board_messages (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.board_messages(id) on delete cascade,
  author_name text not null default 'Anonymous',
  is_anonymous boolean not null default true,
  body text not null,
  is_admin_reply boolean not null default false,
  hidden boolean not null default false,   -- moderation: admin can hide without deleting
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;
alter table public.weekly_quote enable row level security;
alter table public.testimonials enable row level security;
alter table public.board_messages enable row level security;

drop policy if exists "quotes public read" on public.quotes;
create policy "quotes public read" on public.quotes for select using (true);
drop policy if exists "quotes admin write" on public.quotes;
create policy "quotes admin write" on public.quotes for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "weekly_quote public read" on public.weekly_quote;
create policy "weekly_quote public read" on public.weekly_quote for select using (true);
drop policy if exists "weekly_quote admin write" on public.weekly_quote;
create policy "weekly_quote admin write" on public.weekly_quote for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "testimonials public read published" on public.testimonials;
create policy "testimonials public read published" on public.testimonials for select using (published = true or public.is_admin());
drop policy if exists "testimonials public submit" on public.testimonials;
create policy "testimonials public submit" on public.testimonials for insert with check (true);
drop policy if exists "testimonials admin manage" on public.testimonials;
create policy "testimonials admin manage" on public.testimonials for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "testimonials admin delete" on public.testimonials;
create policy "testimonials admin delete" on public.testimonials for delete using (public.is_admin());

drop policy if exists "board public read" on public.board_messages;
create policy "board public read" on public.board_messages for select using (hidden = false or public.is_admin());
drop policy if exists "board public post" on public.board_messages;
create policy "board public post" on public.board_messages for insert with check (is_admin_reply = false);
drop policy if exists "board admin manage" on public.board_messages;
create policy "board admin manage" on public.board_messages for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "board admin delete" on public.board_messages;
create policy "board admin delete" on public.board_messages for delete using (public.is_admin());

grant execute on function public.get_weekly_quote() to anon, authenticated;

-- Homepage hero photo (admin-editable): reuses site_settings.
insert into public.site_settings (key, value) values ('homepage_hero_image_url','')
on conflict (key) do nothing;

-- ============================================================
-- ADMIN-ONLY MEMBER CREATION
-- Regular people cannot self-register as members (only "pending"
-- via the public message board's optional sign-up — see the app).
-- Admins create real member accounts through an Edge Function
-- (supabase/functions/admin-create-member) because creating another
-- person's login requires the secret service_role key, which must
-- never be used in the browser. See the Edge Function file and the
-- README for the one-time deploy step.
-- ============================================================

-- ---------- STORAGE (for admin-uploaded photos) ----------
insert into storage.buckets (id, name, public) values ('site-images','site-images', true)
on conflict (id) do nothing;

drop policy if exists "site-images public read" on storage.objects;
create policy "site-images public read" on storage.objects for select using (bucket_id = 'site-images');
drop policy if exists "site-images admin upload" on storage.objects;
create policy "site-images admin upload" on storage.objects for insert with check (bucket_id = 'site-images' and public.is_admin());
drop policy if exists "site-images admin delete" on storage.objects;
create policy "site-images admin delete" on storage.objects for delete using (bucket_id = 'site-images' and public.is_admin());

-- ============================================================
-- BOOK CATALOG SEED (from owner's preliminary catalog, 1 Oct 2026)
-- No cover photos yet — add them anytime from the Admin Panel's
-- Merchandise tab (there's a Photo upload field on each product).
-- Run this once, after the main schema above.
-- ============================================================
do $$
declare
  books jsonb := '[
    {"name":"Bhagavad-gita As It Is","description":"The complete, unabridged edition with original Sanskrit text, translation and commentary.","price_kes":700},
    {"name":"Srimad-Bhagavatam (Complete Set)","description":"The complete multi-volume set.","price_kes":18000},
    {"name":"Mahabharata","description":"The great Indian epic.","price_kes":2000},
    {"name":"The Science of Self-Realization","description":"","price_kes":150},
    {"name":"Beyond Illusion and Doubt","description":"","price_kes":150},
    {"name":"The Journey of Self-Discovery","description":"","price_kes":150},
    {"name":"Perfect Questions, Perfect Answers","description":"","price_kes":50},
    {"name":"Laws of Nature: An Infallible Justice","description":"","price_kes":50},
    {"name":"Easy Journey to Other Planets","description":"","price_kes":50},
    {"name":"Beyond Birth and Death","description":"","price_kes":50},
    {"name":"On the Way to Krsna","description":"","price_kes":50},
    {"name":"Raja-vidya: The King of Knowledge","description":"","price_kes":50},
    {"name":"Elevation to Krsna Consciousness","description":"","price_kes":50},
    {"name":"Krsna Consciousness: The Matchless Gift","description":"","price_kes":50},
    {"name":"Krsna Consciousness: The Topmost Yoga System","description":"","price_kes":50},
    {"name":"The Message of Godhead","description":"","price_kes":50},
    {"name":"Coming Back: The Science of Reincarnation","description":"","price_kes":50},
    {"name":"Life Comes From Life","description":"","price_kes":50},
    {"name":"The Perfection of Yoga","description":"","price_kes":50}
  ]';
  b jsonb;
begin
  for b in select * from jsonb_array_elements(books) loop
    if not exists (select 1 from public.products where name = (b->>'name')) then
      insert into public.products (name, description, price_kes, category, published)
      values (b->>'name', b->>'description', (b->>'price_kes')::numeric, 'book', true);
    end if;
  end loop;
end $$;

-- ---------- COURSES (course catalog, admin-managed) ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  schedule text,
  how_to_join text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.courses enable row level security;
drop policy if exists "courses public read" on public.courses;
create policy "courses public read" on public.courses for select using (published = true or public.is_admin());
drop policy if exists "courses admin write" on public.courses;
create policy "courses admin write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Add a synopsis field to products (for books) ----------
alter table public.products add column if not exists synopsis text;
