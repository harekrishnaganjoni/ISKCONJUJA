// ============================================================
// MEMBER PORTAL: Messages page. Two kinds of conversation:
//   "private": between exactly two members (nobody else can read it, not even admins)
//   "admin"  : between one member and the admins
// The database rules (supabase/message_board_v2.sql) decide who may read and write;
// this page only shows what the database allows.
// ============================================================
(function () {
  "use strict";
  var D = window.ISKCON_DATA, root = document.getElementById("pb");
  if (!root) return;
  if (!D || !D.READY) { root.innerHTML = '<p class="board-note">Messages are not available right now.</p>'; return; }
  var c = D.client, uid = null, myName = null, tab = "private", openId = null, rows = [], notice = "";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function when(t) { var d = new Date(t); return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }

  function load() {
    return c.from("board_messages").select("*").in("visibility", ["private", "admin"])
      .or("author_id.eq." + uid + ",recipient_id.eq." + uid).order("created_at", { ascending: true })
      .then(function (r) { rows = r.data || []; if (r.error) { notice = "Messages are not switched on yet. Please check again soon."; } });
  }

  // group messages into conversations by their first message
  function threads(kind) {
    var byId = {}, rootOf = {}, groups = {};
    rows.forEach(function (m) { byId[m.id] = m; });
    function rootId(m) { var n = 0; while (m.parent_id && byId[m.parent_id] && n++ < 200) m = byId[m.parent_id]; return m.id; }
    rows.forEach(function (m) { if (m.visibility !== kind) return; var r = rootId(m); (groups[r] = groups[r] || []).push(m); });
    return Object.keys(groups).map(function (id) {
      var list = groups[id], first = byId[id] || list[0], last = list[list.length - 1];
      var partner = kind === "admin" ? "The admins" : (first.author_id === uid ? first.recipient_name : first.author_name);
      return { id: id, partner: partner || "Member", list: list, last: last };
    }).sort(function (a, b) { return new Date(b.last.created_at) - new Date(a.last.created_at); });
  }

  function chrome(inner) {
    root.innerHTML =
      '<p class="pb-me">Your name on the board: <strong>' + esc(myName) + '</strong> <button type="button" class="board-reply-toggle" id="pb-rename">Change</button></p>' +
      '<div class="pb-tabs" role="tablist">' +
        '<button type="button" role="tab" data-tab="private" aria-selected="' + (tab === "private") + '">Private messages</button>' +
        '<button type="button" role="tab" data-tab="admin" aria-selected="' + (tab === "admin") + '">Message the admins</button>' +
      '</div>' +
      (notice ? '<p class="board-status" style="color:var(--muted)">' + esc(notice) + '</p>' : '') +
      inner;
    notice = "";
    root.querySelectorAll("[data-tab]").forEach(function (b) { b.addEventListener("click", function () { tab = b.getAttribute("data-tab"); openId = null; render(); }); });
    document.getElementById("pb-rename").addEventListener("click", function () { askName(true); });
  }

  function render() {
    if (openId === "new") return renderNew();
    if (openId) return renderThread();
    var list = threads(tab);
    var intro = tab === "private"
      ? '<p class="board-note">Only you and the person you write to can read these.</p>'
      : '<p class="board-note">Only you and the admins can read these. Admins can see what you write here.</p>';
    chrome(intro +
      '<button type="button" class="button" id="pb-new">' + (tab === "private" ? "+ New private message" : "+ Write to the admins") + '</button>' +
      '<div class="pb-list">' + (list.length ? list.map(function (t) {
        var mine = t.last.author_id === uid;
        return '<button type="button" class="pb-item" data-open="' + t.id + '"><strong>' + esc(t.partner) + '</strong>' +
          '<span class="pb-snip">' + (mine ? "You: " : "") + esc(t.last.body.slice(0, 80)) + '</span><span class="board-date">' + when(t.last.created_at) + '</span></button>';
      }).join("") : '<p class="board-empty">No conversations yet.</p>') + '</div>');
    document.getElementById("pb-new").addEventListener("click", function () { openId = "new"; render(); });
    root.querySelectorAll("[data-open]").forEach(function (b) { b.addEventListener("click", function () { openId = b.getAttribute("data-open"); render(); }); });
  }

  function renderThread() {
    var t = threads(tab).filter(function (x) { return x.id === openId; })[0];
    if (!t) { openId = null; return render(); }
    chrome('<button type="button" class="board-reply-toggle" id="pb-back" style="margin:0 0 10px">&larr; Back</button>' +
      '<h3 style="margin:0 0 10px">' + esc(t.partner) + '</h3>' +
      '<div class="pb-thread">' + t.list.map(function (m) {
        var mine = m.author_id === uid;
        return '<div class="pb-bubble ' + (mine ? "mine" : "theirs") + '"><strong>' + (mine ? "You" : esc(m.author_name)) + (m.author_kind === "admin" ? ' <span class="board-badge board-badge-admin">Admin</span>' : '') + '</strong>' +
          '<p class="board-body">' + esc(m.body) + '</p><span class="board-date">' + when(m.created_at) + '</span></div>';
      }).join("") + '</div>' +
      '<form id="pb-reply" class="board-reply-form"><textarea name="body" maxlength="2000" required placeholder="Write a reply..."></textarea>' +
      '<button class="button" type="submit">Send</button><p class="board-status" id="pb-st"></p></form>');
    document.getElementById("pb-back").addEventListener("click", function () { openId = null; render(); });
    document.getElementById("pb-reply").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, body = f.elements.body.value.trim(); if (!body) return;
      var last = t.list[t.list.length - 1];
      f.querySelector("button").disabled = true;
      send({ body: body, parent_id: last.id, visibility: tab, author_name: myName }, "pb-st");
    });
    var th = root.querySelector(".pb-thread"); if (th) th.scrollTop = th.scrollHeight;
  }

  function renderNew() {
    chrome('<button type="button" class="board-reply-toggle" id="pb-back" style="margin:0 0 10px">&larr; Back</button>' +
      '<form id="pb-newform" class="board-reply-form">' +
      (tab === "private" ? '<label class="board-note" for="pb-to">Who is it for?</label><select id="pb-to" required><option value="">Loading names...</option></select>' : '<h3 style="margin:0">Write to the admins</h3>') +
      '<textarea name="body" maxlength="2000" required placeholder="Write your message..."></textarea>' +
      '<button class="button" type="submit">Send</button><p class="board-status" id="pb-st"></p></form>');
    document.getElementById("pb-back").addEventListener("click", function () { openId = null; render(); });
    var sel = document.getElementById("pb-to");
    if (sel) c.rpc("board_directory").then(function (r) {
      var list = r.data || [];
      sel.innerHTML = list.length ? '<option value="">Choose a member</option>' + list.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>'; }).join("")
        : '<option value="">No other member has chosen a name yet</option>';
    });
    document.getElementById("pb-newform").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, body = f.elements.body.value.trim(); if (!body) return;
      var row = { body: body, visibility: tab, author_name: myName };
      if (tab === "private") { if (!sel.value) { document.getElementById("pb-st").textContent = "Please choose who it is for."; return; } row.recipient_id = sel.value; }
      f.querySelector("button").disabled = true;
      send(row, "pb-st");
    });
  }

  function send(row, statusId) {
    c.from("board_messages").insert(row).then(function (r) {
      if (r.error) { var s = document.getElementById(statusId); if (s) { s.textContent = r.error.message; s.style.color = "#b33a2e"; } var b = root.querySelector("form button"); if (b) b.disabled = false; return; }
      load().then(function () {
        if (openId === "new") { var t = threads(tab)[0]; openId = t ? t.id : null; }
        notice = "Sent."; render();
      });
    });
  }

  function askName(change) {
    root.innerHTML = '<form id="pb-name" class="board-reply-form" style="max-width:420px"><h3 style="margin:0">' + (change ? "Change your name" : "Choose your name for the board") + '</h3>' +
      '<p class="board-note">This is the name other members see in messages and in the list of people they can write to. Some names (like Admin) are reserved.</p>' +
      '<input type="text" name="n" maxlength="40" required value="' + esc(myName || "") + '" placeholder="Your name"><button class="button" type="submit">Save name</button>' +
      (change ? '<button class="button secondary" type="button" id="pb-cancel">Cancel</button>' : '') + '<p class="board-status" id="pb-st"></p></form>';
    var cancel = document.getElementById("pb-cancel"); if (cancel) cancel.addEventListener("click", render);
    document.getElementById("pb-name").addEventListener("submit", function (e) {
      e.preventDefault();
      c.rpc("set_my_display_name", { n: e.target.elements.n.value }).then(function (r) {
        if (r.error) { var s = document.getElementById("pb-st"); s.textContent = r.error.message; s.style.color = "#b33a2e"; return; }
        myName = e.target.elements.n.value.trim().replace(/\s+/g, " "); load().then(render);
      });
    });
  }

  D.getSessionAndRole().then(function (r) {
    if (!r || !r.session) return;
    uid = r.session.user.id;
    c.from("profiles").select("display_name").eq("id", uid).maybeSingle().then(function (p) {
      myName = p.data && p.data.display_name;
      if (!myName) return askName(false);
      load().then(render);
    });
  });
})();
