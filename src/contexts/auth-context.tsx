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
    
    console.log("Checking user record for:", authUser.id, authUser.email);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) {
        console.log("User record not found in users table:", error.message);
        console.log("Error details:", error);
        return null;
      }
      
      console.log("User record found in users table:", data);
      return data;
    } catch (error) {
      console.error("Error checking user record:", error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Starting auth initialization...");
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("Initial session check:", session?.user?.email);
        console.log("Session error:", sessionError);
        console.log("Full session:", session);
        
        // Get current user directly
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("Direct user check:", user?.email);
        console.log("User error:", userError);
        console.log("Full user:", user);
        
        // Use session user if available, otherwise use direct user
        const currentUser = session?.user || user;
        console.log("Setting user to:", currentUser?.email);
        console.log("Current user object:", currentUser);
        
        setSession(session);
        setUser(currentUser);
        
        // Check if user record exists in database
        if (currentUser) {
          const record = await checkUserRecord(currentUser);
          setUserRecord(record);
        }
        
        setLoading(false);
        
        console.log("Auth initialization complete. User set to:", currentUser?.email);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check user record when auth state changes
      if (session?.user) {
        const record = await checkUserRecord(session.user);
        setUserRecord(record);
      } else {
        setUserRecord(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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