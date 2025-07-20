"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function DebugProfileQuerySimplePage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testProfileQuery = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      console.log("=== TESTING PROFILE PAGE QUERY ===");
      console.log("User email:", user.email);

      // Test 1: Get owned pets (exact profile page query)
      const { data: ownedPets, error: ownedError } = await supabase
        .from('pets')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .order('name');
        
      console.log("Owned pets query result:", { ownedPets, ownedError });

      // Test 2: Get shared pet IDs (exact profile page query)
      const { data: sharedPets, error: sharedError } = await supabase
        .from('pet_shares')
        .select('pet_id')
        .eq('shared_with_email', user.email);
        
      console.log("Shared pets query result:", { sharedPets, sharedError });

      // Test 3: Get shared pet details (exact profile page query)
      let sharedPetDetails: any[] = [];
      if (sharedPets && sharedPets.length > 0) {
        const petIds = sharedPets.map(share => share.pet_id);
        console.log("Pet IDs to fetch:", petIds);
        
        const { data: sharedPetData, error: sharedPetError } = await supabase
          .from('pets')
          .select('id, name, owner_id')
          .in('id', petIds)
          .order('name');
        sharedPetDetails = sharedPetData || [];
        console.log("Shared pet details query result:", { sharedPetData, sharedPetError });
      }

      // Test 4: Combine results (exact profile page logic)
      const allPets = [...(ownedPets || []), ...sharedPetDetails];
      console.log("Combined pets result:", allPets);

      setResult({
        user: {
          id: user.id,
          email: user.email
        },
        ownedPets: {
          data: ownedPets,
          error: ownedError,
          count: ownedPets?.length || 0
        },
        sharedPets: {
          data: sharedPets,
          error: sharedError,
          count: sharedPets?.length || 0
        },
        sharedPetDetails: {
          data: sharedPetDetails,
          count: sharedPetDetails.length
        },
        allPets: {
          data: allPets,
          count: allPets.length
        }
      });

    } catch (error) {
      console.error("Test failed:", error);
      setResult({ error: "Test failed", details: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Profile Query (Simple)</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
          <p>ID: {user?.id || "N/A"}</p>
        </div>

        <button 
          onClick={testProfileQuery}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Profile Query
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