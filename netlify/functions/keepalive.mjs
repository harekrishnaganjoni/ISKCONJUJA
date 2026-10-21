const SUPABASE_URL = "https://zwvgfhgxegxchwlpelbk.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmdmaGd4ZWd4Y2h3bHBlbGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzE0NDYsImV4cCI6MjEwNjI0NzQ0Nn0.097vrqgSiOSMezVl9xpGtJN8zwpWEQKSSJR9Vzb8r3E";

const TABLES = ["testimonials", "events"];

export default async () => {
  for (const table of TABLES) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
      );
      if (res.ok) {
        return new Response(`OK: queried "${table}" successfully`, { status: 200 });
      }
    } catch (err) {}
  }
  return new Response("FAILED: could not query Supabase", { status: 503 });
};

export const config = { path: "/keepalive" };