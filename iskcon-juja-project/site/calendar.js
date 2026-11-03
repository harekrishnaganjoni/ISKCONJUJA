// MEMBER PORTAL: Vaishnava Calendar page (offline). Data and rules: gcal.js
(function () {
  "use strict";
  var G = window.ISKCON_GCAL, root = document.getElementById("gc");
  if (!root || !G) return;
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var now = G.today(), view = { y: now.y, m: now.m }, sel = now;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function label(dt) { return WD[G.weekday(dt)] + ", " + dt.d + " " + MON[dt.m - 1] + " " + dt.y; }
  function short(dt) { return WD[G.weekday(dt)].slice(0, 3) + " " + dt.d + " " + MON[dt.m - 1].slice(0, 3); }
  function tithiNo(t) { return (t % 15) + 1; }

  function detailHtml(v, isToday) {
    var h = '<div class="gc-card gc-detail">' +
      '<div class="gc-when">' + (isToday ? "Today &middot; " : "") + esc(label(v.date)) + '</div>' +
      '<h2 class="gc-tithi">' + esc(v.tithiName) + ' <small>(' + v.paksa + ' paksa)</small></h2>' +
      '<p class="gc-line">' + esc(v.masaName) + ' masa &middot; Gaurabda ' + v.gaurabdaYear + '</p>' +
      '<p class="gc-line">Naksatra: ' + esc(v.naksatra) + ' &middot; Yoga: ' + esc(v.yoga) + '</p>' +
      '<p class="gc-line">&#127749; Sunrise <b>' + G.hm(v.sunrise) + '</b> &middot; Sunset <b>' + G.hm(v.sunset) + '</b>' + (v.moonrise >= 0 ? ' &middot; Moonrise ' + G.hm(v.moonrise) : '') + '</p>';
    if (v.ekadasi && v.fast) h += '<p class="gc-fast">&#127807; Fast today: <b>' + esc(v.ekadasi) + '</b></p>';
    else if (v.fast) h += '<p class="gc-fast">&#127807; Fasting day</p>';
    if (v.parana) h += '<p class="gc-parana">Break the fast: <b>' + G.hm(v.parana.from) + (v.parana.to >= 0 ? ' &ndash; ' + G.hm(v.parana.to) : ' onwards') + '</b></p>';
    if (v.events.length) h += '<ul class="gc-events">' + v.events.map(function (t) { return '<li>&#10048; ' + esc(t) + '</li>'; }).join("") + '</ul>';
    h += '<details class="gc-muh"><summary>Muhurtas for this day</summary><ul>' + v.muhurtas.map(function (m) {
      return '<li' + (m.avoid ? ' class="gc-avoid"' : '') + '><b>' + esc(m.name) + '</b> ' + G.hm(m.from) + ' &ndash; ' + G.hm(m.to) + '<br><small>' + esc(m.note) + '</small></li>';
    }).join("") + '</ul></details></div>';
    return h;
  }

  function gridHtml(days) {
    var first = days[0], blanks = G.weekday(first.date), h = '<div class="gc-grid" role="grid" aria-label="Month">';
    WD.forEach(function (w) { h += '<div class="gc-dow">' + w.slice(0, 3) + '</div>'; });
    for (var i = 0; i < blanks; i++) h += '<div class="gc-cell gc-empty"></div>';
    days.forEach(function (v) {
      var cls = "gc-cell", mk = "";
      if (G.cmp(v.date, now) === 0) cls += " gc-today";
      if (G.cmp(v.date, sel) === 0) cls += " gc-sel";
      if (v.fast === 1) { cls += " gc-ek"; mk += '<i title="Ekadasi fast">&#127807;</i>'; }
      else if (v.fast) mk += '<i title="Fasting day">&#127807;</i>';
      if (v.tithi === 29) mk += '<i title="Purnima">&#127765;</i>';
      if (v.tithi === 14) mk += '<i title="Amavasya">&#127761;</i>';
      if (v.events.length) mk += '<i title="' + esc(v.events.join("; ")) + '">&#10048;</i>';
      h += '<button type="button" class="' + cls + '" data-d="' + G.iso(v.date) + '" aria-label="' + esc(label(v.date)) + ', ' + esc(v.tithiName) + '">' +
        '<b>' + v.date.d + '</b><span>' + esc(v.tithiName.slice(0, 4)) + ' ' + tithiNo(v.tithi) + '</span><em>' + mk + '</em></button>';
    });
    return h + '</div>';
  }

  var detailBox = document.getElementById("gc-detail"), monthBox = document.getElementById("gc-month"), upBox = document.getElementById("gc-up"), noteBox = document.getElementById("gc-note");
  function showDetail(dt) { G.day(dt).then(function (v) { detailBox.innerHTML = detailHtml(v, G.cmp(dt, now) === 0); }).catch(fail); }
  function showMonth() {
    G.month(view.y, view.m).then(function (days) {
      monthBox.innerHTML = '<div class="gc-nav"><button type="button" data-nav="-1" aria-label="Previous month">&#8249;</button><h3>' + MON[view.m - 1] + ' ' + view.y + '</h3><button type="button" data-nav="1" aria-label="Next month">&#8250;</button></div>' +
        gridHtml(days) + '<p class="gc-legend">&#127807; Ekadasi / fast &nbsp; &#10048; festival or acharya day &nbsp; &#127765; Purnima &nbsp; &#127761; Amavasya</p>' +
        '<p><button type="button" class="button secondary" data-nav="today">Today</button></p>';
    }).catch(fail);
  }
  function showUpcoming() {
    G.range(now, 75).then(function (list) {
      var rows = list.filter(function (v) { return v.fast || v.events.length; }).slice(0, 14);
      upBox.innerHTML = rows.map(function (v) {
        return '<li><button type="button" data-d="' + G.iso(v.date) + '"><b>' + esc(short(v.date)) + '</b> ' + (v.fast ? '&#127807; ' + esc(v.ekadasi || "Fast") : '') +
          (v.events.length ? (v.fast ? ' &middot; ' : '') + esc(v.events[0]) + (v.events.length > 1 ? ' +' + (v.events.length - 1) : '') : '') + '</button></li>';
      }).join("") || "<li>Nothing in the next 75 days.</li>";
    }).catch(fail);
  }
  function fail(e) {
    noteBox.innerHTML = '<p class="gc-problem">' + esc((G.problem || "The calendar could not be loaded.") + " If you are offline, open this page once while online so this year's calendar is saved. If it keeps happening, please tell the admins.") + ' <a href="#" data-whatsapp="Hi ISKCON JUJA! The Vaishnava calendar in the member app shows a problem: ' + esc(G.problem || (e && e.message) || "cannot load") + '">Tell the admins</a></p>';
    if (window.ISKCON && window.ISKCON.wireWhatsAppLinks) window.ISKCON.wireWhatsAppLinks(noteBox);
  }
  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-d],[data-nav]"); if (!b) return;
    if (b.hasAttribute("data-d")) { sel = G.parseIso(b.getAttribute("data-d")); view = { y: sel.y, m: sel.m }; showDetail(sel); showMonth(); detailBox.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
    var n = b.getAttribute("data-nav");
    if (n === "today") { sel = now; view = { y: now.y, m: now.m }; showDetail(sel); }
    else { view.m += +n; if (view.m < 1) { view.m = 12; view.y--; } if (view.m > 12) { view.m = 1; view.y++; } }
    if (view.y < G.FIRST || view.y > G.LAST) { view = { y: now.y, m: now.m }; }
    showMonth();
  });
  // Phone-calendar file: next 12 months of fasts (with an evening-before alarm), festivals, Purnima, Amavasya and month changes. Made in the browser; nothing is sent anywhere.
  document.getElementById("gc-sync").addEventListener("click", function () {
    var st = document.getElementById("gc-sync-status"); st.textContent = "Preparing...";
    G.majorEvents(now, 366).then(function (ev) {
      function ymd(x) { return x.y + ("0" + x.m).slice(-2) + ("0" + x.d).slice(-2); }
      function t(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
      var stamp = ymd(now) + "T000000Z", out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ISKCON JUJA//Vaishnava calendar//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Vaishnava calendar (Nairobi)"];
      ev.forEach(function (e) {
        var alarm = e.fast || e.items.some(function (x) { return /masa begins|month begins|Kartika ends/.test(x); });
        var title = e.items.slice(0, 2).join(" / "), desc = e.items.join("\n") + (e.parana ? "\nBreak the fast: " + G.hm(e.parana.from) + (e.parana.to >= 0 ? " - " + G.hm(e.parana.to) : " onwards") : "");
        out.push("BEGIN:VEVENT", "UID:gcal-" + ymd(e.date) + "@iskconjuja.co.ke", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + ymd(e.date), "DTEND;VALUE=DATE:" + ymd(G.addDays(e.date, 1)), "SUMMARY:" + t(title), "DESCRIPTION:" + t(desc), "TRANSP:TRANSPARENT");
        if (alarm) out.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + t("Tomorrow: " + title), "TRIGGER:-PT3H", "END:VALARM");
        out.push("END:VEVENT");
      });
      out.push("END:VCALENDAR");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([out.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" })); a.download = "vaishnava-calendar.ics";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      st.textContent = "Downloaded (" + ev.length + " days, next 12 months). Open the file to add it to your phone calendar.";
    }).catch(function () { st.textContent = "The calendar could not be prepared right now."; });
  });
  showDetail(sel); showMonth(); showUpcoming();
  G.checkForUpdates().then(function (changed) {
    if (changed) noteBox.innerHTML = '<p class="gc-small">&#10003; Calendar updated.</p>';
    if (changed) { showDetail(sel); showMonth(); showUpcoming(); }
  });
})();
