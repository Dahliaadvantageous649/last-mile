import { createClient } from "@supabase/supabase-js";

// ruleid: supabase-service-key-client-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ruleid: supabase-service-key-client-side
const adminClient = createClient(supabaseUrl, service_role_key, {
  auth: { persistSession: false },
});

// ruleid: supabase-rls-bypass
const { data } = await supabase.from("users").select("*");

// ruleid: supabase-rls-bypass
const { data: user } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();
