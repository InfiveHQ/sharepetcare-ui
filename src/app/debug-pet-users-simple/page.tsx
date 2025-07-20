"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function DebugPetUsersSimplePage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testStepByStep = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      console.log("=== STEP BY STEP DEBUG ===");
      console.log("Current user:", user.email);

      // Step 1: Get all pets for this user
      const { data: ownedPets, error: ownedError } = await supabase
        .from('pets')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .order('name');
        
      console.log("Step 1 - Owned pets:", { ownedPets, ownedError });

      const { data: sharedPets, error: sharedError } = await supabase
        .from('pet_shares')
        .select('pet_id')
        .eq('shared_with_email', user.email);
        
      console.log("Step 1 - Shared pet IDs:", { sharedPets, sharedError });

      let sharedPetDetails: any[] = [];
      if (sharedPets && sharedPets.length > 0) {
        const petIds = sharedPets.map(share => share.pet_id);
        const { data: sharedPetData, error: sharedPetError } = await supabase
          .from('pets')
          .select('id, name, owner_id')
          .in('id', petIds)
          .order('name');
        sharedPetDetails = sharedPetData || [];
        console.log("Step 1 - Shared pet details:", { sharedPetData, sharedPetError });
      }

      const allPets = [...(ownedPets || []), ...sharedPetDetails];
      console.log("Step 1 - All pets for user:", allPets);

      // Step 2: For each pet, find all users with access
      const allUsers: { id: string; name: string; email: string }[] = [];
      
      for (const pet of allPets) {
        console.log(`\n=== PROCESSING PET: ${pet.name} (${pet.id}) ===`);
        
        // Step 2a: Get pet owner
        console.log(`Step 2a - Pet owner_id:`, pet.owner_id);
        
        if (pet.owner_id) {
          const { data: ownerData, error: ownerError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', pet.owner_id)
            .single();
          
          console.log(`Step 2a - Owner data:`, { ownerData, ownerError });
          
          if (ownerData) {
            allUsers.push({
              id: ownerData.id,
              name: ownerData.name || ownerData.email?.split('@')[0] || 'Unknown',
              email: ownerData.email
            });
          }
        }
        
        // Step 2b: Get shared users
        const { data: sharedUsers, error: sharedUsersError } = await supabase
          .from('pet_shares')
          .select('shared_with_email')
          .eq('pet_id', pet.id);
        
        console.log(`Step 2b - Shared users for pet ${pet.name}:`, { sharedUsers, sharedUsersError });
        
        if (sharedUsers) {
          for (const share of sharedUsers) {
            console.log(`Step 2b - Processing share:`, share);
            
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('email', share.shared_with_email)
              .single();
            
            console.log(`Step 2b - User data for ${share.shared_with_email}:`, { userData, userError });
            
            if (userData && !allUsers.find(u => u.id === userData.id)) {
              allUsers.push({
                id: userData.id,
                name: userData.name || userData.email?.split('@')[0] || 'Unknown',
                email: userData.email
              });
            }
          }
        }
      }
      
      console.log("\n=== FINAL RESULTS ===");
      console.log("All users found:", allUsers);
      
      // Remove duplicates
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      
      console.log("Unique users:", uniqueUsers);

      setResult({
        user: {
          id: user.id,
          email: user.email
        },
        allPets: {
          data: allPets,
          count: allPets.length
        },
        allUsers: {
          data: allUsers,
          count: allUsers.length
        },
        uniqueUsers: {
          data: uniqueUsers,
          count: uniqueUsers.length
        }
      });

    } catch (error) {
      console.error("Test failed:", error);
      setResult({ error: "Test failed", details: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Pet Users (Simple)</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
          <p>ID: {user?.id || "N/A"}</p>
        </div>

        <button 
          onClick={testStepByStep}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Step by Step
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