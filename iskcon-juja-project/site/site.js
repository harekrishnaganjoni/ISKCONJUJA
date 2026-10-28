(function () {
  "use strict";
  
  // ============================================================
  // CONTACT NUMBERS — EDIT HERE ONLY. Update this one place any
  // time the program contact person changes; every WhatsApp button
  // on the site reads from here automatically.
  // Format: country code + number, no +, no spaces, no leading 0.
  // ============================================================
  const WHATSAPP_PRIMARY = "254714211692";   // Program contact (currently Tim)
  const WHATSAPP_SECONDARY = "254743184998"; // Backup contact (Dan)
  const WHATSAPP_NUMBER = WHATSAPP_PRIMARY;
  const WHATSAPP_BASE = "https://wa.me/" + WHATSAPP_NUMBER;
  
  function whatsAppLink(message) {
  return WHATSAPP_BASE + "?text=" + encodeURIComponent(message);
  }
 
  
  // ============================================================
  // SITE SETTINGS — EDIT HERE ONLY (until the admin portal exists).
  // Anything left empty ("") or false is HIDDEN from visitors, so
  // nothing that does not work yet is ever shown. Fill a value in and
  // the matching item appears automatically on every page.
  // In the next phase these values will come from the admin portal.
  // ============================================================
  const SITE_SETTINGS = {
    mpesa_till: "",             // e.g. "123456"  -> shows the M-Pesa box on Get Involved
    pesapal_donate_url: "",     // Pesapal donation link -> shows the card/mobile-money option
    facebook_url: "",           // full link, e.g. "https://facebook.com/..."
    instagram_url: "",
    youtube_url: "",
    whatsapp_group_invite: "https://chat.whatsapp.com/Bov3QCpBdmZ8dUt6oGfQqM",  // WhatsApp group invite link
    store_enabled: false,       // true -> shows the Merchandise page in the menus
    articles_enabled: false,    // true -> shows the homepage articles section
    special_events_enabled: false, // true -> shows the Special Events section
    members_enabled: false      // true -> shows the member login icon and links
  };

  function applySettings() {
    document.querySelectorAll("[data-show-if]").forEach(function (el) {
      if (SITE_SETTINGS[el.getAttribute("data-show-if")]) el.hidden = false;
    });
    document.querySelectorAll("[data-setting-link]").forEach(function (el) {
      const v = SITE_SETTINGS[el.getAttribute("data-setting-link")];
      if (v) {
        el.setAttribute("href", v);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
        el.hidden = false;
      }
    });
    document.querySelectorAll("[data-setting-text]").forEach(function (el) {
      const v = SITE_SETTINGS[el.getAttribute("data-setting-text")];
      if (v) el.textContent = v;
    });
  }
  applySettings();

  window.ISKCON = { whatsAppLink, WHATSAPP_NUMBER, WHATSAPP_PRIMARY, WHATSAPP_SECONDARY, SITE_SETTINGS, wireWhatsAppLinks };
  
  // CONTACT PHONE SHOWN ON PAGES (always read from the config above)
  document.querySelectorAll("[data-contact-phone]").forEach(function (el) {
  const n = WHATSAPP_PRIMARY;
  const pretty = "+" + n.slice(0,3) + " " + n.slice(3,6) + " " + n.slice(6,9) + " " + n.slice(9);
  el.textContent = pretty + " (WhatsApp preferred)";
  el.setAttribute("href", "tel:+" + n);
  });

  // AUTOMATED SYSTEM YEAR COUNTER
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
  
  // LIGHT / DARK MODE LOCAL CACHE LOADER
  const savedTheme = localStorage.getItem("site-theme");
  if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  }
  
  function isDark() {
  return document.body.classList.contains("dark-mode");
  }
  
  // TEXTLESS EMOJI INDICATORS
  function themeIcon() {
  return isDark() ? "☀️" : "🌙";
  }
  
  function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("site-theme", isDark() ? "dark" : "light");
  syncThemeControls();
  }
  
  function syncThemeControls() {
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
  btn.innerHTML = themeIcon();
  btn.setAttribute('aria-label', isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  });
  }
  
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
  btn.addEventListener("click", toggleTheme);
  });
  syncThemeControls();
  
  // AUTOMATED WHATSAPP LINK STRINGS TRACKER
  // Exposed as window.ISKCON.wireWhatsAppLinks so data.js can re-run this
  // after adding new elements dynamically (products, courses, etc.) —
  // this function only runs once automatically, at page load, and does
  // NOT catch anything added to the page after that on its own.
  function wireWhatsAppLinks(scope) {
  (scope || document).querySelectorAll("[data-whatsapp]").forEach(function (el) {
  const msg = el.getAttribute("data-whatsapp") || "Hi ISKCON JUJA! I would like to connect with your community.";
  el.setAttribute("href", whatsAppLink(msg));
  if (el.tagName === "A") el.setAttribute("target", "_blank");
  el.setAttribute("rel", "noopener noreferrer");
  });
  }
  wireWhatsAppLinks();
  document.addEventListener("iskcon:rerender-whatsapp", function () { wireWhatsAppLinks(); });
  
  // ACTIVE LINKS MENU HIGHLIGHTER
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".header-nav a, .drawer-nav a").forEach(function (link) {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("http") || href.startsWith("#")) return;
  const page = href.split("/").pop().split("#")[0];
  if (page === currentPage) link.classList.add("active");
  });
  
  // OFFLINE FORM VALIDATION SYSTEM
  document.querySelectorAll("[data-demo-form]").forEach(function (form) {
  form.addEventListener("submit", function (event) {
  if (window.location.protocol !== "file:") return;
  event.preventDefault();
  const notice = form.querySelector("[data-form-notice]");
  if (notice) {
  notice.textContent = "Thank you! On the live site, this form will send your details to the ISKCON JUJA team.";
  }
  form.reset();
  });
  });
  
  // DIGITAL MAGAZINE GRID ROW CONTROL
  document.querySelectorAll(".carousel-wrap").forEach(function (wrap) {
  const track = wrap.querySelector(".carousel-track");
  const prev = wrap.querySelector("[data-carousel-prev]");
  const next = wrap.querySelector("[data-carousel-next]");
  if (!track) return;
  const scrollAmount = function () {
  const card = track.querySelector(".article-card");
  return card ? card.offsetWidth + 20 : 340;
  };
  if (prev) {
  prev.addEventListener("click", function () {
  track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });
  }
  if (next) {
  next.addEventListener("click", function () {
  track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });
  }
  });
  
  // RESOURCE CATALOG FILTERS EXECUTOR
  const resourceGrid = document.querySelector("[data-resource-grid]");
  if (resourceGrid) {
  const searchInput = document.querySelector("[data-resource-search]");
  const pills = document.querySelectorAll("[data-filter-pill]");
  let activeFilter = "all";
  function filterResources() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const cards = resourceGrid.querySelectorAll("[data-category]");
  cards.forEach(function (card) {
  const cat = card.getAttribute("data-category") || "";
  const text = card.textContent.toLowerCase();
  const matchCat = activeFilter === "all" || cat === activeFilter;
  const matchSearch = !query || text.includes(query);
  card.classList.toggle("hidden", !(matchCat && matchSearch));
  });
  }
  if (searchInput) {
  searchInput.addEventListener("input", filterResources);
  }
  pills.forEach(function (pill) {
  pill.addEventListener("click", function () {
  pills.forEach(function (p) {
  p.classList.remove("active");
  });
  pill.classList.add("active");
  activeFilter = pill.getAttribute("data-filter-pill") || "all";
  filterResources();
  });
  });
  }
  
  // PAGE SIDEBAR (every page that has 2+ sections)
  // Items come from elements marked data-toc="Short label" (in page order). A page with no
  // data-toc marks falls back to its <h2> headings. The hero banner stays full width above;
  // the sections below sit beside the sidebar. Opt out with data-no-toc on <body>.
  // A small button collapses the sidebar to a thin rail (remembered). On phones the sidebar
  // becomes one small menu button. Other scripts (e.g. the Learn page) can add their own
  // groups to it through window.ISKCON_TOC.listBox.
  (function buildTocSidebar() {
    if (document.body.hasAttribute("data-no-toc")) return;
    const main = document.querySelector("main");
    if (!main) return;

    const kids = Array.from(main.children);
    let firstBody = 0;
    while (firstBody < kids.length && kids[firstBody].matches(".page-hero, .home-hero")) firstBody++;
    const bodyKids = kids.slice(firstBody);

    let marked = [];
    bodyKids.forEach(function (k) {
      if (k.matches("[data-toc]")) marked.push(k);
      k.querySelectorAll("[data-toc]").forEach(function (h) { marked.push(h); });
    });
    let items;
    if (marked.length) {
      items = marked.map(function (el) { return { el: el, text: el.getAttribute("data-toc") }; });
    } else {
      const hs = [];
      bodyKids.forEach(function (k) {
        if (k.matches("h2")) hs.push(k);
        k.querySelectorAll("h2").forEach(function (h) { hs.push(h); });
      });
      items = hs.map(function (h) { return { el: h, text: h.textContent }; });
    }
    if (items.length < 2) return; // not worth a sidebar for 0-1 sections

    function slugify(text) {
      return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    items.forEach(function (it, i) {
      if (!it.el.id) it.el.id = slugify(it.text) || "section-" + i;
      it.id = it.el.id;
    });

    const content = document.createElement("div");
    content.className = "toc-content";
    bodyKids.forEach(function (k) { content.appendChild(k); });

    const sidebar = document.createElement("nav");
    sidebar.className = "toc-sidebar";
    sidebar.setAttribute("aria-label", "Page sections");

    // desktop: small collapse button
    const collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "toc-collapse";
    sidebar.appendChild(collapseBtn);

    // phones/tablets: one small menu button that opens the list
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "toc-toggle";
    toggle.setAttribute("aria-label", "Show page sections");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "&#9776;";
    sidebar.appendChild(toggle);

    const listBox = document.createElement("div");
    listBox.className = "toc-links";
    items.forEach(function (it) {
      const a = document.createElement("a");
      a.href = "#" + it.id;
      a.textContent = it.text;
      a.addEventListener("click", function () {
        sidebar.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
      it.link = a;
      listBox.appendChild(a);
    });
    sidebar.appendChild(listBox);

    toggle.addEventListener("click", function () {
      const open = sidebar.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    const layout = document.createElement("div");
    layout.className = "toc-layout";
    layout.appendChild(sidebar);
    layout.appendChild(content);
    main.appendChild(layout);

    // collapse / expand (desktop), remembered
    let collapsed = false;
    try { collapsed = localStorage.getItem("toc-collapsed") === "1"; } catch (e) {}
    function applyCollapsed() {
      layout.classList.toggle("toc-collapsed", collapsed);
      collapseBtn.innerHTML = collapsed ? "&#8250;" : "&#8249;";
      collapseBtn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      collapseBtn.setAttribute("title", collapsed ? "Expand sidebar" : "Collapse sidebar");
      collapseBtn.setAttribute("aria-expanded", String(!collapsed));
    }
    collapseBtn.addEventListener("click", function () {
      collapsed = !collapsed;
      try { localStorage.setItem("toc-collapsed", collapsed ? "1" : "0"); } catch (e) {}
      applyCollapsed();
    });
    applyCollapsed();

    // hide links whose section is hidden (e.g. switched off in the admin settings)
    function refresh() {
      items.forEach(function (it) { it.link.hidden = !!it.el.closest("[hidden]"); });
    }
    refresh();
    document.addEventListener("iskcon:settings", refresh);
    setTimeout(refresh, 1500);

    window.ISKCON_TOC = { sidebar: sidebar, listBox: listBox, layout: layout, refresh: refresh };

    // Highlight whichever section is currently in view
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        items.forEach(function (it) { it.link.classList.remove("active"); });
        const match = items.filter(function (it) { return it.el === entry.target; })[0];
        if (match) match.link.classList.add("active");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    items.forEach(function (it) { observer.observe(it.el); });
  })();

  // SHOW FIRST N (e.g. FAQs): <div data-show-first="3"> with <details class="accordion"> children
  document.querySelectorAll("[data-show-first]").forEach(function (box) {
    const n = parseInt(box.getAttribute("data-show-first"), 10) || 3;
    const rows = Array.from(box.querySelectorAll(":scope > details.accordion"));
    if (rows.length <= n) return;
    let open = false;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button secondary show-more-btn";
    function apply() {
      rows.forEach(function (r, i) { r.hidden = !open && i >= n; });
      btn.textContent = open ? "Show fewer" : "Show " + (rows.length - n) + " more";
      btn.setAttribute("aria-expanded", String(open));
    }
    btn.addEventListener("click", function () { open = !open; apply(); });
    box.appendChild(btn);
    apply();
  });

  // READ MORE / READ LESS TOGGLE (for long passages)
  document.querySelectorAll(".read-more-toggle").forEach(function (btn) {
  btn.addEventListener("click", function () {
  const target = document.getElementById(btn.getAttribute("data-toggle-target"));
  if (!target) return;
  const nowHidden = !target.hidden;
  target.hidden = nowHidden;
  btn.textContent = nowHidden ? "Read More \u2193" : "Read Less \u2191";
  });
  });

  // BURGER MENU MOBILE TOGGLE SCRIM CLOSURE
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
  document.querySelectorAll(".drawer-nav a, .drawer-footer a").forEach(function (link) {
  link.addEventListener("click", function () {
  menuToggle.checked = false;
  });
  });
  }
 })();
 