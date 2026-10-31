# ISKCON JUJA WEBSITE — MASTER HANDOFF README

> **Purpose.** This single document lets *any AI agent* (and the owner) pick this project up cold and continue it exactly, with the same rules, decisions, tools and quality bar. It is written for two readers:
> - **Part A — for the OWNER** (not technical): what to do, click by click.
> - **Part B — for the AI AGENT**: ground rules, architecture, how the code works, how to verify, what is left.
>
> **Last updated:** 27 Oct 2026 (implementation plan + owner decisions added, §12A and §13). **Project package:** `iskcon-juja-PROJECT.zip` (this README is inside it). Always treat the zip as the source of truth, not chat history.

---

## TABLE OF CONTENTS
**Part A – Owner:** 0 Start here · 1 What you have · 2 Everyday tasks (test, deploy, SQL, admin, keep-alive) · 3 Hand over to a new agent · 4 When something breaks
**Part B – Agent:** 5 Ground rules · 6 Facts (source of truth) · 7 Architecture & layout · 8 Front-end behaviour & hooks · 9 Database · 10 Admin panel · 11 Status (done / unverified) · 12 Next tasks, in priority order (with specs) · 13 Open decisions · 14 Legal/privacy · 15 Reference data · 16 Environment limits · 17 Bug history & lessons · 18 Replicating for another temple · 19 Agent workflow & delivery protocol · Appendix: START PROMPT

---
---
# PART A — FOR THE OWNER

## 0. Start here
You do **not** need to understand code. Your jobs are always one of: (1) test something and send a screenshot, (2) copy a file / click a button where only you can, (3) decide something. An AI agent does the rest. Everything below tells you exactly what to click.

**Status in one sentence:** the public website is live at **https://iskconjuja.co.ke** (Cloudflare; the old iskconjuja.netlify.app is retired); the database (Supabase) is connected and your login works; the newest round of fixes (mobile header, sidebar, security, duplicate-script bug) is **in this package but not yet on the live site** — see §2.2 and §11.

## 1. What you have
| Thing | Where | Notes |
|---|---|---|
| Live website | https://iskconjuja.co.ke | Free Cloudflare hosting, updates itself from GitHub `main` (see §12B) |
| Database + logins + photos | Supabase project **ISKCONJUJA** (free plan) | https://zwvgfhgxegxchwlpelbk.supabase.co |
| Admin panel | the site → login icon → sign in → lock icon (top right) | Only admins see the lock icon |
| This package | `iskcon-juja-PROJECT.zip` | Everything, including this README |
| Upload package | `iskcon-juja-DEPLOY.zip` | ONLY the website files, safe to upload to Netlify |

Package contents (folder `iskcon-juja-project/`):
```
README.md                 this document
site/                     EVERY file that goes live (HTML pages, styles.css, scripts, images/)
supabase/                 database scripts (schema.sql, course_system_schema.sql) + the add-member server function
tools/                    check_site.py (safety checker), build_common.py (rebuilds header/footer), package.py (makes the zips)
docs/                     your reference files: course-system spec, logo files + manual, book catalog, calendar prototype, quote source
```

## 2. Everyday tasks

### 2.1 Test the site on your computer before publishing (Windows + Chrome)
1. Unzip `iskcon-juja-PROJECT.zip`. Open the folder `site`.
2. Easiest way: install **VS Code** (free), install its extension **Live Server**, open the `site` folder, right-click `index.html` → **Open with Live Server**. (Double-clicking index.html does NOT work properly.)
3. Test on your **phone** too: with Live Server running, open the "Network" address it shows from the phone on the same Wi-Fi, or simply test after deploying (§2.2).
4. Checklist — send a screenshot of anything that looks wrong:
   - **Phone width** (Chrome: F12 → click the phone icon): top row = logo (left), Hare Krishna mantra in two lines (middle), Prabhupada (right). Menu button + profile + moon icon are in a **separate bar below**, and that bar stays stuck at the top when you scroll.
   - No sideways scrolling anywhere on any page.
   - Home page hero: heading, hook line and paragraph on the left; the two buttons in a panel on the right (stacked on phones).
   - Left sidebar "On this page" on long pages; on phones it is a button that opens a list. The big photo banner at the top of each page is full width.
   - Floating chat button (bottom right) opens a small menu with **Message Board** and **WhatsApp**.
   - Dark/light toggle shows ONE icon.
   - Learn page: pick a book on the left → it opens in the big reader. (If the reader stays blank, Vedabase blocks embedding — tell the agent.)
   - Footer shows the address, phone, links.

### 2.2 Publish the new version to the live site
1. Unzip `iskcon-juja-DEPLOY.zip` into a folder (do not upload the PROJECT zip — it contains database scripts that should not be public).
2. Go to **app.netlify.com** → your site → **Deploys** tab → drag the **unzipped folder** onto the box that says to drag and drop.
3. Wait ~30 seconds, open the live address, press **Ctrl+Shift+R** (hard refresh) and re-run the checklist on your phone.
4. If something is broken, in the Deploys list click the previous deploy → **Publish deploy** to go back instantly.

### 2.3 Update the database (only when an agent tells you the SQL changed)
**Diagnostic queries (run each in the SQL Editor and send the result):** `select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname='public' order by 1,2;` and `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by 1;`
1. Supabase → your project → left sidebar **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` in Notepad, select all, copy, paste into the editor, click **Run**. It is safe to run any number of times.
3. Green "Success" = done. Red error = copy the exact text to the agent.
4. **`course_system_schema.sql` is for the later course system — do not run it until an agent says so.**
5. **You must run `schema.sql` again after receiving this package** — it now blocks visitors from approving their own testimonials/messages (a security fix), makes members-only courses really private, and adds the TikTok/footer-address settings.

### 2.4 Running the site day to day (Admin panel)
Sign in (login icon, top right) → lock icon → tabs:
| Tab | What it does |
|---|---|
| Settings | Till number, Pesapal link, WhatsApp group link, Facebook/Instagram/YouTube/TikTok links (type them with or without https://), footer address, homepage photo upload, and ON/OFF switches for: Merchandise menu, homepage articles, special events. **Anything left blank stays hidden from visitors.** |
| People | Add a member (needs the one-time server-function setup, §2.5); promote people (super admin only) |
| Testimonials | Visitors submit; **nothing shows publicly until you tick Approved** |
| Message Board | Hide, delete, or reply as Admin |
| Articles / Events / Merchandise / Courses | Add, **Edit**, publish/unpublish, delete. Merchandise supports a photo and a synopsis. Courses have a "who can see" choice: Public (shown on the Learn page) or Members only |
| Business Card | Two-sided ID-size card with logo, Prabhupada, mantra, contacts, QR code. Download as PNG or A4 print PDF. **Generate cards only from the live site (never localhost) so the QR points to the real address.** |

First things to do in Settings after deploying: paste your social links (they are also pre-filled by the SQL), switch **Merchandise** on once you are happy with the books, add real events/articles, upload a homepage photo if you want.

### 2.5 One-time: enable "Add a Member" (server function)
1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Name it exactly `admin-create-member`. Delete the sample code, paste ALL of `supabase/functions/admin-create-member/index.ts`, click **Deploy**.
3. If adding a member later says "Invalid JWT": open the function's settings and switch **Verify JWT** off (the code checks the login itself).
4. Until you do this, create members manually: Supabase → **Authentication → Users → Add user** (tick *Auto Confirm*), then in the site Admin → People set their role to **member**.

### 2.6 One-time: stop the free database from going to sleep
Supabase's free plan **pauses a project after about a week with no activity** (un-pausing is one click in the Supabase dashboard, but the site would be down meanwhile). Real visitors usually prevent this, but add insurance:
1. Make a free account at **cron-job.org** → **Create cronjob**.
2. URL: `https://zwvgfhgxegxchwlpelbk.supabase.co/rest/v1/site_settings?select=key&limit=1`
3. Schedule: every 12 hours. Under **Advanced → Headers** add: name `apikey`, value = the long key that starts with `sb_publishable_` from `site/supabase-config.js` (it is a *public* key, safe to use here).
4. Save → click **Test run**. You want **HTTP 200**.

