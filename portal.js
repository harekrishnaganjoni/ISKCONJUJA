// ============================================================
// MEMBER PORTAL chrome + address handling. Loaded on the portal pages
// (sign-in, dashboard, my courses, admin, course editor) just before data.js,
// and on course.html in "host-only" mode (only dresses up on the portal address).
// Public pages never load this and never show member links.
// ============================================================
(function () {
  "use strict";
  var H = window.ISKCON_HOSTS || {}, host = location.hostname;
  var cs = document.currentScript, mode = (cs && cs.getAttribute("data-mode")) || "always";
  var onPortalHost = !!H.portalLive && host === H.portalHost;
  var onPublicHost = (H.publicHosts || []).indexOf(host) >= 0;

  function publicUrl(p) { return H.portalLive ? H.publicOrigin + "/" + p : p; }

  // After the switch, old public addresses of portal pages forward to the portal.
  if (H.portalLive && onPublicHost && mode === "always") {
    location.replace(H.portalOrigin + location.pathname + location.search + location.hash);
    return;
  }
  if (mode !== "always" && !onPortalHost) return; // course.html on the public site stays public
  window.ISKCON_IN_PORTAL = true;
  document.documentElement.classList.add("in-portal");

  var page = location.pathname.split("/").pop() || "dashboard.html";
  function on(p) { return page === p ? ' class="on" aria-current="page"' : ""; }

  var head = document.createElement("header");
  head.className = "ph";
  head.innerHTML =
    '<div class="ph-in">' +
      '<a class="ph-brand" href="' + publicUrl("index.html") + '" title="Go to the public website" aria-label="ISKCON JUJA public website">' +
        '<img src="images/juja-logo.svg" alt="ISKCON Juja" width="44" height="44"><span><b>ISKCON JUJA</b><small>Member Portal</small></span></a>' +
      (page === "devotees.html" ? "" : '<nav class="ph-nav" aria-label="Portal">' +
        '<a href="dashboard.html"' + on("dashboard.html") + '>Home</a>' +
        '<a href="my-courses.html"' + on("my-courses.html") + '>My Courses</a>' +
        '<a href="admin.html" data-admin-nav hidden' + on("admin.html") + '>Manage the Site</a>' +
      '</nav>') +
      '<div class="ph-act">' +
        '<button class="theme-switch-nav" type="button" data-theme-toggle aria-label="Toggle theme"></button>' +
        '<a href="#" class="sign-out-trigger ph-out" data-member-nav hidden>Sign Out</a>' +
      '</div>' +
    '</div>';
  var old = document.querySelector("header.site-header");
  if (old) old.parentNode.replaceChild(head, old); else document.body.insertBefore(head, document.body.firstChild);

  var foot = document.querySelector("footer.footer");
  if (foot) {
    var pf = document.createElement("footer");
    pf.className = "ph-foot";
    pf.innerHTML = '<p>&copy; ' + new Date().getFullYear() + ' ISKCON JUJA &middot; <a href="' + publicUrl("privacy.html") + '">Privacy</a> &middot; <a href="' + publicUrl("index.html") + '">Public website</a></p>';
    foot.parentNode.replaceChild(pf, foot);
  }
  document.querySelectorAll("a[data-public-link]").forEach(function (a) { a.setAttribute("href", publicUrl(a.getAttribute("href"))); });
  var fl = document.querySelector(".float-stack"); if (fl) fl.parentNode.removeChild(fl);

  // Installable app: only on the portal's own address, so the public site never becomes part of it.
  if (onPortalHost) {
    var l = document.createElement("link"); l.rel = "manifest"; l.href = "/portal.webmanifest"; document.head.appendChild(l);
    var m = document.createElement("meta"); m.name = "theme-color"; m.content = "#800020"; document.head.appendChild(m);
    if ("serviceWorker" in navigator) { try { navigator.serviceWorker.register("/portal-sw.js"); } catch (e) {} }
  }
})();
