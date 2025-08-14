import React, { createContext, useState, useEffect, useContext } from "react";
import { appLogger } from "../../lib/utils";
import { getSupabaseClient } from "../config/supabaseClient";

type AuthContextValue = {
  signUp: (data: any) => Promise<any>;
  signIn: (data: any) => Promise<any>;
  signOut: () => Promise<{ error: any | null }>;
  user: any;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        const client = await getSupabaseClient();
        setSupabaseClient(client);

        const {
          data: { session },
        } = await client.auth.getSession();
        setUser(session?.user || null);
        setLoading(false);

        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event: any, nextSession: any) => {
          setUser(nextSession?.user || null);
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        appLogger.error.general(error instanceof Error ? error.message : String(error));
        setLoading(false);
      }
    };

    initClient();
  }, []);

  const value: AuthContextValue = {
    signUp: async (data: any) => {
      if (!supabaseClient) return { error: new Error("Client not initialized") };
      return await supabaseClient.auth.signUp(data);
    },
    signIn: async (data: any) => {
      if (!supabaseClient) return { error: new Error("Client not initialized") };
      return await supabaseClient.auth.signInWithPassword(data);
    },
    signOut: async () => {
      try {
        const supabaseKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith("sb-") || key.includes("supabase"),
        );
        supabaseKeys.forEach((key) => {
          localStorage.removeItem(key);
        });

        const sessionKeys = Object.keys(sessionStorage).filter(
          (key) => key.startsWith("sb-") || key.includes("supabase"),
        );
        sessionKeys.forEach((key) => {
          sessionStorage.removeItem(key);
        });

        setUser(null);

        try {
          if (supabaseClient) {
            await supabaseClient.auth.signOut({ scope: "local" });
          }
        } catch (logoutError) {
          appLogger.info.warning(
            `⚠️ Supabase logout failed (but local session cleared): ${String(logoutError)}`,
          );
        }

        return { error: null };
      } catch (err: any) {
        appLogger.error.general(err instanceof Error ? err.message : String(err));
        setUser(null);
        return { error: null };
      }
    },
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
