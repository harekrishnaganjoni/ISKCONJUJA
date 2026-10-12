# ISKCON JUJA WEBSITE: MASTER PROJECT README

**Purpose of this document:** a complete, self-contained brief. Paste it into any AI chat (with the project files attached) and the AI should be able to continue the project with the same rules, decisions, and results. Last updated: 28 Sept 2026.

---

## 1. WHO / WHAT

- **Owner:** Dan (developer/owner of the site, based in Kenya). Not always physically present at the Juja center.
- **Project:** Website for **ISKCON Juja**, a small, youth-driven ISKCON congregation in Juja, Kiambu County, Kenya.
- **Origin:** Repurposed from the owner's existing site *iskconkitengela.co.ke* (static HTML/CSS/JS, drag-and-drop deployed on Netlify). The owner likes the current UI/look and wants to keep it, while fixing bugs and making the site dynamic.
- **Audience:** Youth, students (JKUAT is nearby), families, curious first-timers. Tone: friendly, youthful, plain-spoken.

## 2. GROUND RULES (apply to ALL work, and to all future projects)

1. **Give clear, precise, explicit instructions. Assume the owner has NO prior knowledge** of anything being done (hosting, databases, terminals, etc.). Explain each step.
2. **Always deliver FULL code files. Never snippets or "change line X to Y" instructions.**
3. **Ask when there is a gap. Do not assume or do your own thing.** Confirm decisions before building.
4. **Everything must be free. If impossible, offer the cheapest viable option** and state the real cost honestly.
5. **No fake/hardcoded content presented as real.** Use honest placeholders ("To be added") rather than invented facts, numbers, dates, or claims (e.g. do not claim deity worship or specific Ekadasi dates unless confirmed).
6. **Public pages first.** The member area is deliberately deferred ("needs too much work").
7. **Follow the official ISKCON logo manual** (section 6).
8. **Every SQL change must be safe to run more than once.** Before giving the owner any `schema.sql` update, check that every `create policy` has a matching `drop policy if exists` right before it (Postgres has no `CREATE POLICY IF NOT EXISTS`), every `insert` has an `on conflict` or existence check, and every `create table`/`function` uses `if not exists` / `or replace`. This rule exists because it was violated once (1 Oct 2026) and the owner hit a real error re-running the script after it grew — now fixed and the whole file is idempotent.
9. **Never show anything on the public site that does not work yet** (dead links, fake forms, "coming soon" boxes, empty sections). Hide it until it is functional. Anything not available yet (Till number, social links, etc.) must be addable later from the admin portal, without code changes.
10. More rules will be added as the project proceeds. Keep them for future projects too.

## 3. REAL-WORLD FACTS ABOUT ISKCON JUJA

**Address (short form for footer):** `Anthusia Apartments hse GH 3, Muraya Access road, Juja`
**Full form:** Anthusia Apartments, House No. GH3, Muraya Access Road, Theta Ward (Gachororo), Juja, Kiambu County. Off the road leading toward the Sewage / Kawaki Plaza area.

**Contacts (WhatsApp preferred; also calls):**
- Primary: Tim, `254714211692` (may change, never hardcode in many places)
- Backup: Dan, `254743184998`
- Both numbers live in ONE config block at the top of `site.js` (`WHATSAPP_PRIMARY`, `WHATSAPP_SECONDARY`). Every WhatsApp button reads from it.

**Directions (three routes, shown as expandable sections):**
1. *From Thika Superhighway (from Nairobi):* Take Exit 14 or 15 into Juja Town. Head toward the Juja Flyover / Juja Stage. Don't go deep into town; take the access route toward Gachororo / Theta Ward (right side if facing Thika, behind the main market strip). Follow the branch to Muraya Access Road near Kawaki Plaza.
2. *From JKUAT Main Gate:* Head back toward the highway or use the internal link roads of the Gachororo student residential zones. Route via the Sewage Road / Gachororo axis, branching onto Muraya Access Road. Short drive/walk from campus borders.
3. *From Juja Square:* Take the main access roads to the residential estates behind the commercial hub. Ask local riders for Kawaki Plaza or Muraya Access Road, Theta Ward.
4. *Tip:* Tell a boda/taxi from Juja Stage: "Anthusia Apartments on Muraya Access Road, near Kawaki Plaza."
- A simple schematic route sketch (SVG) is shown in addition to the Google Map. Map embed query: `Anthusia Apartments Muraya Access Road Gachororo Juja Kenya`.

**Weekly rhythm (this is NOT a "Sunday Feast" site like Kitengela):**
- **Tuesday, 5:30 to 7:00 PM:** kirtan, talk/discussion (often a guest speaker from the Nairobi main temple), feast.
- **Friday, 5:30 to 7:00 PM:** kirtan, group book reading and discussion (instead of a talk), feast.
- **Sunday:** no local program. Group trips to the **main ISKCON temple in Ngara, Nairobi**, leaving Saturday evening or Sunday ~6:30 AM, returning Sunday afternoon/evening.
- **Nairobi temple Sunday schedule:** 7:45 AM class; 9:00 AM prasad; 11:00 AM kirtan; 12:30 PM aarti; 1:00 PM class; 2:00 PM prasad.
- **Juja is an apartment-based congregation, not a temple with deities.** Do not claim daily darshan, altar services, etc.

**Still unknown, use placeholders:** M-Pesa Till number, Pesapal merchant details, social media links (Facebook/Instagram), WhatsApp group invite link, real ekadasi dates.

