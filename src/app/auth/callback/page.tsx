"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Processing...");
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setStatus("Authentication failed");
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (data.session) {
          console.log("Auth callback successful:", data.session.user.email);
          setStatus("Authentication successful! Redirecting to dashboard...");
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          console.log("No session found in callback");
          setStatus("No session found. Redirecting to login...");
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (error) {
        console.error("Callback error:", error);
        setStatus("Error processing authentication");
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <h1 className="text-xl font-bold mb-2">Processing Authentication</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
} 