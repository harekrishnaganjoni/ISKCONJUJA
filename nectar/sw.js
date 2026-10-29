/* Offline support. Online, the newest files are always used. Offline, the saved copies are used. */
var VERSION = "v11";
var CACHE = "nectar-" + VERSION;
var FILES = [
  "./", "index.html", "style.css", "data.js", "app.js", "manifest.webmanifest", "icon-192.png", "icon-512.png",
  "content/text-1.txt", "content/text-2.txt", "content/text-3.txt", "content/text-4.txt",
  "content/text-5.txt", "content/text-6.txt", "content/text-7.txt", "content/text-8.txt", "content/damodarastakam.txt",
  "/supabase-config.js", "reminders-morning.ics", "reminders-midday.ics", "reminders-evening.ics"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function networkFirst(req) {
  return new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      caches.match(req, { ignoreSearch: true }).then(function (hit) { if (hit && !done) { done = true; resolve(hit); } });
    }, 3000);
    fetch(req).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (!done) { done = true; resolve(hit || caches.match("index.html")); }
      });
    });
  });
}
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  /* Only handle this plan's own files. Calls to the database are never saved or changed. */
  var u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  var scopePath = new URL(self.registration.scope).pathname;
  if (u.pathname.indexOf(scopePath) !== 0 && !/\/supabase-config\.js$/.test(u.pathname)) return;
  e.respondWith(networkFirst(e.request));
});
