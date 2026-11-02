"""Self-check for calendar-data/. Run from the repo root:  python3 iskcon-juja-project/tools/check_gaurabda_data.py [--manifest]
1) every year file is well formed and consistent (same rules the app applies when it loads a year);
2) the data agrees with known_days.json (days copied from the owner's Nairobi wall calendar);
With --manifest it also writes calendar-data/manifest.json (version = hash of the data, so it changes only when the data does).
Exit code 0 = all good, 1 = a problem (printed)."""
import json, os, sys, hashlib, datetime as dt
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
D = os.environ.get("GAURABDA_OUT") or os.path.join(ROOT, "calendar-data")
FIRST, LAST = 1900, 2070
bad = []
def err(m): bad.append(m)
def leap(y): return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)
texts = json.load(open(os.path.join(D, "texts.json"))); names = json.load(open(os.path.join(D, "names.json")))
if len(names["tithi"]) != 30 or len(names["masa"]) != 13 or len(names["naksatra"]) != 27 or len(names["yoga"]) != 27: err("names.json has the wrong number of names")
years = {}
for y in range(FIRST, LAST + 1):
    p = os.path.join(D, "y%d.json" % y)
    if not os.path.exists(p): err("missing %s" % p); continue
    Y = json.load(open(p)); years[y] = Y; n = 366 if leap(y) else 365
    if Y.get("year") != y or len(Y["days"]) != n: err("%d: wrong year/day count" % y); continue
    fasts = 0
    for i, d in enumerate(Y["days"]):
        if len(d) != 14: err("%d day %d malformed" % (y, i)); break
        if not (0 <= d[0] <= 29 and 0 <= d[1] <= 12 and 0 <= d[2] <= 26 and 0 <= d[3] <= 26): err("%d day %d out of range" % (y, i)); break
        if not (340 <= d[4] <= 420 and 1060 <= d[5] <= 1150 and d[4] < d[5]): err("%d day %d impossible sunrise/sunset" % (y, i)); break
        if any(k >= len(texts) for k in d[13]) or d[10] >= len(texts): err("%d day %d bad text index" % (y, i)); break
        if d[9] == 1: fasts += 1
        if i:
            p_ = Y["days"][i - 1]
            if (d[0] - p_[0]) % 30 > 2: err("%d day %d tithi jump" % (y, i)); break
            if (d[2] - p_[2]) % 27 > 2: err("%d day %d naksatra jump" % (y, i)); break
    if not 22 <= fasts <= 27: err("%d: odd Ekadasi count %d" % (y, fasts))
    if sum(1 for _ in Y["gy"]) < 1: err("%d: no gaurabda year" % y)
for k in range(FIRST + 1, LAST + 1):   # tithi must also continue across New Year
    if FIRST in years and k in years and (years[k]["days"][0][0] - years[k - 1]["days"][-1][0]) % 30 > 2: err("tithi jump at new year %d" % k)
# known answers
for kd in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "known_days.json")))["days"]:
    date = dt.date.fromisoformat(kd["date"]); Y = years.get(date.year)
    if not Y: err("no data for %s" % kd["date"]); continue
    d = Y["days"][(date - dt.date(date.year, 1, 1)).days]; ev = [texts[k] for k in d[13]]
    if "ekadasi" in kd and not (d[10] >= 0 and texts[d[10]].strip() == kd["ekadasi"]): err("%s: expected %s" % (kd["date"], kd["ekadasi"]))
    if "fast" in kd and d[9] != kd["fast"]: err("%s: expected fast code %s" % (kd["date"], kd["fast"]))
    if "tithi" in kd and d[0] != kd["tithi"]: err("%s: expected tithi %s got %s" % (kd["date"], kd["tithi"], d[0]))
    if "tithiName" in kd and names["tithi"][d[0]] != kd["tithiName"]: err("%s: expected %s" % (kd["date"], kd["tithiName"]))
    if "parana" in kd and d[11] != kd["parana"]: err("%s: expected break-fast %s got %s" % (kd["date"], kd["parana"], d[11]))
    for e in kd.get("events", []):
        if e not in ev: err("%s: missing event '%s'" % (kd["date"], e))
if bad:
    print("CALENDAR DATA CHECK FAILED (%d problems):" % len(bad))
    for b in bad[:40]: print(" -", b)
    sys.exit(1)
print("calendar data OK: %d years, %d reference days from the wall calendar agree" % (len(years), len(json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "known_days.json")))["days"])))
if "--manifest" in sys.argv:
    h = hashlib.sha256()
    for f in sorted(os.listdir(D)):
        if f.endswith(".json") and f != "manifest.json": h.update(open(os.path.join(D, f), "rb").read())
    json.dump({"version": h.hexdigest()[:12], "firstYear": FIRST, "lastYear": LAST, "engine": "gaurabda (GCAL for Python, MIT) for Nairobi"}, open(os.path.join(D, "manifest.json"), "w"))
    print("manifest version", h.hexdigest()[:12])
