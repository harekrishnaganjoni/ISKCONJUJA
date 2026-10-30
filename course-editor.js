// ============================================================
// Course editor (admin only). Courses > modules > lessons > blocks, quizzes,
// questions inbox, and a JSON import. Talks to Supabase with the admin's own
// login; the database rules (is_admin()) are the real protection.
// ============================================================
(function () {
  "use strict";

  function ready(fn) {
    if (window.ISKCON_DATA && window.ISKCON_DATA.READY) fn();
    else document.addEventListener("DOMContentLoaded", function () { if (window.ISKCON_DATA && window.ISKCON_DATA.READY) fn(); });
  }

  ready(function () {
    var db = window.ISKCON_DATA.client, root = document.getElementById("ce-root");
    if (!root || !db) return;

    // ---------- helpers ----------
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function run(p) { return p.then(function (r) { if (r && r.error) throw r.error; return r ? r.data : null; }); }
    function toast(text, bad) {
      var t = el("div", "ce-toast" + (bad ? " bad" : ""), esc(text)); document.body.appendChild(t);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, bad ? 6000 : 2400);
    }
    function fail(e) { toast((e && e.message) || "Something went wrong.", true); }
    function byOrder(a, b) { return (a.order_index || 0) - (b.order_index || 0); }
    function btn(label, cls, fn) { var b = el("button", "ce-btn " + (cls || ""), esc(label)); b.type = "button"; if (fn) b.addEventListener("click", function () { fn(b); }); return b; }
    function link(label, href, cls) { var a = el("a", "ce-btn " + (cls || ""), esc(label)); a.href = href; return a; }
    function confirmDo(text, fn) { if (window.confirm(text)) fn(); }
    function page(title, crumbs) {
      root.innerHTML = "";
      if (crumbs) root.appendChild(el("p", "ce-crumb", crumbs));
      root.appendChild(el("h1", "", esc(title)));
    }

    // Build a form from a spec list. kinds: text, area, num, bool, select, lines, json
    function buildForm(specs, obj) {
      var form = el("div"), readers = [];
      specs.forEach(function (s) {
        var v = obj[s.k], lab = el("label", "ce-field" + (s.kind === "bool" ? " check" : "")), input;
        if (s.kind === "bool") {
          input = el("input"); input.type = "checkbox"; input.checked = !!v;
          lab.appendChild(input); lab.appendChild(el("span", "", esc(s.l)));
          readers.push(function (o) { o[s.k] = input.checked; });
        } else {
          lab.appendChild(document.createTextNode(s.l));
          if (s.kind === "area" || s.kind === "lines" || s.kind === "json") {
            input = el("textarea", s.kind === "json" ? "ce-code" : "");
            input.value = s.kind === "lines" ? (v || []).join("\n") : s.kind === "json" ? JSON.stringify(v == null ? (s.empty || []) : v, null, 2) : (v || "");
          } else if (s.kind === "select") {
            input = el("select");
            s.options.forEach(function (o) { var op = el("option", "", esc(o[1])); op.value = o[0]; input.appendChild(op); });
            input.value = v == null ? "" : v;
          } else {
            input = el("input"); input.type = s.kind === "num" ? "number" : "text"; input.value = v == null ? "" : v;
          }
          lab.appendChild(input);
          if (s.help) lab.appendChild(el("small", "", esc(s.help)));
          readers.push(function (o) {
            var x = input.value;
            if (s.kind === "num") o[s.k] = x === "" ? null : parseInt(x, 10);
            else if (s.kind === "lines") o[s.k] = x.split("\n").map(function (t) { return t.trim(); }).filter(Boolean);
            else if (s.kind === "json") { try { o[s.k] = JSON.parse(x || "null"); } catch (e) { throw new Error(s.l + " is not valid JSON: " + e.message); } }
            else o[s.k] = (s.keepEmpty ? x : (x.trim() === "" ? null : x.trim()));
          });
        }
        form.appendChild(lab);
      });
      return { node: form, read: function () { var o = {}; readers.forEach(function (r) { r(o); }); return o; } };
    }

    function reorder(table, rows, i, dir, done) {
      var j = i + dir; if (j < 0 || j >= rows.length) return;
      var t = rows[i]; rows[i] = rows[j]; rows[j] = t;
      Promise.all(rows.map(function (r, n) { return run(db.from(table).update({ order_index: n }).eq("id", r.id)); })).then(done).catch(fail);
    }
    function nextOrder(rows) { return rows.reduce(function (m, r) { return Math.max(m, (r.order_index || 0) + 1); }, rows.length); }

    // ---------- field specs ----------
    var YESNO = function (a) { return a; };
    var COURSE_SPEC = [
      { k: "title", l: "Course title", kind: "text" },
      { k: "subtitle", l: "Subtitle (one line)", kind: "text" },
      { k: "description", l: "Description", kind: "area" },
      { k: "visibility", l: "Who can see it", kind: "select", options: [["public", "Public: anyone, listed on the Learn page"], ["members", "Members only"], ["internal", "Internal: a chosen group only"]] },
      { k: "level", l: "Level", kind: "select", options: [["", "Not set"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] },
      { k: "category", l: "Category", kind: "text" },
      { k: "estimated_minutes", l: "Total minutes (about)", kind: "num" },
      { k: "cover_image_url", l: "Cover picture web address (https://…)", kind: "text" },
      { k: "sequential_unlock", l: "Lessons must be done in order", kind: "bool" },
      { k: "certificate_enabled", l: "Give a certificate on completion", kind: "bool" },
      { k: "pass_mark_percent", l: "Pass mark for the final test (%)", kind: "num" },
      { k: "discussion_mode", l: "Learner questions", kind: "select", options: [["off", "Off"], ["ask_question", "Learners can ask a question (private to us)"], ["forum", "Forum"]] },
      { k: "reviews_enabled", l: "Ask for a review at the end", kind: "bool" },
      { k: "lesson_feedback_enabled", l: "Ask 'was this clear?' after each lesson", kind: "bool" },
      { k: "published", l: "Live (visible to learners)", kind: "bool" }
    ];
    var BLOCKS = {
      text: { label: "Text", spec: [{ k: "text", l: "Text", kind: "area", help: "Blank line = new paragraph. '- ' starts a bullet. **bold**, *italic*, [words](https://link)." }] },
      key_point: { label: "Key point", spec: [{ k: "text", l: "Key point", kind: "text" }] },
      callout: { label: "Note box", spec: [{ k: "text", l: "Text", kind: "area" }, { k: "style", l: "Style", kind: "select", options: [["note", "Note"], ["caution", "Caution"]] }] },
      quote: { label: "Quote", spec: [
        { k: "quote_text", l: "Quote (the exact words)", kind: "area" }, { k: "speaker", l: "Who said it", kind: "text" },
        { k: "source_reference", l: "Exact reference (book, verse, date, place)", kind: "text" }, { k: "source_url", l: "Link to the source (optional)", kind: "text" },
        { k: "verified", l: "VERIFIED: I checked the exact words against Vedabase or the official source", kind: "bool" }] },
      analogy: { label: "Analogy", spec: [{ k: "title", l: "Title", kind: "text" }, { k: "explanation", l: "The comparison", kind: "area" }, { k: "in_reality", l: "In reality (what each part stands for)", kind: "text" }, { k: "image_url", l: "Picture address (optional)", kind: "text" }, { k: "image_alt", l: "Picture description", kind: "text" }] },
      reflection: { label: "Reflection", spec: [{ k: "prompt", l: "Question to think about", kind: "area" }, { k: "allow_private_note", l: "Let the learner write a private note", kind: "bool" }] },
      practice: { label: "Practice steps", spec: [{ k: "steps", l: "Steps (one per line)", kind: "lines" }] },
      image: { label: "Picture", spec: [{ k: "url", l: "Picture address (https://…)", kind: "text" }, { k: "alt_text", l: "Describe the picture (for screen readers)", kind: "text" }, { k: "caption", l: "Caption", kind: "text" }, { k: "credit", l: "Credit / permission", kind: "text" }] },
      gallery: { label: "Gallery", spec: [{ k: "items", l: "Pictures (advanced: a list of {url, alt_text, caption})", kind: "json", empty: [] }] },
      video: { label: "Video", spec: [{ k: "url", l: "Video address (YouTube link or file)", kind: "text" }, { k: "provider", l: "Type", kind: "select", options: [["youtube", "YouTube"], ["file", "Video file"]] }, { k: "start_seconds", l: "Start at (seconds)", kind: "num" }, { k: "transcript", l: "Transcript (optional)", kind: "area" }, { k: "credit", l: "Credit", kind: "text" }] },
      audio: { label: "Audio", spec: [{ k: "url", l: "Audio file address", kind: "text" }, { k: "transcript", l: "Transcript (optional)", kind: "area" }] },
      download: { label: "Download", spec: [{ k: "file_url", l: "File address", kind: "text" }, { k: "label", l: "Button words", kind: "text" }] },
      table: { label: "Table", spec: [{ k: "headers", l: "Column titles (one per line)", kind: "lines" }, { k: "rows", l: "Rows (advanced: [[\"a\",\"b\"],[\"c\",\"d\"]])", kind: "json", empty: [] }] },
      timeline: { label: "Timeline", spec: [{ k: "items", l: "Items (advanced: [{label, title, detail}])", kind: "json", empty: [] }] },
      quiz_ref: { label: "Quiz button", spec: [{ k: "quiz_id", l: "Quiz id (copy from the quiz page address)", kind: "text" }] }
    };
    function blockPreview(b) {
      var c = b.content || {};
      return String(c.text || c.quote_text || c.prompt || c.explanation || c.title || c.url || c.label || (c.steps && c.steps.join("; ")) || "").slice(0, 120);
    }

    // ---------- course list ----------
    function viewList() {
      page("Course editor", '<a href="admin.html">← Admin panel</a>');
      var bar = el("div", "ce-row"); bar.appendChild(link("Questions and reviews", "#/inbox", "alt")); bar.appendChild(link("Import a course (JSON)", "#/import", "alt")); root.appendChild(bar);
      var nf = el("div", "ce-card"); nf.appendChild(el("h3", "", "New course"));
      var inp = el("input", "ce-in"); inp.placeholder = "Course title"; nf.appendChild(inp);
      nf.appendChild(el("p", "ce-muted", "It starts hidden. You choose when it goes live."));
      nf.appendChild(btn("Create", "", function () {
        if (!inp.value.trim()) return toast("Type a title first.", true);
        run(db.from("courses").insert({ title: inp.value.trim(), visibility: "public", published: false }).select("id").single())
          .then(function (d) { location.hash = "#/c/" + d.id; }).catch(fail);
      }));
      root.appendChild(nf);
      var box = el("div"); root.appendChild(box);
      run(db.from("courses").select("id,title,published,visibility").order("created_at", { ascending: false })).then(function (rows) {
        if (!rows || !rows.length) { box.appendChild(el("p", "ce-muted", "No courses yet.")); return; }
        rows.forEach(function (c) {
          var card = el("div", "ce-card ce-row grow");
          card.appendChild(el("div", "", "<strong>" + esc(c.title) + "</strong><br><span class='ce-muted'>" + esc(c.visibility || "") + "</span>"));
          card.appendChild(el("span", "ce-pill " + (c.published ? "live" : ""), c.published ? "Live" : "Hidden"));
          card.appendChild(link("Edit", "#/c/" + c.id));
          box.appendChild(card);
        });
      }).catch(fail);
    }

    // ---------- one course ----------
    function viewCourse(id) {
      page("Course", '<a href="#/">← All courses</a>');
      Promise.all([
        run(db.from("courses").select("*").eq("id", id).single()),
        run(db.from("course_modules").select("*").eq("course_id", id).order("order_index", { ascending: true })),
        run(db.from("course_quizzes").select("*").eq("course_id", id))
      ]).then(function (res) {
        var c = res[0], mods = (res[1] || []).sort(byOrder), courseQuizzes = res[2] || [];
        var modIds = mods.map(function (m) { return m.id; });
        return Promise.all([
          modIds.length ? run(db.from("course_lessons").select("*").in("module_id", modIds)) : [],
          modIds.length ? run(db.from("course_quizzes").select("*").in("module_id", modIds)) : []
        ]).then(function (r2) {
          var lessons = r2[0] || [], modQuizzes = r2[1] || [];
          var lessonIds = lessons.map(function (l) { return l.id; });
          return (lessonIds.length ? run(db.from("course_blocks").select("id,lesson_id,type,content").eq("type", "quote").in("lesson_id", lessonIds)) : Promise.resolve([])).then(function (qb) {
            drawCourse(c, mods, lessons, modQuizzes, courseQuizzes, (qb || []).filter(function (b) { return !(b.content && b.content.verified === true); }));
          });
        });
      }).catch(fail);

      function drawCourse(c, mods, lessons, modQuizzes, courseQuizzes, unverified) {
        page(c.title || "Course", '<a href="#/">← All courses</a>');
        if (unverified.length) root.appendChild(el("div", "ce-warn", "<strong>" + unverified.length + " quote" + (unverified.length > 1 ? "s are" : " is") + " not verified yet.</strong> They stay hidden from learners until you tick VERIFIED inside the quote block."));

        var set = el("div", "ce-card"); set.appendChild(el("h3", "", "Course settings"));
        var form = buildForm(COURSE_SPEC, c); set.appendChild(form.node);
        set.appendChild(btn("Save settings", "", function () {
          try { run(db.from("courses").update(form.read()).eq("id", c.id)).then(function () { toast("Saved."); }).catch(fail); } catch (e) { fail(e); }
        }));
        root.appendChild(set);

        var allBar = el("div", "ce-row");
        allBar.appendChild(btn("Make everything live", "alt", function () { setAllPublished(c, mods, lessons, modQuizzes, courseQuizzes, true); }));
        allBar.appendChild(btn("Hide everything", "alt", function () { setAllPublished(c, mods, lessons, modQuizzes, courseQuizzes, false); }));
        allBar.appendChild(link("See it as a learner", "course.html#/c/" + c.id, "alt"));
        root.appendChild(allBar);
        root.appendChild(el("p", "ce-muted", "“Make everything live” switches on the course, every module, lesson and quiz at once. Quotes still need their own VERIFIED tick."));

        root.appendChild(el("h2", "", "Modules and lessons"));
        mods.forEach(function (m, mi) {
          var card = el("div", "ce-card");
          var head = el("div", "ce-row grow");
          var t = el("input", "ce-in"); t.value = m.title; head.appendChild(t);
          head.appendChild(el("span", "ce-pill " + (m.published ? "live" : ""), m.published ? "Live" : "Hidden"));
          head.appendChild(btn("▲", "alt small", function () { reorder("course_modules", mods, mi, -1, function () { viewCourse(c.id); }); }));
          head.appendChild(btn("▼", "alt small", function () { reorder("course_modules", mods, mi, 1, function () { viewCourse(c.id); }); }));
          card.appendChild(head);
          var intro = el("textarea", "ce-in"); intro.placeholder = "Short introduction to this module (optional)"; intro.value = m.intro_text || ""; intro.style.minHeight = "60px"; card.appendChild(intro);
          var acts = el("div", "ce-row");
          acts.appendChild(btn("Save module", "small", function () { run(db.from("course_modules").update({ title: t.value.trim() || m.title, intro_text: intro.value.trim() || null }).eq("id", m.id)).then(function () { toast("Saved."); }).catch(fail); }));
          acts.appendChild(btn(m.published ? "Hide" : "Make live", "alt small", function () { run(db.from("course_modules").update({ published: !m.published }).eq("id", m.id)).then(function () { viewCourse(c.id); }).catch(fail); }));
          acts.appendChild(btn("Delete module", "danger small", function () { confirmDo("Delete this module and ALL its lessons and quizzes? This cannot be undone.", function () { run(db.from("course_modules").delete().eq("id", m.id)).then(function () { viewCourse(c.id); }).catch(fail); }); }));
          card.appendChild(acts);

          var ls = lessons.filter(function (l) { return l.module_id === m.id; }).sort(byOrder);
          ls.forEach(function (l, li) {
            var row = el("div", "ce-lesson");
            row.appendChild(el("a", "t", esc(l.title))); row.lastChild.href = "#/l/" + l.id;
            row.appendChild(el("span", "ce-pill " + (l.published ? "live" : ""), l.published ? "Live" : "Hidden"));
            row.appendChild(btn("▲", "alt small", function () { reorder("course_lessons", ls, li, -1, function () { viewCourse(c.id); }); }));
            row.appendChild(btn("▼", "alt small", function () { reorder("course_lessons", ls, li, 1, function () { viewCourse(c.id); }); }));
            row.appendChild(link("Edit", "#/l/" + l.id, "small"));
            card.appendChild(row);
          });
          var addl = el("div", "ce-row grow"); var li2 = el("input", "ce-in"); li2.placeholder = "New lesson title"; addl.appendChild(li2);
          addl.appendChild(btn("Add lesson", "alt small", function () {
            if (!li2.value.trim()) return toast("Type the lesson title first.", true);
            run(db.from("course_lessons").insert({ module_id: m.id, title: li2.value.trim(), order_index: nextOrder(ls), published: false }).select("id").single())
              .then(function (d) { location.hash = "#/l/" + d.id; }).catch(fail);
          }));
          card.appendChild(addl);
          var q = modQuizzes.filter(function (x) { return x.module_id === m.id; })[0];
          var qrow = el("div", "ce-row"); qrow.style.marginTop = "8px";
          if (q) qrow.appendChild(link("Edit the module quiz", "#/q/" + q.id, "alt small"));
          else qrow.appendChild(btn("Add a module quiz", "alt small", function () {
            run(db.from("course_quizzes").insert({ module_id: m.id, kind: "review", graded: false, published: false }).select("id").single()).then(function (d) { location.hash = "#/q/" + d.id; }).catch(fail);
          }));
          card.appendChild(qrow);
          root.appendChild(card);
        });
        var addm = el("div", "ce-card ce-row grow"); var mi2 = el("input", "ce-in"); mi2.placeholder = "New module title"; addm.appendChild(mi2);
        addm.appendChild(btn("Add module", "", function () {
          if (!mi2.value.trim()) return toast("Type the module title first.", true);
          run(db.from("course_modules").insert({ course_id: c.id, title: mi2.value.trim(), order_index: nextOrder(mods), published: false })).then(function () { viewCourse(c.id); }).catch(fail);
        }));
        root.appendChild(addm);

        root.appendChild(el("h2", "", "Final test"));
        var fin = courseQuizzes.filter(function (x) { return x.kind === "final"; })[0];
        var fc = el("div", "ce-card ce-row");
        if (fin) fc.appendChild(link("Edit the final test", "#/q/" + fin.id));
        else fc.appendChild(btn("Add a final test", "", function () {
          run(db.from("course_quizzes").insert({ course_id: c.id, kind: "final", graded: true, pass_mark_percent: c.pass_mark_percent || 70, published: false }).select("id").single()).then(function (d) { location.hash = "#/q/" + d.id; }).catch(fail);
        }));
        root.appendChild(fc);

        var danger = el("div", "ce-card"); danger.appendChild(btn("Delete this whole course", "danger", function () {
          confirmDo("Delete the whole course, all its modules, lessons and quizzes, and learner progress? This cannot be undone.", function () {
            run(db.from("courses").delete().eq("id", c.id)).then(function () { location.hash = "#/"; }).catch(fail);
          });
        }));
        root.appendChild(danger);
      }
    }

    function setAllPublished(c, mods, lessons, modQuizzes, courseQuizzes, on) {
      var ops = [run(db.from("courses").update({ published: on }).eq("id", c.id))];
      if (mods.length) ops.push(run(db.from("course_modules").update({ published: on }).in("id", mods.map(function (x) { return x.id; }))));
      if (lessons.length) ops.push(run(db.from("course_lessons").update({ published: on }).in("id", lessons.map(function (x) { return x.id; }))));
      var qs = modQuizzes.concat(courseQuizzes);
      if (qs.length) ops.push(run(db.from("course_quizzes").update({ published: on }).in("id", qs.map(function (x) { return x.id; }))));
      Promise.all(ops).then(function () { toast(on ? "Everything is live." : "Everything is hidden."); viewCourse(c.id); }).catch(fail);
    }

    // ---------- one lesson ----------
    function viewLesson(id) {
      page("Lesson", "");
      run(db.from("course_lessons").select("*").eq("id", id).single()).then(function (l) {
        return run(db.from("course_modules").select("id,title,course_id").eq("id", l.module_id).single()).then(function (m) {
          return Promise.all([
            run(db.from("course_blocks").select("*").eq("lesson_id", id).order("order_index", { ascending: true })),
            run(db.from("course_quizzes").select("id,kind,module_id").eq("module_id", m.id)),
            run(db.from("course_lesson_faqs").select("*").eq("lesson_id", id))
          ]).then(function (r) { drawLesson(l, m, (r[0] || []).sort(byOrder), r[1] || [], r[2] || []); });
        });
      }).catch(fail);

      function drawLesson(l, m, blocks, quizzes, faqs) {
        page(l.title, '<a href="#/c/' + esc(m.course_id) + '">← Back to the course</a> · ' + esc(m.title));
        var set = el("div", "ce-card");
        var form = buildForm([{ k: "title", l: "Lesson title", kind: "text" }, { k: "est_minutes", l: "Minutes to read (about)", kind: "num" }, { k: "published", l: "Live (visible to learners)", kind: "bool" }], l);
        set.appendChild(form.node);
        var r1 = el("div", "ce-row");
        r1.appendChild(btn("Save", "", function () { try { var o = form.read(); if (!o.title) throw new Error("The lesson needs a title."); run(db.from("course_lessons").update(o).eq("id", l.id)).then(function () { toast("Saved."); }).catch(fail); } catch (e) { fail(e); } }));
        r1.appendChild(link("See it as a learner", "course.html#/l/" + l.id, "alt"));
        r1.appendChild(btn("Delete lesson", "danger", function () { confirmDo("Delete this lesson and its blocks?", function () { run(db.from("course_lessons").delete().eq("id", l.id)).then(function () { location.hash = "#/c/" + m.course_id; }).catch(fail); }); }));
        set.appendChild(r1); root.appendChild(set);

        root.appendChild(el("h2", "", "Blocks (the pieces of the lesson, in order)"));
        blocks.forEach(function (b, bi) { root.appendChild(blockCard(b, bi, blocks, l, quizzes)); });
        if (!blocks.length) root.appendChild(el("p", "ce-muted", "No blocks yet. Add the first one below."));

        var add = el("div", "ce-card ce-row"); var sel = el("select", "ce-in"); sel.style.width = "auto";
        Object.keys(BLOCKS).forEach(function (k) { var o = el("option", "", esc(BLOCKS[k].label)); o.value = k; sel.appendChild(o); });
        add.appendChild(sel);
        add.appendChild(btn("Add block", "", function () {
          var content = {}; if (sel.value === "quote") content.verified = false;
          run(db.from("course_blocks").insert({ lesson_id: l.id, type: sel.value, content: content, order_index: nextOrder(blocks), published: true })).then(function () { viewLesson(l.id); }).catch(fail);
        }));
        root.appendChild(add);

        root.appendChild(el("h2", "", "Questions from learners that became FAQs"));
        if (!faqs.length) root.appendChild(el("p", "ce-muted", "None for this lesson."));
        faqs.forEach(function (f) { root.appendChild(el("div", "ce-card", "<strong>" + esc(f.question) + "</strong><p>" + esc(f.answer) + "</p>")); });
      }

      function blockCard(b, bi, blocks, l, quizzes) {
        var def = BLOCKS[b.type] || { label: b.type, spec: [] };
        var d = el("details", "ce-block");
        var sum = el("summary", "");
        sum.appendChild(el("span", "ce-type", esc(def.label)));
        if (b.type === "quote" && !(b.content && b.content.verified === true)) sum.appendChild(el("span", "ce-pill warn", "Not verified: hidden"));
        if (!b.published) sum.appendChild(el("span", "ce-pill", "Hidden"));
        sum.appendChild(el("span", "ce-prev", esc(blockPreview(b))));
        d.appendChild(sum);
        var body = el("div", "ce-body");
        var spec = def.spec;
        if (b.type === "quiz_ref") {
          spec = [{ k: "quiz_id", l: "Quiz", kind: "select", options: [["", "Choose…"]].concat(quizzes.map(function (q) { return [q.id, "Module quiz (" + q.kind + ")"]; })) }];
        }
        var form = buildForm(spec, b.content || {}); body.appendChild(form.node);
        if (b.type === "quote") body.appendChild(el("p", "ce-muted", "Quotes from Śrīla Prabhupāda's books are copyright of the BBT. Paste the exact words from Vedabase; confirm permission for reuse."));
        var acts = el("div", "ce-row");
        acts.appendChild(btn("Save block", "", function () {
          try { var c = Object.assign({}, b.content || {}, form.read()); run(db.from("course_blocks").update({ content: c }).eq("id", b.id)).then(function () { toast("Saved."); viewLesson(l.id); }).catch(fail); } catch (e) { fail(e); }
        }));
        acts.appendChild(btn(b.published ? "Hide" : "Show", "alt", function () { run(db.from("course_blocks").update({ published: !b.published }).eq("id", b.id)).then(function () { viewLesson(l.id); }).catch(fail); }));
        acts.appendChild(btn("▲ Up", "alt small", function () { reorder("course_blocks", blocks, bi, -1, function () { viewLesson(l.id); }); }));
        acts.appendChild(btn("▼ Down", "alt small", function () { reorder("course_blocks", blocks, bi, 1, function () { viewLesson(l.id); }); }));
        acts.appendChild(btn("Delete", "danger small", function () { confirmDo("Delete this block?", function () { run(db.from("course_blocks").delete().eq("id", b.id)).then(function () { viewLesson(l.id); }).catch(fail); }); }));
        body.appendChild(acts); d.appendChild(body);
        return d;
      }
    }

    // ---------- quiz ----------
    var QTYPES = [["multiple_choice", "One correct answer"], ["multi_select", "Several correct answers"], ["true_false", "True or false"]];
    function viewQuiz(id) {
      page("Quiz", "");
      run(db.from("course_quizzes").select("*").eq("id", id).single()).then(function (q) {
        return Promise.all([
          run(db.from("course_questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true })),
          q.module_id ? run(db.from("course_modules").select("id,title,course_id").eq("id", q.module_id).single()) : null
        ]).then(function (r) {
          var qs = (r[0] || []).sort(byOrder), qids = qs.map(function (x) { return x.id; });
          return (qids.length ? run(db.from("course_question_options").select("*").in("question_id", qids)) : Promise.resolve([])).then(function (opts) { drawQuiz(q, qs, opts || [], r[1]); });
        });
      }).catch(fail);

      function drawQuiz(q, qs, opts, mod) {
        var back = mod ? "#/c/" + mod.course_id : (q.course_id ? "#/c/" + q.course_id : "#/");
        page(q.kind === "final" ? "Final test" : "Module quiz", '<a href="' + esc(back) + '">← Back to the course</a>' + (mod ? " · " + esc(mod.title) : ""));
        var set = el("div", "ce-card");
        var form = buildForm([
          { k: "kind", l: "Kind", kind: "select", options: [["review", "Quick review (shows the answers, can retry)"], ["final", "Final test (graded)"], ["practice", "Practice"]] },
          { k: "graded", l: "Graded (counts towards the pass mark)", kind: "bool" },
          { k: "pass_mark_percent", l: "Pass mark (%)", kind: "num" },
          { k: "max_attempts", l: "Most attempts allowed (blank = unlimited)", kind: "num" },
          { k: "shuffle_questions", l: "Mix up the question order", kind: "bool" },
          { k: "shuffle_options", l: "Mix up the answer order", kind: "bool" },
          { k: "published", l: "Live", kind: "bool" }], q);
        set.appendChild(form.node);
        var r1 = el("div", "ce-row");
        r1.appendChild(btn("Save", "", function () { try { run(db.from("course_quizzes").update(form.read()).eq("id", q.id)).then(function () { toast("Saved."); }).catch(fail); } catch (e) { fail(e); } }));
        r1.appendChild(btn("Delete quiz", "danger", function () { confirmDo("Delete this quiz?", function () { run(db.from("course_quizzes").delete().eq("id", q.id)).then(function () { location.hash = back; }).catch(fail); }); }));
        set.appendChild(r1);
        set.appendChild(el("p", "ce-muted", "Quiz id (for a “Quiz button” block): " + esc(q.id)));
        root.appendChild(set);

        root.appendChild(el("h2", "", "Questions"));
        qs.forEach(function (qq, qi) { root.appendChild(questionCard(q, qq, qi, qs, opts.filter(function (o) { return o.question_id === qq.id; }).sort(byOrder))); });
        var add = el("div", "ce-card ce-row");
        add.appendChild(btn("Add a question", "", function () {
          run(db.from("course_questions").insert({ quiz_id: q.id, type: "multiple_choice", prompt: "New question", points: 1, order_index: nextOrder(qs) }).select("id").single()).then(function (d) {
            return run(db.from("course_question_options").insert([{ question_id: d.id, option_text: "Answer 1", is_correct: true, order_index: 0 }, { question_id: d.id, option_text: "Answer 2", is_correct: false, order_index: 1 }]));
          }).then(function () { viewQuiz(q.id); }).catch(fail);
        }));
        root.appendChild(add);
      }

      function questionCard(q, qq, qi, qs, opts) {
        var d = el("details", "ce-block"); d.open = false;
        var sum = el("summary", ""); sum.appendChild(el("span", "ce-type", "Q" + (qi + 1))); sum.appendChild(el("span", "ce-prev", esc(qq.prompt))); d.appendChild(sum);
        var body = el("div", "ce-body");
        var form = buildForm([{ k: "type", l: "Type", kind: "select", options: QTYPES }, { k: "prompt", l: "Question", kind: "area" }, { k: "explanation", l: "Why this is the answer (shown after, optional)", kind: "area" }, { k: "points", l: "Points", kind: "num" }], qq);
        body.appendChild(form.node);
        body.appendChild(el("p", "ce-muted", "Answers: tick the correct one(s)."));
        var list = el("div"), rows = [];
        function addOpt(o) {
          var r = el("div", "ce-opt"), cb = el("input"); cb.type = "checkbox"; cb.checked = !!o.is_correct;
          var tx = el("input"); tx.type = "text"; tx.className = "ce-in"; tx.value = o.option_text || "";
          var rm = btn("✕", "danger small", function () { rows.splice(rows.indexOf(item), 1); list.removeChild(r); });
          r.appendChild(cb); r.appendChild(tx); r.appendChild(rm); list.appendChild(r);
          var item = { id: o.id, cb: cb, tx: tx }; rows.push(item);
        }
        opts.forEach(addOpt); body.appendChild(list);
        var acts = el("div", "ce-row");
        acts.appendChild(btn("Add an answer", "alt small", function () { addOpt({ option_text: "", is_correct: false }); }));
        acts.appendChild(btn("Save question", "", function () {
          try {
            var o = form.read(); if (!o.prompt) throw new Error("The question needs words.");
            var keep = rows.filter(function (r) { return r.tx.value.trim(); });
            if (keep.length < 2) throw new Error("Give at least two answers.");
            var nCorrect = keep.filter(function (r) { return r.cb.checked; }).length;
            if (nCorrect < 1) throw new Error("Tick at least one correct answer.");
            if (o.type !== "multi_select" && nCorrect > 1) throw new Error("This type has only one correct answer. Choose 'Several correct answers' or untick extras.");
            var keepIds = keep.filter(function (r) { return r.id; }).map(function (r) { return r.id; });
            var removed = opts.filter(function (x) { return keepIds.indexOf(x.id) < 0; }).map(function (x) { return x.id; });
            var ops = [run(db.from("course_questions").update(o).eq("id", qq.id))];
            if (removed.length) ops.push(run(db.from("course_question_options").delete().in("id", removed)));
            keep.forEach(function (r, n) {
              var row = { option_text: r.tx.value.trim(), is_correct: r.cb.checked, order_index: n };
              ops.push(r.id ? run(db.from("course_question_options").update(row).eq("id", r.id)) : run(db.from("course_question_options").insert(Object.assign({ question_id: qq.id }, row))));
            });
            Promise.all(ops).then(function () { toast("Saved."); viewQuiz(q.id); }).catch(fail);
          } catch (e) { fail(e); }
        }));
        acts.appendChild(btn("▲", "alt small", function () { reorder("course_questions", qs, qi, -1, function () { viewQuiz(q.id); }); }));
        acts.appendChild(btn("▼", "alt small", function () { reorder("course_questions", qs, qi, 1, function () { viewQuiz(q.id); }); }));
        acts.appendChild(btn("Delete", "danger small", function () { confirmDo("Delete this question?", function () { run(db.from("course_questions").delete().eq("id", qq.id)).then(function () { viewQuiz(q.id); }).catch(fail); }); }));
        body.appendChild(acts); d.appendChild(body);
        return d;
      }
    }

    // ---------- questions inbox, reviews, feedback ----------
    function viewInbox() {
      page("Questions and reviews", '<a href="#/">← All courses</a>');
      Promise.all([
        run(db.from("course_questions_inbox").select("*").order("created_at", { ascending: false })),
        run(db.from("course_reviews").select("*").order("created_at", { ascending: false })),
        run(db.from("course_lesson_feedback").select("lesson_id,clear")),
        run(db.from("course_lessons").select("id,title"))
      ]).then(function (r) {
        var qs = r[0] || [], revs = r[1] || [], fb = r[2] || [], lessons = {}; (r[3] || []).forEach(function (l) { lessons[l.id] = l.title; });
        root.appendChild(el("h2", "", "Questions from learners"));
        if (!qs.length) root.appendChild(el("p", "ce-muted", "No questions yet."));
        qs.forEach(function (x) {
          var card = el("div", "ce-card");
          card.appendChild(el("p", "", "<strong>" + esc(x.body) + "</strong><br><span class='ce-muted'>Lesson: " + esc(lessons[x.lesson_id] || "?") + " · " + esc(new Date(x.created_at).toLocaleDateString()) + " · " + esc(x.status) + "</span>"));
          var ta = el("textarea", "ce-in"); ta.placeholder = "Your answer"; ta.value = x.answer || ""; card.appendChild(ta);
          var acts = el("div", "ce-row");
          function saveAnswer(status, extra) {
            if (!ta.value.trim()) return toast("Write the answer first.", true);
            db.auth.getUser().then(function (u) {
              var uid = u && u.data && u.data.user ? u.data.user.id : null;
              return run(db.from("course_questions_inbox").update({ answer: ta.value.trim(), status: status, answered_by: uid }).eq("id", x.id));
            }).then(function () { return extra ? extra() : null; }).then(function () { toast("Saved."); viewInbox(); }).catch(fail);
          }
          acts.appendChild(btn("Save answer", "", function () { saveAnswer("answered"); }));
          acts.appendChild(btn("Save and publish as a FAQ on the lesson", "alt", function () {
            saveAnswer("published_faq", function () { return run(db.from("course_lesson_faqs").insert({ lesson_id: x.lesson_id, question: x.body, answer: ta.value.trim(), published: true })); });
          }));
          card.appendChild(acts); root.appendChild(card);
        });
        root.appendChild(el("h2", "", "Reviews"));
        if (!revs.length) root.appendChild(el("p", "ce-muted", "No reviews yet."));
        revs.forEach(function (x) {
          var card = el("div", "ce-card ce-row grow");
          card.appendChild(el("div", "", "<strong>" + "★".repeat(x.rating) + "</strong><br>" + esc(x.worked || "") + "<br><span class='ce-muted'>" + esc(x.improve || "") + "</span>"));
          card.appendChild(btn(x.publishable ? "Stop showing publicly" : "Show publicly", "alt small", function () { run(db.from("course_reviews").update({ publishable: !x.publishable }).eq("id", x.id)).then(viewInbox).catch(fail); }));
          root.appendChild(card);
        });
        root.appendChild(el("h2", "", "“Was this clear?” by lesson"));
        var tally = {}; fb.forEach(function (f) { var t = tally[f.lesson_id] || (tally[f.lesson_id] = { y: 0, n: 0 }); if (f.clear) t.y++; else t.n++; });
        var ids = Object.keys(tally); if (!ids.length) root.appendChild(el("p", "ce-muted", "No feedback yet."));
        ids.sort(function (a, b) { return tally[b].n - tally[a].n; }).forEach(function (lid) { root.appendChild(el("p", "", esc(lessons[lid] || "?") + ": clear " + tally[lid].y + ", not clear " + tally[lid].n)); });
      }).catch(fail);
    }

    // ---------- import ----------
    var IMPORT_HELP = '{\n  "course": { "title": "…", "subtitle": "…", "description": "…", "visibility": "public", "level": "beginner" },\n  "modules": [ { "title": "…", "intro_text": "…", "lessons": [ { "title": "…", "est_minutes": 4, "blocks": [ { "type": "text", "content": { "text": "…" } } ] } ],\n     "quiz": { "kind": "review", "questions": [ { "type": "multiple_choice", "prompt": "…", "explanation": "…", "options": [ { "text": "…", "correct": true }, { "text": "…" } ] } ] } } ]\n}';
    function countPlan(p) {
      var n = { modules: 0, lessons: 0, blocks: 0, quizzes: 0, questions: 0, quotes: 0, unverified: 0 };
      (p.modules || []).forEach(function (m) {
        n.modules++;
        (m.lessons || []).forEach(function (l) { n.lessons++; (l.blocks || []).forEach(function (b) { n.blocks++; if (b.type === "quote") { n.quotes++; if (!(b.content && b.content.verified === true)) n.unverified++; } }); });
        if (m.quiz) { n.quizzes++; n.questions += (m.quiz.questions || []).length; }
      });
      if (p.final_test) { n.quizzes++; n.questions += (p.final_test.questions || []).length; }
      return n;
    }
    function validatePlan(p) {
      if (!p || typeof p !== "object") throw new Error("This is not a course file.");
      if (!p.course || !p.course.title) throw new Error("The file needs course.title.");
      if (!Array.isArray(p.modules) || !p.modules.length) throw new Error("The file needs a list of modules.");
      var ok = Object.keys(BLOCKS);
      p.modules.forEach(function (m, mi) {
        if (!m.title) throw new Error("Module " + (mi + 1) + " needs a title.");
        (m.lessons || []).forEach(function (l, li) {
          if (!l.title) throw new Error("Module " + (mi + 1) + ", lesson " + (li + 1) + " needs a title.");
          (l.blocks || []).forEach(function (b, bi) { if (ok.indexOf(b.type) < 0) throw new Error("Module " + (mi + 1) + ", lesson " + (li + 1) + ", block " + (bi + 1) + ": unknown type '" + b.type + "'."); });
        });
        [m.quiz].concat(mi === 0 ? [p.final_test] : []).forEach(function (qz) {
          if (!qz) return;
          (qz.questions || []).forEach(function (q, qi) {
            var os = q.options || [];
            if (os.length < 2 || !os.some(function (o) { return o.correct; })) throw new Error("A quiz question (" + (q.prompt || qi + 1) + ") needs two answers and one marked correct.");
          });
        });
      });
    }
    function importQuiz(base, qz, out) {
      return run(db.from("course_quizzes").insert(Object.assign({ kind: "review", graded: false, published: false }, base, { kind: qz.kind || base.kind || "review", pass_mark_percent: qz.pass_mark_percent || 70 })).select("id").single()).then(function (row) {
        var chain = Promise.resolve();
        (qz.questions || []).forEach(function (q, qi) {
          chain = chain.then(function () {
            return run(db.from("course_questions").insert({ quiz_id: row.id, type: q.type || "multiple_choice", prompt: q.prompt, explanation: q.explanation || null, points: q.points || 1, order_index: qi }).select("id").single()).then(function (qr) {
              return run(db.from("course_question_options").insert((q.options || []).map(function (o, oi) { return { question_id: qr.id, option_text: o.text, is_correct: !!o.correct, order_index: oi }; })));
            });
          });
        });
        return chain.then(function () { out.quizzes++; });
      });
    }
    function viewImport() {
      page("Import a course", '<a href="#/">← All courses</a>');
      var card = el("div", "ce-card");
      card.appendChild(el("p", "ce-muted", "Paste a course file (JSON) or choose one. Everything is created HIDDEN, so you can look it over first. Quotes only show learners once they are marked verified."));
      var file = el("input"); file.type = "file"; file.accept = ".json,application/json"; card.appendChild(file);
      var ta = el("textarea", "ce-in ce-code"); ta.placeholder = IMPORT_HELP; card.appendChild(ta);
      file.addEventListener("change", function () { var f = file.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { ta.value = r.result; }; r.readAsText(f); });
      var status = el("p", "ce-muted"); var go = btn("Check the file", "", function () {
        var plan; try { plan = JSON.parse(ta.value); validatePlan(plan); } catch (e) { return fail(e); }
        var n = countPlan(plan);
        status.innerHTML = "This will create the course <strong>" + esc(plan.course.title) + "</strong> with " + n.modules + " modules, " + n.lessons + " lessons, " + n.blocks + " blocks (" + n.quotes + " quotes, " + n.unverified + " not verified), " + n.quizzes + " quizzes and " + n.questions + " questions. All hidden.";
        var confirmBtn = btn("Create it now", "", function (b) {
          b.disabled = true; doImport(plan, status);
        });
        status.appendChild(el("br")); status.appendChild(confirmBtn);
      });
      card.appendChild(el("div", "ce-row")); card.lastChild.appendChild(go); card.appendChild(status); root.appendChild(card);
    }
    function doImport(plan, status) {
      var out = { quizzes: 0 }, courseId = null;
      function say(t) { status.textContent = t; }
      var cf = Object.assign({ visibility: "public" }, plan.course, { published: false });
      say("Creating the course…");
      run(db.from("courses").insert(cf).select("id").single()).then(function (c) {
        courseId = c.id; var chain = Promise.resolve();
        plan.modules.forEach(function (m, mi) {
          chain = chain.then(function () {
            say("Module " + (mi + 1) + " of " + plan.modules.length + "…");
            return run(db.from("course_modules").insert({ course_id: courseId, title: m.title, intro_text: m.intro_text || null, order_index: mi, published: false }).select("id").single()).then(function (mr) {
              var lc = Promise.resolve();
              (m.lessons || []).forEach(function (l, li) {
                lc = lc.then(function () {
                  return run(db.from("course_lessons").insert({ module_id: mr.id, title: l.title, est_minutes: l.est_minutes || null, order_index: li, published: false }).select("id").single()).then(function (lr) {
                    var rows = (l.blocks || []).map(function (b, bi) { return { lesson_id: lr.id, type: b.type, content: b.content || {}, order_index: bi, published: true }; });
                    return rows.length ? run(db.from("course_blocks").insert(rows)) : null;
                  });
                });
              });
              return lc.then(function () { return m.quiz ? importQuiz({ module_id: mr.id }, m.quiz, out) : null; });
            });
          });
        });
        return chain.then(function () { return plan.final_test ? importQuiz({ course_id: courseId, kind: "final", graded: true }, Object.assign({ kind: "final" }, plan.final_test), out) : null; });
      }).then(function () {
        status.innerHTML = "Done. <a href='#/c/" + esc(courseId) + "'>Open the course</a>";
        toast("Imported.");
      }).catch(function (e) {
        fail(e);
        status.innerHTML = "It stopped part-way: " + esc(e.message || "") + (courseId ? " <a href='#/c/" + esc(courseId) + "'>Open what was created</a>, delete the course there, and try again." : "");
      });
    }

    // ---------- router ----------
    function route() {
      var h = location.hash.replace(/^#\/?/, ""), p = h.split("/");
      window.scrollTo(0, 0);
      if (p[0] === "c" && p[1]) return viewCourse(p[1]);
      if (p[0] === "l" && p[1]) return viewLesson(p[1]);
      if (p[0] === "q" && p[1]) return viewQuiz(p[1]);
      if (p[0] === "inbox") return viewInbox();
      if (p[0] === "import") return viewImport();
      viewList();
    }
    window.addEventListener("hashchange", route);
    route();
  });
})();
