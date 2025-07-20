"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

export default function TestTableStructurePage() {
  const [status, setStatus] = useState("Ready to test");
  const [results, setResults] = useState<any>({});
  const { user } = useAuth();

  const testTableStructure = async () => {
    setStatus("Testing table structure...");
    setResults({});

    try {
      if (!user) {
        setStatus("❌ No authenticated user");
        setResults({ error: "No authenticated user" });
        return;
      }

      console.log("Testing table structure for user:", user.email);

      // Test 1: Check if pet_shares table exists and has data
      const { data: petSharesData, error: petSharesError } = await supabase
        .from('pet_shares')
        .select('*');

      console.log("Pet shares table data:", { petSharesData, petSharesError });

      // Test 2: Check pets table
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*');

      console.log("Pets table data:", { petsData, petsError });

      // Test 3: Check users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      console.log("Users table data:", { usersData, usersError });

      // Test 4: Try to insert a test share
      const testShare = {
        pet_id: petsData?.[0]?.id || 'test-pet-id',
        owner_id: user.id,
        shared_with_email: user.email,
        permission: 'view_and_log'
      };

      console.log("Attempting to insert test share:", testShare);

      const { data: insertData, error: insertError } = await supabase
        .from('pet_shares')
        .insert([testShare])
        .select();

      console.log("Insert test share result:", { insertData, insertError });

      setResults({
        user: {
          id: user.id,
          email: user.email
        },
        petShares: {
          data: petSharesData,
          error: petSharesError,
          count: petSharesData?.length || 0
        },
        pets: {
          data: petsData,
          error: petsError,
          count: petsData?.length || 0
        },
        users: {
          data: usersData,
          error: usersError,
          count: usersData?.length || 0
        },
        insertTest: {
          data: insertData,
          error: insertError,
          attempted: testShare
        }
      });

      if (petSharesError) {
        setStatus("❌ Pet shares table error");
      } else if (petSharesData && petSharesData.length > 0) {
        setStatus("✅ Pet shares table has data");
      } else {
        setStatus("⚠️ Pet shares table exists but is empty");
      }

    } catch (error) {
      console.error("Table structure test error:", error);
      setStatus("❌ Test failed");
      setResults({ error: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Table Structure Test</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testTableStructure}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Table Structure
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-semibold text-blue-800">Status:</h2>
          <p className="text-blue-700">{status}</p>
        </div>

        {results.user && (
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h2 className="font-semibold text-gray-800">User:</h2>
            <pre className="text-sm text-gray-700">
              {JSON.stringify(results.user, null, 2)}
            </pre>
          </div>
        )}

        {results.petShares && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h2 className="font-semibold text-yellow-800">Pet Shares Table ({results.petShares.count} records):</h2>
            <pre className="text-sm text-yellow-700">
              {JSON.stringify(results.petShares.data, null, 2)}
            </pre>
          </div>
        )}

        {results.pets && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800">Pets Table ({results.pets.count} records):</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(results.pets.data, null, 2)}
            </pre>
          </div>
        )}

        {results.users && (
          <div className="bg-purple-50 border border-purple-200 rounded p-4">
            <h2 className="font-semibold text-purple-800">Users Table ({results.users.count} records):</h2>
            <pre className="text-sm text-purple-700">
              {JSON.stringify(results.users.data, null, 2)}
            </pre>
          </div>
        )}

        {results.insertTest && (
          <div className="bg-orange-50 border border-orange-200 rounded p-4">
            <h2 className="font-semibold text-orange-800">Insert Test:</h2>
            <pre className="text-sm text-orange-700">
              {JSON.stringify(results.insertTest, null, 2)}
            </pre>
          </div>
        )}

        {results.error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h2 className="font-semibold text-red-800">Error:</h2>
            <pre className="text-sm text-red-700">
              {JSON.stringify(results.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 