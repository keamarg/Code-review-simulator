import { createClient } from "@supabase/supabase-js";
import { API_SUPABASE_ENDPOINT } from "../../config/urls";
import { appLogger } from "../../lib/utils";

// Global singleton instance
let supabaseInstance: any = null;
let initializationPromise: Promise<any> | null = null;

export async function getSupabaseClient() {
  // If we already have an instance, return it
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return await initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      appLogger.generic.info("🔗 Initializing Supabase client...");
      // Fetch anon key from backend (not exposed in code)
      const res = await fetch(API_SUPABASE_ENDPOINT);
      if (!res.ok) throw new Error("Failed to fetch Supabase anon key");
      const apiKey = await res.json();

      supabaseInstance = createClient("https://gzoltpvnxwjoeycomcby.supabase.co", apiKey);

      // eslint-disable-next-line no-console
      appLogger.generic.info("✅ Supabase client initialized successfully");
      return supabaseInstance;
    } catch (error) {
      appLogger.error.general(error instanceof Error ? error.message : String(error));
      // Reset promise on error so we can retry
      initializationPromise = null;
      throw error;
    }
  })();

  return await initializationPromise;
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
  },
);
