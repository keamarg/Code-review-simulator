import { createClient } from "@supabase/supabase-js";
import { getCachedApiKey } from "../utils/getCompletion.js";

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
      console.log("🔗 Initializing Supabase client...");
      const apiKey = await getCachedApiKey("database");

      supabaseInstance = createClient(
        "https://gzoltpvnxwjoeycomcby.supabase.co",
        apiKey
      );

      console.log("✅ Supabase client initialized successfully");
      return supabaseInstance;
    } catch (error) {
      console.error("❌ Supabase initialization failed:", error);
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
  }
);
