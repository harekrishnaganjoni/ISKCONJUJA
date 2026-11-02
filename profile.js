// MEMBER PORTAL: "My details & dates". Name/phone plus any number of milestones (birthday, initiation, marriage, anything).
// Each date is converted to its Vaishnava (Gaurabda) date and tracked every year. Private to the member (database rule).
(function () {
  "use strict";
  var D = window.ISKCON_DATA, G = window.ISKCON_GCAL, root = document.getElementById("pf");
  if (!root || !G) return;
  if (!D || !D.READY) { root.innerHTML = '<p class="board-note">This page is not available right now.</p>'; return; }
  var c = D.client, uid = null, items = [];
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var TITLE = { birthday: "My birthday", initiation: "Harinama initiation", marriage: "Our wedding", other: "" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function lab(dt) { return WD[G.weekday(dt)] + " " + dt.d + " " + MON[dt.m - 1] + " " + dt.y; }
  var f = document.getElementById("pf-form"), st = document.getElementById("pf-status"), list = document.getElementById("pf-list"),
      mf = document.getElementById("ms-form"), ms = document.getElementById("ms-status");
  var dw = document.getElementById("dg-week"), dm = document.getElementById("dg-month"), dgs = document.getElementById("dg-status");
  var maxDate = G.iso(G.today());
  mf.event_date.max = maxDate; mf.event_date.min = "1900-01-01";

  function renderList() {
    if (!items.length) { list.innerHTML = '<p class="gc-small">No dates saved yet. Add your birth date first.</p>'; return; }
    var now = G.today();
    Promise.all(items.map(function (m) {
      return G.vaishnavaDate(G.parseIso(m.event_date)).then(function (b) {
        return G.birthdaysFrom(b, now, 3).then(function (next) { return { m: m, b: b, next: next }; });
      }).catch(function () { return { m: m, err: true }; });
    })).then(function (rows) {
      list.innerHTML = rows.map(function (r) {
        var m = r.m, h = '<div class="gc-card" data-id="' + esc(m.id) + '"><div class="gc-when">' + esc(G.words(m.kind, m.title).name.replace(/^./, function (x) { return x.toUpperCase(); })) + '</div><h3 class="gc-tithi" style="font-size:18px;">' + esc(m.title) + '</h3>';
        if (r.err) h += '<p class="gc-problem">This date could not be converted right now (the calendar data is not available). Open this page again while online.</p>';
        else h += '<p class="gc-line"><b>' + esc(r.b.tithiName) + '</b> (' + r.b.paksa + ' paksa) &middot; ' + esc(r.b.masaName) + ' masa &middot; Gaurabda ' + r.b.gaurabdaYear + (r.b.adhika ? ' <small>(extra month: the following month of the same name is used)</small>' : '') + '</p>' +
          '<p class="gc-line">Original date: ' + esc(lab(G.parseIso(m.event_date))) + '</p>' +
          '<p class="gc-line">Next: ' + r.next.map(function (x) { return esc(lab(x.date)) + (x.exact ? '' : ' *'); }).join(' &middot; ') + '</p>' + (r.next.some(function (x) { return !x.exact; }) ? '<p class="gc-small">* the tithi begins and ends between two sunrises, so it is kept on the day it falls.</p>' : '');
        h += '<p style="display:flex;gap:8px;flex-wrap:wrap;"><label class="gc-small" style="display:flex;gap:6px;align-items:center;"><input type="checkbox" data-remind="' + esc(m.id) + '" ' + (m.remind !== false ? 'checked' : '') + ' style="width:auto;"> Remind me</label>' +
          '<button type="button" class="button secondary" data-del="' + esc(m.id) + '" style="font-size:12px;padding:4px 12px;min-height:auto;">Delete</button></p></div>';
        return h;
      }).join("");
    });
  }
  function load() {
    return Promise.all([c.from("member_details").select("*").eq("user_id", uid).maybeSingle(), c.from("member_milestones").select("*").eq("user_id", uid).order("created_at", { ascending: true })]).then(function (q) {
      if (q[0].error || q[1].error) { st.textContent = "Your details cannot be loaded yet (the admins still have to switch this on)."; return; }
      f.full_name.value = (q[0].data && q[0].data.full_name) || ""; f.phone.value = (q[0].data && q[0].data.phone) || "";
      items = q[1].data || [];
      dw.checked = !!(q[0].data && q[0].data.digest_weekly); dm.checked = !!(q[0].data && q[0].data.digest_monthly);
      try { localStorage.setItem("gc_mine_" + uid, JSON.stringify({ name: f.full_name.value, items: items, dw: dw.checked, dm: dm.checked })); localStorage.removeItem("gc_nudge_until"); } catch (e) {}
      renderList();
    });
  }
  function icsAll() {
    var now = G.today(), yrs = []; for (var y = now.y; y < now.y + 15; y++) yrs.push(y);
    Promise.all(items.map(function (m) { return G.vaishnavaDate(G.parseIso(m.event_date)).then(function (b) { return Promise.all(yrs.map(function (y) { return G.birthdaysIn(b, y); })).then(function (l) { return { m: m, b: b, days: [].concat.apply([], l) }; }); }); })).then(function (rows) {
      var stamp = now.y + ("0" + now.m).slice(-2) + ("0" + now.d).slice(-2) + "T000000Z", out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ISKCON JUJA//Gaurabda dates//EN", "CALSCALE:GREGORIAN"];
      function ymd(x) { return x.y + ("0" + x.m).slice(-2) + ("0" + x.d).slice(-2); }
      function t(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,"); }
      rows.filter(function (r) { return r.m.remind !== false; }).forEach(function (r) {
        var w = G.words(r.m.kind, r.m.title), what = r.b.tithiName + " (" + r.b.paksa + " paksa), " + r.b.masaName + " masa";
        r.days.filter(function (x) { return G.cmp(x.date, now) >= 0; }).forEach(function (x) {
          out.push("BEGIN:VEVENT", "UID:gaurabda-" + r.m.id + "-" + ymd(x.date) + "@iskconjuja.co.ke", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + ymd(x.date), "DTEND;VALUE=DATE:" + ymd(G.addDays(x.date, 1)),
            "SUMMARY:" + t(r.m.title + " (Gaurabda)"), "DESCRIPTION:" + t(what), "TRANSP:TRANSPARENT",
            "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + t("Tomorrow is " + w.ann + " by the Gaurabda calendar! What do you have planned?"), "TRIGGER:-PT15H", "END:VALARM",
            "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + t(w.today + "! Today is " + w.ann + " by the Gaurabda calendar."), "TRIGGER:PT8H", "END:VALARM", "END:VEVENT");
        });
      });
      out.push("END:VCALENDAR");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([out.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" })); a.download = "my-vaishnava-dates.ics";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
  }

  function saveDigest() {
    dgs.style.color = "var(--muted)"; dgs.textContent = "Saving...";
    c.from("member_details").upsert({ user_id: uid, full_name: f.full_name.value.trim() || null, phone: f.phone.value.trim() || null, digest_weekly: dw.checked, digest_monthly: dm.checked }).then(function (r) {
      dgs.style.color = r.error ? "#b33a2e" : "#2E7D32"; dgs.textContent = r.error ? "That did not save: " + r.error.message : "Saved.";
      if (!r.error) try { localStorage.setItem("gc_mine_" + uid, JSON.stringify({ name: f.full_name.value, items: items, dw: dw.checked, dm: dm.checked })); localStorage.removeItem("gc_dig_w"); localStorage.removeItem("gc_dig_m"); } catch (e) {}
    });
  }
  function icsDigest() {
    if (!dw.checked && !dm.checked) { dgs.style.color = "#b33a2e"; dgs.textContent = "Tick weekly and/or monthly first."; return; }
    var now = G.today(), first = G.weekStart(now), days = 371;
    G.majorEvents(first, days).then(function (ev) {
      var stamp = now.y + ("0" + now.m).slice(-2) + ("0" + now.d).slice(-2) + "T000000Z", out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ISKCON JUJA//Gaurabda digest//EN", "CALSCALE:GREGORIAN"];
      function ymd(x) { return x.y + ("0" + x.m).slice(-2) + ("0" + x.d).slice(-2); }
      function t(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
      function add(uid2, day, title, from, to) {
        var lines = ev.filter(function (e) { return G.cmp(e.date, from) >= 0 && G.cmp(e.date, to) <= 0; }).map(function (e) { return e.date.d + " " + MON[e.date.m - 1].slice(0, 3) + ": " + e.items.join("; "); });
        if (!lines.length) return;
        out.push("BEGIN:VEVENT", "UID:" + uid2 + "@iskconjuja.co.ke", "DTSTAMP:" + stamp, "DTSTART:" + ymd(day) + "T070000", "DTEND:" + ymd(day) + "T071500", "SUMMARY:" + t(title), "DESCRIPTION:" + t(lines.join("\n")), "TRANSP:TRANSPARENT",
          "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + t(title), "TRIGGER:PT0S", "END:VALARM", "END:VEVENT");
      }
      if (dw.checked) for (var w = 0; w < 52; w++) { var s = G.addDays(first, 7 * w); if (G.cmp(G.addDays(s, 6), now) < 0) continue; add("gcweek-" + ymd(s), s, "Vaishnava events this week", s, G.addDays(s, 6)); }
      if (dm.checked) for (var k = 0; k < 12; k++) { var mm = now.m + k, yy = now.y + Math.floor((mm - 1) / 12); mm = ((mm - 1) % 12) + 1; var a = { y: yy, m: mm, d: 1 }, z = G.addDays({ y: yy, m: mm + 1, d: 1 }, -1); if (mm === 12) z = { y: yy, m: 12, d: 31 }; if (G.cmp(a, first) < 0 || G.cmp(z, G.addDays(first, days - 1)) > 0) continue; add("gcmonth-" + ymd(a), a, "Vaishnava events this month (" + MON[mm - 1] + ")", a, z); }
      out.push("END:VCALENDAR");
      var el = document.createElement("a"); el.href = URL.createObjectURL(new Blob([out.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" })); el.download = "my-vaishnava-digest.ics";
      document.body.appendChild(el); el.click(); setTimeout(function () { URL.revokeObjectURL(el.href); el.remove(); }, 500);
      dgs.style.color = "#2E7D32"; dgs.textContent = "Downloaded. Open the file to add it to your phone calendar (covers the next 12 months).";
    });
  }
  dw.addEventListener("change", saveDigest); dm.addEventListener("change", saveDigest);
  document.getElementById("dg-ics").addEventListener("click", icsDigest);
  D.getSessionAndRole().then(function (s) { if (!s.session) return; uid = s.session.user.id; load(); });
  mf.kind.addEventListener("change", function () { if (!mf.title.value || Object.keys(TITLE).some(function (k) { return TITLE[k] === mf.title.value; })) mf.title.value = TITLE[mf.kind.value] || ""; });
  mf.title.value = TITLE.birthday;
  f.addEventListener("submit", function (e) {
    e.preventDefault(); st.style.color = "var(--muted)"; st.textContent = "Saving...";
    c.from("member_details").upsert({ user_id: uid, full_name: f.full_name.value.trim() || null, phone: f.phone.value.trim() || null }).then(function (r) {
      st.style.color = r.error ? "#b33a2e" : "#2E7D32"; st.textContent = r.error ? "That did not save: " + r.error.message : "Saved."; if (!r.error) load();
    });
  });
  mf.addEventListener("submit", function (e) {
    e.preventDefault(); ms.style.color = "var(--muted)"; ms.textContent = "Saving...";
    var row = { user_id: uid, kind: mf.kind.value, title: mf.title.value.trim(), event_date: mf.event_date.value, remind: mf.remind.checked };
    c.from("member_milestones").insert(row).then(function (r) {
      if (r.error) { ms.style.color = "#b33a2e"; ms.textContent = "That did not save: " + r.error.message; return; }
      ms.style.color = "#2E7D32"; ms.textContent = "Added."; mf.event_date.value = ""; mf.title.value = TITLE[mf.kind.value] || ""; load();
    });
  });
  list.addEventListener("click", function (e) {
    var d = e.target.closest("[data-del]"); if (!d) return;
    if (!confirm("Delete this date?")) return;
    c.from("member_milestones").delete().eq("id", d.getAttribute("data-del")).then(load);
  });
  list.addEventListener("change", function (e) {
    var r = e.target.closest("[data-remind]"); if (!r) return;
    c.from("member_milestones").update({ remind: r.checked }).eq("id", r.getAttribute("data-remind")).then(load);
  });
  document.getElementById("ms-ics").addEventListener("click", icsAll);
  document.getElementById("pf-delete").addEventListener("click", function () {
    if (!confirm("Delete ALL your saved details and dates?")) return;
    Promise.all([c.from("member_milestones").delete().eq("user_id", uid), c.from("member_details").delete().eq("user_id", uid)]).then(function () {
      try { localStorage.removeItem("gc_mine_" + uid); } catch (e) {}
      st.style.color = "#2E7D32"; st.textContent = "Everything was deleted."; f.reset(); items = []; renderList();
    });
  });
})();
