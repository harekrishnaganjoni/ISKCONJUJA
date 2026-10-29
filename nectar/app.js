(function () {
  /* ---------- moving to the new web address (iskconjuja.co.ke) ----------
     Phone storage belongs to one web address, so when the plan moved from the old
     address, everything saved on the phone (sign-up, days done, notes) has to be carried across.
     OLD address: shows a banner with a button that opens the new address with the saved data attached.
     NEW address: picks that data up once, then removes it from the address bar. */
  var NEW_HOME = "https://iskconjuja.co.ke";
  function nectarKeys() {
    var out = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^nectar-/.test(k)) out[k] = localStorage.getItem(k); } } catch (e) {}
    return out;
  }
  try {
    var mv = /[#&]move=([^&]+)/.exec(location.hash);
    if (mv) {
      var carried = JSON.parse(decodeURIComponent(mv[1]));
      Object.keys(carried).forEach(function (k) {
        if (/^nectar-/.test(k) && typeof carried[k] === "string" && localStorage.getItem(k) === null) localStorage.setItem(k, carried[k]);
      });
      history.replaceState(null, "", location.pathname + location.search);
    }
  } catch (e) {}
  if (/\.netlify\.app$/i.test(location.hostname)) {
    document.addEventListener("DOMContentLoaded", function () {
      var bar = document.createElement("div");
      bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "New web address");
      bar.style.cssText = "position:sticky;top:0;z-index:50;background:#fff3cd;color:#3d2b00;border-bottom:2px solid #d4ac0d;padding:12px 14px;text-align:center;font:600 15px/1.4 system-ui,sans-serif;";
      bar.innerHTML = "<div>We have moved to a new web address: <b>iskconjuja.co.ke</b>. Your progress, notes and sign-up come with you.</div>";
      var a = document.createElement("a");
      a.textContent = "Continue at iskconjuja.co.ke";
      a.href = NEW_HOME + "/nectar/";
      a.style.cssText = "display:inline-block;margin-top:8px;padding:10px 18px;background:#800020;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;";
      a.addEventListener("click", function () { a.href = NEW_HOME + "/nectar/#move=" + encodeURIComponent(JSON.stringify(nectarKeys())); });
      bar.appendChild(a);
      document.body.insertBefore(bar, document.body.firstChild);
    });
  }
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

  /* ---------- saved on this phone ---------- */
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var MKEY = "nectar-member", NKEY = "nectar-mynotes-2026", SKEY = "nectar-sync", CKEY = "nectar-content-cache", AKEY = "nectar-answers", QKEY = "nectar-quiz-2026";
  var member = jget(MKEY, null);
  var mynotes = jget(NKEY, {});
  var answers = jget(AKEY, {});
  var syncMeta = jget(SKEY, { dirty: false });
  var qstore = jget(QKEY, {});
  function qsave() { jset(QKEY, qstore); }
  function savePhone() { jset(NKEY, mynotes); jset(AKEY, answers); jset(SKEY, syncMeta); if (member) jset(MKEY, member); }

  /* ---------- the group database (optional: the plan still works without it) ---------- */
  var CFG = { url: String(window.SUPABASE_URL || "").replace(/\/$/, ""), key: String(window.SUPABASE_ANON_KEY || "") };
  var READY = !!(CFG.url && CFG.key);
  var isAdmin = false;
  function api(path, o) {
    o = o || {};
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    var h = { apikey: CFG.key, "Content-Type": "application/json" };
    if (o.jwt) h.Authorization = "Bearer " + o.jwt;
    if (o.prefer) h.Prefer = o.prefer;
    return fetch(CFG.url + path, { method: o.method || "GET", headers: h, body: o.body !== undefined ? JSON.stringify(o.body) : undefined, signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        clearTimeout(timer);
        if (!r.ok) return r.text().then(function (x) { throw new Error(x || String(r.status)); });
        return r.text().then(function (x) { return x ? JSON.parse(x) : null; });
      }, function (e) { clearTimeout(timer); throw e; });
  }
  function rpc(name, args, jwt) { return api("/rest/v1/rpc/" + name, { method: "POST", body: args, jwt: jwt }); }

  function doneList() { return Object.keys(store.done).filter(function (k) { return store.done[k]; }).map(Number); }
  function notesList() { return Object.keys(mynotes).map(function (k) { return { day: Number(k), note: mynotes[k].note || "", question: mynotes[k].question || "" }; }); }
  function push() {
    if (!READY || !member) return Promise.resolve(false);
    return rpc("nectar_sync", { p_token: member.token, p_done: doneList(), p_notes: notesList() })
      .then(function () { syncMeta.dirty = false; savePhone(); return true; }, function () { return false; });
  }
  var pushTimer;
  function schedulePush() {
    syncMeta.dirty = true; savePhone();
    if (!READY || !member) return;
    clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500);
  }
  function submitQuizIfPending() {
    if (!READY || !member || !qstore.official || !qstore.pending) return Promise.resolve();
    var r = qstore.official;
    return rpc("nectar_submit_quiz", { p_token: member.token, p_score: r.score, p_total: r.total, p_secs: r.secs })
      .then(function () { qstore.pending = false; qsave(); }, function () {});
  }
  function pull() {
    if (!READY || !member) return Promise.resolve(false);
    return rpc("nectar_get", { p_token: member.token }).then(function (r) {
      if (!r) return false;
      var sd = {}; (r.done || []).forEach(function (d) { sd[d] = true; });
      if (syncMeta.dirty) { Object.keys(sd).forEach(function (k) { store.done[k] = true; }); } else { store.done = sd; }
      save();
      (r.notes || []).forEach(function (n) {
        answers[n.day] = n.answer || "";
        if (!syncMeta.dirty || !mynotes[n.day]) mynotes[n.day] = { note: n.note || "", question: n.question || "" };
      });
      if (r.quiz && !qstore.official) {
        qstore.official = { name: r.name, score: r.quiz.score, total: r.quiz.total, secs: r.quiz.secs, when: Date.parse(r.quiz.taken_at) || Date.now(), wrong: [] };
        qsave();
      }
      member.name = r.name; savePhone();
      return (syncMeta.dirty ? push() : Promise.resolve()).then(submitQuizIfPending).then(function () { return true; });
    }, function () { return false; });
  }
  function joinGroup(name, phone) {
    return rpc("nectar_join", { p_name: name, p_phone: phone || null }).then(function (t) {
      member = { token: t, name: name }; syncMeta.dirty = true; savePhone();
      return push().then(function () { return true; });
    });
  }
  window.addEventListener("online", function () { if (syncMeta.dirty) push(); submitQuizIfPending(); });

  /* ---------- leader's edits to the notes (shared by everyone) ---------- */
  var BASEC = DAYS.map(function (d) { return { title: d.title, hook: d.hook, points: d.points, qs: d.qs, tryThis: d.tryThis, examples: d.examples, science: d.science }; });
  var BASED = { meanings: DAMODARA.meanings, why: DAMODARA.why };
  var contentRows = jget(CKEY, []);
  function applyContent() {
    DAYS.forEach(function (d, i) { var b = BASEC[i]; d.title = b.title; d.hook = b.hook; d.points = b.points; d.qs = b.qs; d.tryThis = b.tryThis; d.examples = b.examples; d.science = b.science; });
    DAMODARA.meanings = BASED.meanings; DAMODARA.why = BASED.why;
    contentRows.forEach(function (r) {
      var m = /^day-(\d+)$/.exec(r.key), x = r.data || {};
      if (m && DAYS[Number(m[1])]) {
        var d = DAYS[Number(m[1])];
        ["title", "hook", "tryThis"].forEach(function (f) { if (typeof x[f] === "string" && x[f].trim()) d[f] = x[f]; });
        ["points", "qs"].forEach(function (f) { if (Array.isArray(x[f]) && x[f].length) d[f] = x[f]; });
        ["examples", "science"].forEach(function (f) { if (Array.isArray(x[f])) d[f] = x[f]; });
      } else if (r.key === "dam") {
        ["meanings", "why"].forEach(function (f) { if (Array.isArray(x[f]) && x[f].length) DAMODARA[f] = x[f]; });
      }
    });
  }
  applyContent();
  function refreshContent() {
    if (!READY) return Promise.resolve(false);
    return api("/rest/v1/nectar_content?select=key,data").then(function (rows) {
      if (!Array.isArray(rows)) return false;
      var changed = JSON.stringify(rows) !== JSON.stringify(contentRows);
      contentRows = rows; jset(CKEY, rows); applyContent(); return changed;
    }, function () { return false; });
  }

  /* ---------- leader sign-in (uses the login of the main site) ---------- */
  function findSession() {
    try {
      var m = CFG.url.match(/^https?:\/\/([^.]+)\./), ref = m ? m[1] : "";
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k) && (!ref || k.indexOf(ref) >= 0)) {
          var v = JSON.parse(localStorage.getItem(k)), s = v && v.currentSession ? v.currentSession : v;
          if (s && s.access_token) return { key: k, s: s };
        }
      }
    } catch (e) {}
    return null;
  }
  function freshJwt() {
    var f = findSession();
    if (!f) return Promise.resolve(null);
    var s = f.s;
    if ((s.expires_at || 0) * 1000 > Date.now() + 30000) return Promise.resolve(s.access_token);
    if (!s.refresh_token) return Promise.resolve(null);
    return fetch(CFG.url + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { apikey: CFG.key, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: s.refresh_token }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (n) {
        if (!n || !n.access_token) return null;
        var merged = {}; Object.keys(s).forEach(function (k) { merged[k] = s[k]; }); Object.keys(n).forEach(function (k) { merged[k] = n[k]; });
        merged.expires_at = n.expires_at || Math.floor(Date.now() / 1000) + (n.expires_in || 3600);
        try { localStorage.setItem(f.key, JSON.stringify(merged)); } catch (e) {}
        return n.access_token;
      }, function () { return null; });
  }
  function detectAdmin() {
    if (!READY || !findSession()) return Promise.resolve(false);
    return freshJwt().then(function (jwt) {
      if (!jwt) return false;
      return rpc("is_admin", {}, jwt).then(function (v) { return v === true; }, function () { return false; });
    }).then(function (ok) { isAdmin = ok; document.getElementById("b-admin").hidden = !ok; return ok; });
  }

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
    var lines = t.replace(/^\uFEFF/, "").replace(/\r/g, "").split("\n").map(function (l) { return l.trim(); }).filter(function (l) { return !/^\[PASTE/i.test(l); });
    var verses = [], intro = [], cur = null;
    function tidy(x) { return x.replace(/(^|\s)0 (?=Lord|Supreme)/g, "$1O "); }
    if (lines.some(function (l) { return /^VERSE\s+\d+/i.test(l); })) {
      var mode = "o";
      lines.forEach(function (l) {
        var m = /^VERSE\s+(\d+)/i.exec(l);
        if (m) { cur = { n: m[1], o: [], t: [] }; verses.push(cur); mode = "o"; return; }
        if (!cur || !l) return;
        var tr = /^TRANSLATION\b:?\s*(.*)$/i.exec(l);
        if (tr) { mode = "t"; if (tr[1]) cur.t.push(tr[1]); return; }
        (mode === "o" ? cur.o : cur.t).push(l);
      });
    } else {
      var ti = -1; lines.forEach(function (l, i) { if (ti < 0 && /^Translation:?$/i.test(l)) ti = i; });
      var head = ti >= 0 ? lines.slice(0, ti) : lines, tail = ti >= 0 ? lines.slice(ti + 1) : [];
      head.forEach(function (l) {
        var m = /^\((\d+)\)$/.exec(l);
        if (m) { cur = { n: m[1], o: [], t: [] }; verses.push(cur); return; }
        if (!l) return;
        if (cur) cur.o.push(l); else intro.push(l);
      });
      var tp = null;
      tail.forEach(function (l) {
        if (!l) { tp = null; return; }
        var m = /^\((\d+)\)\s*(.*)$/.exec(l);
        if (m) { tp = null; verses.forEach(function (v) { if (v.n === m[1]) tp = v; }); if (tp) tp.t.push(tidy(m[2])); return; }
        if (tp) tp.t.push(tidy(l));
      });
    }
    if (!verses.length) {
      toBlocks(lines).forEach(function (b) { addBlock(holder, b); });
      return;
    }
    if (intro.length) holder.appendChild(el("p", "note pre", intro.join("\n")));
    verses.forEach(function (v) {
      var card = el("div", "vcard");
      card.appendChild(el("h3", "", "Verse " + v.n));
      card.appendChild(el("p", "verse", v.o.join("\n")));
      if (v.t.length) {
        var tx = v.t.join(" ");
        if (tx.indexOf("]") >= 0 && tx.indexOf("[") < 0) tx = "[" + tx;
        card.appendChild(el("p", "trl-label", "Translation")); card.appendChild(el("p", "", tx));
      }
      holder.appendChild(card);
    });
  }
  var editing = false;
  var joinHidden = false;
  try { joinHidden = sessionStorage.getItem("nectar-join-hidden") === "1"; } catch (e) {}

  function area(value, rows) { var t = document.createElement("textarea"); t.className = "input"; t.rows = rows || 4; t.value = value || ""; return t; }
  function textInput(value, max) { var t = document.createElement("input"); t.type = "text"; t.className = "input"; t.maxLength = max || 200; t.value = value || ""; return t; }
  function field(text, ctl, hint) { var w = el("div", "field"); w.appendChild(label(text)); w.appendChild(ctl); if (hint) w.appendChild(el("p", "note", hint)); return w; }
  function splitLines(t) { return t.split("\n").map(function (x) { return x.trim(); }).filter(Boolean); }

  function shareText(text, statusEl) {
    function copied() { if (statusEl) statusEl.textContent = "Copied. You can paste it into WhatsApp."; }
    if (navigator.share) { navigator.share({ text: text }).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(copied, function () {}); return; }
    var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); copied(); } catch (e) {} t.remove();
  }

  /* ---------- Damodarastakam box ---------- */
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
      if (isAdmin) {
        var eb = el("button", "btn", "Edit these notes (leader only)");
        eb.addEventListener("click", function () { renderEditDam(); window.scrollTo(0, 0); });
        inner.appendChild(eb);
      }
    }
    d.appendChild(inner);
    var wrap = el("div"); wrap.appendChild(el("p", "tapnote", "Tap the box below to open the song."));
    wrap.appendChild(d);
    return wrap;
  }

  /* ---------- Today ---------- */
  function renderDay() {
    editing = false;
    app.innerHTML = "";
    var i = sel, d = DAYS[i];
    if (READY && !member && !joinHidden) {
      var ban = el("div", "banner");
      ban.appendChild(el("p", "", "Join the group (free) to keep your progress on any phone and send questions to the leader."));
      var bb = el("div", "banner-actions");
      var jb = el("button", "btn primary", "Join the group"); jb.addEventListener("click", function () { renderJoin(); window.scrollTo(0, 0); });
      var nb = el("button", "btn", "Not now"); nb.addEventListener("click", function () { joinHidden = true; try { sessionStorage.setItem("nectar-join-hidden", "1"); } catch (e) {} renderDay(); });
      bb.appendChild(jb); bb.appendChild(nb); ban.appendChild(bb); app.appendChild(ban);
    } else if (member) {
      app.appendChild(el("p", "note who", "Joined as " + member.name + ". Your progress and notes are saved to the group."));
    }
    var card = el("article", "card");
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
    if (d.examples && d.examples.length) card.appendChild(listBlock("Real-life examples", d.examples));
    if (d.read) card.appendChild(readingBlock(d.read));
    card.appendChild(listBlock("Key points", d.points));
    if (d.science && d.science.length) card.appendChild(listBlock("What research says", d.science));
    card.appendChild(listBlock("Discuss", d.qs));
    card.appendChild(listBlock("Try this", [d.tryThis]));
    card.appendChild(damBlock(d.kind === "intro" || d.kind === "closing"));
    if (i < DAYS.length - 1) card.appendChild(el("p", "note", "Tomorrow: " + DAYS[i + 1].title));

    var act = el("div", "actions");
    var mk = el("button", "btn primary" + (store.done[i] ? " is-done" : ""), store.done[i] ? "Done. Tap to undo" : "Mark this day as done");
    mk.addEventListener("click", function () { if (store.done[i]) delete store.done[i]; else store.done[i] = true; save(); schedulePush(); renderDay(); });
    act.appendChild(mk);
    if (isAdmin) {
      var eb = el("button", "btn", "Edit this day (leader only)");
      eb.addEventListener("click", function () { renderEditDay(i); window.scrollTo(0, 0); });
      act.appendChild(eb);
    }
    card.appendChild(act);
    app.appendChild(card);

    var nav = el("div", "nav");
    var pr = el("button", "btn", "← Previous"); pr.disabled = i === 0;
    pr.addEventListener("click", function () { sel--; renderDay(); window.scrollTo(0, 0); });
    var nx = el("button", "btn", "Next →"); nx.disabled = i === DAYS.length - 1;
    nx.addEventListener("click", function () { sel++; renderDay(); window.scrollTo(0, 0); });
    nav.appendChild(pr); nav.appendChild(nx); app.appendChild(nav);
    updateFab();
  }

  function renderAll() {
    editing = false;
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
    editing = false;
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
    card.appendChild(el("p", "note", "These reminders show the plan as it was when you added them. If the leader changes a day, open the plan to see the newest version."));
    card.appendChild(el("p", "note", "If the reminders do not appear, tell the leader at the centre."));
    app.appendChild(card);
  }

  /* ---------- join the group ---------- */
  function renderJoin() {
    editing = true;
    app.innerHTML = "";
    var card = el("article", "card");
    card.appendChild(el("h2", "", "Join the group"));
    card.appendChild(el("p", "", "It is free. Joining keeps your progress and notes safe, lets you use the plan on more than one phone, and lets you send questions to the leader."));
    var n = textInput(member ? member.name : "", 60); n.autocomplete = "name"; n.id = "j-name";
    var p = textInput("", 20); p.type = "tel"; p.autocomplete = "tel"; p.id = "j-phone";
    card.appendChild(field("Your name", n));
    card.appendChild(field("Your phone number (optional)", p, "Only the leaders of this group can see your name and number. Leave the number empty if you prefer."));
    var err = el("p", "note", ""); card.appendChild(err);
    var go = el("button", "btn primary", "Join");
    go.addEventListener("click", function () {
      var name = n.value.trim();
      if (!name) { err.textContent = "Please type your name."; return; }
      go.disabled = true; err.textContent = "Joining...";
      joinGroup(name, p.value.trim()).then(function () { editing = false; setView("day"); }, function () { go.disabled = false; err.textContent = "Could not join. Check your internet and try again."; });
    });
    var back = el("button", "btn", "Back");
    back.addEventListener("click", function () { editing = false; renderDay(); });
    var act = el("div", "actions"); act.appendChild(go); act.appendChild(back); card.appendChild(act);
    app.appendChild(card);
    updateFab();
  }

  /* ---------- my notes and questions (floating button) ---------- */
  var fab = el("button", "fab", "✎ Notes");
  fab.setAttribute("aria-label", "My notes and questions");
  fab.hidden = true;
  document.body.appendChild(fab);
  function hasNote(i) { var x = mynotes[i]; return !!(x && (x.note || x.question)); }
  function updateFab() { fab.hidden = view !== "day" || editing; fab.classList.toggle("has", hasNote(sel)); }
  fab.addEventListener("click", function () { openSheet(sel); });

  function allNotesText() {
    var out = ["My notes: Nectar of Instruction, Kartik 2026"];
    Object.keys(mynotes).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) {
      var x = mynotes[k]; if (!x || (!x.note && !x.question)) return;
      out.push("", "Day " + (k + 1) + ": " + DAYS[k].title);
      if (x.note) out.push("Note: " + x.note);
      if (x.question) out.push("Question: " + x.question);
    });
    return out.join("\n");
  }
  function openSheet(i) {
    var back = el("div", "sheet-back");
    var sh = el("div", "sheet");
    sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true"); sh.setAttribute("aria-label", "My notes and questions");
    var head = el("div", "sheet-head");
    head.appendChild(el("h2", "", "My notes"));
    var x = el("button", "sheet-x", "×"); x.setAttribute("aria-label", "Close"); head.appendChild(x);
    sh.appendChild(head);
    sh.appendChild(el("p", "note", "Day " + (i + 1) + ": " + DAYS[i].title));
    var cur = mynotes[i] || { note: "", question: "" };
    var nt = area(cur.note, 5), qt = area(cur.question, 4);
    nt.setAttribute("aria-label", "My note"); qt.setAttribute("aria-label", "My question");
    sh.appendChild(field("Things I want to remember", nt));
    var qhint = READY ? (member ? "The leader can see your question and will answer it here." : "Join the group so the leader can see your question.") : "Bring it to the discussion on Tuesday or Friday.";
    sh.appendChild(field("A question I want to ask", qt, qhint));
    if (answers[i]) {
      var ans = el("div", "answer"); ans.appendChild(label("Answer from the leader")); ans.appendChild(el("p", "", answers[i])); sh.appendChild(ans);
    }
    var status = el("p", "note", "Saved on this phone as you type.");
    sh.appendChild(status);
    function onType() {
      mynotes[i] = { note: nt.value, question: qt.value };
      savePhone(); schedulePush(); fab.classList.toggle("has", hasNote(sel));
      status.textContent = "Saved.";
    }
    nt.addEventListener("input", onType); qt.addEventListener("input", onType);
    var act = el("div", "actions");
    if (READY && !member) {
      var jb = el("button", "btn primary", "Join the group so the leader can answer");
      jb.addEventListener("click", function () { close(); renderJoin(); window.scrollTo(0, 0); });
      act.appendChild(jb);
    }
    var sq = el("button", "btn", "Share my question");
    sq.addEventListener("click", function () {
      if (!qt.value.trim()) { status.textContent = "Type a question first."; return; }
      shareText("Question for the group, Day " + (i + 1) + " (" + DAYS[i].title + "): " + qt.value.trim(), status);
    });
    var sa = el("button", "btn", "Share all my notes");
    sa.addEventListener("click", function () { shareText(allNotesText(), status); });
    var done = el("button", "btn primary", "Done");
    done.addEventListener("click", close);
    act.appendChild(sq); act.appendChild(sa); act.appendChild(done);
    sh.appendChild(act);
    back.appendChild(sh); document.body.appendChild(back);
    document.body.classList.add("sheet-open");
    nt.focus();
    function close() { back.remove(); document.body.classList.remove("sheet-open"); document.removeEventListener("keydown", onKey); fab.focus(); updateFab(); }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var f = sh.querySelectorAll("button, textarea"); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    x.addEventListener("click", close);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
  }

  /* ---------- leader: edit the notes ---------- */
  function saveContent(key, data) {
    return freshJwt().then(function (jwt) {
      if (!jwt) throw new Error("expired");
      return api("/rest/v1/nectar_content?on_conflict=key", { method: "POST", jwt: jwt, prefer: "resolution=merge-duplicates,return=minimal", body: { key: key, data: data, updated_at: new Date().toISOString() } });
    }).then(function () {
      var found = false;
      contentRows.forEach(function (r) { if (r.key === key) { r.data = data; found = true; } });
      if (!found) contentRows.push({ key: key, data: data });
      jset(CKEY, contentRows); applyContent();
    });
  }
  function restoreContent(key) {
    return freshJwt().then(function (jwt) {
      if (!jwt) throw new Error("expired");
      return api("/rest/v1/nectar_content?key=eq." + encodeURIComponent(key), { method: "DELETE", jwt: jwt, prefer: "return=minimal" });
    }).then(function () {
      contentRows = contentRows.filter(function (r) { return r.key !== key; });
      jset(CKEY, contentRows); applyContent();
    });
  }
  function renderEditDay(i) {
    editing = true; updateFab();
    app.innerHTML = "";
    var d = DAYS[i], card = el("article", "card");
    card.appendChild(el("h2", "", "Edit Day " + (i + 1)));
    card.appendChild(el("p", "note", "Changes go live for everyone as soon as you press Save. Write one point or question per line."));
    var t = textInput(d.title, 120), h = area(d.hook, 3), p = area(d.points.join("\n"), 10), q = area(d.qs.join("\n"), 5), y = area(d.tryThis, 3), ex = area((d.examples || []).join("\n"), 8), sc = area((d.science || []).join("\n"), 6);
    card.appendChild(field("Title", t)); card.appendChild(field("Hook (opening question)", h)); card.appendChild(field("Real-life examples (one per line)", ex));
    card.appendChild(field("Key points (one per line)", p)); card.appendChild(field("Discuss questions (one per line)", q)); card.appendChild(field("Try this", y)); card.appendChild(field("What research says (one per line, can be left empty)", sc));
    var st = el("p", "note", ""); card.appendChild(st);
    var act = el("div", "actions");
    var sv = el("button", "btn primary", "Save for everyone");
    sv.addEventListener("click", function () {
      var data = { title: t.value.trim(), hook: h.value.trim(), points: splitLines(p.value), qs: splitLines(q.value), tryThis: y.value.trim(), examples: splitLines(ex.value), science: splitLines(sc.value) };
      if (!data.title || !data.hook || !data.points.length || !data.qs.length || !data.tryThis) { st.textContent = "Please fill in every box."; return; }
      sv.disabled = true; st.textContent = "Saving...";
      saveContent("day-" + i, data).then(function () { renderDay(); window.scrollTo(0, 0); }, function () { sv.disabled = false; st.textContent = "Could not save. Your leader login may have expired. Sign in on the main site and try again."; });
    });
    var rs = el("button", "btn", "Go back to the original text");
    rs.addEventListener("click", function () {
      if (!window.confirm("Remove your edits to this day and use the original text?")) return;
      restoreContent("day-" + i).then(function () { renderDay(); window.scrollTo(0, 0); }, function () { st.textContent = "Could not restore. Please try again."; });
    });
    var cn = el("button", "btn", "Cancel"); cn.addEventListener("click", function () { renderDay(); });
    act.appendChild(sv); act.appendChild(rs); act.appendChild(cn); card.appendChild(act);
    app.appendChild(card);
  }
  function renderEditDam() {
    editing = true; updateFab();
    app.innerHTML = "";
    var card = el("article", "card");
    card.appendChild(el("h2", "", "Edit the Damodarastakam notes"));
    card.appendChild(el("p", "note", "Changes go live for everyone as soon as you press Save. Write one item per line."));
    var m = area(DAMODARA.meanings.join("\n"), 12), w = area(DAMODARA.why.join("\n"), 8);
    card.appendChild(field("What each verse means (one verse per line)", m)); card.appendChild(field("Why we sing it in Kartik (one point per line)", w));
    var st = el("p", "note", ""); card.appendChild(st);
    var act = el("div", "actions");
    var sv = el("button", "btn primary", "Save for everyone");
    sv.addEventListener("click", function () {
      var data = { meanings: splitLines(m.value), why: splitLines(w.value) };
      if (!data.meanings.length || !data.why.length) { st.textContent = "Please fill in both boxes."; return; }
      sv.disabled = true; st.textContent = "Saving...";
      saveContent("dam", data).then(function () { renderDay(); window.scrollTo(0, 0); }, function () { sv.disabled = false; st.textContent = "Could not save. Sign in on the main site and try again."; });
    });
    var rs = el("button", "btn", "Go back to the original text");
    rs.addEventListener("click", function () {
      if (!window.confirm("Remove your edits and use the original text?")) return;
      restoreContent("dam").then(function () { renderDay(); window.scrollTo(0, 0); }, function () { st.textContent = "Could not restore. Please try again."; });
    });
    var cn = el("button", "btn", "Cancel"); cn.addEventListener("click", function () { renderDay(); });
    act.appendChild(sv); act.appendChild(rs); act.appendChild(cn); card.appendChild(act);
    app.appendChild(card);
  }

  /* ---------- leader view: people, notes, questions ---------- */
  function csvCell(v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function renderAdmin() {
    editing = false; app.innerHTML = "";
    var card = el("article", "card");
    card.appendChild(el("h2", "", "Leader view"));
    var st = el("p", "note", "Loading..."); card.appendChild(st); app.appendChild(card);
    freshJwt().then(function (jwt) {
      if (!jwt) { st.textContent = "Your leader login has expired. Open the main site, sign in, then come back here."; return null; }
      function q(p) { return api("/rest/v1/" + p, { jwt: jwt }); }
      return Promise.all([
        q("nectar_members?select=id,name,phone,created_at&order=created_at.desc"),
        q("nectar_progress?select=member_id,day"),
        q("nectar_notes?select=member_id,day,note,question,answer,updated_at&order=updated_at.desc"),
        q("nectar_quiz?select=member_id,score,total,secs")
      ]).then(function (r) { st.remove(); drawAdmin(card, jwt, r[0] || [], r[1] || [], r[2] || [], r[3] || []); });
    }).catch(function () { st.textContent = "Could not load. Check your internet, and that the database setup was run."; });
  }
  function drawAdmin(card, jwt, members, prog, notes, quiz) {
    var byId = {}; members.forEach(function (m) { byId[m.id] = m; m.done = 0; m.quiz = null; });
    prog.forEach(function (p) { if (byId[p.member_id]) byId[p.member_id].done++; });
    quiz.forEach(function (z) { if (byId[z.member_id]) byId[z.member_id].quiz = z; });
    var qs = notes.filter(function (n) { return n.question && n.question.trim() && byId[n.member_id]; });
    qs.sort(function (a, b) { return (a.answer ? 1 : 0) - (b.answer ? 1 : 0); });
    var waiting = qs.filter(function (n) { return !n.answer; }).length;
    card.appendChild(el("p", "", members.length + (members.length === 1 ? " person has" : " people have") + " joined. " + waiting + " question" + (waiting === 1 ? "" : "s") + " waiting for an answer."));

    var qb = el("div"); qb.appendChild(label("Questions"));
    if (!qs.length) qb.appendChild(el("p", "note", "No questions yet."));
    qs.forEach(function (n) {
      var m = byId[n.member_id], it = el("div", "qa" + (n.answer ? " answered" : ""));
      it.appendChild(el("p", "qa-who", m.name + " · Day " + (n.day + 1) + ": " + (DAYS[n.day] ? DAYS[n.day].title : "")));
      it.appendChild(el("p", "qa-q", n.question));
      if (n.note && n.note.trim()) it.appendChild(el("p", "note", "Their note: " + n.note));
      var ta = area(n.answer || "", 3); ta.setAttribute("aria-label", "Your answer"); it.appendChild(ta);
      var s = el("p", "note", n.answer ? "Answered." : ""); 
      var sb = el("button", "btn", n.answer ? "Update answer" : "Send answer");
      sb.addEventListener("click", function () {
        var text = ta.value.trim(); if (!text) { s.textContent = "Type an answer first."; return; }
        sb.disabled = true; s.textContent = "Sending...";
        freshJwt().then(function (j) {
          return api("/rest/v1/nectar_notes?member_id=eq." + n.member_id + "&day=eq." + n.day, { method: "PATCH", jwt: j || jwt, prefer: "return=minimal", body: { answer: text, answered_at: new Date().toISOString() } });
        }).then(function () { n.answer = text; s.textContent = "Sent. They will see it next time they open the plan."; sb.disabled = false; sb.textContent = "Update answer"; it.classList.add("answered"); },
          function () { sb.disabled = false; s.textContent = "Could not send. Please try again."; });
      });
      it.appendChild(sb); it.appendChild(s); qb.appendChild(it);
    });
    card.appendChild(qb);

    var plain = notes.filter(function (n) { return n.note && n.note.trim() && !(n.question && n.question.trim()) && byId[n.member_id]; });
    var nb = el("div"); nb.appendChild(label("Notes people wrote"));
    if (!plain.length) nb.appendChild(el("p", "note", "No notes yet."));
    plain.forEach(function (n) {
      var it = el("div", "qa"); it.appendChild(el("p", "qa-who", byId[n.member_id].name + " · Day " + (n.day + 1) + ": " + (DAYS[n.day] ? DAYS[n.day].title : "")));
      it.appendChild(el("p", "", n.note)); nb.appendChild(it);
    });
    card.appendChild(nb);

    var pb = el("div"); pb.appendChild(label("People, best quiz result first"));
    var sorted = members.slice().sort(function (a, b) {
      var sa = a.quiz ? a.quiz.score : -1, sb2 = b.quiz ? b.quiz.score : -1;
      if (sa !== sb2) return sb2 - sa;
      if (a.quiz && b.quiz && a.quiz.secs !== b.quiz.secs) return a.quiz.secs - b.quiz.secs;
      return b.done - a.done;
    });
    if (!sorted.length) pb.appendChild(el("p", "note", "Nobody has joined yet."));
    sorted.forEach(function (m) {
      var row = el("div", "person");
      var info = el("div"); info.appendChild(el("b", "", m.name));
      info.appendChild(el("p", "note", (m.phone ? m.phone + " · " : "") + m.done + " of " + DAYS.length + " days done · " + (m.quiz ? "quiz " + m.quiz.score + "/" + m.quiz.total + " in " + fmtTime(m.quiz.secs) : "quiz not taken")));
      row.appendChild(info);
      var rm = el("button", "btn small", "Remove");
      rm.addEventListener("click", function () {
        if (!window.confirm("Remove " + m.name + " and all their notes and results? This cannot be undone.")) return;
        freshJwt().then(function (j) { return api("/rest/v1/nectar_members?id=eq." + m.id, { method: "DELETE", jwt: j || jwt, prefer: "return=minimal" }); })
          .then(function () { renderAdmin(); }, function () { window.alert("Could not remove. Please try again."); });
      });
      row.appendChild(rm); pb.appendChild(row);
    });
    card.appendChild(pb);

    var dl = el("button", "btn", "Download the list (CSV)");
    dl.addEventListener("click", function () {
      var rows = [["name", "phone", "days_done", "quiz_score", "quiz_total", "quiz_seconds", "joined"]];
      sorted.forEach(function (m) { rows.push([m.name, m.phone || "", m.done, m.quiz ? m.quiz.score : "", m.quiz ? m.quiz.total : "", m.quiz ? m.quiz.secs : "", m.created_at]); });
      var csv = rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "nectar-people.csv";
      document.body.appendChild(a); a.click(); a.remove();
    });
    card.appendChild(dl);
  }

  /* ---------- quiz ---------- */
  function quizOpen() { return tIdx >= QUIZ_OPEN_DAY || location.hash === "#quiz-preview"; }
  function shuffle(arr) { arr = arr.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function fmtTime(sec) { return Math.floor(sec / 60) + " min " + (sec % 60) + " s"; }
  function fmtWhen(ms) { var d = new Date(ms); return fmt(d) + ", " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }

  function resultCard(r, official) {
    var card = el("article", "card");
    card.appendChild(el("h2", "", official ? "Your official result" : "Practice result"));
    card.appendChild(el("p", "bignum", r.score + " of " + r.total));
    card.appendChild(el("p", "", r.name + " · " + fmtWhen(r.when) + " · " + fmtTime(r.secs)));
    card.appendChild(el("p", "note", official ? "Your result has been saved for the leader. They will announce results at the closing on Tuesday 24 November." : "This was practice and does not count. Your official result is saved."));
    if (r.wrong && r.wrong.length) {
      var b = el("div"); b.appendChild(label("Worth another look"));
      var u = el("ul", "items");
      r.wrong.forEach(function (w) { u.appendChild(el("li", "", w.q + " Answer: " + w.a + " (" + w.from + ")")); });
      b.appendChild(u); card.appendChild(b);
    }
    return card;
  }

  function renderQuiz() {
    editing = false; app.innerHTML = "";
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
    card.appendChild(el("p", "", QUIZ.length + " questions on Texts 1 to 8 and the Damodarastakam. You get one official attempt, so take your time. Questions and answers appear in a different order each time."));
    var lab = el("label", "label", "Your name"); lab.setAttribute("for", "q-name"); card.appendChild(lab);
    var inp = document.createElement("input"); inp.id = "q-name"; inp.type = "text"; inp.className = "input"; inp.maxLength = 40; inp.value = qstore.name || (member ? member.name : ""); inp.autocomplete = "name";
    card.appendChild(inp);
    var err = el("p", "note", ""); card.appendChild(err);
    var go = el("button", "btn primary", "Start the quiz");
    go.addEventListener("click", function () {
      var n = inp.value.trim();
      if (!n) { err.textContent = "Please type your name first."; return; }
      qstore.name = n; qsave();
      if (READY && !member) {
        go.disabled = true; err.textContent = "Joining the group so your result is saved...";
        joinGroup(n, "").then(function () { startQuiz(n, true); }, function () { startQuiz(n, true); });
      } else startQuiz(n, true);
    });
    card.appendChild(go); app.appendChild(card);
  }

  function startQuiz(name, official) {
    editing = true; updateFab();
    var qs = shuffle(QUIZ).map(function (q) { return { q: q, opts: shuffle([q.a].concat(q.w)) }; });
    var pos = 0, score = 0, wrong = [], t0 = Date.now();
    function show() {
      app.innerHTML = "";
      var item = qs[pos], card = el("article", "card");
      card.appendChild(el("p", "note", (official ? "" : "Practice · ") + "Question " + (pos + 1) + " of " + qs.length));
      card.appendChild(el("h2", "", item.q.q));
      var chosen = null, btns = [];
      var list = el("div", "actions");
      var nx = el("button", "btn primary", pos === qs.length - 1 ? "Finish" : "Next question"); nx.disabled = true;
      item.opts.forEach(function (o) {
        var b = el("button", "btn opt", o);
        b.addEventListener("click", function () { chosen = o; btns.forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); nx.disabled = false; });
        btns.push(b); list.appendChild(b);
      });
      card.appendChild(list);
      nx.addEventListener("click", function () {
        if (chosen === item.q.a) score++; else wrong.push({ q: item.q.q, a: item.q.a, from: item.q.from });
        pos++;
        if (pos < qs.length) { show(); window.scrollTo(0, 0); return; }
        var r = { name: name, score: score, total: qs.length, secs: Math.round((Date.now() - t0) / 1000), when: Date.now(), wrong: wrong };
        if (official) { qstore.official = r; qstore.pending = true; qsave(); submitQuizIfPending(); }
        app.innerHTML = ""; app.appendChild(resultCard(r, official));
        var back = el("button", "btn", "Back to the quiz page"); back.style.marginTop = "12px";
        back.addEventListener("click", function () { editing = false; renderQuiz(); }); app.appendChild(back);
        window.scrollTo(0, 0);
      });
      card.appendChild(nx); app.appendChild(card);
    }
    show(); window.scrollTo(0, 0);
  }

  /* ---------- tabs ---------- */
  var VIEWS = ["day", "all", "remind", "quiz", "admin"];
  function setView(v) {
    view = v; editing = false;
    VIEWS.forEach(function (k) { document.getElementById("b-" + k).setAttribute("aria-pressed", k === v); });
    if (v === "day") renderDay(); else if (v === "all") renderAll(); else if (v === "remind") renderReminders(); else if (v === "admin") renderAdmin(); else renderQuiz();
    updateFab();
  }
  document.getElementById("b-day").addEventListener("click", function () { if (view === "day") { sel = Math.min(Math.max(tIdx, 0), DAYS.length - 1); } setView("day"); });
  ["all", "remind", "quiz", "admin"].forEach(function (k) { document.getElementById("b-" + k).addEventListener("click", function () { setView(k); }); });
  setView("day");

  /* ---------- load the shared things in the background ---------- */
  function refreshIfIdle() { if (!editing && view === "day") renderDay(); }
  refreshContent().then(function (changed) { if (changed) refreshIfIdle(); });
  detectAdmin().then(function (ok) { if (ok) refreshIfIdle(); });
  pull().then(function (ok) { if (ok) refreshIfIdle(); });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
