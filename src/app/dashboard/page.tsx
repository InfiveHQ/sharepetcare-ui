// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Create user record automatically if it doesn't exist
  useEffect(() => {
    const createUserRecord = async () => {
      if (!loading && user && !userRecord) {
        console.log("User authenticated but no user record found, creating user record automatically");
        
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
          
          if (error) {
            console.error("Failed to create user record:", error);
            // If creation fails, redirect to profile
            router.push('/profile');
          } else {
            console.log("User record created successfully:", data);
            // Refresh the page to update the auth context
            window.location.reload();
          }
        } catch (error) {
          console.error("Error creating user record:", error);
          router.push('/profile');
        }
      }
    };

    createUserRecord();
  }, [loading, user, userRecord, router]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8">Please sign in to view your dashboard.</div>;
  }

  if (!userRecord) {
    return <div className="p-8">Setting up your profile...</div>;
  }

  console.log("Dashboard render:", {
    user: user?.id,
    refreshTrigger
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-2 sm:p-4">
        <div className="bg-white rounded-xl p-4 sm:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
            <div className="flex gap-2 sm:gap-3">
              <a 
                href="/profile" 
                className="bg-black text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
              >
                Profile
              </a>
              <button
                onClick={handleSignOut}
                className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                Sign Out
              </button>
            </div>
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
