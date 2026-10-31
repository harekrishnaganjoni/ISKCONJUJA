// ============================================================
// SUPABASE CONFIG — the ONLY file you should ever need to edit
// to connect the site to your database.
//
// Where to find these two values:
// 1. Go to supabase.com and open your project.
// 2. Left sidebar -> Settings (gear icon) -> API.
// 3. Copy "Project URL" into SUPABASE_URL below.
// 4. Copy the "anon public" key (NOT the "service_role" key —
//    that one must never appear in this file or on the website)
//    into SUPABASE_ANON_KEY below.
//
// This "anon" key is safe to be public / visible in the site's
// code — it only allows what the database's security rules
// (in supabase/schema.sql) explicitly permit, which is public
// read-only access plus normal login. It is not a secret.
// ============================================================
window.SUPABASE_URL = "https://zwvgfhgxegxchwlpelbk.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_jJ8mJ4E57_d7OO7DYdlbkw_7fjEzgrl";

// ============================================================
// WHERE THINGS LIVE.
// The public website is for visitors. Signing in, the dashboard, "My Courses",
// and the admin tools belong to the member portal. When portalLive is true
// (after portal.iskconjuja.co.ke has been added in Cloudflare and in Supabase's
// allowed addresses), those pages open on the portal address and the public
// pages never show member links. While portalLive is false, everything keeps
// working on the one address, so nothing breaks during the switch.
// ============================================================
window.ISKCON_HOSTS = {
  portalLive: true,
  publicHosts: ["iskconjuja.co.ke", "www.iskconjuja.co.ke"],
  publicOrigin: "https://iskconjuja.co.ke",
  portalHost: "portal.iskconjuja.co.ke",
  portalOrigin: "https://portal.iskconjuja.co.ke"
};
