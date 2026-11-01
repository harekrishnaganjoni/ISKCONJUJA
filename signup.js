// ISKCON JUJA: "Save my spot" + "Add to my calendar" (Events page).
// Calendar files are built in the visitor's browser; reminders: the day before and 3 hours before.
(function () {
  "use strict";
  var READY = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase);
  var client = READY ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
  var WEEKLY = "Tuesday & Friday evening program";
  var PLACE = "Anthusia Apartments, Muraya Access Road, Juja";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function icsText(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()); }
  function stamp() { var d = new Date(); return ymd(d) + "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z"; }
  function alarm(trigger, text) { return ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText(text), "TRIGGER:" + trigger, "END:VALARM"]; }
  function fold(line) { var out = [], b = line; while (b.length > 73) { out.push(b.slice(0, 73)); b = " " + b.slice(73); } out.push(b); return out.join("\r\n"); }

  function download(name, lines) {
    var body = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ISKCON JUJA//Programs//EN\r\nCALSCALE:GREGORIAN\r\n" + lines.map(fold).join("\r\n") + "\r\nEND:VCALENDAR\r\n";
    var blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // Weekly programs: the rows from the admin panel (or the built-in Tue + Fri 5:30-7:00 PM if none).
  // Times are Nairobi (UTC+3, no daylight saving), written into the file as UTC.
  var DEFAULT_PROGRAMS = [
    { weekday: 2, title: "Tuesday", description: "Music, a talk or discussion and a free vegetarian feast.", start_time: "17:30", end_time: "19:00", place: PLACE },
    { weekday: 5, title: "Friday", description: "Music, group book reading and a free vegetarian feast.", start_time: "17:30", end_time: "19:00", place: PLACE }
  ];
  var programs = DEFAULT_PROGRAMS;
  var CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  function utcParts(day, hhmm) {            // day = a Date at UTC midnight (Nairobi date); returns [YYYYMMDD, HHMMSS] in UTC
    var h = parseInt(hhmm.slice(0, 2), 10) - 3, m = hhmm.slice(3, 5), d = new Date(day);
    if (h < 0) { h += 24; d.setUTCDate(d.getUTCDate() - 1); }
    return [ymd(d), pad(h) + m + "00"];
  }
  function weeklyIcs() {
    var lines = [];
    programs.forEach(function (pr, i) {
      var s = new Date(); s.setUTCHours(0, 0, 0, 0);
      while (s.getUTCDay() !== pr.weekday) s.setUTCDate(s.getUTCDate() + 1);
      var a = utcParts(s, String(pr.start_time)), b = utcParts(s, String(pr.end_time));
      var time12 = fmtTime(pr.start_time);
      lines = lines.concat(["BEGIN:VEVENT", "UID:weekly-" + CODES[pr.weekday].toLowerCase() + "-" + i + "@iskconjuja.co.ke", "DTSTAMP:" + stamp(),
        "DTSTART:" + a[0] + "T" + a[1] + "Z", "DTEND:" + b[0] + "T" + b[1] + "Z", "RRULE:FREQ=WEEKLY;BYDAY=" + CODES[pr.weekday],
        "SUMMARY:" + icsText("ISKCON Juja " + pr.title + " program"),
        "LOCATION:" + icsText(pr.place || PLACE), "DESCRIPTION:" + icsText((pr.description || "") + " https://iskconjuja.co.ke/events.html"),
        "URL:https://iskconjuja.co.ke/events.html"].concat(alarm("-P1D", "Tomorrow: ISKCON Juja " + pr.title + " program, " + time12), alarm("-PT3H", "ISKCON Juja " + pr.title + " program today at " + time12)).concat(["END:VEVENT"]));
    });
    download("iskcon-juja-weekly-program.ics", lines);
  }
  function fmtTime(t) { t = String(t).slice(0, 5); var h = parseInt(t.slice(0, 2), 10), m = t.slice(3, 5); return ((h + 11) % 12 + 1) + ":" + m + " " + (h >= 12 ? "PM" : "AM"); }
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Show the programs from the admin panel on the page (the built-in text stays if there are none).
  function showPrograms(rows) {
    var list = document.querySelector("[data-wk-list]"), eb = document.querySelector("[data-wk-eyebrow]"), pl = document.querySelector("[data-wk-place]");
    if (list) list.innerHTML = rows.map(function (r) {
      return '<li><span>&#127928;</span><span><strong>' + esc(r.title) + '</strong> (' + DAYS[r.weekday] + ', ' + fmtTime(r.start_time) + ' &ndash; ' + fmtTime(r.end_time) + ')' + (r.description ? ' &mdash; ' + esc(r.description) : '') + '</span></li>';
    }).join("");
    var sameTime = rows.every(function (r) { return r.start_time === rows[0].start_time && r.end_time === rows[0].end_time; });
    if (eb) eb.textContent = sameTime
      ? rows.map(function (r) { return DAYS[r.weekday] + "s"; }).join(" & ") + ", " + fmtTime(rows[0].start_time).replace(":00", "") + " \u2013 " + fmtTime(rows[0].end_time).replace(":00", "")
      : rows.map(function (r) { return DAYS[r.weekday] + "s " + fmtTime(r.start_time).replace(":00", ""); }).join(" \u00b7 ");
    if (pl && rows[0].place) pl.textContent = "Held at " + rows[0].place + ".";
  }
  function loadPrograms() {
    if (!READY || !document.querySelector("[data-wk-list]")) return;
    client.from("programs").select("*").eq("published", true).order("weekday", { ascending: true }).then(function (r) {
      if (r.error || !r.data || !r.data.length) return;
      r.data.forEach(function (x) { x.start_time = String(x.start_time).slice(0, 5); x.end_time = String(x.end_time).slice(0, 5); });
      programs = r.data; showPrograms(programs);
    });
  }

  function eventIcs(e) {
    var lines = ["BEGIN:VEVENT", "UID:event-" + e.id + "@iskconjuja.co.ke", "DTSTAMP:" + stamp()];
    var s = e.start_date, end = e.end_date || e.start_date;
    var t = e.start_time ? String(e.start_time).slice(0, 5) : "";
    if (t) {
      var hh = parseInt(t.slice(0, 2), 10), mm = t.slice(3, 5), dt = new Date(s + "T00:00:00Z");
      hh -= 3; if (hh < 0) { hh += 24; dt.setUTCDate(dt.getUTCDate() - 1); }
      var ed = new Date(end + "T00:00:00Z"); var eh = hh + 2; if (eh >= 24) { eh -= 24; ed.setUTCDate(ed.getUTCDate() + 1); }
      lines.push("DTSTART:" + ymd(dt) + "T" + pad(hh) + mm + "00Z", "DTEND:" + ymd(ed) + "T" + pad(eh) + mm + "00Z");
    } else {
      var e2 = new Date(end + "T00:00:00Z"); e2.setUTCDate(e2.getUTCDate() + 1);
      lines.push("DTSTART;VALUE=DATE:" + s.replace(/-/g, ""), "DTEND;VALUE=DATE:" + ymd(e2));
    }
    lines.push("SUMMARY:" + icsText(e.title), "LOCATION:" + icsText(PLACE), "DESCRIPTION:" + icsText((e.description || "") + " https://iskconjuja.co.ke/events.html"));
    if (t) lines = lines.concat(alarm("-P1D", "Tomorrow: " + e.title), alarm("-PT3H", "In 3 hours: " + e.title));
    else lines = lines.concat(alarm("-PT15H", "Tomorrow: " + e.title), alarm("PT8H", "Today: " + e.title));
    lines.push("END:VEVENT");
    download("iskcon-juja-" + String(e.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + ".ics", lines);
  }

  function formHtml(prog, eventId) {
    return '<form class="signup-form" data-program="' + esc(prog) + '"' + (eventId ? ' data-event="' + esc(eventId) + '"' : "") + ' style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">' +
      '<input name="name" placeholder="Your name" required maxlength="80" autocomplete="name" style="padding:8px;border:1px solid var(--line);border-radius:4px;">' +
      '<input name="contact" placeholder="Phone number or email" required minlength="3" maxlength="120" autocomplete="tel" style="padding:8px;border:1px solid var(--line);border-radius:4px;">' +
      '<label style="font-size:13px;display:flex;gap:8px;align-items:flex-start;"><input name="consent" type="checkbox" required style="width:auto;margin-top:3px;"><span>You may contact me about this program. I know my name and contact are seen only by the ISKCON Juja admins (<a href="privacy.html" style="text-decoration:underline;">privacy</a>).</span></label>' +
      '<button class="button" type="submit">Confirm my spot</button><p class="signup-msg" style="font-size:13px;margin:0;" aria-live="polite"></p></form>';
  }

  function mount(box, prog, eventId, ev) {
    box.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +
      '<button type="button" class="button secondary" data-cal>&#128197; Add to my calendar</button>' +
      '<button type="button" class="button secondary" data-open-form>&#9998; Save my spot</button></div>' +
      '<div data-form-slot hidden>' + formHtml(prog, eventId) + '</div>' +
      '<p style="font-size:12px;color:var(--muted);margin-top:6px;">The calendar file reminds you the day before and 3 hours before.</p>';
    box.querySelector("[data-cal]").addEventListener("click", function () { ev ? eventIcs(ev) : weeklyIcs(); });
    box.querySelector("[data-open-form]").addEventListener("click", function () { box.querySelector("[data-form-slot]").hidden = false; });
    var form = box.querySelector("form"), msg = box.querySelector(".signup-msg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!READY) { msg.textContent = "Sign-up is not available right now. Please use the WhatsApp button."; return; }
      var btn = form.querySelector("button[type=submit]"); btn.disabled = true; msg.style.color = "var(--muted)"; msg.textContent = "Saving...";
      var row = { name: form.name.value.trim(), contact: form.contact.value.trim(), program: prog, channel: "calendar" };
      if (eventId) row.event_id = eventId;
      client.from("registrations").insert(row).then(function (r) {
        btn.disabled = false;
        if (r.error) { msg.style.color = "#a33"; msg.textContent = "Sorry, that did not save. Please try again in a minute, or use the WhatsApp button."; return; }
        form.reset(); msg.style.color = "var(--text, #222)";
        var wa = (window.ISKCON && window.ISKCON.SITE_SETTINGS && window.ISKCON.SITE_SETTINGS.whatsapp_group_invite) || "";
        msg.innerHTML = "&#10003; Your spot is saved. Hare Krishna! Please also tap <strong>Add to my calendar</strong> so your phone reminds you." +
          (/^https:\/\//.test(wa) ? ' <a href="' + esc(wa) + '" target="_blank" rel="noopener" style="text-decoration:underline;">Join our WhatsApp group</a>.' : "");
      });
    });
  }

  function init() {
    var w = document.querySelector("[data-signup-weekly]");
    if (w) mount(w, WEEKLY, null, null);
    loadPrograms();
  }
  window.ISKCON_SIGNUP = { mount: mount, init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
