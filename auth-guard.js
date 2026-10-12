// ============================================================
// AUTH GUARD — include on any page that must only be seen by a
// signed-in member ("member") or a signed-in admin ("admin").
// Usage: <script src="auth-guard.js" data-require="admin"></script>
// Must load AFTER data.js. While checking, the page content is
// hidden (via the "auth-checking" class on <body>) so nobody
// ever sees a flash of protected content before the redirect.
// ============================================================
(function () {
  "use strict";
  document.body.classList.add("auth-checking");

  function ready(fn) {
    if (window.ISKCON_DATA) fn(); else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var thisScript = document.currentScript || document.querySelector('script[src="auth-guard.js"]');
    var require = (thisScript && thisScript.getAttribute("data-require")) || "member";

    if (!window.ISKCON_DATA || !window.ISKCON_DATA.READY) {
      // Backend not connected yet: nothing to check against, so send
      // everyone to the login page rather than show a half-working page.
      window.location.href = "devotees.html";
      return;
    }

    window.ISKCON_DATA.getSessionAndRole().then(function (r) {
      var role = r.role;
      var loggedIn = !!r.session;
      var isMember = loggedIn && (role === "member" || role === "admin" || role === "super_admin");
      var isAdmin = loggedIn && (role === "admin" || role === "super_admin");

      if (!loggedIn) { window.location.href = "devotees.html"; return; }
      if (require === "admin" && !isAdmin) { window.location.href = "dashboard.html"; return; }
      if (require === "member" && !isMember) {
        // Signed in but still "pending" approval
        document.body.classList.remove("auth-checking");
        document.body.innerHTML =
          '<main style="min-height:70vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:40px 20px;">' +
          '<div><h1>Your account is awaiting approval</h1>' +
          '<p>An admin needs to approve your account before you can access the member area.</p>' +
          '<p style="margin-top:16px;"><a class="button" href="index.html">Back to Homepage</a></p></div></main>';
        return;
      }
      // Passed — reveal the page and expose the role for pages that need it
      window.ISKCON_CURRENT_ROLE = role;
      document.body.classList.remove("auth-checking");
    });
  });
})();
