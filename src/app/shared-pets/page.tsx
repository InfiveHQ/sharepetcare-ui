"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

interface PetShare {
  id: string;
  pet_id: string;
  pet_name: string;
  owner_email: string;
  shared_with_email: string;
  created_at: string;
}

interface Pet {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string;
}

export default function SharedPetsPage() {
  const { user } = useAuth();
  const [petShares, setPetShares] = useState<PetShare[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPetShares();
    }
  }, [user]);

  const loadPetShares = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading pet shares for user:", user?.email);

      // Get my pets first
      const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id);

      console.log("My pets query result:", { pets, petsError });

      if (petsError) {
        console.error("Error loading pets:", petsError);
        setError(`Failed to load pets: ${petsError.message}`);
        return;
      }

      // Get all pet shares where current user is involved (either as owner or shared with)
      const { data: shares, error: sharesError } = await supabase
        .from('pet_shares')
        .select('*')
        .or(`shared_with_email.eq.${user?.email}`);

      console.log("Pet shares query result:", { shares, sharesError });

      if (sharesError) {
        console.error("Error loading pet shares:", sharesError);
        setError(`Failed to load pet shares: ${sharesError.message}`);
        return;
      }

      // Get pets I've shared with others
      const { data: mySharedPets, error: mySharedError } = await supabase
        .from('pet_shares')
        .select('*')
        .in('pet_id', pets?.map(p => p.id) || []);

      console.log("My shared pets query result:", { mySharedPets, mySharedError });

      if (mySharedError) {
        console.error("Error loading my shared pets:", mySharedError);
      }

      // Combine all shares
      const allShares = [...(shares || []), ...(mySharedPets || [])];
      console.log("Combined shares:", allShares);

      // Get pet details for shared pets
      let sharedPetDetails: any[] = [];
      if (allShares && allShares.length > 0) {
        const petIds = allShares.map(share => share.pet_id);
        console.log("Getting details for pet IDs:", petIds);
        
        const { data: petData, error: petDataError } = await supabase
          .from('pets')
          .select('*')
          .in('id', petIds);

        console.log("Shared pet details query result:", { petData, petDataError });

        if (petDataError) {
          console.error("Error loading shared pet details:", petDataError);
        } else {
          sharedPetDetails = petData || [];
        }
      }

      // Get user details for pet owners
      let userDetails: any[] = [];
      if (sharedPetDetails.length > 0) {
        const ownerIds = [...new Set(sharedPetDetails.map(pet => pet.owner_id))];
        console.log("Getting user details for owner IDs:", ownerIds);
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', ownerIds);

        console.log("User details query result:", { userData, userError });

        if (userError) {
          console.error("Error loading user details:", userError);
        } else {
          userDetails = userData || [];
        }
      }

      // Transform the data for easier display
      const transformedShares: PetShare[] = allShares?.map((share: any) => {
        const petDetail = sharedPetDetails.find(pet => pet.id === share.pet_id);
        const ownerDetail = userDetails.find(user => user.id === petDetail?.owner_id);
        return {
          id: share.id,
          pet_id: share.pet_id,
          pet_name: petDetail?.name || 'Unknown Pet',
          owner_email: ownerDetail?.name || ownerDetail?.email || petDetail?.owner_id || 'Unknown',
          shared_with_email: share.shared_with_email,
          created_at: share.created_at
        };
      }) || [];

      // Transform pets data
      const transformedPets: Pet[] = pets?.map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        owner_id: pet.owner_id,
        owner_email: user?.email || ''
      })) || [];

      console.log("Final transformed data:", { 
        transformedShares, 
        transformedPets,
        sharesCount: allShares?.length || 0,
        petsCount: pets?.length || 0
      });

      setPetShares(transformedShares);
      setMyPets(transformedPets);
    } catch (err) {
      console.error("Error:", err);
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const removeShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('pet_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        console.error("Error removing share:", error);
        setError("Failed to remove share");
        return;
      }

      // Reload the data
      await loadPetShares();
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Shared Pets</h1>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Shared Pets</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const petsSharedByMe = petShares.filter(share => 
    myPets.some(pet => pet.id === share.pet_id)
  );

  const petsSharedWithMe = petShares.filter(share => 
    share.shared_with_email === user?.email
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shared Pets</h1>
        <div className="flex gap-3">
          <Button variant="outline" size="default" asChild>
            <a href="/profile">Profile</a>
          </Button>
          <Button variant="black" size="default" asChild>
            <a href="/">Dashboard</a>
          </Button>
        </div>
      </div>
      
      {/* Pets I've Shared */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-600">
          Pets I've Shared ({petsSharedByMe.length})
        </h2>
        {petsSharedByMe.length === 0 ? (
          <p className="text-gray-500">You haven't shared any pets yet.</p>
        ) : (
          <div className="space-y-4">
            {petsSharedByMe.map((share) => (
              <div key={share.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{share.pet_name}</h3>
                    <p className="text-gray-600">Shared with: {share.shared_with_email}</p>
                    <p className="text-sm text-gray-500">
                      Shared on: {new Date(share.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => removeShare(share.id)}
                  >
                    Remove Share
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pets Shared With Me */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-600">
          Pets Shared With Me ({petsSharedWithMe.length})
        </h2>
        {petsSharedWithMe.length === 0 ? (
          <p className="text-gray-500">No pets have been shared with you.</p>
        ) : (
          <div className="space-y-4">
            {petsSharedWithMe.map((share) => (
              <div key={share.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div>
                  <h3 className="font-semibold text-lg">{share.pet_name}</h3>
                  <p className="text-gray-600">Shared by: {share.owner_email}</p>
                  <p className="text-sm text-gray-500">
                    Shared on: {new Date(share.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <p className="text-sm text-gray-600">Total pet shares found: {petShares.length}</p>
        <p className="text-sm text-gray-600">Your pets: {myPets.length}</p>
        <p className="text-sm text-gray-600">Your email: {user?.email}</p>
      </div>
    </div>
  );
} 