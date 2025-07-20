"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

export default function TestSharingPage() {
  const [status, setStatus] = useState("Ready to test");
  const [results, setResults] = useState<any>({});
  const { user } = useAuth();

  const testSharingStatus = async () => {
    setStatus("Testing sharing status...");
    setResults({});

    try {
      if (!user) {
        setStatus("❌ No authenticated user");
        setResults({ error: "No authenticated user" });
        return;
      }

      console.log("Testing sharing for user:", user.email);

      // Test 1: Check owned pets
      const { data: ownedPets, error: ownedError } = await supabase
        .from('pets')
        .select('id, name, owner_id')
        .eq('owner_id', user.id);

      console.log("Owned pets:", { ownedPets, ownedError });

      // Test 2: Check pet_shares table structure
      const { data: sharesStructure, error: sharesStructureError } = await supabase
        .from('pet_shares')
        .select('*')
        .limit(1);

      console.log("Pet shares structure:", { sharesStructure, sharesStructureError });

      // Test 3: Check if there are any shares for this user's email
      const { data: sharedWithMe, error: sharedWithMeError } = await supabase
        .from('pet_shares')
        .select('*')
        .eq('shared_with_email', user.email);

      console.log("Shared with me:", { sharedWithMe, sharedWithMeError });

      // Test 4: Check if this user has shared any pets
      const { data: sharedByMe, error: sharedByMeError } = await supabase
        .from('pet_shares')
        .select('*')
        .eq('owner_id', user.id);

      console.log("Shared by me:", { sharedByMe, sharedByMeError });

      // Test 5: Get shared pet details
      let sharedPetDetails: any[] = [];
      if (sharedWithMe && sharedWithMe.length > 0) {
        const petIds = sharedWithMe.map(share => share.pet_id);
        const { data: sharedPets, error: sharedPetsError } = await supabase
          .from('pets')
          .select('id, name, owner_id')
          .in('id', petIds);

        console.log("Shared pet details:", { sharedPets, sharedPetsError });
        sharedPetDetails = sharedPets || [];
      }

      setResults({
        user: {
          id: user.id,
          email: user.email
        },
        ownedPets: {
          data: ownedPets,
          error: ownedError
        },
        sharesStructure: {
          data: sharesStructure,
          error: sharesStructureError
        },
        sharedWithMe: {
          data: sharedWithMe,
          error: sharedWithMeError
        },
        sharedByMe: {
          data: sharedByMe,
          error: sharedByMeError
        },
        sharedPetDetails: {
          data: sharedPetDetails,
          count: sharedPetDetails.length
        }
      });

      if (ownedPets && ownedPets.length > 0) {
        setStatus("✅ Found owned pets");
      } else if (sharedPetDetails.length > 0) {
        setStatus("✅ Found shared pets");
      } else {
        setStatus("⚠️ No pets found (owned or shared)");
      }

    } catch (error) {
      console.error("Sharing test error:", error);
      setStatus("❌ Test failed");
      setResults({ error: error });
    }
  };

  const createTestPet = async () => {
    if (!user) {
      setStatus("❌ No authenticated user");
      return;
    }

    setStatus("Creating test pet...");

    try {
      const { data, error } = await supabase
        .from('pets')
        .insert([{
          name: 'Test Pet',
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) {
        setStatus("❌ Failed to create test pet");
        setResults({ error: error });
      } else {
        setStatus("✅ Test pet created successfully");
        setResults({ 
          success: true,
          pet: data
        });
      }
    } catch (error) {
      console.error("Create pet error:", error);
      setStatus("❌ Create pet failed");
      setResults({ error: error });
    }
  };

  const shareTestPet = async () => {
    if (!user) {
      setStatus("❌ No authenticated user");
      return;
    }

    const partnerEmail = prompt("Enter partner's email address:");
    if (!partnerEmail) {
      setStatus("❌ No email provided");
      return;
    }

    setStatus("Sharing test pet...");

    try {
      // First, get the test pet
      const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('name', 'Test Pet')
        .single();

      if (petsError || !pets) {
        setStatus("❌ No test pet found");
        setResults({ error: "No test pet found" });
        return;
      }

      // Share the pet
      const { error: shareError } = await supabase
        .from('pet_shares')
        .insert([{
          pet_id: pets.id,
          owner_id: user.id,
          shared_with_email: partnerEmail,
          permission: 'view_and_log'
        }]);

      if (shareError) {
        setStatus("❌ Failed to share pet");
        setResults({ error: shareError });
      } else {
        setStatus("✅ Pet shared successfully");
        setResults({ 
          success: true,
          sharedWith: partnerEmail,
          pet: pets
        });
      }
    } catch (error) {
      console.error("Share pet error:", error);
      setStatus("❌ Share pet failed");
      setResults({ error: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pet Sharing Test</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testSharingStatus}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Sharing Status
        </button>
        
        <button 
          onClick={createTestPet}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
        >
          Create Test Pet
        </button>
        
        <button 
          onClick={shareTestPet}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 ml-2"
        >
          Share Test Pet
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-semibold text-blue-800">Status:</h2>
          <p className="text-blue-700">{status}</p>
        </div>

        {results.error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h2 className="font-semibold text-red-800">Error:</h2>
            <pre className="text-sm text-red-700">
              {JSON.stringify(results.error, null, 2)}
            </pre>
          </div>
        )}

        {results.user && (
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h2 className="font-semibold text-gray-800">User:</h2>
            <pre className="text-sm text-gray-700">
              {JSON.stringify(results.user, null, 2)}
            </pre>
          </div>
        )}

        {results.ownedPets && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h2 className="font-semibold text-yellow-800">Owned Pets:</h2>
            <pre className="text-sm text-yellow-700">
              {JSON.stringify(results.ownedPets, null, 2)}
            </pre>
          </div>
        )}

        {results.sharedWithMe && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800">Shared With Me:</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(results.sharedWithMe, null, 2)}
            </pre>
          </div>
        )}

        {results.sharedPetDetails && (
          <div className="bg-purple-50 border border-purple-200 rounded p-4">
            <h2 className="font-semibold text-purple-800">Shared Pet Details:</h2>
            <pre className="text-sm text-purple-700">
              {JSON.stringify(results.sharedPetDetails, null, 2)}
            </pre>
          </div>
        )}

        {results.success && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800">Success:</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(results.success, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-200 rounded p-4">
        <h3 className="font-semibold text-orange-800 mb-2">Instructions:</h3>
        <ol className="text-sm text-orange-700 space-y-1">
          <li>1. Click "Test Sharing Status" to see current pets and shares</li>
          <li>2. If no pets exist, click "Create Test Pet" to create one</li>
          <li>3. Click "Share Test Pet" to share with another email</li>
          <li>4. Sign up with the shared email to test sharing</li>
        </ol>
      </div>
    </div>
  );
} 