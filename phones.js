// One list of phone numbers for everything the admin prints (business card, fliers, pamphlets).
// Every number has its own name; removing a number removes its name too. A number without a name is never printed.
window.PHONES = (function () {
  "use strict";
  var KEY = "bc_phones", list = null, hooks = [], boxes = [];
  function nice(raw) { var d = String(raw || "").replace(/\D/g, ""); if (d.charAt(0) === "0") d = "254" + d.slice(1); return d.length === 12 ? "+" + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6, 9) + " " + d.slice(9) : String(raw || ""); }
  function defaults() { var pr = (window.ISKCON && window.ISKCON.WHATSAPP_PRIMARY) || ""; return [{ phone: pr ? "0" + pr.slice(3) : "", name: "Tim" }, { phone: "0743184998", name: "Dan" }]; }
  function all() {
    if (list) return list;
    try { var j = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(j)) list = j; } catch (e) {}
    if (!list) list = defaults();
    return list;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(all())); } catch (e) {} }
  function ready() { return all().filter(function (p) { return p.phone && p.name; }); }
  // "+254 714 211 692 (Tim)" for every number that has a name
  function lines(esc) { esc = esc || function (x) { return x; }; return ready().map(function (p) { return esc(nice(p.phone) + " (" + p.name + ")"); }); }
  function changed(origin) { hooks.forEach(function (h) { h(); }); boxes.forEach(function (b) { if (b !== origin) b.draw(); }); }
  function onChange(fn) { hooks.push(fn); }
  // Builds the editor (rows + "add" button) inside `el`.
  function mount(el) {
    var rows = document.createElement("div"), warn = document.createElement("p"), add = document.createElement("button"), head = document.createElement("p");
    head.style.cssText = "font-size:12px;font-weight:700;margin:0 0 6px;"; head.textContent = "Phone numbers (each number has its own name; remove a number and its name goes with it)";
    rows.style.cssText = "display:flex;flex-direction:column;gap:6px;";
    warn.style.cssText = "font-size:12px;color:#b33a2e;margin:6px 0 0;";
    add.type = "button"; add.className = "button secondary"; add.textContent = "+ Add a phone number"; add.style.cssText = "margin-top:8px;font-size:12px;padding:5px 12px;min-height:auto;";
    el.innerHTML = ""; el.appendChild(head); el.appendChild(rows); el.appendChild(add); el.appendChild(warn);
    var box = { draw: draw };
    function check() { var bad = all().filter(function (p) { return p.phone && !p.name; }).length; warn.textContent = bad ? "Give every number a name. A number without a name is left off." : ""; }
    function draw() {
      rows.innerHTML = "";
      all().forEach(function (p, i) {
        var row = document.createElement("div"); row.style.cssText = "display:grid;grid-template-columns:1fr 1fr auto;gap:6px;";
        row.innerHTML = '<input placeholder="Phone number" maxlength="20" style="padding:7px;border:1px solid var(--line);border-radius:4px;"><input placeholder="Name (needed)" maxlength="40" style="padding:7px;border:1px solid var(--line);border-radius:4px;"><button type="button" class="button secondary" title="Remove this number and its name" style="padding:4px 10px;min-height:auto;">&#10005;</button>';
        var ins = row.querySelectorAll("input"); ins[0].value = p.phone; ins[1].value = p.name;
        ins[0].addEventListener("input", function () { p.phone = ins[0].value.trim(); save(); check(); changed(box); });
        ins[1].addEventListener("input", function () { p.name = ins[1].value.trim(); save(); check(); changed(box); });
        row.querySelector("button").addEventListener("click", function () { all().splice(i, 1); save(); draw(); changed(box); });
        rows.appendChild(row);
      });
      check();
    }
    add.addEventListener("click", function () { all().push({ phone: "", name: "" }); save(); draw(); });
    boxes.push(box); draw();
  }
  return { nice: nice, all: all, ready: ready, lines: lines, mount: mount, onChange: onChange };
})();
