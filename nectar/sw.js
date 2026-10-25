/* Offline support. If you change any file after publishing, increase this number (v1 -> v2) so phones get the update. */
var VERSION = "v1";
var CACHE = "nectar-" + VERSION;
var FILES = [
  "./", "index.html", "style.css", "data.js", "app.js", "manifest.webmanifest", "icon-192.png", "icon-512.png",
  "content/preface.txt", "content/text-1.txt", "content/text-2.txt", "content/text-3.txt", "content/text-4.txt",
  "content/text-5.txt", "content/text-6.txt", "content/text-7.txt", "content/text-8.txt", "content/text-9.txt",
  "content/text-10.txt", "content/text-11.txt"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(e.request).catch(function () { return caches.match("index.html"); });
  }));
});
