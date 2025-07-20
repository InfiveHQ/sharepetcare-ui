"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function DebugAuthPage() {
  const { user, loading, userRecord } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkAuthStatus = async () => {
    const info = {
      authUser: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      userRecord,
      loading,
      session: await supabase.auth.getSession(),
      userDirect: await supabase.auth.getUser()
    };
    
    setDebugInfo(info);
  };

  useEffect(() => {
    checkAuthStatus();
  }, [user, userRecord, loading]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current State:</h2>
          <p>Loading: {loading ? "Yes" : "No"}</p>
          <p>User: {user ? user.email : "None"}</p>
          <p>User Record: {userRecord ? "Found" : "Missing"}</p>
        </div>

        <button 
          onClick={checkAuthStatus}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh Debug Info
        </button>

        {debugInfo && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Debug Info:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 