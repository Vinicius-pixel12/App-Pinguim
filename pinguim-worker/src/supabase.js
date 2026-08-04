/** Cliente Supabase com service role — uso exclusivo do worker. */

import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { "x-client-info": `pinguim-worker/${config.worker.name}` } },
});
