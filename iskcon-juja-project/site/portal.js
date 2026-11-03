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

  // Page name, also when the host serves addresses without ".html" (e.g. /calendar or /calendar/).
  var page = location.pathname.replace(/\/+$/, "").split("/").pop() || "dashboard.html";
  if (!/\.html?$/.test(page)) page += ".html";
  window.ISKCON_PAGE = page;
  function on(p) { return page === p ? ' class="on" aria-current="page"' : ""; }

  // HEADER: the official ISKCON JUJA header (logo + title, Hare Krishna maha-mantra, Srila Prabhupada's photo and caption) is NEVER removed.
  // It is kept exactly as on the public site; only the menu bar under it is the portal's own.
  var old = document.querySelector("header.site-header");
  var top = old && old.querySelector(".header-top");
  var topHtml = top ? top.outerHTML :
    '<div class="header-top"><div class="header-top__inner">' +
      '<a class="brand" href="index.html" aria-label="ISKCON JUJA home"><img class="brand-logo" src="images/juja-logo.svg" alt="ISKCON Juja"><span class="brand-text"><span class="brand-name">ISKCON JUJA</span></span></a>' +
      '<div class="header-mantra" aria-label="Maha Mantra"><p>Hare Krishna Hare Krishna Krishna Krishna Hare Hare</p><p>Hare Rama Hare Rama Rama Rama Hare Hare</p></div>' +
      '<div class="prabhupada-block"><p class="prabhupada-caption">ISKCON Founder Acharya HDG Srila A.C Bhaktivedanta Swami Prabhupada</p><img class="prabhupada-portrait" src="images/prabhupada-sitting.webp" alt="Srila Prabhupada" width="55" height="55"></div>' +
    '</div></div>';
  var brandBar = document.createElement("header");
  brandBar.className = "ph-top";
  brandBar.innerHTML = topHtml;
  var bl = brandBar.querySelector("a.brand"); if (bl) { bl.setAttribute("href", publicUrl("index.html")); bl.setAttribute("title", "Go to the public website"); }

  var isAdminPage = page === "admin.html" || page === "course-editor.html";
  var head = document.createElement("div");
  head.className = "ph" + (isAdminPage ? " ph-admin" : "");
  head.innerHTML =
    '<div class="ph-in">' +
      (isAdminPage ? '<span class="ph-tag ph-tag-admin">&#128274; Admin Portal</span>' +
        '<nav class="ph-nav" aria-label="Admin portal"><a href="admin.html"' + on("admin.html") + '>Manage the site</a><a href="course-editor.html"' + on("course-editor.html") + '>Course editor</a></nav>' +
        '<div class="ph-act"><a class="ph-link" href="dashboard.html">&larr; Member portal</a><a class="ph-link" href="' + publicUrl("index.html") + '">Public site</a>' +
        '<button class="theme-switch-nav" type="button" data-theme-toggle aria-label="Toggle theme"></button><a href="#" class="sign-out-trigger ph-out" data-member-nav hidden>Sign Out</a></div>'
      : '<span class="ph-tag">Member Portal</span>' +
      (page === "devotees.html" || page === "register.html" ? "" : '<nav class="ph-nav" aria-label="Portal">' +
        '<a href="dashboard.html"' + on("dashboard.html") + '>Home</a>' +
        '<a href="my-courses.html"' + on("my-courses.html") + '>My Courses</a>' +
        '<a href="calendar.html"' + on("calendar.html") + '>Calendar</a>' +
        '<a href="portal-board.html"' + on("portal-board.html") + '>Messages</a>' +
        '<a href="profile.html"' + on("profile.html") + '>Profile</a>' +
        '<a href="admin.html" data-admin-nav hidden>Admin portal</a>' +
      '</nav>') +
      '<div class="ph-act">' +
        '<button class="theme-switch-nav" type="button" data-theme-toggle aria-label="Toggle theme"></button>' +
        '<a href="#" class="sign-out-trigger ph-out" data-member-nav hidden>Sign Out</a>' +
      '</div>') +
    '</div>';
  if (old) { old.parentNode.insertBefore(brandBar, old); old.parentNode.insertBefore(head, old); old.parentNode.removeChild(old); }
  else { document.body.insertBefore(head, document.body.firstChild); document.body.insertBefore(brandBar, head); }

  var foot = document.querySelector("footer.footer");
  if (foot) {
    var pf = document.createElement("footer");
    pf.className = "ph-foot";
    pf.innerHTML =
      '<p class="pf-row"><span data-setting-text="address_short">Anthusia Apartments, Muraya Access road, Juja</span> &middot; <a data-contact-phone href="#">Call or WhatsApp</a> &middot; <a data-map-link href="https://www.google.com/maps/search/?api=1&amp;query=Anthusia+Apartments+Muraya+Access+Road+Gachororo+Juja+Kenya" target="_blank" rel="noopener">Map</a></p>' +
      '<p class="pf-row"><a href="https://bbt.org/" target="_blank" rel="noopener">BBT</a> &middot; <a href="https://www.prabhupada.net/" target="_blank" rel="noopener">Srila Prabhupada</a> &middot; <a href="https://iskcon.org/" target="_blank" rel="noopener">ISKCON</a> &middot; <a href="https://vedabase.io/en/" target="_blank" rel="noopener">Vedabase</a>' +
      ' &middot; <a href="#" data-setting-link="facebook_url" hidden>Facebook</a><a href="#" data-setting-link="instagram_url" hidden>Instagram</a><a href="#" data-setting-link="tiktok_url" hidden>TikTok</a><a href="#" data-setting-link="youtube_url" hidden>YouTube</a></p>' +
      '<p class="pf-row">&copy; ' + new Date().getFullYear() + ' ISKCON JUJA &middot; <a href="' + publicUrl("privacy.html") + '">Privacy</a> &middot; <a href="' + publicUrl("index.html") + '">Public website</a></p>';
    foot.parentNode.replaceChild(pf, foot);
  }
  document.querySelectorAll("a[data-public-link]").forEach(function (a) { a.setAttribute("href", publicUrl(a.getAttribute("href"))); });
  var fl = document.querySelector(".float-stack"); if (fl) fl.parentNode.removeChild(fl);

  // Vaishnava calendar helpers (today's date strip, milestone greetings) on every portal page except the sign-in page.
  if (page !== "devotees.html" && page !== "register.html" && !isAdminPage) {
    window.addEventListener("load", function () {
      function add(src) { return new Promise(function (ok) { var x = document.createElement("script"); x.src = src; x.onload = x.onerror = ok; document.body.appendChild(x); }); }
      (window.ISKCON_GCAL ? Promise.resolve() : add("gcal.js")).then(function () { return add("birthday.js"); });
    });
  }

  // Installable app: only on the portal's own address, so the public site never becomes part of it.
  if (onPortalHost) {
    var l = document.createElement("link"); l.rel = "manifest"; l.href = "/portal.webmanifest"; document.head.appendChild(l);
    var m = document.createElement("meta"); m.name = "theme-color"; m.content = "#800020"; document.head.appendChild(m);
    if ("serviceWorker" in navigator) { try { navigator.serviceWorker.register("/portal-sw.js"); } catch (e) {} }
  }
})();
