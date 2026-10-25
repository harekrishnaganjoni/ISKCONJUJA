(function () {
  var WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var KEY = "nectar-kartik-2026";
  var store = { done: {}, size: 18 };
  try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) store = s; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  var CLASS_BY_IDX = {};
  Object.keys(CLASSES).forEach(function (k) { CLASSES[k].id = k; CLASS_BY_IDX[CLASSES[k].idx] = CLASSES[k]; });
  var CLASS_LIST = Object.keys(CLASSES).map(function (k) { return CLASSES[k]; }).sort(function (a, b) { return a.idx - b.idx; });

  function textsLabel(c) { return c.texts.length === 1 ? "Text " + c.texts[0] : "Texts " + c.texts[0] + " to " + c.texts[c.texts.length - 1]; }
  function nextClass(i) { for (var k = 0; k < CLASS_LIST.length; k++) if (CLASS_LIST[k].idx >= i) return CLASS_LIST[k]; return null; }
  function lastClass(i) { var r = null; CLASS_LIST.forEach(function (c) { if (c.idx <= i) r = c; }); return r; }

  // what is on each day
  function dayInfo(i) {
    if (i === 0) return { type: "intro", label: "Welcome and the Preface", sub: "Start here" };
    if (i === 29) return { type: "end", label: "Closing", sub: "Kartika Purnima" };
    if (i === 28) return { type: "review", label: "Review", sub: "Look back at all eight classes" };
    if (CLASS_BY_IDX[i]) { var c = CLASS_BY_IDX[i]; return { type: "class", cls: c, label: c.title, sub: "Class · " + textsLabel(c) }; }
    var nx = nextClass(i + 1);
    if (nx && nx.idx === i + 1) return { type: "ahead", cls: nx, label: "Read ahead: " + textsLabel(nx), sub: "Read for tomorrow's class" };
    var lc = lastClass(i);
    return { type: "recap", cls: lc, label: "Recap: " + lc.title, sub: "Catch up or chat at the centre" };
  }

  function dayDate(i) { return new Date(START[0], START[1], START[2] + i); }
  function fmt(d) { return WD[d.getDay()] + " " + d.getDate() + " " + MO[d.getMonth()]; }
  function todayIdx() {
    var n = new Date();
    return Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(START[0], START[1], START[2])) / 86400000);
  }

  var tIdx = todayIdx();
  var sel = Math.min(Math.max(tIdx, 0), 29);
  var view = "day";

  var app = document.getElementById("app");
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.textContent = html; return e; }
  function label(t) { return el("p", "label", t); }

  var cache = {};
  function loadText(name) {
    if (cache[name] !== undefined) return Promise.resolve(cache[name]);
    return fetch("content/" + name + ".txt").then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (t) { cache[name] = t; return t; }, function () { cache[name] = null; return null; });
  }

  function readingBlock(names, titleFor) {
    var box = el("div");
    box.appendChild(label("Read"));
    var sz = el("div", "sizes");
    var minus = el("button", "", "A−"), plus = el("button", "", "A+");
    minus.setAttribute("aria-label", "Smaller text"); plus.setAttribute("aria-label", "Larger text");
    sz.appendChild(minus); sz.appendChild(plus);
    var body = el("div", "reading");
    body.style.setProperty("--read", store.size + "px");
    function bump(d) { store.size = Math.min(28, Math.max(14, store.size + d)); body.style.setProperty("--read", store.size + "px"); save(); }
    minus.addEventListener("click", function () { bump(-2); });
    plus.addEventListener("click", function () { bump(2); });
    box.appendChild(sz); box.appendChild(body);
    names.forEach(function (name, k) {
      var h = el("h3", "", titleFor(name, k));
      body.appendChild(h);
      var holder = el("div"); holder.style.display = "grid"; holder.style.gap = "12px";
      body.appendChild(holder);
      loadText(name).then(function (t) {
        if (!t || /^\s*\[PASTE/i.test(t) || !t.trim()) { holder.appendChild(el("p", "missing", "The reading has not been added yet.")); return; }
        t.replace(/\r/g, "").split(/\n\s*\n/).forEach(function (p) { if (p.trim()) holder.appendChild(el("p", "", p.trim())); });
      });
    });
    return box;
  }
  function textName(n) { return "text-" + n; }
  function textTitle(name) { return name === "preface" ? "Preface" : "Text " + name.replace("text-", ""); }

  function hooksBlock(hooks) {
    var b = el("div"); b.appendChild(label(hooks.length > 1 ? "Hooks" : "Hook"));
    var h = el("div", "hook"); hooks.forEach(function (x) { h.appendChild(el("p", "", x)); }); b.appendChild(h); return b;
  }
  function listBlock(head, items, ordered) {
    var b = el("div"); b.appendChild(label(head));
    var u = el(ordered ? "ol" : "ul", "items"); items.forEach(function (x) { u.appendChild(el("li", "", x)); }); b.appendChild(u); return b;
  }

  function renderDay() {
    app.innerHTML = "";
    var i = sel, info = dayInfo(i), card = el("article", "card");
    var meta = el("div", "meta");
    meta.appendChild(el("b", "", "Day " + (i + 1) + " of 30 · " + fmt(dayDate(i))));
    if (i === tIdx) meta.appendChild(el("span", "pill today", "Today"));
    if (store.done[i]) meta.appendChild(el("span", "pill done", "Done"));
    card.appendChild(meta);
    card.appendChild(el("h2", "", info.label));
    if (tIdx < 0 && i === 0) card.appendChild(el("p", "note", "The plan starts on Monday 26 October."));

    if (info.type === "intro") {
      card.appendChild(hooksBlock(INTRO.hooks));
      INTRO.sections.forEach(function (s) { card.appendChild(listBlock(s.head, s.items)); });
      card.appendChild(readingBlock(["preface"], textTitle));
      card.appendChild(listBlock("Discuss", INTRO.questions));
      card.appendChild(listBlock("Try this", [INTRO.tryThis]));
    } else if (info.type === "class") {
      var c = info.cls;
      card.appendChild(hooksBlock(c.hooks));
      card.appendChild(readingBlock(c.texts.map(textName), textTitle));
      c.sections.forEach(function (s) { card.appendChild(listBlock(s.head, s.items)); });
      card.appendChild(listBlock("Discuss", c.questions));
      card.appendChild(listBlock("Try this", [c.tryThis]));
      card.appendChild(listBlock("How the class runs", FORMAT, true));
    } else if (info.type === "ahead") {
      var c2 = info.cls;
      card.appendChild(el("p", "note", "Read this before tomorrow's class. Skimming is fine."));
      card.appendChild(hooksBlock(c2.hooks));
      card.appendChild(readingBlock(c2.texts.map(textName), textTitle));
    } else if (info.type === "recap") {
      var c3 = info.cls;
      card.appendChild(el("p", "note", "A lighter day. Come to the centre to chat, or catch up here."));
      card.appendChild(hooksBlock(c3.hooks));
      c3.sections.forEach(function (s) { card.appendChild(listBlock(s.head, s.items)); });
      card.appendChild(listBlock("Think about", c3.questions));
      var go = el("button", "btn", "Open the full class: " + textsLabel(c3));
      go.addEventListener("click", function () { sel = c3.idx; renderDay(); window.scrollTo(0, 0); });
      card.appendChild(go);
    } else if (info.type === "review") {
      card.appendChild(hooksBlock(REVIEW.hooks));
      card.appendChild(listBlock("What we covered", REVIEW.points));
      card.appendChild(listBlock("Think about", REVIEW.questions));
      card.appendChild(listBlock("Try this", [REVIEW.tryThis]));
    } else {
      card.appendChild(hooksBlock(CONCLUSION.hooks));
      CONCLUSION.sections.forEach(function (s) { card.appendChild(listBlock(s.head, s.items)); });
      card.appendChild(listBlock("Discuss", CONCLUSION.questions));
      card.appendChild(listBlock("Try this", [CONCLUSION.tryThis]));
    }

    var act = el("div", "actions");
    var mk = el("button", "btn primary" + (store.done[i] ? " is-done" : ""), store.done[i] ? "Done. Tap to undo" : "Mark this day as done");
    mk.addEventListener("click", function () { if (store.done[i]) delete store.done[i]; else store.done[i] = true; save(); renderDay(); });
    act.appendChild(mk); card.appendChild(act);
    app.appendChild(card);

    var nav = el("div", "nav");
    var pr = el("button", "btn", "← Previous"); pr.disabled = i === 0;
    pr.addEventListener("click", function () { sel--; renderDay(); window.scrollTo(0, 0); });
    var nx = el("button", "btn", "Next →"); nx.disabled = i === 29;
    nx.addEventListener("click", function () { sel++; renderDay(); window.scrollTo(0, 0); });
    nav.appendChild(pr); nav.appendChild(nx); app.appendChild(nav);
  }

  function renderAll() {
    app.innerHTML = "";
    var list = el("div", "list");
    for (var i = 0; i < 30; i++) (function (i) {
      var info = dayInfo(i);
      var r = el("button", "row" + (i === tIdx ? " is-today" : ""));
      r.appendChild(el("span", "dt", fmt(dayDate(i))));
      var t = el("span", "rt", info.label); t.appendChild(el("small", "", info.sub)); r.appendChild(t);
      r.appendChild(el("span", "tick" + (store.done[i] ? " on" : ""), "✓"));
      r.addEventListener("click", function () { sel = i; setView("day"); window.scrollTo(0, 0); });
      list.appendChild(r);
    })(i);
    app.appendChild(list);
  }

  function setView(v) {
    view = v;
    document.getElementById("b-day").setAttribute("aria-pressed", v === "day");
    document.getElementById("b-all").setAttribute("aria-pressed", v === "all");
    if (v === "day") renderDay(); else renderAll();
  }
  document.getElementById("b-day").addEventListener("click", function () { if (view === "day") { sel = Math.min(Math.max(tIdx, 0), 29); } setView("day"); });
  document.getElementById("b-all").addEventListener("click", function () { setView("all"); });
  setView("day");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
