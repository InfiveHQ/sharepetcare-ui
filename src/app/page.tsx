"use client";

import { useAuth } from "@/contexts/auth-context";
import AuthForm from "@/components/auth-form";
import DashboardPage from "./dashboard/page";
import { supabase } from "@/utils/supabase";

export default function Home() {
  const { user, loading } = useAuth();

  console.log("Main page - user:", user?.email, "loading:", loading, "user object:", user);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
          <p className="text-xs text-gray-500 mt-2">Please wait while we set up your account</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("Rendering AuthForm");
    return <AuthForm />;
  }

  console.log("Rendering DashboardPage");
  return <DashboardPage />;
}