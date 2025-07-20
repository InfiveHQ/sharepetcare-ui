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
    
    // Add timeout protection to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log("Auth context: Timeout protection triggered - setting loading to false");
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    const getInitialAuth = async () => {
      try {
        console.log("Auth context: Starting initial auth check...");
        
        // Get initial session and user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Auth context: Session error:", sessionError);
        }
        
        let currentUser = null;
        let userError = null;
        
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          currentUser = user;
          userError = error;
        } catch (error) {
          console.log("Auth context: Auth session missing (normal for unsigned users)");
          userError = error;
        }
        
        // Use session user if available, otherwise use direct user
        currentUser = session?.user || currentUser;
        
        console.log("Auth context: Initial auth result:", {
          hasSession: !!session,
          hasUser: !!currentUser,
          userId: currentUser?.id,
          sessionError: !!sessionError,
          userError: !!userError
        });
        
        if (mounted) {
          console.log("Auth context: Setting user and session states");
          setSession(session);
          setUser(currentUser);
          
          if (currentUser) {
            console.log("Auth context: Checking user record for:", currentUser.id);
            try {
              const record = await checkUserRecord(currentUser);
              console.log("Auth context: User record result:", { hasRecord: !!record, recordId: record?.id });
              if (mounted) setUserRecord(record);
            } catch (recordError) {
              console.error("Auth context: Error checking user record:", recordError);
              if (mounted) setUserRecord(null);
            }
          } else {
            console.log("Auth context: No current user, setting userRecord to null");
            setUserRecord(null);
          }
          console.log("Auth context: About to set loading to false");
          setLoading(false);
          console.log("Auth context: Initial auth complete, loading set to false");
        } else {
          console.log("Auth context: Component unmounted, not updating state");
        }
      } catch (error) {
        console.error("Auth context: Error getting initial auth:", error);
        if (mounted) {
          console.log("Auth context: Error case - setting loading to false");
          setLoading(false);
          setUserRecord(null);
        }
      }
    };
    
    console.log("Auth context: Calling getInitialAuth");
    getInitialAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth context: Auth state change:", { event, userId: session?.user?.id });
      
      try {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("Auth context: Checking user record after auth change for:", session.user.id);
          try {
            const record = await checkUserRecord(session.user);
            console.log("Auth context: User record after auth change:", { hasRecord: !!record, recordId: record?.id });
            if (mounted) setUserRecord(record);
          } catch (recordError) {
            console.error("Auth context: Error checking user record after auth change:", recordError);
            if (mounted) setUserRecord(null);
          }
        } else {
          console.log("Auth context: No session user, setting userRecord to null");
          setUserRecord(null);
        }
        
        setLoading(false);
        console.log("Auth context: Auth state change complete, loading set to false");
      } catch (error) {
        console.error("Auth context: Error in auth state change:", error);
        if (mounted) {
          setLoading(false);
          setUserRecord(null);
        }
      }
    });

    return () => {
      console.log("Auth context: Cleaning up useEffect");
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  console.log("AuthProvider: About to return, loading =", loading);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRecord,
      signOut: async () => {
        console.log("Auth context: Signing out...");
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Auth context: Sign out error:", error);
        } else {
          console.log("Auth context: Sign out successful");
          setUserRecord(null);
        }
      }
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