### 2.7 Domain and email (when you are ready; costs about KES 800–1,500 per year)
- `iskconkitengela.co.ke` cannot be renamed and must stay with the Kitengela site. Register a **new** domain (e.g. `iskconjuja.co.ke`) at a Kenyan registrar that accepts M-Pesa (Truehost, Hostiko…).
- In Netlify: Site → **Domain management → Add domain**; Netlify tells you what DNS records to add at the registrar (an agent can walk you through it).
- Free email: **Zoho Mail free plan** (up to 5 mailboxes, 5 GB each, webmail/app only). Use `admin@yourdomain` to open the social accounts.
- Until the domain is live: Netlify → Site configuration → **Change site name** gives a free `yourname.netlify.app`.
- **Do not print business cards until the final domain is live.**

### 2.8 Backups
The free Supabase plan does **not** back up for you. Monthly: Supabase → **Table Editor** → each table (articles, events, products, testimonials, profiles…) → **Export → CSV**, keep the files safe. Also keep this PROJECT zip.

## 3. Hand over to a new agent (new chat)
1. Start a new chat with an AI agent that can run code and read zip files.
2. Upload `iskcon-juja-PROJECT.zip`.
3. Paste the **START PROMPT** from the end of this README.
4. Tell it only *what you want* ("fix the mobile header", "build registration"). It should read this README itself.
5. When it gives you files: replace the same-named files in your `site` folder, run SQL only if told, test with §2.1, deploy with §2.2. Always send **screenshots** + what you clicked + any red text.

## 4. When something breaks
| Symptom | Likely cause → what to do |
|---|---|
| Red error "policy … already exists" when running SQL | You ran an old script. Use the current `schema.sql` (it is safe to repeat). |
| Admin lock icon missing after login | Your role isn't admin. SQL Editor: `update public.profiles set role = 'super_admin' where email = 'YOUR-EMAIL';` |
| Pages show empty states / "not connected" | `site/supabase-config.js` empty, or the Supabase project is **paused** (open Supabase dashboard → Restore) |
| Pictures missing on the live site but fine on your computer | File-name capital letters/spaces (Netlify is case-sensitive). Run `tools/check_site.py`. |
| Learn page reader is blank | Vedabase may block embedding. Use the "open in a new tab" link under the reader; tell the agent. |
| Buttons act twice / floating menu won't open | Duplicate script bug (fixed in this package, §17). Make sure you deployed the new version. |
| "Invalid JWT" adding a member | Switch Verify JWT off on the function (§2.5). |
| Storage/photo upload fails | `schema.sql` not (re)run, or you are not signed in as admin. |

---
---
# PART B — FOR THE AI AGENT

## 5. GROUND RULES (the owner's standing rules — obey all)
1. **Assume the owner has zero technical knowledge.** Any step only they can do must be written click-by-click. Never say "just run X" without saying where.
2. **Full files, never snippets.** Do not tell the owner to edit lines. Give complete replacement files. For small edits send only the changed files (complete); use the zips (§19) for large handoffs.
3. **Decide, don't ask.** The owner said: until the site is live, you decide what to do; ask only for *details you cannot know* (credentials, real content, preferences). Prefer the shortest path to a finished, live site. Don't end turns with "what next?".
4. **Free first.** Use free tiers; when unavoidable, give the cheapest viable option and state the real cost.
5. **Never show non-functional things on the public site.** If a feature isn't ready (Till number, Pesapal, socials, product lists, courses…), hide it until it works. Things that can be added later must be addable from the admin portal. **Build the framework; the admin adds the flesh** — never hardcode articles, events, products, courses, social links, Till number, etc.
6. **Every SQL file must be safe to run twice** (Postgres has no `CREATE POLICY IF NOT EXISTS`): every `create policy` preceded by `drop policy if exists`; `create table if not exists`; `create or replace function`; inserts use `on conflict`/existence checks. `tools/check_site.py` enforces this.
7. **Plain English, no Sanskrit jargon in site text:** kirtan→music, prasadam→feast/food/breakfast/lunch (by time of day), aarti→worship ceremony, seva→service, japa→chanting, ekadasi→fasting day, mantra→chant, bhakti→devotion, guru→teacher. Exceptions: Srila Prabhupada's name, official names (Bhaktivedanta Book Trust), the maha-mantra itself. **Mantra spelling:** `Hare Krishna Hare Krishna Krishna Krishna Hare Hare` / `Hare Rama Hare Rama Rama Rama Hare Hare` — plain letters, **no diacritics**.
8. **No horizontal scrollers, ever. Everything must fit** every screen width. Mobile is first-class.
9. **Header rule (owner: "very important").** The *brand row* = logo (left) | maha-mantra in exactly two lines (middle, scaled to fit) | Prabhupada photo (right). It is the **same arrangement on every device; only its size scales. Nothing else is ever placed inside or mixed into it.** Menu button, profile icon and light/dark toggle live in a **separate nav bar below**, which stays stuck (sticky) while scrolling.
10. **Official ISKCON logo rules** (manual in `docs/branding`): never alter/recolour/outline/rearrange the lotus + ISKCON lettering + ®; colour `#B74233` (PMS 187); a place-name descriptor ("JUJA") set below in bold Helvetica/Arial, all caps, wide tracking, cap-height ≈ 0.6 × letter height, gap ≈ 0.8×, spanning the width of the bars. **All ISKCON documents (e.g. business card) must show Srila Prabhupada's photo**, mirroring the header.
11. **Credit Vedabase/BBT with their exact wording** wherever their text is embedded (see Learn page): "His Divine Grace A.C. Bhaktivedanta Swami Prabhupāda, Founder-Ācārya of the International Society for Krishna Consciousness. Content used with permission of © The Bhaktivedanta Book Trust International, Inc. All rights reserved. And the Bhaktivedanta Archives Inc, Owner of the VedaBase™" + link to https://vedabase.io/en/privacy-policy/.
12. **Copyright & quotes:** don't hotlink third-party images or copy their text; keep quotations short and verified (search before quoting; never invent). Book cover photos are uploaded by the admin.
13. **Privacy by design:** ask consent before collecting personal data, keep the Privacy Policy linked in every footer, provide opt-out. Not legal advice; recommend a lawyer (§14).
14. **Be honest about verification.** You usually cannot open a browser. Never claim "tested" for visual/behavioural things; say "built and checked by `check_site.py`, needs the owner's screenshot".
15. **README discipline.** The owner dislikes README spam. Update *this* file only at milestones or when asked; never re-send it every turn.
16. **Future reuse:** the owner wants the same site reusable for other temples (temple name everywhere, contact, location, programs, theme colours editable from admin). Not now; don't make it harder (see §18).

## 6. FACTS (source of truth)
- **Organisation:** ISKCON Juja / "Hare Krishna Community Centre in Juja", Kiambu County, Kenya. Student-focused (JKUAT nearby), youth-friendly tone.
- **Address (footer, short):** `Anthusia Apartments hse GH 3, Muraya Access road, Juja` (setting `address_short`). **Full:** Anthusia Apartments, House No. GH3, Muraya Access Road, Theta Ward (Gachororo), Juja, Kiambu County. **Map search text:** `Anthusia Apartments Muraya Access Road Gachororo Juja Kenya`.
- **Contacts (WhatsApp preferred, also calls):** primary **Tim 254714211692** (program contact; to be an admin); backup **Dan 254743184998** (owner, super admin). Currently constants `WHATSAPP_PRIMARY/SECONDARY` at the top of `site/site.js` (to move into settings, §12 task 6). Format: country code + number, no `+`/spaces.
- **WhatsApp group invite:** https://chat.whatsapp.com/Bov3QCpBdmZ8dUt6oGfQqM (setting `whatsapp_group_invite`).
- **Socials:** Instagram https://www.instagram.com/iskconjuja.ke/ · TikTok https://www.tiktok.com/@iskconjuja.ke · YouTube https://www.youtube.com/@ISKCONJUJA · Facebook: none yet. (Pre-filled by `schema.sql` only where blank.)
- **Programs (static text today, to become editable §12 task 6):** **Tuesdays & Fridays 5:30–7:00 PM** at the centre: music, then Tuesday a talk/discussion (often a guest speaker from the Nairobi temple) or Friday group book reading & discussion, then a free vegetarian feast. **Sundays:** no local program; group trips to the main temple, **Ngara, Nairobi** (Sri Sri Radha Bankebhari Ji Temple) — leave Saturday evening or ~6:30 AM Sunday, return afternoon/evening. Nairobi Sunday schedule: 7:45 AM class · 9:00 breakfast · 11:00 music · 12:30 worship ceremony · 1:00 class · 2:00 lunch. Visitors are welcome **any time** to relax and learn; the schedule is only for structured programs.
- **Juja is an apartment-based congregation, not a temple with deities** — never claim daily darshan/altar services.
- **Money:** M-Pesa Till needs the main temple's permission → **for now shop orders and donations go to WhatsApp**; Till and Pesapal appear automatically when their settings are filled in. Book proceeds fund running the centre and printing more books; all books are also free to read at the centre.
- **Domain:** `iskconjuja.co.ke` (bought at Truehost, DNS on Cloudflare, live since 29 Oct 2026). Email sending: Brevo (see §12B).
- **Owner's setup:** Windows + Chrome (from screenshots); tests locally at `localhost:3000` with clean URLs (e.g. `/about`).
- **Roles:** `pending` → `member` → `admin` → `super_admin`. Dan = super admin; Tim = admin (to add). Members are added **only by an admin** (no public self-signup; the owner scrapped a "registered public" pool). A *membership application form* (public → admin approval, with an admin-editable explanation of what membership means) is wanted later (§12).
- **Hero heights (owner-tuned):** home hero `min-height:70vh`, other page heroes `50vh`.

