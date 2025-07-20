"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function TestCreateSharePage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [partnerEmail, setPartnerEmail] = useState("");

  const createTestPet = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      // Create a test pet
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .insert([{
          name: 'Test Pet',
          owner_id: user.id
        }])
        .select()
        .single();

      if (petError) {
        setResult({ error: "Failed to create test pet", details: petError });
        return;
      }

      setResult({ 
        message: "Test pet created successfully", 
        pet,
        nextStep: "Now share this pet with a partner email"
      });

    } catch (error) {
      setResult({ error: "Failed to create test pet", details: error });
    }
  };

  const sharePet = async () => {
    if (!user || !result?.pet || !partnerEmail) {
      setResult({ error: "Missing required data" });
      return;
    }

    try {
      // Create a share with the partner email
      const { data: share, error: shareError } = await supabase
        .from('pet_shares')
        .insert([{
          pet_id: result.pet.id,
          shared_with_email: partnerEmail,
          shared_by_id: user.id
        }])
        .select()
        .single();

      if (shareError) {
        setResult({ 
          ...result, 
          error: "Failed to create share", 
          shareError 
        });
        return;
      }

      setResult({ 
        ...result, 
        message: "Pet shared successfully", 
        share,
        partnerEmail,
        instructions: "Now sign in with the partner email to test"
      });

    } catch (error) {
      setResult({ 
        ...result, 
        error: "Failed to create share", 
        details: error 
      });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Create Share</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
        </div>

        <button 
          onClick={createTestPet}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Test Pet
        </button>

        {result?.pet && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold">Test Pet Created:</h3>
              <p>Name: {result.pet.name}</p>
              <p>ID: {result.pet.id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Partner Email:
              </label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="Enter partner's email"
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <button 
              onClick={sharePet}
              disabled={!partnerEmail}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
            >
              Share Pet
            </button>
          </div>
        )}

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