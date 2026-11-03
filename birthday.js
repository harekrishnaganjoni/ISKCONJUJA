// MEMBER PORTAL (every portal page): today's Vaishnava date strip, milestone greetings (birthday, initiation, ...) and the "add your birth date" nudge.
// Uses gcal.js (calendar) and the member's own private rows in member_details / member_milestones. Works offline from a saved copy.
(function () {
  "use strict";
  var page = window.ISKCON_PAGE || "dashboard.html";
  if (page === "devotees.html" || page === "register.html") return;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function start() {
    var tries = 0, t = setInterval(function () {
      if (window.ISKCON_GCAL && window.ISKCON_DATA && window.ISKCON_DATA.READY) { clearInterval(t); run(); }
      else if (++tries > 60) clearInterval(t);
    }, 150);
  }
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);

  function run() {
    var G = window.ISKCON_GCAL, D = window.ISKCON_DATA, now = G.today();
    D.getSessionAndRole().then(function (r) {
      if (!r.session || ["member", "admin", "super_admin"].indexOf(r.role) < 0) return;
      var uid = r.session.user.id, key = "gc_mine_" + uid, cached = null;
      try { cached = JSON.parse(get(key) || "null"); } catch (e) {}
      strip(G, now);
      Promise.all([
        D.client.from("member_details").select("full_name,digest_weekly,digest_monthly").eq("user_id", uid).maybeSingle(),
        D.client.from("member_milestones").select("id,kind,title,event_date,remind").eq("user_id", uid)
      ]).then(function (q) {
        var live = !q[0].error && !q[1].error, mine = live ? { name: (q[0].data && q[0].data.full_name) || "", items: q[1].data || [], dw: !!(q[0].data && q[0].data.digest_weekly), dm: !!(q[0].data && q[0].data.digest_monthly) } : cached;
        if (live) set(key, JSON.stringify(mine));
        if (!mine) return;
        if (live && !mine.items.some(function (m) { return m.kind === "birthday"; })) nudge(uid);
        greet(G, D, mine, now); digest(G, mine, now);
      }, function () { if (cached) { greet(G, D, cached, now); digest(G, cached, now); } });
    });
  }

  function mount(el) {
    var ph = document.querySelector(".ph"), host = document.getElementById("gc-top");
    if (!host) { host = document.createElement("div"); host.id = "gc-top"; host.className = "gc-top"; if (ph && ph.parentNode) ph.parentNode.insertBefore(host, ph.nextSibling); else document.body.insertBefore(host, document.body.firstChild); }
    host.appendChild(el);
  }
  function strip(G, now) {
    G.day(now).then(function (v) {
      var a = document.createElement("a"); a.className = "gc-strip"; a.href = "calendar.html";
      a.innerHTML = '<span>&#10048; Today: <b>' + esc(v.tithiName) + '</b> (' + v.paksa + ') &middot; ' + esc(v.masaName) + ' &middot; Gaurabda ' + v.gaurabdaYear + ' &middot; Sunrise ' + G.hm(v.sunrise) + '</span>' +
        (v.fast ? '<span class="gc-strip-fast">&#127807; ' + esc(v.ekadasi ? "Fast: " + v.ekadasi : "Fasting day") + '</span>' : '') +
        (v.parana ? '<span class="gc-strip-fast">Break fast ' + G.hm(v.parana.from) + (v.parana.to >= 0 ? '&ndash;' + G.hm(v.parana.to) : '+') + '</span>' : '');
      mount(a);
    }).catch(function () {});
  }
  function nudge(uid) {
    if (get("gc_asked_" + uid)) return;          // asked once on this device, never again: the Profile page is where dates live
    set("gc_asked_" + uid, "1");
    var b = document.createElement("div"); b.className = "gc-banner";
    b.innerHTML = '<span>&#127802; Welcome! If you would like Vaishnava birthday greetings, you can add your dates any time in <a href="profile.html">Profile</a>.</span><button type="button" aria-label="Close">&times;</button>';
    b.querySelector("button").addEventListener("click", function () { b.remove(); });
    mount(b);
  }
  // Optional weekly / monthly summary of major events, shown the first time the app is opened in a new week (Monday) or month.
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function digest(G, mine, now) {
    function show(kind, from, count, title, keyName, keyVal) {
      if (get(keyName) === keyVal) return;
      G.majorEvents(from, count).then(function (ev) {
        ev = ev.filter(function (e) { return G.cmp(e.date, now) >= 0; });
        var el = document.createElement("div"); el.className = "gc-banner gc-digest";
        el.innerHTML = '<span>&#128197; <b>' + esc(title) + '</b>' + (ev.length ? '<ul style="margin:6px 0 0;padding-left:18px;">' + ev.map(function (e) { return '<li><b>' + e.date.d + ' ' + MON[e.date.m - 1].slice(0, 3) + '</b>: ' + e.items.map(esc).join('; ') + '</li>'; }).join("") + '</ul>' : '<br>No major events in the rest of this period.') + ' <a href="calendar.html">Open the calendar</a></span><button type="button" aria-label="Close">&times;</button>';
        el.querySelector("button").addEventListener("click", function () { set(keyName, keyVal); el.remove(); });
        mount(el);
      }).catch(function () {});
    }
    if (mine.dm) { var last = G.addDays({ y: now.y, m: now.m + 1, d: 1 }, -1); show("m", now, last.d - now.d + 1, "Major events this month (" + MON[now.m - 1] + ")", "gc_dig_m", now.y + "-" + now.m); }
    if (mine.dw) { var ws = G.weekStart(now); show("w", now, 7 - ((G.weekday(now) + 6) % 7), "Major events this week", "gc_dig_w", G.iso(ws)); }
  }
  function quote(D, now) {
    return D.client.from("quotes").select("quote_text,source").limit(400).then(function (q) {
      var l = (q && q.data) || []; if (!l.length) return null;
      return l[(now.y * 400 + now.m * 31 + now.d) % l.length];
    }, function () { return null; });
  }
  function greet(G, D, mine, now) {
    var tomorrow = G.addDays(now, 1), items = (mine.items || []).filter(function (m) { return m.remind !== false; });
    if (!items.length) return;
    var name = (mine.name || "").trim().split(/\s+/)[0] || "";
    Promise.all(items.map(function (m) {
      var k = "gc_greet_" + m.id + "_" + G.iso(now);
      if (get(k) === "x") return null;
      return G.vaishnavaDate(G.parseIso(m.event_date)).then(function (b) {
        var ys = {}; ys[now.y] = 1; ys[tomorrow.y] = 1;
        return Promise.all(Object.keys(ys).map(function (y) { return G.birthdaysIn(b, +y); })).then(function (lists) {
          var all = [].concat.apply([], lists), t = false, n = false;
          all.forEach(function (x) { if (G.cmp(x.date, now) === 0) t = true; if (G.cmp(x.date, tomorrow) === 0) n = true; });
          return (t || n) ? { m: m, b: b, today: t, key: k } : null;
        });
      }).catch(function () { return null; });
    })).then(function (hits) {
      hits = hits.filter(Boolean).slice(0, 3); if (!hits.length) return;
      quote(D, now).then(function (q) {
        hits.forEach(function (h) {
          var w = G.words(h.m.kind, h.m.title), when = esc(h.b.tithiName) + ', ' + h.b.paksa + ' paksa of ' + esc(h.b.masaName) + ' masa';
          var q2 = q ? '<br><em>&ldquo;' + esc(q.quote_text) + '&rdquo;</em> <small>&mdash; ' + esc(q.source) + '</small>' : '';
          var el = document.createElement("div"); el.className = "gc-banner gc-bday";
          el.innerHTML = '<span>' + (h.today
            ? '&#127881; <b>' + esc(w.today) + (name && h.m.kind !== "other" ? ', ' + esc(name) : '') + '!</b> Today is ' + esc(w.ann) + ' by the Gaurabda calendar (' + when + ').' + (h.m.kind === "birthday" ? ' May Sri Krsna bless the year ahead.' : '')
            : '&#127874; <b>Tomorrow is ' + esc(w.ann) + '!</b> (as per the Gaurabda calendar: ' + when + ') What do you have planned?') + q2 + '</span><button type="button" aria-label="Close">&times;</button>';
          el.querySelector("button").addEventListener("click", function () { set(h.key, "x"); el.remove(); });
          mount(el);
        });
      });
    });
  }
})();
