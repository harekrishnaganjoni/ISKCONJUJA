// ADMIN: flier templates for events and invitations. Fill in the form, pick a look, print (A4, or A5 two to a sheet) or download a picture.
(function () {
  "use strict";
  var holder = document.getElementById("fl-holder");
  if (!holder || !window.ISKCON_DATA || !window.ISKCON_DATA.client) return;
  var client = window.ISKCON_DATA.client, H = window.ISKCON_HOSTS || {};
  var $ = function (id) { return document.getElementById(id); };
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MANTRA = "Hare Krishna Hare Krishna Krishna Krishna Hare Hare<br>Hare Rama Hare Rama Rama Rama Hare Hare";
  var primary = (window.ISKCON && window.ISKCON.WHATSAPP_PRIMARY) || "";
  var logoSvg = "", picture = "", events = [], artIds = [];
  var TEMPLATES = [
    { id: "t1", name: "Festival (maroon and gold)" },
    { id: "t2", name: "Kirtan night (deep blue and gold)" },
    { id: "t3", name: "Invitation (cream, elegant)" },
    { id: "t4", name: "Bold notice (white and gold)" }
  ];
  function esc(t) { return String(window.PLAIN ? PLAIN(t) : (t == null ? "" : t)).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nl(t) { return esc(t).replace(/\n/g, "<br>"); }
  function nice(raw) { var d = String(raw || "").replace(/\D/g, ""); if (d.charAt(0) === "0") d = "254" + d.slice(1); return d.length === 12 ? "+" + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6, 9) + " " + d.slice(9) : String(raw || "").trim(); }
  function phoneNice(p) { return p ? "+" + p.slice(0, 3) + " " + p.slice(3, 6) + " " + p.slice(6, 9) + " " + p.slice(9) : ""; }
  function longDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); if (!m) return ""; var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return { wd: WD[d.getUTCDay()], d: +m[3], m: MON[+m[2] - 1], y: +m[1] }; }
  function rangeText(a, b) {
    var s = longDate(a); if (!s) return "";
    var e = b && b !== a ? longDate(b) : null;
    if (!e) return s.wd + " " + s.d + " " + s.m + " " + s.y;
    if (e.m === s.m && e.y === s.y) return s.wd + " " + s.d + " to " + e.wd + " " + e.d + " " + s.m + " " + s.y;
    return s.d + " " + s.m + " to " + e.d + " " + e.m + " " + e.y;
  }
  function vals() {
    return { tpl: $("fl-tpl").value, kicker: $("fl-kicker").value.trim(), title: $("fl-title").value.trim() || "Your event title", when: $("fl-when").value.trim(), where: $("fl-where").value.trim(),
      desc: $("fl-desc").value.trim(), note: $("fl-note").value.trim(), name: $("fl-name").value.trim(), phone: $("fl-phone").value.trim(), phone2: nice($("fl-phone2").value), name2: $("fl-name2").value.trim(), ink: $("fl-ink").checked, link: $("fl-link").value.trim() || H.publicOrigin || location.origin,
      mantra: $("fl-mantra").checked, size: $("fl-size").value, art: artIds };
  }
  function build(v, px) {
    var d = document.createElement("div");
    d.className = "fl fl-" + v.tpl + " " + (v.size === "a5" ? "fl-a5" : "fl-a4") + (v.ink ? " ink" : "");
    if (px) d.style.fontSize = px + "px";
    var phones = [];
    if (v.phone) phones.push(esc(v.phone) + (v.name ? " (" + esc(v.name) + ")" : ""));
    if (v.phone2) phones.push(esc(v.phone2) + (v.name2 ? " (" + esc(v.name2) + ")" : ""));
    d.innerHTML =
      '<div class="fl-frame"></div>' +
      '<div class="fl-top"><div class="fl-logo">' + logoSvg + '</div>' +
        '<p class="fl-prabtitle">ISKCON Founder-Acharya<br><b>His Divine Grace<br>A.C. Bhaktivedanta Swami Prabhupada</b></p>' +
        '<img class="fl-prab" src="images/prabhupada-sitting.webp" alt="His Divine Grace A.C. Bhaktivedanta Swami Prabhupada"></div>' +
      (v.kicker ? '<p class="fl-kicker">' + esc(v.kicker) + '</p>' : '') +
      '<h1 class="fl-title">' + nl(v.title) + '</h1>' +
      '<div class="fl-mid">' +
      (v.when ? '<p class="fl-when"><span>' + nl(v.when) + '</span></p>' : '') +
      (picture ? '<div class="fl-pic"><img src="' + esc(picture) + '" alt=""></div>' : '') +
      (v.art.length ? ART.strip(v.art, (!v.ink && /^t[12]$/.test(v.tpl)) ? "y" : "m", "fl-art") : '') +
      (v.desc ? '<p class="fl-desc">' + nl(v.desc) + '</p>' : '') +
      (v.where ? '<p class="fl-where">' + nl(v.where) + '</p>' : '') +
      (v.note ? '<p class="fl-note">' + esc(v.note) + '</p>' : '') +
      '</div>' +
      '<div class="fl-foot"><div class="fl-qr"></div><div class="fl-contact">' +
        phones.map(function (t) { return '<b>' + t + '</b>'; }).join("") + '<span>' + esc((H.publicOrigin || location.origin).replace(/^https?:\/\//, "")) + '</span><small>' + (v.link.indexOf("#") > -1 ? "Scan for this event" : "Scan to see more") + '</small></div></div>' +
      (v.mantra ? '<p class="fl-mantra">' + MANTRA + '</p>' : '');
    var qr = d.querySelector(".fl-qr");
    if (window.QRCode) new QRCode(qr, { text: v.link, width: 128, height: 128, colorDark: "#2a1018", colorLight: "#ffffff" });
    return d;
  }
  function reArt() { artIds = ART.ids($("fl-art").value, parseInt($("fl-art-n").value, 10) || 2); render(); }
  $("fl-art").innerHTML = ART.options('<option value="none">No pictures</option><option value="random">Random (a mix)</option>');
  $("fl-art").addEventListener("change", reArt); $("fl-art-n").addEventListener("change", reArt); $("fl-art-shuffle").addEventListener("click", reArt);
  function render() { var v = vals(); holder.innerHTML = ""; holder.appendChild(build(v, 8.6 * zoom())); }
  function zoom() { var z = $("fl-zoom"); return z ? (parseInt(z.value, 10) || 100) / 100 : 1; }
  if ($("fl-zoom")) $("fl-zoom").addEventListener("input", function () { $("fl-zoom-v").textContent = this.value + "%"; render(); });

  function fillFromEvent(i) {
    var e = events[i]; if (!e) return;
    $("fl-title").value = e.title || "";
    $("fl-when").value = e.when || "";
    $("fl-desc").value = (e.description || "").slice(0, 320);
    if (e.place) $("fl-where").value = e.place;
    $("fl-link").value = (H.publicOrigin || location.origin) + "/" + (e.hash || "");   // the QR opens the home page at this very event
    if (!$("fl-kicker").value) $("fl-kicker").value = "You are invited";
    render();
  }

  // ---- inputs ----
  $("fl-tpl").innerHTML = TEMPLATES.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join("");
  $("fl-phone").value = phoneNice(primary);
  $("fl-where").value = "Anthusia Apartments, Muraya Access Road, Juja";
  $("fl-link").value = H.publicOrigin || location.origin;
  $("fl-kicker").value = "You are warmly invited";
  $("fl-note").value = "Everyone is welcome. Free entry. Prasadam served.";
  try { $("fl-name").value = localStorage.getItem("bc_name1") || ""; $("fl-phone2").value = localStorage.getItem("bc_phone2") || "0743184998"; var n2 = localStorage.getItem("bc_name2"); $("fl-name2").value = n2 === null ? "Dan" : n2; var ik = localStorage.getItem("bc_ink"); $("fl-ink").checked = ik === null ? true : ik === "1"; } catch (e) { $("fl-phone2").value = "0743184998"; $("fl-name2").value = "Dan"; }
  Array.prototype.forEach.call(document.querySelectorAll("#fl-form input, #fl-form textarea, #fl-form select"), function (el) { if (el.type !== "file") el.addEventListener("input", function () { if (el.id !== "fl-event") render(); }); });
  $("fl-event").addEventListener("change", function () { if ($("fl-event").value !== "") fillFromEvent(parseInt($("fl-event").value, 10)); });
  $("fl-pic").addEventListener("change", function () {
    var f = $("fl-pic").files[0]; if (!f) { picture = ""; render(); return; }
    var rd = new FileReader(); rd.onload = function () { picture = rd.result; render(); }; rd.readAsDataURL(f);
  });

  // ---- print: A4 one flier per page, or A5 two to a landscape A4 sheet ----
  $("fl-print").addEventListener("click", function () {
    var v = vals(), old = $("flyer-print-root"); if (old) old.remove();
    var root = document.createElement("div"); root.id = "flyer-print-root";
    var page = document.createElement("div"); page.className = "flyer-sheet " + (v.size === "a5" ? "two" : "one");
    var copies = v.size === "a5" ? 2 : 1;
    for (var i = 0; i < copies; i++) { var f = build(v); f.style.fontSize = ""; page.appendChild(f); }
    root.appendChild(page); document.body.appendChild(root);
    var st = $("flyer-page-style") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "flyer-page-style" }));
    st.textContent = "@media print { @page { size: " + (v.size === "a5" ? "A4 landscape" : "A4") + "; margin: 0; } }";
    document.body.classList.add("flyer-printing");
    function done() { document.body.classList.remove("flyer-printing"); window.removeEventListener("afterprint", done); }
    window.addEventListener("afterprint", done);
    setTimeout(function () { window.print(); }, 300);
  });

  // ---- picture ----
  $("fl-png").addEventListener("click", function () {
    var status = $("fl-status");
    if (!window.html2canvas) { status.textContent = "The picture-export library did not load. Check your internet connection."; return; }
    status.textContent = "Making the picture...";
    var v = vals(), stage = document.createElement("div"); stage.style.cssText = "position:fixed;left:-9999px;top:0;";
    var f = build(v, 14); stage.appendChild(f); document.body.appendChild(stage);
    var imgs = Array.from(stage.querySelectorAll("img")).map(function (img) { return img.complete ? Promise.resolve() : new Promise(function (r) { img.onload = img.onerror = r; }); });
    Promise.all(imgs).then(function () { return html2canvas(f, { scale: 2.5, backgroundColor: null, useCORS: true }); }).then(function (cv) {
      var a = document.createElement("a"); a.download = "iskcon-juja-flier.png"; a.href = cv.toDataURL("image/png"); a.click(); status.textContent = "Downloaded.";
    }).catch(function (e) { status.textContent = "Could not make the picture: " + e.message; }).then(function () { stage.remove(); });
  });

  // ---- data: special events (past ones too, marked) and the weekly programs ----
  function hm(t) { return String(t || "").slice(0, 5); }
  var today = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  Promise.all([
    fetch("images/juja-logo.svg").then(function (r) { return r.text(); }).catch(function () { return ""; }),
    Promise.resolve(client.from("events").select("*").order("start_date", { ascending: false }).limit(60)).then(function (res) { return (window.EVD ? EVD.resolve((res && res.data) || []) : Promise.resolve((res && res.data) || [])).then(function (l) { return { data: l }; }); }),
    client.from("programs").select("*").order("weekday", { ascending: true })
  ]).then(function (r) {
    logoSvg = (r[0] || "").replace(/<svg /, '<svg height="100%" ');
    var ev = ((r[1] && r[1].data) || []).map(function (e) {
      var end = e.end_date || e.start_date, t = e.start_time ? " at " + hm(e.start_time) : "";
      return { label: e.title + " (" + e.start_date + (end < today ? ", ended" : "") + ")", sort: end < today ? 1 : 0, key: e.start_date, title: e.title, when: rangeText(e.start_date, e.end_date) + t, description: e.description, place: "", hash: "#event-" + e.id };
    });
    ev.sort(function (a, b) { return a.sort - b.sort || (a.sort ? (a.key < b.key ? 1 : -1) : (a.key < b.key ? -1 : 1)); });
    var pr = ((r[2] && r[2].data) || []).map(function (p) {
      return { label: "Every " + WD[p.weekday] + ": " + p.title, title: p.title, when: "Every " + WD[p.weekday] + ", " + hm(p.start_time) + " to " + hm(p.end_time), description: p.description, place: p.place, hash: "#program-" + p.weekday };
    });
    events = pr.concat(ev);
    $("fl-event").innerHTML = '<option value="">' + (events.length ? "Fill from an event or weekly program (optional)" : "No events found yet. Fill in by hand.") + '</option>' + events.map(function (e, i) { return '<option value="' + i + '">' + esc(e.label) + "</option>"; }).join("");
    render();
  });
})();
