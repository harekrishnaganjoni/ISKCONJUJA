// Register page: step 1 (details) -> step 2 (optional questions + consent) -> create the account.
// The details travel with the sign-up; the database saves the answers (supabase/member_onboarding.sql).
// The birth date stays in the sign-up until the first sign-in, when the app saves it as the person's own private birthday.
(function () {
  "use strict";
  var D = window.ISKCON_DATA, f = document.getElementById("reg-form");
  if (!f) return;
  var s1 = f.querySelector('[data-step="1"]'), s2 = f.querySelector('[data-step="2"]'), st1 = document.getElementById("reg-status1"), st2 = document.getElementById("reg-status2"), done = document.getElementById("reg-done");
  window.ISKCON_ONB.render(document.getElementById("ob-fields"), {});
  f.birth_date.max = new Date().toISOString().slice(0, 10);
  function tag(n) { document.querySelectorAll("[data-step-tag]").forEach(function (t) { t.classList.toggle("on", t.getAttribute("data-step-tag") === String(n)); }); }
  function go(n) { s1.hidden = n !== 1; s2.hidden = n !== 2; tag(n); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (!D || !D.READY) { st1.textContent = "Registration is not connected yet. Please check back soon."; document.getElementById("reg-next").disabled = true; return; }
  var gb = document.getElementById("google-reg-btn");
  if (gb) gb.addEventListener("click", function () { st1.style.color = "var(--muted)"; st1.textContent = "Opening Google..."; D.signInWithGoogle().then(function (r) { if (r && r.error) { st1.style.color = "#b33a2e"; st1.textContent = "Google sign-in is not available right now."; } }); });
  document.getElementById("reg-back").addEventListener("click", function () { go(1); });
  document.getElementById("reg-next").addEventListener("click", function () {
    var name = f.full_name.value.trim(), email = f.email.value.trim(), pw = f.password.value;
    if (!name) { st1.textContent = "Please enter your full name."; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { st1.textContent = "Please enter a valid email address."; return; }
    if (pw.length < 8) { st1.textContent = "The password needs at least 8 characters."; return; }
    if (f.birth_date.value && f.birth_date.value > f.birth_date.max) { st1.textContent = "The birth date cannot be in the future."; return; }
    st1.textContent = ""; go(2);
  });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (f.website.value) return;                       // hidden field: only robots fill it
    if (!f.consent.checked) { st2.style.color = "#b33a2e"; st2.textContent = "Please tick the box to agree, so we can create your account."; return; }
    var reg = window.ISKCON_ONB.read(f);
    reg.full_name = f.full_name.value.trim(); reg.initiated_name = f.initiated_name.value.trim(); reg.phone = f.phone.value.trim();
    reg.birth_date = f.birth_date.value || null; reg.consent = true;
    st2.style.color = "var(--muted)"; st2.textContent = "Creating your account...";
    document.getElementById("reg-go").disabled = true;
    D.signUp(f.email.value.trim(), f.password.value, reg).then(function (r) {
      document.getElementById("reg-go").disabled = false;
      if (r.error) { st2.style.color = "#b33a2e"; st2.textContent = /registered|exists/i.test(r.error.message) ? "That email already has an account. Please sign in (you can reset the password there)." : r.error.message; return; }
      f.hidden = true; document.querySelector(".reg-steps").hidden = true; done.hidden = false;
      if (r.data && r.data.session) {
        done.innerHTML = '<h2>Welcome!</h2><p>Your account is ready. An admin will approve it soon; until then you can use the member area.</p><p style="margin-top:14px;"><a class="button" href="dashboard.html">Go to my dashboard</a></p>';
      } else {
        done.innerHTML = '<h2>Almost there</h2><p>We sent a message to <b></b>. Open it and tap the link to confirm your email, then sign in. Check your spam folder if you do not see it.</p><p style="margin-top:14px;"><a class="button" href="devotees.html">Go to sign in</a></p>';
        done.querySelector("b").textContent = f.email.value.trim();
      }
    });
  });
})();