## 7. ARCHITECTURE & LAYOUT
**Stack:** static HTML + CSS + vanilla JS (no framework, no build step) on **Netlify** (free, drag-and-drop); **Supabase** free plan (Postgres + Auth + Storage + Edge Functions) as backend; the browser talks to Supabase directly using the public *publishable key* in `site/supabase-config.js`; Row Level Security (RLS) in the database is the real security layer. CDN libraries: `@supabase/supabase-js@2` (jsDelivr, all pages); admin page only: `qrcodejs 1.0.0`, `html2canvas 1.4.1`, `jspdf 2.5.1` (cdnjs). Fonts: Playfair Display + Poppins via Google Fonts `@import` (privacy to-do: self-host).
**The secret (service-role) key is never in the browser or repo;** it is used only inside the Edge Function.

```
site/
  index.html about.html events.html participate.html merch.html learn.html
  message-board.html privacy.html                      ← public pages
  devotees.html (login only)  dashboard.html  my-courses.html  courses.html  admin.html   ← member/admin
  styles.css                  ← ALL styling (CSS variables for light + dark mode)
  site.js                     ← theme toggle, WhatsApp links, settings fallback, sidebar builder, read-more
  data.js                     ← Supabase client + loaders/renderers + auth + role-aware nav + floating menu
  admin.js  auth-guard.js     ← admin console logic / page protection
  supabase-config.js          ← the ONLY file with the project URL + public key
  images/  assets/            ← lowercase file names, no spaces (Netlify is case-sensitive)
supabase/
  schema.sql                  ← main database (run first)  ·  course_system_schema.sql (later phase)
  functions/admin-create-member/index.ts
tools/ check_site.py  build_common.py  package.py
docs/  COURSE_SYSTEM_SPEC.md  Book_Catalog_preliminary.pdf  quotes-batch-1-source.pdf  reference/  branding/
```
**Shared header & footer** are baked into every page (no includes in plain HTML). **Never hand-edit them in a page** — edit the templates in `tools/build_common.py` and run it (it also guarantees one copy of each shared script in the right order). **Script order on every page:** `supabase-config.js` → Supabase library → `data.js` → `site.js` → page-specific (`auth-guard.js`, admin libs, `admin.js`). Pages with inline scripts (`learn.html`, `devotees.html`) use them after/independent of these.

