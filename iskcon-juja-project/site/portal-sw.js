/* Member portal offline helper. Online, the newest files are always used. Offline, saved copies of the pages are shown.
   Only this site's own files are saved; sign-in tokens and database answers are never cached here. */
var VERSION = "p2";
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
  if (r.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var c = res.clone(); caches.open(CACHE).then(function (ca) { ca.put(r, c); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("/dashboard.html"); }); }));
});
