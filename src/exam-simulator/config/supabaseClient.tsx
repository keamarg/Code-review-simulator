import { createClient } from "@supabase/supabase-js";
import { getCachedApiKey } from "../utils/getCompletion.js";

// Initialize Supabase client with cached API key
let supabaseInstance: any = null;

export async function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const apiKey = await getCachedApiKey("database");

  supabaseInstance = createClient(
    "https://gzoltpvnxwjoeycomcby.supabase.co",
    apiKey
  );

  return supabaseInstance;
}

// Create a synchronous supabase export for backward compatibility
export const supabase = new Proxy(
  {},
  {
    get(target, prop) {
      return async (...args: any[]) => {
        const client = await getSupabaseClient();
        return client[prop](...args);
      };
    },
  }
);
