import { createClient } from "@supabase/supabase-js";

// ok: supabase-service-key-client-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ok: supabase-service-key-client-side
const publicClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: true },
});
