import React, { createContext, useState, useEffect, useContext } from "react";
import { appLogger } from "../../lib/utils";
import { getSupabaseClient } from "../config/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseClient, setSupabaseClient] = useState(null);

  useEffect(() => {
    // Initialize Supabase client using singleton pattern
    const initClient = async () => {
      try {
        const client = await getSupabaseClient();
        setSupabaseClient(client);

        // Check active sessions and sets the user
        const {
          data: { session },
        } = await client.auth.getSession();
        setUser(session?.user || null);
        setLoading(false);

        // Listen for auth changes
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        appLogger.error.general(
          error instanceof Error ? error.message : String(error)
        );
        setLoading(false);
      }
    };

    initClient();
  }, []);

  // Expose the user and auth methods
  const value = {
    signUp: async (data) => {
      if (!supabaseClient)
        return { error: new Error("Client not initialized") };
      return await supabaseClient.auth.signUp(data);
    },
    signIn: async (data) => {
      if (!supabaseClient)
        return { error: new Error("Client not initialized") };
      return await supabaseClient.auth.signInWithPassword(data);
    },
    signOut: async () => {
      try {
        // Force clear all possible Supabase session data first
        const supabaseKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith("sb-") || key.includes("supabase")
        );

        supabaseKeys.forEach((key) => {
          localStorage.removeItem(key);
        });

        // Clear sessionStorage too
        const sessionKeys = Object.keys(sessionStorage).filter(
          (key) => key.startsWith("sb-") || key.includes("supabase")
        );

        sessionKeys.forEach((key) => {
          sessionStorage.removeItem(key);
        });

        // Set user to null immediately for UI responsiveness
        setUser(null);

        // Try to call Supabase logout (but don't fail if it errors)
        try {
          if (supabaseClient) {
            await supabaseClient.auth.signOut({ scope: "local" });
          }
        } catch (logoutError) {
          appLogger.info.warning(
            `⚠️ Supabase logout failed (but local session cleared): ${String(
              logoutError
            )}`
          );
        }

        return { error: null };
      } catch (err) {
        appLogger.error.general(
          err instanceof Error ? err.message : String(err)
        );
        // Even if everything fails, force logout
        setUser(null);
        return { error: null }; // Return success since we cleared local session
      }
    },
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