## 4. TECH STATE: WHAT EXISTS TODAY

Static multi-page site (no backend, no database), files:

| File | Purpose |
|---|---|
| `index.html` | Home |
| `about.html` | About ISKCON, Prabhupada, Juja story, FAQ |
| `events.html` | Weekly programs + special events |
| `merch.html` | **Merchandise**: the merged Resources + Shop page (`resources.html` was deleted). Hidden from menus until `store_enabled` is on |
| `participate.html` | Get Involved: volunteer, donate, directions, contact (WhatsApp/call) |
| `devotees.html`, `dashboard.html`, `courses.html`, `my-courses.html`, `admin.html` | Member area / admin mockups. **Unlinked and hidden** until `members_enabled` is on (no real login exists yet) |
| `styles.css`, `site.js` | Shared styling and behavior |
| `images/`, `assets/` | Images (all lowercase, no spaces) |

Delivered so far: `iskcon-juja-site.zip` (rebranded from Kitengela, bugs fixed, schedule rebuilt for Juja).

### Bugs already fixed (do not reintroduce)
- Linux/Netlify is **case-sensitive**: `IMAGES/` vs `images/`, `ASSETS/` vs `assets/`. Use lowercase paths, no spaces in filenames.
- Fake map links to `https://google.com`; now real embed/link.
- Resources search/filter needed `data-resource-search`, `data-filter-pill`, `data-resource-grid`, `data-category` attributes.
- Footer "YouTube" link secretly opened WhatsApp; relabeled WhatsApp.
- "Get Involved" nav button pointed to `events.html` on some pages; must go to `participate.html`.
- Theme (dark/light) toggle appeared **twice**: one in the header and one duplicated in the mobile drawer (`.theme-switch-nav` + `.drawer-theme`). Fix: keep ONE toggle only.
- Header/footer markup differed between pages; must be identical everywhere.

## 5. THE OWNER'S CHANGE LIST (10 notes + later additions)

Status key: DONE / IN PROGRESS / TODO / BLOCKED (needs a decision).

