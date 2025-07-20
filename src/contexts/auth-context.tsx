"use client";

console.log("Auth context: Module loading...");

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

console.log("Auth context: Imports completed");

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
  console.log("AuthProvider: Component initialized");
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRecord, setUserRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRecordLoading, setUserRecordLoading] = useState(false);

  console.log("AuthProvider: State initialized, loading =", loading);

  const checkUserRecord = async (authUser: User) => {
    if (!authUser || userRecordLoading) return null;
    
    setUserRecordLoading(true);
    try {
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User record check timed out')), 5000);
      });
      
      const checkPromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      const { data, error } = await Promise.race([checkPromise, timeoutPromise]);
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking user record:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Unexpected error checking user record:", error);
      return null;
    } finally {
      setUserRecordLoading(false);
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Main useEffect started");
    let mounted = true;
    setLoading(true);
    
    // Add timeout protection for the entire auth process
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log("Auth context: Main timeout triggered - forcing loading to false");
        setLoading(false);
        setUserRecord(null);
      }
    }, 8000); // 8 second timeout
    
    const getInitialAuth = async () => {
      try {
        console.log("Auth context: Starting initial auth check...");
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Auth context: Session error:", sessionError);
        }
        
        console.log("Auth context: Initial session result:", {
          hasSession: !!session,
          userId: session?.user?.id,
          sessionError: !!sessionError
        });
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log("Auth context: Checking user record for:", session.user.id);
            try {
              const record = await checkUserRecord(session.user);
              console.log("Auth context: User record result:", { hasRecord: !!record, recordId: record?.id });
              if (mounted) setUserRecord(record);
            } catch (recordError) {
              console.error("Auth context: Error checking user record:", recordError);
              if (mounted) setUserRecord(null);
            }
          } else {
            console.log("Auth context: No session user, setting userRecord to null");
            setUserRecord(null);
          }
          setLoading(false);
          console.log("Auth context: Initial auth complete, loading set to false");
        }
      } catch (error) {
        console.error("Auth context: Error getting initial auth:", error);
        if (mounted) {
          setLoading(false);
          setUserRecord(null);
        }
      }
    };
    
    getInitialAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth context: Auth state change:", { event, userId: session?.user?.id });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const record = await checkUserRecord(session.user);
          if (mounted) setUserRecord(record);
        } catch (recordError) {
          console.error("Auth context: Error checking user record after auth change:", recordError);
          if (mounted) setUserRecord(null);
        }
      } else {
        if (mounted) setUserRecord(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  console.log("AuthProvider: About to return, loading =", loading);

  const refreshUserRecord = async () => {
    if (!user) return;
    console.log("Auth context: Refreshing user record for:", user.id);
    try {
      const record = await checkUserRecord(user);
      console.log("Auth context: Refreshed user record:", { hasRecord: !!record, recordId: record?.id });
      setUserRecord(record);
    } catch (error) {
      console.error("Auth context: Error refreshing user record:", error);
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
        console.log("Auth context: Signing out...");
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("Auth context: Sign out error:", error);
            throw error;
          } else {
            console.log("Auth context: Sign out successful");
            // Clear all state
            setUser(null);
            setSession(null);
            setUserRecord(null);
            setLoading(false);
            // Force redirect to home page
            window.location.href = '/';
          }
        } catch (error) {
          console.error("Auth context: Sign out failed:", error);
          // Even if sign out fails, clear state and redirect
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