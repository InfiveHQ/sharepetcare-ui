"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

export default function TestRLSPoliciesPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRLSPolicies = async () => {
    setLoading(true);
    setResults(null);

    try {
      if (!user) {
        setResults({ error: "No authenticated user found" });
        return;
      }

      console.log("Testing RLS policies for user:", user.email);

      // Test 1: Check if we can query the users table
      const { data: queryData, error: queryError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      console.log("Query test:", { queryData, queryError });

      // Test 2: Check if user record exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log("Existing user check:", { existingUser, checkError });

      // Test 3: Try to create user record
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        }])
        .select()
        .single();

      console.log("Insert test:", { insertData, insertError });

      // Test 4: Try to update user record
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ name: 'Test Update' })
        .eq('id', user.id)
        .select()
        .single();

      console.log("Update test:", { updateData, updateError });

      setResults({
        user: {
          id: user.id,
          email: user.email
        },
        queryTest: { data: queryData, error: queryError },
        existingUserCheck: { data: existingUser, error: checkError },
        insertTest: { data: insertData, error: insertError },
        updateTest: { data: updateData, error: updateError }
      });

    } catch (error) {
      console.error("Test error:", error);
      setResults({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test RLS Policies</h1>
      
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="font-semibold mb-2">What this tests:</h2>
        <ul className="text-sm space-y-1">
          <li>• Can we query the users table?</li>
          <li>• Does the current user record exist?</li>
          <li>• Can we insert a new user record?</li>
          <li>• Can we update an existing user record?</li>
          <li>• What specific RLS policy errors occur?</li>
        </ul>
      </div>

      <button 
        onClick={testRLSPolicies}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test RLS Policies"}
      </button>

      {results && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Test Results:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>

          {results.error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
              <pre className="text-sm text-red-700">
                {JSON.stringify(results.error, null, 2)}
              </pre>
            </div>
          )}

          {results.insertTest?.error && (
            <div className="bg-orange-50 border border-orange-200 rounded p-4">
              <h3 className="font-semibold text-orange-800 mb-2">Insert Error Analysis:</h3>
              <div className="text-sm text-orange-700">
                <p><strong>Error Code:</strong> {results.insertTest.error.code}</p>
                <p><strong>Message:</strong> {results.insertTest.error.message}</p>
                <p><strong>Details:</strong> {results.insertTest.error.details}</p>
                <p><strong>Hint:</strong> {results.insertTest.error.hint}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 