| # | Requirement | Status |
|---|---|---|
| 1a | Use the **official ISKCON logo** with "JUJA" added per the manual; transparent background | DONE (approved, see section 6) |
| 1b | Remove "Conscious Living" from the header; **add "ISKCON JUJA" text beside the logo** | DONE |
| 2 | Fix dark/light toggle appearing double | DONE (real cause: one button, two overlapping icons from JS + CSS both drawing one; CSS icon removed) |
| 3 | Replace jargon completely with plain English (not a gloss) | DONE (kirtan&rarr;music, prasadam&rarr;feast/food/breakfast/lunch, etc. — see section 9d for the full list) |
| 4 | (Fake articles REMOVED; empty state shown; `data-articles-list` container waits for the database) Homepage "Explore True Wisdom" section: remove fake hardcoded articles; articles come from admin dashboard and a database. Fields: title, article, author, date, source (optional) | BLOCKED (needs backend decision) |
| 5 | Footer: only logo and title; short address; phone number now read from `site.js` config (not hardcoded) | DONE |
| 6 | (Static events REMOVED; empty state, container `data-events-list`) Events: "Special events" not static. Admin adds events with flexible fields (start date, duration/end date, title, guests/speakers, program schedule, explanation, more or fewer depending on event) | BLOCKED (backend) |
| 7 | Registration adds members to a WhatsApp group (invite link); automated reminders for every scheduled event (including weekly meetings) **twice: the day before, and 3 to 5 hours before**, sent by the method each person picks (SMS default, Telegram, or Calendar). Wording later | DECIDED (build in Phase 2) |
| 8 | Header and footer identical on all pages, and both share one background color distinct from the page | DONE |
| 9 | Floating always-visible contact/WhatsApp button on every page | DONE (bottom-right; a `float-stack` container is ready for the message-board button) |
| 10 | Resources + Shop: **MERGED into one page, "Merchandise"** (owner's chosen name; tagline "Support the Vision" restored). Hardcoded items removed. Products will be database-driven and admin-filled (container `data-products-list`). Payment via Pesapal | Page DONE; database + payment BLOCKED (backend, Pesapal account) |
| 10b | Member area: sub-nav with "Member Dashboard", "My Courses", "Course Catalog"; new `my-courses.html` | DONE (honest empty state; rest of member area deferred) |
| A | **Get Involved** page focused on **volunteering and donating**, **Donate section ordered before Volunteer** | DONE (Till and Pesapal boxes stay hidden until filled in, per rule 8; the old "message board"/contact form was already replaced with WhatsApp+Call buttons; the 3 step-by-step directions and route sketch were removed at the owner's request — better directions are coming) |
| B | **Community message board**, also reachable via a floating button | BLOCKED (backend) |
| C | **Mobile app**, especially for member pages | BLOCKED (see section 8) |
| D | Payments: **Shop uses Pesapal**. **Donations offer both M-Pesa Till and Pesapal**. Neither exists yet, so neither is shown; each appears automatically once its setting is filled in (`mpesa_till`, `pesapal_donate_url`) | DECIDED |
| F | **Admins are dynamic.** The developer (Dan) is the super admin and can add/remove admins; Tim is an admin | DECIDED (build in Phase 2) |
| G | **Hide everything not functional** (rule 8). Done: social links, Till, Pesapal, member login, Merchandise menu link, empty articles/special-events sections, fake forms all hidden or removed | DONE |
| E | "Join Our Next Program" buttons: WhatsApp-based registration; the person receives a message with location details | DECIDED |

**Recommendation on merging Resources + Shop:** merge into one page with clear category tabs (Free downloads / Books / Merchandise). Free items download instantly; paid items go to Pesapal checkout. Keep separate only if the catalogue grows large.

## 6. OFFICIAL LOGO SPEC (ISKCON Graphic Standards Manual)

Source files provided by owner: `Logo.zip` (svg/png/jpg/pdf) and `Original-Logo-and-Use-Guidelines-Manual.pdf`.

**Rules:** never alter, recolor, restretch, outline, or rearrange the lotus + ISKCON lettering + the ® symbol. Never put a stroke on it, place it in a container shape, or change parts to different colors. Colour is PMS 187 (CMYK 30/85/85/0); the supplied SVG uses `#B74233`. Keep clear space equal to "X" (height of the letters in ISKCON) on all sides. A descriptor (place name) is set in Helvetica Medium, ALL CAPS, wide tracking, centered under the mark.

**Approved result:** `images/juja-logo.svg`. It is the official SVG, untouched, plus one added element:
```
viewBox changed from "0 0 516.1 479.6" to "0 0 516.1 557"
<text x="71.55" y="523.56" text-anchor="start"
      font-family="Helvetica, Arial, sans-serif" font-weight="700"
      font-size="47" letter-spacing="85" class="st0">JUJA</text>
```
Measurements used: X = 54.9 units; descriptor cap-height about 0.6X; gap below bottom bar 0.8X; bars span x 71.83 to 444.33. "JUJA" is stretched by letter-spacing to span the same width as the bars. Positioned with `text-anchor="start"` because `text-anchor="middle"` plus letter-spacing shifts text left (browsers include the trailing gap). Transparent background (no background element).

**Display rules on the site:** the logo is a tall lockup (about 516 x 557). The old CSS cropped it to a 72px circle; that must NOT be used. `.brand-logo` is now `height: 86px; width: auto; object-fit: contain; border-radius: 0`. The logo already contains the words "ISKCON JUJA", so no separate text label or tagline sits beside it. Favicon should use the lotus only (too small for text).

## 7. DESIGN SYSTEM (keep as is)

Maroon/gold palette, Playfair Display (headings) + Poppins (body), CSS variables in `styles.css`, cards, split layouts, mantra ticker, accordion `<details>` FAQs, dark mode via `body.dark-mode` (saved in `localStorage` key `site-theme`). Header = mantra ticker, brand row (logo, mantra, Prabhupada portrait), nav row (links + profile icon + single theme toggle), mobile hamburger drawer. WhatsApp links: any element with `data-whatsapp="message"` becomes a `wa.me` link automatically via `site.js`.

## 8. ARCHITECTURE (FREE-FIRST). APPROVED: Netlify + Supabase

Netlify drag-and-drop alone cannot store data or log anyone in. Blog, events, shop, message board, and admin all need a real database and login. Proposed stack (verify current free-tier limits before committing; free tiers change):

| Need | Proposed free option | Notes |
|---|---|---|
| Static site hosting | Netlify (free) | Keep. Or Cloudflare Pages / GitHub Pages |
| Database + admin login + file storage | Supabase free tier (Postgres, Auth, Storage) | Free projects may pause after inactivity; needs a periodic ping |
| Server-side code (payments, sending messages) | Netlify Functions or Supabase Edge Functions | Free allowances are generous for a small group |
| Scheduled reminders | Supabase scheduled jobs (pg_cron) calling an Edge Function | Free; checks every few minutes for events starting soon. No GitHub Actions needed |
| Admin dashboard | Custom pages in the same site, protected by Supabase Auth, restricted to admin accounts | Content types: articles, events (flexible extra fields via JSON), resources, products, orders |
| Mobile app | **PWA** (installable web app, free, one codebase) | Native Play Store app costs a one-time USD 25 Google fee; only consider later |
| Payments | Pesapal API 3.0 (fee about 1.5% to 3.5% per sale, unavoidable) + free manual M-Pesa Till display | Needs the owner's Pesapal merchant account |

**Admin roles (Phase 2):** table `profiles(user_id, email, role)` with roles `super_admin` (Dan: can add/remove admins) and `admin` (Tim and others: can manage content and settings, cannot manage admins). Enforced with Supabase row-level security, not just hidden buttons. First super admin is created once by hand by the developer; after that, admins are added from the admin portal by email invitation.

**Site settings (works today in `site.js`, moves to the database in Phase 2):** a `SITE_SETTINGS` block controls what appears. Empty/false means hidden everywhere: `mpesa_till`, `pesapal_donate_url`, `facebook_url`, `instagram_url`, `youtube_url`, `whatsapp_group_invite`, `store_enabled`, `articles_enabled`, `special_events_enabled`, `members_enabled`. In Phase 2 an admin edits these on a Settings page (table `site_settings(key, value)`), no code needed.

**Database tables (draft):** `articles(title, body, author, date, source?, published)`, `events(title, start, end/duration, speakers, schedule, description, extra_fields json)`, `resources(...)`, `products(...)`, `orders(...)`, `registrations(name, phone, event_id, ...)`, `messages` (board), `profiles/admin roles`.

**WhatsApp facts (researched):**
- Silently adding people to a WhatsApp group is impossible for anyone. Workable version: on registration, the person automatically receives the group **invite link** and taps "Join".
- Automated business-initiated messages via the official Meta WhatsApp Cloud API are not free but cost cents per message (small groups: likely USD 1 to 2 per month). Needs Meta business verification and a dedicated number.
- Unofficial automation (Baileys / whatsapp-web.js) is free but violates WhatsApp's terms and risks a number ban.
- Other channels for the reminders: email (free tiers, safe, lower open rate), SMS via a Kenyan gateway such as Africa's Talking (about KES 0.5 to 1 each, reliable), Telegram bot (free but members must join Telegram).
- **The owner has NOT yet chosen a reminder channel.** Options: SMS / email / official WhatsApp API / a combination.

## 9. DECISIONS

**Decided:**
- **Stack (approved 28 Sept 2026): Netlify (pages) + Supabase (database, admin login, file storage, server functions, scheduled jobs).** Nothing else for hosting. Pesapal (payments) and an SMS gateway are separate external services and cannot be merged into these two.
- **Reminders: each person chooses their own method when registering. SMS is the default.** Options offered: SMS, Telegram, Calendar.
  - *SMS:* paid (small per-message cost, Kenyan gateway such as Africa's Talking; current pricing and any sender-ID rules to be verified before building). Default.
  - *Telegram:* free. The person taps a link that opens our Telegram bot and presses Start once (Telegram does not allow a bot to message someone first). After that the bot sends the reminders.
  - *Calendar:* free. "Add to my calendar" on every event, plus a subscribe link for the weekly Tuesday/Friday programs. Alerts (day before, 4 hours before) are set inside the calendar event. Google Calendar may ignore alerts from subscribed feeds and use the person's own defaults, so test on a real phone.
  - Reminder timing for every event (including weekly programs): the day before, and 3 to 5 hours before the start. Wording to be discussed later.
- **Payments:** Shop = Pesapal. Donations = M-Pesa Till + Pesapal. (Pesapal button shows "Coming soon" until the merchant account exists.)
- **WhatsApp group:** people cannot be added silently; they get the invite link automatically and tap Join.
- **Supabase free-tier caveat:** free projects pause after 7 days of inactivity. Keep it awake with the scheduled reminder job and normal traffic; confirm this during testing.

**Payments research (Pesapal, Kenya, checked 28 Sept 2026):** anyone can sign up for a Pesapal business account and get the keys used to build and test the integration. To go live and accept real money beyond a small limit, Pesapal requires a signed merchant agreement plus KYC documents (business registration as a company, sole proprietorship or partnership; KRA PIN; ID; bank details). Fee is per transaction (about 1.5% to 3.5%). So an unregistered group cannot go live on its own. Options to ask about: register a sole proprietorship, or ask ISKCON Nairobi whether Juja may collect through their registered account. M-Pesa Till (Buy Goods) also normally needs business registration. The owner said he "just created the account": it is unclear whether that was Pesapal or PayPal; confirm. PayPal personal accounts need only ID, phone and a card or bank account, and could serve international donors, but it was never chosen for this project.

**Still open (ask the owner; do not assume):**
0. **Page name.** Currently "Merchandise" (owner's choice). Alternatives suggested: "Store" (neutral; free downloads and paid items both fit), "Books & More", "Library & Store". Renaming is a one-word change in `build_common.py`/nav.
1. ~~Merge Resources + Shop~~ DECIDED: merged.
2. Reminder message wording.
3. Supplied later: WhatsApp group invite link, **Pesapal merchant account (confirmed: owner created a Pesapal account, not PayPal; currently in demo/sandbox mode; walked through finding the Consumer Key/Secret and told to keep them out of chat; IPN URL setup and KYC/business registration deliberately deferred until Phase 2 backend exists)**, M-Pesa Till number, social links, Telegram bot name, SMS gateway account.
4. ~~Admin accounts~~ DECIDED: dynamic; Dan super admin, Tim admin. Still need both email addresses.
5. WhatsApp group invite link — DECIDED and wired in: `https://chat.whatsapp.com/Bov3QCpBdmZ8dUt6oGfQqM`.
6. Reading-progress tracking design (what exactly counts as "progress" — book/chapter checkboxes? a last-read bookmark? percentage through a book?) — needs a decision before the members-only reading page can be built.
7. Vaishnava calendar engine — needs a dedicated pass to port + verify the astronomical math from the owner's reference project (see 9g) against a trusted source before it's safe to ship.
8. Domain name — owner is registering a `.co.ke` domain separately. Once done: (a) I give DNS records to point it at Netlify, (b) then DNS records for Zoho Mail free email.

## 9b. CURRENT STATE (28 Sept 2026)

Phase 1 is complete. The site is 11 static pages: index, about, events, resources, merch (Shop), participate (Get Involved), devotees, dashboard, courses, my-courses, admin. Every page has the identical header, footer and floating WhatsApp button. Files: `images/juja-logo.svg` (official logo + JUJA), `images/favicon.svg` (lotus only).

**Things to check when testing:** (a) In dark mode the red logo sits on a dark background; the manual allows black or PMS 187 only, so look at whether it is readable. (b) The mobile menu no longer has its own theme toggle (the header one is always visible). (c) Terms glossed only appear once per page by design.

**Everything database-driven is intentionally empty** (articles, special events, resources, shop products) until Phase 2. Nothing fake is shown.

## 9c. UPDATE (28 Sept 2026, later)

Merged Resources + Shop into `merch.html` ("Merchandise"). Removed all non-functional public items (see rule 8). Added `SITE_SETTINGS` (section 8). Public nav is now: Home, About Us, Events, (Merchandise, hidden), Get Involved. The floating WhatsApp button, uniform header/footer, and WhatsApp/call contact remain.

## 9d. UPDATE (28 Sept 2026, even later)

- **"ISKCON JUJA" text is back** next to the logo in the header (plain text, no tagline).
- **Dark/light toggle bug found and fixed for real.** It was never two buttons — it was one button showing two overlapping icons, because `site.js` wrote the icon into the button with JavaScript AND `styles.css` separately drew its own icon with a `::before` rule. Removed the CSS icon; JavaScript is now the only thing that sets the icon. Rule for future work: never style a `[data-theme-toggle]` button with `content:` in CSS.
- **Jargon fully replaced, not glossed.** kirtan &rarr; music, prasadam &rarr; feast/food (or **breakfast**/**lunch** where the schedule gives a specific mealtime), aarti &rarr; worship ceremony, seva &rarr; service, japa &rarr; chanting, ekādaśī &rarr; fasting day, mridanga/kartala &rarr; drums/hand cymbals, guru-tattva &rarr; "the spiritual teacher's role", Vedic &rarr; ancient Indian, Vaishnava &rarr; Krishna-devotion. Exceptions kept on purpose: Srila Prabhupada's name, the Hare Krishna mantra ticker itself (translating the chant would remove its point), and internal code IDs like `bhakti-sastri` that are never shown to a visitor.
- **Header and footer now share one background color** (`--band-bg`: warm cream in light mode, deep charcoal-maroon in dark mode), visibly different from the page background (`--canvas`) in between.
- **All hero sections are now about 70% of the viewport height** (`min-height: 70vh`), on every page, not just the homepage.
- **Merchandise page tagline restored:** "Support the Vision" sits above the page title again.
- **Get Involved page reordered: Donate now comes before Volunteer.** The three "step-by-step" driving directions and the schematic route sketch were removed (owner said they don't make sense) — replaced with a short "Detailed directions are coming soon" line. The owner will supply better directions next.

## 9e. UPDATE (28 Sept 2026, later still)

- **Delivery workflow changed, per owner's request:** stop re-zipping and resending the whole project for small edits. From now on, only the files that actually changed are sent, and always as complete files (never snippets/diffs), per rule 2. The zip is only rebuilt for a fresh full handoff, not for every small fix.
- **Maha-mantra text simplified.** The ticker and header mantra used Sanskrit diacritics (e.g. "Kṛṣṇa", "Rāma"). Changed to plain "Krishna" and "Rama" everywhere the mantra appears (ticker + header). This is different from the jargon replacement in 9d — the mantra itself is still shown (chanting it is the point), just spelled in plain English letters instead of with diacritics.
- **Hero sections shrunk again.** 70vh (the previous fix) was still too tall in practice, likely because it sits below an already-tall multi-row header (mantra ticker + logo/mantra/Prabhupada row + nav row). Reduced to `min-height: 50vh` with tighter padding, on both `.home-hero` and `.page-hero`, on every page. Test this and say if it needs to go smaller/larger still.
- **Floating button: confirmed decision.** The owner wants the floating button to eventually open an in-site **public message board** (visible messages, reply option, visible to other users and admins), with WhatsApp as a secondary option inside it. This needs a real database and is the same "Community Message Board" feature already listed as blocked in section 8/Open Decisions. Owner confirmed: **leave the floating button as WhatsApp-only for now; build the message board in Phase 2, then switch the button over.** No half-built, non-functional message board UI was added, per rule 8.
- **Hand-drawn directions map: added, then removed at owner's request.** The owner supplied a real hand-drawn map (roads, landmarks, arrows) and asked me to use it. I embedded the image in `participate.html` with a short text walkthrough underneath. The owner then asked to remove it entirely (not stated why — may send corrected/better directions later). **Current state: removed.** The Google Maps embed and basic address text remain. `images/directions-map.png` was deleted from the project. **Waiting on the owner to supply the directions again** before anything visual/text is added back for "how to get here".

## 9f. UPDATE (1 Oct 2026) — Phase 2 backend built

The database schema, admin console, and public-page wiring for Phase 2 now exist as real code — this is the biggest single update so far. **None of it is "live"** until the owner creates a Supabase project and pastes two values into `supabase-config.js` (see section 12 for exact steps); until then, every page quietly falls back to its old static/placeholder behavior, per rule 8. **To go live: (1)** create a free project at supabase.com, **(2)** open its SQL Editor and run all of `supabase/schema.sql`, **(3)** copy the Project URL and anon key from Settings → API into `supabase-config.js`, **(4)** deploy the one Edge Function using the Supabase CLI (steps are in that file's own comments). That's the entire go-live checklist.

**New files:**
- `supabase/schema.sql` — the entire database: admin roles (`pending`/`member`/`admin`/`super_admin`), site settings, articles, events, products, quotes (with weekly rotation), testimonials, message board, and a public image storage bucket. Run this whole file once, in the Supabase SQL Editor, after creating the project.
- `supabase/functions/admin-create-member/index.ts` — the one piece of code that must run on Supabase's servers (an Edge Function), because creating another person's login requires the secret service-role key, which must never touch the browser. Deploy instructions are in the file's own comments.
- `supabase-config.js` — the single file the owner edits with their Project URL + anon key.
- `data.js` — the shared data layer: loads site settings, renders articles/events/products/testimonials/the message board, handles login/logout, resolves the quote of the week, and swaps the header's nav between "public" and "member" mode based on who's signed in.
- `auth-guard.js` — protects `dashboard.html`, `my-courses.html` (member-only) and `admin.html` (admin-only): redirects to the login page if not signed in, or shows "awaiting approval" if signed in but still `pending`.
- `admin.js` + the rewritten `admin.html` — a real, working admin console: Settings (Till, Pesapal link, WhatsApp group invite, socials, feature toggles, **homepage hero photo upload**), People (approve pending sign-ups, promote to member/admin/super_admin), and add/publish/delete forms for Articles, Events, and Products.
- `message-board.html` — the community message board: post as yourself or Anonymous, reply to any message (nested), admin can hide (not just delete) inappropriate posts.

**Two-tier registration, as instructed:** there is no public self-signup for real member accounts anymore (removed from `devotees.html` — it's login-only now). Member accounts are created **only** by an admin from the admin panel (via the Edge Function). The message board has its own separate, much lighter "register" — just an optional display name per post; skip it and you're "Anonymous". These are intentionally different systems.

**Role-aware navigation:** every page's header now has two nav bars baked in — the normal public one, and a hidden "member" one (Dashboard / My Courses / Sign Out). `data.js` checks who's signed in and swaps between them, on every page, not just the member ones — so a signed-in member browsing any public page sees only their own navigation, and signing out returns them to the normal public homepage nav.

**Quote of the week:** works today, with zero backend — 25 supplied Bhagavad-gita/Prabhupada quotes are embedded directly in `data.js` as a fallback, deterministically rotated by ISO week number (same quote for everyone, all week, no repeats until the full set cycles). The *same* 25 quotes are also seeded into the database (`quotes` table) for Phase 2: once Supabase is connected, a Postgres function (`get_weekly_quote()`) takes over — it assigns one shared quote per calendar week (first visitor of the week triggers it, race-condition-safe), always the least-recently-used, and an admin can add more quotes or override a specific week from the admin panel query tools directly in Supabase (a dedicated override UI wasn't built — noted as a small gap below).

**Known small gaps, deliberately left for now:**
- No admin UI yet to set a specific week's *forced* quote (only the automatic rotation). Can add if wanted.
- No admin "reply as Admin" button on the message board yet (the database supports `is_admin_reply`, but only regular replies are wired in the UI so far).
- Course catalog (`courses.html`) was not moved to the database in this batch — still static text, and its enrollment buttons are still fake `alert()` mockups. Flagged to the owner directly; not yet actioned.
- Program schedule times (Tue/Fri 5:30–7PM) are still plain text repeated across 4 pages, not a `site_settings` value.

**Content changes in this batch (no backend needed, live immediately):**
- Mantra in the header simplified to plain "Krishna"/"Rama" (previously done); now also guaranteed to always be exactly 2 lines, at every screen size — reflows to its own full-width line below the logo/Prabhupada row on phones, replacing the old separate scrolling ticker (removed entirely, it's dead code now).
- Prabhupada's header photo enlarged to match the logo.
- Footer "Related Links" replaced with BBT, Prabhupada.net, ISKCON Official, Vedabase.
- Real WhatsApp group invite link wired in (`https://chat.whatsapp.com/Bov3QCpBdmZ8dUt6oGfQqM`), both as the immediate working default and as the Phase-2 database seed.
- Local "Juja story" on the About page replaced with the owner's full supplied history.
- New welcome paragraph added directly below the homepage hero.
- "Your First Visit" section now makes clear the schedule is only for structured programs — visitors can drop by any time to just relax and learn.
- Fixed a real dead link: "Bring His Story Home" pointed nowhere (its real button was correctly hidden until the shop has products, per rule 8, but the surrounding text implied a working link). Now points to BBT, which is real and live today.
- Member login icon is now always visible in the header/menu (previously hidden behind an unused "members_enabled" flag) — login itself works today; the pages behind it remain basic, as agreed, until the member area gets its own focused pass.
- Get Involved page now has a real hero photo (owner-supplied group photo).
- A genuine Friday-program photo (owner-supplied) now illustrates the "Friday: group book reading" line on the Events page, replacing the old imagined description with something real.
- Floating button is no longer WhatsApp-only: tapping it now opens a small menu with "Community Message Board" and "Chat on WhatsApp", per the owner's decision once Phase 2 existed to build it into.

## 9g. UPDATE (1 Oct 2026) — real-world test, nav fixed, more content wired up

The owner created the Supabase project, ran the schema, created their own login, and confirmed it works end-to-end (screenshot showed a successful sign-in and the role-aware nav correctly switching to member mode). That's the whole Phase 2 foundation validated for real.

**Bugs found from that real test, now fixed:**
- **Duplicate nav bars.** There were two separate "member mode" nav systems stacked on screen at once (the header's own + a leftover per-page sub-nav bar). The sub-nav is now removed entirely; there is exactly one nav bar, built into the header, on every page.
- **"Admin Panel" link was backwards.** It only appeared once you were already *on* `admin.html` (useless). Fixed: a lock icon now sits in the header's top-right, next to the theme toggle, and — new — it **only appears for admins/super-admins**, never for plain members. Same spot also now has Sign Out.
- Nav wording: "Member Dashboard" → "Dashboard", per the owner's preference.

**Dashboard reworked:**
- Removed the "This Week's Community Update" section (just placeholder photo boxes, nothing real behind it) and the "Program Shift Sign-Ups" section (fake "Register" buttons that didn't save anything).
- Added a real **Verse of the Day** section at the top of the page instead. This is genuinely functional today, not a stub: it reuses the same 25-quote pool as the homepage's "Quote of the Week", rotated *daily* instead of weekly with a different seed, so the two don't show identical content. A more sophisticated, purpose-built verse engine is a separate future project (see below) — this is a solid working version in the meantime.
- Vaishnava Calendar card kept as-is (already honest — "date to be confirmed", nothing fake).

**Course catalog is now real, not hardcoded:** same treatment as articles/events/products. `courses.html` now reads from a new `courses` table (title, description, schedule, a configurable button) with an honest empty state until an admin adds one. The old fake "Enrollment submitted!" pop-ups are gone. Admin panel has a new **Courses** tab to add them.

**Favicon replaced** with the owner-supplied Gaura-Nitai artwork across every page (was a plain lotus cutout before).

**Preliminary book catalog (19 titles, owner-supplied PDF) seeded into the database** — see the new block at the bottom of `supabase/schema.sql`, safe to run even if run twice (checks for existing titles first, won't duplicate). No cover photos yet: **I deliberately did not hotlink images found via a general image search** — fragile (links break), and the rights situation for third-party bookstore photos is unclear. Instead, the admin panel's Merchandise tab now has a real photo-upload field (same pattern as the homepage photo), so real cover photos (the owner's own, or BBT's official ones if rights allow) can be attached reliably whenever they're ready.

**Vedabase reading embedded** on the Merchandise/Resources page (public, free, no login needed) — an iframe loading vedabase.io directly, with a plain "open in new tab" link underneath in case the embed is blocked (I cannot verify from this environment whether vedabase.io allows being framed — the owner should check this renders correctly once live). A separate **members-only page with reading-progress tracking** was requested too — intentionally not built yet, it needs a real design decision first (see Open Decisions).

**Vaishnava calendar engine — owner supplied a reference project.** Reviewed it: genuinely solid approach (real Julian Day / tithi astronomical math, a proper Gaurabda masa/paksha system, an Ekadashi name lookup table), not something to dismiss. But it's a separate Node.js/SQLite app, not built for this project's stack, and its content arrays are just 2-3 sample entries — a prototype, not finished data. The calculation approach is portable into a Supabase Edge Function later. **Deliberately not ported yet** — getting a religious calendar's dates wrong is worse than the honest placeholder currently shown, and the math needs to be verified against a trusted source before shipping, which requires a dedicated pass, not a rushed one folded into an unrelated batch of changes.

**Custom domain + email — guidance given, action pending on the owner's side.** Owner does not have a custom domain yet (site is Netlify-subdomain only so far). Confirmed current, real options: a `.co.ke` domain costs roughly KES 800–1,500/year (~$6–12) via any KENIC-accredited registrar (e.g. Truehost, Hostiko), no Kenyan citizenship or business registration required, M-Pesa accepted. Once a domain exists, **Zoho Mail's free plan** gives real `you@yourdomain.com` addresses (up to 5, 5GB each, forever free, webmail/app only — no IMAP) to use for the admin and for creating official social media accounts. Owner is registering the domain separately; DNS instructions (pointing the domain at Netlify, then at Zoho Mail) are ready to give once that's done.

## 9h. UPDATE (2 Oct 2026) — real bugs found from owner's second test pass

**The schema re-run error is fixed.** Root cause: Postgres has no `CREATE POLICY IF NOT EXISTS`, so re-running `schema.sql` after it had grown hit a duplicate-policy error. Added a matching `drop policy if exists` before all 27 policies (including the 3 storage ones, which used a different table-name pattern and got missed in a first pass). The whole file is now safe to run as many times as needed — see the new standing rule in section 2.

**Real bug: the admin/member pages were silently using an undefined CSS variable.** `var(--bg-alt, #FFFDF6)` was used as the background on `admin.html`, `dashboard.html`, `devotees.html`, and `courses.html` — but `--bg-alt` was never actually defined anywhere in `styles.css`. It was silently falling back to a hardcoded light cream color on every single page view, in both light AND dark mode. This is almost certainly most of what the owner saw as "the admin portal isn't styled properly." Fixed: all four files now use the properly theme-aware `--canvas` variable instead.

**Real bug: list rows in the admin panel and message board used `rgba(0,0,0,0.02)`** as a subtle background tint — correct direction in light mode, backwards in dark mode (adding black on top of an already-dark background makes it harder to see, not easier). Replaced with a new `--row-tint` variable that's defined oppositely for each theme (3% black in light mode, 6% white in dark mode).

**Real bug: admin tab buttons had no active-state styling at all** — the JS was correctly toggling an `.active` class, but no CSS ever reacted to it, so every tab looked identical regardless of which was selected. Fixed with dedicated `.admin-tab-btn.active` styling.

**Real bug: the Dashboard/My Courses nav links never got "active page" highlighting.** This was lost when the duplicate member-subnav was removed in the previous batch — the old subnav had this logic, the new unified header nav didn't get it added. Fixed.

**Dark mode card contrast improved:** `--card` in dark mode was only barely lighter than the page background (#261b20 vs #1a1215 — a very subtle difference). Bumped to `#3a2a32` for a clearly visible card-vs-background distinction, per the owner's direct feedback.

**About page significantly shortened**, per the owner calling two sections "redundant": removed the self-referential "Discover ISKCON in East Africa → Read the Juja Story" ribbon (linked to content already further down the same page), removed the entire "global ISKCON pillars" 3-card grid (Education/Sustainable/Humanitarian — overlapped with the local Music/Talks/Feasts cards elsewhere on the page) along with two filler paragraphs around it, and removed the duplicate Google Maps embed (the real one lives on the Get Involved page; having it twice served no purpose). The long 6-paragraph local history is now collapsed behind a "Read More" toggle after the first two paragraphs. Confirmed the FAQ accordions were already working correctly (native collapse/expand, nothing to fix there).

**Visual polish, directly requested:**
- Quote of the Week (homepage) and Verse of the Day (dashboard) now share a bold, high-contrast maroon-gradient-with-gold-border treatment — designed to stand out and draw the eye, rather than blending in as a plain card.
- Homepage welcome section (the three paragraphs below the hero) redesigned with a tinted background band, a larger serif "lede" first line, and the closing line set off in a bordered callout — replacing the previous plain stacked paragraphs.
- Merchandise page hero now uses the owner's real bookshelf photo instead of the generic placeholder background.

## 9i. Quick log (2 Oct 2026, continued) — kept brief, per owner's request to stop over-expanding this file

- Removed redundant local pillars section from About (owner flagged as duplicate with earlier trims).
- Admin: products now have a Synopsis field (shown behind a "Read Synopsis" toggle in the shop) and admin can now **Edit** existing items, not just add/delete/publish-toggle (was a real gap — fixed project-wide in the shared `wireTable()` helper, so articles/events/products/courses all got Edit at once).
- Real bug fixed: WhatsApp buttons added dynamically (on products, courses) after page load never had their links wired up — `site.js` only ran that wiring once, at page load. Fixed with a reusable `wireWhatsAppLinks()` + a `iskcon:rerender-whatsapp` event data.js now fires after each dynamic render.
- Merchandise page now tells visitors every book is also free to read at the centre.
- My Courses hero: owner's real Bhagavad-gita cover photo + a verified Prabhupada quote ("If you want to know me, read my books" — confirmed via search, not invented).
- New: **Privacy Policy page** (`privacy.html`), linked in the footer on every page. Consent checkboxes added to the testimonial form and a privacy note on the message board. Based on real research into Kenya's Data Protection Act (2019) — registration with the ODPC is likely not mandatory at this org's size (threshold: KES 5M+ revenue or 10+ employees), but the Act's core principles apply regardless of size. Not legal advice — recommend a real lawyer or the ODPC's self-assessment tool review this before relying on it, especially as the course system goes live and starts collecting a lot more personal data.
- New: **Admin → Business Card generator** — live preview + PNG download, pulls the real address/phone/logo, QR code links to the site, shows the M-Pesa Till if one is set. Uses two small CDN libraries (QRCode.js, html2canvas), admin page only.
- New: **`supabase/course_system_schema.sql`** — Phase 1 (schema + security only) of the full course/LMS system from the owner's `COURSE_SYSTEM_README.md` spec. Extends the existing `courses` table rather than replacing it. Learner-facing pages, the quiz engine, and the admin content editor are later phases — building those on top of an unverified security model would be worse than not building them yet.

## 10. IMPLEMENTATION PLAN

**Phase 1: Front-end fixes (no backend needed): COMPLETE**
1. Save approved logo to `images/juja-logo.svg`; build a lotus-only favicon.
2. Fix `.brand-logo` CSS (done) and footer logo sizing.
3. Build ONE canonical header and ONE canonical footer; apply identically to every page (active nav link set per page; "Get Involved" always to `participate.html`; single theme toggle; no tagline; footer = logo + title + short address).
4. Add the floating WhatsApp/contact button to every page.
5. Add plain-English translations beside jargon on every page.
6. Rework Get Involved: volunteering and donation CTAs (donation shows Till + Pesapal).
7. Member area: sub-nav with "Member Dashboard" and "My Courses"; create `my-courses.html` (honest empty state, no fake enrolments).
8. Remove the hardcoded fake articles, special events, resources and products (leave clear, honest empty states until the backend exists).

**Phase 2: Backend (after decisions in section 9)**
1. Create the Supabase project, tables, and row-level security (public read of published content; admin-only writes).
2. Admin login and dashboard: forms to add/edit/delete articles, events (flexible fields), resources, products.
3. Public pages read from the database (homepage articles, events, merged resources/shop).
4. Registration form: saves to the database, sends the WhatsApp invite link and event location message.
5. Reminder scheduler: day before and 3 to 5 hours before each event, including recurring Tuesday/Friday programs.
6. Pesapal checkout for shop; Pesapal + Till for donations.
7. Community message board with moderation, plus floating button.
8. PWA: manifest, service worker, installable member area.

**Phase 3: Member area** (login, dashboard, courses, progress), only after the public site is solid.

## 11. TESTING LOCALLY (owner has no technical background)

1. Unzip the project folder.
2. Easiest: install VS Code, add the "Live Server" extension, right-click `index.html`, "Open with Live Server".
3. Alternative: install Python, open a terminal in the folder, run `python -m http.server 8000`, open `http://localhost:8000`.
4. Do NOT rely on double-clicking `index.html`: some scripts behave differently from `file://`.
5. Deploy: drag the folder into Netlify Deploys (static parts). Dynamic parts need the Phase 2 setup.

## 12. HOW TO USE THIS README WITH ANOTHER AI

Paste this file plus the project files (and `Logo.zip` + the logo manual PDF), then say: *"Follow the ground rules in section 2. Continue at the next TODO in section 5. Ask me about any open decision in section 9 before building."*
"# ISKCONJUJA" 
"# ISKCONJUJA" 
