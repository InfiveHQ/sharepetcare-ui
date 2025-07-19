"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>("");
  const [details, setDetails] = useState<any>(null);

  const testAuth = async () => {
    setStatus("Testing auth...");
    setDetails(null);

    try {
      // Test 1: Check if we can connect to Supabase
      console.log("Testing Supabase connection...");
      
      // Test 2: Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Session check:", { session, sessionError });
      
      // Test 3: Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("User check:", { user, userError });
      
      // Test 4: Check if we can query the database
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      console.log("Database test:", { testData, testError });

      setStatus("✅ Auth test completed");
      setDetails({
        session: session ? { user: session.user?.email, expires: session.expires_at } : null,
        user: user ? { email: user.email, id: user.id } : null,
        sessionError: sessionError?.message,
        userError: userError?.message,
        databaseTest: testError ? testError.message : "Success"
      });
    } catch (err) {
      setStatus("❌ Auth test failed");
      setDetails({ error: err });
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    } else {
      console.log("Sign out successful");
      window.location.reload();
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Auth
        </button>
        
        <button 
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded ml-2"
        >
          Sign Out
        </button>
      </div>

      {status && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Status: {status}</h2>
          {details && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <ul className="text-sm space-y-1">
          <li>• Check browser console for detailed logs</li>
          <li>• Try signing out and back in</li>
          <li>• Check if Supabase project is active</li>
          <li>• Verify environment variables</li>
        </ul>
      </div>
    </div>
  );
} 