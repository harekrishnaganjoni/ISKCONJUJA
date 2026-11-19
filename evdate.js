// Event dates: past events drop off by themselves, and events marked "repeats every year" come back on the next date.
// Dates are plain YYYY-MM-DD in Nairobi time.
window.EVD = (function () {
  function today() { return new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10); }
  function addYears(s, n) {
    var y = parseInt(s.slice(0, 4), 10) + n, m = parseInt(s.slice(5, 7), 10), d = parseInt(s.slice(8, 10), 10);
    var dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCMonth() !== m - 1) dt = new Date(Date.UTC(y, m - 1, 28));      // 29 February in a non-leap year
    return dt.toISOString().slice(0, 10);
  }
  function days(a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); }
  // Returns the event with start_date/end_date moved to the next time it happens, or null when it is over for good.
  // The extra fields say what happened: _past (not repeating and over), _shifted (moved to a later year).
  function occurrence(e, t) {
    t = t || today();
    var o = {}; for (var k in e) o[k] = e[k];
    var end = e.end_date || e.start_date;
    if (end >= t) return o;
    if (!e.repeat_yearly) { o._past = true; return o; }
    var n = 1, len = days(e.start_date, end);
    while (days(t, addYears(e.start_date, n)) + len < 0 && n < 200) n++;
    o.start_date = addYears(e.start_date, n);
    o.end_date = e.end_date ? addYears(e.end_date, n) : null;
    o._shifted = n;
    return o;
  }
  return { today: today, addYears: addYears, days: days, occurrence: occurrence };
})();
