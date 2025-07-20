"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function DebugSupabaseQueryPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testSupabaseQuery = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      console.log("=== TESTING SUPABASE CLIENT QUERY ===");
      console.log("User:", user.email, user.id);

      // Test 1: Direct query to pet_shares
      console.log("Test 1: Querying pet_shares...");
      const { data: shares, error: sharesError } = await supabase
        .from('pet_shares')
        .select('*')
        .eq('shared_with_email', user.email);

      console.log("Pet shares result:", { shares, sharesError });

      // Test 2: Query with different conditions
      console.log("Test 2: Querying with owner_id...");
      const { data: ownerShares, error: ownerError } = await supabase
        .from('pet_shares')
        .select('*')
        .eq('owner_id', user.id);

      console.log("Owner shares result:", { ownerShares, ownerError });

      // Test 3: Query all pet_shares (should be blocked by RLS)
      console.log("Test 3: Querying all pet_shares...");
      const { data: allShares, error: allError } = await supabase
        .from('pet_shares')
        .select('*');

      console.log("All shares result:", { allShares, allError });

      // Test 4: Check current session
      console.log("Test 4: Checking session...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Session result:", { session, sessionError });

      setResult({
        user: {
          id: user.id,
          email: user.email
        },
        shares: {
          data: shares,
          error: sharesError,
          count: shares?.length || 0
        },
        ownerShares: {
          data: ownerShares,
          error: ownerError,
          count: ownerShares?.length || 0
        },
        allShares: {
          data: allShares,
          error: allError,
          count: allShares?.length || 0
        },
        session: {
          data: session,
          error: sessionError
        }
      });

    } catch (error) {
      console.error("Test failed:", error);
      setResult({ error: "Test failed", details: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Supabase Query</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
          <p>ID: {user?.id || "N/A"}</p>
        </div>

        <button 
          onClick={testSupabaseQuery}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Supabase Query
        </button>

        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 