"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function DebugPetTasksPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testPetTasks = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      console.log("Testing pet tasks for user:", user.email);

      // Test 1: Get all pets (owned + shared)
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

      // Test 2: Get all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, name')
        .order('name');

      console.log("Tasks:", { tasks, tasksError });

      // Test 3: Get existing pet tasks
      const { data: petTasks, error: petTasksError } = await supabase
        .from('pet_tasks')
        .select('*');

      console.log("Pet tasks:", { petTasks, petTasksError });

      // Test 4: Check which pets can have tasks assigned
      const petTaskAnalysis = allPets.map(pet => {
        const petTasksForPet = petTasks?.filter(pt => pt.pet_id === pet.id) || [];
        const isOwned = pet.owner_id === user.id;
        const isShared = !isOwned;
        
        return {
          pet,
          isOwned,
          isShared,
          existingPetTasks: petTasksForPet,
          canAssignTasks: true // Both owned and shared pets should allow task assignment
        };
      });

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
        tasks: {
          data: tasks,
          error: tasksError,
          count: tasks?.length || 0
        },
        petTasks: {
          data: petTasks,
          error: petTasksError,
          count: petTasks?.length || 0
        },
        petTaskAnalysis
      });

    } catch (error) {
      setResult({ error: "Test failed", details: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Pet Tasks</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
          <p>ID: {user?.id || "N/A"}</p>
        </div>

        <button 
          onClick={testPetTasks}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Pet Tasks
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