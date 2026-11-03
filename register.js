// Register page: step 1 (details) -> step 2 (optional questions + consent) -> create the account.
// The details travel with the sign-up; the database saves the answers (supabase/member_onboarding.sql).
// The birth date stays in the sign-up until the first sign-in, when the app saves it as the person's own private birthday.
(function () {
  "use strict";
  var D = window.ISKCON_DATA, f = document.getElementById("reg-form");
  if (!f) return;
  var s1 = f.querySelector('[data-step="1"]'), s2 = f.querySelector('[data-step="2"]'), st1 = document.getElementById("reg-status1"), st2 = document.getElementById("reg-status2"), done = document.getElementById("reg-done");
  f.birth_date.max = new Date().toISOString().slice(0, 10);
  function tag(n) { document.querySelectorAll("[data-step-tag]").forEach(function (t) { t.classList.toggle("on", t.getAttribute("data-step-tag") === String(n)); }); }
  function go(n) { s1.hidden = n !== 1; s2.hidden = n !== 2; tag(n); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (!D || !D.READY) { st1.textContent = "Registration is not connected yet. Please check back soon."; document.getElementById("reg-next").disabled = true; return; }
  var gb = document.getElementById("google-reg-btn");
  if (gb) gb.addEventListener("click", function () { st1.style.color = "var(--muted)"; st1.textContent = "Opening Google..."; D.signInWithGoogle().then(function (r) { if (r && r.error) { st1.style.color = "#b33a2e"; st1.textContent = "Google sign-in is not available right now."; } }); });
  // ---- survey: one question at a time ----
  var O = window.ISKCON_ONB.OPTIONS, A = { rounds: "", principles: [], why: [], why_other: "", hope: [], hope_other: "", how_heard: "", area: "", contact_pref: "" };
  var Q = [
    { key: "rounds", type: "one", title: "How many rounds do you chant daily?", opts: O.rounds.slice(1) },
    { key: "principles", type: "many", title: "Which of the four regulative principles are part of your life at the moment?", hint: "Tick any. It is fine to tick none.", opts: O.principles },
    { key: "why", type: "many", other: "why_other", title: "What brought you to ISKCON?", hint: "Tick any.", opts: O.why },
    { key: "hope", type: "many", other: "hope_other", title: "What do you hope to gain from this site and app?", hint: "Tick any.", opts: O.hope },
    { key: "how_heard", type: "one", title: "How did you hear about us?", opts: O.heard.slice(1).map(function (x) { return [x, x]; }) },
    { key: "area", type: "text", title: "Where do you stay?", hint: "Your area, for example Juja or Kalimoni." },
    { key: "contact_pref", type: "one", title: "How should we reach you?", opts: O.contact.slice(1) }
  ], qi = 0;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var $ = function (id) { return document.getElementById(id); };
  function showIntro() { $("sv-intro").hidden = false; $("sv-q").hidden = true; $("sv-final").hidden = true; }
  function showFinal() { $("sv-intro").hidden = true; $("sv-q").hidden = true; $("sv-final").hidden = false; }
  function save() {
    var q = Q[qi], box = $("sv-opts");
    if (q.type === "one") { var c = box.querySelector("input:checked"); A[q.key] = c ? c.value : ""; }
    else if (q.type === "many") { A[q.key] = Array.prototype.map.call(box.querySelectorAll("input[type=checkbox]:checked"), function (c) { return c.value; }); if (q.other) A[q.other] = box.querySelector("input[type=text]").value.trim(); }
    else { A[q.key] = box.querySelector("input").value.trim(); }
  }
  function showQ() {
    var q = Q[qi]; $("sv-intro").hidden = true; $("sv-final").hidden = true; $("sv-q").hidden = false;
    $("sv-count").textContent = "Question " + (qi + 1) + " of " + Q.length; $("sv-fill").style.width = Math.round((qi / Q.length) * 100) + "%";
    $("sv-title").textContent = q.title; $("sv-hint").textContent = q.hint || "";
    var cur = A[q.key], h = "";
    if (q.type === "text") h = '<input type="text" maxlength="100" value="' + esc(cur) + '" class="sv-text">';
    else {
      h = '<div class="sv-grid">' + q.opts.map(function (o) {
        var on = q.type === "one" ? cur === o[0] : (cur || []).indexOf(o[0]) >= 0;
        return '<label class="sv-opt' + (on ? " on" : "") + '"><input type="' + (q.type === "one" ? "radio" : "checkbox") + '" name="sv" value="' + esc(o[0]) + '"' + (on ? " checked" : "") + '><span>' + esc(o[1]) + '</span></label>';
      }).join("") + '</div>';
      if (q.other) h += '<input type="text" maxlength="300" class="sv-text" placeholder="Something else (optional)" value="' + esc(A[q.other]) + '">';
    }
    $("sv-opts").innerHTML = h; $("sv-next").textContent = qi === Q.length - 1 ? "Finish" : "Next";
  }
  $("sv-opts").addEventListener("change", function (e) { var l = e.target.closest(".sv-opt"); if (!l) return; if (e.target.type === "radio") $("sv-opts").querySelectorAll(".sv-opt").forEach(function (x) { x.classList.remove("on"); }); l.classList.toggle("on", e.target.checked); });
  $("sv-start").addEventListener("click", function () { qi = 0; showQ(); });
  $("sv-skipall").addEventListener("click", function (e) { e.preventDefault(); showFinal(); });
  $("sv-next").addEventListener("click", function () { save(); if (qi >= Q.length - 1) showFinal(); else { qi++; showQ(); } });
  $("sv-skip").addEventListener("click", function () { var q = Q[qi]; A[q.key] = q.type === "many" ? [] : ""; if (q.other) A[q.other] = ""; if (qi >= Q.length - 1) showFinal(); else { qi++; showQ(); } });
  $("sv-prev").addEventListener("click", function () { save(); if (qi === 0) showIntro(); else { qi--; showQ(); } });
  $("sv-fback").addEventListener("click", function () { qi = Q.length - 1; showQ(); });
  function answers() { return JSON.parse(JSON.stringify(A)); }
  document.getElementById("reg-back").addEventListener("click", function () { go(1); });
  document.getElementById("reg-next").addEventListener("click", function () {
    var name = f.full_name.value.trim(), email = f.email.value.trim(), pw = f.password.value;
    if (!name) { st1.textContent = "Please enter your full name."; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { st1.textContent = "Please enter a valid email address."; return; }
    if (pw.length < 8) { st1.textContent = "The password needs at least 8 characters."; return; }
    if (f.birth_date.value && f.birth_date.value > f.birth_date.max) { st1.textContent = "The birth date cannot be in the future."; return; }
    st1.textContent = ""; go(2); showIntro();
  });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (f.website.value) return;                       // hidden field: only robots fill it
    if (!f.consent.checked) { st2.style.color = "#b33a2e"; st2.textContent = "Please tick the box to agree, so we can create your account."; return; }
    var reg = answers();
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
