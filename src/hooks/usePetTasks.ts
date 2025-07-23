import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";

export type PetTask = {
  id: string;
  pet_id: string;
  pet_name: string;
  task_id: string;
  task_name: string;
  assigned_user_id: string;
  assigned_user_name: string;
  expected_time: string;
  frequency: string;
  instructions?: string;
};

// Cache for pet tasks to prevent disappearing data
let petTasksCache: PetTask[] = [];
let cacheUser: string | null = null;

// Helper functions for localStorage persistence
const getCachedPetTasks = (userId: string): PetTask[] => {
  try {
    const cached = localStorage.getItem(`petTasks_${userId}`);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const setCachedPetTasks = (userId: string, tasks: PetTask[]) => {
  try {
    localStorage.setItem(`petTasks_${userId}`, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to cache pet tasks:', error);
  }
};

const clearCachedPetTasks = (userId: string) => {
  try {
    localStorage.removeItem(`petTasks_${userId}`);
  } catch (error) {
    console.error('Failed to clear cached pet tasks:', error);
  }
};

export function usePetTasks() {
  const [petTasks, setPetTasks] = useState<PetTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useData();
  const { user, userRecord } = useAuth();

  // Initialize with cached data if available
  useEffect(() => {
    if (user?.id && userRecord) {
      const cachedTasks = getCachedPetTasks(user.id);
      if (cachedTasks.length > 0) {
        setPetTasks(cachedTasks);
        petTasksCache = cachedTasks;
        cacheUser = user.id;
        setLoading(false);
      }
    }
  }, [user?.id, userRecord]);

  const fetchPetTasks = async () => {
    if (!user || !userRecord) return;

    console.log("Fetching pet tasks for user:", user.id);
    
    // First, get the pets the user has access to (owned or shared)
    const { data: ownedPets, error: ownedError } = await supabase
      .from('pets')
      .select('id')
      .eq('owner_id', user.id);
      
    console.log("Owned pets query result:", { ownedPets, ownedError });
    
    // Get shared pets using email
    const { data: sharedPets, error: sharedError } = await supabase
      .from('pet_shares')
      .select('pet_id')
      .eq('shared_with_email', user.email);
      
    console.log("Shared pets query result:", { sharedPets, sharedError });
    
    let accessiblePetIds: string[] = [];
    if (ownedPets) {
      accessiblePetIds = [...accessiblePetIds, ...ownedPets.map(pet => pet.id)];
    }
    if (sharedPets) {
      accessiblePetIds = [...accessiblePetIds, ...sharedPets.map(share => share.pet_id)];
    }
    
    console.log("Accessible pet IDs:", accessiblePetIds);
    
    if (accessiblePetIds.length === 0) {
      console.log("No accessible pets found, setting empty pet tasks");
      setPetTasks([]);
      setLoading(false);
      return;
    }
    
    // Now fetch pet tasks only for accessible pets
    const { data, error } = await supabase
      .from("pet_tasks")
      .select(`
        id,
        pet_id,
        pets(name),
        task_id,
        tasks(name),
        assigned_user_id,
        users(name),
        expected_time,
        frequency,
        instructions
      `)
      .in('pet_id', accessiblePetIds)
      .order("expected_time");

    if (error) {
      console.error("Error fetching pet tasks:", error.message);
      console.error("Error details:", error);
    } else {
      console.log("Raw data from Supabase:", data);
      
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        pet_id: item.pet_id,
        pet_name: item.pets?.name || "",
        task_id: item.task_id,
        task_name: item.tasks?.name || "",
        assigned_user_id: item.assigned_user_id,
        assigned_user_name: item.users?.name || "",
        expected_time: item.expected_time,
        frequency: item.frequency,
        instructions: item.instructions || null
      })) || [];
      
      console.log("Formatted pet tasks:", formattedData);
      
      // Update cache and localStorage
      petTasksCache = formattedData;
      cacheUser = user?.id || null;
      
      if (user?.id) {
        setCachedPetTasks(user.id, formattedData);
      }
      
      setPetTasks(formattedData);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Clear cache if user changes
    if (user?.id !== cacheUser) {
      petTasksCache = [];
      cacheUser = null;
      clearCachedPetTasks(user?.id || '');
    }
    
    if (user && userRecord) {
      fetchPetTasks();
    }
  }, [refreshTrigger, user, userRecord]);

  const addPetTask = async (petTask: Omit<PetTask, 'id' | 'pet_name' | 'task_name' | 'assigned_user_name'>) => {
    if (!user) return;

    console.log("Adding pet task:", petTask);

    // Prepare the data to insert
    const insertData = {
      pet_id: petTask.pet_id,
      task_id: petTask.task_id,
      assigned_user_id: petTask.assigned_user_id,
      expected_time: petTask.expected_time || null,
      frequency: petTask.frequency || 'daily',
      instructions: petTask.instructions || null
    };

    console.log("Inserting data:", insertData);

    const { data, error } = await supabase
      .from("pet_tasks")
      .insert([insertData])
      .select();

    if (error) {
      console.error("Error adding pet task:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    } else {
      console.log("Successfully added pet task:", data);
      await fetchPetTasks();
      // Update cache after adding
      if (user?.id) {
        setCachedPetTasks(user.id, petTasks);
      }
      return data;
    }
  };

  const updatePetTask = async (id: string, updates: Partial<Omit<PetTask, 'id' | 'pet_name' | 'task_name' | 'assigned_user_name'>>) => {
    console.log("Updating pet task:", { id, updates });

    const { error } = await supabase
      .from("pet_tasks")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating pet task:", error);
      throw error;
    } else {
      await fetchPetTasks();
    }
  };

  const deletePetTask = async (id: string) => {
    const { error } = await supabase
      .from("pet_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting pet task:", error);
      throw error;
    } else {
      await fetchPetTasks();
    }
  };

  return { 
    petTasks, 
    loading, 
    addPetTask, 
    updatePetTask, 
    deletePetTask,
    refresh: fetchPetTasks 
  };
} 