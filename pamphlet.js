// ADMIN: foldable pamphlets. Tri-fold (A4 landscape, 3 panels a side) or bi-fold (A4 landscape folded to A5, 2 panels a side).
// Page 1 = outside, page 2 = inside. Print double-sided, "flip on short edge", then fold.
(function () {
  "use strict";
  var holder = document.getElementById("pam-holder");
  if (!holder || !window.ISKCON_DATA || !window.ISKCON_DATA.client) return;
  var H = window.ISKCON_HOSTS || {};
  var $ = function (id) { return document.getElementById(id); };
  var MANTRA = "Hare Krishna Hare Krishna Krishna Krishna Hare Hare<br>Hare Rama Hare Rama Rama Rama Hare Hare";
  var primary = (window.ISKCON && window.ISKCON.WHATSAPP_PRIMARY) || "";
  var logoSvg = "", picture = "", artIds = [];
  function esc(t) { return String(window.PLAIN ? PLAIN(t) : (t == null ? "" : t)).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nl(t) { return esc(t).replace(/\n/g, "<br>"); }
  function nice(raw) { var d = String(raw || "").replace(/\D/g, ""); if (d.charAt(0) === "0") d = "254" + d.slice(1); return d.length === 12 ? "+" + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6, 9) + " " + d.slice(9) : String(raw || "").trim(); }
  function vals() {
    var secs = [1, 2, 3].map(function (i) { return { h: $("pam-h" + i).value.trim(), t: $("pam-t" + i).value.trim() }; });
    return { type: $("pam-type").value, tpl: $("pam-tpl").value, title: $("pam-title").value.trim() || "Your title", tagline: $("pam-tagline").value.trim(),
      flapH: $("pam-flap-h").value.trim(), flapT: $("pam-flap-t").value.trim(), secs: secs, where: $("pam-where").value.trim(), link: $("pam-link").value.trim() || H.publicOrigin || location.origin,
      phone: $("pam-phone").value.trim(), name: $("pam-name").value.trim(), phone2: nice($("pam-phone2").value), name2: $("pam-name2").value.trim(), mantra: $("pam-mantra").checked, ink: $("pam-ink").checked, art: artIds };
  }
  function cover(v) {
    return '<div class="pp-top"><div class="pp-logo">' + logoSvg + '</div>' +
      '<p class="pp-prabtitle">ISKCON Founder-Acharya<br><b>His Divine Grace<br>A.C. Bhaktivedanta Swami Prabhupada</b></p>' +
      '<img class="pp-prab" src="images/prabhupada-sitting.webp" alt="His Divine Grace A.C. Bhaktivedanta Swami Prabhupada"></div>' +
      '<h1 class="pp-covertitle">' + nl(v.title) + '</h1>' + (v.tagline ? '<p class="pp-tagline">' + nl(v.tagline) + '</p>' : '') + (v.art.length ? ART.strip(v.art, (!v.ink && /^f[12]$/.test(v.tpl)) ? "y" : "m", "pp-art") : '') +
      (v.mantra ? '<p class="pp-mantra">' + MANTRA + '</p>' : '');
  }
  function textPanel(h, t, withPic) {
    return (h ? '<h2 class="pp-h">' + nl(h) + '</h2>' : '') + (withPic && picture ? '<div class="pp-pic"><img src="' + esc(picture) + '" alt=""></div>' : '') + (t ? '<p class="pp-t">' + nl(t) + '</p>' : '');
  }
  function back(v) {
    var ph = [];
    if (v.phone) ph.push(esc(v.phone) + (v.name ? " (" + esc(v.name) + ")" : ""));
    if (v.phone2) ph.push(esc(v.phone2) + (v.name2 ? " (" + esc(v.name2) + ")" : ""));
    return '<p class="pp-prabline">ISKCON Founder-Acharya <b>His Divine Grace A.C. Bhaktivedanta Swami Prabhupada</b></p>' +
      '<div class="pp-logo pp-logo-b">' + logoSvg + '</div>' +
      '<div class="pp-qr"></div><p class="pp-scan">Scan to see more</p>' +
      '<div class="pp-contact">' + (v.where ? '<p>' + nl(v.where) + '</p>' : '') + ph.map(function (x) { return '<p><b>' + x + '</b></p>'; }).join("") + '<p>' + esc((H.publicOrigin || location.origin).replace(/^https?:\/\//, "")) + '</p></div>' +
      (v.mantra ? '<p class="pp-mantra">' + MANTRA + '</p>' : '');
  }
  function panel(cls, html) { var d = document.createElement("div"); d.className = "pp-panel " + cls; d.innerHTML = html; return d; }
  function sheet(v, label, panels, px) {
    var s = document.createElement("div");
    s.className = "pp-sheet pp-" + v.type + " pp-" + v.tpl + (v.ink ? " ink" : "");
    if (px) s.style.fontSize = px + "px";
    panels.forEach(function (p) { s.appendChild(p); });
    var q = s.querySelector(".pp-qr");
    if (q && window.QRCode) new QRCode(q, { text: v.link, width: 128, height: 128, colorDark: "#2a1018", colorLight: "#ffffff" });
    s.setAttribute("data-label", label);
    return s;
  }
  function pages(v, px) {
    var tri = v.type === "tri", S = v.secs;
    var outside = tri ? [panel("pp-flap", textPanel(v.flapH, v.flapT, false)), panel("pp-back", back(v)), panel("pp-cover", cover(v))]
                      : [panel("pp-back", back(v)), panel("pp-cover", cover(v))];
    var inside = tri ? [panel("pp-in", textPanel(S[0].h, S[0].t, false)), panel("pp-in", textPanel(S[1].h, S[1].t, true)), panel("pp-in", textPanel(S[2].h, S[2].t, false))]
                     : [panel("pp-in", textPanel(S[0].h, S[0].t, false)), panel("pp-in", textPanel(S[1].h, S[1].t, true))];
    return [sheet(v, "Page 1: outside (the cover is on the right)", outside, px), sheet(v, "Page 2: inside", inside, px)];
  }
  function reArt() { artIds = ART.ids($("pam-art").value, parseInt($("pam-art-n").value, 10) || 2); render(); }
  $("pam-art").innerHTML = ART.options('<option value="none">No pictures</option><option value="random">Random (a mix)</option>');
  $("pam-art").addEventListener("change", reArt); $("pam-art-n").addEventListener("change", reArt); $("pam-art-shuffle").addEventListener("click", reArt);
  function render() {
    var v = vals();
    var tri = v.type === "tri";
    ["flap-h", "flap-t", "h3", "t3"].forEach(function (k) { var el = $("pam-" + k); if (el) el.closest("label").hidden = !tri; });
    holder.innerHTML = "";
    pages(v, 6.2).forEach(function (s) { var w = document.createElement("div"); w.innerHTML = '<p style="font-size:13px;font-weight:700;margin:0 0 6px;">' + esc(s.getAttribute("data-label")) + '</p>'; w.appendChild(s); w.style.marginBottom = "18px"; holder.appendChild(w); });
  }
  [["pam-type", ""], ["pam-tpl", ""]].forEach(function () {});
  $("pam-tpl").innerHTML = '<option value="f1">Formal (maroon and gold)</option><option value="f2">Deep blue and gold</option><option value="cz">Casual (handwritten, tilted)</option>';
  var DEF = { title: "Welcome to ISKCON Juja", tagline: "Peace, friendship and the joy of Krishna consciousness", flapH: "You are welcome", flapT: "Come as you are. No experience needed. Everyone is welcome to our programs.",
    h1: "What we do", t1: "Kirtan (joyful singing), a short talk from the Bhagavad-gita, and a free vegetarian feast (prasadam) at our weekly programs.", h2: "Learn and grow", t2: "Short courses on the Bhagavad-gita and Krishna consciousness, friendly discussion, and a community of young people on the same path.", h3: "Come and join us", t3: "See the days and times of our weekly programs on our website, or send us a WhatsApp message and we will gladly guide you." };
  Object.keys(DEF).forEach(function (k) { var id = { flapH: "pam-flap-h", flapT: "pam-flap-t" }[k] || "pam-" + k; if ($(id)) $(id).value = DEF[k]; });
  $("pam-where").value = "Anthusia Apartments, Muraya Access Road, Juja";
  $("pam-link").value = H.publicOrigin || location.origin;
  $("pam-phone").value = nice(primary);
  try { $("pam-name").value = localStorage.getItem("bc_name1") || ""; $("pam-phone2").value = localStorage.getItem("bc_phone2") || "0743184998"; var n2 = localStorage.getItem("bc_name2"); $("pam-name2").value = n2 === null ? "Dan" : n2; var ik = localStorage.getItem("bc_ink"); $("pam-ink").checked = ik === null ? true : ik === "1"; } catch (e) { $("pam-phone2").value = "0743184998"; $("pam-name2").value = "Dan"; }
  Array.prototype.forEach.call(document.querySelectorAll("#pam-form input, #pam-form textarea, #pam-form select"), function (el) { if (el.type !== "file") el.addEventListener("input", render); });
  $("pam-pic").addEventListener("change", function () { var f = $("pam-pic").files[0]; if (!f) { picture = ""; render(); return; } var rd = new FileReader(); rd.onload = function () { picture = rd.result; render(); }; rd.readAsDataURL(f); });

  $("pam-print").addEventListener("click", function () {
    var v = vals(), old = $("pam-print-root"); if (old) old.remove();
    var root = document.createElement("div"); root.id = "pam-print-root";
    pages(v).forEach(function (s) { var pg = document.createElement("div"); pg.className = "pp-page"; pg.appendChild(s); root.appendChild(pg); });
    document.body.appendChild(root);
    var st = $("pam-page-style") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "pam-page-style" }));
    st.textContent = "@media print { @page { size: A4 landscape; margin: 0; } }";
    document.body.classList.add("pam-printing");
    function done() { document.body.classList.remove("pam-printing"); window.removeEventListener("afterprint", done); }
    window.addEventListener("afterprint", done);
    setTimeout(function () { window.print(); }, 300);
  });
  $("pam-png").addEventListener("click", function () {
    var status = $("pam-status");
    if (!window.html2canvas) { status.textContent = "The picture-export library did not load. Check your internet connection."; return; }
    status.textContent = "Making pictures...";
    var v = vals(), stage = document.createElement("div"); stage.style.cssText = "position:fixed;left:-9999px;top:0;";
    var ss = pages(v, 10); ss.forEach(function (s) { stage.appendChild(s); }); document.body.appendChild(stage);
    var imgs = Array.from(stage.querySelectorAll("img")).map(function (img) { return img.complete ? Promise.resolve() : new Promise(function (r) { img.onload = img.onerror = r; }); });
    Promise.all(imgs).then(function () { return Promise.all(ss.map(function (s) { return html2canvas(s, { scale: 2, backgroundColor: null, useCORS: true }); })); }).then(function (cv) {
      ["outside", "inside"].forEach(function (n, i) { var a = document.createElement("a"); a.download = "iskcon-juja-pamphlet-" + n + ".png"; a.href = cv[i].toDataURL("image/png"); a.click(); });
      status.textContent = "Downloaded both pages.";
    }).catch(function (e) { status.textContent = "Could not make the pictures: " + e.message; }).then(function () { stage.remove(); });
  });
  fetch("images/juja-logo.svg").then(function (r) { return r.text(); }).catch(function () { return ""; }).then(function (t) { logoSvg = (t || "").replace(/<svg /, '<svg height="100%" '); render(); });
})();
