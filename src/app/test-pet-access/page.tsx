"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function TestPetAccessPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testPetAccess = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      console.log("Testing pet_access for user:", user.email);

      // Test 1: Get all pets this user has access to via pet_access
      const { data: accessiblePets, error: accessibleError } = await supabase
        .from('pet_access')
        .select(`
          pet_id,
          access_level,
          permissions,
          status,
          access_period,
          pets!inner(id, name, owner_id)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      console.log("Accessible pets via pet_access:", { accessiblePets, accessibleError });

      // Test 2: Get all users who have access to each pet
      const petUsers: any[] = [];
      
      if (accessiblePets) {
        for (const access of accessiblePets) {
          const { data: petUsersData, error: petUsersError } = await supabase
            .from('pet_access')
            .select(`
              user_id,
              access_level,
              permissions,
              status,
              users!inner(id, name, email)
            `)
            .eq('pet_id', access.pet_id)
            .eq('status', 'active');

          const petName = (access.pets as any)?.name || 'Unknown';
          console.log(`Users with access to pet ${petName}:`, { petUsersData, petUsersError });
          
          if (petUsersData) {
            petUsers.push({
              pet: access.pets,
              users: petUsersData
            });
          }
        }
      }

      // Test 3: Compare with old system (pet_shares)
      const { data: oldSharedPets, error: oldSharedError } = await supabase
        .from('pet_shares')
        .select('*')
        .eq('shared_with_email', user.email);

      console.log("Old system shared pets:", { oldSharedPets, oldSharedError });

      setResult({
        user: {
          id: user.id,
          email: user.email
        },
        accessiblePets: {
          data: accessiblePets,
          error: accessibleError,
          count: accessiblePets?.length || 0
        },
        petUsers: {
          data: petUsers,
          count: petUsers.length
        },
        oldSystem: {
          data: oldSharedPets,
          error: oldSharedError,
          count: oldSharedPets?.length || 0
        }
      });

    } catch (error) {
      setResult({ error: "Test failed", details: error });
    }
  };

  const addTestSitter = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      // Get the first pet the user has access to
      const { data: accessiblePets } = await supabase
        .from('pet_access')
        .select('pet_id, pets!inner(id, name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (!accessiblePets || accessiblePets.length === 0) {
        setResult({ error: "No pets found to add sitter to" });
        return;
      }

      const pet = accessiblePets[0];
      
      // Create a test sitter access (simulating a pet sitter)
      const { data: sitterAccess, error: sitterError } = await supabase
        .from('pet_access')
        .insert([{
          pet_id: pet.pet_id,
          user_id: user.id, // Using current user as test sitter
          access_level: 'sitter',
          permissions: '{"can_edit_pet": false, "can_assign_tasks": false, "can_view_logs": true, "can_add_logs": true, "can_share_pet": false, "can_delete_pet": false}',
          status: 'active',
          access_period: '{"start_date": "2024-01-15T00:00:00Z", "end_date": "2024-01-20T23:59:59Z", "view_historical": false, "view_future": false, "can_view_before_period": false, "can_view_after_period": false}',
          created_by: user.id,
          notes: 'Test sitter access'
        }])
        .select()
        .single();

      if (sitterError) {
        setResult({ error: "Failed to add test sitter", details: sitterError });
      } else {
        setResult({ 
          message: "Test sitter access added successfully", 
          sitterAccess,
          instructions: "Now test the pet_access system again to see the sitter access"
        });
      }

    } catch (error) {
      setResult({ error: "Failed to add test sitter", details: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Pet Access System</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
          <p>ID: {user?.id || "N/A"}</p>
        </div>

        <div className="space-x-4">
          <button 
            onClick={testPetAccess}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test Pet Access
          </button>
          
          <button 
            onClick={addTestSitter}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Test Sitter
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