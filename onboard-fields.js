// Shared by the register page and the Profile page: the optional "about you" questions.
// render(el, values) draws them; read(el) returns what the person ticked/typed.
(function () {
  "use strict";
  var O = {
    rounds: [["", "Choose one (optional)"], ["not_yet", "Not chanting daily yet"], ["1_3", "1 to 3 rounds"], ["4_8", "4 to 8 rounds"], ["9_15", "9 to 15 rounds"], ["16", "16 rounds"], ["more", "More than 16 rounds"]],
    principles: [["no_meat", "No meat, fish or eggs"], ["no_intoxication", "No intoxication (alcohol, tobacco, drugs)"], ["no_illicit_sex", "No illicit sex"], ["no_gambling", "No gambling"], ["still_learning", "I am still learning about these"], ["prefer_not", "I would rather not say"]],
    why: [["knowledge", "Knowledge and understanding"], ["peace", "Peace of mind"], ["association", "Friends and association"], ["festivals", "Festivals"], ["prasadam", "Prasadam (sanctified food)"], ["kirtan", "Kirtan and music"], ["service", "Service"], ["family", "Family or upbringing"], ["curiosity", "Curiosity"]],
    hope: [["courses", "Courses and learning"], ["calendar", "The Vaishnava calendar and reminders"], ["community", "Community and messages"], ["chanting", "Learning to chant better"], ["service", "Service opportunities"], ["inspiration", "Daily inspiration (quotes)"], ["news", "News of programs and festivals"]],
    heard: [["", "Choose one (optional)"], "A friend or family member", "A program or festival", "Social media", "An online search", "A WhatsApp group", "Other"],
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
  function render(el, v) {
    v = v || {};
    el.innerHTML =
      '<label class="ob-q">How many rounds do you chant daily?' + select("rounds", O.rounds, v.rounds) + '</label>' +
      '<fieldset class="ob-q"><legend>Which of the four regulative principles are part of your life at the moment? <small>Tick any. It is fine to tick none.</small></legend>' + checks("principles", O.principles, v.principles) + '</fieldset>' +
      '<fieldset class="ob-q"><legend>What brought you to ISKCON? <small>Tick any.</small></legend>' + checks("why", O.why, v.why) +
        '<input name="why_other" maxlength="300" placeholder="Something else (optional)" value="' + esc(v.why_other) + '" ' + inp + '></fieldset>' +
      '<fieldset class="ob-q"><legend>What do you hope to gain from this site and app? <small>Tick any.</small></legend>' + checks("hope", O.hope, v.hope) +
        '<input name="hope_other" maxlength="300" placeholder="Something else (optional)" value="' + esc(v.hope_other) + '" ' + inp + '></fieldset>' +
      '<label class="ob-q">How did you hear about us?' + select("how_heard", O.heard, v.how_heard) + '</label>' +
      '<label class="ob-q">Where do you stay? <small>(area, e.g. Juja, Kalimoni. Optional)</small><input name="area" maxlength="100" value="' + esc(v.area) + '" ' + inp + '></label>' +
      '<label class="ob-q">How should we reach you?' + select("contact_pref", O.contact, v.contact_pref) + '</label>';
  }
  function read(el) {
    function all(n) { return Array.prototype.map.call(el.querySelectorAll('input[name="' + n + '"]:checked'), function (c) { return c.value; }); }
    function val(n) { var e = el.querySelector('[name="' + n + '"]'); return e ? e.value.trim() : ""; }
    return { rounds: val("rounds"), principles: all("principles"), why: all("why"), why_other: val("why_other"), hope: all("hope"), hope_other: val("hope_other"), how_heard: val("how_heard"), area: val("area"), contact_pref: val("contact_pref") };
  }
  window.ISKCON_ONB = { render: render, read: read, OPTIONS: O };
})();
