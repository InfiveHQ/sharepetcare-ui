import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Supabase environment variables are missing");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", url);
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", key);
}

export const supabase = createClient(url!, key!);
