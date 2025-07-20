"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function DebugPetUsersPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testPetUsers = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      console.log("Testing pet users for user:", user.email);

      // Get all pets for this user (owned + shared)
      const { data: ownedPets, error: ownedError } = await supabase
        .from('pets')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .order('name');
        
      console.log("Owned pets:", { ownedPets, ownedError });

      const { data: sharedPets, error: sharedError } = await supabase
        .from('pet_shares')
        .select('pet_id')
        .eq('shared_with_email', user.email);
        
      console.log("Shared pet IDs:", { sharedPets, sharedError });

      let sharedPetDetails: any[] = [];
      if (sharedPets && sharedPets.length > 0) {
        const petIds = sharedPets.map(share => share.pet_id);
        const { data: sharedPetData, error: sharedPetError } = await supabase
          .from('pets')
          .select('id, name, owner_id')
          .in('id', petIds)
          .order('name');
        sharedPetDetails = sharedPetData || [];
        console.log("Shared pet details:", { sharedPetData, sharedPetError });
      }

      const allPets = [...(ownedPets || []), ...sharedPetDetails];
      console.log("All pets for user:", allPets);

      // Test the pet users loading logic
      const allUsers: { id: string; name: string; email: string }[] = [];
      
      for (const pet of allPets) {
        console.log(`Processing pet: ${pet.name} (${pet.id})`);
        const petUsers: { id: string; name: string; email: string }[] = [];
        
        // 1. Get the pet owner
        const { data: petData } = await supabase
          .from('pets')
          .select('owner_id')
          .eq('id', pet.id)
          .single();
        
        console.log(`Pet ${pet.name} owner_id:`, petData?.owner_id);
        
        if (petData?.owner_id) {
          const { data: ownerData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', petData.owner_id)
            .single();
          
          console.log(`Pet ${pet.name} owner data:`, ownerData);
          
          if (ownerData) {
            petUsers.push({
              id: ownerData.id,
              name: ownerData.name || ownerData.email?.split('@')[0] || 'Unknown',
              email: ownerData.email
            });
          }
        }
        
        // 2. Get all users who have access to this pet (shared)
        const { data: sharedUsers } = await supabase
          .from('pet_shares')
          .select('shared_with_email')
          .eq('pet_id', pet.id);
        
        console.log(`Pet ${pet.name} shared users:`, sharedUsers);
        
        if (sharedUsers) {
          for (const share of sharedUsers) {
            // Get user record by email
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('email', share.shared_with_email)
              .single();
            
            console.log(`Shared user data for ${share.shared_with_email}:`, userData);
            
            if (userData && !petUsers.find(u => u.id === userData.id)) {
              petUsers.push({
                id: userData.id,
                name: userData.name || userData.email?.split('@')[0] || 'Unknown',
                email: userData.email
              });
            }
          }
        }
        
        console.log(`Pet ${pet.name} final users:`, petUsers);
        allUsers.push(...petUsers);
      }
      
      // Remove duplicates
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      
      console.log("Final unique users:", uniqueUsers);

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
      setResult({ error: "Test failed", details: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Pet Users</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
          <p>ID: {user?.id || "N/A"}</p>
        </div>

        <button 
          onClick={testPetUsers}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Pet Users
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