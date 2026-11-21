// ISKCON JUJA phone reminders: runs by itself every 15 minutes (see "triggers" in wrangler.jsonc).
// It reads what each member chose (reminder_prefs), which phones are switched on (reminder_devices), the events, the weekly
// programs, the Vaishnava calendar and the members' own dates, and sends each reminder once, at the right time (Nairobi time).
// Every other request is simply passed on to the website's files, so the site works exactly as before.
import "./shim.js";
import "../plain.js";
import "../gcal.js";
import "../evdate.js";
import { sendPush } from "./push.js";

const HOUR = 3600000;
const DEF = { ev_eve: true, ev_hours: true, ev_hours_n: 3, fast_eve: true, fest_eve: false, fest_day: true, own_eve: true, own_day: true };
const MAX_DEVICE_SENDS = 35;      // free Cloudflare plan allows 50 outgoing calls per run; what is left over goes out in the next run (15 min later)
const SITE = "https://iskconjuja.co.ke";

const pad = (n) => (n < 10 ? "0" : "") + n;
const nairobiIso = (ms) => new Date(ms + 3 * HOUR).toISOString().slice(0, 10);
const addDaysIso = (s, n) => new Date(Date.parse(s + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const atMs = (iso, hhmm) => Date.parse(iso + "T" + hhmm + ":00Z") - 3 * HOUR;       // a Nairobi clock time as a real moment
const parseIso = (s) => { const p = s.split("-"); return { y: +p[0], m: +p[1], d: +p[2] }; };
const isoOf = (d) => d.y + "-" + pad(d.m) + "-" + pad(d.d);
const plain = (t) => window.PLAIN(t);
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayOf = (iso) => WD[new Date(iso + "T00:00:00Z").getUTCDay()];
const hhmm = (t) => String(t || "").slice(0, 5);

// ---------- database (Supabase REST, with the service key that only this worker holds) ----------
function db(env) {
  const base = env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/";
  const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_KEY, "Content-Type": "application/json" };
  return {
    async get(path) { const r = await fetch(base + path, { headers: H }); if (!r.ok) throw new Error(path.split("?")[0] + " " + r.status); return r.json(); },
    async post(path, body, prefer) { return fetch(base + path, { method: "POST", headers: Object.assign({}, H, prefer ? { Prefer: prefer } : {}), body: JSON.stringify(body) }); },
    async del(path) { return fetch(base + path, { method: "DELETE", headers: H }); }
  };
}

// ---------- what could be sent, from every source ----------
// A candidate: { cat, key, at, until, title, body, url, only?: userId, startMs? }
async function gather(env, now, d) {
  const G = window.ISKCON_GCAL, EVD = window.EVD, out = [];
  const today = nairobiIso(now), tomorrow = addDaysIso(today, 1);

  // special events (repeats are moved to their next date by the same code the website uses)
  const evs = await d.get("events?select=*&published=eq.true&limit=500");
  const res = await EVD.resolve(evs, today);
  for (const e of res) {
    if (e._past || !e.start_date || e.start_date < today) continue;
    const startMs = e.start_time ? atMs(e.start_date, hhmm(e.start_time)) : null;
    const when = e.start_time ? " at " + hhmm(e.start_time) : "";
    out.push({ cat: "ev_eve", key: "ev:" + e.id + ":" + e.start_date + ":eve", at: atMs(addDaysIso(e.start_date, -1), "18:00"), until: HOUR * 4, title: plain(e.title), body: "Tomorrow" + when + ". Hare Krishna, we hope to see you!", url: "/events.html" });
    if (startMs) out.push({ cat: "ev_hours", key: "ev:" + e.id + ":" + e.start_date + ":h", startMs, title: plain(e.title), bodyFor: (n) => "Starts in " + n + (n > 1 ? " hours" : " hour") + " (" + hhmm(e.start_time) + "). Hare Krishna!", url: "/events.html" });
  }

  // weekly programs (Tuesday, Friday, ...)
  const progs = await d.get("programs?select=*&published=eq.true&limit=100");
  for (const p of progs) {
    for (let i = 0; i <= 2; i++) {
      const date = addDaysIso(today, i), wd = new Date(date + "T00:00:00Z").getUTCDay();
      if (wd !== p.weekday) continue;
      const name = "Juja " + plain(p.title) + (/program/i.test(p.title) ? "" : " program"), start = hhmm(p.start_time);
      out.push({ cat: "ev_eve", key: "pr:" + p.id + ":" + date + ":eve", at: atMs(addDaysIso(date, -1), "18:00"), until: HOUR * 4, title: name, body: "Tomorrow at " + start + (p.place ? ", " + plain(p.place) : "") + ". Music, a talk and a free vegetarian feast.", url: "/events.html" });
      out.push({ cat: "ev_hours", key: "pr:" + p.id + ":" + date + ":h", startMs: atMs(date, start), title: name, bodyFor: (n) => "Starts in " + n + (n > 1 ? " hours" : " hour") + " (" + start + ")" + (p.place ? ", " + plain(p.place) : "") + ".", url: "/events.html" });
    }
  }

  // Vaishnava calendar: fasts (with the time to break the fast) and festivals / acharya days
  const days = await G.range(parseIso(today), 4);
  days.forEach((v, i) => {
    const date = isoOf(v.date), wd = weekdayOf(date);
    if (v.fast) {
      const nx = days[i + 1], par = nx && nx.parana;
      const brk = par ? " Break the fast " + G.hm(par.from) + (par.to >= 0 ? " to " + G.hm(par.to) : " onwards") + " on " + weekdayOf(isoOf(nx.date)) + "." : "";
      out.push({ cat: "fast_eve", key: "fast:" + date, at: atMs(addDaysIso(date, -1), "18:00"), until: HOUR * 4, title: "Tomorrow: " + plain(v.ekadasi || "a fasting day"), body: "A fast on " + wd + "." + brk, url: "/calendar.html" });
    }
    const fests = (v.events || []).filter((t) => t && !/^(Fasting|Break fast)/.test(t));
    if (fests.length) {
      const names = plain(fests.join(", "));
      out.push({ cat: "fest_eve", key: "fest:" + date + ":eve", at: atMs(addDaysIso(date, -1), "18:00"), until: HOUR * 4, title: "Tomorrow: " + names, body: "Hare Krishna! " + wd + ".", url: "/calendar.html" });
      out.push({ cat: "fest_day", key: "fest:" + date + ":day", at: atMs(date, "06:30"), until: HOUR * 4, title: "Today: " + names, body: "Hare Krishna! Have a blessed day.", url: "/calendar.html" });
    }
  });

  // members' own dates (birthday, initiation, anniversary): the next date by the Vaishnava calendar
  const ms = await d.get("member_milestones?select=id,user_id,kind,title,event_date&remind=eq.true&limit=5000");
  const cache = {};
  for (const m of ms) {
    try {
      const k = m.event_date;
      if (!cache[k]) cache[k] = G.vaishnavaDate(parseIso(k)).then((b) => G.birthdaysFrom(b, parseIso(today), 1));
      const next = (await cache[k])[0]; if (!next) continue;
      const nd = isoOf(next.date), w = G.words(m.kind, m.title);
      if (nd === tomorrow) out.push({ cat: "own_eve", only: m.user_id, key: "own:" + m.id + ":" + nd + ":eve", at: atMs(today, "18:00"), until: HOUR * 4, title: "Tomorrow is " + plain(w.ann), body: "By the Vaishnava calendar. Hare Krishna!", url: "/profile.html#pf-dates" });
      if (nd === today) out.push({ cat: "own_day", only: m.user_id, key: "own:" + m.id + ":" + nd + ":day", at: atMs(today, "06:30"), until: HOUR * 4, title: plain(w.today) + "!", body: "Hare Krishna! Wishing you a blessed day.", url: "/profile.html#pf-dates" });
    } catch (e) { /* one bad date must not stop the rest */ }
  }
  return out;
}

// ---------- who gets what, right now ----------
export function plan(cands, members, now) {
  const rows = [];
  for (const m of members) {
    const p = Object.assign({}, DEF, m.prefs || {});
    for (const c of cands) {
      if (c.only && c.only !== m.user_id) continue;
      if (!p[c.cat]) continue;
      let at = c.at, until = c.until, key = c.key, body = c.body;
      if (c.cat === "ev_hours") {
        const n = Math.min(5, Math.max(1, +p.ev_hours_n || 3));
        at = c.startMs - n * HOUR; until = Math.max(0, Math.min(2 * HOUR, c.startMs - at - 5 * 60000)); key = c.key + n; body = c.bodyFor(n);
      }
      if (now < at || now >= at + until || (c.startMs && now >= c.startMs)) continue;
      rows.push({ user_id: m.user_id, reminder_key: key, devices: m.devices, payload: { title: c.title, body, url: c.url, tag: key } });
    }
  }
  return rows;
}

async function run(env, now) {
  const d = db(env);
  env.__assets = env.ASSETS;
  globalThis.__calendarFetch = (path) => env.ASSETS ? env.ASSETS.fetch(new Request(SITE + "/" + path)) : fetch(SITE + "/" + path);

  const sets = await d.get("site_settings?select=key,value&key=in.(vapid_public)");
  const pub = (sets.find((s) => s.key === "vapid_public") || {}).value;
  if (!pub || !env.VAPID_PRIVATE) { await heartbeat(d, now, "waiting for keys"); return { skipped: "no keys" }; }

  const devs = await d.get("reminder_devices?select=id,user_id,endpoint,p256dh,auth&limit=5000");
  if (!devs.length) { await heartbeat(d, now, "ok, no phones switched on yet"); return { sent: 0 }; }
  const prefs = await d.get("reminder_prefs?select=user_id,prefs&limit=5000");
  const byUser = {};
  devs.forEach((x) => { (byUser[x.user_id] = byUser[x.user_id] || { user_id: x.user_id, devices: [], prefs: null }).devices.push(x); });
  prefs.forEach((x) => { if (byUser[x.user_id]) byUser[x.user_id].prefs = x.prefs; });
  const members = Object.values(byUser);

  const cands = await gather(env, now, d);
  const due = plan(cands, members, now);
  const since = new Date(now - 4 * 86400000).toISOString();
  const logged = new Set((await d.get("reminder_log?select=user_id,reminder_key&sent_at=gte." + since + "&limit=20000")).map((x) => x.user_id + "|" + x.reminder_key));
  let todo = due.filter((r) => !logged.has(r.user_id + "|" + r.reminder_key));

  // keep within this run's allowance of outgoing calls
  let budget = MAX_DEVICE_SENDS; const batch = [];
  for (const r of todo) { if (budget < r.devices.length) break; budget -= r.devices.length; batch.push(r); }
  let sent = 0, gone = [];
  if (batch.length) {
    // claim first (a reminder already claimed is never sent twice), then send only what was newly claimed
    const claim = await d.post("reminder_log?on_conflict=user_id,reminder_key", batch.map((r) => ({ user_id: r.user_id, reminder_key: r.reminder_key })), "resolution=ignore-duplicates,return=representation");
    const got = claim.ok ? new Set((await claim.json()).map((x) => x.user_id + "|" + x.reminder_key)) : new Set();
    const vapid = { publicKey: pub, privateD: env.VAPID_PRIVATE, subject: "mailto:" + (env.VAPID_CONTACT || "info@iskconjuja.co.ke") };
    for (const r of batch) {
      if (!got.has(r.user_id + "|" + r.reminder_key)) continue;
      for (const dv of r.devices) {
        let st = 0; try { st = await sendPush(dv, r.payload, vapid); } catch (e) { st = 0; }
        if (st >= 200 && st < 300) sent++; else if (st === 404 || st === 410 || st === 400 || st === 403) gone.push(dv.id);
      }
    }
    if (gone.length) await d.del("reminder_devices?id=in.(" + [...new Set(gone)].join(",") + ")");
  }
  if (nairobiIso(now) && new Date(now + 3 * HOUR).getUTCHours() === 3 && new Date(now).getUTCMinutes() < 15) await d.post("rpc/reminder_log_clean", {});
  await heartbeat(d, now, "ok, sent " + sent + (todo.length > batch.length ? ", " + (todo.length - batch.length) + " waiting for the next run" : ""));
  return { sent, due: due.length, waiting: todo.length - batch.length, removed: gone.length };
}

async function heartbeat(d, now, text) {
  try { await d.post("site_settings?on_conflict=key", [{ key: "reminder_last_run", value: new Date(now).toISOString() + " | " + text }], "resolution=merge-duplicates"); } catch (e) {}
}

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(run(env, Date.now()).catch(async (e) => { try { await heartbeat(db(env), Date.now(), "problem: " + String(e.message || e).slice(0, 150)); } catch (x) {} })); },
  async fetch(request, env) { return env.ASSETS.fetch(request); }
};
export { run, gather };
