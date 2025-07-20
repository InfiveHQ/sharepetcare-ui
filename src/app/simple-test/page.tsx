"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function SimpleTestPage() {
  const [status, setStatus] = useState("Initializing...");
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAuth = async () => {
      try {
        setStatus("Testing Supabase connection...");
        
        // Test 1: Basic connection
        const { data, error: connectionError } = await supabase.from('users').select('count').limit(1);
        if (connectionError) {
          throw new Error(`Database connection failed: ${connectionError.message}`);
        }
        
        setStatus("Testing authentication...");
        
        // Test 2: Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw new Error(`Auth error: ${userError.message}`);
        }
        
        setStatus("Testing session...");
        
        // Test 3: Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        setStatus("All tests passed!");
        setUser(user);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("Test failed");
      }
    };

    testAuth();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Simple Auth Test</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-semibold text-blue-800">Status:</h2>
          <p className="text-blue-700">{status}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h2 className="font-semibold text-red-800">Error:</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {user && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800">User Found:</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry Test
        </button>
      </div>
    </div>
  );
} 