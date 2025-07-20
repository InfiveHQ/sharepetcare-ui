"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { usePetTasks, PetTask } from "@/hooks/usePetTasks";
import { supabase } from "@/utils/supabase";
import PetTaskAssignment from "@/components/pet-task-assignment";
import SharePetModal from "@/components/share-pet-modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// dnd-kit sortable refactor for task list
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Pet = {
  id: string;
  name: string;
  owner_id?: string;
};

type Task = {
  id: string;
  name: string;
  icon?: string;
  default_time?: string;
  default_user?: string;
  sort_order?: number;
};

export default function ProfilePage() {
  const { user, userRecord, loading: authLoading } = useAuth();
  const { triggerRefresh } = useData();
  const { petTasks, addPetTask, updatePetTask, deletePetTask } = usePetTasks();
  const [name, setName] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Pet task management state
  const [showAddPetTask, setShowAddPetTask] = useState(false);
  const [showEditPetTask, setShowEditPetTask] = useState(false);
  const [selectedPetForTask, setSelectedPetForTask] = useState("");
  const [editingPetTask, setEditingPetTask] = useState<PetTask | null>(null);
  const [newPetTask, setNewPetTask] = useState({
    pet_id: "",
    task_id: "",
    assigned_user_id: user?.id || "",
    expected_time: "",
    frequency: "daily",
    instructions: ""
  });

  // Debug logging
  console.log("Profile page render:", {
    user: user?.id,
    userRecord: userRecord?.id,
    authLoading,
    dataLoaded
  });

  // Load current user data and pets
  useEffect(() => {
    const loadData = async () => {
      if (user && userRecord && !dataLoaded) {
        console.log("Profile: Loading data for user:", user.id);
        setDataLoaded(true);
        
        try {
          // Load user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setName(userData.name || "");
            console.log("Profile: User name loaded:", userData.name);
          }

          // Load pets owned by the current user
          const { data: ownedPets, error: ownedError } = await supabase
            .from('pets')
            .select('id, name, owner_id')
            .eq('owner_id', user.id)
            .order('name');
            
          console.log("Profile: Owned pets query result:", { ownedPets, ownedError });
          
          // Load shared pets using email-based sharing
          const { data: sharedPets, error: sharedError } = await supabase
            .from('pet_shares')
            .select('pet_id')
            .eq('shared_with_email', user.email);
            
          console.log("Profile: Shared pets query result:", { sharedPets, sharedError });
          
          let sharedPetIds: string[] = [];
          if (sharedPets) {
            sharedPetIds = sharedPets.map(share => share.pet_id);
          }
          
          // Get shared pet details if needed
          let sharedPetDetails: any[] = [];
          if (sharedPetIds.length > 0) {
            const { data: sharedPetData, error: sharedPetError } = await supabase
              .from('pets')
              .select('id, name, owner_id')
              .in('id', sharedPetIds)
              .order('name');
            sharedPetDetails = sharedPetData || [];
            console.log("Profile: Shared pet details:", sharedPetDetails);
          }
          
          // Combine the results
          const allPets = [...(ownedPets || []), ...sharedPetDetails];
          console.log("Profile: Combined pets:", allPets);
          
          if (allPets.length > 0) {
            setPets(allPets);
            console.log("Profile: Set pets:", allPets);
          } else {
            console.log("Profile: No pets found for user");
          }

          // Load tasks
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('id, name, icon, default_time, default_user, sort_order')
            .order('sort_order', { ascending: true });

          if (tasksData) {
            setTasks(tasksData);
            console.log("Profile: Tasks loaded:", tasksData.length);
          }
        } catch (error) {
          console.error("Profile loading error:", error);
          // Reset dataLoaded so it can retry
          setDataLoaded(false);
          alert(`Failed to load profile: ${error.message}`);
        }
      }
    };
    loadData();
  }, [user, userRecord, dataLoaded]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to update your profile' });
      return;
    }

    console.log("=== UPDATING PROFILE ===");
    console.log("User ID:", user.id);
    console.log("New name:", name);

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', user.id)
        .select();

      console.log("Profile update result:", { data, error });

      if (error) {
        console.error("Failed to update profile:", error);
        setMessage({ type: 'error', text: `Failed to update profile: ${error.message}` });
      } else {
        console.log("Profile updated successfully:", data);
        
        // Let's verify the update actually happened by fetching the user data again
        const { data: verifyData, error: verifyError } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', user.id)
          .single();
          
        console.log("Verification query result:", { verifyData, verifyError });
        
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Trigger global refresh immediately
        triggerRefresh();
        // Dispatch custom event for pet task assignment component
        window.dispatchEvent(new Event('dataRefreshed'));
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setMessage(null);
    
    console.log("=== SAVE CHANGES STARTED ===");
    console.log("Current pets:", pets);
    console.log("Current tasks:", tasks);
    
    try {
      // Trigger global refresh to update dashboard
      console.log("Triggering global refresh...");
      triggerRefresh();
      
      // Dispatch custom event for pet task assignment component
      console.log("Dispatching dataRefreshed event...");
      window.dispatchEvent(new Event('dataRefreshed'));
      
      // Dispatch event to refresh dashboard
      console.log("Dispatching dashboard refresh event...");
      window.dispatchEvent(new Event('dashboardRefresh'));
      
      console.log("=== SAVE CHANGES COMPLETED ===");
      setMessage({ type: 'success', text: 'Changes saved successfully! Redirecting to dashboard...' });
      setHasUnsavedChanges(false);
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error("Failed to save changes:", error);
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePet = async (petId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('pets')
        .update({ name: newName })
        .eq('id', petId);

      if (error) {
        console.error("Failed to update pet:", error);
        setMessage({ type: 'error', text: `Failed to update pet: ${error.message}` });
      } else {
        // Update the pets list
        setPets(pets.map(pet => 
          pet.id === petId ? { ...pet, name: newName } : pet
        ));
        setMessage({ type: 'success', text: 'Pet updated successfully!' });
        console.log("Setting hasUnsavedChanges to true after pet update");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  const handleAddPet = async (petName: string) => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .insert([{ 
          name: petName,
          owner_id: user?.id
        }])
        .select();

      if (error) {
        console.error("Failed to add pet:", error);
        setMessage({ type: 'error', text: `Failed to add pet: ${error.message}` });
      } else {
        // Add the new pet to the list
        setPets([...pets, ...(data || [])]);
        setMessage({ type: 'success', text: 'Pet added successfully!' });
        console.log("Setting hasUnsavedChanges to true after adding pet");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  const handleUpdateTask = async (taskId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ name: newName })
        .eq('id', taskId);

      if (error) {
        console.error("Failed to update task:", error);
        setMessage({ type: 'error', text: `Failed to update task: ${error.message}` });
      } else {
        // Update the tasks list
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, name: newName } : task
        ));
        setMessage({ type: 'success', text: 'Task updated successfully!' });
        console.log("Setting hasUnsavedChanges to true after updating task");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  const handleAddTask = async (taskName: string) => {
    console.log("=== ADDING TASK ===");
    console.log("Task name:", taskName);
    console.log("Current user:", user?.id);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          name: taskName,
          sort_order: tasks.length + 1
        }])
        .select();

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Failed to add task:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setMessage({ type: 'error', text: `Failed to add task: ${error.message || 'Unknown error'}` });
      } else {
        // Add the new task to the list
        console.log("Adding task to local state:", data);
        setTasks([...tasks, ...(data || [])]);
        setMessage({ type: 'success', text: 'Task added successfully!' });
        console.log("Setting hasUnsavedChanges to true after adding task");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  const handleAddPetTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    console.log("=== STARTING PET TASK ADDITION ===");
    console.log("Form data:", newPetTask);
    console.log("Current user:", user?.id);

    try {
      // Quick validation
      if (!newPetTask.pet_id || !newPetTask.task_id || !newPetTask.assigned_user_id) {
        throw new Error("Missing required fields: pet_id, task_id, or assigned_user_id");
      }

      // Test basic table access
      console.log("Testing table access...");
      const { data: testData, error: testError } = await supabase
        .from('pet_tasks')
        .select('id')
        .limit(1);
      
      console.log("Table access test:", { data: testData, error: testError });

      // Test foreign key references
      console.log("Testing foreign keys...");
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('id, name, owner_id')
        .eq('id', newPetTask.pet_id);
      
      console.log("Pet reference test:", { data: petData, error: petError });

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('id, name')
        .eq('id', newPetTask.task_id);
      
      console.log("Task reference test:", { data: taskData, error: taskError });

      // Now try the actual insert
      console.log("Attempting to add pet task...");
      await addPetTask(newPetTask);
      
      console.log("Pet task added successfully!");
      setMessage({ type: 'success', text: 'Pet task assigned successfully!' });
      setShowAddPetTask(false);
      setNewPetTask({
        pet_id: "",
        task_id: "",
        assigned_user_id: "",
        expected_time: "",
        frequency: "daily",
        instructions: ""
      });
      triggerRefresh();
    } catch (error) {
      console.error("=== PET TASK ADDITION FAILED ===");
      console.error("Error details:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Failed to assign pet task: ${errorMessage}` });
    } finally {
      setLoading(false);
      console.log("=== PET TASK ADDITION COMPLETE ===");
    }
  };

  const handleEditPetTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!editingPetTask) return;

    try {
      await updatePetTask(editingPetTask.id, {
        pet_id: editingPetTask.pet_id,
        task_id: editingPetTask.task_id,
        assigned_user_id: editingPetTask.assigned_user_id,
        expected_time: editingPetTask.expected_time,
        frequency: editingPetTask.frequency,
        instructions: editingPetTask.instructions
      });
      
      setMessage({ type: 'success', text: 'Pet task updated successfully!' });
      setShowEditPetTask(false);
      setEditingPetTask(null);
      triggerRefresh();
    } catch (error) {
      console.error("Failed to update pet task:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Failed to update pet task: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePetTask = async (petTaskId: string) => {
    try {
      await deletePetTask(petTaskId);
      setMessage({ type: 'success', text: 'Pet task removed successfully!' });
      triggerRefresh();
    } catch (error) {
      console.error("Failed to delete pet task:", error);
      setMessage({ type: 'error', text: 'Failed to remove pet task' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error("Failed to delete task:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        let errorMessage = 'Unknown error';
        if (error.code === '23503') {
          errorMessage = 'Cannot delete task because it has associated task logs. Please remove the logs first.';
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.code) {
          errorMessage = `Database error: ${error.code}`;
        }
        
        setMessage({ type: 'error', text: `Failed to delete task: ${errorMessage}` });
      } else {
        // Remove the task from the list
        setTasks(tasks.filter(task => task.id !== taskId));
        setMessage({ type: 'success', text: 'Task deleted successfully!' });
        console.log("Setting hasUnsavedChanges to true after deleting task");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  const handleMoveTask = async (taskId: string, direction: 'up' | 'down') => {
    const currentIndex = tasks.findIndex(task => task.id === taskId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tasks.length) return;

    // Create new array with reordered tasks
    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(currentIndex, 1);
    newTasks.splice(newIndex, 0, movedTask);

    // Update sort_order for all tasks
    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      sort_order: index + 1
    }));

    try {
      // Update all tasks with new sort_order
      const { error } = await supabase
        .from('tasks')
        .upsert(updatedTasks.map(task => ({
          id: task.id,
          name: task.name,
          sort_order: task.sort_order
        })));

      if (error) {
        console.error("Failed to reorder tasks:", error);
        setMessage({ type: 'error', text: `Failed to reorder tasks: ${error.message}` });
      } else {
        setTasks(updatedTasks);
        setMessage({ type: 'success', text: 'Task order updated successfully!' });
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  const handleReorderTasks = async (draggedTaskId: string, targetTaskId: string) => {
    console.log('handleReorderTasks called:', { draggedTaskId, targetTaskId });
    
    const draggedIndex = tasks.findIndex(task => task.id === draggedTaskId);
    const targetIndex = tasks.findIndex(task => task.id === targetTaskId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Create new array with reordered tasks
    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, movedTask);

    // Update sort_order for all tasks
    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      sort_order: index + 1
    }));

    try {
      // Update all tasks with new sort_order
      const { error } = await supabase
        .from('tasks')
        .upsert(updatedTasks.map(task => ({
          id: task.id,
          name: task.name,
          sort_order: task.sort_order
        })));

      if (error) {
        console.error("Failed to reorder tasks:", error);
        setMessage({ type: 'error', text: `Failed to reorder tasks: ${error.message}` });
      } else {
        setTasks(updatedTasks);
        setMessage({ type: 'success', text: 'Task order updated successfully!' });
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  const handleDeletePet = async (petId: string) => {
    console.log("=== DELETING PET ===");
    console.log("Pet ID:", petId);
    console.log("Current user:", user?.id);
    
    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      console.log("Delete response:", { error });

      if (error) {
        console.error("Failed to delete pet:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("Error code:", error.code);
        console.error("Error hint:", error.hint);
        console.error("Error details:", error.details);
        
        let errorMessage = 'Unknown error';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.code === '23503') {
          errorMessage = 'Cannot delete pet because it has associated task logs or assignments. Please remove them first.';
        } else if (error.code) {
          errorMessage = `Database error: ${error.code}`;
        }
        
        setMessage({ type: 'error', text: `Failed to delete pet: ${errorMessage}` });
      } else {
        // Remove the pet from the list
        console.log("Pet deleted from database, updating local state");
        setPets(pets.filter(pet => pet.id !== petId));
        setMessage({ type: 'success', text: 'Pet deleted successfully!' });
        console.log("Setting hasUnsavedChanges to true after deleting pet");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  // --- dnd-kit sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // --- dnd-kit drag end handler ---
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(newTasks);
    // Update sort_order in DB
    const updatedTasks = newTasks.map((task, idx) => ({ ...task, sort_order: idx + 1 }));
    await supabase.from('tasks').upsert(updatedTasks.map(({ id, name, sort_order }) => ({ id, name, sort_order })));
    setHasUnsavedChanges(true);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Profile</h1>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Profile</h1>
          <p className="text-center text-gray-600 mb-4">Please sign in to view your profile</p>
          <a href="/" className="block text-center text-blue-600 underline">
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  // Show loading if user exists but userRecord is still loading
  if (user && !userRecord && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Profile</h1>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up your profile...</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user record doesn't exist
  if (!userRecord && user && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6 text-red-600">Profile Not Found</h1>
          <div className="text-center text-gray-600 mb-6">
            <p className="mb-2">Your profile could not be found in the database.</p>
            <p className="text-sm">This might happen if your account was deleted or there was an error during account creation.</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Profile & Management</h1>
            <Button variant="black" size="default" asChild>
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
          
          <div className="space-y-8">
            {/* User Profile Section */}
            <div className="bg-white rounded-lg p-6 border">
              <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border rounded-lg p-3 bg-gray-50"
                    value={user.email || ""}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-3"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  variant="black"
                  size="lg"
                  className="w-full"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </div>

            {/* Pets Section */}
            <div className="bg-white rounded-lg p-6 border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Your Pets</h2>
                <Button variant="outline" size="sm" asChild>
                  <a href="/shared-pets">Shared Pets</a>
                </Button>
              </div>
              <div className="space-y-3">
                {pets.map((pet) => (
                  <PetItem 
                    key={pet.id} 
                    pet={pet} 
                    onUpdate={handleUpdatePet}
                    onDelete={handleDeletePet}
                  />
                ))}
                <AddPetForm onAdd={handleAddPet} />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-lg p-6 border">
              <h2 className="text-lg font-semibold mb-4">Your Tasks</h2>
              <p className="text-sm text-gray-600 mb-4">Drag tasks by the ⋮⋮ handle to reorder them</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {tasks.map((task, index) => (
                      <SortableTaskItem
                        key={task.id}
                        id={task.id}
                        task={task}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                    <AddTaskForm onAdd={handleAddTask} />
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Pet Task Assignments Section */}
            <div className="bg-white rounded-lg p-6 border">
              <h2 className="text-lg font-semibold mb-4">Pet Task Assignments</h2>
              <PetTaskAssignment 
                key={`${pets.length}-${tasks.length}`}
                pets={pets}
                tasks={tasks}
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm mt-6 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={handleSaveChanges}
              disabled={loading}
              variant="black"
              size="lg"
              className="w-full mb-4"
            >
              {loading ? "Saving..." : "Save and Return to Dashboard"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// dnd-kit sortable TaskItem
function SortableTaskItem({ id, task, onUpdate, onDelete }: { id: string; task: Task; onUpdate: (id: string, name: string) => void; onDelete: (id: string) => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    background: isDragging ? '#e0f2fe' : undefined,
  };
  const handleSave = () => {
    if (name.trim()) {
      onUpdate(task.id, name.trim());
      setIsEditing(false);
    }
  };
  const handleCancel = () => {
    setName(task.name);
    setIsEditing(false);
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-2 p-3 border rounded-lg transition-all duration-200 bg-white">
      <div {...listeners} className="text-gray-400 text-xs mr-2 select-none hover:text-gray-600 cursor-grab active:cursor-grabbing">⋮⋮</div>
      {isEditing ? (
        <>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border rounded px-2 py-1"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="flex-1">{task.name}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Add Task Form Component
function AddTaskForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
      >
        + Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border rounded-lg">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Task name"
        className="flex-1 border rounded px-2 py-1"
        autoFocus
      />
      <button
        type="submit"
        className="text-green-600 hover:text-green-800 text-sm"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => {
          setName("");
          setIsAdding(false);
        }}
        className="text-gray-600 hover:text-gray-800 text-sm"
      >
        Cancel
      </button>
    </form>
  );
}

// Pet Item Component
function PetItem({ pet, onUpdate, onDelete }: { pet: Pet; onUpdate: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(pet.name);
  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useAuth();

  const isOwnedByMe = pet.owner_id === user?.id;
  const isSharedWithMe = !isOwnedByMe;

  const handleSave = () => {
    if (name.trim()) {
      onUpdate(pet.id, name.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(pet.name);
    setIsEditing(false);
  };

  const handleSharePet = () => {
    setShowShareModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 p-3 border rounded-lg">
        {isEditing ? (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border rounded px-2 py-1"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="flex-1">
              {pet.name}
              {isSharedWithMe && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Shared
                </span>
              )}
            </span>
            <div className="flex gap-2">
              {isOwnedByMe && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleSharePet}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => onDelete(pet.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </>
              )}
              {isSharedWithMe && (
                <span className="text-xs text-gray-500">
                  Read-only
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Share Pet Modal */}
      {showShareModal && (
        <SharePetModal 
          pet={pet} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </>
  );
}

// Add Pet Form Component
function AddPetForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
      >
        + Add Pet
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border rounded-lg">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Pet name"
        className="flex-1 border rounded px-2 py-1"
        autoFocus
      />
      <button
        type="submit"
        className="text-green-600 hover:text-green-800 text-sm"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => {
          setName("");
          setIsAdding(false);
        }}
        className="text-gray-600 hover:text-gray-800 text-sm"
      >
        Cancel
      </button>
    </form>
  );
}

/*
Note: You'll need to add RLS policies for the pets table in Supabase:
1. Go to Authentication → Policies → pets table
2. Add policy for SELECT: "Users can view all pets" (Operation: SELECT, Target: authenticated, Using: true)
3. Add policy for INSERT: "Users can add pets" (Operation: INSERT, Target: authenticated, Using: true)
4. Add policy for UPDATE: "Users can update pets" (Operation: UPDATE, Target: authenticated, Using: true)
*/ 