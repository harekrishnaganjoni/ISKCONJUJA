// ============================================================
// ISKCON JUJA: course player (catalogue, course page, lesson player, quizzes).
// One page (course.html), hash routes:  #/  catalogue | #/c/<courseId> | #/l/<lessonId> | #/q/<quizId>
// All content comes from the database. Nothing is hardcoded.
// Reading needs no sign-in. Saving progress and taking quizzes uses a guest session
// (a separate login store, so it never interferes with the main site login).
// ============================================================
(function () {
  "use strict";
  var D = window.ISKCON_DATA;
  var root = document.getElementById("course-root");
  if (!root) return;
  var db = D && D.READY ? D.client : null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function safeUrl(u) { u = String(u || "").trim(); return /^https?:\/\//i.test(u) ? u : ""; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // limited formatting: blank line = paragraph, "- " = bullet, **bold**, *italic*, [text](https://link)
  function fmt(text) {
    var blocks = String(text == null ? "" : text).replace(/\r/g, "").split(/\n{2,}/);
    function inline(t) {
      t = esc(t);
      t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
      return t.replace(/\n/g, "<br>");
    }
    return blocks.map(function (b) {
      var lines = b.split("\n");
      if (lines.every(function (l) { return /^\s*[-•]\s+/.test(l); })) {
        return "<ul>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^\s*[-•]\s+/, "")) + "</li>"; }).join("") + "</ul>";
      }
      return "<p>" + inline(b) + "</p>";
    }).join("");
  }

  // ---------- session: reading is free; saving uses the main login if present, else a guest session ----------
  var saveClient = null, saveState = "unknown"; // unknown | ok | off
  function getSaver() {
    if (saveState === "off") return Promise.resolve(null);
    if (saveClient) return Promise.resolve(saveClient);
    if (!db) { saveState = "off"; return Promise.resolve(null); }
    return db.auth.getSession().then(function (r) {
      if (r.data && r.data.session && !r.data.session.user.is_anonymous) { saveClient = db; saveState = "ok"; return db; }
      var guest = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, { auth: { storageKey: "iskcon-learner", persistSession: true, autoRefreshToken: true } });
      return guest.auth.getSession().then(function (g) {
        if (g.data && g.data.session) { saveClient = guest; saveState = "ok"; return guest; }
        return guest.auth.signInAnonymously().then(function (s) {
          if (s.error || !s.data || !s.data.session) { saveState = "off"; return null; }
          saveClient = guest; saveState = "ok"; return guest;
        });
      });
    }).catch(function () { saveState = "off"; return null; });
  }

  // ---------- helpers ----------
  function setTitle(t) { document.title = (t ? t + " | " : "") + "ISKCON JUJA Courses"; }
  function go(h) { location.hash = h; }
  function loading() { root.innerHTML = '<div class="cr-wrap"><p class="cr-muted">Loading…</p></div>'; }
  function fail(msg) { root.innerHTML = '<div class="cr-wrap"><div class="cr-empty"><h2>' + esc(msg || "Something went wrong") + '</h2><p><a class="button" href="#/">Back to all courses</a></p></div></div>'; }
  function shell() { var w = el("div", "cr-wrap"); root.innerHTML = ""; root.appendChild(w); window.scrollTo(0, 0); return w; }
  function minutes(n) { return n ? n + " min" : ""; }

  // ---------- catalogue ----------
  function renderCatalogue() {
    setTitle("");
    loading();
    db.from("courses").select("id,title,subtitle,description,cover_image_url,category,level,estimated_minutes,visibility,order_index,accent_color")
      .order("order_index", { ascending: true }).order("title", { ascending: true }).then(function (r) {
        if (r.error) return fail("We could not load the courses. Please try again.");
        var w = shell();
        w.appendChild(el("div", "cr-eyebrow", "Learn"));
        w.appendChild(el("h1", "cr-h1", "Courses"));
        if (!r.data.length) {
          w.appendChild(el("div", "cr-empty", "<h2>No courses are open right now</h2><p>Courses will appear here as soon as they are published.</p>"));
          return;
        }
        var cats = {}; r.data.forEach(function (c) { if (c.category) cats[c.category] = 1; });
        var catNames = Object.keys(cats), levels = ["beginner", "intermediate", "advanced"];
        var filters = el("div", "cr-filters");
        var selCat = el("select", "cr-select", '<option value="">All topics</option>' + catNames.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join(""));
        var selLvl = el("select", "cr-select", '<option value="">All levels</option>' + levels.map(function (l) { return '<option value="' + l + '">' + l.charAt(0).toUpperCase() + l.slice(1) + '</option>'; }).join(""));
        if (catNames.length) filters.appendChild(selCat);
        if (r.data.some(function (c) { return c.level; })) filters.appendChild(selLvl);
        if (filters.children.length) w.appendChild(filters);
        var grid = el("div", "cr-grid"); w.appendChild(grid);
        function draw() {
          grid.innerHTML = "";
          r.data.filter(function (c) { return (!selCat.value || c.category === selCat.value) && (!selLvl.value || c.level === selLvl.value); }).forEach(function (c) {
            var a = el("a", "cr-card"); a.href = "#/c/" + c.id;
            if (c.accent_color && /^#[0-9a-f]{3,8}$/i.test(c.accent_color)) a.style.borderTopColor = c.accent_color;
            var img = safeUrl(c.cover_image_url);
            a.innerHTML = (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : "") +
              '<div class="cr-card-body"><h2>' + esc(c.title) + '</h2>' +
              (c.subtitle ? '<p class="cr-sub">' + esc(c.subtitle) + '</p>' : "") +
              '<p class="cr-meta">' + [c.level ? c.level : "", minutes(c.estimated_minutes), c.visibility === "members" ? "Members" : ""].filter(Boolean).map(esc).join(" · ") + '</p></div>';
            grid.appendChild(a);
          });
          if (!grid.children.length) grid.appendChild(el("p", "cr-muted", "No courses match those filters."));
        }
        selCat.onchange = draw; selLvl.onchange = draw; draw();
      });
  }

  // ---------- course page ----------
  function getProgress(lessonIds) {
    return getSaver().then(function (c) {
      if (!c || !lessonIds.length) return {};
      return c.from("course_lesson_progress").select("lesson_id,status").in("lesson_id", lessonIds).then(function (r) {
        var m = {}; (r.data || []).forEach(function (p) { m[p.lesson_id] = p.status; }); return m;
      });
    });
  }
  function flatLessons(modules) {
    var out = [];
    modules.forEach(function (m) { (m.course_lessons || []).slice().sort(byOrder).forEach(function (l) { out.push({ id: l.id, title: l.title, module: m.title, module_id: m.id, est: l.est_minutes }); }); });
    return out;
  }
  function byOrder(a, b) { return (a.order_index || 0) - (b.order_index || 0); }

  function loadCourse(id) {
    return Promise.all([
      db.from("courses").select("*").eq("id", id).maybeSingle(),
      db.from("course_modules").select("id,title,intro_text,order_index,course_lessons(id,title,est_minutes,order_index)").eq("course_id", id).order("order_index", { ascending: true }),
      db.from("course_quizzes").select("id,kind,module_id,course_id,graded").or("course_id.eq." + id)
    ]).then(function (res) {
      var course = res[0].data, modules = res[1].data || [];
      if (!course) return null;
      modules.sort(byOrder);
      var mids = modules.map(function (m) { return m.id; });
      return (mids.length ? db.from("course_quizzes").select("id,kind,module_id,graded").in("module_id", mids) : Promise.resolve({ data: [] })).then(function (q) {
        return { course: course, modules: modules, quizzes: q.data || [], finals: res[2].data || [] };
      });
    });
  }

  function renderCourse(id) {
    loading();
    loadCourse(id).then(function (d) {
      if (!d) return fail("This course is not available.");
      var lessons = flatLessons(d.modules);
      setTitle(d.course.title);
      return getProgress(lessons.map(function (l) { return l.id; })).then(function (prog) {
        var w = shell();
        w.appendChild(el("p", "cr-crumb", '<a href="#/">All courses</a>'));
        w.appendChild(el("h1", "cr-h1", esc(d.course.title)));
        if (d.course.subtitle) w.appendChild(el("p", "cr-sub", esc(d.course.subtitle)));
        if (d.course.description) w.appendChild(el("div", "cr-prose", fmt(d.course.description)));
        var done = lessons.filter(function (l) { return prog[l.id] === "complete"; }).length;
        var next = lessons.filter(function (l) { return prog[l.id] !== "complete"; })[0] || lessons[0];
        var bar = el("div", "cr-progress");
        bar.innerHTML = '<div class="cr-bar"><span style="width:' + (lessons.length ? Math.round(done / lessons.length * 100) : 0) + '%"></span></div><p class="cr-muted">' + done + " of " + lessons.length + " lessons done" + (d.course.estimated_minutes ? " · about " + d.course.estimated_minutes + " min in total" : "") + "</p>";
        w.appendChild(bar);
        if (next) w.appendChild(el("p", "", '<a class="button" href="#/l/' + next.id + '">' + (done ? "Continue" : "Start the course") + "</a>"));
        d.modules.forEach(function (m, mi) {
          var sec = el("section", "cr-module");
          sec.appendChild(el("h2", "", "Module " + (mi + 1) + ": " + esc(m.title)));
          if (m.intro_text) sec.appendChild(el("p", "cr-muted", esc(m.intro_text)));
          var ol = el("ol", "cr-lessons");
          (m.course_lessons || []).slice().sort(byOrder).forEach(function (l) {
            var li = el("li", prog[l.id] === "complete" ? "is-done" : "");
            li.innerHTML = '<a href="#/l/' + l.id + '"><span class="cr-tick" aria-hidden="true">' + (prog[l.id] === "complete" ? "✓" : "") + "</span><span>" + esc(l.title) + '</span><small>' + minutes(l.est_minutes) + "</small></a>";
            ol.appendChild(li);
          });
          sec.appendChild(ol);
          d.quizzes.filter(function (q) { return q.module_id === m.id; }).forEach(function (q) {
            sec.appendChild(el("p", "", '<a class="button secondary" href="#/q/' + q.id + '">Module quiz</a>'));
          });
          w.appendChild(sec);
        });
        d.finals.forEach(function (q) { w.appendChild(el("p", "", '<a class="button" href="#/q/' + q.id + '">Final test</a>')); });
        if (!lessons.length) w.appendChild(el("div", "cr-empty", "<p>Lessons for this course have not been published yet.</p>"));
      });
    }).catch(function () { fail("We could not load this course."); });
  }

  // ---------- block renderers (one per type) ----------
  var R = {};
  R.text = function (c) { return el("div", "cr-prose", fmt(c.text)); };
  R.key_point = function (c) { return el("div", "cr-key", "<strong>Key point</strong>" + "<p>" + esc(c.text || c.point || "") + "</p>"); };
  R.callout = function (c) { return el("div", "cr-callout cr-" + (c.style === "caution" ? "caution" : "note"), fmt(c.text)); };
  R.quote = function (c) {
    if (c.verified !== true) return null; // never show an unverified quote
    var d = el("blockquote", "cr-quote");
    var src = [c.speaker, c.source_reference].filter(Boolean).map(esc).join(", ");
    var link = safeUrl(c.source_url);
    d.innerHTML = "<p>“" + esc(c.quote_text) + "”</p>" + (src ? "<footer>" + (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' + src + "</a>" : src) + "</footer>" : "");
    return d;
  };
  R.analogy = function (c) {
    var d = el("div", "cr-analogy");
    d.innerHTML = (c.title ? "<h3>" + esc(c.title) + "</h3>" : "") + fmt(c.explanation) +
      (safeUrl(c.image_url) ? '<img src="' + esc(safeUrl(c.image_url)) + '" alt="' + esc(c.image_alt || c.title || "") + '" loading="lazy">' : "") +
      (c.in_reality ? '<p class="cr-real"><strong>In reality:</strong> ' + esc(c.in_reality) + "</p>" : "");
    return d;
  };
  R.image = function (c) {
    var u = safeUrl(c.url); if (!u) return null;
    var f = el("figure", "cr-fig");
    f.innerHTML = '<img src="' + esc(u) + '" alt="' + esc(c.alt_text || "") + '" loading="lazy">' + (c.caption || c.credit ? "<figcaption>" + esc(c.caption || "") + (c.credit ? " <small>" + esc(c.credit) + "</small>" : "") + "</figcaption>" : "");
    return f;
  };
  R.gallery = function (c) {
    var items = (c.items || []).filter(function (i) { return safeUrl(i.url); }); if (!items.length) return null;
    var g = el("div", "cr-gallery");
    items.forEach(function (i) { g.appendChild(R.image(i)); });
    return g;
  };
  function ytId(u) { var m = /(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/.exec(u || ""); return m ? m[1] : ""; }
  R.video = function (c) {
    var u = safeUrl(c.url); if (!u) return null;
    var d = el("div", "cr-media");
    if ((c.provider || "youtube") === "youtube" && ytId(u)) {
      d.innerHTML = '<div class="cr-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + ytId(u) + (c.start_seconds ? "?start=" + parseInt(c.start_seconds, 10) : "") + '" title="Video" loading="lazy" allowfullscreen></iframe></div>';
    } else {
      d.innerHTML = '<video controls preload="none" src="' + esc(u) + '"></video>';
    }
    if (c.transcript) d.appendChild(el("details", "cr-transcript", "<summary>Transcript</summary>" + fmt(c.transcript)));
    if (c.credit) d.appendChild(el("p", "cr-muted", esc(c.credit)));
    return d;
  };
  R.audio = function (c) {
    var u = safeUrl(c.url); if (!u) return null;
    var d = el("div", "cr-media", '<audio controls preload="none" src="' + esc(u) + '"></audio>');
    if (c.transcript) d.appendChild(el("details", "cr-transcript", "<summary>Transcript</summary>" + fmt(c.transcript)));
    return d;
  };
  R.download = function (c) {
    var u = safeUrl(c.file_url); if (!u) return null;
    return el("p", "", '<a class="button secondary" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer" download>' + esc(c.label || "Download") + "</a>");
  };
  R.practice = function (c) {
    var d = el("div", "cr-callout cr-note", "<strong>Practice</strong>");
    d.appendChild(el("ol", "", (c.steps || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("")));
    return d;
  };
  R.table = function (c) {
    var h = c.headers || [], rows = c.rows || []; if (!h.length && !rows.length) return null;
    var wrap = el("div", "cr-tablewrap");
    wrap.innerHTML = '<table class="cr-table">' + (h.length ? "<thead><tr>" + h.map(function (x) { return "<th>" + esc(x) + "</th>"; }).join("") + "</tr></thead>" : "") +
      "<tbody>" + rows.map(function (r) { return "<tr>" + r.map(function (x) { return "<td>" + esc(x) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
    return wrap;
  };
  R.timeline = function (c) {
    var items = c.items || []; if (!items.length) return null;
    var ul = el("ol", "cr-timeline");
    items.forEach(function (i) {
      var li = el("li");
      var inner = '<span class="cr-tl-dot"></span><span class="cr-tl-when">' + esc(i.label) + '</span><span class="cr-tl-what">' + esc(i.title) + "</span>";
      if (i.lesson_id && /^[0-9a-f-]{36}$/i.test(i.lesson_id)) li.innerHTML = '<a href="#/l/' + i.lesson_id + '">' + inner + "</a>";
      else li.innerHTML = '<span class="cr-tl-static">' + inner + "</span>";
      if (i.detail) li.appendChild(el("p", "cr-muted", esc(i.detail)));
      ul.appendChild(li);
    });
    return ul;
  };
  R.reflection = function (c, ctx) {
    var d = el("div", "cr-reflect", "<strong>Reflect</strong><p>" + esc(c.prompt || "") + "</p>");
    if (c.allow_private_note) {
      var key = "course-note-" + ctx.blockId, ta = el("textarea", "cr-note"); ta.rows = 3; ta.maxLength = 2000; ta.placeholder = "Your private note (kept on this device)";
      try { ta.value = localStorage.getItem(key) || ""; } catch (e) {}
      ta.addEventListener("input", function () { try { localStorage.setItem(key, ta.value); } catch (e) {} });
      d.appendChild(ta);
    }
    return d;
  };
  R.quiz_ref = function (c) { return c.quiz_id ? el("p", "", '<a class="button secondary" href="#/q/' + esc(c.quiz_id) + '">Take the quiz</a>') : null; };

  // ---------- lesson player ----------
  function renderLesson(id) {
    loading();
    db.from("course_lessons").select("id,title,est_minutes,module_id,course_modules(id,title,course_id)").eq("id", id).maybeSingle().then(function (lr) {
      var lesson = lr.data; if (!lesson) return fail("This lesson is not available.");
      var courseId = lesson.course_modules.course_id;
      return Promise.all([
        db.from("course_blocks").select("id,type,content,order_index").eq("lesson_id", id).order("order_index", { ascending: true }),
        loadCourse(courseId)
      ]).then(function (res) {
        var blocks = res[0].data || [], d = res[1];
        var lessons = flatLessons(d.modules);
        var idx = lessons.findIndex(function (l) { return l.id === id; });
        var prev = lessons[idx - 1], next = lessons[idx + 1];
        var modLessons = lessons.filter(function (l) { return l.module_id === lesson.module_id; });
        var posInModule = modLessons.findIndex(function (l) { return l.id === id; }) + 1;
        setTitle(lesson.title);
        var w = shell();
        w.appendChild(el("div", "cr-topbar", '<div class="cr-bar"><span style="width:' + Math.round((idx + 1) / lessons.length * 100) + '%"></span></div>'));
        w.appendChild(el("p", "cr-crumb", '<a href="#/c/' + courseId + '">' + esc(d.course.title) + "</a> · " + esc(lesson.course_modules.title) + " · Lesson " + posInModule + " of " + modLessons.length));
        w.appendChild(el("h1", "cr-h1", esc(lesson.title)));
        var body = el("div", "cr-lesson"); w.appendChild(body);
        blocks.forEach(function (b) {
          var fn = R[b.type]; if (!fn) return;
          var node = fn(b.content || {}, { blockId: b.id });
          if (node) body.appendChild(node);
        });
        if (!body.children.length) body.appendChild(el("p", "cr-muted", "This lesson has no content yet."));
        var nav = el("div", "cr-nav");
        nav.innerHTML = (prev ? '<a class="button secondary" href="#/l/' + prev.id + '">← Back</a>' : "<span></span>");
        var nx = el("a", "button", next ? "Next lesson →" : "Finish");
        nx.href = next ? "#/l/" + next.id : "#/c/" + courseId;
        nx.addEventListener("click", function () { markDone(id); });
        nav.appendChild(nx);
        w.appendChild(nav);
      });
    }).catch(function () { fail("We could not load this lesson."); });
  }
  function markDone(lessonId) {
    getSaver().then(function (c) {
      if (!c) return;
      c.auth.getUser().then(function (u) {
        if (!u.data || !u.data.user) return;
        c.from("course_lesson_progress").upsert({ user_id: u.data.user.id, lesson_id: lessonId, status: "complete", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" });
      });
    });
  }

  // ---------- quiz ----------
  function renderQuiz(id) {
    loading();
    db.rpc("course_quiz_for_learner", { p_quiz: id }).then(function (r) {
      var q = r.data; if (r.error || !q) return fail("This quiz is not available.");
      var qs = q.questions.filter(function (x) { return ["multiple_choice", "true_false", "multi_select", "audio_choice"].indexOf(x.type) >= 0; });
      if (!qs.length) return fail("This quiz has no questions yet.");
      if (q.shuffle_questions) qs = shuffle(qs);
      setTitle("Quiz");
      var w = shell(), answers = {}, i = 0;
      w.appendChild(el("p", "cr-crumb", '<a href="javascript:history.back()">← Back</a>'));
      w.appendChild(el("h1", "cr-h1", q.kind === "final" ? "Final test" : "Quick review"));
      if (q.kind !== "final") w.appendChild(el("p", "cr-muted", "This is just for you. You can try as many times as you like."));
      var stage = el("div", "cr-quiz"); w.appendChild(stage);
      function draw() {
        var qq = qs[i]; stage.innerHTML = "";
        stage.appendChild(el("p", "cr-muted", "Question " + (i + 1) + " of " + qs.length));
        stage.appendChild(el("h2", "cr-qprompt", esc(qq.prompt)));
        var multi = qq.type === "multi_select", opts = q.shuffle_options ? shuffle(qq.options) : qq.options;
        var chosen = answers[qq.id] || [];
        opts.forEach(function (o) {
          var lab = el("label", "cr-opt"), inp = el("input"); inp.type = multi ? "checkbox" : "radio"; inp.name = "opt"; inp.value = o.id; inp.checked = chosen.indexOf(o.id) >= 0;
          inp.addEventListener("change", function () {
            var cur = multi ? Array.prototype.slice.call(stage.querySelectorAll("input:checked")).map(function (x) { return x.value; }) : [o.id];
            answers[qq.id] = cur; btn.disabled = !cur.length;
          });
          lab.appendChild(inp); lab.appendChild(el("span", "", esc(o.text))); stage.appendChild(lab);
        });
        var btn = el("button", "button", i < qs.length - 1 ? "Next" : "Submit"); btn.type = "button"; btn.disabled = !(answers[qq.id] || []).length;
        btn.addEventListener("click", function () { if (i < qs.length - 1) { i++; draw(); } else submit(); });
        stage.appendChild(btn);
      }
      function submit() {
        stage.innerHTML = "<p class='cr-muted'>Checking…</p>";
        getSaver().then(function (c) {
          if (!c) { stage.innerHTML = '<div class="cr-empty"><h2>Quizzes are not switched on yet</h2><p>We are finishing setting this up. Please check back soon.</p></div>'; return; }
          c.rpc("course_submit_quiz", { p_quiz: id, p_answers: answers }).then(function (s) {
            if (s.error) { stage.innerHTML = '<div class="cr-empty"><h2>' + esc(/attempts/i.test(s.error.message) ? "No attempts left for this quiz." : "We could not check your answers.") + "</h2></div>"; return; }
            showResult(s.data);
          });
        });
      }
      function showResult(res) {
        stage.innerHTML = "";
        if (res.score_percent != null) stage.appendChild(el("h2", "", "You scored " + Math.round(res.score_percent) + "%" + (res.graded && res.passed ? " — passed" : "")));
        res.results.forEach(function (x) {
          var q0 = qs.filter(function (z) { return z.id === x.question_id; })[0]; if (!q0) return;
          var d = el("div", "cr-result " + (x.correct ? "ok" : "no"));
          var right = (x.correct_option_ids || []).map(function (oid) { var o = q0.options.filter(function (z) { return z.id === oid; })[0]; return o ? o.text : ""; }).filter(Boolean);
          d.innerHTML = "<strong>" + esc(q0.prompt) + "</strong><p>" + (x.correct ? "Correct." : "Not quite." + (right.length ? " The answer: " + esc(right.join(", ")) + "." : "")) + "</p>" + (x.explanation ? "<p class='cr-muted'>" + esc(x.explanation) + "</p>" : "");
          stage.appendChild(d);
        });
        stage.appendChild(el("p", "", '<a class="button secondary" href="javascript:history.back()">Back to the course</a> <a class="button" href="#/q/' + id + '" onclick="location.reload()">Try again</a>'));
      }
      draw();
    });
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---------- router ----------
  function route() {
    if (!db) { fail("Courses are not connected yet."); return; }
    var h = location.hash.replace(/^#\/?/, ""), p = h.split("/");
    var uuid = /^[0-9a-f-]{36}$/i;
    if (p[0] === "c" && uuid.test(p[1] || "")) renderCourse(p[1]);
    else if (p[0] === "l" && uuid.test(p[1] || "")) renderLesson(p[1]);
    else if (p[0] === "q" && uuid.test(p[1] || "")) renderQuiz(p[1]);
    else renderCatalogue();
  }
  window.addEventListener("hashchange", route);
  route();
})();
