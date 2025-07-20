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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRecord, setUserRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserRecord = async (authUser: User) => {
    if (!authUser) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const getInitialAuth = async () => {
      try {
        // Get initial session and user
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        const currentUser = session?.user || user;
        if (mounted) {
          setSession(session);
          setUser(currentUser);
          if (currentUser) {
            const record = await checkUserRecord(currentUser);
            if (mounted) setUserRecord(record);
          } else {
            setUserRecord(null);
          }
          setLoading(false);
        }
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };
    getInitialAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const record = await checkUserRecord(session.user);
        if (mounted) setUserRecord(record);
      } else {
        setUserRecord(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log("Auth context: Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Auth context: Sign out error:", error);
    } else {
      console.log("Auth context: Sign out successful");
      setUserRecord(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    userRecord,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 