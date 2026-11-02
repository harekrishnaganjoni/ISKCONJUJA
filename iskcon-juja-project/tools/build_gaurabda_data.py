"""Exports the GCAL (gaurabda) calendar for Nairobi into compact JSON files the member app stores offline.
Run from the repo root:  python3 iskcon-juja-project/tools/build_gaurabda_data.py [firstYear lastYear]
Writes calendar-data/names.json and calendar-data/y<YEAR>.json (also mirrored into iskcon-juja-project/site/calendar-data/).
Engine: iskcon-juja-project/tools/gaurabda_engine (MIT, gopa810). Nothing here is calculated by hand."""
import sys, os, json, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
if os.environ.get("GAURABDA_ENGINE") != "pip":      # default: the vendored copy; the weekly check uses the newest pip release
    sys.path.insert(0, os.path.join(HERE, "gaurabda_engine"))
import gaurabda as gcal
from gaurabda import GCStrings, GCDisplaySettings
from gaurabda.GCEnums.FastType import FAST_NULL, FAST_EKADASI
FIRST = int(sys.argv[1]) if len(sys.argv) > 2 else 1900
LAST = int(sys.argv[2]) if len(sys.argv) > 2 else 2070
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.environ.get("GAURABDA_OUT") or os.path.join(ROOT, "calendar-data")
os.makedirs(OUT, exist_ok=True)
loc = gcal.FindLocation(city="Nairobi")
def mins(t):   # GCTime -> minutes after midnight (truncated like GCAL prints it); -1 = none
    return -1 if t.hour < 0 else t.hour*60 + t.min
def ptime(h):  # hours float -> minutes (truncated like GCAL's own output)
    return int(h)*60 + int((h - int(h))*60)
names = {
  "tithi": [GCStrings.GetTithiName(i) for i in range(30)],
  "masa": [GCStrings.GetMasaName(i) for i in range(13)],
  "naksatra": [GCStrings.GetNaksatraName(i) for i in range(27)],
  "yoga": [GCStrings.GetYogaName(i) for i in range(27)],
  "paksa": [GCStrings.GetPaksaName(0), GCStrings.GetPaksaName(1)],
}
json.dump(names, open(os.path.join(OUT, "names.json"), "w"), ensure_ascii=False, separators=(",", ":"))
# every event text goes into one shared list; days store indexes
texts, tindex = [], {}
def tid(t):
    if t not in tindex: tindex[t] = len(texts); texts.append(t)
    return tindex[t]
def show(ev):
    if "disp" not in ev: return True
    d = int(ev["disp"]); return d == -1 or GCDisplaySettings.getValue(d)
for year in range(FIRST, LAST + 1):
    n = 366 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 365
    tc = gcal.TCalendar(); tc.CalculateCalendar(loc, gcal.GCGregorianDate(year=year, month=1, day=1), n)
    days = []
    gy = []
    # the engine keeps a few extra days before/after the range: use only this year's days, matched by date
    rows = [d for d in tc.m_data if d.date.year == year]
    assert len(rows) == n, (year, len(rows))
    for i, d in enumerate(rows):
        a = d.astrodata
        if not gy or gy[-1][1] != a.nGaurabdaYear: gy.append([i, a.nGaurabdaYear])
        par = [ptime(d.eparana_time1), ptime(d.eparana_time2) if d.eparana_time2 >= 0 else -1] if d.ekadasi_parana else 0
        fast = 0
        if d.nFastType != FAST_NULL: fast = 1 if d.nFastType == FAST_EKADASI else 2
        ev = [tid(e["text"]) for e in d.dayEvents if show(e)]
        ek = tid(d.ekadasi_vrata_name) if d.ekadasi_vrata_name else -1
        days.append([a.nTithi, a.nMasa, a.nNaksatra, a.nYoga, mins(a.sun.rise), mins(a.sun.set), mins(a.sun.arunodaya),
                     mins(d.moonrise), mins(d.moonset), fast, ek, par, d.nFeasting, ev])
    json.dump({"year": year, "gy": gy, "days": days}, open(os.path.join(OUT, "y%d.json" % year), "w"), separators=(",", ":"))
    if year % 10 == 0: print(year, flush=True)
json.dump(texts, open(os.path.join(OUT, "texts.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print("texts", len(texts))
