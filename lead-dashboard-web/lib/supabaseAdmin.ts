import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service_role key, which bypasses Row Level
// Security — this must never be imported from a Client Component or exposed
// to the browser. All Supabase access in this app goes through Next.js
// Route Handlers so the browser never sees this key.
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local.example)."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
