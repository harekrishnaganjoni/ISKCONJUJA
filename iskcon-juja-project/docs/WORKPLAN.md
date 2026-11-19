# WORKPLAN: the live queue (started 13 Nov 2026)

**This file is the single list of what is being worked on, in order.** The agent follows it from top to bottom.
Rules agreed with the owner (13 Nov 2026):
1. If the owner asks a question, answer it first, then carry on with the queue.
2. The order only changes when the owner adds new work. New work is slotted in by priority, not necessarily at the top.
3. Priority comes first; inside the same priority the easy items go first.
4. Nothing goes live on the main site without the owner's go-ahead. Everything is tested first.
5. Status is updated here after every item (status: TODO / DOING / DONE / WAITING-OWNER).

## P0: Nectar of Instruction (until the end of Kartik, 24 Nov 2026)
Any Nectar problem reported by the owner jumps the queue. No open Nectar problem is known on 13 Nov.

## P1: Website redesign (preview only, branch `redesign`, live site untouched)
| # | Item | Status |
|---|------|--------|
| R1 | Home, About, Learn more, nav, action panel, events carousel, Get involved, background (see README "Redesign preview") | DONE (13 Nov) |
| R2 | Photos shown whole (Prabhupada, Juja), Merchandise in menu | DONE (13 Nov) |
| R3 | Owner reviews the preview | DONE (16 Nov, approved) |
| R4 | Retire the old Events, Get Involved and Message Board pages (small redirect stubs to the home sections); mirror into `iskcon-juja-project/site/`; README | DONE (16 Nov) |
| R5 | Test, then merge `redesign` into `main` and push | DONE (16 Nov, live) |

## P2: Quotes
| # | Item | Status |
|---|------|--------|
| Q1 | Gita ch 1-3 approved (201), Gita ch 4-18 drafts (401), small-book drafts (475), Prabhupada letters/lectures "said today" (live, members). Owner reviews drafts in Admin > Quotes | WAITING-OWNER |
| Q2 | Big books: all 15 files received (CC Adi, Madhya, Antya; SB cantos 1-12). Extract candidates, vet in rounds, exact-text check, produce draft files in the same paste format | DONE round 1 (16 Nov): 75,070 passages found, best 6,282 reviewed, 1,371 kept as drafts (364 public, 1,007 members) in `big-books-draft.txt`. Owner pastes into Admin > Quotes > Import | 
| Q2b | Compile everything into one master file (4,813 quotes) + reset SQL 27/28 + chunked import (admin.js) so the owner can wipe the old quotes and load the complete set | DONE (16 Nov); WAITING-OWNER to run 27 and paste the file |
| Q2c | 17 Nov: quote cloud on hero, Sunday card edits, image-link option | DONE |
| Q3 | Weekday-theme sorting of the 2,001 public candidates | DONE (18 Nov): 1,365 kept with a theme (Sun 160, Mon 205, Tue 245, Wed 237, Thu 234, Fri 87, Sat 197), 636 set aside as drafts. 899 of the kept are live public, 466 are still drafts until the owner approves them. Friday (chanting and company) is thin because the public pool has few such quotes; more are in the members pool |
| Q4 | Public "Quote of the day": `theme` column, import accepts `theme=N`, `get_daily_quote()`, home card shows it (falls back to the weekly quote), file `all-quotes-master-v2.txt` | DONE in code, tested (SQL 29/30 pass). WAITING-OWNER: run 27, then 29, then paste the v2 file (Admin > Quotes > Import), then approve drafts |
| Q5 | Second-round small-book candidates (about 3,600 held back) | BACKLOG |

## P2b: Streamline the member portal and admin portal (after quotes; owner's order of 16 Nov)
| # | Item | Status |
|---|------|--------|
| M1 | Audit every member page and admin tab: list what is used, what is clutter; owner approves the slimmed list | DONE 18 Nov, see docs/PORTAL-AUDIT.md. WAITING-OWNER to approve the list |
| M2 | Build the slimmed member portal and admin portal; test; merge. REMIND OWNER: quotes should be uploadable as a text file (no pasting) | TODO |

## P3: Book site (separate repo; "everything a devotee needs in one place")
| # | Item | Status |
|---|------|--------|
| B0 | Permission: the books are BBT copyright. Get written permission from the BBT before the site is public. Until then it stays private | WAITING-OWNER |
| B1a | Scope (owner, 16 Nov): books; songs, bhajans, mantras and prayers (one section: lyrics, transliteration, translation); daily quote. NOT now: japa counter (the Vaishnava calendar already exists and will be fine-tuned), Sanskrit glossary. Later, slowly: prasadam recipes | TODO |
| B1 | Decide hosting (free options: GitHub Pages / Cloudflare), structure, search | TODO |
| B2 | Repo skeleton: converter (text files to reader pages), search, reading view; private | TODO |
| B3 | Load the books; link from the Learn more page (replacing the Vedabase link only after B0) | TODO |

## P4: Backlog (owner may reorder)
- Events (owner, 18 Nov): when working on the calendar, (1) remove special events automatically once their time has passed; (2) mark events that recur every year so they are reposted automatically each year; the admin sees them about a week before to confirm.
- 6 Vaishnava lunar days with no "said today" quote: (masa.tithi) 1.11, 5.2, 12.5, 12.14, 12.20, 12.27.
- Nectar of Instruction into the course system (after 24 Nov).
- SEO checklist (README "REMINDER: SEO").
- Older items: README sections 12 and 12A (still valid unless listed above).

## REMINDER (owner, 19 Nov): Business card
Remind the owner about the Business card (Admin > Shop & site) when we get to it. Not started.

## DONE 19 Nov: About me questions editable in Admin (People > About me questions). Owner must run SQL file 31 once.
