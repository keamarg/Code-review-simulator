import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../config/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Expose the user and auth methods
  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
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
          await supabase.auth.signOut({ scope: "local" });
        } catch (logoutError) {
          console.warn(
            "⚠️ Supabase logout failed (but local session cleared):",
            logoutError
          );
        }

        return { error: null };
      } catch (err) {
        console.error("❌ Logout error:", err);
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
