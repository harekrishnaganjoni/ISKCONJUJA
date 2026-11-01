#!/usr/bin/env python3
"""Rebuilds nectar/reminders-morning.ics, -midday.ics and -evening.ics from nectar/data.js.
Run from the repo root after ANY change to the Nectar plan:   python3 iskcon-juja-project/tools/build_nectar_ics.py
Keeps the same UIDs, so a calendar that imports the file again updates the earlier entries instead of duplicating them."""
import json, subprocess, datetime, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
URL = "https://iskconjuja.co.ke/nectar/"
UID_DOMAIN = "iskconjuja.netlify.app"      # unchanged on purpose, so re-imports update old entries
SLOTS = {"morning": (4, 0), "midday": (9, 30), "evening": (15, 0)}   # UTC; East Africa Time is UTC+3
js = "global.window=global;var s=require('fs').readFileSync('%s/nectar/data.js','utf8');eval(s+';global.D=DAYS;global.S=START;');console.log(JSON.stringify({d:D.map(function(x){return{kind:x.kind,title:x.title,hook:x.hook,n:x.read&&x.read.n}}),s:S}))" % ROOT
data = json.loads(subprocess.check_output(["node", "-e", js]))
y, m, d0 = data["s"]; start = datetime.date(y, m + 1, d0)

def esc(t): return t.replace("\\", "\\\\").replace(";", "\;").replace(",", "\\,").replace("\n", "\\n")
def fold(line):
    out, b = [], line.encode("utf8")
    while len(b) > 75:
        cut = 75
        while cut > 0 and (b[cut] & 0xC0) == 0x80: cut -= 1
        out.append(b[:cut].decode("utf8")); b = b[cut:]; first = False
        b = b" " + b
    out.append(b.decode("utf8")); return out

def describe(i, day, date):
    main = date.weekday() in (1, 4)          # Tuesday, Friday
    where = "Main discussion today at 7:00 PM at the centre." if main else "Everyone is welcome at the centre at 7:00 PM. If you cannot come, read on your own."
    if day["kind"] == "intro": today = "Today: a short welcome to the book. Open the plan and read the summary."
    elif day["kind"] == "closing": today = "Closing day. Open the plan, read it, and bring the one point you will keep."
    elif day["kind"] == "special": today = "Today: %s. Open the plan for the story and questions." % day["title"]; where = "We meet at the centre at 7:00 PM." 
    else: today = "Today's reading: %s%s. Open the plan and read it." % (day["title"], " (Text %s)" % day["n"] if day.get("n") else "")
    return "Hook: %s\n\n%s\n%s\n\nSing the Damodarastakam today (it is in the plan, tap the box to open it).\n\nOpen the plan: %s" % (day["hook"], today, where, URL)

now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
for name, (hh, mm) in SLOTS.items():
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ISKCON Juja//Kartik Reading//EN", "CALSCALE:GREGORIAN"]
    for i, day in enumerate(data["d"]):
        date = start + datetime.timedelta(days=i)
        st = datetime.datetime(date.year, date.month, date.day, hh, mm); en = st + datetime.timedelta(minutes=15)
        title = "Kartik Reading, Day %d: %s" % (i + 1, day["title"])
        ev = ["BEGIN:VEVENT", "UID:nectar-2026-day-%d@%s" % (i + 1, UID_DOMAIN), "SEQUENCE:2", "DTSTAMP:%s" % now,
              "DTSTART:%s" % st.strftime("%Y%m%dT%H%M00Z"), "DTEND:%s" % en.strftime("%Y%m%dT%H%M00Z"),
              "SUMMARY:" + esc(title), "DESCRIPTION:" + esc(describe(i, day, date)), "URL:" + URL,
              "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:PT0M", "DESCRIPTION:" + esc(title), "END:VALARM", "END:VEVENT"]
        for l in ev: lines.extend(fold(l))
    lines.append("END:VCALENDAR")
    open(os.path.join(ROOT, "nectar", "reminders-%s.ics" % name), "w", newline="").write("\r\n".join(lines) + "\r\n")
    print(name, len(data["d"]), "events")
