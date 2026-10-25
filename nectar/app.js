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
  function fillText(holder, name, missingMsg) {
    loadText(name).then(function (t) {
      if (t === null) { holder.appendChild(el("p", "missing", "This could not be loaded (content/" + name + ".txt). Check that the file is in the content folder and named exactly like that.")); return; }
      if (!t.trim() || /^\s*\[PASTE/i.test(t)) { holder.appendChild(el("p", "missing", missingMsg)); return; }
      t.replace(/\r/g, "").split(/\n\s*\n/).forEach(function (p) { if (p.trim()) holder.appendChild(el("p", "", p.trim())); });
    });
  }
  function damBlock(full) {
    var d = el("details", "dam");
    d.appendChild(el("summary", "", full ? DAMODARA.title : "Sing today: Damodarastakam"));
    var inner = el("div", "dam-body");
    inner.appendChild(label("The original"));
    var orig = el("div", "reading"); orig.style.setProperty("--read", store.size + "px");
    var holder = el("div"); holder.style.display = "grid"; holder.style.gap = "12px";
    orig.appendChild(holder); inner.appendChild(orig);
    fillText(holder, "damodarastakam", "The original has not been added yet.");
    if (full) {
      inner.appendChild(listBlock("What each verse means", DAMODARA.meanings, true));
      inner.appendChild(listBlock("Why we sing it in Kartik", DAMODARA.why));
    }
    d.appendChild(inner);
    return d;
  }
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
      fillText(holder, name, "The reading has not been added yet.");
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
      card.appendChild(damBlock(true));
      card.appendChild(listBlock("Try this", [INTRO.tryThis]));
    } else if (info.type === "class") {
      var c = info.cls;
      card.appendChild(hooksBlock(c.hooks));
      card.appendChild(readingBlock(c.texts.map(textName), textTitle));
      c.sections.forEach(function (s) { card.appendChild(listBlock(s.head, s.items)); });
      card.appendChild(listBlock("Discuss", c.questions));
      card.appendChild(listBlock("Try this", [c.tryThis]));
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
      card.appendChild(damBlock(true));
      card.appendChild(listBlock("Try this", [CONCLUSION.tryThis]));
    }

    if (info.type !== "intro" && info.type !== "end") card.appendChild(damBlock(false));
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

  function renderReminders() {
    app.innerHTML = "";
    var card = el("article", "card");
    card.appendChild(el("h2", "", "Daily reminders on your phone"));
    card.appendChild(el("p", "", "Get one reminder a day from 26 October to 24 November. Each one shows that day's hook question and what to read."));
    card.appendChild(listBlock("How to get them", [
      "Choose ONE time below. Choosing two gives you double reminders.",
      "Your phone will offer to add the events to your calendar. Choose Add or Save. On an iPhone, tap Add All.",
      "Check that notifications are on for your calendar app.",
      "To stop them, search your calendar for \"Kartik Reading\" and delete the events."
    ], true));
    var act = el("div", "actions");
    [["reminders-morning.ics", "Morning reminders, 7:00 AM"], ["reminders-midday.ics", "Midday reminders, 12:30 PM"], ["reminders-evening.ics", "Evening reminders, 6:00 PM"]].forEach(function (x, k) {
      var l = el("a", "btn" + (k === 0 ? " primary" : ""), x[1]); l.href = x[0]; act.appendChild(l);
    });
    card.appendChild(act);
    card.appendChild(el("p", "note", "If the reminders do not appear, tell the leader at the centre."));
    app.appendChild(card);
  }

  /* ---------- quiz ---------- */
  var QKEY = "nectar-quiz-2026";
  var qstore = {};
  try { qstore = JSON.parse(localStorage.getItem(QKEY) || "{}") || {}; } catch (e) { qstore = {}; }
  function qsave() { try { localStorage.setItem(QKEY, JSON.stringify(qstore)); } catch (e) {} }
  function quizOpen() { return tIdx >= QUIZ_OPEN_DAY || location.hash === "#quiz-preview"; }
  function shuffle(arr) { arr = arr.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function fmtTime(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + " min " + s + " s"; }
  function fmtWhen(ms) { var d = new Date(ms); return fmt(d) + ", " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }

  function resultCard(r, official) {
    var card = el("article", "card");
    card.appendChild(el("h2", "", official ? "Your official result" : "Practice result"));
    card.appendChild(el("p", "bignum", r.score + " of " + r.total));
    card.appendChild(el("p", "", r.name + " · " + fmtWhen(r.when) + " · " + fmtTime(r.secs)));
    card.appendChild(el("p", "note", official ? "Show this screen to the leader at the closing on Tuesday 24 November." : "This was practice and does not count. Your official result is saved."));
    if (r.wrong && r.wrong.length) {
      var b = el("div"); b.appendChild(label("Worth another look"));
      var u = el("ul", "items");
      r.wrong.forEach(function (w) { u.appendChild(el("li", "", w.q + " Answer: " + w.a + " (" + w.from + ")")); });
      b.appendChild(u); card.appendChild(b);
    }
    return card;
  }

  function renderQuiz() {
    app.innerHTML = "";
    if (!quizOpen()) {
      var c0 = el("article", "card");
      c0.appendChild(el("h2", "", "Final quiz"));
      c0.appendChild(el("p", "", "The quiz opens on Monday 23 November, the review day. Come back then."));
      app.appendChild(c0); return;
    }
    if (qstore.official) {
      app.appendChild(resultCard(qstore.official, true));
      var again = el("button", "btn", "Practice again (does not count)");
      again.style.marginTop = "12px";
      again.addEventListener("click", function () { startQuiz(qstore.official.name, false); });
      app.appendChild(again); return;
    }
    var card = el("article", "card");
    card.appendChild(el("h2", "", "Final quiz"));
    card.appendChild(el("p", "", QUIZ.length + " questions on what we read. You get one official attempt, so take your time. Questions and answers appear in a different order each time."));
    var lab = el("label", "label", "Your name"); lab.setAttribute("for", "q-name"); card.appendChild(lab);
    var inp = document.createElement("input"); inp.id = "q-name"; inp.type = "text"; inp.className = "input"; inp.maxLength = 40; inp.value = qstore.name || ""; inp.autocomplete = "name";
    card.appendChild(inp);
    var err = el("p", "note", ""); card.appendChild(err);
    var go = el("button", "btn primary", "Start the quiz");
    go.addEventListener("click", function () {
      var n = inp.value.trim();
      if (!n) { err.textContent = "Please type your name first."; return; }
      qstore.name = n; qsave(); startQuiz(n, true);
    });
    card.appendChild(go); app.appendChild(card);
  }

  function startQuiz(name, official) {
    var qs = shuffle(QUIZ).map(function (q) { return { q: q, opts: shuffle([q.a].concat(q.w)) }; });
    var pos = 0, score = 0, wrong = [], t0 = Date.now();
    function show() {
      app.innerHTML = "";
      var item = qs[pos], card = el("article", "card");
      card.appendChild(el("p", "note", (official ? "" : "Practice · ") + "Question " + (pos + 1) + " of " + qs.length));
      card.appendChild(el("h2", "", item.q.q));
      var chosen = null, btns = [];
      var list = el("div", "actions");
      item.opts.forEach(function (o) {
        var b = el("button", "btn opt", o);
        b.addEventListener("click", function () { chosen = o; btns.forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); nx.disabled = false; });
        btns.push(b); list.appendChild(b);
      });
      card.appendChild(list);
      var nx = el("button", "btn primary", pos === qs.length - 1 ? "Finish" : "Next question"); nx.disabled = true;
      nx.addEventListener("click", function () {
        if (chosen === item.q.a) score++; else wrong.push({ q: item.q.q, a: item.q.a, from: item.q.from });
        pos++;
        if (pos < qs.length) { show(); window.scrollTo(0, 0); return; }
        var r = { name: name, score: score, total: qs.length, secs: Math.round((Date.now() - t0) / 1000), when: Date.now(), wrong: wrong };
        if (official) { qstore.official = r; qsave(); }
        app.innerHTML = ""; app.appendChild(resultCard(r, official));
        var back = el("button", "btn", "Back to the quiz page"); back.style.marginTop = "12px";
        back.addEventListener("click", function () { renderQuiz(); }); app.appendChild(back);
        window.scrollTo(0, 0);
      });
      card.appendChild(nx); app.appendChild(card);
    }
    show(); window.scrollTo(0, 0);
  }

  var VIEWS = ["day", "all", "remind", "quiz"];
  function setView(v) {
    view = v;
    VIEWS.forEach(function (k) { document.getElementById("b-" + k).setAttribute("aria-pressed", k === v); });
    if (v === "day") renderDay(); else if (v === "all") renderAll(); else if (v === "remind") renderReminders(); else renderQuiz();
  }
  document.getElementById("b-day").addEventListener("click", function () { if (view === "day") { sel = Math.min(Math.max(tIdx, 0), 29); } setView("day"); });
  ["all", "remind", "quiz"].forEach(function (k) { document.getElementById("b-" + k).addEventListener("click", function () { setView(k); }); });
  setView("day");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
