// ISKCON JUJA: Ekadashi & Vaishnava days (Events page). Dates come from the admin-managed table "vaishnava_days".
(function () {
  "use strict";
  var READY = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase);
  var client = READY ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
  var box = document.querySelector("[data-vaishnava]");
  if (!box || !READY) return;
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function icsText(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function fold(line) { var out = [], b = line; while (b.length > 73) { out.push(b.slice(0, 73)); b = " " + b.slice(73); } out.push(b); return out.join("\r\n"); }
  function parts(s) { var p = s.split("-"); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function label(s) { var p = parts(s), w = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); return DAY[w] + " " + p.d + " " + MON[p.m - 1]; }
  var now = new Date(), today = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());

  client.from("vaishnava_days").select("*").eq("published", true).gte("day", today).order("day", { ascending: true }).then(function (r) {
    if (r.error || !r.data || !r.data.length) return;
    var rows = r.data;
    box.hidden = false;
    box.querySelector("[data-vaishnava-list]").innerHTML = rows.slice(0, 8).map(function (x) {
      return '<li><span>&#127775;</span><span><strong>' + esc(label(x.day)) + '</strong> &mdash; ' + esc(x.title) +
        (x.note ? '<br><span style="font-size:13px;color:var(--muted);">' + esc(x.note) + '</span>' : '') +
        (x.to_confirm ? '<br><span style="font-size:12px;font-weight:700;color:#8a5a00;">Date to be confirmed with the Nairobi temple</span>' : '') + '</span></li>';
    }).join("");
    box.querySelector("[data-vaishnava-ics]").addEventListener("click", function () {
      var stamp = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + "T" + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + "00Z";
      var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ISKCON JUJA//Vaishnava days//EN", "CALSCALE:GREGORIAN"];
      rows.forEach(function (x) {
        var p = parts(x.day), nx = new Date(Date.UTC(p.y, p.m - 1, p.d + 1));
        var a = x.day.replace(/-/g, ""), b = nx.getUTCFullYear() + pad(nx.getUTCMonth() + 1) + pad(nx.getUTCDate());
        lines = lines.concat(["BEGIN:VEVENT", "UID:vaishnava-" + x.id + "@iskconjuja.co.ke", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + a, "DTEND;VALUE=DATE:" + b,
          "SUMMARY:" + icsText(x.title), "DESCRIPTION:" + icsText((x.note || "") + (x.to_confirm ? " (Date to be confirmed with the Nairobi temple.)" : "") + " https://iskconjuja.co.ke/events.html"),
          "TRANSP:TRANSPARENT",
          "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText("Tomorrow: " + x.title), "TRIGGER:-PT6H", "END:VALARM",
          "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText("Today: " + x.title), "TRIGGER:PT6H", "END:VALARM", "END:VEVENT"]);
      });
      lines.push("END:VCALENDAR");
      var blob = new Blob([lines.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "iskcon-juja-ekadashi.ics";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
  });
})();
