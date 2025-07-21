import { createClient, SupabaseClient } from "@supabase/supabase-js";

console.log("Supabase utils: Starting initialization");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase config check:", {
  hasUrl: !!url,
  hasKey: !!key,
  urlLength: url?.length,
  keyLength: key?.length,
  urlStartsWith: url?.substring(0, 20) + "...",
  keyStartsWith: key?.substring(0, 10) + "..."
});

if (!url || !key) {
  console.error("❌ Supabase environment variables are missing");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", url);
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", key);
  throw new Error("Supabase environment variables are missing");
}

let supabase: SupabaseClient;
try {
  console.log("Supabase utils: Creating client...");
  supabase = createClient(url, key);
  console.log("Supabase utils: Client created successfully");
} catch (error) {
  console.error("Supabase utils: Error creating client:", error);
  throw error;
}

export { supabase };
