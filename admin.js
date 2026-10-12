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
    var TEXT_KEYS = ["mpesa_till", "pesapal_donate_url", "whatsapp_group_invite", "facebook_url", "instagram_url", "youtube_url"];
    var BOOL_KEYS = ["store_enabled", "articles_enabled", "special_events_enabled", "members_enabled"];

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
      TEXT_KEYS.forEach(function (k) { updates.push({ key: k, value: settingsForm.elements[k].value || "" }); });
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
      return rowShell("events", ev.id, ev.published, ev.title, ev.start_date + (ev.end_date ? " to " + ev.end_date : ""));
    });

    var productPhotoInput = document.getElementById("product-photo-input");
    if (productPhotoInput) {
      productPhotoInput.addEventListener("change", function () {
        var file = productPhotoInput.files[0];
        if (!file) return;
        var status = document.getElementById("product-photo-status");
        if (status) status.textContent = "Uploading...";
        var path = "product-" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        client.storage.from("site-images").upload(path, file, { upsert: true }).then(function (up) {
          if (up.error) { if (status) status.textContent = "Upload failed: " + up.error.message; return; }
          var publicUrl = client.storage.from("site-images").getPublicUrl(path).data.publicUrl;
          document.getElementById("product-image-url").value = publicUrl;
          if (status) status.textContent = "Photo attached \u2014 will save with this product.";
        });
      });
    }

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
    // BUSINESS CARD GENERATOR (two-sided: front = branding, back = contact)
    // Everything auto-fills from data already on the site. No typing required.
    // ============================================================
    (function () {
      var front = document.getElementById("business-card-front");
      if (!front) return; // panel not present

      var status = document.getElementById("card-status");
      var siteUrl = window.location.origin;
      var primary = (window.ISKCON && window.ISKCON.WHATSAPP_PRIMARY) || "";
      var prettyPhone = primary ? "+" + primary.slice(0, 3) + " " + primary.slice(3, 6) + " " + primary.slice(6, 9) + " " + primary.slice(9) : "";
      var PHONE_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7a11.9 11.9 0 0 0 5.6 1.4c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3z"/></svg>';

      // Inline the logo as real SVG markup (not an <img> reference) so the
      // image-export library can always capture it reliably — this is what
      // fixed the logo not appearing in the downloaded file.
      fetch("images/juja-logo.svg").then(function (r) { return r.text(); }).then(function (svgText) {
        var holder = document.getElementById("card-logo-holder");
        holder.innerHTML = svgText;
        var svgEl = holder.querySelector("svg");
        if (svgEl) { svgEl.setAttribute("height", "70"); svgEl.setAttribute("width", "auto"); }
      });

      document.getElementById("card-preview-address").textContent = "Anthusia Apartments, Muraya Access Road, Juja";
      document.getElementById("card-preview-phone").innerHTML = PHONE_ICON + " <span>" + prettyPhone + "</span>";
      document.getElementById("card-preview-url").textContent = siteUrl.replace(/^https?:\/\//, "");

      client.from("site_settings").select("key,value").then(function (r) {
        var donateEl = document.getElementById("card-preview-donate");
        if (r.data) {
          var till = r.data.find(function (row) { return row.key === "mpesa_till"; });
          if (till && till.value) donateEl.textContent = "Donate via M-Pesa Till: " + till.value;
        }
        var qrHolder = document.getElementById("card-qr-holder");
        qrHolder.innerHTML = "";
        if (window.QRCode) new QRCode(qrHolder, { text: siteUrl, width: 95, height: 95, colorDark: "#800020", colorLight: "#ffffff" });
      });

      // Wait for every <img> inside an element to finish loading before we
      // try to screenshot it — the classic cause of "images missing" from
      // html2canvas output is capturing before the browser has actually
      // finished loading them.
      function waitForImages(el) {
        var imgs = Array.from(el.querySelectorAll("img"));
        return Promise.all(imgs.map(function (img) {
          if (img.complete) return Promise.resolve();
          return new Promise(function (resolve) { img.onload = img.onerror = resolve; });
        }));
      }

      function captureFace(el) {
        return waitForImages(el).then(function () {
          return html2canvas(el, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
        });
      }

      document.getElementById("card-download-img-btn").addEventListener("click", function () {
        if (!window.html2canvas) { status.textContent = "Image export library did not load — check your internet connection."; return; }
        status.textContent = "Generating images...";
        Promise.all([
          captureFace(document.getElementById("business-card-front")),
          captureFace(document.getElementById("business-card-back"))
        ]).then(function (canvases) {
          ["front", "back"].forEach(function (side, i) {
            var link = document.createElement("a");
            link.download = "iskcon-juja-card-" + side + ".png";
            link.href = canvases[i].toDataURL("image/png");
            link.click();
          });
          status.textContent = "Downloaded both sides.";
        }).catch(function (err) { status.textContent = "Could not generate image: " + err.message; });
      });

      document.getElementById("card-download-pdf-btn").addEventListener("click", function () {
        if (!window.html2canvas || !window.jspdf) { status.textContent = "Export library did not load — check your internet connection."; return; }
        status.textContent = "Generating print PDF...";
        Promise.all([
          captureFace(document.getElementById("business-card-front")),
          captureFace(document.getElementById("business-card-back"))
        ]).then(function (canvases) {
          var jsPDF = window.jspdf.jsPDF;
          var doc = new jsPDF({ unit: "mm", format: "a4" });
          var cardW = 85.6, cardH = 54, gap = 4;
          var marginX = (210 - (cardW * 2 + gap)) / 2;
          var marginY = 15;
          [canvases[0], canvases[1]].forEach(function (canvas, pageIdx) {
            if (pageIdx > 0) doc.addPage();
            var img = canvas.toDataURL("image/png");
            var cols = 2, rows = 4;
            for (var row = 0; row < rows; row++) {
              for (var col = 0; col < cols; col++) {
                var x = marginX + col * (cardW + gap);
                var y = marginY + row * (cardH + gap);
                doc.addImage(img, "PNG", x, y, cardW, cardH);
              }
            }
          });
          doc.save("iskcon-juja-business-cards-print.pdf");
          status.textContent = "Downloaded print-ready PDF — page 1 is the front, page 2 is the back, same grid positions. Print both pages, then cut.";
        }).catch(function (err) { status.textContent = "Could not generate PDF: " + err.message; });
      });
    })();
  });
})();
