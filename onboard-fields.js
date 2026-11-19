// Shared by the register page and the Profile page: the optional "about you" questions.
// render(el, values) draws them; read(el) returns what the person ticked/typed.
(function () {
  "use strict";
  var O = {
    rounds: [["", "Choose one (optional)"], ["not_yet", "Not chanting daily yet"], ["1_3", "1 to 3 rounds"], ["4_8", "4 to 8 rounds"], ["9_15", "9 to 15 rounds"], ["16", "16 rounds"], ["more", "More than 16 rounds"]],
    principles: [["no_meat", "No meat, fish or eggs"], ["no_intoxication", "No intoxication (alcohol, tobacco, drugs)"], ["no_illicit_sex", "No illicit sex"], ["no_gambling", "No gambling"], ["still_learning", "I am still learning about these"], ["prefer_not", "I would rather not say"]],
    why: [["knowledge", "Knowledge and understanding"], ["peace", "Peace of mind"], ["association", "Friends and association"], ["festivals", "Festivals"], ["prasadam", "Prasadam (sanctified food)"], ["kirtan", "Kirtan and music"], ["service", "Service"], ["family", "Family or upbringing"], ["curiosity", "Curiosity"]],
    hope: [["courses", "Courses and learning"], ["calendar", "The Vaishnava calendar and reminders"], ["community", "Community and messages"], ["chanting", "Learning to chant better"], ["service", "Service opportunities"], ["inspiration", "Daily inspiration (quotes)"], ["news", "News of programs and festivals"]],
    movement: [["knowledge", "Clear spiritual knowledge and philosophy"], ["peace", "Peace of mind and a calmer life"], ["guidance", "Spiritual guidance from a teacher or guru"], ["association", "Good friends who share the path"], ["character", "To improve my character and habits"], ["service", "A chance to serve others"], ["meditation", "To learn to chant and meditate well"], ["family", "A better family and home life"], ["scripture", "To understand the Bhagavad-gita and the scriptures"], ["unsure", "I am not sure yet"]],
    commit: [["", "Choose one (optional)"], ["exploring", "Just exploring for now"], ["occasional", "Come to programs and festivals now and then"], ["regular", "Come regularly (weekly programs)"], ["chant", "Chant daily and read a little every day"], ["principles", "Follow the four regulative principles and chant daily rounds"], ["volunteer", "Take up regular service or volunteering"], ["initiation", "Prepare for initiation and a fully devotional life"], ["unsure", "I am not sure yet"]],
    heard: [["", "Choose one (optional)"], "A friend or family member", "A program or festival", "A book", "Social media", "An online search", "A WhatsApp group", "Other"],
    contact: [["", "Choose one (optional)"], ["whatsapp", "WhatsApp"], ["call", "Phone call"], ["email", "Email"], ["any", "Any of these"]]
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var inp = 'style="width:100%;padding:9px;margin-top:4px;border:1px solid var(--line);border-radius:6px;"';
  function checks(name, list, sel) {
    return '<div class="ob-checks">' + list.map(function (o) {
      return '<label class="ob-check"><input type="checkbox" name="' + name + '" value="' + o[0] + '"' + ((sel || []).indexOf(o[0]) >= 0 ? " checked" : "") + '> <span>' + esc(o[1]) + '</span></label>';
    }).join("") + '</div>';
  }
  function select(name, list, val) {
    return '<select name="' + name + '" ' + inp + '>' + list.map(function (o) { var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (v === (val || "") ? " selected" : "") + '>' + esc(l) + '</option>'; }).join("") + '</select>';
  }
  var DEFAULT_ORDER = ["rounds", "principles", "why", "movement_hope", "commitment", "hope", "how_heard", "area", "contact_pref"];
  function render(el, v, qs) {
    v = v || {};
    var hidden = {}, known = {}, rows = (qs && qs.length) ? qs : DEFAULT_ORDER.map(function (k) { return { key: k, active: true }; });
    rows.forEach(function (q) { if (q.key) { known[q.key] = true; if (q.active === false) hidden[q.key] = true; } });
    var B = {
      rounds: '<label class="ob-q ob-noinit">How many rounds do you chant daily?' + select("rounds", O.rounds, v.rounds) + '</label>',
      principles: '<fieldset class="ob-q ob-noinit"><legend>Which of the four regulative principles are part of your life at the moment? <small>Tick any. It is fine to tick none.</small></legend>' + checks("principles", O.principles, v.principles) + '</fieldset>',
      why: '<fieldset class="ob-q"><legend>What brought you to ISKCON? <small>Tick any.</small></legend>' + checks("why", O.why, v.why) +
        '<input name="why_other" maxlength="300" placeholder="Something else (optional)" value="' + esc(v.why_other) + '" ' + inp + '></fieldset>',
      movement_hope: '<fieldset class="ob-q"><legend>What do you hope to gain from the ISKCON movement? <small>Tick any.</small></legend>' + checks("movement_hope", O.movement, v.movement_hope) +
        '<input name="movement_hope_other" maxlength="300" placeholder="Something else (optional)" value="' + esc(v.movement_hope_other) + '" ' + inp + '></fieldset>',
      commitment: '<label class="ob-q">How far would you be willing to commit to the movement?' + select("commitment", O.commit, v.commitment) + '</label>',
      hope: '<fieldset class="ob-q"><legend>What do you hope to gain from this site and app? <small>Tick any.</small></legend>' + checks("hope", O.hope, v.hope) +
        '<input name="hope_other" maxlength="300" placeholder="Something else (optional)" value="' + esc(v.hope_other) + '" ' + inp + '></fieldset>',
      how_heard: '<label class="ob-q">How did you hear about us?' + select("how_heard", O.heard, v.how_heard) + '</label>',
      area: '<label class="ob-q">Where do you stay? <small>(area, e.g. Juja, Kalimoni. Optional)</small><input name="area" maxlength="100" value="' + esc(v.area) + '" ' + inp + '></label>',
      contact_pref: '<label class="ob-q">How should we reach you?' + select("contact_pref", O.contact, v.contact_pref) + '</label>' +
        '<label class="ob-q">Your phone number or email for this <small>(optional)</small><input name="contact_value" maxlength="200" value="' + esc(v.contact_value) + '" ' + inp + '></label>'
    };
    var ans = v.custom || {};
    el.innerHTML = rows.map(function (q) {
      if (q.key) { return (hidden[q.key] || !B[q.key]) ? "" : B[q.key]; }
      if (q.active === false) return "";
      var name = "cq_" + q.id, a = ans[q.id], opts = (q.options || []).map(String);
      if (q.kind === "multi") return '<fieldset class="ob-q"><legend>' + esc(q.label) + ' <small>Tick any.</small></legend>' + checks(name, opts.map(function (o) { return [o, o]; }), Array.isArray(a) ? a : []) + '</fieldset>';
      if (q.kind === "single") return '<label class="ob-q">' + esc(q.label) + select(name, [["", "Choose one (optional)"]].concat(opts), typeof a === "string" ? a : "") + '</label>';
      return '<label class="ob-q">' + esc(q.label) + ' <small>(optional)</small><input name="' + name + '" maxlength="500" value="' + esc(typeof a === "string" ? a : "") + '" ' + inp + '></label>';
    }).join("");
    el.setAttribute("data-custom", JSON.stringify(rows.filter(function (q) { return !q.key && q.active !== false; }).map(function (q) { return { id: q.id, kind: q.kind }; })));
    el.setAttribute("data-initiated", v.initiated ? "1" : "0");
  }
  // The admin-managed questions (and which built-in ones are switched off). Fails quietly: then everything shows as before.
  function questions(c) {
    return c.from("profile_questions").select("*").order("sort", { ascending: true }).order("created_at", { ascending: true })
      .then(function (r) { return (r && !r.error && r.data) || []; }, function () { return []; });
  }
  function read(el) {
    function all(n) { if (!el.querySelector('input[name="' + n + '"]')) return undefined; return Array.prototype.map.call(el.querySelectorAll('input[name="' + n + '"]:checked'), function (c) { return c.value; }); }
    function val(n) { var e = el.querySelector('[name="' + n + '"]'); return e ? e.value.trim() : undefined; }
    var custom = {}; try { JSON.parse((el.hasAttribute("data-custom") ? el : (el.querySelector("[data-custom]") || el)).getAttribute("data-custom") || "[]").forEach(function (q) { custom[q.id] = q.kind === "multi" ? all("cq_" + q.id) : val("cq_" + q.id); }); } catch (e) {}
    return { custom: custom, rounds: val("rounds"), principles: all("principles"), why: all("why"), why_other: val("why_other"), hope: all("hope"), hope_other: val("hope_other"), how_heard: val("how_heard"), area: val("area"), contact_pref: val("contact_pref"), movement_hope: all("movement_hope"), movement_hope_other: val("movement_hope_other"), commitment: val("commitment"), contact_value: val("contact_value") };
  }
  window.ISKCON_ONB = { render: render, read: read, questions: questions, OPTIONS: O };
})();
