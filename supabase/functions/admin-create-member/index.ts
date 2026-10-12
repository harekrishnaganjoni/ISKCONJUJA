// ============================================================
// Edge Function: admin-create-member
// Lets a signed-in admin create a real member login (email +
// temporary password) for someone. This is the ONLY place the
// secret "service_role" key is used — it runs on Supabase's
// servers, never in the visitor's browser, so it's safe here.
//
// How to deploy this (one time, from your computer):
//   1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
//   2. In this project folder, run: supabase login
//   3. Run: supabase link --project-ref YOUR-PROJECT-REF
//      (find YOUR-PROJECT-REF in your Supabase project's URL/settings)
//   4. Run: supabase functions deploy admin-create-member
// That's it — after this, the admin panel's "Add Member" button
// will work. You do not need to touch this file again.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    // Client using the CALLER's own token, just to check who they are.
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not signed in." }), { status: 401, headers: cors });
    }

    // Admin client using the SECRET key — only ever used here, server-side.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Confirm the caller is actually an admin before doing anything.
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", userData.user.id).single();
    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      return new Response(JSON.stringify({ error: "Only admins can add members." }), { status: 403, headers: cors });
    }

    const { email, temp_password } = await req.json();
    if (!email || !temp_password) {
      return new Response(JSON.stringify({ error: "Email and a temporary password are required." }), { status: 400, headers: cors });
    }

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email, password: temp_password, email_confirm: true,
    });
    if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: cors });

    // The trigger in schema.sql already made a 'pending' profile row — promote it.
    await adminClient.from("profiles").update({ role: "member" }).eq("id", created.user.id);

    return new Response(JSON.stringify({ ok: true, email }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
