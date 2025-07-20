"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function TestUserCreationPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testUserCreation = async () => {
    if (!user) {
      setResult({ error: "No authenticated user found" });
      return;
    }

    try {
      // Test 1: Check if user record exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        setResult({ error: "Error checking existing user", details: checkError });
        return;
      }

      if (existingUser) {
        setResult({ message: "User record already exists", data: existingUser });
        return;
      }

      // Test 2: Try to create user record
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        }])
        .select()
        .single();

      if (createError) {
        setResult({ error: "Failed to create user record", details: createError });
      } else {
        setResult({ message: "User record created successfully", data: newUser });
      }
    } catch (error) {
      setResult({ error: "Unexpected error", details: error });
    }
  };

  const checkRLSPolicies = async () => {
    try {
      // Test RLS policies by trying different operations
      const tests = [];

      // Test SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      tests.push({ operation: 'SELECT', success: !selectError, error: selectError });

      // Test INSERT (if user doesn't exist)
      if (user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            name: 'Test User'
          }]);
        tests.push({ operation: 'INSERT', success: !insertError, error: insertError });
      }

      // Test UPDATE
      if (user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ name: 'Updated Test User' })
          .eq('id', user.id);
        tests.push({ operation: 'UPDATE', success: !updateError, error: updateError });
      }

      setResult({ message: "RLS Policy Tests", tests });
    } catch (error) {
      setResult({ error: "RLS test error", details: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test User Creation</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
          <p>ID: {user?.id || "N/A"}</p>
        </div>

        <div className="space-x-4">
          <button 
            onClick={testUserCreation}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test User Creation
          </button>
          
          <button 
            onClick={checkRLSPolicies}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Test RLS Policies
          </button>
        </div>

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