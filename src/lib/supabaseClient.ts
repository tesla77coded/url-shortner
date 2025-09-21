import dotenv from 'dotenv'
dotenv.config();
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase: SupabaseClient = createClient(url, key, {
  auth: { persistSession: false }
});
