/* Install-the-app button.
   - Public site: a button at the bottom of the phone menu that opens the member portal (the portal is the installable app).
   - Portal: an "Install app" item at the end of the menu bar and the same button at the bottom of any menu drawer.
   - Android/Chrome: uses the browser's real install prompt. iPhone/Safari: shows the Share > Add to Home Screen steps.
   - Hidden once the app is installed (opened from the home screen). */
(function () {
  "use strict";
  var H = window.ISKCON_HOSTS || {};
  var host = location.hostname;
  var onPortal = !!H.portalLive && host === H.portalHost;
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  if (standalone) return;
  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", function () { document.querySelectorAll("[data-install-app]").forEach(function (n) { n.hidden = true; }); });

  function steps() {
    var d = document.getElementById("install-help");
    if (!d) {
      d = document.createElement("div");
      d.id = "install-help"; d.className = "install-help";
      d.innerHTML = '<div class="install-card" role="dialog" aria-modal="true" aria-label="Install the app"><h3>Install the ISKCON Juja app</h3><div id="install-steps"></div><button type="button" class="button" id="install-close">Got it</button></div>';
      document.body.appendChild(d);
      d.addEventListener("click", function (e) { if (e.target === d || e.target.id === "install-close") d.hidden = true; });
    }
    document.getElementById("install-steps").innerHTML = isIOS
      ? '<ol><li>Tap the <b>Share</b> button (square with an arrow) at the bottom of Safari.</li><li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. The app is now on your home screen.</li></ol>'
      : '<ol><li>Tap the browser menu (the <b>&#8942;</b> three dots, top right).</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Tap <b>Install</b>. The app is now on your home screen.</li></ol>';
    d.hidden = false;
  }

  function onTap(e) {
    if (!onPortal) return; // on the public site the button is a plain link to the portal
    e.preventDefault();
    if (deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; }); }
    else steps();
  }

  function make(cls, tag) {
    var a = document.createElement(tag || "a");
    a.setAttribute("data-install-app", "");
    a.className = cls;
    a.innerHTML = "&#128241; Install the app";
    if (tag === "li") return a;
    if (onPortal) { a.href = "#"; a.setAttribute("role", "button"); } else { a.href = (H.portalOrigin || "") + "/dashboard.html?install=1"; }
    a.addEventListener("click", onTap);
    return a;
  }

  function mount() {
    var df = document.querySelector(".drawer-footer");
    if (df && !df.querySelector("[data-install-app]")) df.appendChild(make("button secondary install-btn"));
    var nav = document.querySelector(".ph-nav");
    if (onPortal && nav && !nav.querySelector("[data-install-app]")) nav.appendChild(make("ph-install"));
    if (onPortal && /[?&]install=1/.test(location.search)) { setTimeout(function () { if (deferred) { var b = document.querySelector("[data-install-app]"); if (b) b.classList.add("pulse"); } else if (isIOS || /Android/.test(ua)) steps(); }, 600); }
  }
  if (document.readyState === "complete") setTimeout(mount, 0); else window.addEventListener("load", function () { setTimeout(mount, 50); });
})();
