// MEMBER PORTAL: "Phone reminders". Each member chooses which reminders they want and switches them on for this phone.
// Choices are in reminder_prefs, phones in reminder_devices (both private to the member, see supabase/35-...sql).
// The sender (worker/reminders.js) reads them and sends the notifications at the right times (Nairobi time).
(function () {
  "use strict";
  var D = window.ISKCON_DATA, root = document.getElementById("rm-box");
  if (!root || !D || !D.READY) return;
  var c = D.client, uid = null, devices = [], mine = null, vapid = "";
  var DEF = { ev_eve: true, ev_hours: true, ev_hours_n: 3, fast_eve: true, fest_eve: false, fest_day: true, own_eve: true, own_day: true };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function b64uToBytes(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var b = atob(s), o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }
  function bytesToB64u(buf) { var s = ""; new Uint8Array(buf).forEach(function (x) { s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function label() {
    var u = navigator.userAgent;
    return /iPhone|iPad/.test(u) ? "iPhone / iPad" : /Android/.test(u) ? "Android phone" : /Windows/.test(u) ? "Windows computer" : /Mac/.test(u) ? "Mac" : "This device";
  }
  var supported = ("serviceWorker" in navigator) && ("PushManager" in window) && ("Notification" in window);
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
  var iOS = /iPhone|iPad/.test(navigator.userAgent);

  function render(msg) {
    var p = Object.assign({}, DEF, (mine && mine.prefs) || {});
    var h = "";
    if (!vapid) h += '<p class="gc-problem">Reminders are not switched on by the admins yet. Please check again soon.</p>';
    else if (!supported || (iOS && !standalone)) h += '<p class="gc-small">' + (iOS && !standalone ? 'On an iPhone: first open this site in Safari, tap Share, then <b>Add to Home Screen</b>, open it from the Home Screen, and come back here.' : 'This browser cannot show phone reminders. Try Chrome on Android, or install the app.') + '</p>';
    else h += '<p style="margin:0 0 10px;"><button type="button" class="button" id="rm-on">&#128276; Switch reminders on for this phone</button></p>';
    h += '<div id="rm-dev">' + (devices.length ? '<p class="gc-small" style="margin:0 0 6px;"><b>Phones that get my reminders</b></p>' + devices.map(function (d) { return '<p style="display:flex;gap:10px;align-items:center;margin:0 0 6px;"><span>' + esc(d.label || "A device") + ' <span class="gc-small">(added ' + esc(String(d.created_at).slice(0, 10)) + ')</span></span><button type="button" class="button secondary" data-rm-del="' + esc(d.id) + '" style="font-size:12px;padding:4px 12px;min-height:auto;">Remove</button></p>'; }).join("") : '<p class="gc-small">No phone is switched on yet.</p>') + '</div>';
    h += '<form id="rm-form" class="gc-card" style="display:flex;flex-direction:column;gap:8px;margin-top:12px;"><b>Which reminders do I want?</b>' +
      '<fieldset style="border:0;padding:0;margin:0;"><legend class="gc-small"><b>Programs and special events</b></legend>' +
      chk("ev_eve", p.ev_eve, "The evening before (6 pm)") +
      '<label style="font-size:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><input type="checkbox" name="ev_hours" ' + (p.ev_hours ? "checked" : "") + ' style="width:auto;"> A few hours before it starts: <select name="ev_hours_n">' + [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (+p.ev_hours_n === n ? " selected" : "") + '>' + n + ' hour' + (n > 1 ? "s" : "") + ' before</option>'; }).join("") + '</select></label></fieldset>' +
      '<fieldset style="border:0;padding:0;margin:0;"><legend class="gc-small"><b>Ekadashi and other fasts</b></legend>' + chk("fast_eve", p.fast_eve, "The evening before (6 pm), with the time to break the fast") + '</fieldset>' +
      '<fieldset style="border:0;padding:0;margin:0;"><legend class="gc-small"><b>Festivals and acharya days</b></legend>' + chk("fest_eve", p.fest_eve, "The evening before (6 pm)") + chk("fest_day", p.fest_day, "On the morning (6:30 am)") + '</fieldset>' +
      '<fieldset style="border:0;padding:0;margin:0;"><legend class="gc-small"><b>My own dates</b> (birthday, initiation, anniversaries I saved below)</legend>' + chk("own_eve", p.own_eve, "The evening before (6 pm)") + chk("own_day", p.own_day, "A greeting on the morning (6:30 am)") + '</fieldset>' +
      '<button class="button" type="submit">Save my choices</button></form><p id="rm-status" style="font-size:13px;margin:8px 0 0;" aria-live="polite">' + (msg || "") + '</p>';
    root.innerHTML = h;
  }
  function chk(n, v, t) { return '<label style="font-size:14px;display:flex;gap:8px;align-items:center;"><input type="checkbox" name="' + n + '" ' + (v ? "checked" : "") + ' style="width:auto;"> ' + t + '</label>'; }
  function status(t, bad) { var s = document.getElementById("rm-status"); if (s) { s.style.color = bad ? "#b33a2e" : "#2E7D32"; s.textContent = t; } }

  function load() {
    return Promise.all([
      c.from("site_settings").select("value").eq("key", "vapid_public").maybeSingle(),
      c.from("reminder_devices").select("id,endpoint,label,created_at").eq("user_id", uid).order("created_at"),
      c.from("reminder_prefs").select("prefs").eq("user_id", uid).maybeSingle()
    ]).then(function (r) {
      vapid = (r[0].data && r[0].data.value) || ""; devices = (r[1].data) || []; mine = r[2].data; render();
    }).catch(function () { render("Could not load your reminder choices. Check your connection."); });
  }
  function savePrefs(f) {
    var p = { ev_eve: f.ev_eve.checked, ev_hours: f.ev_hours.checked, ev_hours_n: +f.ev_hours_n.value, fast_eve: f.fast_eve.checked, fest_eve: f.fest_eve.checked, fest_day: f.fest_day.checked, own_eve: f.own_eve.checked, own_day: f.own_day.checked };
    return c.from("reminder_prefs").upsert({ user_id: uid, prefs: p, updated_at: new Date().toISOString() }).then(function (r) { if (!r.error) mine = { prefs: p }; return r; });
  }
  root.addEventListener("submit", function (e) {
    if (e.target.id !== "rm-form") return; e.preventDefault();
    savePrefs(e.target).then(function (r) { status(r.error ? r.error.message : "Saved. Your reminders follow these choices from now on.", !!r.error); });
  });
  root.addEventListener("click", function (e) {
    var del = e.target.closest("[data-rm-del]");
    if (del) {
      var id = del.getAttribute("data-rm-del"), dv = devices.filter(function (x) { return x.id === id; })[0];
      c.from("reminder_devices").delete().eq("id", id).then(function () {
        navigator.serviceWorker && navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (s) { if (s && dv && s.endpoint === dv.endpoint) s.unsubscribe(); }).catch(function () {});
        load();
      });
      return;
    }
    if (!e.target.closest("#rm-on")) return;
    var btn = e.target.closest("#rm-on"); btn.disabled = true;
    var form = document.getElementById("rm-form");
    Notification.requestPermission().then(function (perm) {
      if (perm !== "granted") throw new Error("Notifications are blocked for this site. Allow them in the browser settings (the lock icon next to the address), then try again.");
      return navigator.serviceWorker.ready;
    }).then(function (reg) {
      return reg.pushManager.getSubscription().then(function (old) {
        // a subscription made with an older key must be replaced
        return (old ? old.unsubscribe() : Promise.resolve()).then(function () { return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(vapid) }); });
      });
    }).then(function (sub) {
      var k = sub.getKey("p256dh"), a = sub.getKey("auth");
      return c.from("reminder_devices").upsert({ user_id: uid, endpoint: sub.endpoint, p256dh: bytesToB64u(k), auth: bytesToB64u(a), label: label() }, { onConflict: "endpoint" });
    }).then(function (r) {
      if (r && r.error) throw new Error(r.error.message);
      return (mine ? Promise.resolve() : savePrefs(form));
    }).then(function () { return load(); }).then(function () { status("Done. This phone will now get the reminders you chose."); })
      .catch(function (err) { btn.disabled = false; status(err.message || "Could not switch reminders on.", true); });
  });
  (D.client.auth.getSession ? D.client.auth.getSession() : Promise.resolve({ data: {} })).then(function (r) {
    var s = r && r.data && r.data.session; if (!s) { root.innerHTML = '<p class="gc-small">Sign in to choose reminders.</p>'; return; }
    uid = s.user.id; load();
  });
})();