## 8. FRONT-END BEHAVIOUR & HOOKS
**Theme:** `body.dark-mode` toggles dark variables; saved in `localStorage["site-theme"]`. The toggle icon is written **only by JS** (`syncThemeControls()`); never add a CSS `::before` icon (that caused a double-icon bug). Key variables: `--canvas --band-bg --card --row-tint --maroon --maroon-dark --gold --gold-soft --body-text --muted --line --shadow --hero-overlay`, plus `--brand-img` (logo/portrait size, `clamp(40px,12vw,86px)`) and `--nav-h` (54px). **Every `var(--x)` must be defined** (checker enforces).
**Header v2 (CSS at end of styles.css):** `.site-header{display:contents}` so only `.nav-container` is `position:sticky` (z-index 100; drawer 200, scrim 150, floating button 9999). Brand row = CSS grid; the mantra element is a container-query box (`container-type:inline-size`) and its font-size is `min(3.6cqw,17px)` so each of its 2 lines always fits. **`overflow-x:hidden` on html/body breaks sticky — use `overflow-x:clip`.**
**Hooks (HTML attributes → behaviour):**
| Attribute | Effect |
|---|---|
| `data-whatsapp="message"` | becomes a `wa.me` link to the primary number with that message (re-run `ISKCON.wireWhatsAppLinks()` / fire event `iskcon:rerender-whatsapp` after injecting new elements) |
| `data-contact-phone` | shows the formatted primary phone + `tel:` link |
| `data-show-if="key"` + `hidden` | element appears only when setting `key` is truthy (e.g. `store_enabled`) |
| `data-setting-link="key"` + `hidden` | link appears with `href` = setting value (https:// auto-added) |
| `data-setting-text="key"` | element's text replaced by the setting value if set (default text stays as fallback) |
| `data-map-link` | **hook placed in footer; JS handler for a `map_query` setting NOT yet written** (§12 task 6) |
| `data-articles-list / -events-list / -products-list / -courses-list / -public-courses-list / -testimonials-list` | containers filled from the database (honest empty state inside when none) |
| `data-testimonial-form`, `data-board-form`, `data-board-list` | public forms/lists (board has nested replies, optional name, otherwise "Anonymous") |
| `data-quote-of-week`, `data-verse-of-day` | quote cards (`data-quote-text/-source`, `data-verse-text/-source`) |
| `data-homepage-hero` | hero background replaced by setting `homepage_hero_image_url` |
| `data-public-nav` / `data-member-nav` / `data-admin-nav` | nav shown to visitors / signed-in members / admins only (set by `data.js applyRoleNav()`) |
| `data-no-toc` on `<body>` | page gets no auto sidebar (login, admin, board, my-courses, learn which has its own) |
| `data-toggle-target="id"` on `.read-more-toggle` | show/hide a block |
| `data-year` | current year in footer |
**Auto sidebar ("On this page"):** `site.js buildTocSidebar()` collects the `<h2>`s below the hero, builds the list, keeps the hero full-width, wraps sections in `.toc-layout` (sidebar sticky below the nav bar; ≤1100px it becomes a dropdown button). Pages need ≥2 `<h2>`.
**Floating button:** bottom-right chat bubble → menu: Community Message Board + WhatsApp (`data.js`).
**Quote system:** 25 verified quotes embedded in `data.js` (`FALLBACK_QUOTES`) *and* seeded in table `quotes`. Quote of the Week = DB function `get_weekly_quote()` (one per ISO week, least-recently-used, never repeats until all used) with deterministic client fallback. "Verse of the Day" currently reuses the same pool, daily rotation (interim, §12).
**Learn page:** left sidebar lists 27 Vedabase books + Transcripts + Letters (URLs `https://vedabase.io/en/library/<slug>/`, slugs in §15); one large iframe; slim search box loads `https://vedabase.io/en/search/?q=…` into the same frame (parameter name is a **best guess**, unverified); attribution block; public courses (`visibility='public'`) below.

## 9. DATABASE (Supabase / Postgres)
**Run order:** `supabase/schema.sql` (always safe to re-run). `course_system_schema.sql` only when starting the course system. **Edge Function** `admin-create-member` deployed via the dashboard editor (§2.5).
**Tables in schema.sql:** `profiles` (id, email, role; row auto-created by trigger `on_auth_user_created` with role `pending`) · `site_settings` (key/value text) · `articles` · `events` (start_date, end_date, speakers, schedule, description, extra jsonb, published — **no start TIME yet**) · `products` (name, description, **synopsis**, price_kes, category, file_url, image_url, published) · `quotes` + `weekly_quote` · `testimonials` · `board_messages` (parent_id, author_name, is_anonymous, body, is_admin_reply, hidden) · `courses` (title, description, schedule, how_to_join, published, **visibility** public/members/internal). Storage bucket **`site-images`** (public read, admin write). Functions: `is_admin()`, `handle_new_user()`, `get_weekly_quote()` (+ in course file: `course_visible()`, `verify_certificate()`).
**course_system_schema.sql** (Phase 1 of `docs/COURSE_SYSTEM_SPEC.md`, *schema + security only*): extends `courses`; adds modules, lessons, blocks (13 types incl. verified quotes), lesson FAQs, quizzes/questions/options, enrolments, cohorts/teachers/students/unlocks, lesson progress, quiz attempts/answers, practice logs, submissions, reflection notes, questions inbox, lesson feedback, reviews, certificates, groups. **Not yet confirmed as run on the live DB — ask/verify before building on it.**
**Settings keys (table `site_settings`):** `mpesa_till` · `pesapal_donate_url` · `facebook_url` · `instagram_url` · `youtube_url` · `tiktok_url` · `whatsapp_group_invite` · `address_short` · `store_enabled` · `articles_enabled` · `special_events_enabled` · `members_enabled` (legacy, unused by nav) · `homepage_hero_image_url`. Toggles stored as the text `'true'/'false'`.
**RLS principles:** public can read only *published* rows; only `is_admin()` writes content; public may INSERT only into `testimonials` (`published=false` enforced), `board_messages` (`is_admin_reply=false and hidden=false` enforced), and (course file) inbox/feedback/reviews with moderation flags forced off; users see only their own progress rows; `courses` readability depends on `visibility` + role. **RLS has never been tested role-by-role on the live DB** (§12 task 4).
**Books:** 19 titles & prices seeded (Bhagavad-gita As It Is 700; Srimad-Bhagavatam set 18,000; Mahabharata 2,000; three 150; thirteen 50) — source `docs/Book_Catalog_preliminary.pdf`; no cover photos yet.

## 10. ADMIN PANEL (`site/admin.html` + `admin.js`)
Guarded by `auth-guard.js data-require="admin"` (redirects to login; pending users see "awaiting approval"). Generic helper `wireTable(table, formId, listId, statusId, rowRenderer)` gives any table: add form, list, **Edit** (re-fills the form), publish toggle, delete. To add a content type: create the table + RLS in SQL, add a tab button + `<section class="admin-tab-panel" data-tab-panel="x">` with a `<form id=…>` whose `name`s match columns, then one `wireTable(...)` call. Special panels: Settings (text keys + toggles + hero upload to `site-images`), People (add member via `client.functions.invoke('admin-create-member')`, role dropdown for super admins), Testimonials (approve/delete), Message Board (hide/delete/reply as Admin — needs policy "board admin reply"), Business Card (two faces rendered as DOM, QR via qrcodejs, exports via html2canvas → PNG / jsPDF A4 grid; logo inlined as SVG so capture is reliable).
Dashboard password-change card (`wireChangePassword` in `data.js`) exists because admin-set temporary passwords must not be permanent.

## 11. STATUS
**Confirmed working by the owner:** site live on Netlify; Supabase connected; login; dashboard; role-aware nav (screenshot). *Everything else is built and syntax-checked but not confirmed by the owner.*
**In this package, built but NOT yet deployed or browser-verified (high risk of visual surprises — ask for screenshots):**
- Header v2: brand row grid, mantra fits two lines at all widths, menu button moved into the sticky nav bar.
- Sidebar rewrite (hero full width, dropdown on phones).
- **Duplicate-script fix** (live pages load `data.js` 15–17×).
- `overflow-x:clip` (sticky now works), undefined `--card-bg` fixed, "Kirtan" heading fixed.
- Security policy tightening (needs `schema.sql` re-run), TikTok + footer-address settings.
**Done & delivered earlier (see §8–10):** all public pages; Learn page; message board; testimonials; quotes; admin panel with Edit/moderation/business card; courses (simple) + public/members visibility; privacy policy page; add-member function code; Merchandise page (hidden until enabled); read-for-free messaging; favicon (Gaura-Nitai); attribution.
**Not built yet:** see §12.

## 12. NEXT TASKS — priority order (each with enough spec to start)
**Immediate (finish "get live"):**
1. **Verify header v2 + sidebar on real phones** (ask owner for screenshots at ~360px, ~768px, desktop; fix; deploy).
2. **Owner runs `schema.sql`** (security fix) — confirm success. Confirm whether `course_system_schema.sql` was ever run.
3. **Keep-alive** set up (§2.6) — confirm "Test run = 200".
4. **Security pass:** (a) write a role-by-role test (anonymous, pending, member, admin) — in SQL editor using `set local role anon;` and `select set_config('request.jwt.claims', json_build_object('sub','<uuid>','role','authenticated')::text, true); set local role authenticated;` — checking each table; (b) add DB-side limits: `check (char_length(...))` on `testimonials.name/message`, `board_messages.author_name/body`; (c) global rate-limit trigger (≈20 inserts/min) on `testimonials` and `board_messages`: `security definer`, `set search_path = public`, counts rows in last minute **as definer** (otherwise RLS hides unpublished rows and the limiter never trips), raise exception; (d) honeypot hidden field on the testimonial form, board form and board reply form (drop submission silently if filled). Grading of quizzes (later) must be server-side, never trusted from the browser.
5. **Privacy policy fix:** it says only the theme preference is stored in the browser; signing in also stores a login token in `localStorage` (Supabase). Add `404.html` (Netlify serves it automatically) and a small `_headers` file (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`; no CSP — external scripts/iframes would break).
6. **Editable contact, location, programs** (owner wants reuse): (a) settings `whatsapp_primary`, `whatsapp_secondary` → make constants `let` in `site.js`, add `ISKCON.setContact({primary,secondary})` (re-wire links + phone text), expose via getters, call from `data.js applySettings`; digits-only normalisation in admin; business card must read them; (b) `address_full`, `map_query`, `programs_summary` settings + `data-setting-text` spans on Get Involved ("Address:", "Program Times") and `data-map-embed` on the map iframe, and a handler for the existing `data-map-link` footer hook (`https://www.google.com/maps/search/?api=1&query=<q>` and `https://www.google.com/maps?q=<q>&output=embed`); (c) **`programs` table** (title, schedule_text, location_text, details *one line per row*, image_url, cta_label, cta_message, order_index, published) + admin tab (reuse `wireTable`; add photo upload like products) + `events.html` renders cards from it (line `left — right` → `<strong>left</strong> — right`), falling back to the current static cards; seed the two Juja programs so the live page is DB-driven from day one. Remaining prose mentions (FAQ, home "Your First Visit") are static — acceptable until the white-label task.
7. **Owner content entry (not developer work):** events, articles, courses, product photos, real directions text (owner will supply; the earlier hand-drawn map was removed at his request), better Prabhupada standing photo (current file 363×853 is soft; a high-resolution original from ISKCON Nairobi/Bhaktivedanta Archives is the fix).
**After launch:**
8. **Domain + email** (§2.7). Then add Open Graph/SEO tags with absolute URLs, `sitemap.xml`, `robots.txt`.
9. **Member area basics:** *forgot-password flow* (Supabase `resetPasswordForEmail`; free-tier email sending is heavily rate-limited — alternative: admin-side reset via a second Edge Function); **membership application form** (public form → table `member_applications` name/email/phone/reason/consent → admin tab approve → creates account with the add-member function; the explanation of what membership means is an admin-editable setting `membership_info`; the owner will draft the wording).
10. **Quotes admin tab:** add/edit/delete quotes + "set this week's quote" (upsert `weekly_quote`, `set_by_admin=true`) so admins can post, with the automatic reserve picking when they forget.
11. **Program registration & reminders** (large). Owner decisions: registering for a program/event records the person; they receive a message with the location + the WhatsApp group invite link (WhatsApp **cannot** auto-add people; they tap Join); reminders sent **twice per event/program — the day before and 3–5 hours before — "when to send" and the **message wording are set per event/program in the admin form**; the person **chooses their channel: SMS (default), Telegram, or Calendar**. Design: events get `start_time`; weekly programs need a recurring model (`programs` table above + schedule rule); `registrations` (name, contact, channel, consent_at, program/event ref, opt_out); `reminder_queue`; Supabase scheduled job (pg_cron) → Edge Function; SMS via a Kenyan gateway (Africa's Talking suggested; **cost ~KES 0.5–1/SMS, verify price and sender-ID rules**); Telegram bot (BotFather; person must press Start via `t.me/<bot>?start=<token>` — a bot cannot message first); Calendar = per-event `.ics` + a subscribe feed (Google Calendar may ignore alarms from subscribed feeds — test). Official WhatsApp Cloud API is paid (cents/message); unofficial libraries violate WhatsApp terms (ban risk) — rejected. Every message needs opt-out; add consent text + privacy policy update.
12. **Payments:** Pesapal API 3.0 (1.5–3.5%/transaction; going live needs a registered business: company/sole proprietorship/partnership, KRA PIN, ID, bank details — unregistered groups cannot go live). Needs `orders` table, Edge Function for order creation + IPN callback, admin orders tab. Till appears automatically when set. Until then WhatsApp.
13. **Course system** (`docs/COURSE_SYSTEM_SPEC.md`, owner-authored, authoritative): Phase 1 schema exists. Next: anonymous-session identity + email upgrade with a consent line (Supabase anonymous sign-in), learner pages (catalogue → course → lesson player with block renderers; quote blocks render only if `content.verified === true`), progress, auto-marked quizzes (server-side grading), admin content editor, then cohorts/teachers, discussion modes, reviews, certificates (+ public verification page). Public vs members: Learn page shows `visibility='public'`; member area shows everything the member may access.
14. **Vaishnava calendar** (Ekadashi/Gaurabda) — reference prototype in `docs/reference/vaishnava-calendar-engine-prototype.zip` (Node; Julian Day + tithi at sunrise; Masa/Paksha→Ekadashi name table; content arrays are only samples). Port to an Edge Function or browser JS, **verify against a trusted published calendar for several known dates before shipping**; until then the dashboard card honestly says dates are confirmed via the WhatsApp group.
15. **Verse of the Day — proper engine (owner asked for suggestions):** (A) table `daily_verses` admin-scheduled by date, falling back to (B) automatic rotation through a reference list (e.g., Bhagavad-gita in order, ~700 days) storing **only the reference + a link/embed to Vedabase** (do not mass-copy BBT text — only admin-entered short quotes), (C) hybrid A-then-B (recommended).
16. **Reading guide (long term, owner's idea):** members set goals ("2 hrs/week", "2 chapters/week", "finish the Bhagavad-gita in 5 months"); system computes a plan, sends reminders, asks occasional questions about what was read, and helps memorise verses (spaced repetition). Needs: goals/plan/log tables, admin-authored question bank (free-first; no paid AI calls), verse text sourcing that respects copyright. Shelved.
17. **Installable app (PWA):** `manifest.webmanifest`, icons, service worker (cache static files), install prompt; push notifications optional.
18. **White-label:** see §18. 19. **Polish:** self-host Google Fonts (needs font files; sandbox has no network), accessibility pass, image optimisation, admin how-to sheet for Tim, monthly export routine.

## 12A. IMPLEMENTATION PLAN (agreed 27 Oct 2026; supersedes the order in §12 where they differ)
**Standing rules added by the owner:** (1) THIS folder (`iskcon-juja-project/`) is the source of truth; the root-level README/SQL are older and must not be used. (2) **Nectar problems/corrections have top priority until the end of Kartik (24 Nov 2026)**; do not change Nectar's data model before then. (3) Update THIS README in detail after every major milestone. (4) Never guess or change the owner's plans without confirming; suggestions are welcome (cheaper/free first). (5) The owner will paste the live database SQL for the agent to confirm; until then assume schemas are NOT applied.
Each phase fits in 3 sessions or fewer.
- **Phase 0 (1 session): finish Nectar + get live safely.** Nectar fixes first; Damodarastakam text pasted by owner into `nectar/content/damodarastakam.txt`; owner pastes live SQL for confirmation; run hardened `schema.sql`; verify keep-alive; header v2/sidebar screenshots (360/768/desktop); security pass (§12 task 4); `404.html`, `_headers`, privacy-policy fix (§12 task 5).
- **Phase 0 progress (27 Oct 2026):** DONE in code (tested on a local Postgres 16 with mocked Supabase roles): `supabase/security_hardening.sql` (length limits + 20-posts-per-minute limiter on testimonials and board posts; re-runnable), `supabase/rls_test.sql` (role-by-role report: anon, signed-in non-member, member; rolls everything back), honeypot spam trap in `data.js` (testimonial and board forms), `404.html`, `_headers`, privacy page now discloses the login token and Nectar data. Copied identically to root and `site/`. **Owner still has to:** (1) paste the two diagnostic queries' results (see §2.3 below), (2) run `schema.sql`, then `security_hardening.sql`, then `rls_test.sql` in the Supabase SQL Editor and paste the TEST REPORT, (3) remove the "Powered by Netlify" overlay (Netlify > Site configuration > Build & deploy > Post processing > snippet injection) if present, (4) confirm keep-alive.
- **Phase 0 DATABASE DONE (27 Oct 2026, confirmed by owner):** the live DB had the old loose policy `testimonials public submit with check (true)` (anyone could self-publish a testimonial) and a board-post policy without `hidden=false`. Owner ran `1-database-update-run-first.sql` (= `schema.sql` + `security_hardening.sql`) successfully, then `rls_test.sql`: all 16 tests PASS (anon, signed-in non-member); the member test was skipped because no member account exists yet (re-run after creating one). Live DB still has no `course_*` tables.
- **Phase 1 step 1 (27 Oct 2026, built + tested locally, owner to run):** review of `course_system_schema.sql` found: learners could read the quiz answer key (`is_correct`) and insert their own quiz scores; quiz questions of hidden courses were readable by ID; unverified quote blocks were publicly readable; and the schema was NOT re-runnable (a bare `add constraint`, now fixed). Fixed in `supabase/course_system_hardening.sql`: answer key hidden; quizzes fetched via `course_quiz_for_learner(quiz)` (no answers) and graded in the database by `course_submit_quiz(quiz, answers)` (respects `max_attempts`, shows correct answers only for non-final quizzes); DB-level quote guard (`content.verified = true` required for non-admins); `course_visible()` pins search_path. Test: `supabase/course_rls_test.sql` (15 checks, all PASS locally). Owner runs file 3 (schema + hardening) then 4 (test). NOTE: `courses` has both `internal_group_id` and `course_group_id` (the latter is the one used); `table` and `timeline` block types are NOT yet in the block type check (awaiting owner approval).
- **Phase 1 step 2 (27 Oct 2026, built and tested with a fake database client; NOT yet seen on the live site):** new page `course.html` + `course-app.js` + `course.css` (new files only; no existing page changed except the privacy table wording). Hash routes: `#/` catalogue (filters by topic and level), `#/c/<id>` course page (modules, lessons, progress bar, Start/Continue), `#/l/<id>` lesson player (blocks stacked, Back/Next pinned, 360px safe), `#/q/<id>` quiz (one question per screen, server-graded). Block renderers: text, key_point, callout, quote (renders ONLY if `content.verified === true`), analogy, image, gallery, video (YouTube privacy-enhanced embed / self-hosted), audio, download, practice, table, timeline, reflection (private note kept on the device), quiz_ref. Reading needs no sign-in. Progress and quizzes use a guest session: a SEPARATE Supabase client with storage key `iskcon-learner` (never touches the main login). **Owner must switch on Supabase > Authentication > Sign In / Providers > "Allow anonymous sign-ins"**, otherwise quizzes show an honest "not switched on yet" message and progress is not saved. `supabase/course_system_v2.sql` adds the `table` and `timeline` block types and makes courses self-paced by default. Block `content` JSON shapes: text `{text}`; key_point `{text}`; callout `{style:note|caution,text}`; quote `{quote_text,speaker,source_reference,source_url,verified}`; analogy `{title,explanation,in_reality,image_url}`; image `{url,alt_text,caption,credit}`; gallery `{items:[image]}`; video `{provider,url,start_seconds,transcript,credit}`; audio `{url,transcript}`; download `{file_url,label}`; practice `{steps:[..]}`; table `{headers:[..],rows:[[..]]}`; timeline `{items:[{label,title,detail,lesson_id}]}`; reflection `{prompt,allow_private_note}`; quiz_ref `{quiz_id}`. Text format: blank line = paragraph, "- " bullets, **bold**, *italic*, [text](https://link). NOT yet built (next): email upgrade of a guest to a learner (needs thought: Supabase free email is rate-limited), certificates, a link from the Learn page, and the admin editor (Phase 2). Until the editor exists, course content has to be inserted by SQL/JSON import (Phase 2 deliverable).
- **Learn page redesign (28 Oct 2026, owner request; tested with a fake DB client):** `learn.html` now shows the Nectar card, then the course list (each course with lessons links to `course.html#/c/<id>`; legacy courses without modules keep their WhatsApp join button), then the Vedabase reader LAST and much taller (`max(560px, 100vh - 140px)`). The book list is a darker maroon/gold sidebar that collapses with a Books / Hide books button (choice remembered in localStorage; starts closed on phones and closes after picking a book). `site/learn.html` is now identical to the root copy (it includes the Nectar card).
- **Site-wide redesign batch (28 Oct 2026, owner request; on branch `staging`, NOT yet on `main`):** (1) page sidebar on every page (`site.js buildTocSidebar`, items from `data-toc="..."` marks): small round collapse button, no "On this page" label, dark maroon panel, phones get one small menu button. Per page: Home = Quote of the week, What to expect, Insights, Testimonials; About = Our founder, ISKCON International, Our local centre, FAQs (first 3 FAQs shown, rest behind a Show more button via `data-show-first="3"`); Events = Weekly events, Sunday program, Special events and festivals (stacked); Get Involved = Donate, Volunteer, Drop by, Talk to us (stacked); Learn = Nectar plan, Courses, Read online, plus the book list as a sidebar subsection (`.toc-sub`). (2) Home hero about half its old height (47% desktop, 67% phone), headline and hook each forced onto one line, brand font Helvetica/Arial (`--font-brand`) for the header title and hero (no descending J). (3) Quote of the week is its own casual section. (4) Merch search appears once products exist. (5) Events can have a picture (`supabase/events_image.sql` adds `events.image_url`; admin form uploads it to the `site-images` bucket). (6) Nectar page has the standard site header (`.sh` block in `nectar/index.html`; SW cache v9). (7) Admin: "Manage the Site" tabs are now a left sidebar. (8) Business card 85x55 mm: new front (founder title top-right beside the photo, Krsna mantra with diacritics, logo bottom-right, contact + socials left) and back (chosen or custom quote with lotus, mridanga and karatala line art); optional uploaded back picture; "Print A4 sheet" = 2 pages (fronts, backs), 10 cards each, 2 mm gaps, with duplex instructions; PNG export. Tested in a headless browser (A4 PDF is 2 pages x 10 cards). (9) Autofill: login (`username` / `current-password`), testimonial and message-board name/message fields now carry `autocomplete`, length limits and label links; Nectar join form already had `name`/`tel`.
- **DEPLOY CREDITS (important):** Netlify free plan = 300 credits/month, hard limit; every production deploy (each push to `main`) costs 15; branch deploys and previews cost 0; at the limit all sites pause. On 28 Oct the owner saw "over 75% used". RULE FOR AGENTS: never push to `main` casually. Work on branch `staging`; the owner previews it (Netlify > Project configuration > Build & deploy > Branches and deploy contexts > add `staging`), then say "publish" and merge ONCE. Doc-only commits to `main` must contain `[skip ci]`. Alternative to evaluate with the owner: Cloudflare Pages (free, no such credit limit); the Supabase backend is unaffected, but `netlify/functions/keepalive.mjs` would need a replacement (e.g. a free GitHub Actions cron).
- **Phase 1 (2-3 sessions): course engine learner side**, per `docs/COURSE_SYSTEM_SPEC.md` build order 1-4: RLS test by role, anonymous session + email upgrade, catalogue, course page, lesson player, block renderers (quote blocks only if verified), auto-marked quizzes graded server-side, progress. Nectar stays a separate bespoke app (the owner rejected folding it into the engine as a "scheduled reading plan"); reuse its ideas/styling only.
- **Phase 2 (3 sessions): admin/teacher side**: content editor, JSON import/export, questions inbox, lesson feedback, reviews, certificates + `/verify/<id>`. Then enter the "Introduction to ISKCON" course from the owner's content.
- **Phase 3 (2-3 sessions): public site polish**: editable contact/address/programs (§12 task 6), quotes admin tab, membership application, login show-password + forgot-password (admin-side reset preferred, free email is rate-limited), message board redesign, domain + email.
- **Phase 4 (3 sessions): registration + reminders**: calendar (.ics) and Telegram first (free); SMS only if wanted (paid).
- **Phase 5 (later, 3 sessions each, owner picks order):** Vaishnava calendar (verify first), Verse of the Day engine, cohorts/monitored courses, forum, skill courses, PWA.
- **ON HOLD:** payments/Pesapal/Till/donations until the temple gives permission. Hide anything related; do not build.

## 12B. HOSTING, SIGN-IN AND EMAIL (done 28-30 Oct 2026)

**Hosting moved from Netlify to Cloudflare (29 Oct 2026).** Cloudflare Workers (static assets), project `iskconjuja`, deploys automatically from GitHub `harekrishnaganjoni/iskconjuja` branch `main` (build command empty; deploy command `npx wrangler deploy`; root `/`). Domains `iskconjuja.co.ke` and `www.iskconjuja.co.ke`; fallback address `iskconjuja.harekrishnaganjoni.workers.dev`. Static requests are free, there is no deploy-credit limit like Netlify's. Netlify auto-builds were **stopped by the owner** (Site configuration > Build & deploy > Stop builds); never re-enable them.
- `wrangler.jsonc` = worker name `iskconjuja`, assets directory `.`, `not_found_handling: "404-page"` (serves `404.html`).
- `.assetsignore` keeps internal files off the public site: `iskcon-juja-project/`, `supabase/`, `netlify/`, `docs/`, `.github/`, `*.sql`, `*.md`, `schema.sql`, `index.ts`. If a new internal folder is added, add it there.
- `_headers` is honoured by Cloudflare. Publishing rule now: the credit limit no longer exists, so when the owner asks for a change, finish, test, merge `staging` into `main` and push without asking again ("stop asking at every step"). Never push untested work.
- Keep-alive: `.github/workflows/keepalive.yml` (GitHub Actions, daily 05:17 UTC, reads one row of `events` with the public key). It replaces `netlify/functions/keepalive.mjs` (leave that file; it is harmless). The owner's external pinger of the old Netlify `/keepalive` address can be deleted.

**Nectar address move.** `nectar/app.js` shows, on `*.netlify.app` only, a banner "Continue at iskconjuja.co.ke"; its button carries every `nectar-*` localStorage key in `#move=<json>` to `https://iskconjuja.co.ke/nectar/`, where it is imported (keys not already set only), then the hash is cleared. `nectar/sw.js` VERSION v11. New Nectar link for the group: https://iskconjuja.co.ke/nectar/.

**Sign-in upgrades (code live, switched on by the owner in Admin > Settings).** Settings keys `google_signin_enabled` and `forgot_password_enabled` (text 'true'/'false'; the buttons carry `data-show-if` and stay hidden until on). `data.js` helpers: `signInWithGoogle`, `requestPasswordReset`, `setNewPassword`, `onPasswordRecovery`. `devotees.html` has Show/Hide password, "Continue with Google", "Forgot password?" (always the same neutral confirmation, so it cannot be used to discover who has an account), and a new-password form shown on the PASSWORD_RECOVERY event. Privacy page updated.
- **Supabase Auth set-up (done by owner 30 Oct):** URL Configuration (Site URL `https://iskconjuja.co.ke`; Redirect URLs for `iskconjuja.co.ke`, `www`, and the old Netlify address); custom SMTP via **Brevo** free plan (300 emails/day; domain `iskconjuja.co.ke` authenticated with DNS records in Cloudflare; sender `noreply@iskconjuja.co.ke`; host `smtp-relay.brevo.com`, port 587); Google provider enabled with an OAuth client from Google Cloud (authorised origin `https://iskconjuja.co.ke`, redirect URI `https://zwvgfhgxegxchwlpelbk.supabase.co/auth/v1/callback`); "Allow manual linking" on (for the later "Save my progress" via Google for course guests, `linkIdentity`). **Google sign-in CONFIRMED working live by the owner (30 Oct 2026).** Google app is still in Testing status (publish under Google Auth Platform > Audience so the public can use it; the consent screen shows the Supabase address until the app is verified). Forgot-password email not yet confirmed: send a reset to an admin address and record the result here.
- Receiving mail on the domain (e.g. info@) is separate: Cloudflare Email Routing (free forwarding) is the plan; not set up yet.

**Layout batch (29-30 Oct).** Home hero height `max(340px, 59vh)`, ending where the quote section begins; the sidebar is on every page, lighter (`--side-bg`), full height from just below the hero to just above the footer, collapsible; Learn books are a sidebar subsection; merch search, event pictures (`events.image_url`, needs `events_image.sql`), Nectar has the standard site header (`.sh` in `nectar/index.html` + `nectar/style.css`), Admin "Manage the Site" is the admin sidebar, business card front/back and A4 duplex sheet. Tested with Playwright against a fake Supabase client.

**Nectar plan change (30 Oct 2026):** the group decided to watch the film Mahavatar Narsimha on Fri 30 Oct (Day 5). Day 5 is now a special "Movie day" (`kind: "special"` in `nectar/data.js`: short story of Narasimha and Prahlada from the Srimad-Bhagavatam Canto 7, five main points, a link back to Text 1, discussion questions). It replaced the Text 1 recap day so all later dates and reminders stay unchanged; Text 1 is covered by days 2-4. `nectar/sw.js` VERSION v12.

**Phase 2 started (30 Oct 2026): Course Editor.** New admin-only page `course-editor.html` (+ `course-editor.js`, `course-editor.css`), opened from Admin > Courses > "Open the Course Editor". Hash routes: `#/` course list and new course; `#/c/<id>` course settings, modules, lessons, module quizzes, final test, "Make everything live / Hide everything", warning for unverified quotes; `#/l/<id>` lesson settings and ordered blocks (forms per block type; quote blocks have a VERIFIED tick; advanced JSON boxes for gallery/table rows/timeline); `#/q/<id>` quiz settings and questions (one correct, several correct, true/false); `#/inbox` learner questions (answer, or publish as a lesson FAQ), reviews (show publicly), "was this clear?" tallies; `#/import` imports a whole course from JSON (everything created HIDDEN; summary shown first). Security is the existing `is_admin()` RLS write policies; the page also uses `auth-guard.js data-require="admin"`. Pictures are by web address only for now (no upload yet). Tested with Playwright against an in-memory fake (create course/module/lesson/blocks/quiz, reorder, refuse a question with no correct answer, import, bad-file rejection, make live).
- **Intro to ISKCON import file:** `iskcon-juja-project/courses/intro-to-iskcon.json`, built from `docs/ISKCON_Juja_Intro_Course_Modules_1-4.md` by `python3 tools/convert_course.py` (re-run after editing the doc). 4 modules, 31 lessons (30 from the doc + a timeline lesson at the start of Module 2), 115 blocks, 12 quiz questions (the correct answer comes from the doc; wrong answers come from the doc's "Not ..." notes, extended by the agent where the doc gave fewer than two). Quotes tagged as checked in the doc import as verified; the 8 tagged unchecked import as HIDDEN (list in `courses/intro-to-iskcon-notes.md`, which also holds the editor notes removed from the learner text and the media suggestions per lesson). Course defaults: public, lessons not forced in order, questions to the leader on, "was this clear?" on, reviews on, no certificate. Module 5 and the final test are not written yet.

**Public site vs Member Portal (decided 30 Oct 2026, built same night).** The public website is for visitors only: no Dashboard, My Courses, Sign Out or admin lock ever appears on it (`data.js applyRoleNav` hides them unless `window.ISKCON_IN_PORTAL`). Everything for signed-in people is the member portal: `devotees.html` (sign-in), `dashboard.html`, `my-courses.html`, `admin.html`, `course-editor.html`, and `course.html` when opened on the portal address. These pages load `portal.js` (just after `supabase-config.js`), which swaps the big site header for a slim portal header (logo = link to the PUBLIC homepage, Home, My Courses, Manage the Site for admins, Sign Out), replaces the footer, removes the chat button, and (on the portal address only) links `portal.webmanifest` and registers `portal-sw.js` so the portal can be installed as an app without the public site being part of it. Sign Out goes to the sign-in page. The sign-in page is a split layout with the **Quote of the day** (one quote per day by Nairobi date, taken in turn from the `quotes` table ordered by id; hidden if it cannot load; no fake text). A signed-in person opening the sign-in page goes straight to the dashboard (not during a password reset). Nectar, the public message board and public courses stay on the public site; private messages (Phase 3) will live in the portal.
- **The switch is ON since 31 Oct 2026** (owner added `portal.iskconjuja.co.ke` in Cloudflare; `portalLive: true`). `window.ISKCON_HOSTS` in `supabase-config.js`. While `portalLive: false` everything works on one address. To go live: (1) Cloudflare > Workers & Pages > iskconjuja > Domains > Add custom domain `portal.iskconjuja.co.ke`; (2) Supabase > Authentication > URL Configuration: add `https://portal.iskconjuja.co.ke/**` to Redirect URLs; (3) set `portalLive: true`, merge to `main`. Then: public pages' login links go to the portal; old public addresses of portal pages forward to the portal; public pages opened on the portal address forward to the public site; `/` on the portal opens the dashboard. Sign-ins are per address (separate browser storage), which is intended. Google sign-in needs no change (its callback is Supabase's). Tested with Playwright for switch off and on (hosts mapped to localhost), including the course player on both addresses.
- Icons: `images/portal-192.png`, `portal-512.png`, `portal-maskable-512.png` (logo on cream). The Vaishnava calendar (prototype zip in `docs/reference`) will be a portal feature.

**Sign-in page fit (31 Oct):** the sign-in page must never need a scroll bar: tested at 1366x648, 1280x800, 1024x640, 390x844, 360x740 with Google and forgot-password both on (`#sign-split` height = viewport minus header; compact card; forgot link sits beside the Password label; no back link because the portal logo goes to the public homepage).

### Page background patterns (31 Oct 2026)
Four devotional doodle patterns (made in NightCafe, Holy Names added on top by script so the spelling is exact) are used as the page background: ONE image per page that covers the whole screen (`background: center / cover`, fixed, no tiling). Files `images/pattern-1..4.webp` (2048px); set per page with `data-pat="N"` on `<body>`; CSS at the end of `styles.css` (fixed `body::before`, opacity .3, inverted and very faint in dark mode). The ivory/white section, header and footer backgrounds are see-through so the pattern shows like a colour; text sits in veiled boxes (`--veil`). Mapping: 1 = Home, Events; 2 = About, Participate, Nectar; 3 = Learn, courses, dashboard, admin, editor; 4 = Sign in, Message Board, Merch, Privacy, 404. Header content (logo, Maha Mantra, Prabhupada) is untouched. Quote of the week made compact (about 28% of the screen).

Welcome intro moved from Home to the top of About Us (`.intro-block`); Home keeps only the "No pressure, no pitch" statement. Section spacing cut (`.section` padding 26px, so about 2 lines between sections).

**Owner to-do still open:** run `events_image.sql` (one line: `alter table public.events add column if not exists image_url text;`); test forgot-password and Google sign-in live; announce the new Nectar link.

## 13. OPEN DECISIONS / DECISIONS MADE
**Decided 27 Oct 2026:** source of truth = this folder; keep Nectar as is (no reading-plan template idea); **message board redesign** = collapsible in-page chat popup, Public/Private toggle, **default public, guests may post publicly**, private = addressed to a selected person, visible only to the sender and that person (no one else, admins included unless they are the recipient: confirm before building the admin view); no WhatsApp button there; donations/payments on hold (no Till, no temple permission yet); no other course design docs, owner will share course content later; social: Instagram and TikTok `iskconjuja.ke`, YouTube `iskconjuja` (enter via admin settings; confirm exact URLs); admin emails to create: `iskconjuja@yahoo.com` and `harekrishnaganjoni@gmail.com`.
**Added 27 Oct 2026 (later):**
- **Message board recipient options (3):** Public (default, guests allowed) · Admin (second option) · Private to a chosen person (third; expected to be rarely used). Anyone can be messaged privately; a private message stays secret between the two parties only (no one else sees it, admins included).
- **Social links (enter via admin settings):** YouTube `https://www.youtube.com/@ISKCONJUJA` · TikTok `https://www.tiktok.com/@iskconjuja.ke` · Instagram `https://www.instagram.com/iskconjuja.ke/`.
- **Live database snapshot (owner's schema export, 27 Oct 2026):** tables present: profiles, site_settings, articles, events (no start-time column), products (with synopsis), quotes, weekly_quote, testimonials, board_messages, courses, and the five `nectar_*` tables. **`courses` has NO `visibility` column and none of the `course_*` tables exist, so the hardened `schema.sql` and `course_system_schema.sql` have NOT been run.** The export does not show policies, functions, triggers or storage, so RLS is still unverified (ask the owner to run the `pg_policies` / `pg_proc` queries in §2.3 notes).
- **Introduction to ISKCON course content received:** `docs/ISKCON_Juja_Intro_Course_Modules_1-4.md` (Modules 1-4; Module 5 and the final test still to come). Its lessons use blocks beyond the spec list: a `table` block, a `timeline` block (Module 2 intro), "example" and "link to mission" notes. Proposed (needs owner approval): add `table` and `timeline` block types and use `callout`/`text` for the rest. Quotes marked with a warning sign in that file must be entered with `verified = false` until the owner confirms them (Appendix B lists them).
- **Nectar:** `nectar/content/damodarastakam.txt` is on origin/main (Sanskrit verses plus translation, "(n)" format; the parser handles it).

**Decided 27 Oct 2026 (afternoon):** (1) All courses are **self-paced**: no fixed dates or deadlines (the spec's `sequential_unlock` toggle only controls whether lessons must be done in order). (2) **After Kartik (24 Nov 2026), Nectar of Instruction will be modified and added to the main course system as a course** (owner's decision; plan the migration then: members, progress, notes/questions and quiz results must be carried over; keep Nectar running untouched until then). (3) Keep-alive confirmed working. (4) The "Powered by Netlify" badge is Netlify's own, shown on public free-plan sites; the owner may turn it off at Netlify > Project configuration > General > "Powered by Netlify badge" (no redeploy needed). The `timeline` block type = Module 2's tappable visual list of dates in Prabhupada's life (not a schedule); awaiting the owner's yes.
**Still open:** live DB state (owner will paste SQL); reminder message wording (per program, in admin); SMS provider/account; membership application wording; what "reading progress" means for the course reader; whether to make the brand row sticky; who is the recipient picker for private messages (admins only, or any member?).

## 14. LEGAL / PRIVACY (not legal advice)
Kenya **Data Protection Act 2019** applies to processing Kenyans' personal data regardless of size; **formal ODPC registration** is mandatory only above ~KES 5M annual revenue or 10+ employees (or specific sectors) — likely not needed now, but principles (lawful basis/consent, security, data-subject rights, privacy notice) still apply. Implemented: `privacy.html` (linked in every footer), consent checkbox on the testimonial form, public-board notice, no tracking/analytics, no data sold. To do: login-token disclosure, consent + opt-out wording when reminders/registration/course sign-up are built, retention statement, a Kenyan lawyer's review. Instagram-style "legal trap" posts were assessed: only Google-Fonts-from-Google (EU IP-leak) is relevant (to-do: self-host); CAN-SPAM/COPPA/session-replay/subscriptions/DMCA are not applicable now (revisit DMCA only if public file uploads are added).

## 15. REFERENCE DATA
- **Vedabase slugs** (`https://vedabase.io/en/library/<slug>/`): bg, sb, cc, noi, kb, nod, iso, ssr, bbd, bhakti, bs, cat, josd, owk, pop, poy, pqpa, rv, sc, tlc, tlk, tqk, lob, cabh, spl, rkd, mbk; plus `transcripts`, `letters`; search `https://vedabase.io/en/search/`. Whether Vedabase permits framing is **unverified**.
- **Logo:** `site/images/juja-logo.svg` = official lotus+ISKCON SVG (viewBox changed to `0 0 516.1 557`) + one `<text x="71.55" y="523.56" text-anchor="start" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="47" letter-spacing="85" class="st0">JUJA</text>`. (X = letter height 54.9 units; `text-anchor="middle"` + letter-spacing drifts left because browsers count the trailing gap.) Favicon `images/favicon.png` (Gaura-Nitai artwork supplied by owner).
- **Prabhupada photos:** header `images/prabhupada-sitting.webp`; About `images/prabhupada-standing.webp` (halo cleaned; displayed max 363px wide).
- **Costs:** everything is free except the domain (~KES 800–1,500/yr) and, later, SMS (small) / Pesapal fees.
- **Zoho Mail free:** ≤5 users, 5 GB each, webmail/app only (no IMAP), needs your own domain.
- **Supabase free:** pauses after ~1 week idle; no automatic backups; Edge Functions + Storage included within limits.

## 16. ENVIRONMENT LIMITS (previous agent's sandbox — yours may differ)
No network in the shell (cannot `pip install`, cannot download fonts/images); separate tools `web_search`, `web_fetch` (only URLs already in the conversation), `image_search` exist. **No browser**, no Postgres, no `rsvg-convert` (cannot rasterise SVG); Python (PIL/numpy), Node and ImageMagick are present. The working folder **can be wiped between sessions** — keep deliverables in the outputs folder and treat the PROJECT zip as the source of truth. `tools/check_site.py` is your substitute for a browser; it is not one.

## 17. BUG HISTORY & LESSONS (each is now a check or a rule)
1. Upper-case `IMAGES/` paths 404 on Netlify (case-sensitive). 2. `.page-hero` referenced `ASSETS/`. 3. Fake `https://google.com` map links. 4. Footer "YouTube" link opened WhatsApp. 5. **Theme toggle "double"** = JS wrote the icon *and* a CSS `::before` did too. 6. **`var(--bg-alt)` was never defined** (silently ignored; dark mode looked wrong) — later `--card-bg` too. 7. Re-running SQL failed: no `CREATE POLICY IF NOT EXISTS`. 8. Admin list rows used `rgba(0,0,0,.02)` (darker in dark mode) → `--row-tint`. 9. Tab buttons had no `.active` style. 10. Dynamically injected WhatsApp buttons were never wired. 11. **Grid auto-placement** moved the hero hook line into column 2 — group blocks explicitly. 12. html2canvas dropped images captured before they loaded; logo is now inline SVG. 13. Public table in privacy page caused a **horizontal scroller** → wrap tables; `table{display:block;overflow-x:auto}`. 14. **`overflow-x:hidden` on body silently disabled sticky headers.** 15. **Every rebuild appended another copy of `data.js`** → 15–17 copies live. 16. Insert policies with `with check (true)` let visitors set their own `published=true`. 17. Search results/`sed` multi-range output misread as file corruption — verify before "fixing". 18. A screenshot cannot contain more detail than its source (a trimmed screenshot was a *downgrade*); fix upscaling instead (cap displayed width at native pixels).

## 18. REPLICATING FOR ANOTHER TEMPLE (or rebuilding from scratch)
1. New Supabase project (free) → run `schema.sql` → edit `site/supabase-config.js` (Project URL + publishable key; Settings → API) → create first user in Authentication → Add user (auto-confirm) → `update public.profiles set role='super_admin' where email='…';` → deploy the Edge Function.
2. Brand strings to change: header/footer templates in `tools/build_common.py` (name text, address, footer links), `<title>`/meta of each page, `privacy.html` (operator name/contacts), about/home/events text (Juja story, FAQ, programs), `site.js` contact constants, `data.js`/admin business-card defaults, logo SVG (follow §6 rule 10 with the new place name), favicon, hero photos, Prabhupada photos (global), seeds in `schema.sql` (address, social links, WhatsApp group, books, quotes), then `python3 tools/build_common.py && python3 tools/check_site.py && python3 tools/package.py`.
3. **Planned white-label feature (post-launch):** settings `site_name`, `site_short_name`, logo upload, theme colours (inject `--maroon/--gold/--band-bg/...` from settings), plus the §12 task-6 settings, plus editable text blocks for About/FAQ/home copy — so a new temple needs *no code edits*.

## 19. AGENT WORKFLOW & DELIVERY PROTOCOL
1. `unzip iskcon-juja-PROJECT.zip` → read this README → `python3 tools/check_site.py` (must say OK).
2. Work in `site/` and `supabase/`. Header/footer/script-order changes: edit `tools/build_common.py` templates, then `python3 tools/build_common.py` (run twice; second run must change nothing).
3. After every change: `python3 tools/check_site.py`. Fix errors; read warnings.
4. Never reintroduce: duplicate scripts, `overflow-x:hidden` on html/body, undefined CSS variables, upper-case/space file names, non-idempotent SQL, jargon, diacritics in the mantra, anything inside the brand row except logo/mantra/portrait.
5. Deliver: small change → send only the changed files, complete; big change → `python3 tools/package.py` and send `iskcon-juja-DEPLOY.zip` (+ SQL file if it changed). Say plainly which files changed, what the owner must click (SQL? deploy? function?), what you could **not** verify, and what you need back (screenshot, a detail).
6. Keep replies short, plain, honest; no questions about "what next"; ask only for missing details.
7. Update this README only at milestones or on request (change §11/§12/§17; keep it accurate).

---
## APPENDIX — START PROMPT (owner pastes this into a new chat with the PROJECT zip attached)
```
You are taking over a website project for ISKCON Juja (Kenya). I have attached iskcon-juja-PROJECT.zip.
1) Unzip it and read README.md completely before doing anything — it contains my standing rules (section 5), all decisions, the architecture and the task list.
2) Run: python3 tools/check_site.py  and tell me in two sentences the state of the project.
3) Then continue from section 12 (Next tasks), in order, deciding yourself what to do. Ask me only for details you cannot know.
4) I am not technical: for anything only I can do, give exact click-by-click steps. Send complete files (never snippets), say what you could not verify, and keep replies short.
What I want you to work on now: <WRITE YOUR REQUEST HERE>
```
