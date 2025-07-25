// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import DailyTaskChecklist from "@/components/daily-task-checklist";
import DailyLog from "@/components/daily-log";
import PetCareModal from "@/components/pet-care-modal";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading, userRecord, refreshUserRecord } = useAuth();
  const { refreshTrigger } = useData();
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const signInTimeout = useRef<NodeJS.Timeout | null>(null);
  const [userRecordError, setUserRecordError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Debug logging
  console.log("Dashboard render:", {
    user: user?.id,
    userRecord: userRecord?.id,
    loading,
    showSignIn,
    refreshTrigger
  });

  // Add specific loading state debug
  console.log("Dashboard loading check:", { loading, willShowLoading: loading });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Create user record automatically if it doesn't exist
  useEffect(() => {
    const createUserRecord = async () => {
      if (!loading && user && !userRecord) {
        // Add timeout protection for user record creation
        const timeoutId = setTimeout(() => {
          console.log("User record creation timeout - forcing refresh");
          window.location.reload();
        }, 15000); // 15 second timeout
        
        try {
          console.log("Attempting to create user record for:", user.email);
          
          // First, check if user record already exists
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (existingUser) {
            console.log("User record already exists:", existingUser);
            setUserRecordError(null);
            return;
          }
          
          if (checkError && checkError.code !== 'PGRST116') {
            console.error("Error checking existing user:", checkError);
          }
          
          // Try to create the user record
          const { data, error } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
            }])
            .select()
            .single();
            
          if (error) {
            console.error("Failed to create user record:", {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              fullError: error
            });
            
            // Provide more specific error messages
            if (error.code === '42501') {
              setUserRecordError("Permission denied. Please contact support to set up your account.");
            } else if (error.code === '23505') {
              setUserRecordError("User record already exists. Please refresh the page.");
            } else {
              setUserRecordError(`Failed to create user record: ${error.message || 'Unknown error'}. Please contact support.`);
            }
          } else {
            console.log("User record created successfully:", data);
            setUserRecordError(null);
            // Refresh the user record in the auth context
            await refreshUserRecord();
          }
        } catch (error) {
          console.error("Unexpected error creating user record:", error);
          setUserRecordError("An unexpected error occurred. Please contact support.");
        } finally {
          clearTimeout(timeoutId);
        }
      }
    };
    createUserRecord();
  }, [loading, user, userRecord]);

  useEffect(() => {
    if (!user && !loading) {
      signInTimeout.current = setTimeout(() => setShowSignIn(true), 400);
    } else {
      setShowSignIn(false);
      if (signInTimeout.current) clearTimeout(signInTimeout.current);
    }
    return () => {
      if (signInTimeout.current) clearTimeout(signInTimeout.current);
    };
  }, [user, loading]);

  // Add timeout protection for loading states
  useEffect(() => {
    if (loading || (user && !userRecord && !loading)) {
      const timeoutId = setTimeout(() => {
        console.log("Dashboard: Loading timeout triggered");
        setLoadingTimeout(true);
      }, 8000); // 8 second timeout
      
      return () => clearTimeout(timeoutId);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading, user, userRecord]);

  // Show loading state with timeout protection
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
          {loadingTimeout && (
            <p className="text-xs text-orange-600 mt-1">Loading is taking longer than expected</p>
          )}
          <p className="text-xs text-gray-500 mt-1">If this takes too long, try refreshing</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (showSignIn) {
    return <div className="p-8">Please sign in to view your dashboard.</div>;
  }

  // Show sign in message if no user and not loading
  if (!user && !loading) {
    return <div className="p-8">Please sign in to view your dashboard.</div>;
  }

  // Show profile setup if user exists but no userRecord
  if (user && !userRecord && !loading) {
    return (
      <div className="p-8">
        {userRecordError ? (
          <div className="text-red-600">{userRecordError}</div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-gray-600">Setting up your profile...</p>
            <p className="text-xs text-gray-500 mt-2">This may take a moment after making changes</p>
            {loadingTimeout && (
              <p className="text-xs text-orange-600 mt-1">Taking longer than expected</p>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 block w-full"
            >
              Go to Profile
            </button>
            <button 
              onClick={() => window.location.href = '/?force=1'}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 block w-full"
            >
              Force Reload
            </button>
          </div>
        )}
      </div>
    );
  }

  console.log("Dashboard render:", {
    user: user?.id,
    refreshTrigger
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-2 sm:p-4">
        {/* Remove navigation tabs above the card */}
        <div className="bg-white rounded-xl p-4 sm:p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-black">Today's Tasks</h1>
              <p className="text-base text-gray-600 mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <Link
              href="/profile"
              className="bg-white text-black px-4 py-2 rounded-lg font-semibold shadow border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Profile
            </Link>
          </div>
          
          <div className="mt-8 space-y-6">
            <DailyTaskChecklist />
            <PetCareModal />
          </div>
        </div>
      </div>
    </div>
  );
}
