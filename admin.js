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
    document.querySelectorAll(".admin-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".admin-tab-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var tab = btn.getAttribute("data-tab");
        document.querySelectorAll(".admin-tab-panel").forEach(function (p) {
          p.hidden = p.getAttribute("data-tab-panel") !== tab;
        });
      });
    });

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
    var TEXT_KEYS = ["mpesa_till", "pesapal_donate_url", "whatsapp_group_invite", "facebook_url", "instagram_url", "youtube_url", "tiktok_url", "address_short"];
    var BOOL_KEYS = ["store_enabled", "articles_enabled", "special_events_enabled"];

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

    settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      settingsStatus.textContent = "Saving...";
      var updates = [];
      var URL_KEYS = ["pesapal_donate_url", "whatsapp_group_invite", "facebook_url", "instagram_url", "youtube_url", "tiktok_url"];
      TEXT_KEYS.forEach(function (k) {
        var v = (settingsForm.elements[k].value || "").trim();
        if (URL_KEYS.indexOf(k) >= 0 && v && !/^https?:\/\//i.test(v)) v = "https://" + v;   // forgive a missing https://
        settingsForm.elements[k].value = v;
        updates.push({ key: k, value: v });
      });
      BOOL_KEYS.forEach(function (k) { updates.push({ key: k, value: settingsForm.elements[k].checked ? "true" : "false" }); });
      client.from("site_settings").upsert(updates).then(function (r) {
        settingsStatus.style.color = r.error ? "#b33a2e" : "#2E7D32";
        settingsStatus.textContent = r.error ? r.error.message : "Saved. Changes are live on the public site now.";
      });
    });

    // ============================================================
    // PEOPLE
    // ============================================================
    function loadPeople() {
      client.from("profiles").select("*").order("created_at", { ascending: false }).then(function (r) {
        if (r.error || !r.data) return;
        var pending = r.data.filter(function (p) { return p.role === "pending"; });
        var others = r.data.filter(function (p) { return p.role !== "pending"; });

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
      var canEdit = myRole === "super_admin";
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px;background:var(--row-tint);border-radius:6px;">' +
        '<span style="font-size:13px;">' + p.email + '</span>' +
        (canEdit
          ? '<select data-person-role="' + p.id + '" style="padding:6px;border:1px solid var(--line);border-radius:4px;font-size:12px;">' + roleOptions + '</select>'
          : '<span style="font-size:12px;font-weight:700;">' + p.role + '</span>') +
        '</div>';
    }

    function wirePersonButtons() {
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
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      function load() {
        client.from(table).select("*").order("created_at", { ascending: false }).then(function (r) {
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

    wireTable("events", "event-form", "events-admin-list", "event-status", function (ev) {
      return rowShell("events", ev.id, ev.published, ev.title, ev.start_date + (ev.end_date ? " to " + ev.end_date : "") + (ev.image_url ? " \u00b7 has picture" : ""));
    });

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
    // MESSAGE BOARD: hide / delete / reply as Admin
    // ============================================================
    function loadBoard() {
      client.from("board_messages").select("*").order("created_at", { ascending: false }).then(function (r) {
        if (r.error || !r.data) return;
        var byId = {};
        r.data.forEach(function (m) { byId[m.id] = m; });

        var list = document.getElementById("board-admin-list");
        list.innerHTML = r.data.length ? r.data.map(function (m) {
          var parent = m.parent_id ? byId[m.parent_id] : null;
          return '<div style="padding:12px;background:var(--row-tint);border-radius:6px;' + (m.hidden ? 'opacity:0.65;' : '') + '">' +
            '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
            '<strong style="font-size:13px;">' + esc(m.author_name) + (m.is_admin_reply ? ' <span style="color:var(--maroon);font-size:11px;">(Admin)</span>' : '') + (m.hidden ? ' <span style="color:#b33a2e;font-size:11px;">HIDDEN</span>' : '') + '</strong>' +
            '<span style="font-size:11px;color:var(--muted);">' + new Date(m.created_at).toLocaleString() + '</span></div>' +
            (parent ? '<div style="font-size:12px;color:var(--muted);margin-top:4px;">&hookrightarrow; reply to ' + esc(parent.author_name) + ': &ldquo;' + esc(parent.body.slice(0, 60)) + (parent.body.length > 60 ? "&hellip;" : "") + '&rdquo;</div>' : '') +
            '<p style="margin:8px 0;font-size:14px;">' + esc(m.body) + '</p>' +
            '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">' +
            '<label style="font-size:12px;display:flex;align-items:center;gap:4px;"><input type="checkbox" data-b-hide="' + m.id + '" ' + (m.hidden ? "checked" : "") + '> Hide from public</label>' +
            '<button type="button" data-b-reply="' + m.id + '" class="button secondary" style="font-size:11px;padding:4px 10px;min-height:auto;">Reply as Admin</button>' +
            '<button type="button" data-b-del="' + m.id + '" class="button secondary" style="font-size:11px;padding:4px 10px;min-height:auto;">Delete</button>' +
            '</div>' +
            '<div data-b-slot="' + m.id + '" hidden style="margin-top:10px;"></div>' +
            '</div>';
        }).join("") : '<p style="font-size:13px;color:var(--muted);">No messages have been posted yet.</p>';

        list.querySelectorAll("[data-b-hide]").forEach(function (chk) {
          chk.addEventListener("change", function () {
            client.from("board_messages").update({ hidden: chk.checked }).eq("id", chk.getAttribute("data-b-hide")).then(loadBoard);
          });
        });
        list.querySelectorAll("[data-b-del]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (!confirm("Delete this message and any replies under it? This cannot be undone.")) return;
            client.from("board_messages").delete().eq("id", btn.getAttribute("data-b-del")).then(loadBoard);
          });
        });
        list.querySelectorAll("[data-b-reply]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-b-reply");
            var slot = list.querySelector('[data-b-slot="' + id + '"]');
            if (!slot.hidden) { slot.hidden = true; slot.innerHTML = ""; return; }
            slot.hidden = false;
            slot.innerHTML = '<form style="display:flex;flex-direction:column;gap:8px;">' +
              '<textarea name="body" required placeholder="Write your reply (it will show publicly as Admin)..." style="padding:8px;border:1px solid var(--line);border-radius:4px;min-height:60px;font-size:13px;"></textarea>' +
              '<button class="button" type="submit" style="font-size:12px;padding:6px 12px;min-height:auto;width:fit-content;">Post Reply</button>' +
              '<p style="font-size:12px;" data-b-status></p></form>';
            slot.querySelector("form").addEventListener("submit", function (e) {
              e.preventDefault();
              var body = e.target.elements.body.value.trim();
              if (!body) return;
              client.from("board_messages").insert({
                parent_id: id, author_name: "Admin", is_anonymous: false, body: body, is_admin_reply: true
              }).then(function (res) {
                if (res.error) { e.target.querySelector("[data-b-status]").textContent = res.error.message; return; }
                loadBoard();
              });
            });
          });
        });
      });
    }
    loadBoard();

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
      var decoInput = document.getElementById("bc-deco-image");
      var siteUrl = window.location.origin;
      var primary = (window.ISKCON && window.ISKCON.WHATSAPP_PRIMARY) || "";
      var data = {
        address: "Anthusia Apartments, Muraya Access Road, Juja",
        phone: primary ? "+" + primary.slice(0, 3) + " " + primary.slice(3, 6) + " " + primary.slice(6, 9) + " " + primary.slice(9) : "",
        site: siteUrl.replace(/^https?:\/\//, ""),
        socials: [], till: "", quotes: [], quote: "", source: "", deco: "", logoSvg: ""
      };
      function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
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

      function frontFace() {
        var d = document.createElement("div");
        d.className = "bc-face bc-front";
        var soc = data.socials.map(function (s) { return '<span class="bc-soc">' + ICON[s.kind] + esc(s.text) + "</span>"; }).join("");
        d.innerHTML =
          '<div class="bc-left">' +
           '<p class="bc-title">ISKCON Founder-&#256;c&#257;rya<br>His Divine Grace A.C. Bhaktivedanta Swami Prabhup&#257;da</p>' +
           '<p class="bc-mantra">Hare K&#7771;&#7779;&#7751;a Hare K&#7771;&#7779;&#7751;a K&#7771;&#7779;&#7751;a K&#7771;&#7779;&#7751;a Hare Hare<br>Hare R&#257;ma Hare R&#257;ma R&#257;ma R&#257;ma Hare Hare</p>' +
           '<div class="bc-rule"></div>' +
           '<div class="bc-contact"><div class="bc-lines">' +
             '<p>' + ICON.pin + esc(data.address) + '</p>' +
             (data.phone ? '<p><b>' + ICON.whatsapp + esc(data.phone) + '</b></p>' : "") +
             '<p><b>' + ICON.web + esc(data.site) + '</b></p>' +
             (data.till ? '<p>M-Pesa Till: <b>' + esc(data.till) + '</b></p>' : "") +
             (soc ? '<p class="bc-socs">' + soc + '</p>' : "") +
           '</div><div class="bc-qr"></div></div>' +
          '</div>' +
          '<div class="bc-right"><img class="bc-photo" src="images/prabhupada-sitting.webp" alt="">' +
          '<div class="bc-logo">' + data.logoSvg + '</div></div>';
        qrInto(d.querySelector(".bc-qr"), 44);
        return d;
      }

      var DECO = {
        lotus: '<svg viewBox="0 0 60 30" width="46" height="23" fill="none" stroke="#e8c85a" stroke-width="1.3"><path d="M30 28C24 22 24 10 30 3c6 7 6 19 0 25zM30 28C20 26 12 18 12 9c9 1 16 8 18 19zM30 28c10-2 18-10 18-19-9 1-16 8-18 19zM30 28C16 28 6 22 3 14c10-1 20 4 27 14zM30 28c14 0 24-6 27-14-10-1-20 4-27 14z"/></svg>',
        mridanga: '<svg viewBox="0 0 80 28" width="62" height="22" fill="none" stroke="#e8c85a" stroke-width="1.3"><path d="M4 8c0-3 3-4 5-4h2l14 4c10 3 20 3 30 0l14-4h2c2 0 5 1 5 4v12c0 3-3 4-5 4h-2l-14-4c-10-3-20-3-30 0L11 24H9c-2 0-5-1-5-4z"/><ellipse cx="7" cy="14" rx="3" ry="8"/><ellipse cx="73" cy="14" rx="3" ry="8"/><path d="M26 7l4 14M36 9l3 10M44 9l-3 10M54 7l-4 14"/></svg>',
        karatalas: '<svg viewBox="0 0 40 28" width="30" height="21" fill="none" stroke="#e8c85a" stroke-width="1.3"><circle cx="11" cy="17" r="8"/><circle cx="29" cy="17" r="8"/><circle cx="11" cy="17" r="2.5"/><circle cx="29" cy="17" r="2.5"/><path d="M11 9C13 3 27 3 29 9"/></svg>',
        corner: '<svg viewBox="0 0 30 30" width="18" height="18" fill="none" stroke="#e8c85a" stroke-width="1.2"><path d="M2 28V10C2 5 5 2 10 2h18"/><path d="M8 28V14c0-3 3-6 6-6h14" opacity=".6"/><circle cx="4" cy="4" r="1.6" fill="#e8c85a" stroke="none"/></svg>'
      };
      function backFace() {
        var d = document.createElement("div");
        d.className = "bc-face bc-back";
        var top = data.deco ? '<img class="bc-deco-img" src="' + esc(data.deco) + '" alt="">' : DECO.lotus;
        d.innerHTML =
          '<div class="bc-frame"></div>' +
          '<span class="bc-c bc-c1">' + DECO.corner + '</span><span class="bc-c bc-c2">' + DECO.corner + '</span><span class="bc-c bc-c3">' + DECO.corner + '</span><span class="bc-c bc-c4">' + DECO.corner + '</span>' +
          '<div class="bc-top">' + top + '</div>' +
          '<div class="bc-quote"><p>&ldquo;' + esc(data.quote) + '&rdquo;</p>' + (data.source ? '<span>&mdash; ' + esc(data.source) + '</span>' : "") + '</div>' +
          '<div class="bc-bottom"><span class="bc-kar">' + DECO.karatalas + '</span>' + DECO.mridanga + '<span class="bc-kar bc-flip">' + DECO.karatalas + '</span></div>';
        return d;
      }

      function fitQuote(root) {
        var q = root.querySelector(".bc-quote p"); if (!q) return;
        var len = q.textContent.length;
        q.style.fontSize = len > 110 ? "9.5px" : len > 80 ? "10.5px" : "12px";
      }

      function render() {
        var z = parseFloat(zoomSel.value) || 1;
        fh.innerHTML = ""; bh.innerHTML = "";
        var f = frontFace(), b = backFace(); fitQuote(b);
        [f, b].forEach(function (x) { x.style.zoom = z; });
        fh.appendChild(f); bh.appendChild(b);
      }

      function currentQuote() {
        if (sel.value === "__custom") { data.quote = customQ.value.trim() || "Your quote here"; data.source = customS.value.trim(); }
        else { var q = data.quotes[parseInt(sel.value, 10)]; data.quote = q ? q.quote_text : ""; data.source = q ? q.source : ""; }
      }
      function refresh() { customBox.hidden = sel.value !== "__custom"; currentQuote(); render(); }
      sel.addEventListener("change", refresh);
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
        client.from("quotes").select("quote_text,source").order("created_at", { ascending: true })
      ]).then(function (res) {
        data.logoSvg = (res[0] || "").replace(/<svg /, '<svg height="100%" ');
        var set = {}; (res[1].data || []).forEach(function (r) { set[r.key] = r.value; });
        data.till = set.mpesa_till || "";
        [["instagram_url", "instagram"], ["tiktok_url", "tiktok"], ["youtube_url", "youtube"], ["facebook_url", "facebook"]].forEach(function (p) {
          if (set[p[0]]) data.socials.push({ kind: p[1], text: handleOf(set[p[0]]) });
        });
        data.quotes = (res[2].data || []).filter(function (q) { return q.quote_text && q.quote_text.length <= 160; });
        var pref = data.quotes.findIndex(function (q) { return /simple living and high thinking/i.test(q.quote_text); });
        sel.innerHTML = data.quotes.map(function (q, i) { return '<option value="' + i + '">' + esc(q.quote_text.length > 70 ? q.quote_text.slice(0, 70) + "…" : q.quote_text) + "</option>"; }).join("") +
          '<option value="__custom">Write my own quote…</option>';
        if (pref >= 0) sel.value = String(pref);
        if (!data.quotes.length) sel.value = "__custom";
        refresh();
      });

      // ---- print: 2 pages, A4, 2 x 5 cards, 2 mm gap ----
      document.getElementById("bc-print-btn").addEventListener("click", function () {
        var root = document.getElementById("card-print-root");
        if (root) root.remove();
        root = document.createElement("div"); root.id = "card-print-root";
        [frontFace, backFace].forEach(function (make) {
          var sheet = document.createElement("div"); sheet.className = "bc-sheet";
          for (var i = 0; i < 10; i++) { var f = make(); if (make === backFace) fitQuote(f); sheet.appendChild(f); }
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
