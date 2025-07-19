"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

type SharedPet = {
  id: string;
  name: string;
  owner_name: string;
  permission: string;
  created_at: string;
};

export default function SharedPetsPage() {
  const [sharedPets, setSharedPets] = useState<SharedPet[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSharedPets();
    }
  }, [user]);

  const fetchSharedPets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('pet_shares')
        .select(`
          pet_id,
          permission,
          created_at,
          pets!inner(name),
          users!pet_shares_owner_id_fkey(name)
        `)
        .eq('shared_with_id', user.id);

      if (error) {
        console.error('Error fetching shared pets:', error);
        return;
      }

      const formattedPets = data?.map((item: any) => ({
        id: item.pet_id,
        name: item.pets.name,
        owner_name: item.users.name || 'Unknown',
        permission: item.permission,
        created_at: new Date(item.created_at).toLocaleDateString()
      })) || [];

      setSharedPets(formattedPets);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Shared Pets</h1>
        <p>Please sign in to view shared pets.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pets Shared With You</h1>
      
      {loading ? (
        <p>Loading shared pets...</p>
      ) : sharedPets.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No pets have been shared with you yet. Ask someone to share a pet with your email: <strong>{user.email}</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sharedPets.map((pet) => (
            <div key={pet.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{pet.name}</h3>
                  <p className="text-gray-600">Shared by: {pet.owner_name}</p>
                  <p className="text-sm text-gray-500">Shared on: {pet.created_at}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pet.permission === 'full_access' ? 'bg-green-100 text-green-800' :
                    pet.permission === 'view_and_log' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {pet.permission.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">How to test sharing:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Share a pet with your partner's email from the Profile page</li>
          <li>Have your partner sign in with that email</li>
          <li>They should see the shared pet on this page</li>
          <li>Check the browser console for email notification logs</li>
        </ol>
      </div>
    </div>
  );
} 