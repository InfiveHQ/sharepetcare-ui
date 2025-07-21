"use client";

import React, { useImperativeHandle, forwardRef } from "react";
import { useState, useEffect, useRef } from "react";
import { useTasks } from "@/hooks/useTasks";
import { usePets } from "@/hooks/usePets";
import { usePetTasks } from "@/hooks/usePetTasks";
import { useAuth } from "@/contexts/auth-context";
import { supabase as _supabaseUntyped } from "@/utils/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

const supabase: SupabaseClient = _supabaseUntyped as SupabaseClient;

type PetTaskAssignment = {
  pet_id: string;
  task_id: string;
  assigned_user_id: string;
  expected_time: string;
  instructions: string;
  is_assigned: boolean;
};

type PetTaskAssignmentProps = {
  pets: { id: string; name: string; owner_id?: string }[];
  tasks: { id: string; name: string }[];
};

export type PetTaskAssignmentHandle = {
  saveAllAssignments: () => Promise<void>;
};

const PetTaskAssignment = forwardRef<PetTaskAssignmentHandle, PetTaskAssignmentProps>(
  function PetTaskAssignmentImpl({ pets, tasks }, ref) {
    const { petTasks, refresh: refreshPetTasks } = usePetTasks();
    const { user } = useAuth();
    const { loading: petsLoading } = usePets();
    const { loading: tasksLoading } = useTasks();
    const [assignments, setAssignments] = useState<PetTaskAssignment[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [availableUsers, setAvailableUsers] = useState<{ [petId: string]: { id: string; name: string; email: string }[] }>({});
    const [userPermissions, setUserPermissions] = useState<{ [petId: string]: 'owner' | 'view_only' | 'view_and_log' | 'full_access' | null }>({});
    const cleanupTimeout = useRef<NodeJS.Timeout | null>(null);

    // Load user's name from database
    useEffect(() => {
      const loadUserName = async () => {
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();
          
          if (data && data.name) {
            setUserName(data.name);
          } else {
            // Fallback to email username if no name set
            setUserName(user.email?.split('@')[0] || "");
          }
        }
      };

      loadUserName();
    }, [user]);

    // Load available users for pet task assignment and check permissions
    useEffect(() => {
      const loadAvailableUsers = async () => {
        if (!pets.length || !user) return;

        try {
          const usersByPet: { [petId: string]: { id: string; name: string; email: string }[] } = {};
          const permissions: { [petId: string]: 'owner' | 'view_only' | 'view_and_log' | 'full_access' | null } = {};
          // We'll collect all owner_ids (UUIDs) and all shared_with_email (emails)
          const allOwnerIds = new Set<string>();
          const allSharedEmails = new Set<string>();
          // For each pet, collect owner and shared emails
          for (const pet of pets) {
            // Permissions logic (unchanged)
            const isOwner = pet.owner_id === user.id;
            if (isOwner) {
              permissions[pet.id] = 'owner';
            } else {
              const { data: shareData } = await supabase
                .from('pet_shares')
                .select('permission')
                .eq('pet_id', pet.id)
                .eq('shared_with_email', user.email)
                .single();
              permissions[pet.id] = shareData?.permission || null;
            }
            // Collect owner_id
            if (pet.owner_id) {
              allOwnerIds.add(pet.owner_id);
            }
            // Collect all shared_with_email for this pet
            const { data: sharedUsers } = await supabase
              .from('pet_shares')
              .select('shared_with_email')
              .eq('pet_id', pet.id);
            (sharedUsers || []).forEach((su: any) => {
              if (su.shared_with_email) {
                allSharedEmails.add(su.shared_with_email);
              }
            });
          }
          // Query users by id (owners)
          let ownerUsers: { id: string; name: string; email: string }[] = [];
          if (allOwnerIds.size > 0) {
            const { data } = await supabase
              .from('users')
              .select('id, name, email')
              .in('id', Array.from(allOwnerIds));
            ownerUsers = data || [];
          }
          // Query users by email (shared)
          let sharedUsers: { id: string; name: string; email: string }[] = [];
          if (allSharedEmails.size > 0) {
            const { data } = await supabase
              .from('users')
              .select('id, name, email')
              .in('email', Array.from(allSharedEmails));
            sharedUsers = data || [];
          }
          // Merge and deduplicate users
          const allUsers: { id: string; name: string; email: string }[] = [];
          const seen = new Set<string>();
          for (const u of [...ownerUsers, ...sharedUsers]) {
            if (!seen.has(u.id)) {
              allUsers.push(u);
              seen.add(u.id);
            }
          }
          // Now, for each pet, build the available users list with names
          for (const pet of pets) {
            const petUsers: { id: string; name: string; email: string }[] = [];
            // Owner
            if (pet.owner_id) {
              const owner = allUsers.find(u => u.id === pet.owner_id);
              if (owner) petUsers.push(owner);
            }
            // Shared users
            const { data: sharedPetShares } = await supabase
              .from('pet_shares')
              .select('shared_with_email')
              .eq('pet_id', pet.id);
            (sharedPetShares || []).forEach((su: any) => {
              const sharedUser = allUsers.find(u => u.email === su.shared_with_email);
              if (sharedUser && !petUsers.find(u => u.id === sharedUser.id)) {
                petUsers.push(sharedUser);
              }
            });
            usersByPet[pet.id] = petUsers;
          }
          setAvailableUsers(usersByPet);
          setUserPermissions(permissions);
        } catch (err) {
          console.error("Failed to load available users for pet task assignment:", err);
        }
      };

      loadAvailableUsers();
    }, [pets, user]);

    // Initialize assignments matrix
    useEffect(() => {
      console.log("PetTaskAssignment: Initializing assignments", { 
        tasksCount: tasks.length, 
        petsCount: pets.length, 
        petTasksCount: petTasks.length 
      });
      
      if (tasks.length > 0 && pets.length > 0) {
        const initialAssignments: PetTaskAssignment[] = [];
        
        tasks.forEach(task => {
          pets.forEach(pet => {
            // Check if this pet-task combination already exists
            const existingAssignment = petTasks.find(pt => 
              pt.pet_id === pet.id && pt.task_id === task.id
            );
            
            initialAssignments.push({
              pet_id: pet.id,
              task_id: task.id,
              assigned_user_id: existingAssignment?.assigned_user_id || "",
              expected_time: existingAssignment?.expected_time || "",
              instructions: existingAssignment?.instructions || "",
              is_assigned: !!existingAssignment
            });
          });
        });
        
        console.log("PetTaskAssignment: Created assignments", { 
          assignmentsCount: initialAssignments.length 
        });
        setAssignments(initialAssignments);
      } else {
        // Clear assignments if no pets or tasks
        console.log("PetTaskAssignment: Clearing assignments - no pets or tasks");
        setAssignments([]);
      }
    }, [tasks, pets, petTasks]);

    // Force refresh assignments when pets or tasks change
    useEffect(() => {
      console.log("PetTaskAssignment: Pets or tasks changed, refreshing assignments");
      // This will trigger the above useEffect to rebuild assignments
    }, [pets.length, tasks.length]);

    // Listen for data refresh events
    useEffect(() => {
      const handleDataRefresh = () => {
        console.log("PetTaskAssignment: Received dataRefreshed event");
        // Refresh pet tasks data
        refreshPetTasks();
      };

      // Listen for custom refresh events
      window.addEventListener('dataRefreshed', handleDataRefresh);
      
      return () => {
        window.removeEventListener('dataRefreshed', handleDataRefresh);
      };
    }, [refreshPetTasks]);

    // Clean up assignments for deleted pets/tasks
    useEffect(() => {
      // Only run cleanup if pets and tasks are loaded and non-empty
      if (petsLoading || tasksLoading) return;
      if (!pets.length || !tasks.length) return;
      if (cleanupTimeout.current) clearTimeout(cleanupTimeout.current);
      cleanupTimeout.current = setTimeout(() => {
        console.log("[CLEANUP] pets:", pets);
        console.log("[CLEANUP] tasks:", tasks);
        console.log("[CLEANUP] petTasks:", petTasks);
        const cleanupOrphanedAssignments = async () => {
          if (petTasks.length > 0 && pets.length > 0 && tasks.length > 0) {
            const petIds = pets.map(p => p.id);
            const taskIds = tasks.map(t => t.id);
            // Find assignments that reference deleted pets or tasks
            const orphanedAssignments = petTasks.filter(pt => 
              !petIds.includes(pt.pet_id) || !taskIds.includes(pt.task_id)
            );
            // Delete orphaned assignments
            for (const assignment of orphanedAssignments) {
              await supabase
                .from("pet_tasks")
                .delete()
                .eq("pet_id", assignment.pet_id)
                .eq("task_id", assignment.task_id);
            }
            if (orphanedAssignments.length > 0) {
              refreshPetTasks();
            }
          }
        };
        cleanupOrphanedAssignments();
      }, 500);
      return () => {
        if (cleanupTimeout.current) clearTimeout(cleanupTimeout.current);
      };
    }, [pets, tasks, petTasks, refreshPetTasks, petsLoading, tasksLoading]);

    const handleCheckboxChange = (petId: string, taskId: string, checked: boolean) => {
      if (!user) return;

      // Check if user has permission to assign tasks
      if (!canAssignToSelf(petId)) {
        const permission = userPermissions[petId];
        if (permission === 'view_only') {
          setMessage({ type: 'error', text: "You have view-only access to this pet. You cannot assign tasks." });
        } else if (!permission) {
          setMessage({ type: 'error', text: "You don't have permission to assign tasks for this pet." });
        } else {
          setMessage({ type: 'error', text: "You don't have permission to assign tasks for this pet." });
        }
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const assignmentIndex = assignments.findIndex(
        a => a.pet_id === petId && a.task_id === taskId
      );

      if (assignmentIndex === -1) return;

      const updatedAssignments = [...assignments];
      const assignment = updatedAssignments[assignmentIndex];

      if (checked) {
        // Assign the task
        assignment.is_assigned = true;
        assignment.assigned_user_id = user.id;
        assignment.expected_time = "08:00:00"; // Default time
        assignment.instructions = "";
      } else {
        // Unassign the task
        assignment.is_assigned = false;
        assignment.assigned_user_id = "";
        assignment.expected_time = "";
        assignment.instructions = "";
      }

      setAssignments(updatedAssignments);
    };

    const handleFieldChange = (petId: string, taskId: string, field: string, value: string) => {
      // Check if user has permission to modify this pet's tasks
      if (!canModifyPetTask(petId)) {
        const permission = userPermissions[petId];
        if (permission === 'view_only' || permission === 'view_and_log') {
          setMessage({ type: 'error', text: "You don't have permission to modify task details. Only the pet owner or users with full access can change time and instructions." });
        } else if (!permission) {
          setMessage({ type: 'error', text: "You don't have permission to modify task details for this pet." });
        } else {
          setMessage({ type: 'error', text: "You don't have permission to modify task details for this pet." });
        }
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const assignmentIndex = assignments.findIndex(
        a => a.pet_id === petId && a.task_id === taskId
      );

      if (assignmentIndex === -1) return;

      // Store original value in case we need to revert
      const originalValue = assignments[assignmentIndex][field as keyof PetTaskAssignment];
      
      const updatedAssignments = [...assignments];
      updatedAssignments[assignmentIndex] = {
        ...updatedAssignments[assignmentIndex],
        [field]: value
      };

      setAssignments(updatedAssignments);
    };

    const saveAllAssignments = async () => {
      // Compare assignments to petTasks to determine what to insert, update, or delete
      // 1. Insert new assignments
      // 2. Update changed assignments
      // 3. Delete removed assignments
      // Use Supabase batch operations where possible
      const originalAssignments = petTasks;
      const toInsert = assignments.filter(a => a.is_assigned && !originalAssignments.find(o => o.pet_id === a.pet_id && o.task_id === a.task_id));
      const toUpdate = assignments.filter(a => {
        const orig = originalAssignments.find(o => o.pet_id === a.pet_id && o.task_id === a.task_id);
        return a.is_assigned && orig && (
          a.assigned_user_id !== orig.assigned_user_id ||
          a.expected_time !== orig.expected_time ||
          a.instructions !== orig.instructions
        );
      });
      const toDelete = originalAssignments.filter(o => !assignments.find(a => a.pet_id === o.pet_id && a.task_id === o.task_id && a.is_assigned));
      // Insert
      if (toInsert.length > 0) {
        await supabase.from("pet_tasks").insert(toInsert.map(a => ({
          pet_id: a.pet_id,
          task_id: a.task_id,
          assigned_user_id: a.assigned_user_id,
          expected_time: a.expected_time,
          instructions: a.instructions
        })));
      }
      // Update
      for (const a of toUpdate) {
        await supabase.from("pet_tasks").update({
          assigned_user_id: a.assigned_user_id,
          expected_time: a.expected_time,
          instructions: a.instructions
        })
        .eq("pet_id", a.pet_id)
        .eq("task_id", a.task_id);
      }
      // Delete
      for (const o of toDelete) {
        await supabase.from("pet_tasks").delete()
          .eq("pet_id", o.pet_id)
          .eq("task_id", o.task_id);
      }
      // Optionally refresh
      refreshPetTasks();
    };
    useImperativeHandle(ref, () => ({ saveAllAssignments }));

    const getPetName = (petId: string) => {
      return pets.find(p => p.id === petId)?.name || "";
    };

    const getTaskName = (taskId: string) => {
      return tasks.find(t => t.id === taskId)?.name || "";
    };

    const getAssignmentsByTask = () => {
      const grouped: { [taskId: string]: PetTaskAssignment[] } = {};
      
      console.log("PetTaskAssignment: Getting assignments by task", {
        assignmentsCount: assignments.length,
        petsCount: pets.length,
        tasksCount: tasks.length
      });
      
      // Filter out assignments for deleted pets or tasks
      const validAssignments = assignments.filter(assignment => {
        const petExists = pets.some(pet => pet.id === assignment.pet_id);
        const taskExists = tasks.some(task => task.id === assignment.task_id);
        
        if (!petExists || !taskExists) {
          console.log("PetTaskAssignment: Filtered out assignment", {
            petId: assignment.pet_id,
            taskId: assignment.task_id,
            petExists,
            taskExists
          });
          return false;
        }
        return true;
      });
      
      validAssignments.forEach(assignment => {
        if (!grouped[assignment.task_id]) {
          grouped[assignment.task_id] = [];
        }
        grouped[assignment.task_id].push(assignment);
      });

      console.log("PetTaskAssignment: Grouped assignments", grouped);
      return grouped;
    };

    // Helper function to check if user can modify a pet task
    const canModifyPetTask = (petId: string) => {
      const permission = userPermissions[petId];
      return permission === 'owner' || permission === 'full_access';
    };

    // Helper function to check if user can assign tasks to themselves
    const canAssignToSelf = (petId: string) => {
      const permission = userPermissions[petId];
      return permission === 'owner' || permission === 'full_access' || permission === 'view_and_log';
    };

    if (tasks.length === 0 || pets.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading pet task assignments...</div>
          <div className="text-sm text-gray-400 mt-2">
            {tasks.length === 0 && "No tasks available"}
            {pets.length === 0 && "No pets available"}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto -mx-4">
          <table className="w-full border-collapse border border-gray-200 min-w-[900px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left">Task</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Pet</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Assigned</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Time</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Instructions</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(getAssignmentsByTask()).map(([taskId, taskAssignments]) => {
                const taskName = getTaskName(taskId);
                const rowSpan = taskAssignments.length;
                
                return taskAssignments.map((assignment, index) => (
                  <tr key={`${taskId}-${assignment.pet_id}`} className={index === 0 ? 'border-t-2 border-gray-300' : ''}>
                    {index === 0 && (
                      <td 
                        rowSpan={rowSpan} 
                        className="border border-gray-200 px-4 py-2 font-semibold bg-gray-50"
                      >
                        {taskName}
                      </td>
                    )}
                    <td className="border border-gray-200 px-4 py-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={assignment.is_assigned}
                          onChange={(e) => handleCheckboxChange(assignment.pet_id, assignment.task_id, e.target.checked)}
                          className="rounded"
                        />
                        <span className={assignment.is_assigned ? 'font-medium' : 'text-gray-500'}>
                          {getPetName(assignment.pet_id)}
                        </span>
                      </label>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <select
                        value={assignment.assigned_user_id}
                        onChange={(e) => handleFieldChange(assignment.pet_id, assignment.task_id, 'assigned_user_id', e.target.value)}
                        disabled={!assignment.is_assigned}
                        className={`w-full p-2 rounded border text-sm ${
                          assignment.is_assigned 
                            ? 'bg-white border-gray-300' 
                            : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}
                      >
                        <option value="">Select user</option>
                        {(availableUsers[assignment.pet_id] || []).map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <input
                        type="time"
                        value={assignment.expected_time}
                        onChange={(e) => handleFieldChange(assignment.pet_id, assignment.task_id, 'expected_time', e.target.value)}
                        disabled={!assignment.is_assigned}
                        className={`w-full p-2 rounded border text-sm ${
                          assignment.is_assigned 
                            ? 'bg-white border-gray-300' 
                            : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <textarea
                        value={assignment.instructions}
                        onChange={(e) => handleFieldChange(assignment.pet_id, assignment.task_id, 'instructions', e.target.value)}
                        disabled={!assignment.is_assigned}
                        placeholder="Add instructions..."
                        className={`w-full p-2 rounded border resize-none ${
                          assignment.is_assigned 
                            ? 'bg-white border-gray-300' 
                            : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}
                        rows={3}
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.is_assigned 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {assignment.is_assigned ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {Object.entries(getAssignmentsByTask()).map(([taskId, taskAssignments]) => {
            const taskName = getTaskName(taskId);
            
            return (
              <div key={taskId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">{taskName}</h3>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {taskAssignments.map((assignment) => (
                    <div key={`${taskId}-${assignment.pet_id}`} className="p-4 space-y-3">
                      {/* Pet Assignment Row */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={assignment.is_assigned}
                            onChange={(e) => handleCheckboxChange(assignment.pet_id, assignment.task_id, e.target.checked)}
                            className="rounded"
                          />
                          <span className={`font-medium ${assignment.is_assigned ? 'text-gray-900' : 'text-gray-500'}`}>
                            {getPetName(assignment.pet_id)}
                          </span>
                        </label>
                        <span className={`px-2 py-1 rounded text-xs ${
                          assignment.is_assigned 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {assignment.is_assigned ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Assignment Details - Only show if assigned */}
                      {assignment.is_assigned && (
                        <div className="space-y-3 pl-6">
                          {/* Assigned User */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                            <select
                              value={assignment.assigned_user_id}
                              onChange={(e) => handleFieldChange(assignment.pet_id, assignment.task_id, 'assigned_user_id', e.target.value)}
                              className="w-full p-2 rounded border text-sm bg-white border-gray-300"
                            >
                              <option value="">Select user</option>
                              {(availableUsers[assignment.pet_id] || []).map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Expected Time */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Time</label>
                            <input
                              type="time"
                              value={assignment.expected_time}
                              onChange={(e) => handleFieldChange(assignment.pet_id, assignment.task_id, 'expected_time', e.target.value)}
                              className="w-full p-2 rounded border text-sm bg-white border-gray-300"
                            />
                          </div>

                          {/* Instructions */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                            <textarea
                              value={assignment.instructions}
                              onChange={(e) => handleFieldChange(assignment.pet_id, assignment.task_id, 'instructions', e.target.value)}
                              placeholder="Add instructions..."
                              className="w-full p-2 rounded border resize-none bg-white border-gray-300"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default PetTaskAssignment;