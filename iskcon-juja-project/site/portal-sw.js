/* Member portal offline helper. Online, the newest files are always used. Offline, saved copies of the pages are shown.
   Only this site's own files are saved; sign-in tokens and database answers are never cached here. */
var VERSION = "p4";
var CACHE = "portal-" + VERSION;
// Save the calendar ahead of time so it works offline: this year, next year and the helper files (a failure here never blocks the install).
var Y = new Date().getFullYear();
var PRECACHE = ["/calendar.html", "/calendar.js", "/gcal.js", "/birthday.js", "/profile.html", "/profile.js", "/styles.css", "/calendar-data/names.json", "/calendar-data/texts.json", "/calendar-data/y" + Y + ".json", "/calendar-data/y" + (Y + 1) + ".json"];
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(PRECACHE.map(function (u) { return c.add(u).catch(function () {}); })); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf("portal-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  var cdn = u.hostname === "cdn.jsdelivr.net" && /supabase-js/.test(u.pathname);
  if (u.origin !== location.origin && !cdn) return;
  var isPage = r.mode === "navigate" || /\.html?$/.test(u.pathname) || u.pathname === "/";
  // our own scripts and styles must always match the page that loads them, so they are fetched fresh first (saved copy only offline)
  var code = !cdn && /\.(js|css)$/.test(u.pathname);
  var big = cdn || (!isPage && !code && /\.(svg|png|jpe?g|webp|woff2?)$/.test(u.pathname));
  if (big) {
    // images, fonts and the sign-in library: shown from the saved copy at once (fast), refreshed in the background for next time
    e.respondWith(caches.open(CACHE).then(function (ca) { return ca.match(r).then(function (m) {
      var net = fetch(r).then(function (res) { if (res && (res.ok || res.type === "opaque")) ca.put(r, res.clone()); return res; }).catch(function () { return m; });
      return m || net;
    }); }));
    return;
  }
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var c = res.clone(); caches.open(CACHE).then(function (ca) { ca.put(r, c); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("/dashboard.html"); }); }));
});
