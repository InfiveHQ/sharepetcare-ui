'use client';
import { AuthProvider } from "@/contexts/auth-context";
import { DataProvider } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import React from "react";

function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  if (!user) return null;
  return (
    <div className="bg-white shadow flex justify-end items-center px-4 py-2 gap-2 sm:gap-3">
      {/* Optionally show user email */}
      {/* <span className="text-gray-700 text-sm mr-2">{user.email}</span> */}
      <button
        onClick={handleSignOut}
        className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
      >
        Sign Out
      </button>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  console.log("ClientLayout: Component rendered");
  
  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen bg-gray-100">
          <TopBar />
          <div>{children}</div>
        </div>
      </DataProvider>
    </AuthProvider>
  );
} 