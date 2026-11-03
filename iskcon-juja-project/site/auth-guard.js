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

  function showPendingBanner(show) {
    var old = document.getElementById("appr-banner");
    if (!show) { if (old) old.remove(); return; }
    if (old) return;
    var b = document.createElement("div"); b.id = "appr-banner"; b.className = "gc-banner appr-banner"; b.setAttribute("role", "status");
    b.innerHTML = '<span>&#9203; <b>Pending admin approval.</b> You can use the member area meanwhile. An admin will review your registration soon.</span>';
    var ph = document.querySelector(".ph"); if (ph && ph.parentNode) ph.parentNode.insertBefore(b, ph.nextSibling); else document.body.insertBefore(b, document.body.firstChild);
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

    // Speed: the sign-in token is kept in this browser, and the role is remembered per person, so a returning member sees the page at once.
    // The role is then re-checked in the background (and the page is closed off if it no longer applies).
    var RK = "iskcon_role_", cached = null, uid0 = null;
    function allowed(role) { return require === "admin" ? (role === "admin" || role === "super_admin") : (role === "member" || role === "admin" || role === "super_admin"); }
    try { window.ISKCON_DATA.client.auth.getSession().then(function (s) {
      uid0 = s && s.data && s.data.session && s.data.session.user.id;
      try { cached = uid0 && localStorage.getItem(RK + uid0); } catch (e) {}
      if (cached && allowed(cached)) {
        window.ISKCON_CURRENT_ROLE = cached; document.body.classList.remove("auth-checking");
        try { if (localStorage.getItem("iskcon_appr_" + uid0) === "pending") setTimeout(function () { showPendingBanner(true); }, 0); } catch (e) {}
      }
    }); } catch (e) {}
    window.ISKCON_DATA.getSessionAndRole().then(function (r) {
      try { if (r.session) { localStorage.setItem(RK + r.session.user.id, r.role || "pending"); localStorage.setItem("iskcon_appr_" + r.session.user.id, r.approval || "approved"); } } catch (e) {}
      window.ISKCON_APPROVAL = r.approval || "approved";
      // Rejected: this is their last sign-in. Show the reason; closing it deletes the account.
      if (r.session && r.approval === "rejected") {
        document.body.classList.remove("auth-checking");
        document.body.innerHTML = '<main style="min-height:70vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:40px 20px;"><div style="max-width:520px;">' +
          '<h1>Your registration was not approved</h1><p style="margin-top:12px;">The admins left this message for you:</p>' +
          '<blockquote style="margin:14px 0;padding:12px 16px;border-left:4px solid var(--gold,#d4ac0d);background:rgba(0,0,0,.04);text-align:left;" id="rej-reason"></blockquote>' +
          '<p style="font-size:13px;">When you close this message your account is deleted. You are welcome to register again or contact us on WhatsApp.</p>' +
          '<p style="margin-top:16px;"><button class="button" id="rej-ok" type="button">Close and delete my account</button></p></div></main>';
        document.getElementById("rej-reason").textContent = r.reject_reason || "No reason was given.";
        document.getElementById("rej-ok").addEventListener("click", function () {
          window.ISKCON_DATA.finishRejection().then(function () { window.ISKCON_DATA.client.auth.signOut().then(function () { window.location.href = "index.html"; }); });
        });
        return;
      }
      // Pending approval: they can use everything, with a banner that stays until an admin approves.
      showPendingBanner(r.session && r.approval === "pending");
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
