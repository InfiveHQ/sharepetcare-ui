import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

// Cache for pets to prevent disappearing data
let petsCache: { id: string; name: string }[] = [];
let cacheUser: string | null = null;

// Helper functions for localStorage persistence
const getCachedPets = (userId: string): { id: string; name: string }[] => {
  try {
    const cached = localStorage.getItem(`pets_${userId}`);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const setCachedPets = (userId: string, pets: { id: string; name: string }[]) => {
  try {
    localStorage.setItem(`pets_${userId}`, JSON.stringify(pets));
  } catch (error) {
    console.error('Failed to cache pets:', error);
  }
};

export function usePets() {
  const [pets, setPets] = useState<{ id: string; name: string }[]>(petsCache);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Initialize with cached data if available
  useEffect(() => {
    if (user?.id) {
      const cachedPets = getCachedPets(user.id);
      if (cachedPets.length > 0) {
        console.log("Loading cached pets:", cachedPets.length);
        setPets(cachedPets);
        petsCache = cachedPets;
        cacheUser = user.id;
        setLoading(false);
      } else {
        console.log("No cached pets found for user:", user.id);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    async function fetchPets() {
      if (!user) return;

      console.log("Fetching pets for user:", user.id);
      
      // Get pets owned by the current user OR shared with the current user
      const { data: ownedPets, error: ownedError } = await supabase
        .from('pets')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .order('name');
        
      console.log("Owned pets query result:", { ownedPets, ownedError });
      
      // Get shared pets
      const { data: sharedPets, error: sharedError } = await supabase
        .from('pet_shares')
        .select('pet_id')
        .eq('shared_with_id', user.id);
        
      console.log("Shared pets query result:", { sharedPets, sharedError });
      
      let sharedPetIds: string[] = [];
      if (sharedPets) {
        sharedPetIds = sharedPets.map(share => share.pet_id);
      }
      
      // Get the actual shared pets
      let sharedPetDetails: any[] = [];
      if (sharedPetIds.length > 0) {
        const { data: sharedPetData, error: sharedPetError } = await supabase
          .from('pets')
          .select('id, name, owner_id')
          .in('id', sharedPetIds)
          .order('name');
        sharedPetDetails = sharedPetData || [];
        console.log("Shared pet details:", sharedPetDetails);
      }
      
      // Combine the results
      const allPets = [...(ownedPets || []), ...sharedPetDetails];
      console.log("Combined pets:", allPets);

      if (ownedError) {
        console.error("Error fetching pets:", ownedError.message);
      } else {
        // Update cache and localStorage
        petsCache = allPets;
        cacheUser = user?.id || null;
        
        if (user?.id) {
          setCachedPets(user.id, allPets);
        }
        
        setPets(allPets);
      }

      setLoading(false);
    }

    // Clear cache if user changes
    if (user?.id !== cacheUser) {
      petsCache = [];
      cacheUser = null;
    }

    fetchPets();
  }, [user]);

  return { pets, loading };
}
