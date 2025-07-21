"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRecord: any | null;
  signOut: () => Promise<void>;
  refreshUserRecord: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRecord, setUserRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple function to check user record
  const checkUserRecord = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking user record:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error checking user record:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const record = await checkUserRecord(session.user);
            if (mounted) setUserRecord(record);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth state change:", { event, sessionUserId: session?.user?.id, currentUserId: user?.id });
      
      // Only update if the session actually changed
      if (session?.user?.id !== user?.id) {
        console.log("Session changed, updating auth state");
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const record = await checkUserRecord(session.user);
          if (mounted) setUserRecord(record);
        } else {
          if (mounted) setUserRecord(null);
        }
        
        setLoading(false);
      } else {
        console.log("Session unchanged, skipping update");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserRecord = async () => {
    if (!user) return;
    try {
      const record = await checkUserRecord(user);
      setUserRecord(record);
    } catch (error) {
      console.error("Error refreshing user record:", error);
      setUserRecord(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRecord,
      signOut: async () => {
        console.log("Force sign out initiated");
        try {
          // Clear all local/session storage
          localStorage.clear();
          sessionStorage.clear();
          console.log("Local and session storage cleared");

          // Clear all state
          setUser(null);
          setSession(null);
          setUserRecord(null);
          setLoading(false);
          console.log("Auth state cleared");

          // Sign out from Supabase
          await supabase.auth.signOut();
          console.log("Supabase signOut called");

          // Force redirect
          window.location.href = '/';
        } catch (error) {
          console.error("Force sign out error:", error);
          // Force sign out anyway
          setUser(null);
          setSession(null);
          setUserRecord(null);
          setLoading(false);
          window.location.href = '/';
        }
      },
      refreshUserRecord
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 