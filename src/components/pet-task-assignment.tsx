"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { usePets } from "@/hooks/usePets";
import { usePetTasks } from "@/hooks/usePetTasks";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

type PetTaskAssignment = {
  pet_id: string;
  task_id: string;
  assigned_user_id: string;
  expected_time: string;
  instructions: string;
  is_assigned: boolean;
};

type PetTaskAssignmentProps = {
  pets: { id: string; name: string }[];
  tasks: { id: string; name: string }[];
};

export default function PetTaskAssignment({ pets, tasks }: PetTaskAssignmentProps) {
  const { petTasks, refresh: refreshPetTasks } = usePetTasks();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<PetTaskAssignment[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [userName, setUserName] = useState<string>("");

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
    const cleanupOrphanedAssignments = async () => {
      if (petTasks.length > 0 && pets.length > 0 && tasks.length > 0) {
        const petIds = pets.map(p => p.id);
        const taskIds = tasks.map(t => t.id);
        
        // Find assignments that reference deleted pets or tasks
        const orphanedAssignments = petTasks.filter(pt => 
          !petIds.includes(pt.pet_id) || !taskIds.includes(pt.task_id)
        );
        
        console.log("PetTaskAssignment: Found orphaned assignments", {
          orphanedCount: orphanedAssignments.length,
          totalPetTasks: petTasks.length
        });
        
        // Delete orphaned assignments
        for (const assignment of orphanedAssignments) {
          console.log("PetTaskAssignment: Deleting orphaned assignment", assignment);
          const { error } = await supabase
            .from("pet_tasks")
            .delete()
            .eq("pet_id", assignment.pet_id)
            .eq("task_id", assignment.task_id);
          
          if (error) {
            console.error("PetTaskAssignment: Failed to delete orphaned assignment", error);
          }
        }
        
        if (orphanedAssignments.length > 0) {
          console.log("PetTaskAssignment: Refreshing pet tasks after cleanup");
          refreshPetTasks();
        }
      }
    };

    cleanupOrphanedAssignments();
  }, [pets, tasks, petTasks, refreshPetTasks]);

  const handleCheckboxChange = async (petId: string, taskId: string, checked: boolean) => {
    if (!user) return;

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

    // Save to database
    if (checked) {
      const { error } = await supabase.from("pet_tasks").insert([{
        pet_id: petId,
        task_id: taskId,
        assigned_user_id: user.id,
        expected_time: assignment.expected_time,
        instructions: assignment.instructions
      }]);

      if (error) {
        console.error("Failed to assign task:", error);
        setMessage({ type: 'error', text: `Failed to assign task: ${error.message}` });
        // Revert the change
        assignment.is_assigned = false;
        setAssignments([...updatedAssignments]);
      } else {
        setMessage({ type: 'success', text: 'Task assigned successfully!' });
        refreshPetTasks();
      }
    } else {
      // Delete from database
      const { error } = await supabase
        .from("pet_tasks")
        .delete()
        .eq("pet_id", petId)
        .eq("task_id", taskId);

      if (error) {
        console.error("Failed to unassign task:", error);
        setMessage({ type: 'error', text: `Failed to unassign task: ${error.message}` });
        // Revert the change
        assignment.is_assigned = true;
        setAssignments([...updatedAssignments]);
      } else {
        setMessage({ type: 'success', text: 'Task unassigned successfully!' });
        refreshPetTasks();
      }
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const handleFieldChange = async (petId: string, taskId: string, field: string, value: string) => {
    const assignmentIndex = assignments.findIndex(
      a => a.pet_id === petId && a.task_id === taskId
    );

    if (assignmentIndex === -1) return;

    const updatedAssignments = [...assignments];
    updatedAssignments[assignmentIndex] = {
      ...updatedAssignments[assignmentIndex],
      [field]: value
    };

    setAssignments(updatedAssignments);

    // Update database
    const { error } = await supabase
      .from("pet_tasks")
      .update({ [field]: value })
      .eq("pet_id", petId)
      .eq("task_id", taskId);

    if (error) {
      console.error("Failed to update field:", error);
      setMessage({ type: 'error', text: `Failed to update: ${error.message}` });
    }
  };

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
                      <option value={user?.id}>{userName}</option>
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
                            <option value={user?.id}>{userName}</option>
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