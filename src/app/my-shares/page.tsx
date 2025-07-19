"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

type MyShare = {
  id: string;
  pet_name: string;
  shared_with_email: string;
  shared_with_name: string;
  permission: string;
  created_at: string;
};

export default function MySharesPage() {
  const [myShares, setMyShares] = useState<MyShare[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMyShares();
    }
  }, [user]);

  const fetchMyShares = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('pet_shares')
        .select(`
          id,
          permission,
          created_at,
          pets!inner(name),
          users!pet_shares_shared_with_id_fkey(email, name)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my shares:', error);
        return;
      }

      const formattedShares = data?.map((item: any) => ({
        id: item.id,
        pet_name: item.pets.name,
        shared_with_email: item.users.email,
        shared_with_name: item.users.name || 'Unknown',
        permission: item.permission,
        created_at: new Date(item.created_at).toLocaleDateString()
      })) || [];

      setMyShares(formattedShares);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Shared Pets</h1>
        <p>Please sign in to view your shared pets.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pets I've Shared</h1>
      
      {loading ? (
        <p>Loading your shares...</p>
      ) : myShares.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You haven't shared any pets yet. Go to the Profile page to share pets with others.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myShares.map((share) => (
            <div key={share.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{share.pet_name}</h3>
                  <p className="text-gray-600">Shared with: {share.shared_with_name} ({share.shared_with_email})</p>
                  <p className="text-sm text-gray-500">Shared on: {share.created_at}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    share.permission === 'full_access' ? 'bg-green-100 text-green-800' :
                    share.permission === 'view_and_log' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {share.permission.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">How to verify sharing worked:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check this page to see what you've shared</li>
          <li>Go to <code>/shared-pets</code> to see pets shared with you</li>
          <li>Check browser console for email notification logs</li>
          <li>Have your partner sign in and check their shared pets</li>
        </ol>
      </div>
    </div>
  );
} 