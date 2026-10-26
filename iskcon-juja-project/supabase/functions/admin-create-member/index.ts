// ============================================================
// Edge Function: admin-create-member
//
// Lets a signed-in admin create a real member login (email +
// temporary password) for someone. This is the ONLY place the
// secret server key is used. It runs on Supabase's servers, never
// in a visitor's browser, so it is safe here.
//
// HOW TO DEPLOY (no command line needed):
//   1. In your Supabase project, click "Edge Functions" in the
//      left sidebar.
//   2. Click "Deploy a new function" and choose "Via Editor".
//   3. Name it exactly:  admin-create-member
//   4. Delete the sample code in the editor, paste ALL of this
//      file in, and click "Deploy".
//   5. If adding a member later says "Invalid JWT": open the
//      function's settings and switch OFF "Verify JWT" (this code
//      checks the login itself, so it stays safe).
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Supabase has been moving projects to a new style of secret key; accept either.
function secretKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return (keys.default ?? Object.values(keys)[0] ?? "") as string;
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Use POST." }, 405);

  try {
    const key = secretKey();
    if (!key) return reply({ error: "The server's secret key is not available to this function." }, 500);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, key);

    // 1. Who is calling? Check their login token.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return reply({ error: "You are not signed in." }, 401);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return reply({ error: "You are not signed in." }, 401);

    // 2. Are they actually an admin?
    const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).single();
    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return reply({ error: "Only admins can add members." }, 403);
    }

    // 3. Check what they sent.
    const { email, temp_password } = await req.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return reply({ error: "Please enter a valid email address." }, 400);
    }
    if (!temp_password || String(temp_password).length < 8) {
      return reply({ error: "The temporary password must be at least 8 characters." }, 400);
    }

    // 4. Create the login.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: true,
    });
    if (createErr) return reply({ error: createErr.message }, 400);

    // The database trigger already made a "pending" profile row; promote it to member.
    await admin.from("profiles").update({ role: "member" }).eq("id", created.user.id);

    return reply({ ok: true, email });
  } catch (e) {
    return reply({ error: String(e) }, 500);
  }
});
