## 0. NON-NEGOTIABLE OWNER RULES (read first, apply to everything)

- **ALL ISKCON DOCUMENTS MUST HAVE THE FULL NAME AND TITLE OF HDG SRILA A.C. BHAKTIVEDANTA SWAMI PRABHUPADA AS THE FOUNDER-ACHARYA** ("ISKCON Founder-Acharya, His Divine Grace A.C. Bhaktivedanta Swami Prabhupada"). This covers business cards, fliers, pamphlets, posters, and any printed or shareable page we make. **His likeness must be larger and more prominent than any other person's likeness** on the same document. His title is right-aligned next to his picture (it points to him).
- Any file the owner is asked to run or use must be attached **in the same chat message**, never only mentioned or stored in the project.
- The owner does not want coloured backgrounds printed: printable designs default to an ink-saving (light background) version.
- Work in the order of docs/WORKPLAN.md, easy items first; answer questions first.
- **Always read this WORKPLAN (and the README) before answering any status or "what is pending" question. An answer given without reading it is not valid.**
- **Do not keep asking about past things.** If the owner has not answered, assume it is done (SQL files run, approvals done, etc.).
- Public contact details on the website stay exactly as they are (owner, 21 Nov 2026).
- Owner will not discuss: BBT permission, peacock-feather image, quote-image approvals. Do not raise them again.


---

## CURRENT GOAL (owner, 21 Nov 2026): LAUNCH TO MEMBERS
Finish the STRUCTURE first; fill in details slowly afterwards. Nothing unfinished may be visible to members (README rule 9).

### A. Launch checklist (structure)
| # | Item | State |
|---|---|---|
| 1 | Public site + members portal live on iskconjuja.co.ke / portal.iskconjuja.co.ke, full width, bigger header mantra | DONE |
| 2 | Sign-up, name + onboarding questions first, admin approval, member sign-in | DONE (gate tested) |
| 3 | Member pages: dashboard, my courses, course catalogue/learn, calendar, events, profile, devotees | BUILT; owner to walk through once as a brand-new member before inviting people |
| 4 | Admin: overview, people, content, events, courses, cards, fliers, pamphlets, settings | DONE |
| 5 | Calendar (Gaurabda dates, ekadashi + break-fast, per-event repeat) | DONE |
| 6 | Event reminders to members. Owner (21 Nov): do BEFORE launch; each member chooses their own. | BUILT, needs owner set-up: SQL 35, keys in admin Settings, 2 secrets in Cloudflare (see docs/REMINDERS-SETUP.txt). Phone push only (free). SMS/Telegram not built. |
| 7 | WhatsApp group invite link set in admin Settings and shown after registration | CHECK in Settings |
| 8 | Installable phone app (PWA) | BUILT; check install prompt on a real phone |
| 9 | SEO basics (page titles, descriptions, sitemap) | TODO, short checklist, easy |
| 10 | Remove anything dead or "coming soon" visible to members | CHECK as part of the walkthrough |

### B. After launch, slowly (details)
- Quotes for the Vaishnava lunar days that have no "said today" quote: use quotes that fit that calendar day (owner, 21 Nov).
- Nectar of Instruction into the course system after 24 Nov. Cover: DESIGN OUR OWN original cover (owner, 21 Nov). Do NOT reuse the BBT painting from the photo he sent.
- Book site (songs, bhajans, mantras, prayers, daily quote): later, with the owner ("we'll work on it").
- Owner's own flier and pamphlet designs: owner will send "later".
- Business-card front/back already done.

### C. Phone notifications (VAPID web push) - BUILT 21 Nov, before launch (owner)
worker/index.js (Cloudflare cron every 15 min, no dependencies; RFC 8291 test vector verified), worker/push.js, reminders.js (profile), portal-sw.js (push), admin Settings > Phone reminders (key maker + "last ran" line), supabase/35. Members choose: events/programs (evening before, N hours before), fasts (evening before + break-fast time), festivals (eve/morning), own dates (eve/day). Free Cloudflare plan: 35 phone sends per 15 min run, rest go in the next run. Ask before adding SMS or Telegram.

### D. Friday theme top-up
Owner asked "?" (did not understand the item). Explain it simply in the next reply and ask whether he wants it.

---




## Calendar housekeeping (19 Nov 2026) - DONE (needs SQL 33 and 34)
- Past one-off events disappear from the site by themselves (they stay in admin, tagged "past").
- "Repeats every year" tick on events: the event moves to its next date automatically; the admin Overview shows a reminder 7 days before. Festivals that follow the moon (e.g. Gaura Purnima) still need their date updated each year (the reminder says so).
- Needs SQL 33 (events-repeat-yearly) run once.
- Doodle watermark now behind member and admin pages; thin maroon lines removed.

- Owner rules added 20 Nov 2026: ask before important changes; plain spellings on public things; events follow the Gaurabda calendar; message board removed. Owner chose per-event repeat (none / Gaurabda date / same ordinary date): BUILT, needs SQL 33. Message board data deletion needs SQL 34 (owner chose delete).

## 20 Nov 2026 - owner requests done
- Break-the-fast times listed with ekadashi (calendar list, digests, phone-calendar file).
- Header/admin use the full screen width; flier and pamphlet previews sit beside their settings with a zoom slider.
- New sign-ins (e.g. Google) must give their name and answer the onboarding questions first (register.html?finish=1) while pending approval.
- Casual flier/pamphlet designs removed (owner will design his own and send them).
- Business card: list of phone numbers, each with its own name (removing a number removes its name); one small picture on the back; quote biggest, then mantra, citation smallest.
- Prabhupada's title is fine print on fliers and pamphlets (photo stays large).
