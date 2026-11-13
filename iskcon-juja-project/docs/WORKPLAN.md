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
| R3 | Owner reviews the preview and lists changes | WAITING-OWNER |
| R4 | Retire the old Events, Get Involved and Message Board pages (redirect to home sections); mirror the redesign into `iskcon-juja-project/site/`; update README | TODO (after R3) |
| R5 | Test, then merge `redesign` into `main` and push | TODO (needs owner "go") |

## P2: Quotes
| # | Item | Status |
|---|------|--------|
| Q1 | Gita ch 1-3 approved (201), Gita ch 4-18 drafts (401), small-book drafts (475), Prabhupada letters/lectures "said today" (live, members). Owner reviews drafts in Admin > Quotes | WAITING-OWNER |
| Q2 | Big books: all 15 files received (CC Adi, Madhya, Antya; SB cantos 1-12). Extract candidates, vet in rounds, exact-text check, produce draft files in the same paste format | DOING (extraction first) |
| Q3 | Pool everything (Gita, small books, letters/lectures, SB, CC), pick the cream: about 1,830 public quotes (5 years of daily quotes), repetition allowed | TODO (after Q2) |
| Q4 | Weekday themes: tag each chosen quote with a theme (one theme per weekday) and add the public "Quote of the Day" rotation (needs one new SQL file, tested) | TODO (after Q3) |
| Q5 | Second-round small-book candidates (about 3,600 held back) | BACKLOG |

## P3: Book site (separate repo)
| # | Item | Status |
|---|------|--------|
| B0 | Permission: the books are BBT copyright. Get written permission from the BBT before the site is public. Until then it stays private | WAITING-OWNER |
| B1 | Decide hosting (free options: GitHub Pages / Cloudflare), structure, search | TODO |
| B2 | Repo skeleton: converter (text files to reader pages), search, reading view; private | TODO |
| B3 | Load the books; link from the Learn more page (replacing the Vedabase link only after B0) | TODO |

## P4: Backlog (owner may reorder)
- 6 Vaishnava lunar days with no "said today" quote: (masa.tithi) 1.11, 5.2, 12.5, 12.14, 12.20, 12.27.
- Nectar of Instruction into the course system (after 24 Nov).
- SEO checklist (README "REMINDER: SEO").
- Older items: README sections 12 and 12A (still valid unless listed above).
