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

export default function DashboardPage() {
  const { user, loading, userRecord } = useAuth();
  const { refreshTrigger } = useData();
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const signInTimeout = useRef<NodeJS.Timeout | null>(null);
  const [userRecordError, setUserRecordError] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Create user record automatically if it doesn't exist
  useEffect(() => {
    const createUserRecord = async () => {
      if (!loading && user && !userRecord) {
        try {
          const { data, error } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
            }])
            .select()
            .single();
          if (error && (error.message || error.code)) {
            console.error("Failed to create user record:", error);
            setUserRecordError("Failed to create user record. Please contact support.");
          } else {
            setUserRecordError(null);
          }
        } catch (error) {
          console.error("Error creating user record:", error);
          setUserRecordError("Failed to create user record. Please contact support.");
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
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

  if (!userRecord && user && !loading) {
    return <div className="p-8">{userRecordError ? <div className="text-red-600">{userRecordError}</div> : "Setting up your profile..."}</div>;
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
            <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
            <a
              href="/profile"
              className="bg-black text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition-colors"
            >
              Profile
            </a>
          </div>
          
          <div className="mt-8 space-y-6">
            <DailyTaskChecklist />
            <DailyLog />
            <PetCareModal />
          </div>
        </div>
      </div>
    </div>
  );
}
