(function () {
  var WD = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var KEY = "nectar-kartik-2026";
  var store = { done: {}, size: 18 };
  try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) store = s; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  function dayDate(i) { return new Date(START[0], START[1], START[2] + i); }
  function fmt(d) { return WD[d.getDay()] + " " + d.getDate() + " " + MO[d.getMonth()]; }
  function isMain(i) { var w = dayDate(i).getDay(); return w === 2 || w === 5; }
  function todayIdx() {
    var n = new Date();
    return Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(START[0], START[1], START[2])) / 86400000);
  }
  var tIdx = todayIdx();
  var sel = Math.min(Math.max(tIdx, 0), DAYS.length - 1);
  var view = "day";

  var app = document.getElementById("app");
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function label(t) { return el("p", "label", t); }
  function listBlock(head, items, ordered) {
    var b = el("div"); b.appendChild(label(head));
    var u = el(ordered ? "ol" : "ul", "items"); items.forEach(function (x) { u.appendChild(el("li", "", x)); }); b.appendChild(u); return b;
  }
  function hookBlock(text) { var b = el("div"); b.appendChild(label("Hook")); var h = el("div", "hook"); h.appendChild(el("p", "", text)); b.appendChild(h); return b; }

  /* ---------- reading files ---------- */
  var cache = {};
  function loadText(name) {
    if (cache[name] !== undefined) return Promise.resolve(cache[name]);
    return fetch("content/" + name + ".txt").then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (t) { cache[name] = t; return t; }, function () { cache[name] = null; return null; });
  }
  function fold(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-").toLowerCase().replace(/\s+/g, " ");
  }
  var END_JUNK = /^(Text (One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven)|Donate.*|His Divine Grace.*|Content used with permission.*|Add Bookmark|Share|Close|Nectar of Instruction \d+|NOI \d+)$/;
  function cleanLines(t) {
    var lines = t.replace(/^﻿/, "").replace(/\r/g, "").split("\n").map(function (l) { return l.trim(); });
    lines = lines.filter(function (l) { return !/^\[PASTE/i.test(l); });
    var ti = lines.indexOf("Translation");
    if (ti >= 0) { lines = lines.slice(ti); }
    else {
      for (var i = 0; i < Math.min(lines.length, 25); i++) {
        if (/^Search(…|\.\.\.)$/.test(lines[i])) { lines = lines.slice(i + 1); if (lines.length && /^Library/.test(lines[0])) lines = lines.slice(1); break; }
      }
    }
    for (var k = 0; k < lines.length; k++) { if (END_JUNK.test(lines[k])) { lines = lines.slice(0, k); break; } }
    return lines;
  }
  function toBlocks(lines) {
    var blocks = [], run = [];
    function isShort(l) { return l.length <= 90 && !/[.:?!"”\]\)]$/.test(l); }
    function flush() {
      if (run.length > 1) blocks.push({ t: "verse", text: run.join("\n") });
      else if (run.length === 1) blocks.push({ t: "p", text: run[0] });
      run = [];
    }
    lines.forEach(function (l) {
      if (!l) { flush(); return; }
      if (l === "Translation" || l === "Purport") { flush(); blocks.push({ t: "h", text: l }); return; }
      if (isShort(l)) { run.push(l); return; }
      flush(); blocks.push({ t: "p", text: l });
    });
    flush();
    blocks.forEach(function (b) { b.fold = fold(b.text); });
    return blocks;
  }
  function sliceBlocks(blocks, a, b) {
    var s = -1, e = -1, i;
    for (i = 0; i < blocks.length; i++) { if (blocks[i].t !== "h" && blocks[i].fold.indexOf(a) >= 0) { s = i; break; } }
    if (s < 0) return null;
    for (i = s; i < blocks.length; i++) { if (blocks[i].fold.indexOf(b) >= 0) { e = i; break; } }
    if (e < 0) return null;
    return blocks.slice(s, e + 1);
  }
  function addBlock(holder, b) {
    if (b.t === "h") holder.appendChild(el("h3", "", b.text));
    else holder.appendChild(el("p", b.t === "verse" ? "verse" : "", b.text));
  }
  function isEmptyFile(t) {
    var rest = t.split(/\r?\n/).filter(function (l) { return !/^\s*\[PASTE/i.test(l); }).join("").trim();
    return rest.length < 40;
  }

  function fillDayReading(holder, read) {
    loadText(read.f).then(function (t) {
      if (t === null) { holder.appendChild(el("p", "missing", "This could not be loaded (content/" + read.f + ".txt). Check that the file is in the content folder and named exactly like that.")); return; }
      if (isEmptyFile(t)) { holder.appendChild(el("p", "missing", "The reading has not been added yet.")); return; }
      var blocks = toBlocks(cleanLines(t));
      var ti = -1, pi = -1;
      blocks.forEach(function (b, i) { if (b.t === "h" && b.text === "Translation") ti = i; if (b.t === "h" && b.text === "Purport" && pi < 0) pi = i; });
      if (ti >= 0) {
        holder.appendChild(el("h3", "", "Text " + read.n + ": translation"));
        blocks.slice(ti + 1, pi >= 0 ? pi : blocks.length).forEach(function (b) { addBlock(holder, b); });
      }
      var shown = 0;
      read.parts.forEach(function (p, k) {
        var part = sliceBlocks(blocks, p[0], p[1]);
        if (!part) return;
        if (shown === 0) holder.appendChild(el("h3", "", "From the explanation"));
        else holder.appendChild(el("p", "gap", "· · ·"));
        part.forEach(function (b) { addBlock(holder, b); });
        shown++;
      });
      if (shown === 0) holder.appendChild(el("p", "missing", "Today's part could not be found in content/" + read.f + ".txt. Paste the whole page for this text into that file."));
    });
  }

  function readingBlock(read) {
    var box = el("div"); box.appendChild(label("Read"));
    var sz = el("div", "sizes");
    var minus = el("button", "", "A−"), plus = el("button", "", "A+");
    minus.setAttribute("aria-label", "Smaller text"); plus.setAttribute("aria-label", "Larger text");
    sz.appendChild(minus); sz.appendChild(plus);
    var body = el("div", "reading"); body.style.setProperty("--read", store.size + "px");
    function bump(d) { store.size = Math.min(28, Math.max(14, store.size + d)); body.style.setProperty("--read", store.size + "px"); save(); }
    minus.addEventListener("click", function () { bump(-2); });
    plus.addEventListener("click", function () { bump(2); });
    box.appendChild(sz); box.appendChild(body);
    fillDayReading(body, read);
    return box;
  }

  /* ---------- Damodarastakam ---------- */
  function renderSong(holder, t) {
    var lines = t.replace(/^﻿/, "").replace(/\r/g, "").split("\n").filter(function (l) { return !/^\s*\[PASTE/i.test(l); });
    var verses = [], cur = null, mode = "o";
    lines.forEach(function (raw) {
      var l = raw.trim(), m = /^VERSE\s+(\d+)/i.exec(l);
      if (m) { cur = { n: m[1], o: [], t: [] }; verses.push(cur); mode = "o"; return; }
      if (!cur || !l) return;
      var tr = /^TRANSLATION\b:?\s*(.*)$/i.exec(l);
      if (tr) { mode = "t"; if (tr[1]) cur.t.push(tr[1]); return; }
      (mode === "o" ? cur.o : cur.t).push(l);
    });
    if (!verses.length) {
      toBlocks(lines.map(function (l) { return l.trim(); })).forEach(function (b) { addBlock(holder, b); });
      return;
    }
    verses.forEach(function (v) {
      var card = el("div", "vcard");
      card.appendChild(el("h3", "", "Verse " + v.n));
      card.appendChild(el("p", "verse", v.o.join("\n")));
      if (v.t.length) { card.appendChild(el("p", "trl-label", "Meaning")); card.appendChild(el("p", "", v.t.join(" "))); }
      holder.appendChild(card);
    });
  }
  function damBlock(full) {
    var d = el("details", "dam");
    d.appendChild(el("summary", "", full ? DAMODARA.title : "Sing today: Damodarastakam"));
    var inner = el("div", "dam-body");
    inner.appendChild(label("The song, with its meaning"));
    var orig = el("div", "reading"); orig.style.setProperty("--read", store.size + "px");
    var holder = el("div"); holder.style.display = "grid"; holder.style.gap = "14px";
    orig.appendChild(holder); inner.appendChild(orig);
    loadText("damodarastakam").then(function (t) {
      if (t === null) { holder.appendChild(el("p", "missing", "This could not be loaded (content/damodarastakam.txt).")); return; }
      if (isEmptyFile(t)) { holder.appendChild(el("p", "missing", "The song has not been added yet.")); return; }
      renderSong(holder, t);
    });
    if (full) {
      inner.appendChild(listBlock("What each verse means, in plain words", DAMODARA.meanings, true));
      inner.appendChild(listBlock("Why we sing it in Kartik", DAMODARA.why));
    }
    d.appendChild(inner);
    var wrap = el("div"); wrap.appendChild(el("p", "tapnote", "Tap the box below to open the song."));
    wrap.appendChild(d);
    return wrap;
  }

  /* ---------- views ---------- */
  function renderDay() {
    app.innerHTML = "";
    var i = sel, d = DAYS[i], card = el("article", "card");
    var meta = el("div", "meta");
    meta.appendChild(el("b", "", "Day " + (i + 1) + " of " + DAYS.length + " · " + fmt(dayDate(i))));
    if (i === tIdx) meta.appendChild(el("span", "pill today", "Today"));
    if (isMain(i)) meta.appendChild(el("span", "pill main", "Main discussion, " + MAIN_TIME));
    if (store.done[i]) meta.appendChild(el("span", "pill done", "Done"));
    card.appendChild(meta);
    card.appendChild(el("h2", "", d.title));
    if (tIdx < 0 && i === 0) card.appendChild(el("p", "note", "The plan starts on Monday 26 October."));
    if (i > 0) card.appendChild(el("p", "note", "Yesterday: " + DAYS[i - 1].title));

    card.appendChild(hookBlock(d.hook));
    if (d.read) card.appendChild(readingBlock(d.read));
    card.appendChild(listBlock("Key points", d.points));
    card.appendChild(listBlock("Discuss", d.qs));
    card.appendChild(listBlock("Try this", [d.tryThis]));
    card.appendChild(damBlock(d.kind === "intro" || d.kind === "closing"));
    if (i < DAYS.length - 1) card.appendChild(el("p", "note", "Tomorrow: " + DAYS[i + 1].title));

    var act = el("div", "actions");
    var mk = el("button", "btn primary" + (store.done[i] ? " is-done" : ""), store.done[i] ? "Done. Tap to undo" : "Mark this day as done");
    mk.addEventListener("click", function () { if (store.done[i]) delete store.done[i]; else store.done[i] = true; save(); renderDay(); });
    act.appendChild(mk); card.appendChild(act);
    app.appendChild(card);

    var nav = el("div", "nav");
    var pr = el("button", "btn", "← Previous"); pr.disabled = i === 0;
    pr.addEventListener("click", function () { sel--; renderDay(); window.scrollTo(0, 0); });
    var nx = el("button", "btn", "Next →"); nx.disabled = i === DAYS.length - 1;
    nx.addEventListener("click", function () { sel++; renderDay(); window.scrollTo(0, 0); });
    nav.appendChild(pr); nav.appendChild(nx); app.appendChild(nav);
  }

  function renderAll() {
    app.innerHTML = "";
    var list = el("div", "list");
    DAYS.forEach(function (d, i) {
      var r = el("button", "row" + (i === tIdx ? " is-today" : ""));
      r.appendChild(el("span", "dt", fmt(dayDate(i))));
      var t = el("span", "rt", d.title);
      t.appendChild(el("small", "", (d.read ? "Text " + d.read.n : d.kind === "intro" ? "Introduction" : "Closing") + (isMain(i) ? " · Main discussion" : "")));
      r.appendChild(t);
      r.appendChild(el("span", "tick" + (store.done[i] ? " on" : ""), "✓"));
      r.addEventListener("click", function () { sel = i; setView("day"); window.scrollTo(0, 0); });
      list.appendChild(r);
    });
    app.appendChild(list);
  }

  function renderReminders() {
    app.innerHTML = "";
    var card = el("article", "card");
    card.appendChild(el("h2", "", "Daily reminders on your phone"));
    card.appendChild(el("p", "", "Get one reminder a day from 26 October to 24 November. Each one shows that day's topic and hook question."));
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
  function fmtTime(sec) { return Math.floor(sec / 60) + " min " + (sec % 60) + " s"; }
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
      c0.appendChild(el("p", "", "The quiz opens on Monday 23 November. Come back then."));
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
  document.getElementById("b-day").addEventListener("click", function () { if (view === "day") { sel = Math.min(Math.max(tIdx, 0), DAYS.length - 1); } setView("day"); });
  ["all", "remind", "quiz"].forEach(function (k) { document.getElementById("b-" + k).addEventListener("click", function () { setView(k); }); });
  setView("day");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
