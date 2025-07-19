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
          <button 
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              console.log("Manual user check:", user);
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Check User Manually
          </button>
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