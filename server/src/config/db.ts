import { createClient } from "@supabase/supabase-js";

import { env } from "./env.js";

// Service-role client: bypasses RLS, used for all server-side DB ops and token verification.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anon client: used for signInWithPassword which must use the anon key.
export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
