// ============================================================
// Admin console logic. Loaded only on admin.html, after
// data.js and auth-guard.js. Talks directly to Supabase using
// window.ISKCON_DATA.client (same client data.js uses).
// ============================================================
(function () {
  "use strict";

  function ready(fn) {
    if (window.ISKCON_DATA && window.ISKCON_DATA.READY) fn();
    else document.addEventListener("DOMContentLoaded", function () {
      if (window.ISKCON_DATA && window.ISKCON_DATA.READY) fn();
    });
  }

  ready(function () {
    var client = window.ISKCON_DATA.client;

    // ---------- Tabs ----------
    (function () {
      var layout = document.getElementById("admin-layout"), btn = document.getElementById("admin-collapse");
      if (!layout || !btn) return;
      var collapsed = false;
      try { collapsed = localStorage.getItem("admin-menu-collapsed") === "1"; } catch (e) {}
      function apply() { layout.classList.toggle("admin-collapsed", collapsed); btn.innerHTML = collapsed ? "&#8250;" : "&#8249;"; btn.setAttribute("aria-label", collapsed ? "Expand menu" : "Collapse menu"); }
      btn.addEventListener("click", function () { collapsed = !collapsed; try { localStorage.setItem("admin-menu-collapsed", collapsed ? "1" : "0"); } catch (e) {} apply(); });
      apply();
    })();
    // Each major section is its own page in the portal header; its sub-pages live in the side menu.
    var SECTIONS = { overview: ["overview"], community: ["people", "responses", "aboutq", "testimonials", "registrations"], content: ["events", "quotes", "courses", "articles"], shop: ["products", "card", "flyer", "pamphlet", "settings"] };
    var SEC_TITLES = { overview: "Overview", community: "People & community", content: "Content", shop: "Shop & site" };
    function sectionOf(tab) { for (var k in SECTIONS) if (SECTIONS[k].indexOf(tab) >= 0) return k; return "overview"; }
    function paintSection(sec) {
      var tabs = SECTIONS[sec] || SECTIONS.overview, lay = document.getElementById("admin-layout");
      document.querySelectorAll(".admin-tab-btn").forEach(function (b) { b.hidden = tabs.indexOf(b.getAttribute("data-tab")) < 0; });
      document.querySelectorAll(".admin-group-label").forEach(function (l) { l.hidden = true; });
      if (lay) { lay.classList.toggle("no-side", tabs.length < 2); lay.setAttribute("data-section", sec); }
      var h = document.getElementById("admin-side-title"); if (h) h.textContent = SEC_TITLES[sec];
      document.querySelectorAll(".ph-nav a[data-sec]").forEach(function (a) { var on = a.getAttribute("data-sec") === sec; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    }
    function openSection(sec) {
      if (!SECTIONS[sec]) sec = "overview";
      paintSection(sec);
      var cur = document.querySelector(".admin-tab-btn.active"), curTab = cur && cur.getAttribute("data-tab");
      if (SECTIONS[sec].indexOf(curTab) < 0) { var b = document.querySelector('.admin-tab-btn[data-tab="' + SECTIONS[sec][0] + '"]'); if (b) b.click(); }
    }
    window.addEventListener("hashchange", function () { openSection((location.hash || "#overview").slice(1)); });
    document.querySelectorAll(".admin-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".admin-tab-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var tab = btn.getAttribute("data-tab");
        var sec = sectionOf(tab); paintSection(sec);
        try { if (location.hash !== "#" + sec) history.replaceState(null, "", "#" + sec); } catch (e) {}
        document.querySelectorAll(".admin-tab-panel").forEach(function (p) {
          p.hidden = p.getAttribute("data-tab-panel") !== tab;
        });
      });
    });

    openSection((location.hash || "#overview").slice(1));

    // ---------- Overview: counts, quick links, badges ----------
    function goTab(tab) { var b = document.querySelector('.admin-tab-btn[data-tab="' + tab + '"]'); if (b) b.click(); window.scrollTo({ top: 0 }); }
    document.addEventListener("click", function (e) { var g = e.target.closest("[data-goto]"); if (g) goTab(g.getAttribute("data-goto")); });
    function setBadge(id, n) { var el = document.getElementById(id); if (!el) return; el.hidden = !n; el.textContent = n || ""; }
    function loadOverview() {
      var today = new Date().toISOString().slice(0, 10);
      function cnt(q) { return q.then(function (r) { return r && !r.error ? (r.count != null ? r.count : (r.data || []).length) : null; }, function () { return null; }); }
      Promise.all([
        cnt(client.from("profiles").select("id", { count: "exact", head: true }).eq("approval", "pending")),
        cnt(client.from("testimonials").select("id", { count: "exact", head: true }).eq("published", false)),
        cnt(client.from("membership_applications").select("id", { count: "exact", head: true }).eq("status", "new")),
        client.from("events").select("*").then(function (r) { return r.error ? null : EVD.resolve(r.data || []).then(function (l) { return l.filter(function (e) { return !e._past; }).length; }); }, function () { return null; })
      ]).then(function (n) {
        ["st-pending", "st-testi", "st-apps", "st-events"].forEach(function (id, i) { var el = document.getElementById(id); if (el) el.textContent = n[i] == null ? "-" : n[i]; });
        setBadge("badge-people", (n[0] || 0) + (n[2] || 0)); setBadge("badge-testimonials", n[1] || 0);
      });
    }
    loadOverview();

    // Overview panels: today's public quote, the next events, sign-ups this week.
    function loadOverviewPanels() {
      var qb = document.getElementById("ov-quote"), eb = document.getElementById("ov-events"), sb = document.getElementById("ov-signups");
      var today = new Date().toISOString().slice(0, 10), weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      if (qb) client.rpc("get_daily_quote").then(function (r) {
        var q = r && r.data && r.data[0];
        qb.innerHTML = q ? '<p class="ov-quote">\u201C' + esc(q.quote_text) + '\u201D</p><p class="ov-src">' + esc(q.source) + '</p>' : '<p class="adm-help">No quote yet. Add some in the Quotes tab.</p>';
      }, function () {});
      if (eb) client.from("events").select("*").then(function (r) {
        return EVD.resolve((r && r.data) || []).then(function (all) {
          var l = all.filter(function (e) { return !e._past; });
          l.sort(function (a, b) { return a.start_date < b.start_date ? -1 : 1; }); l = l.slice(0, 3);
          eb.innerHTML = l.length ? l.map(function (e) { return '<p class="ov-line"><b>' + esc(e.start_date) + '</b> ' + esc(e.title) + (e._shifted ? ' <span class="adm-help">(repeats)</span>' : '') + '</p>'; }).join("") : '<p class="adm-help">Nothing coming up. Add an event in Events &amp; programs.</p>';
        });
      }, function () {});

      // Reminder: repeating events that come round within the next 7 days (check date, guests and details are still right)
      var yb = document.getElementById("ov-yearly");
      if (yb) client.from("events").select("*").then(function (r) {
        if (r.error) return;
        var t = EVD.today(), rep = ((r && r.data) || []).filter(function (e) { return e.repeat_mode && e.repeat_mode !== "none"; });
        return EVD.resolve(rep, t).then(function (l) {
          var soon = l.filter(function (e) { var d = EVD.days(t, e.start_date); return !e._past && d >= 0 && d <= 7; });
          yb.innerHTML = soon.map(function (e) {
            var d = EVD.days(t, e.start_date);
            return '<div class="adm-remind"><b>Reminder:</b> &ldquo;' + esc(e.title) + '&rdquo; comes round again ' + (d === 0 ? 'today' : d === 1 ? 'tomorrow' : 'in ' + d + ' days (' + esc(e.start_date) + ')') + (e._lunar ? ', worked out from the Gaurabda calendar' : '') + '. Check that the date, guests and details are right. <a href="#" data-goto-events>Open Events &amp; programs</a></div>';
          }).join("");
          yb.querySelectorAll("[data-goto-events]").forEach(function (x) { x.addEventListener("click", function (ev) { ev.preventDefault(); var b = document.querySelector('.admin-tab-btn[data-tab="events"]'); if (b) b.click(); }); });
        });
      }, function () {});
      if (sb) client.from("registrations").select("id", { count: "exact", head: true }).gte("created_at", weekAgo).then(function (r) {
        var n = r && !r.error ? (r.count != null ? r.count : (r.data || []).length) : null;
        sb.innerHTML = n == null ? "" : '<p class="ov-big">' + n + '</p><p class="adm-help">people pressed Save my spot in the last 7 days</p>';
      }, function () {});
    }
    loadOverviewPanels();


    // ---------- Know our own role, to gate People actions ----------
    var myRole = null;
    window.ISKCON_DATA.getSessionAndRole().then(function (r) {
      myRole = r.role;
      if (myRole !== "super_admin") document.getElementById("admin-not-super").hidden = false;
    });

    // ============================================================
    // SETTINGS
    // ============================================================
    var settingsForm = document.getElementById("settings-form");
    var settingsStatus = document.getElementById("settings-status");
    var TEXT_KEYS = ["mpesa_till", "pesapal_donate_url", "whatsapp_group_invite", "facebook_url", "instagram_url", "youtube_url", "tiktok_url", "address_short", "whatsapp_primary", "whatsapp_secondary", "sunday_title", "sunday_text", "sunday_schedule", "sunday_when"];
    var BOOL_KEYS = ["store_enabled", "articles_enabled", "special_events_enabled", "google_signin_enabled", "forgot_password_enabled"];

    client.from("site_settings").select("key,value").then(function (r) {
      if (r.error || !r.data) return;
      r.data.forEach(function (row) {
        if (row.key === "homepage_hero_image_url") {
          var span = document.getElementById("hero-photo-current");
          if (span && row.value) span.textContent = "Current photo is set. Choose a new file to replace it.";
          return;
        }
        var el = settingsForm.elements[row.key];
        if (!el) return;
        if (el.type === "checkbox") el.checked = row.value === "true";
        else el.value = row.value;
      });
    });

    // ---------- Homepage hero photo upload ----------
    var heroInput = document.getElementById("hero-photo-input");
    if (heroInput) {
      heroInput.addEventListener("change", function () {
        var file = heroInput.files[0];
        if (!file) return;
        var span = document.getElementById("hero-photo-current");
        if (span) span.textContent = "Uploading...";
        var path = "homepage-hero-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        client.storage.from("site-images").upload(path, file, { upsert: true }).then(function (up) {
          if (up.error) { if (span) span.textContent = "Upload failed: " + up.error.message; return; }
          var publicUrl = client.storage.from("site-images").getPublicUrl(path).data.publicUrl;
          client.from("site_settings").upsert({ key: "homepage_hero_image_url", value: publicUrl }).then(function (saveRes) {
            if (span) span.textContent = saveRes.error ? saveRes.error.message : "New photo saved — live on the homepage now.";
          });
        });
      });
    }

    var heroLinkBtn = document.getElementById("hero-photo-link-btn");
    if (heroLinkBtn) {
      heroLinkBtn.addEventListener("click", function () {
        var inp = document.getElementById("hero-photo-link"), span = document.getElementById("hero-photo-current");
        var v = (inp.value || "").trim();
        if (v && !/^https?:\/\//i.test(v)) v = "https://" + v;
        if (!/^https:\/\/\S+\.\S+/i.test(v)) { if (span) span.textContent = "Paste a full image link that starts with https://"; return; }
        if (span) span.textContent = "Saving...";
        client.from("site_settings").upsert({ key: "homepage_hero_image_url", value: v }).then(function (saveRes) {
          if (span) span.textContent = saveRes.error ? saveRes.error.message : "Photo link saved \u2014 live on the homepage now.";
        });
      });
    }

    settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      settingsStatus.textContent = "Saving...";
      var updates = [];
      var URL_KEYS = ["pesapal_donate_url", "whatsapp_group_invite", "facebook_url", "instagram_url", "youtube_url", "tiktok_url"];
      TEXT_KEYS.forEach(function (k) {
        var v = (settingsForm.elements[k].value || "").trim();
        if (URL_KEYS.indexOf(k) >= 0 && v && !/^https?:\/\//i.test(v)) v = "https://" + v;   // forgive a missing https://
        if (k === "whatsapp_primary" || k === "whatsapp_secondary") { v = v.replace(/\D/g, ""); if (/^0\d{9}$/.test(v)) v = "254" + v.slice(1); else if (/^[71]\d{8}$/.test(v)) v = "254" + v; }   // digits only; 0700... or 700... becomes 254700...
        settingsForm.elements[k].value = v;
        updates.push({ key: k, value: v });
      });
      BOOL_KEYS.forEach(function (k) { updates.push({ key: k, value: settingsForm.elements[k].checked ? "true" : "false" }); });
      client.from("site_settings").upsert(updates).then(function (r) {
        settingsStatus.style.color = r.error ? "#b33a2e" : "#2E7D32";
        settingsStatus.textContent = r.error ? r.error.message : "Saved. Changes are live on the public site now.";
      });
    });



    // ---------- About me answers (named and anonymous) ----------
    function respLines(d) {
      var L = [];
      if (d.initiated) L.push("Initiated" + (d.initiated_name ? ": " + d.initiated_name : ""));
      if (!d.initiated) { L.push("Rounds daily: " + (OBL.rounds[d.rounds] || "-")); L.push("Principles: " + list(OBL.principles, d.principles)); }
      L.push("What brought them: " + list(OBL.why, d.why, d.why_other));
      L.push("Hopes from the movement: " + list(OBL.movement, d.movement_hope, d.movement_hope_other));
      L.push("Willing to commit: " + (OBL.commit[d.commitment] || "-"));
      L.push("Hopes from this site: " + list(OBL.hope, d.hope, d.hope_other));
      L.push("Heard about us: " + (d.how_heard || "-") + " \u00B7 Area: " + (d.area || "-"));
      L.push("Prefers: " + (OBL.contact[d.contact_pref] || "-") + (d.contact_value ? " \u00B7 Contact: " + d.contact_value : ""));
      (d.custom || []).forEach(function (x) { L.push(x.label + ": " + (Array.isArray(x.answer) ? x.answer.join(", ") : x.answer)); });
      return L;
    }
    function loadResponses() {
      var host = document.getElementById("resp-list"); if (!host) return;
      client.rpc("admin_about_responses").then(function (r) {
        if (r.error) { host.innerHTML = '<p style="font-size:13px;color:#b33a2e;">Not switched on yet: the database step (file 32) still has to be run. ' + esc(r.error.message) + '</p>'; return; }
        var rows = r.data || [], an = rows.filter(function (x) { return x.anonymous; }).length;
        document.getElementById("resp-summary").textContent = rows.length + " responses: " + (rows.length - an) + " named, " + an + " anonymous.";
        host.innerHTML = rows.map(function (x) {
          return '<div class="card" style="padding:12px 14px;"><div style="font-weight:800;margin-bottom:6px;">' + (x.anonymous ? "Anonymous" : esc(x.who || "Member")) + (x.submitted ? ' <small style="font-weight:400;color:var(--muted);">' + esc(String(x.submitted).slice(0, 10)) + '</small>' : '') + '</div><div style="font-size:13px;line-height:1.6;">' + respLines(x.data || {}).map(esc).join("<br>") + '</div></div>';
        }).join("") || '<p style="font-size:13px;color:var(--muted);">No responses yet.</p>';
      });
    }
    loadResponses();

    // ============================================================
    // ABOUT ME QUESTIONS (admin decides what members are asked)
    // ============================================================
    var aqRows = [];
    function loadAboutQ() {
      var host = document.getElementById("aboutq-list"); if (!host) return;
      client.from("profile_questions").select("*").order("sort", { ascending: true }).order("created_at", { ascending: true }).then(function (r) {
        if (r.error) { host.innerHTML = '<p style="font-size:13px;color:#b33a2e;">This is not switched on yet: the database step (file 31) still has to be run. ' + esc(r.error.message) + '</p>'; return; }
        aqRows = r.data || [];
        host.innerHTML = aqRows.map(function (q, i) {
          var builtIn = !!q.key, kind = { text: "short written answer", single: "choose one", multi: "tick any" }[q.kind] || q.kind;
          return '<div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:8px;" data-aq="' + q.id + '">' +
            '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><label style="display:flex;gap:6px;align-items:center;font-weight:700;font-size:13px;"><input type="checkbox" data-aq-show' + (q.active ? " checked" : "") + ' style="width:auto;"> Show</label>' +
            '<span style="font-size:12px;color:var(--muted);">' + (builtIn ? "Built-in &middot; " : "Yours &middot; ") + esc(kind) + '</span><span style="flex:1"></span>' +
            '<button type="button" class="button secondary" data-aq-up' + (i === 0 ? " disabled" : "") + ' aria-label="Move up">&uarr;</button><button type="button" class="button secondary" data-aq-down' + (i === aqRows.length - 1 ? " disabled" : "") + ' aria-label="Move down">&darr;</button></div>' +
            (builtIn ? '<div style="font-size:14px;">' + esc(q.label) + '</div>' :
              '<input data-aq-label value="' + esc(q.label) + '" maxlength="300" style="width:100%;padding:8px;">' +
              (q.kind === "text" ? "" : '<textarea data-aq-opts rows="4" style="width:100%;padding:8px;" aria-label="Choices, one per line">' + esc((q.options || []).join("\n")) + '</textarea>') +
              '<div><button type="button" class="button secondary" data-aq-save>Save changes</button> <button type="button" class="button secondary" data-aq-del>Delete</button></div>') +
            '</div>';
        }).join("") || '<p style="font-size:13px;color:var(--muted);">No questions yet.</p>';
      });
    }
    (function () {
      var host = document.getElementById("aboutq-list"), form = document.getElementById("aboutq-add"); if (!host || !form) return;
      function lines(t) { return String(t || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 40); }
      function rowOf(el) { var d = el.closest("[data-aq]"); return d && d.getAttribute("data-aq"); }
      function fail(r) { if (r && r.error) alert(r.error.message); loadAboutQ(); }
      host.addEventListener("click", function (e) {
        var id = rowOf(e.target); if (!id) return;
        var t = e.target.closest("button"); if (!t) return;
        if (t.hasAttribute("data-aq-save")) { var d = e.target.closest("[data-aq]"), o = d.querySelector("[data-aq-opts]"), patch = { label: d.querySelector("[data-aq-label]").value.trim() }; if (o) patch.options = lines(o.value); client.from("profile_questions").update(patch).eq("id", id).then(fail); }
        else if (t.hasAttribute("data-aq-del")) { if (confirm("Delete this question and everyone's answers to it?")) client.from("profile_questions").delete().eq("id", id).then(fail); }
        else if (t.hasAttribute("data-aq-up") || t.hasAttribute("data-aq-down")) {
          var i = aqRows.findIndex(function (q) { return q.id === id; }), j = i + (t.hasAttribute("data-aq-up") ? -1 : 1);
          if (i < 0 || j < 0 || j >= aqRows.length) return;
          var order = aqRows.slice(); var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
          Promise.all(order.map(function (q, k) { return q.sort === (k + 1) * 10 ? null : client.from("profile_questions").update({ sort: (k + 1) * 10 }).eq("id", q.id); }).filter(Boolean)).then(function () { loadAboutQ(); });
        }
      });
      host.addEventListener("change", function (e) { if (e.target.hasAttribute("data-aq-show")) client.from("profile_questions").update({ active: e.target.checked }).eq("id", rowOf(e.target)).then(fail); });
      form.kind.addEventListener("change", function () { document.getElementById("aboutq-opts-wrap").hidden = form.kind.value === "text"; });
      form.addEventListener("submit", function (e) {
        e.preventDefault(); var st = document.getElementById("aboutq-status"), opts = lines(form.options.value);
        if (form.kind.value !== "text" && opts.length < 2) { st.style.color = "#b33a2e"; st.textContent = "Add at least two choices."; return; }
        var last = aqRows.reduce(function (m, q) { return Math.max(m, q.sort || 0); }, 0);
        client.from("profile_questions").insert({ label: form.label.value.trim(), kind: form.kind.value, options: form.kind.value === "text" ? [] : opts, sort: last + 10 }).then(function (r) {
          st.style.color = r.error ? "#b33a2e" : "#2E7D32"; st.textContent = r.error ? r.error.message : "Added.";
          if (!r.error) { form.reset(); document.getElementById("aboutq-opts-wrap").hidden = true; loadAboutQ(); }
        });
      });
    })();
    loadAboutQ();

    // ============================================================
    // PEOPLE
    // ============================================================
    var OBL = { rounds: { not_yet: "Not chanting daily yet", "1_3": "1 to 3 rounds", "4_8": "4 to 8 rounds", "9_15": "9 to 15 rounds", "16": "16 rounds", more: "More than 16 rounds" },
      principles: { no_meat: "No meat, fish or eggs", no_intoxication: "No intoxication", no_illicit_sex: "No illicit sex", no_gambling: "No gambling", still_learning: "Still learning about them", prefer_not: "Would rather not say" },
      why: { knowledge: "Knowledge", peace: "Peace", association: "Friends and association", festivals: "Festivals", prasadam: "Prasadam", kirtan: "Kirtan and music", service: "Service", family: "Family or upbringing", curiosity: "Curiosity" },
      hope: { courses: "Courses", calendar: "Calendar and reminders", community: "Community and messages", chanting: "Learning to chant", service: "Service opportunities", inspiration: "Daily inspiration", news: "News of programs" },
      contact: { whatsapp: "WhatsApp", call: "Phone call", email: "Email", any: "Any" },
      movement: { knowledge: "Clear knowledge and philosophy", peace: "Peace of mind", guidance: "Spiritual guidance", association: "Good friends on the path", character: "Better character and habits", service: "A chance to serve", meditation: "Learning to chant and meditate", family: "Better family life", scripture: "Understanding the scriptures", unsure: "Not sure yet" },
      commit: { exploring: "Just exploring", occasional: "Programs and festivals now and then", regular: "Regularly (weekly programs)", chant: "Daily chanting and reading", principles: "Four principles and daily rounds", volunteer: "Regular service", initiation: "Preparing for initiation", unsure: "Not sure yet" } };
    function list(map, arr, other) { var a = (arr || []).map(function (k) { return map[k] || k; }); if (other) a.push("Other: " + other); return a.join(", ") || "-"; }
    function answersHtml(o) {
      if (!o) return "";
      return '<details style="margin-top:6px;font-size:12px;"><summary style="cursor:pointer;font-weight:700;">Details and answers (confidential)</summary><div style="margin-top:6px;line-height:1.6;">' +
        'Legal name: ' + esc(o.full_name || "-") + '<br>Initiated name: ' + esc(o.initiated_name || "-") + '<br>Phone: ' + esc(o.phone || "-") + ' &middot; Prefers: ' + esc(OBL.contact[o.contact_pref] || "-") + '<br>' +
        'Rounds daily: ' + esc(OBL.rounds[o.rounds] || "-") + '<br>Principles: ' + esc(list(OBL.principles, o.principles)) + '<br>Why they joined: ' + esc(list(OBL.why, o.why, o.why_other)) +
        '<br>Hopes from the movement: ' + esc(list(OBL.movement, o.movement_hope, o.movement_hope_other)) + '<br>Willing to commit: ' + esc(OBL.commit[o.commitment] || "-") + '<br>Hopes from this site: ' + esc(list(OBL.hope, o.hope, o.hope_other)) + (o.contact_value ? '<br>Contact: ' + esc(o.contact_value) : '') + '<br>Heard about us: ' + esc(o.how_heard || "-") + ' &middot; Area: ' + esc(o.area || "-") +
        ((ansBy[o.user_id] || []).map(function (x) { return '<br>' + esc(x.l) + ': ' + esc(x.a); }).join("")) + '</div></details>';
    }
    var onbById = {}, ansBy = {};
    function loadPeople() {
      Promise.all([client.from("profiles").select("*").order("created_at", { ascending: false }), client.from("member_onboarding").select("*"), client.from("profile_answers").select("*"), client.from("profile_questions").select("id,label")]).then(function (q) {
        ansBy = {}; var lab = {}; ((q[3] && q[3].data) || []).forEach(function (x) { lab[x.id] = x.label; }); ((q[2] && q[2].data) || []).forEach(function (a) { (ansBy[a.user_id] = ansBy[a.user_id] || []).push({ l: lab[a.question_id] || "Question", a: Array.isArray(a.answer) ? a.answer.join(", ") : String(a.answer) }); });
        var r = q[0]; if (r.error || !r.data) return;
        onbById = {}; ((q[1] && q[1].data) || []).forEach(function (o) { onbById[o.user_id] = o; });
        var waiting = function (p) { return p.approval === "rejected" ? false : (p.approval === "pending" || p.role === "pending"); };
        var pending = r.data.filter(waiting);
        var others = r.data.filter(function (p) { return !waiting(p); });
        document.getElementById("pending-list").innerHTML = pending.length
          ? pending.map(personRow).join("")
          : '<p style="font-size:13px;color:var(--muted);">No one is waiting for approval.</p>';
        document.getElementById("people-list").innerHTML = others.map(personRow).join("");
        wirePersonButtons();
      });
    }

    function personRow(p) {
      var roleOptions = ["pending", "member", "admin", "super_admin"].map(function (r) {
        return '<option value="' + r + '"' + (r === p.role ? " selected" : "") + '>' + r + '</option>';
      }).join("");
      var canEdit = myRole === "super_admin", isStaff = p.role === "admin" || p.role === "super_admin";
      var name = p.full_name || (onbById[p.id] && onbById[p.id].full_name) || "";
      var waiting = p.approval === "pending" || (p.role === "pending" && p.approval !== "rejected");
      var acts = (!isStaff ? ((waiting ? '<button type="button" class="button" data-approve="' + p.id + '" style="font-size:11px;padding:4px 10px;min-height:auto;">Approve</button>' : '') +
        (p.approval !== "rejected" ? '<button type="button" class="button secondary" data-reject="' + p.id + '" style="font-size:11px;padding:4px 10px;min-height:auto;">Reject</button>' : '<span style="font-size:11px;color:#b33a2e;font-weight:700;">REJECTED</span>') +
        '<button type="button" class="button secondary" data-delmember="' + p.id + '" style="font-size:11px;padding:4px 10px;min-height:auto;">Delete</button>') : '');
      return '<div style="padding:10px;background:var(--row-tint);border-radius:6px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">' +
        '<span style="font-size:13px;">' + (name ? '<b>' + esc(name) + '</b><br>' : '') + esc(p.email) + (waiting ? ' <span style="color:#a47d00;font-weight:700;font-size:11px;">PENDING</span>' : '') + '</span>' +
        '<span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' + acts +
        (canEdit
          ? '<select data-person-role="' + p.id + '" style="padding:6px;border:1px solid var(--line);border-radius:4px;font-size:12px;">' + roleOptions + '</select>'
          : '<span style="font-size:12px;font-weight:700;">' + esc(p.role) + '</span>') + '</span></div>' + answersHtml(onbById[p.id]) + '</div>';
    }

    function wirePersonButtons() {
      document.querySelectorAll("[data-approve]").forEach(function (b) { b.addEventListener("click", function () {
        client.rpc("review_member", { target: b.getAttribute("data-approve"), approve: true }).then(function (r) { if (r.error) alert(r.error.message); loadPeople(); }); }); });
      document.querySelectorAll("[data-reject]").forEach(function (b) { b.addEventListener("click", function () {
        var why = prompt("Why is this registration rejected? The person will read this message the next time they sign in, and then their account is deleted.");
        if (why === null) return; if (!why.trim()) { alert("Please write a reason."); return; }
        client.rpc("review_member", { target: b.getAttribute("data-reject"), approve: false, reason: why.trim() }).then(function (r) { if (r.error) alert(r.error.message); loadPeople(); }); }); });
      document.querySelectorAll("[data-delmember]").forEach(function (b) { b.addEventListener("click", function () {
        if (!confirm("Delete this account and everything saved under it? This cannot be undone.")) return;
        client.rpc("admin_delete_member", { target: b.getAttribute("data-delmember") }).then(function (r) { if (r.error) alert(r.error.message); loadPeople(); }); }); });
      document.querySelectorAll("[data-person-role]").forEach(function (sel) {
        sel.addEventListener("change", function () {
          client.from("profiles").update({ role: sel.value }).eq("id", sel.getAttribute("data-person-role")).then(loadPeople);
        });
      });
    }
    loadPeople();

    // ============================================================
    // GENERIC LIST + ADD + DELETE + PUBLISH-TOGGLE HELPER
    // ============================================================
    function wireTable(table, formId, listId, statusId, rowRenderer, extraFields) {
      var form = document.getElementById(formId);
      var status = document.getElementById(statusId);
      var submitBtn = form.querySelector('button[type="submit"]');
      var defaultBtnText = submitBtn ? submitBtn.textContent : "Save";
      var rowsById = {};
      var editingId = null;

      function cancelEdit() {
        editingId = null;
        form.reset();
        if (submitBtn) submitBtn.textContent = defaultBtnText;
        var cancelLink = form.querySelector(".cancel-edit-link");
        if (cancelLink) cancelLink.remove();
        status.textContent = "";
      }

      function startEdit(id) {
        var row = rowsById[id];
        if (!row) return;
        editingId = id;
        Array.from(form.elements).forEach(function (el) {
          if (!el.name || !(el.name in row)) return;
          if (el.type === "checkbox") el.checked = !!row[el.name];
          else el.value = row[el.name] == null ? "" : row[el.name];
        });
        form.dispatchEvent(new Event("rowloaded"));
        if (submitBtn) {
          submitBtn.textContent = "Save Changes";
          if (!form.querySelector(".cancel-edit-link")) {
            var cancel = document.createElement("button");
            cancel.type = "button";
            cancel.className = "button secondary cancel-edit-link";
            cancel.style.cssText = "width:100%;margin-top:4px;";
            cancel.textContent = "Cancel Edit";
            cancel.addEventListener("click", cancelEdit);
            submitBtn.insertAdjacentElement("afterend", cancel);
          }
        }
        status.style.color = "var(--muted)";
        status.textContent = "Editing \u2014 change the fields above, then Save Changes.";
        var drawer = form.closest("details"); if (drawer) drawer.open = true;   // the form sits in a drawer that is closed by default: open it so the edit is visible
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      function load() {
        // The database sends at most 1000 rows per request, so ask page by page until everything is here.
        function page(from, all) {
          return client.from(table).select("*").order("created_at", { ascending: false }).order("id").range(from, from + 999).then(function (r) {
            if (r.error || !r.data) return r.error ? r : { data: all };
            all = all.concat(r.data);
            return r.data.length === 1000 ? page(from + 1000, all) : { data: all };
          });
        }
        page(0, []).then(function (r) {
          if (r.error || !r.data) return;
          rowsById = {};
          r.data.forEach(function (row) { rowsById[row.id] = row; });
          document.getElementById(listId).innerHTML = r.data.map(function (row) { return rowRenderer(row); }).join("")
            || '<p style="font-size:13px;color:var(--muted);">Nothing added yet.</p>';
          document.querySelectorAll('[data-del="' + table + '"]').forEach(function (btn) {
            btn.addEventListener("click", function () {
              if (!confirm("Delete this? This cannot be undone.")) return;
              client.from(table).delete().eq("id", btn.getAttribute("data-id")).then(load);
            });
          });
          document.querySelectorAll('[data-edit="' + table + '"]').forEach(function (btn) {
            btn.addEventListener("click", function () { startEdit(btn.getAttribute("data-id")); });
          });
          document.querySelectorAll('[data-pub="' + table + '"]').forEach(function (chk) {
            chk.addEventListener("change", function () {
              client.from(table).update({ published: chk.checked }).eq("id", chk.getAttribute("data-id")).then(load);
            });
          });
        });
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        status.style.color = "var(--muted)";
        status.textContent = "Saving...";
        var row = {};
        Array.from(form.elements).forEach(function (el) {
          if (!el.name) return;
          if ((el.name === "repeat_mode" || el.name === "g_masa" || el.name === "g_tithi") && form.elements.repeat_mode && form.elements.repeat_mode.value === "none" && !(editingId && rowsById[editingId] && "repeat_mode" in rowsById[editingId])) return;   // keeps working before SQL 33 is run
          if (el.type === "checkbox") row[el.name] = el.checked;
          else if (el.type === "number") row[el.name] = el.value ? Number(el.value) : null;
          else row[el.name] = el.value || null;
        });
        var query = editingId
          ? client.from(table).update(row).eq("id", editingId)
          : client.from(table).insert(row);
        query.then(function (r) {
          status.style.color = r.error ? "#b33a2e" : "#2E7D32";
          status.textContent = r.error ? r.error.message : (editingId ? "Changes saved." : "Added.");
          if (!r.error) { cancelEdit(); load(); }
        });
      });

      load();
      return load;
    }

    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function rowShell(table, id, published, title, meta) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px;background:var(--row-tint);border-radius:6px;">' +
        '<div><strong style="font-size:13px;">' + esc(title) + '</strong><br><span style="font-size:12px;color:var(--muted);">' + esc(meta) + '</span></div>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<label style="font-size:11px;display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pub="' + table + '" data-id="' + id + '" ' + (published ? "checked" : "") + '> Published</label>' +
        '<button type="button" data-edit="' + table + '" data-id="' + id + '" class="button secondary" style="font-size:11px;padding:4px 10px;min-height:auto;">Edit</button>' +
        '<button type="button" data-del="' + table + '" data-id="' + id + '" class="button secondary" style="font-size:11px;padding:4px 10px;min-height:auto;">Delete</button>' +
        '</div></div>';
    }

    wireTable("articles", "article-form", "articles-admin-list", "article-status", function (a) {
      return rowShell("articles", a.id, a.published, a.title, a.author + " · " + a.article_date);
    });

    var THEMES = ["Sun: Devotion and service", "Mon: The mind and self-control", "Tue: Who we are", "Wed: Knowledge and wisdom", "Thu: Peace and real happiness", "Fri: Chanting, good company and community", "Sat: Work, duty and detachment"];
    var reloadQuotes = wireTable("quotes", "quote-form", "quotes-admin-list", "quote-status", function (q) {
      var short = String(q.quote_text).length > 160 ? String(q.quote_text).slice(0, 160) + "…" : q.quote_text;
      var draft = !!q.suggested_aud && !q.use_weekly && !q.use_votd;
      var tags = draft ? "DRAFT (hidden) \u00b7 suggested: " + (q.suggested_aud === "public" ? "Public" : "Members only") : (q.use_weekly ? "Public" : "") + (q.use_weekly && q.use_votd ? " + " : "") + (q.use_votd ? "Members' verse" : "") || "not shown";
      var meta = esc(q.source) + (q.book ? " · " + esc(q.book) : "") + " · " + tags + (q.verse_date ? " · Verse of the Day on " + esc(q.verse_date) : "") + (q.theme != null && THEMES[q.theme] ? " · Theme " + esc(THEMES[q.theme]) : "");
      return '<div class="quote-row" data-id="' + q.id + '" data-sug="' + esc(q.suggested_aud || "") + '" data-draft="' + (draft ? "1" : "") + '" data-q="' + esc((q.quote_text + " " + q.source).toLowerCase()) + '" data-book="' + esc(q.book || "") + '" data-theme="' + (q.theme == null ? "none" : q.theme) + '" data-live="' + (!draft && q.use_weekly ? "pub" : !draft ? "mem" : "") + '" style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px;background:var(--row-tint);border-radius:6px;">' +
        '<div><strong style="font-size:13px;">“' + esc(short) + '”</strong><br><span style="font-size:12px;color:var(--muted);">' + meta + '</span>' +
        (q.source_url ? ' <a href="' + esc(q.source_url) + '" target="_blank" rel="noopener" style="font-size:12px;">Vedabase</a>' : "") + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">' + (draft ? '<button type="button" data-approve="public" data-id="' + q.id + '" class="button" style="font-size:11px;padding:4px 10px;min-height:auto;">Approve: Public</button><button type="button" data-approve="members" data-id="' + q.id + '" class="button" style="font-size:11px;padding:4px 10px;min-height:auto;">Approve: Members</button>' : "") + '<button type="button" data-edit="quotes" data-id="' + q.id + '" class="button secondary" style="font-size:11px;padding:4px 10px;min-height:auto;">Edit</button>' +
        '<button type="button" data-del="quotes" data-id="' + q.id + '" class="button secondary" style="font-size:11px;padding:4px 10px;min-height:auto;">Delete</button></div></div>';
    });
    (function () {
      var box = document.getElementById("quote-search"), bk = document.getElementById("quote-book"), cnt = document.getElementById("quote-count"), stf = document.getElementById("quote-status-filter"), thf = document.getElementById("quote-theme"), sum = document.getElementById("quote-summary");
      if (!box) return;
      var bulk = document.getElementById("quote-approve-all");
      if (bulk) bulk.addEventListener("click", function () {
        var rows = Array.prototype.filter.call(document.querySelectorAll("#quotes-admin-list .quote-row"), function (r) { return r.style.display !== "none" && r.getAttribute("data-draft"); });
        if (!rows.length) { alert("No drafts are shown. Choose \"Drafts to review\" first."); return; }
        if (!confirm("Approve all " + rows.length + " drafts shown, each with the audience Claude suggested (Public or Members)?\n\nTip: use the search box or the book filter first to approve one batch at a time.")) return;
        var pub = [], mem = [];
        rows.forEach(function (r) { (r.getAttribute("data-sug") === "public" ? pub : mem).push(r.getAttribute("data-id")); });
        bulk.disabled = true; bulk.textContent = "Approving...";
        function run(ids, patch) {
          var parts = []; for (var i = 0; i < ids.length; i += 100) parts.push(ids.slice(i, i + 100));
          return parts.reduce(function (p, part) { return p.then(function () { return client.from("quotes").update(patch).in("id", part); }); }, Promise.resolve());
        }
        run(pub, { use_weekly: true, use_votd: true, suggested_aud: null }).then(function () { return run(mem, { use_weekly: false, use_votd: true, suggested_aud: null }); }).then(function () {
          bulk.disabled = false; bulk.textContent = "Approve all shown drafts as suggested"; reloadQuotes();
        }).catch(function (err) { bulk.disabled = false; bulk.textContent = "Approve all shown drafts as suggested"; alert("Could not approve: " + (err && err.message)); });
      });
      document.getElementById("quotes-admin-list").addEventListener("click", function (e) {
        var b = e.target.closest("[data-approve]"); if (!b) return;
        var aud = b.getAttribute("data-approve"); b.disabled = true;
        // public = home page Quote of the Week + members' Verse of the Day; members = Verse of the Day only
        client.from("quotes").update({ use_weekly: aud === "public", use_votd: true, suggested_aud: null }).eq("id", b.getAttribute("data-id")).then(function (r) {
          if (r.error) { b.disabled = false; alert("Could not approve: " + r.error.message); return; }
          var row = b.closest(".quote-row"); if (row) { row.setAttribute("data-draft", ""); row.style.opacity = ".5"; row.querySelector("span").textContent = "Approved as " + (aud === "public" ? "Public" : "Members only"); row.querySelectorAll("[data-approve]").forEach(function (x) { x.remove(); }); }
          apply();
        });
      });
      function apply() {
        var t = box.value.trim().toLowerCase(), b = bk.value, n = 0, rows = document.querySelectorAll("#quotes-admin-list .quote-row");
        rows.forEach(function (r) {
          var show = (!t || r.getAttribute("data-q").indexOf(t) > -1) && (!b || r.getAttribute("data-book") === b) && (!stf || !stf.value || (stf.value === "draft" ? !!r.getAttribute("data-draft") : !r.getAttribute("data-draft"))) && (!thf || !thf.value || r.getAttribute("data-theme") === thf.value);
          r.style.display = show ? "" : "none"; if (show) n++;
        });
        cnt.textContent = rows.length ? n + " of " + rows.length + " quotes" : "";
        if (sum) {
          var c = { pub: 0, mem: 0, dr: 0 }; rows.forEach(function (r) { var l = r.getAttribute("data-live"); if (l === "pub") c.pub++; else if (l === "mem") c.mem++; else c.dr++; });
          sum.textContent = rows.length ? c.pub + " live on the public site, " + c.mem + " for members only, " + c.dr + " drafts waiting for your approval." : "";
        }
      }
      function books() {
        var seen = {}, cur = bk.value;
        document.querySelectorAll("#quotes-admin-list .quote-row").forEach(function (r) { var b = r.getAttribute("data-book"); if (b) seen[b] = 1; });
        bk.innerHTML = '<option value="">All books</option>' + Object.keys(seen).sort().map(function (b) { return '<option>' + esc(b) + '</option>'; }).join("");
        bk.value = cur; apply();
      }
      box.addEventListener("input", apply); bk.addEventListener("change", apply); if (stf) stf.addEventListener("change", apply); if (thf) thf.addEventListener("change", apply);
      new MutationObserver(books).observe(document.getElementById("quotes-admin-list"), { childList: true });
      window.__quotesRefilter = books;
    })();

    // Paste many quotes: "quote | reference" per line.
    (function () {
      var ta = document.getElementById("qimp-text"); if (!ta) return;
      var st = document.getElementById("qimp-status"), go = document.getElementById("qimp-go"), parsed = [];
      var fileIn = document.getElementById("qimp-file");
      if (fileIn) fileIn.addEventListener("change", function () {
        var f = fileIn.files && fileIn.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function () { ta.value = String(rd.result || "").replace(/^\uFEFF/, ""); check(); st.textContent = "File \"" + f.name + "\" loaded. " + st.textContent; fileIn.value = ""; };
        rd.onerror = function () { st.style.color = "#b33a2e"; st.textContent = "Could not read that file."; };
        rd.readAsText(f, "utf-8");
      });
      var BOOKS = { bg: "Bhagavad-gita", sb: "Srimad-Bhagavatam", noi: "Nectar of Instruction", iso: "Sri Isopanisad" };
      function info(ref) {
        var m = /^(Bg|SB|NoI|ISO)\.?\s*([0-9]+(?:\.[0-9]+)*(?:[-–][0-9]+)?)/i.exec(ref); if (!m) return {};
        var k = m[1].toLowerCase(), nums = m[2].replace("–", "-"), path = nums.split(".").join("/");
        return { book: BOOKS[k], url: "https://vedabase.io/en/library/" + k + "/" + path + "/" };
      }
      function check() {
        parsed = []; var bad = [], lines = ta.value.split("\n");
        lines.forEach(function (ln, i) {
          if (!ln.trim()) return;
          // optional extras at the end of a line:  | date=1974-11-20 | v=6.20 | theme=3 | url=https://vedabase.io/...
          var ex = {}, mm;
          while ((mm = /\s\|\s(date|v|url|theme)=(\S+)\s*$/i.exec(ln))) { ex[mm[1].toLowerCase()] = mm[2]; ln = ln.slice(0, mm.index); }
          var hasAud = /\|\s*(draft-public|draft-members|public|members)\s*$/i.test(ln); var k = hasAud ? ln.lastIndexOf("|", ln.lastIndexOf("|") - 1) : ln.lastIndexOf("|"); var q = k > 0 ? ln.slice(0, k).trim() : "", ref = k > 0 ? ln.slice(k + 1).trim() : "";
          if (q.length < 10 || q.length > 2000 || ref.length < 2 || ref.length > 200) { bad.push("Line " + (i + 1) + ": needs  quote | reference"); return; }
          var aud = null, am = /\s*\|\s*(draft-public|draft-members|public|members)\s*$/i.exec(ref), draftAud = null;
          if (am) { aud = am[1].toLowerCase(); ref = ref.slice(0, am.index).trim(); if (aud.indexOf("draft-") === 0) { draftAud = aud.slice(6); aud = null; } }
          var inf = info(ref);
          // "public" = home page Quote of the Week and members' Verse of the Day; "members" = Verse of the Day only.
          var bk = inf.book || (/^Srila Prabhupada, Letter/i.test(ref) ? "Letters" : /^Srila Prabhupada, (Lecture|Conversation)/i.test(ref) ? "Lectures and conversations" : null);
          var dt = ex.date && /^\d{4}-\d\d-\d\d$/.test(ex.date) ? ex.date : null, vv = ex.v && /^(\d{1,2})\.(\d{1,2})$/.exec(ex.v);
          parsed.push({ quote_text: q, source: ref, book: bk, source_url: (ex.url && /^https:\/\/vedabase\.io\//.test(ex.url)) ? ex.url : (inf.url || null),
            said_on: dt, vaish_masa: vv ? +vv[1] : null, vaish_tithi: vv ? +vv[2] : null, theme: /^[0-6]$/.test(ex.theme || "") ? +ex.theme : null,
            use_weekly: draftAud ? false : aud ? aud === "public" : document.getElementById("qimp-weekly").checked,
            use_votd: draftAud ? false : aud ? true : document.getElementById("qimp-votd").checked, suggested_aud: draftAud });
        });
        st.style.color = bad.length ? "#b33a2e" : "#2E7D32";
        st.textContent = parsed.length + " quote(s) ready." + (bad.length ? "\n" + bad.slice(0, 8).join("\n") : "");
      }
      go.addEventListener("click", function () {
        check();
        if (!parsed.length) { st.style.color = "#b33a2e"; st.textContent = "Nothing to add yet. Paste lines like:  quote | reference | public\n" + st.textContent; return; }
        if (/Line \d+:/.test(st.textContent)) {
          // some lines are wrong: add nothing and list them, so the owner can fix them first
          st.style.color = "#b33a2e"; st.textContent = "Nothing was added. Fix these lines first:\n" + st.textContent.split("\n").slice(1).join("\n"); return;
        }
        go.disabled = true; st.style.color = "var(--muted)"; st.textContent = "Adding " + parsed.length + " quotes...";
        var total = parsed.length, pos = 0, addedN = 0, skippedN = 0;
        function sendNext() {
          if (pos >= total) {
            go.disabled = false; st.style.color = "#2E7D32";
            st.textContent = "Added " + addedN + ", skipped " + skippedN + " (duplicates or bad lines)."; ta.value = ""; parsed = []; reloadQuotes(); return;
          }
          var part = parsed.slice(pos, pos + 400); pos += 400;
          st.textContent = "Adding " + Math.min(pos, total) + " of " + total + " quotes...";
          client.rpc("admin_import_quotes", { rows: part }).then(function (r) {
            if (r.error) {
              go.disabled = false; st.style.color = "#b33a2e";
              st.textContent = r.error.message + (/function|schema cache/i.test(r.error.message) ? "\nRun the Quote Library SQL files (20, 21, 22) in Supabase first." : "") + (addedN ? "\n" + addedN + " quotes were added before the error. Paste the same lines again: duplicates are skipped." : "");
              reloadQuotes(); return;
            }
            addedN += r.data.added; skippedN += r.data.skipped; sendNext();
          });
        }
        sendNext();
      });
    })();

    var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    wireTable("programs", "program-form", "programs-admin-list", "program-status", function (g) {
      return rowShell("programs", g.id, g.published, g.title, DAY_NAMES[g.weekday] + " " + String(g.start_time).slice(0, 5) + "\u2013" + String(g.end_time).slice(0, 5));
    });
    wireTable("events", "event-form", "events-admin-list", "event-status", function (ev) {
      return rowShell("events", ev.id, ev.published, ev.title, ev.start_date + (ev.end_date ? " to " + ev.end_date : "") + (ev.start_time ? " " + String(ev.start_time).slice(0, 5) : "") + (ev.image_url ? " \u00b7 has picture" : "") + (ev.repeat_mode === "gaurabda" ? " \u00b7 repeats by Gaurabda date" : ev.repeat_mode === "date" ? " \u00b7 repeats on the same date every year" : ((ev.end_date || ev.start_date) < EVD.today() ? " \u00b7 past (hidden from the site)" : "")));
    });

    // Repeat choice on the event form: "by Gaurabda date" is worked out from the start date (month + lunar day).
    (function () {
      var form = document.getElementById("event-form"); if (!form || !form.elements.repeat_mode) return;
      var info = document.getElementById("event-repeat-info"), mode = form.elements.repeat_mode, sd = form.elements.start_date;
      var seq = 0;
      function fmt(s) { var p = s.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
      function update() {
        var my = ++seq, m = mode.value;
        form.elements.g_masa.value = ""; form.elements.g_tithi.value = "";
        if (m === "none") { info.textContent = ""; return; }
        if (m === "date") { info.textContent = sd.value ? "It will come back on " + fmt(EVD.addYears(sd.value, 1).slice(0, 10)) + " next year, and the same day after that." : "Pick the start date first."; return; }
        if (!sd.value) { info.textContent = "Pick the start date first. The Gaurabda day is worked out from it."; return; }
        info.textContent = "Working out the Gaurabda date...";
        EVD.loadG().then(function (G) {
          var dt = G.parseIso(sd.value);
          return G.vaishnavaDate(dt).then(function (v) {
            if (my !== seq) return;
            form.elements.g_masa.value = v.masa; form.elements.g_tithi.value = v.tithi;
            return G.birthdaysFrom({ masa: v.masa, tithi: v.tithi }, dt, 4).then(function (l) {
              if (my !== seq) return;
              var next = l.slice(1, 4).map(function (x) { return fmt(G.iso(x.date)) + (x.exact ? "" : " (approx.)"); }).join(", ");
              info.innerHTML = '<b>' + esc(v.masaName) + ' month, ' + esc(G.moonPlain(v.paksa)) + ', ' + esc(G.tithiPlain(v.tithi)) + '</b> (' + esc(v.tithiName) + '). It will be on: ' + esc(next || "dates not found") + '. If this is wrong, check the start date.';
            });
          });
        }).catch(function () { if (my === seq) info.textContent = "The calendar could not be loaded just now. Try again in a moment."; });
      }
      mode.addEventListener("change", update); sd.addEventListener("change", update); form.addEventListener("rowloaded", function () { var gm = form.elements.g_masa.value, gt = form.elements.g_tithi.value; update(); });
    })();

    // Membership applications
    (function () {
      var list = document.getElementById("apps-list");
      if (!list) return;
      function e(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
      var rows = {};
      function load() {
        client.from("membership_applications").select("*").order("created_at", { ascending: false }).then(function (r) {
          if (r.error) { list.innerHTML = '<p style="font-size:13px;color:var(--muted);">Applications are not switched on yet (the owner runs the membership SQL file once).</p>'; return; }
          rows = {}; (r.data || []).forEach(function (x) { rows[x.id] = x; });
          list.innerHTML = (r.data || []).map(function (x) {
            var badge = x.status === "new" ? "NEW" : x.status.toUpperCase();
            return '<div class="card" style="padding:10px 14px;"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;"><div><strong>' + e(x.name) + '</strong> <span style="font-size:11px;font-weight:700;color:var(--muted);">' + badge + '</span><br><span style="font-size:13px;">' + e([x.phone, x.email].filter(Boolean).join(" \u00b7 ")) + '</span><br><span style="font-size:12px;color:var(--muted);">' + e(String(x.created_at).slice(0, 10)) + (x.note ? " \u00b7 " + e(x.note) : "") + '</span></div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + (x.status !== "approved" ? '<button type="button" class="button" data-app="approved" data-id="' + e(x.id) + '" style="font-size:11px;padding:4px 10px;min-height:auto;">Approve</button>' : '') + (x.status !== "declined" ? '<button type="button" class="button secondary" data-app="declined" data-id="' + e(x.id) + '" style="font-size:11px;padding:4px 10px;min-height:auto;">Decline</button>' : '') + '<button type="button" class="button secondary" data-app="delete" data-id="' + e(x.id) + '" style="font-size:11px;padding:4px 10px;min-height:auto;">Delete</button></div></div></div>';
          }).join("") || '<p style="font-size:13px;color:var(--muted);">No applications yet.</p>';
          list.querySelectorAll("[data-app]").forEach(function (b) {
            b.addEventListener("click", function () {
              var id = b.getAttribute("data-id"), act = b.getAttribute("data-app");
              if (act === "delete") { if (!confirm("Delete this application for good?")) return; client.from("membership_applications").delete().eq("id", id).then(load); return; }
              client.from("membership_applications").update({ status: act }).eq("id", id).then(function () {
                if (act === "approved" && rows[id] && rows[id].email) {
                  var f = document.getElementById("add-member-form");
                  if (f && f.elements.email) { f.elements.email.value = rows[id].email; f.closest("details").open = true; }
                }
                load();
              });
            });
          });
        });
      }
      document.querySelector('[data-tab="people"]').addEventListener("click", load);
      load();
    })();

    // Sign-ups list
    (function () {
      var list = document.getElementById("reg-list"), csvBtn = document.getElementById("reg-csv"), rows = [];
      if (!list) return;
      function e(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
      function load() {
        client.from("registrations").select("*").order("created_at", { ascending: false }).then(function (r) {
          if (r.error) { list.innerHTML = '<p style="font-size:13px;color:var(--muted);">The sign-ups list is not switched on yet (the owner runs file 9 once).</p>'; return; }
          rows = r.data || [];
          list.innerHTML = rows.map(function (x) {
            return '<div class="card" style="padding:10px 14px;display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;"><div><strong>' + e(x.name) + '</strong> &middot; ' + e(x.contact) + '<br><span style="font-size:12px;color:var(--muted);">' + e(x.program) + ' &middot; ' + e(String(x.created_at).slice(0, 10)) + '</span></div><button type="button" class="button secondary" data-reg-del="' + e(x.id) + '">Delete</button></div>';
          }).join("") || '<p style="font-size:13px;color:var(--muted);">No sign-ups yet.</p>';
          list.querySelectorAll("[data-reg-del]").forEach(function (b) {
            b.addEventListener("click", function () {
              if (!confirm("Delete this sign-up?")) return;
              client.from("registrations").delete().eq("id", b.getAttribute("data-reg-del")).then(load);
            });
          });
        });
      }
      csvBtn.addEventListener("click", function () {
        var q = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
        var csv = "Name,Contact,Program,Date\r\n" + rows.map(function (x) { return [x.name, x.contact, x.program, String(x.created_at).slice(0, 10)].map(q).join(","); }).join("\r\n");
        var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "iskcon-juja-signups.csv"; a.click();
      });
      document.querySelector('[data-tab="registrations"]').addEventListener("click", load);
    })();

    // Photo upload helper: file input -> storage bucket "site-images" -> hidden field with the public link.
    function wirePhoto(inputId, hiddenId, statusId, prefix) {
      var input = document.getElementById(inputId);
      var hidden = document.getElementById(hiddenId);
      if (!input || !hidden) return;
      var status = document.getElementById(statusId);
      var form = input.form;
      function clear() { hidden.value = ""; input.value = ""; if (status) status.textContent = ""; }
      if (form) form.addEventListener("reset", function () { setTimeout(clear, 0); });
      input.addEventListener("change", function () {
        var file = input.files[0];
        if (!file) return;
        if (status) status.textContent = "Uploading...";
        var path = prefix + "-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        client.storage.from("site-images").upload(path, file, { upsert: true }).then(function (up) {
          if (up.error) { if (status) status.textContent = "Upload failed: " + up.error.message; return; }
          hidden.value = client.storage.from("site-images").getPublicUrl(path).data.publicUrl;
          if (status) status.textContent = "Picture attached \u2014 it will save with this item.";
        });
      });
    }
    // Or paste a link to a picture that lives on another site (your images site).
    function wireLink(linkId, hiddenId, statusId, inputId) {
      var link = document.getElementById(linkId), hidden = document.getElementById(hiddenId);
      if (!link || !hidden) return;
      var status = document.getElementById(statusId), input = document.getElementById(inputId);
      link.addEventListener("input", function () {
        var v = (link.value || "").trim();
        if (v && !/^https?:\/\//i.test(v)) v = "https://" + v;
        if (/^https:\/\/\S+\.\S+/i.test(v)) { hidden.value = v; if (input) input.value = ""; if (status) status.textContent = "Picture link attached \u2014 it will save with this item."; }
        else if (!v) { hidden.value = ""; if (status) status.textContent = ""; }
        else if (status) status.textContent = "Keep typing: the link must start with https://";
      });
      if (link.form) link.form.addEventListener("reset", function () { setTimeout(function () { link.value = ""; }, 0); });
    }
    wireLink("product-photo-link", "product-image-url", "product-photo-status", "product-photo-input");
    wireLink("event-photo-link", "event-image-url", "event-photo-status", "event-photo-input");
    wirePhoto("product-photo-input", "product-image-url", "product-photo-status", "product");
    wirePhoto("event-photo-input", "event-image-url", "event-photo-status", "event");

    wireTable("products", "product-form", "products-admin-list", "product-status", function (p) {
      var price = p.price_kes ? "KES " + p.price_kes : "Free";
      return rowShell("products", p.id, p.published, p.name, p.category + " · " + price);
    });

    wireTable("courses", "course-form", "courses-admin-list", "course-status", function (c) {
      return rowShell("courses", c.id, c.published, c.title, (c.visibility || "members") + " \u00b7 " + (c.schedule || "No schedule set"));
    });

    // ============================================================
    // ADD A MEMBER (admin creates the login; calls the server-side
    // "admin-create-member" function, which is the only place the
    // secret key is ever used — never in the browser)
    // ============================================================
    (function () {
      var form = document.getElementById("add-member-form");
      if (!form) return;
      var status = document.getElementById("add-member-status");

      document.getElementById("gen-password-btn").addEventListener("click", function () {
        // no look-alike characters (0/O, 1/l/I) so it is easy to read out or type
        var chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
        var bytes = new Uint32Array(12);
        crypto.getRandomValues(bytes);
        var pw = "";
        for (var i = 0; i < bytes.length; i++) pw += chars[bytes[i] % chars.length];
        form.elements.temp_password.value = pw;
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = form.elements.email.value.trim();
        var pw = form.elements.temp_password.value;
        status.style.color = "var(--muted)";
        status.textContent = "Creating account...";
        client.functions.invoke("admin-create-member", { body: { email: email, temp_password: pw } })
          .then(function (res) {
            if (!res.error) return res;
            // the server's own message is inside the error's response body
            var ctx = res.error.context;
            if (ctx && typeof ctx.json === "function") {
              return ctx.json().then(
                function (j) { throw new Error(j.error || res.error.message); },
                function () { throw new Error(res.error.message); }
              );
            }
            throw new Error(res.error.message);
          })
          .then(function () {
            status.style.color = "#2E7D32";
            status.innerHTML = "Account created for <strong>" + esc(email) + "</strong>. Send them this temporary password yourself: <strong>" + esc(pw) + "</strong>. They can change it from their dashboard.";
            form.reset();
            loadPeople();
          })
          .catch(function (err) {
            status.style.color = "#b33a2e";
            var msg = err.message || "Something went wrong.";
            if (/failed to send|not found|404/i.test(msg)) {
              msg = "The add-member function has not been deployed yet, so this cannot work until it is (a one-time setup step).";
            }
            status.textContent = msg;
          });
      });
    })();

    // ============================================================
    // TESTIMONIALS: approve (publish) or delete
    // ============================================================
    function loadTestimonials() {
      client.from("testimonials").select("*").order("created_at", { ascending: false }).then(function (r) {
        if (r.error || !r.data) return;
        var pending = r.data.filter(function (t) { return !t.published; }).length;
        var tabBtn = document.querySelector('[data-tab="testimonials"]');
        if (tabBtn) tabBtn.textContent = pending ? "Testimonials (" + pending + " new)" : "Testimonials";

        var list = document.getElementById("testimonials-admin-list");
        list.innerHTML = r.data.length ? r.data.map(function (t) {
          return '<div style="padding:12px;background:var(--row-tint);border-radius:6px;">' +
            '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;">' +
            '<strong style="font-size:13px;">' + esc(t.name) + '</strong>' +
            '<span style="font-size:11px;color:var(--muted);">' + new Date(t.created_at).toLocaleDateString() + (t.published ? "" : " &middot; <strong>waiting for approval</strong>") + '</span></div>' +
            '<p style="margin:8px 0;font-size:14px;">' + esc(t.message) + '</p>' +
            '<div style="display:flex;gap:12px;align-items:center;">' +
            '<label style="font-size:12px;display:flex;align-items:center;gap:4px;"><input type="checkbox" data-t-approve="' + t.id + '" ' + (t.published ? "checked" : "") + '> Approved</label>' +
            '<button type="button" data-t-del="' + t.id + '" class="button secondary" style="font-size:11px;padding:4px 10px;min-height:auto;">Delete</button>' +
            '</div></div>';
        }).join("") : '<p style="font-size:13px;color:var(--muted);">No testimonials yet.</p>';

        list.querySelectorAll("[data-t-approve]").forEach(function (chk) {
          chk.addEventListener("change", function () {
            client.from("testimonials").update({ published: chk.checked }).eq("id", chk.getAttribute("data-t-approve")).then(loadTestimonials);
          });
        });
        list.querySelectorAll("[data-t-del]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (!confirm("Delete this testimonial? This cannot be undone.")) return;
            client.from("testimonials").delete().eq("id", btn.getAttribute("data-t-del")).then(loadTestimonials);
          });
        });
      });
    }
    loadTestimonials();

    // ============================================================
    // BUSINESS CARD (85 x 55 mm). Front = all contact details. Back = quote + decoration.
    // Print sheet: A4, 2 x 5 cards, 2 mm gaps, page 1 fronts, page 2 backs (double-sided, flip on long edge).
    // Everything fills in from data already on the site; nothing is hardcoded here except the layout.
    // ============================================================
    (function () {
      var fh = document.getElementById("bc-front-holder");
      if (!fh) return;
      var bh = document.getElementById("bc-back-holder");
      var status = document.getElementById("card-status");
      var sel = document.getElementById("bc-quote-select");
      var customBox = document.getElementById("bc-custom-box");
      var customQ = document.getElementById("bc-custom-quote");
      var customS = document.getElementById("bc-custom-source");
      var zoomSel = document.getElementById("bc-zoom");
      var decoInput = document.getElementById("bc-deco-image"), decoSel = document.getElementById("bc-deco-kind"), inkIn = document.getElementById("bc-ink"), ph2In = document.getElementById("bc-phone2"), nm2In = document.getElementById("bc-name2");
      var HOSTS = window.ISKCON_HOSTS || {}, siteUrl = HOSTS.publicOrigin || window.location.origin.replace("//portal.", "//");   // the PUBLIC site, never the member portal
      var primary = (window.ISKCON && window.ISKCON.WHATSAPP_PRIMARY) || "";
      var data = {
        address: "Anthusia Apartments, Muraya Access Road, Juja",
        phone: primary ? "+" + primary.slice(0, 3) + " " + primary.slice(3, 6) + " " + primary.slice(6, 9) + " " + primary.slice(9) : "",
        site: siteUrl.replace(/^https?:\/\//, ""),
        socials: [], till: "", quotes: [], quote: "", source: "", deco: "", logoSvg: "", deco: "", ink: true
      };
      function esc(t) { return String(window.PLAIN ? PLAIN(t) : (t == null ? "" : t)).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
      var ICON = {
        whatsapp: '<svg viewBox="0 0 24 24" width="9" height="9" fill="#25D366"><path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7a11.9 11.9 0 0 0 5.6 1.4c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3z"/></svg>',
        web: '<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#800020" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20"/></svg>',
        pin: '<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#800020" stroke-width="2.4"><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
        instagram: '<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#800020" stroke-width="2.4"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="#800020"/></svg>',
        tiktok: '<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#800020" stroke-width="2.6" stroke-linecap="round"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 3 2.5 4.5 5 4.7"/></svg>',
        youtube: '<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#800020" stroke-width="2.2"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z" fill="#800020"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#800020" stroke-width="2.4"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/></svg>'
      };
      function handleOf(url) { var m = String(url).replace(/[?#].*$/, "").replace(/\/+$/, "").split("/"); return m[m.length - 1] || ""; }

      function qrInto(holder, size) {
        holder.innerHTML = "";
        if (window.QRCode) new QRCode(holder, { text: siteUrl, width: size, height: size, colorDark: "#800020", colorLight: "#ffffff" });
      }

      var MANTRA = 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare<br>Hare Rama Hare Rama Rama Rama Hare Hare';
      function frontFace() {
        var d = document.createElement("div");
        d.className = "bc-face bc-front bcf";
        var soc = data.socials.map(function (s) { return '<span class="bc-soc">' + ICON[s.kind] + esc(s.text) + "</span>"; }).join("");
        d.innerHTML =
          '<div class="bcf-logo">' + data.logoSvg + '</div>' +
          '<p class="bcf-title">ISKCON Founder-Acharya<br><b>His Divine Grace<br>A.C. Bhaktivedanta Swami Prabhupada</b></p>' +
          '<img class="bc-photo" src="images/prabhupada-sitting.webp" alt="">' +
          '<div class="bc-qr"></div>' +
          '<div class="bc-lines bcf-details">' +
             '<p>' + ICON.pin + esc(data.address) + '</p>' +
             PHONES.ready().map(function (p) { return '<p><b>' + ICON.whatsapp + esc(nicePhone(p.phone)) + ' (' + esc(p.name) + ')</b></p>'; }).join("") +
             '<p><b>' + ICON.web + esc(data.site) + '</b></p>' +
             (data.till ? '<p>M-Pesa Till: <b>' + esc(data.till) + '</b></p>' : "") +
             (soc ? '<p class="bc-socs">' + soc + '</p>' : "") +
          '</div>' +
          '<p class="bc-mantra bcf-mantra">' + MANTRA + '</p>';
        qrInto(d.querySelector(".bc-qr"), 58);
        return d;
      }

      var DECO = {
        lotus: '<svg viewBox="0 0 60 30" width="46" height="23" fill="none" stroke="#e8c85a" stroke-width="1.3"><path d="M30 28C24 22 24 10 30 3c6 7 6 19 0 25zM30 28C20 26 12 18 12 9c9 1 16 8 18 19zM30 28c10-2 18-10 18-19-9 1-16 8-18 19zM30 28C16 28 6 22 3 14c10-1 20 4 27 14zM30 28c14 0 24-6 27-14-10-1-20 4-27 14z"/></svg>',
        mridanga: '<svg viewBox="0 0 80 28" width="62" height="22" fill="none" stroke="#e8c85a" stroke-width="1.3"><path d="M4 8c0-3 3-4 5-4h2l14 4c10 3 20 3 30 0l14-4h2c2 0 5 1 5 4v12c0 3-3 4-5 4h-2l-14-4c-10-3-20-3-30 0L11 24H9c-2 0-5-1-5-4z"/><ellipse cx="7" cy="14" rx="3" ry="8"/><ellipse cx="73" cy="14" rx="3" ry="8"/><path d="M26 7l4 14M36 9l3 10M44 9l-3 10M54 7l-4 14"/></svg>',
        karatalas: '<svg viewBox="0 0 40 28" width="30" height="21" fill="none" stroke="#e8c85a" stroke-width="1.3"><circle cx="11" cy="17" r="8"/><circle cx="29" cy="17" r="8"/><circle cx="11" cy="17" r="2.5"/><circle cx="29" cy="17" r="2.5"/><path d="M11 9C13 3 27 3 29 9"/></svg>',
        feather: '<svg viewBox="0 0 30 34" width="22" height="25" fill="none" stroke="#e8c85a" stroke-width="1.2" stroke-linecap="round"><path d="M15 33C15 26 15 19 15 12"/><ellipse cx="15" cy="9" rx="7" ry="9"/><ellipse cx="15" cy="9" rx="3.7" ry="5.2"/><circle cx="15" cy="9" r="1.3" fill="#e8c85a"/><path d="M15 23l-6-3M15 26l-7-3M15 23l6-3M15 26l7-3"/></svg>',
        flute: '<svg viewBox="0 0 44 34" width="34" height="26" fill="none" stroke="#e8c85a" stroke-width="1.2" stroke-linecap="round"><circle cx="22" cy="7" r="3.2"/><path d="M20.3 3.6c.4-2.2 2.6-3 4-.8M22.5 3.2v-2.4"/><path d="M22 10.5c-2.4 5 2.2 9 0 14"/><path d="M22 24.5l-5.5 8.5M22 24.5l6.5 8.5"/><path d="M13 13.5l22-5"/><path d="M22 13.5c-3 .6-6-.2-9-.8M22 13.5c3 0 7-1.6 11-4.3"/></svg>',
        gaura: '<svg viewBox="0 0 50 34" width="38" height="26" fill="none" stroke="#e8c85a" stroke-width="1.2" stroke-linecap="round"><circle cx="15" cy="7" r="2.9"/><path d="M15 10l-.8 11M14.6 12.5L8 4M14.8 12.5L22 5M14 21l-5 10M14 21l7 7"/><circle cx="35" cy="7" r="2.9"/><path d="M35 10l.8 11M35.4 12.5L42 4M35.2 12.5L28 5M36 21l5 10M36 21l-7 7"/></svg>',
        conch: '<svg viewBox="0 0 40 30" width="30" height="22" fill="none" stroke="#e8c85a" stroke-width="1.2" stroke-linecap="round"><path d="M4 22c0-9 8-17 18-17 7 0 12 4 13 9 1 6-4 11-10 11-5 0-8-3-8-7 0-3 2-5 5-5 2 0 3 1.500 3 3"/><path d="M4 22c2 4 7 6 12 5M30 24l6 4M33 21l5 1"/></svg>',
        corner: '<svg viewBox="0 0 30 30" width="18" height="18" fill="none" stroke="#e8c85a" stroke-width="1.2"><path d="M2 28V10C2 5 5 2 10 2h18"/><path d="M8 28V14c0-3 3-6 6-6h14" opacity=".6"/><circle cx="4" cy="4" r="1.6" fill="#e8c85a" stroke="none"/></svg>'
      };
      function backFace(q) {
        var d = document.createElement("div");
        d.className = "bc-face bc-back";
        q = q || { text: data.quote, source: data.source };
        var pick = decoSel ? decoSel.value : "random", n = 1, ids;
        if (data.deco) ids = null;
        else if (pick === "lotus" || pick === "feather") ids = null;
        else if (q) ids = ART.ids(pick, n);                                  // every card on the sheet gets its own pictures
        else { if (!data.previewArt || data.previewArt.length !== n || data.previewKey !== pick) { data.previewArt = ART.ids(pick, n); data.previewKey = pick; } ids = data.previewArt; }
        var top = data.deco ? '<img class="bc-deco-img" src="' + esc(data.deco) + '" alt="">' : ids ? ART.strip(ids, data.ink ? "g" : "y", "bc-art bc-art" + ids.length) : (DECO[pick] || DECO.lotus);
        if (data.ink) d.className += " ink";
        d.innerHTML =
          '<div class="bc-frame"></div>' +
          '<span class="bc-c bc-c1">' + DECO.corner + '</span><span class="bc-c bc-c2">' + DECO.corner + '</span><span class="bc-c bc-c3">' + DECO.corner + '</span><span class="bc-c bc-c4">' + DECO.corner + '</span>' +
          '<div class="bc-top">' + top + '</div>' +
          '<div class="bc-quote"><p>&ldquo;' + esc(q.text) + '&rdquo;</p>' + (q.source ? '<span>&mdash; ' + esc(q.source) + '</span>' : "") + '</div>' +
          '<div class="bc-bottom bcb-mantra"><p>' + MANTRA + '</p></div>';
        return d;
      }

      function fitQuote(root) {
        var q = root.querySelector(".bc-quote p"); if (!q) return;
        var len = q.textContent.length;
        q.style.fontSize = len > 150 ? "10.6px" : len > 110 ? "11.6px" : len > 80 ? "12.6px" : "14px";
      }

      function render() {
        var z = parseFloat(zoomSel.value) || 1;
        fh.innerHTML = ""; bh.innerHTML = "";
        var f = frontFace(), b = backFace(); fitQuote(b);
        [f, b].forEach(function (x) { x.style.zoom = z; });
        fh.appendChild(f); bh.appendChild(b);
      }

      var pool = [], curRand = null;
      function shuffled(n) { var a = pool.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a.slice(0, n); }
      function currentQuote() {
        if (sel.value === "__custom") { data.quote = customQ.value.trim() || "Your quote here"; data.source = customS.value.trim(); }
        else if (sel.value === "__random") { if (!curRand) curRand = shuffled(1)[0] || { quote_text: "", source: "" }; data.quote = curRand.quote_text; data.source = curRand.source; }
        else { var q = data.quotes[parseInt(sel.value, 10)]; data.quote = q ? q.quote_text : ""; data.source = q ? q.source : ""; }
      }
      function refresh() { customBox.hidden = sel.value !== "__custom"; currentQuote(); render(); }
      var shuffleBtn = document.getElementById("bc-shuffle"), nameIn = document.getElementById("bc-name");
      if (shuffleBtn) shuffleBtn.addEventListener("click", function () { sel.value = "__random"; curRand = null; data.previewDeco = null; data.previewArt = null; refresh(); });
      function nicePhone(raw) { var d = String(raw || "").replace(/\D/g, ""); if (d.charAt(0) === "0") d = "254" + d.slice(1); return d.length === 12 ? "+" + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6, 9) + " " + d.slice(9) : String(raw || "").trim(); }
      function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
      function stored(k, dflt) { try { var v = localStorage.getItem(k); return v === null ? dflt : v; } catch (e) { return dflt; } }
      // Phone numbers: one shared list (phones.js), each number with its own name.
      PHONES.mount(document.getElementById("bc-phones-box")); PHONES.onChange(function () { render(); });
      data.ink = stored("bc_ink", "1") === "1";
      if (inkIn) inkIn.checked = data.ink;
      if (inkIn) inkIn.addEventListener("change", function () { data.ink = inkIn.checked; store("bc_ink", data.ink ? "1" : "0"); render(); });
      if (decoSel) { decoSel.innerHTML = ART.options('<option value="random">A different one on every card</option><option value="lotus">Lotus (drawn)</option><option value="feather">Peacock feather (drawn)</option>'); decoSel.addEventListener("change", render); }
      sel.addEventListener("change", function () { curRand = null; data.previewArt = null; refresh(); });
      [customQ, customS].forEach(function (x) { x.addEventListener("input", refresh); });
      zoomSel.addEventListener("change", render);
      decoInput.addEventListener("change", function () {
        var file = decoInput.files[0];
        if (!file) { data.deco = ""; refresh(); return; }
        var rd = new FileReader();
        rd.onload = function () { data.deco = rd.result; refresh(); };
        rd.readAsDataURL(file);
      });

      // ---- load site data ----
      Promise.all([
        fetch("images/juja-logo.svg").then(function (r) { return r.text(); }).catch(function () { return ""; }),
        client.from("site_settings").select("key,value"),
        client.from("quotes").select("quote_text", { count: "exact", head: true }).eq("use_weekly", true)
      ]).then(function (res) {
        // a random window of the PUBLIC quotes (the database hands out at most 1000 at a time)
        var total = res[2].count || 0, from = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 999)));
        return client.from("quotes").select("quote_text,source").eq("use_weekly", true).order("id", { ascending: true }).range(from, from + 999).then(function (q) { res[2] = q; return res; });
      }).then(function (res) {
        data.logoSvg = (res[0] || "").replace(/<svg /, '<svg height="100%" ');
        var set = {}; (res[1].data || []).forEach(function (r) { set[r.key] = r.value; });
        data.till = set.mpesa_till || "";
        [["instagram_url", "instagram"], ["tiktok_url", "tiktok"], ["youtube_url", "youtube"], ["facebook_url", "facebook"]].forEach(function (p) {
          if (set[p[0]]) data.socials.push({ kind: p[1], text: handleOf(set[p[0]]) });
        });
        data.quotes = (res[2].data || []).filter(function (q) { return q.quote_text && q.quote_text.length <= 140; });
        pool = data.quotes;
        sel.innerHTML = '<option value="__random">A different random public quote on every card (recommended)</option>' + data.quotes.slice(0, 150).map(function (q, i) { return '<option value="' + i + '">' + esc(q.quote_text.length > 70 ? q.quote_text.slice(0, 70) + "…" : q.quote_text) + "</option>"; }).join("") +
          '<option value="__custom">Write my own quote…</option>';
        sel.value = data.quotes.length ? "__random" : "__custom";
        refresh();
      });

      // ---- print: 2 pages, A4, 2 x 5 cards, 2 mm gap ----
      document.getElementById("bc-print-btn").addEventListener("click", function () {
        var root = document.getElementById("card-print-root");
        if (root) root.remove();
        root = document.createElement("div"); root.id = "card-print-root";
        [frontFace, backFace].forEach(function (make) {
          var sheet = document.createElement("div"); sheet.className = "bc-sheet";
          var picks = (make === backFace && sel.value === "__random") ? shuffled(10) : [];
          for (var i = 0; i < 10; i++) { var f = (make === backFace && picks.length) ? make({ text: picks[i % picks.length].quote_text, source: picks[i % picks.length].source }) : make(); if (make === backFace) fitQuote(f); sheet.appendChild(f); }
          root.appendChild(sheet);
        });
        document.body.appendChild(root);
        document.body.classList.add("card-printing");
        function done() { document.body.classList.remove("card-printing"); window.removeEventListener("afterprint", done); }
        window.addEventListener("afterprint", done);
        setTimeout(function () { window.print(); }, 250);
      });

      // ---- PNG export (each side at high resolution) ----
      document.getElementById("bc-png-btn").addEventListener("click", function () {
        if (!window.html2canvas) { status.textContent = "The picture-export library did not load. Check your internet connection."; return; }
        status.textContent = "Making pictures...";
        var jobs = [frontFace(), backFace()];
        var stage = document.createElement("div"); stage.style.cssText = "position:fixed;left:-9999px;top:0;";
        jobs.forEach(function (f) { stage.appendChild(f); }); document.body.appendChild(stage); fitQuote(jobs[1]);
        var imgs = Array.from(stage.querySelectorAll("img")).map(function (img) { return img.complete ? Promise.resolve() : new Promise(function (r) { img.onload = img.onerror = r; }); });
        Promise.all(imgs).then(function () {
          return Promise.all(jobs.map(function (f) { return html2canvas(f, { scale: 6, backgroundColor: null, useCORS: true }); }));
        }).then(function (cv) {
          ["front", "back"].forEach(function (side, i) { var a = document.createElement("a"); a.download = "iskcon-juja-card-" + side + ".png"; a.href = cv[i].toDataURL("image/png"); a.click(); });
          status.textContent = "Downloaded both sides.";
        }).catch(function (e) { status.textContent = "Could not make the pictures: " + e.message; }).then(function () { stage.remove(); });
      });
    })();
  });
})();
