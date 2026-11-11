// ============================================================
// ISKCON JUJA — shared Supabase data layer.
// Loaded on every page, after supabase-config.js.
// If supabase-config.js has not been filled in yet, everything
// here quietly does nothing and the site's honest empty states
// stay showing — nothing breaks.
// ============================================================
(function () {
  "use strict";

  var READY = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase);
  var client = READY ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- SITE SETTINGS: replaces the old hardcoded block ----------
  function loadSettings() {
    if (!READY) return Promise.resolve(null);
    return client.from("site_settings").select("key,value").then(function (r) {
      if (r.error || !r.data) return null;
      var out = {};
      r.data.forEach(function (row) {
        out[row.key] = row.value === "true" ? true : row.value === "false" ? false : row.value;
      });
      return out;
    });
  }

  function applySettings(settings) {
    if (!settings) return;
    window.ISKCON = window.ISKCON || {};
    window.ISKCON.SITE_SETTINGS = settings;
    document.querySelectorAll("[data-show-if]").forEach(function (el) {
      if (settings[el.getAttribute("data-show-if")]) el.hidden = false;
    });
    document.querySelectorAll("[data-setting-link]").forEach(function (el) {
      var v = settings[el.getAttribute("data-setting-link")];
      if (v) { el.setAttribute("href", /^(https?:\/\/|mailto:|tel:)/i.test(v) ? v : "https://" + v); el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener noreferrer"); el.hidden = false; }
    });
    document.querySelectorAll("[data-setting-text]").forEach(function (el) {
      var v = settings[el.getAttribute("data-setting-text")];
      if (v) el.textContent = v;
    });
    if (window.ISKCON.setWhatsApp) window.ISKCON.setWhatsApp(String(settings.whatsapp_primary || "").replace(/\D/g, ""), String(settings.whatsapp_secondary || "").replace(/\D/g, ""));
    document.dispatchEvent(new CustomEvent("iskcon:settings"));
  }

  // ---------- ARTICLES (homepage) ----------
  function renderArticles() {
    var box = document.querySelector("[data-articles-list]");
    if (!box || !READY) return;
    client.from("articles").select("*").eq("published", true).order("article_date", { ascending: false }).limit(6)
      .then(function (r) {
        if (r.error || !r.data || !r.data.length) return; // keep the honest empty state
        box.hidden = false;
        box.innerHTML = r.data.map(function (a) {
          return '<article class="card highlight" style="padding:20px;">' +
            '<div class="eyebrow">' + escapeHtml(a.author) + ' &middot; ' + escapeHtml(a.article_date) + '</div>' +
            '<h3>' + escapeHtml(a.title) + '</h3>' +
            '<p>' + escapeHtml(a.body).slice(0, 220) + (a.body.length > 220 ? "&hellip;" : "") + '</p>' +
            (a.source ? '<p style="font-size:12px;color:var(--muted)">Source: ' + escapeHtml(a.source) + '</p>' : '') +
            '</article>';
        }).join("");
      });
  }

  // ---------- SPECIAL EVENTS ----------
  function renderEvents() {
    var box = document.querySelector("[data-events-list]");
    if (!box || !READY) return;
    client.from("events").select("*").eq("published", true).order("start_date", { ascending: true })
      .then(function (r) {
        if (r.error || !r.data || !r.data.length) return;
        box.hidden = false;
        box.innerHTML = '<div class="card-grid-3">' + r.data.map(function (e) {
          var when = escapeHtml(e.start_date) + (e.end_date ? " &ndash; " + escapeHtml(e.end_date) : "");
          return '<article class="card">' +
            (e.image_url ? '<img src="' + escapeHtml(e.image_url) + '" alt="' + escapeHtml(e.title) + '" loading="lazy" style="width:100%;max-height:240px;object-fit:cover;border-radius:10px;margin-bottom:12px;display:block;">' : '') +
            '<div class="eyebrow">' + when + '</div>' +
            '<h3>' + escapeHtml(e.title) + '</h3>' +
            (e.speakers ? '<p><strong>With:</strong> ' + escapeHtml(e.speakers) + '</p>' : '') +
            (e.schedule ? '<p><strong>Schedule:</strong> ' + escapeHtml(e.schedule) + '</p>' : '') +
            (e.description ? '<p>' + escapeHtml(e.description) + '</p>' : '') +
            (e.start_time ? '<p><strong>Time:</strong> ' + escapeHtml(String(e.start_time).slice(0, 5)) + '</p>' : '') +
            '<div data-signup-event="' + escapeHtml(e.id) + '"></div>' +
            '</article>';
        }).join("") + '</div>';
        if (window.ISKCON_SIGNUP) {
          var byId = {}; r.data.forEach(function (e) { byId[e.id] = e; });
          box.querySelectorAll("[data-signup-event]").forEach(function (m) {
            var e = byId[m.getAttribute("data-signup-event")];
            window.ISKCON_SIGNUP.mount(m, e.title, e.id, e);
          });
        }
      });
  }

  // ---------- PRODUCTS (Merchandise) ----------
  function renderProducts() {
    var box = document.querySelector("[data-products-list]");
    if (!box || !READY) return;
    client.from("products").select("*").eq("published", true).order("created_at", { ascending: false })
      .then(function (r) {
        if (r.error || !r.data || !r.data.length) return;
        box.innerHTML = r.data.map(function (p) {
          var free = !p.price_kes || p.price_kes <= 0;
          var priceLine = free ? "Free" : "KES " + p.price_kes;
          var action = free && p.file_url
            ? '<a class="button secondary" href="' + escapeHtml(p.file_url) + '" target="_blank" rel="noopener">Download</a>'
            : '<a class="button" href="#" data-whatsapp="Hi ISKCON JUJA! I would like to buy: ' + escapeHtml(p.name) + '">Order (' + priceLine + ')</a>';
          var photo = p.image_url
            ? '<img src="' + escapeHtml(p.image_url) + '" alt="' + escapeHtml(p.name) + '" style="width:100%;height:180px;object-fit:cover;border-radius:6px;margin-bottom:12px;">'
            : '';
          var synopsisId = "synopsis-" + p.id;
          var synopsis = p.synopsis
            ? '<div id="' + synopsisId + '" hidden style="margin-top:8px;font-size:14px;color:var(--muted);">' + escapeHtml(p.synopsis) + '</div>' +
              '<button type="button" class="read-more-toggle" data-toggle-target="' + synopsisId + '" style="background:none;border:none;color:var(--maroon);font-weight:700;cursor:pointer;padding:0;text-decoration:underline;font-size:13px;margin-top:6px;">Read Synopsis</button>'
            : '';
          return '<article class="card highlight" data-category="' + escapeHtml(p.category || "") + '" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;">' +
            '<div>' + photo + '<div class="eyebrow">' + escapeHtml(p.category) + '</div><h3>' + escapeHtml(p.name) + '</h3>' +
            '<p>' + escapeHtml(p.description || "") + '</p>' + synopsis + '</div>' +
            '<div style="margin-top:16px;">' + action + '</div></article>';
        }).join("");
        var storeFilters = document.querySelector("[data-store-filters]");
        if (storeFilters) storeFilters.hidden = false; // the search only appears once there are products to search
        document.dispatchEvent(new CustomEvent("iskcon:rerender-whatsapp"));
        // re-wire the new "Read Synopsis" toggle buttons (site.js wires these on page load,
        // but these cards are added after that, so wire them here too)
        box.querySelectorAll(".read-more-toggle").forEach(function (btn) {
          if (btn._wired) return; btn._wired = true;
          btn.addEventListener("click", function () {
            var target = document.getElementById(btn.getAttribute("data-toggle-target"));
            if (!target) return;
            var nowHidden = !target.hidden;
            target.hidden = nowHidden;
            btn.textContent = nowHidden ? "Read Synopsis" : "Hide Synopsis";
          });
        });
      });
  }

  // ---------- COURSES (course catalog) ----------
  function renderCourses() {
    var box = document.querySelector("[data-courses-list]");
    if (!box || !READY) return;
    client.from("courses").select("*").eq("published", true).order("created_at", { ascending: false })
      .then(function (r) {
        if (r.error || !r.data || !r.data.length) return; // keep the honest empty state
        box.innerHTML = r.data.map(function (c) {
          return '<article class="card highlight" style="padding:22px;">' +
            '<h3>' + escapeHtml(c.title) + '</h3>' +
            (c.description ? '<p style="margin-top:8px;">' + escapeHtml(c.description) + '</p>' : '') +
            (c.schedule ? '<p style="margin-top:8px;font-size:13px;"><strong>Schedule:</strong> ' + escapeHtml(c.schedule) + '</p>' : '') +
            (c.how_to_join ? '<p style="margin-top:12px;"><a class="button secondary" href="#" data-whatsapp="Hi ISKCON JUJA! I would like to join: ' + escapeHtml(c.title) + '">' + escapeHtml(c.how_to_join) + '</a></p>' : '') +
            '</article>';
        }).join("");
        document.dispatchEvent(new CustomEvent("iskcon:rerender-whatsapp"));
      });
  }

  // ---------- AUTH (real login, replaces the old fake mockup) ----------
  // Note: there is no public self-signup. Member accounts are created
  // only by an admin, via the admin panel (which calls the
  // "admin-create-member" Edge Function using the secret service key
  // server-side). See supabase/functions/admin-create-member.
  function signIn(email, password) {
    if (!READY) return Promise.reject(new Error("Backend not configured yet."));
    return client.auth.signInWithPassword({ email: email, password: password });
  }
  // Continue with Google (no password, no email sent). New people arrive as "pending" until an admin approves them.
  function signInWithGoogle(next) {
    if (!READY) return Promise.reject(new Error("Backend not configured yet."));
    return client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/" + (next || "dashboard.html") } });
  }
  // Forgot password: sends a link by email. Works only once custom email (SMTP) is set up in Supabase.
  function requestPasswordReset(email) {
    if (!READY) return Promise.reject(new Error("Backend not configured yet."));
    return client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/devotees.html" });
  }
  function setNewPassword(password) {
    if (!READY) return Promise.reject(new Error("Backend not configured yet."));
    return client.auth.updateUser({ password: password });
  }
  // Calls back when the person arrives from a reset-password email link.
  function onPasswordRecovery(cb) {
    if (!READY) return;
    client.auth.onAuthStateChange(function (event) { if (event === "PASSWORD_RECOVERY") cb(); });
  }
  function signOut() {
    if (!READY) return Promise.resolve();
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf("iskcon_role_") === 0) localStorage.removeItem(k); }); } catch (e) {}
    return client.auth.signOut();
  }
  // Register: the details and answers travel with the sign-up (the database saves them safely; see supabase/member_onboarding.sql).
  function signUp(email, password, reg) {
    if (!READY) return Promise.resolve({ error: { message: "Registration is not connected yet." } });
    return client.auth.signUp({ email: email, password: password, options: { data: { reg: reg }, emailRedirectTo: location.origin + "/devotees.html" } });
  }
  function finishRejection() { return client.rpc("finish_rejection"); }
  function getSessionAndRole() {
    if (!READY) return Promise.resolve({ session: null, role: null });
    return client.auth.getSession().then(function (r) {
      var session = r.data && r.data.session;
      if (!session) return { session: null, role: null };
      return client.from("profiles").select("role,approval,reject_reason").eq("id", session.user.id).single().then(function (p) {
        return { session: session, role: p.data ? p.data.role : "pending", approval: p.data ? (p.data.approval || "approved") : "approved", reject_reason: p.data ? p.data.reject_reason : null };
      });
    });
  }

  // ---------- Floating contact button (message board + WhatsApp) ----------
  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("float-toggle");
    var menu = document.getElementById("float-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      menu.hidden = !menu.hidden;
      toggle.setAttribute("aria-expanded", String(!menu.hidden));
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== toggle) menu.hidden = true;
    });
  });

  // ---------- Sign-out controls (header, mobile drawer, member sub-nav) ----------
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".sign-out-trigger").forEach(function (out) {
      out.addEventListener("click", function (e) {
        e.preventDefault();
        signOut().then(function () { window.location.href = "devotees.html"; });
      });
    });
  });

  // ---------- QUOTE OF THE WEEK ----------
  // No built-in quotes: only quotes the owner approved in the Quote Library are ever shown.
  // When there are none yet (or the database cannot be reached) the quote card is hidden.
  function hideQuoteBox(box) {
    var sec = box.closest("section");
    (sec && sec.hasAttribute("data-toc") ? sec : box).hidden = true;
  }

  // Writes "- source" and, when the quote has a Vedabase link, a small "Read on Vedabase" link after it.
  function setSource(el, q) {
    if (!el) return;
    el.textContent = "\u2014 " + q.source;
    var old = el.nextElementSibling;
    if (old && old.hasAttribute("data-src-link")) old.remove();
    if (q.source_url && /^https:\/\/vedabase\.io\//.test(q.source_url)) {
      var a = document.createElement("a");
      a.setAttribute("data-src-link", ""); a.href = q.source_url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Read on Vedabase \u2192"; a.style.cssText = "font-size:13px;display:inline-block;margin-top:4px;";
      el.insertAdjacentElement("afterend", a);
    }
  }
  function renderVerseOfDay() {
    var box = document.querySelector("[data-verse-of-day]");
    if (!box) return;
    var textEl = box.querySelector("[data-verse-text]");
    var sourceEl = box.querySelector("[data-verse-source]");
    function paint(q) { if (textEl) textEl.textContent = q.quote_text; setSource(sourceEl, q); }
    box.hidden = true;
    if (!READY) return;
    client.rpc("get_verse_of_day").then(function (r) {
      if (r.error || !r.data || !r.data.length) return;
      box.hidden = false; paint(r.data[0]);
    }).catch(function () {});
  }


  // ---------- "What Srila Prabhupada said today" ----------
  // Quotes written or spoken on today's date in any year, or on the same lunar day (month + tithi) of the Vaishnava calendar.
  // The section stays hidden until the library has approved dated quotes for today.
  function renderSaidToday() {
    var box = document.querySelector("[data-said-today]");
    if (!box || !READY) return;
    var list = box.querySelector("[data-said-list]"), sec = box.closest("section") || box;
    sec.hidden = true;
    var n = new Date(), y = n.getFullYear(), m = n.getMonth() + 1, d = n.getDate();
    var md = (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
    var doy = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000);
    fetch("calendar-data/y" + y + ".json").then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (Y) {
        var day = Y && Y.days && Y.days[doy];
        return client.rpc("get_said_today", { p_md: md, p_masa: day ? day[1] : -1, p_tithi: day ? day[0] : -1, p_limit: 5 });
      }).then(function (r) {
        if (!r || r.error || !r.data || !r.data.length) return;
        list.innerHTML = "";
        r.data.forEach(function (q) {
          var item = document.createElement("div"); item.className = "said-item";
          var p = document.createElement("p"); p.className = "said-text"; p.textContent = "\u201C" + q.quote_text + "\u201D"; item.appendChild(p);
          var s = document.createElement("p"); s.className = "said-source"; item.appendChild(s);
          var lab = document.createElement("span"); lab.className = "said-tag";
          lab.textContent = q.match === "both" ? "Same date and same lunar day" : q.match === "date" ? "Said on this date" : "Said on this lunar day";
          item.appendChild(lab);
          setSource(s, q);
          list.appendChild(item);
        });
        sec.hidden = false;
      }).catch(function () {});
  }

  function renderQuote() {
    var box = document.querySelector("[data-quote-of-week]");
    if (!box) return;
    function paint(q) {
      var textEl = box.querySelector("[data-quote-text]");
      var sourceEl = box.querySelector("[data-quote-source]");
      if (textEl) textEl.textContent = q.quote_text;
      setSource(sourceEl, q);
    }
    hideQuoteBox(box);
    if (!READY) return;
    client.rpc("get_weekly_quote").then(function (r) {
      if (r.error || !r.data || !r.data.length) return;
      var sec = box.closest("section"); if (sec) sec.hidden = false; box.hidden = false;
      paint(r.data[0]);
    }).catch(function () {});
  }

  // ---------- TESTIMONIALS (homepage) ----------
  function renderTestimonials() {
    var box = document.querySelector("[data-testimonials-list]");
    if (!box || !READY) return;
    client.from("testimonials").select("*").eq("published", true).order("created_at", { ascending: false }).limit(9)
      .then(function (r) {
        if (r.error || !r.data || !r.data.length) return;
        box.hidden = false;
        box.innerHTML = r.data.map(function (t) {
          return '<article class="card" style="padding:18px;">' +
            '<p style="font-style:italic;">&ldquo;' + escapeHtml(t.message) + '&rdquo;</p>' +
            '<p style="margin-top:10px;font-weight:700;font-size:13px;color:var(--maroon);">&mdash; ' + escapeHtml(t.name) + '</p>' +
            '</article>';
        }).join("");
      });
  }

  // ---------- SPAM TRAP (honeypot) ----------
  // Adds an invisible field real people never see or fill. Bots that fill every field are
  // silently ignored (they are told "thank you" so they do not adapt).
  function addHoneypot(form) {
    if (form.querySelector("[data-hp]")) return;
    var w = document.createElement("div");
    w.setAttribute("aria-hidden", "true");
    w.style.cssText = "position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;";
    var i = document.createElement("input");
    i.type = "text"; i.name = "website"; i.tabIndex = -1; i.autocomplete = "off"; i.setAttribute("data-hp", "");
    w.appendChild(i); form.appendChild(w);
  }
  function trapped(form) { var i = form.querySelector("[data-hp]"); return !!(i && i.value); }

  function wireTestimonialForm() {
    var form = document.querySelector("[data-testimonial-form]");
    if (!form) return;
    var status = form.querySelector("[data-testimonial-status]");
    addHoneypot(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (trapped(form)) { if (status) status.textContent = "Thank you! Your testimonial will appear once an admin reviews it."; form.reset(); return; }
      if (!READY) { if (status) status.textContent = "Not connected yet — please check back soon."; return; }
      var f = new FormData(form);
      if (status) status.textContent = "Sending...";
      client.from("testimonials").insert({ name: f.get("name") || "Anonymous", message: f.get("message") }).then(function (r) {
        if (status) status.textContent = r.error ? r.error.message : "Thank you! Your testimonial will appear once an admin reviews it.";
        if (!r.error) form.reset();
      });
    });
  }

  // ---------- CHANGE MY PASSWORD (member dashboard) ----------
  function wireChangePassword() {
    var form = document.querySelector("[data-change-password-form]");
    if (!form) return;
    var status = form.querySelector("[data-change-password-status]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!READY) return;
      var f = new FormData(form);
      if (f.get("password") !== f.get("confirm")) {
        status.style.color = "#b33a2e";
        status.textContent = "The two passwords don't match.";
        return;
      }
      status.style.color = "var(--muted)";
      status.textContent = "Updating...";
      client.auth.updateUser({ password: f.get("password") }).then(function (r) {
        status.style.color = r.error ? "#b33a2e" : "#2E7D32";
        status.textContent = r.error ? r.error.message : "Password updated.";
        if (!r.error) form.reset();
      });
    });
  }

  // ---------- MESSAGE BOARD (public site) ----------
  // Everything posted here is public, unless the visitor chooses "Only the admins".
  // Private one-to-one messages exist only in the member portal (portal-board.html).
  function boardNameOk(n) {
    return !/(admin|moderator|iskcon|official)/.test(String(n || "").toLowerCase().replace(/[^a-z0-9]/g, ""));
  }
  function boardBadge(m) {
    if (m.author_kind === "admin" || m.is_admin_reply) return ' <span class="board-badge board-badge-admin">Admin</span>';
    if (m.author_kind === "member") return ' <span class="board-badge">Member</span>';
    return ' <span class="board-badge board-badge-guest">Guest</span>';
  }
  function renderBoard() {
    var box = document.querySelector("[data-board-list]");
    if (!box || !READY) return;
    client.from("board_messages").select("*").eq("visibility", "public").eq("hidden", false).order("created_at", { ascending: true })
      .then(function (r) {
        // before the Message Board v2 SQL has been run, the column does not exist yet: use the old query
        if (r.error) return client.from("board_messages").select("*").eq("hidden", false).order("created_at", { ascending: true });
        return r;
      }).then(function (r) {
        if (r.error || !r.data) return;
        var byParent = {};
        r.data.forEach(function (m) { (byParent[m.parent_id || "root"] = byParent[m.parent_id || "root"] || []).push(m); });
        function renderThread(list) {
          return (list || []).map(function (m) {
            var replies = byParent[m.id] || [];
            return '<div class="board-msg" data-msg-id="' + m.id + '">' +
              '<strong class="board-author">' + escapeHtml(m.author_name) + boardBadge(m) + '</strong>' +
              '<p class="board-body">' + escapeHtml(m.body) + '</p>' +
              '<span class="board-date">' + new Date(m.created_at).toLocaleDateString() + '</span> ' +
              '<button type="button" class="board-reply-toggle" data-reply-to="' + m.id + '">Reply</button>' +
              '<div class="board-reply-form-slot" data-reply-slot="' + m.id + '" hidden></div>' +
              (replies.length ? '<div class="board-replies">' + renderThread(replies) + '</div>' : '') +
              '</div>';
          }).join("");
        }
        box.innerHTML = renderThread(byParent.root) || '<p class="board-empty">No messages yet. Be the first to say hello.</p>';
        wireReplyButtons(box);
      });
  }

  function replyFormHtml(parentId) {
    return '<form class="board-reply-form" data-reply-form data-parent-id="' + parentId + '">' +
      '<input type="text" name="author_name" maxlength="40" autocomplete="nickname" placeholder="Your name (optional)">' +
      '<textarea name="body" maxlength="2000" placeholder="Write a reply..." required></textarea>' +
      '<button class="button secondary" type="submit">Post Reply</button>' +
      '<p class="board-status" data-board-status></p>' +
      '</form>';
  }

  function wireReplyButtons(scope) {
    scope.querySelectorAll(".board-reply-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var slot = scope.querySelector('[data-reply-slot="' + btn.getAttribute("data-reply-to") + '"]');
        if (!slot) return;
        if (slot.hidden) { slot.innerHTML = replyFormHtml(btn.getAttribute("data-reply-to")); slot.hidden = false; wireSingleBoardForm(slot.querySelector("[data-reply-form]")); }
        else { slot.hidden = true; slot.innerHTML = ""; }
      });
    });
  }

  function wireSingleBoardForm(form) {
    if (!form) return;
    var status = form.querySelector("[data-board-status]");
    function say(t, bad) { if (status) { status.textContent = t; status.style.color = bad ? "#b33a2e" : "var(--muted)"; } }
    var toAdmins = form.querySelectorAll('input[name="audience"]');
    var contactBox = form.querySelector("[data-board-contact-box]");
    function audience() { var c = form.querySelector('input[name="audience"]:checked'); return c ? c.value : "public"; }
    toAdmins.forEach(function (r) { r.addEventListener("change", function () { if (contactBox) contactBox.hidden = audience() !== "admin"; }); });
    addHoneypot(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!READY) return;
      if (trapped(form)) { form.reset(); return; }
      var f = new FormData(form);
      var name = String(f.get("author_name") || "").trim();
      var vis = audience();
      var contact = String(f.get("contact") || "").trim();
      if (name && !boardNameOk(name)) { say("That name is reserved. Please choose another name.", true); return; }
      if (vis === "admin" && !contact) { say("Please leave a phone number or email so the admins can reply to you.", true); return; }
      var row = {
        author_name: name || "Anonymous", is_anonymous: !name, body: f.get("body"),
        parent_id: form.getAttribute("data-parent-id") || null, visibility: vis
      };
      if (vis === "admin") row.contact = contact;
      var btn = form.querySelector('button[type="submit"]'); if (btn) btn.disabled = true;
      client.from("board_messages").insert(row).then(function (r) {
        if (r.error && /visibility|contact|column/i.test(r.error.message || "")) {
          // Message Board v2 SQL not run yet: public posts still work in the old way
          if (vis === "admin") return { error: { message: "Writing to the admins only is not switched on yet. Please try again soon, or use the WhatsApp button." } };
          var old = { author_name: row.author_name, is_anonymous: row.is_anonymous, body: row.body, parent_id: row.parent_id };
          return client.from("board_messages").insert(old);
        }
        return r;
      }).then(function (r) {
        if (btn) btn.disabled = false;
        if (r.error) { say(r.error.message, true); return; }
        form.reset();
        if (contactBox) contactBox.hidden = true;
        if (vis === "admin") say("Sent to the admins only. They will reply on the contact you left.");
        else { say(""); renderBoard(); }
      });
    });
  }

  function wireBoardForm() {
    wireSingleBoardForm(document.querySelector("[data-board-form]"));
  }

  // ---------- ROLE-AWARE NAV (member browsing any page sees only internal links) ----------
  function applyRoleNav() {
    if (!READY) return;
    // The public website knows nothing about logins: it never shows Dashboard, My Courses, Sign Out or the admin lock.
    // Only the member portal pages show those (portal.js marks them with ISKCON_IN_PORTAL).
    if (!window.ISKCON_IN_PORTAL) {
      document.querySelectorAll("[data-member-nav], [data-admin-nav]").forEach(function (el) { el.hidden = true; });
      return;
    }
    getSessionAndRole().then(function (r) {
      var isMember = !!r.session && (r.role === "member" || r.role === "admin" || r.role === "super_admin");
      var isAdmin = !!r.session && (r.role === "admin" || r.role === "super_admin");
      document.querySelectorAll("[data-member-nav]").forEach(function (el) { el.hidden = !isMember; });
      document.querySelectorAll("[data-admin-nav]").forEach(function (el) { el.hidden = !isAdmin; });
    });
  }

  // ---------- ADMIN-EDITABLE HOMEPAGE PHOTO ----------
  function applyHomepageHero(settings) {
    var hero = document.querySelector("[data-homepage-hero]");
    if (!hero || !settings || !settings.homepage_hero_image_url) return;
    hero.style.backgroundImage =
      "linear-gradient(var(--hero-overlay), rgba(26, 18, 21, 0.82)), url('" + settings.homepage_hero_image_url + "')";
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", function () {
    renderQuote(); // hides itself until the library has approved quotes
    renderSaidToday(); // hidden until there are approved dated quotes for today
    renderVerseOfDay(); // same — works today, no backend required
    wireTestimonialForm();
    wireChangePassword();
    wireBoardForm();
    if (READY) {
      loadSettings().then(function (s) { applySettings(s); applyHomepageHero(s); });
      renderArticles();
      renderEvents();
      renderProducts();
      renderCourses();
      renderTestimonials();
      renderBoard();
      applyRoleNav();
    }
  });

  window.ISKCON_DATA = {
    READY: READY, client: client,
    signIn: signIn, signUp: signUp, finishRejection: finishRejection, signOut: signOut, getSessionAndRole: getSessionAndRole,
    signInWithGoogle: signInWithGoogle, requestPasswordReset: requestPasswordReset, setNewPassword: setNewPassword, onPasswordRecovery: onPasswordRecovery
  };
})();
