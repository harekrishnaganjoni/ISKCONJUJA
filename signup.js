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

  // Weekly program: every Tuesday and Friday 5:30-7:00 PM (Nairobi = UTC+3, no daylight saving).
  function weeklyIcs() {
    var d = new Date(); d.setUTCHours(0, 0, 0, 0);
    while (true) { var wd = d.getUTCDay(); if (wd === 2 || wd === 5) break; d.setUTCDate(d.getUTCDate() + 1); }
    var lines = [];
    ["TU", "FR"].forEach(function (code) {
      var s = new Date(d), target = code === "TU" ? 2 : 5;
      while (s.getUTCDay() !== target) s.setUTCDate(s.getUTCDate() + 1);
      lines = lines.concat(["BEGIN:VEVENT", "UID:weekly-" + code.toLowerCase() + "@iskconjuja.co.ke", "DTSTAMP:" + stamp(),
        "DTSTART:" + ymd(s) + "T143000Z", "DTEND:" + ymd(s) + "T160000Z", "RRULE:FREQ=WEEKLY;BYDAY=" + code,
        "SUMMARY:" + icsText("ISKCON Juja " + (code === "TU" ? "Tuesday" : "Friday") + " program"),
        "LOCATION:" + icsText(PLACE), "DESCRIPTION:" + icsText("Music, " + (code === "TU" ? "a talk or discussion" : "group book reading") + " and a free vegetarian feast. https://iskconjuja.co.ke/events.html"),
        "URL:https://iskconjuja.co.ke/events.html"].concat(alarm("-P1D", "Tomorrow: ISKCON Juja program, 5:30 PM"), alarm("-PT3H", "ISKCON Juja program today at 5:30 PM")).concat(["END:VEVENT"]));
    });
    download("iskcon-juja-weekly-program.ics", lines);
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
  }
  window.ISKCON_SIGNUP = { mount: mount, init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
