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
            '</article>';
        }).join("") + '</div>';
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
    return client.auth.signOut();
  }
  function getSessionAndRole() {
    if (!READY) return Promise.resolve({ session: null, role: null });
    return client.auth.getSession().then(function (r) {
      var session = r.data && r.data.session;
      if (!session) return { session: null, role: null };
      return client.from("profiles").select("role").eq("id", session.user.id).single().then(function (p) {
        return { session: session, role: p.data ? p.data.role : "pending" };
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
  // 25 starter quotes, embedded here as a zero-backend fallback so
  // this works even before Supabase is connected. Same 25 rows are
  // seeded into the "quotes" table (see supabase/schema.sql) — once
  // the backend is live, get_weekly_quote() takes over and this
  // local list is only used if that call fails for any reason.
  var FALLBACK_QUOTES = [
    { quote_text: "For one who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his mind will remain the greatest enemy.", source: "Bhagavad-gita 6.6" },
    { quote_text: "One who is not connected with the Supreme can have neither steady intelligence nor a peaceful mind, without which there is no possibility of happiness.", source: "Bhagavad-gita 2.66" },
    { quote_text: "A person who is not disturbed by the incessant flow of desires can alone achieve peace, and not the man who strives to satisfy such desires.", source: "Bhagavad-gita 2.70" },
    { quote_text: "A person who has given up all desires for sense gratification, who lives free from desires and false ego, alone can attain real peace.", source: "Bhagavad-gita 2.71" },
    { quote_text: "As a lamp in a windless place does not waver, so the transcendentalist, whose mind is controlled, remains always steady in meditation.", source: "Bhagavad-gita 6.19" },
    { quote_text: "There is no possibility of one becoming a yogi if one eats too much or eats too little, sleeps too much or does not sleep enough.", source: "Bhagavad-gita 6.16" },
    { quote_text: "He who is regulated in eating, sleeping, recreation and work can mitigate all material pains by practicing the yoga system.", source: "Bhagavad-gita 6.17" },
    { quote_text: "The nonpermanent appearance of happiness and distress arise from sense perception, and one must learn to tolerate them without being disturbed.", source: "Bhagavad-gita 2.14" },
    { quote_text: "That which at first tastes like poison but at last tastes like nectar, and which awakens one to self-realization, is happiness in the mode of goodness.", source: "Bhagavad-gita 18.37" },
    { quote_text: "It is undoubtedly very difficult to curb the restless mind, but it is possible by suitable practice and by detachment.", source: "Bhagavad-gita 6.35" },
    { quote_text: "For one who has conquered the mind, happiness and distress, heat and cold, honor and dishonor are all the same.", source: "Bhagavad-gita 6.7" },
    { quote_text: "One who is not disturbed in mind amidst the threefold miseries, or elated by happiness, and is free from attachment, fear and anger, is a sage of steady mind.", source: "Bhagavad-gita 2.56" },
    { quote_text: "A person free from all attachment and aversion, able to control the senses through regulative principles, can obtain the complete mercy of the Lord.", source: "Bhagavad-gita 2.64" },
    { quote_text: "For one thus satisfied, the threefold miseries of material existence exist no longer; one's intelligence is soon well established.", source: "Bhagavad-gita 2.65" },
    { quote_text: "The self-realized person is always in trance, enjoying pleasure within, and in this way enjoys unlimited happiness by concentrating on the Supreme.", source: "Bhagavad-gita 5.21" },
    { quote_text: "Those who are free from anger and all material desires, self-realized and constantly endeavoring for perfection, are assured of liberation very soon.", source: "Bhagavad-gita 5.26" },
    { quote_text: "One must deliver himself with the help of his own mind, and not degrade himself. The mind is the friend of the soul, and its enemy as well.", source: "Bhagavad-gita 6.5" },
    { quote_text: "When one's mental activities are disciplined and situated in transcendence, devoid of all material desires, one is said to be well established in yoga.", source: "Bhagavad-gita 6.18" },
    { quote_text: "Established thus, one is never shaken, even in the midst of the greatest difficulty.", source: "Bhagavad-gita 6.22" },
    { quote_text: "From wherever the mind wanders due to its flickering and unsteady nature, one must certainly withdraw it and bring it back under control.", source: "Bhagavad-gita 6.26" },
    { quote_text: "He by whom no one is put into difficulty, and who is not disturbed by anyone, equal in happiness and distress, is very dear to the Lord.", source: "Bhagavad-gita 12.15" },
    { quote_text: "You cannot stop thinking, but you can change the quality of your thinking.", source: "Srila Prabhupada, Lecture, Los Angeles, 8 Jan 1974" },
    { quote_text: "Peace cannot be achieved by mechanical means; peace is a state of consciousness.", source: "Srila Prabhupada, Lecture, New York, 20 Dec 1966" },
    { quote_text: "Simple living and high thinking is the solution to all problems.", source: "Srila Prabhupada, Letter to Vrindavan, 12 Aug 1971" },
    { quote_text: "Krishna consciousness is not a sectarian religious cult. It is a science of the soul, a universal cultural movement for the spiritual re-education of all human society.", source: "Srila Prabhupada, Letter to Dr. Bigelow, 26 Mar 1971" }
  ];

  function isoWeekKey(d) {
    var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return date.getUTCFullYear() + "-W" + String(weekNo).padStart(2, "0");
  }

  function fallbackQuoteOfWeek() {
    var key = isoWeekKey(new Date());
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return FALLBACK_QUOTES[hash % FALLBACK_QUOTES.length];
  }

  // "Verse of the Day" reuses the same curated quote pool as the weekly
  // quote, but rotates daily instead of weekly, using a different seed,
  // so the two don't just show the same thing all week. This is a
  // genuinely working first version (not a placeholder) while a proper
  // dedicated verse-selection engine is designed — see the README.
  function dayKey(d) {
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function fallbackVerseOfDay() {
    var key = "verse-" + dayKey(new Date());
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return FALLBACK_QUOTES[hash % FALLBACK_QUOTES.length];
  }
  function renderVerseOfDay() {
    var box = document.querySelector("[data-verse-of-day]");
    if (!box) return;
    var q = fallbackVerseOfDay();
    var textEl = box.querySelector("[data-verse-text]");
    var sourceEl = box.querySelector("[data-verse-source]");
    if (textEl) textEl.textContent = q.quote_text;
    if (sourceEl) sourceEl.textContent = "\u2014 " + q.source;
  }

  function renderQuote() {
    var box = document.querySelector("[data-quote-of-week]");
    if (!box) return;
    function paint(q) {
      var textEl = box.querySelector("[data-quote-text]");
      var sourceEl = box.querySelector("[data-quote-source]");
      if (textEl) textEl.textContent = q.quote_text;
      if (sourceEl) sourceEl.textContent = "\u2014 " + q.source;
    }
    if (!READY) { paint(fallbackQuoteOfWeek()); return; }
    client.rpc("get_weekly_quote").then(function (r) {
      if (r.error || !r.data || !r.data.length) { paint(fallbackQuoteOfWeek()); return; }
      paint(r.data[0]);
    }).catch(function () { paint(fallbackQuoteOfWeek()); });
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

  // ---------- MESSAGE BOARD ----------
  function renderBoard() {
    var box = document.querySelector("[data-board-list]");
    if (!box || !READY) return;
    client.from("board_messages").select("*").eq("hidden", false).order("created_at", { ascending: true })
      .then(function (r) {
        if (r.error || !r.data) return;
        var byParent = {};
        r.data.forEach(function (m) { (byParent[m.parent_id || "root"] = byParent[m.parent_id || "root"] || []).push(m); });
        function renderThread(list) {
          return (list || []).map(function (m) {
            var replies = byParent[m.id] || [];
            return '<div class="board-msg" data-msg-id="' + m.id + '" style="padding:12px;background:var(--row-tint);border-radius:6px;margin-bottom:10px;">' +
              '<strong style="font-size:13px;">' + escapeHtml(m.author_name) + (m.is_admin_reply ? ' <span style="color:var(--maroon);font-size:11px;">(Admin)</span>' : '') + '</strong>' +
              '<p style="margin:4px 0;">' + escapeHtml(m.body) + '</p>' +
              '<span style="font-size:11px;color:var(--muted);">' + new Date(m.created_at).toLocaleDateString() + '</span> ' +
              '<button type="button" class="board-reply-toggle" data-reply-to="' + m.id + '" style="background:none;border:none;color:var(--maroon);font-size:12px;font-weight:700;cursor:pointer;text-decoration:underline;margin-left:8px;">Reply</button>' +
              '<div class="board-reply-form-slot" data-reply-slot="' + m.id + '" hidden style="margin-top:8px;"></div>' +
              (replies.length ? '<div style="margin-left:20px;margin-top:8px;border-left:2px solid var(--line);padding-left:12px;">' + renderThread(replies) + '</div>' : '') +
              '</div>';
          }).join("");
        }
        box.innerHTML = renderThread(byParent.root) || '<p style="font-size:14px;color:var(--muted);">No messages yet — be the first to say hello.</p>';
        wireReplyButtons(box);
      });
  }

  function replyFormHtml(parentId) {
    return '<form class="board-reply-form" data-reply-form data-parent-id="' + parentId + '" style="display:flex;flex-direction:column;gap:8px;">' +
      '<label style="font-size:12px;display:flex;align-items:center;gap:6px;"><input type="checkbox" data-board-register-check style="width:auto;"> Show my name</label>' +
      '<input type="text" name="author_name" placeholder="Your name" data-board-name-field hidden style="padding:8px;border:1px solid var(--line);border-radius:4px;font-size:13px;">' +
      '<textarea name="body" placeholder="Write a reply..." required style="padding:8px;border:1px solid var(--line);border-radius:4px;font-size:13px;min-height:60px;"></textarea>' +
      '<button class="button secondary" type="submit" style="font-size:12px;padding:6px 12px;min-height:auto;width:fit-content;">Post Reply</button>' +
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
    var wantsName = form.querySelector("[data-board-register-check]");
    var nameField = form.querySelector("[data-board-name-field]");
    if (wantsName && nameField) wantsName.addEventListener("change", function () { nameField.hidden = !wantsName.checked; });
    addHoneypot(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!READY) return;
      if (trapped(form)) { form.reset(); return; }
      var f = new FormData(form);
      var registering = wantsName && wantsName.checked;
      var name = registering ? (f.get("author_name") || "Anonymous") : "Anonymous";
      client.from("board_messages").insert({
        author_name: name, is_anonymous: !registering, body: f.get("body"), parent_id: form.getAttribute("data-parent-id") || null
      }).then(function (r) { if (!r.error) renderBoard(); });
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
    renderQuote(); // works with or without a backend (has a local fallback)
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
    signIn: signIn, signOut: signOut, getSessionAndRole: getSessionAndRole,
    signInWithGoogle: signInWithGoogle, requestPasswordReset: requestPasswordReset, setNewPassword: setNewPassword, onPasswordRecovery: onPasswordRecovery
  };
})();
