"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

export default function DebugSharingPage() {
  const [status, setStatus] = useState("Ready to debug");
  const [results, setResults] = useState<any>({});
  const { user } = useAuth();

  const debugSharing = async () => {
    setStatus("Debugging sharing...");
    setResults({});

    try {
      if (!user) {
        setStatus("❌ No authenticated user");
        setResults({ error: "No authenticated user" });
        return;
      }

      console.log("Debugging sharing for user:", user.email);

      // Step 1: Check all pet_shares records
      const { data: allShares, error: allSharesError } = await supabase
        .from('pet_shares')
        .select('*');

            console.log("All pet shares:", { allShares, allSharesError });
      console.log("All pet shares error details:", allSharesError);
      
      // Step 2: Check shares for this specific email
      const { data: sharesForEmail, error: sharesForEmailError } = await supabase
        .from('pet_shares')
        .select('*')
        .eq('shared_with_email', user.email);

      console.log("Shares for this email:", { sharesForEmail, sharesForEmailError });
      console.log("Shares for this email error details:", sharesForEmailError);

      // Step 2.5: Check for exact string matching
      if (user.email) {
        console.log("User email:", `"${user.email}"`);
        console.log("User email length:", user.email.length);
        console.log("User email char codes:", Array.from(user.email).map((c: string) => c.charCodeAt(0)));
        
        if (allShares && allShares.length > 0) {
          console.log("All shared_with_email values:");
          allShares.forEach((share, index) => {
            console.log(`Share ${index}:`, `"${share.shared_with_email}"`);
            console.log(`Share ${index} length:`, share.shared_with_email.length);
            console.log(`Share ${index} char codes:`, Array.from(share.shared_with_email).map((c: any) => c.charCodeAt(0)));
            console.log(`Exact match:`, share.shared_with_email === user.email);
          });
        }
      }

      // Step 3: Check if there are any pets at all
      const { data: allPets, error: allPetsError } = await supabase
        .from('pets')
        .select('*');

            console.log("All pets:", { allPets, allPetsError });
      console.log("All pets error details:", allPetsError);
      
      // Step 4: Check owned pets
      const { data: ownedPets, error: ownedPetsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id);

      console.log("Owned pets:", { ownedPets, ownedPetsError });
      console.log("Owned pets error details:", ownedPetsError);

      // Step 5: Get pet details for shared pets
      let sharedPetDetails: any[] = [];
      if (sharesForEmail && sharesForEmail.length > 0) {
        const petIds = sharesForEmail.map(share => share.pet_id);
        const { data: sharedPets, error: sharedPetsError } = await supabase
          .from('pets')
          .select('*')
          .in('id', petIds);

        console.log("Shared pet details:", { sharedPets, sharedPetsError });
        sharedPetDetails = sharedPets || [];
      }

      // Step 6: Test the exact profile page queries
      console.log("=== TESTING PROFILE PAGE QUERIES ===");
      
      // Test 1: Profile page owned pets query
      const { data: profileOwnedPets, error: profileOwnedError } = await supabase
        .from('pets')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .order('name');
        
      console.log("Profile owned pets query:", { profileOwnedPets, profileOwnedError });
      
      // Test 2: Profile page shared pets query
      const { data: profileSharedPets, error: profileSharedError } = await supabase
        .from('pet_shares')
        .select('pet_id')
        .eq('shared_with_email', user.email);
        
      console.log("Profile shared pets query:", { profileSharedPets, profileSharedError });
      
      // Test 3: Profile page shared pet details query
      let profileSharedPetDetails: any[] = [];
      if (profileSharedPets && profileSharedPets.length > 0) {
        const profilePetIds = profileSharedPets.map(share => share.pet_id);
        const { data: profileSharedPetData, error: profileSharedPetError } = await supabase
          .from('pets')
          .select('id, name, owner_id')
          .in('id', profilePetIds)
          .order('name');
        profileSharedPetDetails = profileSharedPetData || [];
        console.log("Profile shared pet details:", { profileSharedPetData, profileSharedPetError });
      }

      setResults({
        user: {
          id: user.id,
          email: user.email
        },
        allShares: {
          data: allShares,
          error: allSharesError,
          count: allShares?.length || 0
        },
        sharesForEmail: {
          data: sharesForEmail,
          error: sharesForEmailError,
          count: sharesForEmail?.length || 0
        },
        allPets: {
          data: allPets,
          error: allPetsError,
          count: allPets?.length || 0
        },
        ownedPets: {
          data: ownedPets,
          error: ownedPetsError,
          count: ownedPets?.length || 0
        },
        sharedPetDetails: {
          data: sharedPetDetails,
          count: sharedPetDetails.length
        },
        profileQueries: {
          ownedPets: {
            data: profileOwnedPets,
            error: profileOwnedError,
            count: profileOwnedPets?.length || 0
          },
          sharedPets: {
            data: profileSharedPets,
            error: profileSharedError,
            count: profileSharedPets?.length || 0
          },
          sharedPetDetails: {
            data: profileSharedPetDetails,
            count: profileSharedPetDetails.length
          }
        }
      });

      if (sharesForEmail && sharesForEmail.length > 0) {
        setStatus("✅ Found shares for this email");
      } else {
        setStatus("⚠️ No shares found for this email");
      }

    } catch (error) {
      console.error("Debug error:", error);
      setStatus("❌ Debug failed");
      setResults({ error: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Sharing</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={debugSharing}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Debug Sharing
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

        {results.allShares && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h2 className="font-semibold text-yellow-800">All Pet Shares ({results.allShares.count}):</h2>
            <pre className="text-sm text-yellow-700">
              {JSON.stringify(results.allShares.data, null, 2)}
            </pre>
          </div>
        )}

        {results.sharesForEmail && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800">Shares For This Email ({results.sharesForEmail.count}):</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(results.sharesForEmail.data, null, 2)}
            </pre>
          </div>
        )}

        {results.allPets && (
          <div className="bg-purple-50 border border-purple-200 rounded p-4">
            <h2 className="font-semibold text-purple-800">All Pets ({results.allPets.count}):</h2>
            <pre className="text-sm text-purple-700">
              {JSON.stringify(results.allPets.data, null, 2)}
            </pre>
          </div>
        )}

        {results.ownedPets && (
          <div className="bg-orange-50 border border-orange-200 rounded p-4">
            <h2 className="font-semibold text-orange-800">Owned Pets ({results.ownedPets.count}):</h2>
            <pre className="text-sm text-orange-700">
              {JSON.stringify(results.ownedPets.data, null, 2)}
            </pre>
          </div>
        )}

        {results.sharedPetDetails && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="font-semibold text-blue-800">Shared Pet Details ({results.sharedPetDetails.count}):</h2>
            <pre className="text-sm text-blue-700">
              {JSON.stringify(results.sharedPetDetails.data, null, 2)}
            </pre>
          </div>
        )}

        {results.profileQueries && (
          <div className="bg-indigo-50 border border-indigo-200 rounded p-4">
            <h2 className="font-semibold text-indigo-800">Profile Page Queries:</h2>
            <pre className="text-sm text-indigo-700">
              {JSON.stringify(results.profileQueries, null, 2)}
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