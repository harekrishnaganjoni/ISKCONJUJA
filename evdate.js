// Event dates: past events drop off by themselves; events that repeat come back on their next date.
//   repeat_mode "gaurabda": same Gaurabda (Vaishnava lunar) day every year (g_masa + g_tithi, taken from the date the admin picked)
//   repeat_mode "date":     same Gregorian date every year
// Dates are plain YYYY-MM-DD in Nairobi time.
window.EVD = (function () {
  function today() { return new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10); }
  function addDays(s, n) { return new Date(Date.parse(s + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10); }
  function addYears(s, n) {
    var y = parseInt(s.slice(0, 4), 10) + n, m = parseInt(s.slice(5, 7), 10), d = parseInt(s.slice(8, 10), 10);
    var dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCMonth() !== m - 1) dt = new Date(Date.UTC(y, m - 1, 28));      // 29 February in a non-leap year
    return dt.toISOString().slice(0, 10);
  }
  function days(a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); }
  function mode(e) { return e.repeat_mode || "none"; }
  function loadG() {
    if (window.ISKCON_GCAL) return Promise.resolve(window.ISKCON_GCAL);
    return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = "gcal.js"; s.onload = function () { ok(window.ISKCON_GCAL); }; s.onerror = no; document.head.appendChild(s); });
  }
  function isoOf(dt) { return dt.y + "-" + (dt.m < 10 ? "0" : "") + dt.m + "-" + (dt.d < 10 ? "0" : "") + dt.d; }
  function parse(s) { var p = s.split("-"); return { y: +p[0], m: +p[1], d: +p[2] }; }
  // Next time this event happens (or the current run), as a copy of the event with start_date / end_date moved.
  // Resolves with _past = true when it is over for good, _shifted = true when it was moved to a later year.
  function one(e, t) {
    var o = {}; for (var k in e) o[k] = e[k];
    var end = e.end_date || e.start_date, len = days(e.start_date, end);
    if (end >= t) return Promise.resolve(o);
    var m = mode(e);
    if (m === "date") {
      var n = 1; while (days(t, addYears(e.start_date, n)) + len < 0 && n < 200) n++;
      o.start_date = addYears(e.start_date, n); o.end_date = e.end_date ? addYears(e.end_date, n) : null; o._shifted = true;
      return Promise.resolve(o);
    }
    if (m === "gaurabda" && e.g_masa != null && e.g_tithi != null) {
      return loadG().then(function (G) {
        return G.birthdaysFrom({ masa: +e.g_masa, tithi: +e.g_tithi }, parse(addDays(t, -len)), 3).then(function (l) {
          var x = l.filter(function (r) { return r.exact; })[0] || l[0];
          if (!x) { o._past = true; return o; }
          o.start_date = isoOf(x.date); o.end_date = e.end_date ? addDays(o.start_date, len) : null; o._shifted = true; o._lunar = true;
          return o;
        });
      }).catch(function () { o._past = true; return o; });
    }
    o._past = true; return Promise.resolve(o);
  }
  function resolve(list, t) { t = t || today(); return Promise.all((list || []).map(function (e) { return one(e, t); })); }
  return { today: today, addDays: addDays, addYears: addYears, days: days, one: one, resolve: resolve, loadG: loadG };
})();
