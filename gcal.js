// ============================================================
// ISKCON JUJA: Gaurabda (Vaishnava) calendar for the member app.
// Reads the calendar files in /calendar-data/ (made from the open-source GCAL engine for Nairobi; see
// iskcon-juja-project/tools/build_gaurabda_data.py). Everything is computed on the phone, so it works offline
// once a year's file has been opened. The file for this year and next year is saved ahead of time by portal-sw.js.
// Self-checks: every loaded year is validated; a weekly check asks the server whether newer data exists.
// ============================================================
(function () {
  "use strict";
  var BASE = "calendar-data/", FIRST = 1900, LAST = 2070;
  var G = { problem: null, updated: false, version: null, ready: false };
  var yearCache = {}, meta = null;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hm(m) { return m < 0 ? "" : pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  function isLeap(y) { return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0); }
  function daysIn(y) { return isLeap(y) ? 366 : 365; }
  function doy(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000); }
  function dateOf(y, i) { var t = new Date(Date.UTC(y, 0, 1 + i)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  function addDays(dt, n) { var t = new Date(Date.UTC(dt.y, dt.m - 1, dt.d + n)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  function weekday(dt) { return new Date(Date.UTC(dt.y, dt.m - 1, dt.d)).getUTCDay(); }   // 0 = Sunday
  function iso(dt) { return dt.y + "-" + pad(dt.m) + "-" + pad(dt.d); }
  function parseIso(s) { var p = String(s).split("-"); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function cmp(a, b) { return a.y - b.y || a.m - b.m || a.d - b.d; }
  function today() { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() }; }   // the phone's own date (Kenya = Nairobi)

  // ---------- self-check: is a year's data well formed? ----------
  function validate(Y, y) {
    var e = [];
    if (!Y || Y.year !== y || !Y.days) return ["file is not the right year"];
    if (Y.days.length !== daysIn(y)) e.push("wrong number of days (" + Y.days.length + ")");
    var fasts = 0;
    for (var i = 0; i < Y.days.length; i++) {
      var d = Y.days[i];
      if (!d || d.length !== 14) { e.push("day " + i + " is malformed"); break; }
      if (!(d[0] >= 0 && d[0] <= 29 && d[1] >= 0 && d[1] <= 12 && d[2] >= 0 && d[2] <= 26 && d[3] >= 0 && d[3] <= 26)) { e.push("day " + i + " has a value out of range"); break; }
      if (!(d[4] >= 340 && d[4] <= 420 && d[5] >= 1060 && d[5] <= 1150 && d[4] < d[5])) { e.push("day " + i + " has an impossible sunrise/sunset for Kenya"); break; }
      if (d[9] === 1) fasts++;
      if (i > 0) {
        var p = Y.days[i - 1], step = (d[0] - p[0] + 30) % 30, nstep = (d[2] - p[2] + 27) % 27;
        if (step > 2) { e.push("tithi jumps by " + step + " on day " + i); break; }
        if (nstep > 2) { e.push("naksatra jumps by " + nstep + " on day " + i); break; }
      }
    }
    if (fasts < 22 || fasts > 27) e.push("odd number of Ekadasi fasts (" + fasts + ")");
    return e;
  }

  // ---------- loading ----------
  function getJson(path, bypass) {
    return fetch(BASE + path, bypass ? { cache: "reload" } : undefined).then(function (r) { if (!r.ok) throw new Error(path + " " + r.status); return r.json(); });
  }
  function loadMeta() {
    if (meta) return meta;
    meta = Promise.all([getJson("names.json"), getJson("texts.json")]).then(function (r) { return { names: r[0], texts: r[1] }; });
    meta.catch(function () { meta = null; });
    return meta;
  }
  function loadYear(y) {
    if (y < FIRST || y > LAST) return Promise.reject(new Error("The calendar covers " + FIRST + " to " + LAST + "."));
    if (yearCache[y]) return yearCache[y];
    yearCache[y] = getJson("y" + y + ".json").then(function (Y) {
      var errs = validate(Y, y);
      if (!errs.length) return Y;
      return getJson("y" + y + ".json", true).then(function (Y2) {            // saved copy looks wrong: fetch a fresh one
        var e2 = validate(Y2, y);
        if (e2.length) { G.problem = "The calendar data for " + y + " failed its self-check: " + e2[0]; throw new Error(G.problem); }
        return Y2;
      });
    });
    yearCache[y].catch(function () { delete yearCache[y]; });
    return yearCache[y];
  }

  // ---------- one day ----------
  function build(Y, M, dt) {
    var i = doy(dt.y, dt.m, dt.d), d = Y.days[i], N = M.names, T = M.texts;
    var gy = Y.gy[0][1]; Y.gy.forEach(function (p) { if (p[0] <= i) gy = p[1]; });
    var wd = weekday(dt), rise = d[4], set = d[5], len = set - rise;
    function kala(a) { var s = rise + a[wd] * len / 8; return [Math.round(s), Math.round(s + len / 8)]; }
    var ev = d[13].map(function (k) { return T[k]; }).filter(function (t) { return !/^Fasting for /.test(t) && !/^Break fast/.test(t); });
    return {
      date: dt, weekday: wd, tithi: d[0], tithiName: N.tithi[d[0]], paksa: d[0] >= 15 ? "Gaura" : "Krsna",
      masa: d[1], masaName: N.masa[d[1]], gaurabdaYear: gy, naksatra: N.naksatra[d[2]], yoga: N.yoga[d[3]],
      sunrise: rise, sunset: set, arunodaya: d[6], moonrise: d[7], moonset: d[8],
      fast: d[9], ekadasi: d[10] >= 0 ? T[d[10]].trim() : "", parana: d[11] ? { from: d[11][0], to: d[11][1] } : null,
      feast: d[12], events: ev,
      muhurtas: [
        { name: "Brahma-muhurta", note: "best time for japa and study", from: rise - 96, to: rise - 48 },
        { name: "Arunodaya", note: "dawn; Ekadasi is decided here", from: rise - 96, to: rise },
        wd === 3 ? null : (function () { var s = Math.round(rise + 7 * len / 15); return { name: "Abhijit", note: "the noon muhurta", from: s, to: Math.round(s + len / 15) }; })(),
        (function () { var k = kala([7, 1, 6, 4, 5, 3, 2]); return { name: "Rahu-kalam", note: "avoid starting new work", from: k[0], to: k[1], avoid: true }; })(),
        (function () { var k = kala([4, 3, 2, 1, 0, 6, 5]); return { name: "Yama-ghanti", note: "avoid starting new work", from: k[0], to: k[1], avoid: true }; })(),
        (function () { var k = kala([6, 5, 4, 3, 2, 1, 0]); return { name: "Guli-kalam", note: "avoid starting new work", from: k[0], to: k[1], avoid: true }; })()
      ].filter(Boolean)
    };
  }
  function day(dt) { return Promise.all([loadYear(dt.y), loadMeta()]).then(function (r) { return build(r[0], r[1], dt); }); }
  function month(y, m) {
    return Promise.all([loadYear(y), loadMeta()]).then(function (r) {
      var out = [], n = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (var d = 1; d <= n; d++) out.push(build(r[0], r[1], { y: y, m: m, d: d }));
      return out;
    });
  }
  function range(from, count) {      // list of consecutive days starting at "from" (may cross years)
    var ys = {}, a = [], i, dt; for (i = 0; i < count; i++) { dt = addDays(from, i); ys[dt.y] = 1; a.push(dt); }
    return Promise.all(Object.keys(ys).map(function (y) { return loadYear(+y); }).concat([loadMeta()])).then(function (r) {
      var M = r[r.length - 1], by = {}; Object.keys(ys).forEach(function (y, k) { by[y] = r[k]; });
      return a.map(function (dt) { return build(by[dt.y], M, dt); });
    });
  }

  // ---------- major events (for the weekly / monthly digest) ----------
  // One entry per day that has something worth planning for: Ekadasi or other fast, a festival or acharya day, Purnima, Amavasya.
  function majorEvents(from, count) {
    return range(from, count).then(function (days) {
      var out = [];
      days.forEach(function (v) {
        var l = [];
        if (v.fast) l.push(v.ekadasi ? v.ekadasi + " (fast)" : "Fasting day");
        v.events.forEach(function (t) { if (l.join("|").indexOf(t) < 0) l.push(t); });
        if (v.tithi === 29) l.push("Purnima (full moon)"); else if (v.tithi === 14) l.push("Amavasya (new moon)");
        if (l.length) out.push({ date: v.date, items: l, fast: !!v.fast, parana: v.parana });
      });
      return out;
    });
  }
  function weekStart(dt) { return addDays(dt, -((weekday(dt) + 6) % 7)); }   // Monday of that week

  // ---------- birthdays ----------
  // A birthday is a (masa, tithi) pair, taken from the tithi at sunrise on the birth date (the same way GCAL dates appearance days).
  function normMasaAt(y, i, M) {   // an adhika (extra) month takes the name of the normal month that follows it
    return loadYear(y).then(function (Y) {
      var j = i, yy = y, YY = Y;
      function step() {
        var m = YY.days[j][1];
        if (m !== 12) return Promise.resolve(m);
        j++; if (j >= YY.days.length) { j = 0; yy++; return loadYear(yy).then(function (n) { YY = n; return step(); }); }
        return step();
      }
      return step();
    });
  }
  function vaishnavaDate(dt) {
    return Promise.all([day(dt), loadYear(dt.y)]).then(function (r) {
      var v = r[0];
      return normMasaAt(dt.y, doy(dt.y, dt.m, dt.d)).then(function (nm) {
        return loadMeta().then(function (M) {
          return { tithi: v.tithi, tithiName: v.tithiName, paksa: v.paksa, masa: nm, masaName: M.names.masa[nm], gaurabdaYear: v.gaurabdaYear, adhika: v.masa === 12 };
        });
      });
    });
  }
  // dates in Gregorian year y on which the Vaishnava birthday (masa, tithi) falls
  function birthdaysIn(b, y) {
    return loadYear(y).then(function (Y) {
      var res = [], D = Y.days, n = D.length;
      for (var i = 0; i < n; i++) {
        if (D[i][1] === b.masa && D[i][0] === b.tithi && !(i > 0 && D[i - 1][0] === b.tithi && D[i - 1][1] === b.masa)) res.push({ date: dateOf(y, i), exact: true });
        else if (i + 1 < n && D[i][0] === (b.tithi + 29) % 30 && D[i + 1][0] === (b.tithi + 1) % 30 && (D[i][1] === b.masa || D[i + 1][1] === b.masa)) res.push({ date: dateOf(y, i), exact: false });   // the tithi begins and ends between two sunrises: kept on the day it falls
      }
      return res;
    });
  }
  function birthdaysFrom(b, from, count) {
    var out = [];
    function go(y) {
      if (out.length >= count || y > LAST) return Promise.resolve(out.slice(0, count));
      return birthdaysIn(b, y).then(function (l) { l.forEach(function (x) { if (cmp(x.date, from) >= 0) out.push(x); }); return go(y + 1); });
    }
    return go(from.y);
  }

  // ---------- weekly "is there newer data?" check ----------
  function checkForUpdates() {
    try {
      var last = +localStorage.getItem("gcal_checked") || 0;
      if (Date.now() - last < 7 * 86400000 || !navigator.onLine) return Promise.resolve(false);
    } catch (e) {}
    return fetch(BASE + "manifest.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
      if (!m) return false;
      var known = null; try { known = localStorage.getItem("gcal_version"); localStorage.setItem("gcal_checked", String(Date.now())); } catch (e) {}
      G.version = m.version;
      if (known && known !== m.version) {                      // newer data was published: forget the saved copies
        yearCache = {}; meta = null; G.updated = true;
        var drop = (window.caches && caches.keys) ? caches.keys().then(function (ks) {
          return Promise.all(ks.map(function (k) { return caches.open(k).then(function (c) { return c.keys().then(function (rs) { return Promise.all(rs.filter(function (q) { return q.url.indexOf("/calendar-data/") > -1; }).map(function (q) { return c.delete(q); })); }); }); }));
        }) : Promise.resolve();
        return drop.then(function () { try { localStorage.setItem("gcal_version", m.version); } catch (e) {} return true; });
      }
      try { localStorage.setItem("gcal_version", m.version); } catch (e) {}
      return false;
    }).catch(function () { return false; });
  }

  // wording for the different kinds of milestone
  G.words = function (kind, title) {
    var k = { birthday: { name: "birthday", today: "Happy birthday", ann: "your birthday" }, initiation: { name: "initiation anniversary", today: "Happy initiation anniversary", ann: "your initiation anniversary" },
      marriage: { name: "wedding anniversary", today: "Happy wedding anniversary", ann: "your wedding anniversary" } }[kind];
    return k || { name: title, today: "Today is a special day", ann: "the anniversary of " + title };
  };
  G.FIRST = FIRST; G.LAST = LAST;
  G.hm = hm; G.today = today; G.addDays = addDays; G.iso = iso; G.parseIso = parseIso; G.cmp = cmp; G.weekday = weekday;
  G.validate = validate; G.loadYear = loadYear; G.day = day; G.month = month; G.range = range; G.majorEvents = majorEvents; G.weekStart = weekStart;
  G.vaishnavaDate = vaishnavaDate; G.birthdaysFrom = birthdaysFrom; G.birthdaysIn = birthdaysIn; G.checkForUpdates = checkForUpdates;
  window.ISKCON_GCAL = G;
})();
