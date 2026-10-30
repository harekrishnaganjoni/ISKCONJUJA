/* Member portal offline helper. Online, the newest files are always used. Offline, saved copies of the pages are shown.
   Only this site's own files are saved; sign-in tokens and database answers are never cached here. */
var VERSION = "p1";
var CACHE = "portal-" + VERSION;
self.addEventListener("install", function (e) { self.skipWaiting(); });
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
