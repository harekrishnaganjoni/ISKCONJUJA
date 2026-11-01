"""Builds supabase/vaishnava_days.sql: Ekadashi fasting days for Juja/Nairobi (calculated, not copied).
Run from the repo root:  python3 iskcon-juja-project/tools/build_vaishnava_sql.py
Method: Meeus moon/sun positions (checked against known new/full moons, within 2 minutes), tithi at sunrise,
Vaishnava rule: Ekadashi at sunrise and Dashami not touching arunodaya (96 min before sunrise); otherwise the
Dvadashi day; Ekadashi at two sunrises -> the second day. Days whose cut-off is within 45 minutes are marked
"to be confirmed". Festival days are NOT calculated: the admin adds those from the Nairobi temple's calendar."""
import sys, os, datetime as dt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ekadashi import *
NB = (-1.2921, 36.8219); EAT = dt.timedelta(hours=3)
START, END = dt.date(2026, 11, 1), dt.date(2027, 12, 31)
NAMES = ["Rama","Utthana","Utpanna","Mokshada","Saphala","Putrada","Shat Tila","Bhaimi","Vijaya","Amalaki","Papamochani","Kamada",
         "Varuthini","Mohini","Apara","Pandava Nirjala","Yogini","Sayana","Kamika","Pavitropana","Annada","Parshva","Indira","Pashankusha"]
def cross(el, near):
    lo, hi = near-1.5, near+1.5
    f = lambda j: ((elong(j)-el+180) % 360)-180
    for _ in range(50):
        mid = (lo+hi)/2
        if f(lo)*f(mid) <= 0: hi = mid
        else: lo = mid
    return (lo+hi)/2
rows = ekadashis(START, END, *NB)
assert len(rows) in (29, 30), len(rows)
out = []
for i, (d, why) in enumerate(rows):
    info = day_info(d, *NB); jd = jd_from(info['sr'])
    ek = None
    for el in (120, 300):
        t = cross(el, jd)
        if abs(t-jd) < 1.6: ek = (el, t)
    el, st = ek; en = cross(el+12, st+1.0)
    close = False   # does a tithi boundary fall within 45 min of a cut-off that decides the day?
    for k in (-1, 0, 1):
        di = day_info(d+dt.timedelta(days=k), *NB)
        sr, aru = jd_from(di['sr']), jd_from(di['sr']-dt.timedelta(minutes=96))
        if abs(st-sr)*1440 < 45 or abs(st-aru)*1440 < 45 or abs(en-sr)*1440 < 45: close = True
    nxt = day_info(d+dt.timedelta(days=1), *NB)['sr']+EAT
    name = NAMES[(i+0) % 24]
    note = "Fast today. Break the fast tomorrow morning after sunrise (about %s)." % nxt.strftime("%-I:%M %p")
    if "Viddha" in why: note = "Fast on this Dvadashi day (Ekadashi was touched by Dashami at dawn). Break the fast tomorrow after sunrise (about %s)." % nxt.strftime("%-I:%M %p")
    out.append((d, name + " Ekadashi", note, close))
q = lambda s: "'" + s.replace("'", "''") + "'"
sql = """-- ============================================================
-- ISKCON JUJA: Vaishnava calendar (run once in the Supabase SQL Editor; safe to re-run)
-- Ekadashi fasting days for Juja/Nairobi, 2026-2027, calculated from the moon and sun positions
-- (see iskcon-juja-project/tools/build_vaishnava_sql.py). Festival days are added by the admin.
-- ============================================================
create table if not exists public.vaishnava_days (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  title text not null,
  kind text not null default 'ekadashi',        -- ekadashi / festival / other
  note text,
  to_confirm boolean not null default false,    -- shows "date to be confirmed with the temple"
  published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint vaishnava_kind check (kind in ('ekadashi','festival','other')),
  constraint vaishnava_len check (char_length(title) between 1 and 120 and coalesce(char_length(note),0) <= 400),
  unique (day, title)
);
alter table public.vaishnava_days enable row level security;
drop policy if exists "vaishnava public read" on public.vaishnava_days;
create policy "vaishnava public read" on public.vaishnava_days for select using (published or public.is_admin());
drop policy if exists "vaishnava admin write" on public.vaishnava_days;
create policy "vaishnava admin write" on public.vaishnava_days for all using (public.is_admin()) with check (public.is_admin());

insert into public.vaishnava_days (day, title, kind, note, to_confirm) values
""" + ",\n".join("(%s, %s, 'ekadashi', %s, %s)" % (q(d.isoformat()), q(t), q(n), "true" if c else "false") for d, t, n, c in out) + """
on conflict (day, title) do nothing;
"""
open("supabase/vaishnava_days.sql", "w").write(sql)
for d, t, n, c in out: print(d, d.strftime("%a"), t, "TO CONFIRM" if c else "")
