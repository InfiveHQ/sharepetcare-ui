"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function TestUsersPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testUserCreation = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test 1: Check if we can query the users table
      const { data: users, error: queryError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      console.log("Query test result:", { users, queryError });

      // Test 2: Try to create a test user
      const testUserId = crypto.randomUUID();
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: testUserId,
          email: `test-${Date.now()}@example.com`,
          name: 'Test User'
        }])
        .select();

      console.log("Insert test result:", { insertData, insertError });

      // Test 3: Try to delete the test user
      if (insertData) {
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', testUserId);

        console.log("Delete test result:", { deleteError });
      }

      setResult({
        queryTest: { users, queryError },
        insertTest: { insertData, insertError },
        deleteTest: { deleteError: insertData ? 'Success' : 'No user to delete' }
      });

    } catch (error) {
      console.error("Test error:", error);
      setResult({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Users Table</h1>
      
      <button 
        onClick={testUserCreation}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test User Creation"}
      </button>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Test Results:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-semibold mb-2">What this tests:</h3>
        <ul className="text-sm space-y-1">
          <li>• Can we query the users table?</li>
          <li>• Can we insert a new user?</li>
          <li>• Can we delete a user?</li>
          <li>• What specific errors occur?</li>
        </ul>
      </div>
    </div>
  );
} 