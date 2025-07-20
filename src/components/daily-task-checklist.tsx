"use client";

import { useState, useEffect, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePetTasks, PetTask } from "@/hooks/usePetTasks";
import { usePets } from "@/hooks/usePets";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { supabase } from "@/utils/supabase";

type DailyTask = {
  id: string;
  task_id: string;
  name: string;
  pet_id: string;
  pet_name: string;
  assigned_user_id: string;
  assigned_user_name: string;
  expected_time: string;
  frequency: string;
  instructions?: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
};

type CompletionModalData = {
  petTaskId: string;
  taskId: string;
  taskName: string;
  petId: string;
  petName: string;
  instructions?: string;
  notes: string;
  dateTime: string;
  userId: string;
};

export default function DailyTaskChecklist() {
  const { petTasks } = usePetTasks();
  const { pets } = usePets();
  const { user } = useAuth();
  const { triggerRefresh } = useData();
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<CompletionModalData | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [view, setView] = useState<'pet' | 'activity'>('pet');

  // Load today's task completion status
  useEffect(() => {
    const loadDailyTasks = async () => {
      console.log("DailyTaskChecklist: loadDailyTasks called");
      console.log("User:", user?.id);
      console.log("PetTasks count:", petTasks.length);
      console.log("Pets count:", pets.length);
      
      if (!user) {
        console.log("No user, returning");
        return;
      }
      
      if (petTasks.length === 0) {
        console.log("No pet tasks, returning");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get current user's name - create user record if it doesn't exist
      let { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      // If user record doesn't exist, create it
      if (!userData) {
        console.log("User record not found, creating one...");
        const { data: newUserData, error: createError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
          }])
          .select('name')
          .single();
        
        if (!createError && newUserData) {
          userData = newUserData;
          console.log("Created user record:", userData);
        } else {
          console.error("Failed to create user record:", createError);
        }
      }

      console.log("User data:", userData);
      console.log("Current user:", user);
      
      // Store the user name for use in task completion
      setUserName(userData?.name || user?.email || "");

      // Get today's completed tasks
      const { data: completedTasks } = await supabase
        .from("task_logs")
        .select("task_id, pet_id, date_time, notes")
        .gte("date_time", today.toISOString())
        .lt("date_time", tomorrow.toISOString());

      // Create daily task list from pet tasks with completion status
      console.log("Creating daily task list from pet tasks:", petTasks);
      // Only include petTasks for pets the user has access to (owned, shared with, or shared by)
      const allowedPetIds = pets.map(p => p.id);
      const filteredPetTasks = petTasks.filter(pt => allowedPetIds.includes(pt.pet_id));
      const dailyTaskList = filteredPetTasks.map(petTask => {
        const completedTask = completedTasks?.find(ct => 
          ct.task_id === petTask.task_id && ct.pet_id === petTask.pet_id
        );
        const completedBy = userData?.name || user?.email;
        console.log(`Task ${petTask.task_name} for pet ${petTask.pet_name} completed by:`, completedBy);
        return {
          id: petTask.id,
          task_id: petTask.task_id, // Add the actual task_id
          name: petTask.task_name,
          pet_id: petTask.pet_id,
          pet_name: petTask.pet_name,
          assigned_user_id: petTask.assigned_user_id,
          assigned_user_name: petTask.assigned_user_name,
          expected_time: petTask.expected_time,
          frequency: petTask.frequency,
          instructions: petTask.instructions,
          completed: !!completedTask,
          completed_at: completedTask?.date_time,
          completed_by: completedBy,
          notes: completedTask?.notes
        };
      });

      console.log("Final daily task list:", dailyTaskList);
      setDailyTasks(dailyTaskList);
      setLoading(false);
    };

    loadDailyTasks();
  }, [petTasks, user]); // Removed pets dependency since we don't need it

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = () => {
      console.log("DailyTaskChecklist: Received dashboard refresh event");
      // The usePetTasks hook will handle the refresh automatically
    };

    window.addEventListener('dashboardRefresh', handleDashboardRefresh);
    
    return () => {
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
    };
  }, []);

  // Close modal when switching views
  useEffect(() => {
    setModalOpen(false);
    setModalData(null);
  }, [view]);

  const handleTaskClick = (task: DailyTask) => {
    console.log('handleTaskClick called for task:', task);
    setModalData({
      petTaskId: task.id,
      taskId: task.task_id, // Use the actual task_id from the pet task
      taskName: task.name,
      petId: task.pet_id || pets[0]?.id || "",
      petName: task.pet_name || pets[0]?.name || "",
      instructions: task.instructions,
      notes: task.notes || "",
      dateTime: task.completed ? new Date(task.completed_at!).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      userId: task.completed ? task.assigned_user_id || user?.id || "" : user?.id || ""
    });
    setModalOpen(true);
  };

  const handleCompleteTask = async () => {
    if (!modalData || !user) return;

    try {
      // Check if this task is already completed
      const existingTask = dailyTasks.find(task => task.id === modalData.petTaskId);
      const isEditing = existingTask?.completed;

      if (isEditing) {
        // Update existing task log
        const { error } = await supabase
          .from("task_logs")
          .update({
            pet_id: modalData.petId,
            user_id: modalData.userId,
            date_time: new Date(modalData.dateTime).toISOString(),
            notes: modalData.notes || null
          })
          .eq("task_id", modalData.taskId)
          .eq("pet_id", existingTask.pet_id)
          .gte("date_time", new Date().toISOString().split('T')[0] + 'T00:00:00')
          .lt("date_time", new Date().toISOString().split('T')[0] + 'T23:59:59');

        if (error) {
          console.error("Failed to update task:", error);
        } else {
          // Update local state
          setDailyTasks(prev => prev.map(task => 
            task.id === modalData.petTaskId
              ? { 
                  ...task, 
                  completed_at: new Date(modalData.dateTime).toISOString(),
                  completed_by: userName || user?.email,
                  pet_id: modalData.petId,
                  pet_name: modalData.petName,
                  notes: modalData.notes
                }
              : task
          ));
        }
      } else {
        // Create new task log
        const { error } = await supabase
          .from("task_logs")
          .insert([{
            task_id: modalData.taskId,
            pet_id: modalData.petId,
            user_id: modalData.userId,
            date_time: new Date(modalData.dateTime).toISOString(),
            notes: modalData.notes || null
          }]);

        if (error) {
          console.error("Failed to complete task:", error);
        } else {
          // Update local state
          setDailyTasks(prev => prev.map(task => 
            task.id === modalData.petTaskId
              ? { 
                  ...task, 
                  completed: true, 
                  completed_at: new Date(modalData.dateTime).toISOString(),
                  completed_by: userName || user?.email,
                  pet_id: modalData.petId,
                  pet_name: modalData.petName,
                  notes: modalData.notes
                }
              : task
          ));
        }
      }

      setModalOpen(false);
      setModalData(null);
      
      // Trigger a global refresh to update logs
      triggerRefresh();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleQuickComplete = async (task: DailyTask) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("task_logs")
        .insert([{
          task_id: task.task_id,
          pet_id: task.pet_id,
          user_id: user.id,
          date_time: new Date().toISOString(),
          notes: null
        }]);

      if (error) {
        console.error("Failed to quick complete task:", error);
      } else {
        // Update local state
        setDailyTasks(prev => prev.map(t => 
          t.id === task.id
            ? { 
                ...t, 
                completed: true, 
                completed_at: new Date().toISOString(),
                completed_by: userName || user?.email
              }
            : t
        ));
        
        // Trigger a global refresh to update logs
        triggerRefresh();
      }
    } catch (error) {
      console.error("Error quick completing task:", error);
    }
  };

  const handleUndoComplete = async (task: DailyTask) => {
    if (!user) return;

    try {
      // Delete the task log entry for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { error } = await supabase
        .from("task_logs")
        .delete()
        .eq("task_id", task.task_id)
        .eq("pet_id", task.pet_id)
        .gte("date_time", today.toISOString())
        .lt("date_time", tomorrow.toISOString());

      if (error) {
        console.error("Failed to undo task completion:", error);
      } else {
        // Update local state
        setDailyTasks(prev => prev.map(t => 
          t.id === task.id
            ? { 
                ...t, 
                completed: false, 
                completed_at: undefined,
                completed_by: undefined,
                notes: undefined
              }
            : t
        ));
        
        // Trigger a global refresh to update logs
        triggerRefresh();
      }
    } catch (error) {
      console.error("Error undoing task completion:", error);
    }
  };

  // Group tasks by activity for the table view
  const activities = useMemo(() => {
    const map: Record<string, { activity: string; tasks: DailyTask[] }> = {};
    dailyTasks.forEach(task => {
      if (!map[task.name]) map[task.name] = { activity: task.name, tasks: [] };
      map[task.name].tasks.push(task);
    });
    return Object.values(map);
  }, [dailyTasks]);
  // Get unique pets for columns
  const petList = useMemo(() => {
    const map: Record<string, string> = {};
    dailyTasks.forEach(task => { map[task.pet_id] = task.pet_name; });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [dailyTasks]);

  // Group tasks by pet and sort them
  const tasksByPet = dailyTasks.reduce((acc, task) => {
    const petName = task.pet_name || "Unassigned";
    if (!acc[petName]) {
      acc[petName] = [];
    }
    acc[petName].push(task);
    return acc;
  }, {} as Record<string, DailyTask[]>);

  if (loading) {
    return <div className="text-center py-4">Loading daily tasks...</div>;
  }

  if (dailyTasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No daily tasks configured yet.</p>
        <p className="text-sm mt-2">Configure tasks in your Profile to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle for view */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg font-semibold shadow ${view === 'pet' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={() => setView('pet')}
        >
          By Pet
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold shadow ${view === 'activity' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={() => setView('activity')}
        >
          By Activity
        </button>
      </div>
      {/* By Activity View */}
      {view === "activity" && (
        <>
          {/* Desktop split tables */}
          <div className="overflow-x-auto hidden md:block">
            {(() => {
              // Split petList into chunks of 4
              const chunkSize = 4;
              const petChunks = [];
              for (let i = 0; i < petList.length; i += chunkSize) {
                petChunks.push(petList.slice(i, i + chunkSize));
              }
              return petChunks.map((petChunk, idx) => (
                <div key={idx} className="mb-8">
                  {petChunks.length > 1 && (
                    <div className="mb-2 font-semibold text-gray-700">Pets {idx * chunkSize + 1}–{idx * chunkSize + petChunk.length}</div>
                  )}
                  <table className="w-full border-collapse border border-gray-200 min-w-[600px] mb-2">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left min-w-[8rem] max-w-[8rem]">Activity</th>
                        {petChunk.map(pet => (
                          <th key={pet.id} className="border border-gray-200 px-4 py-2 text-left min-w-[8rem] max-w-[8rem]">{pet.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map(({ activity, tasks }) => (
                        <tr key={activity}>
                          <td className="border border-gray-200 px-4 py-2 font-semibold bg-gray-50 min-w-[8rem] max-w-[8rem]">{activity}</td>
                          {petChunk.map(pet => {
                            const task = tasks.find(t => t.pet_id === pet.id);
                            if (!task) return <td key={pet.id} className="border border-gray-200 px-4 py-2 bg-gray-100 min-w-[8rem] max-w-[8rem]" />;
                            return (
                              <td key={pet.id} className="border border-gray-200 px-4 py-2 align-top min-w-[8rem] max-w-[8rem]">
                                <div
                                  className={`rounded-lg p-2 w-full h-full ${task.completed ? 'bg-gray-200 border border-gray-400' : 'bg-white border-gray-300 hover:border-gray-400 cursor-pointer'}`}
                                  onClick={() => handleTaskClick(task)}
                                  style={{ minHeight: '48px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleTaskClick(task); }}
                                >
                                  {task.completed ? (
                                    <>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-green-600">✓</span>
                                        <span className="strikethrough-group">
                                          <span className="font-medium text-sm text-gray-400">
                                            {task.expected_time ? task.expected_time.substring(0, 5) : ''}
                                          </span>
                                          {task.assigned_user_name && (
                                            <span className="text-xs text-gray-500 ml-1">({task.assigned_user_name})</span>
                                          )}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-400" title="Click to edit completion details">
                                        {task.completed_by} @ {task.completed_at ? new Date(task.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-black">
                                          {task.expected_time ? task.expected_time.substring(0, 5) : ''}
                                        </span>
                                        {task.assigned_user_name && (
                                          <span className="text-xs text-gray-500 ml-1">({task.assigned_user_name})</span>
                                        )}
                                        {task.instructions && (
                                          <button
                                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                                            onClick={e => { e.stopPropagation(); alert(task.instructions); }}
                                            title={task.instructions}
                                            type="button"
                                          >
                                            (Instructions)
                                          </button>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm font-medium">
                                        <span
                                          className="text-blue-600 cursor-pointer"
                                          style={{ marginRight: 4 }}
                                          onClick={e => { e.stopPropagation(); handleTaskClick(task); }}
                                        >
                                          Click to complete
                                        </span>
                                        <button
                                          onClick={e => { e.stopPropagation(); handleQuickComplete(task); }}
                                          className="text-gray-400 hover:text-green-600 transition-colors text-lg"
                                          title="Quick complete"
                                          type="button"
                                        >
                                          ⚡
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ));
            })()}
          </div>
          {/* Mobile-friendly cards */}
          <div className="md:hidden space-y-4">
            {activities.map(({ activity, tasks }) => (
              <div key={activity} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold">{activity}</div>
                <div className="divide-y divide-gray-200">
                  {petList.map(pet => {
                    const task = tasks.find(t => t.pet_id === pet.id);
                    if (!task) return null;
                    return (
                      <div key={pet.id} className="flex items-center justify-between p-4">
                        <div className="flex flex-col flex-1">
                          <span className="font-medium text-gray-900">{pet.name}</span>
                          {task.completed ? (
                            <span className="strikethrough-group">
                              <span className="font-medium text-sm text-gray-400">
                                {task.expected_time ? task.expected_time.substring(0, 5) : ''}
                              </span>
                              {task.assigned_user_name && (
                                <span className="text-xs text-gray-500 ml-1">({task.assigned_user_name})</span>
                              )}
                            </span>
                          ) : (
                            <>
                              <span className="font-medium text-sm text-black">
                                {task.expected_time ? task.expected_time.substring(0, 5) : ''}
                              </span>
                              {task.assigned_user_name && (
                                <span className="text-xs text-gray-500 ml-1">({task.assigned_user_name})</span>
                              )}
                            </>
                          )}
                          {task.instructions && (
                            <button
                              className="text-xs text-gray-400 hover:text-gray-600 underline text-left"
                              onClick={e => { e.stopPropagation(); alert(task.instructions); }}
                              title={task.instructions}
                            >
                              (Instructions)
                            </button>
                          )}
                        </div>
                        {task.completed ? (
                          <div
                            role="button"
                            tabIndex={0}
                            className="flex flex-col items-end flex-1 cursor-pointer w-full text-left outline-none focus:ring-2 focus:ring-blue-400"
                            onClick={() => handleTaskClick(task)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleTaskClick(task); }}
                            style={{ minHeight: '48px' }}
                          >
                            <span className="text-green-600 text-lg">✓</span>
                            <span className="text-xs text-gray-400">
                              {task.completed_by} @ {task.completed_at ? new Date(task.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            <span
                              className="text-blue-600 text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskClick(task)}
                            >
                              Click to complete
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); handleQuickComplete(task); }}
                              className="text-gray-400 hover:text-green-600 transition-colors text-lg"
                              title="Quick complete"
                              type="button"
                            >
                              ⚡
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {/* By Pet View */}
      {view === "pet" && (
        <>
          {Object.entries(tasksByPet).map(([petName, petTasks]) => (
            <div key={petName} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">{petName}</h3>
              <div className="space-y-1">
                {petTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-2 border rounded-lg ${
                      task.completed 
                        ? 'bg-gray-200 border-gray-400' 
                        : 'bg-white border-gray-300 hover:border-gray-400 cursor-pointer'
                    }`}
                    onClick={() => handleTaskClick(task)}
                  >
                    {task.completed ? (
                      // Completed task layout
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span className="font-medium text-gray-400 line-through">{task.name}</span>
                          </div>
                          <div 
                            className="text-sm text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleTaskClick(task)}
                            title="Click to edit completion details"
                          >
                            {task.completed_by} @ {new Date(task.completed_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Pending task layout
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">○</span>
                            <span className="font-medium text-black">{task.name}</span>
                            {task.instructions && (
                              <button
                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(task.instructions);
                                }}
                                title={task.instructions}
                              >
                                (Instructions)
                              </button>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {task.assigned_user_name || "Unassigned"} • {task.expected_time ? task.expected_time.substring(0, 5) : "No time set"}
                          </span>
                        </div>
                        <div className="text-right -mt-1">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-blue-600 font-medium">
                              Click to complete
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickComplete(task);
                              }}
                              className="text-gray-400 hover:text-green-600 transition-colors"
                              title="Quick complete (no notes)"
                            >
                              ⚡
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
      {/* Completion Modal: always rendered */}
      {modalOpen && modalData && (
        <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
            <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-white p-6 rounded-t-2xl z-50">
              <Dialog.Title className="text-lg font-bold mb-4">
                {modalData && dailyTasks.find(task => task.id === modalData.petTaskId)?.completed 
                  ? "Edit Task Completion" 
                  : "Complete Task"
                }
              </Dialog.Title>
              {modalData && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Task</label>
                    <div className="p-2 bg-gray-50 rounded border">
                      {modalData.taskName}
                    </div>
                  </div>

                  {modalData.instructions && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Instructions</label>
                      <div className="p-2 bg-gray-50 rounded border text-sm text-gray-600 italic">
                        "{modalData.instructions}"
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Pet</label>
                    <select
                      className="w-full border rounded p-2"
                      value={modalData.petId}
                      onChange={(e) => setModalData({...modalData, petId: e.target.value})}
                    >
                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Completed By</label>
                    <select
                      className="w-full border rounded p-2"
                      value={modalData.userId}
                      onChange={(e) => setModalData({...modalData, userId: e.target.value})}
                    >
                      <option value={user?.id}>{userName}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full border rounded p-2"
                      value={modalData.dateTime}
                      onChange={(e) => setModalData({...modalData, dateTime: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      className="w-full border rounded p-2"
                      value={modalData.notes}
                      onChange={(e) => setModalData({...modalData, notes: e.target.value})}
                      placeholder="Add any notes about this task..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    {modalData && dailyTasks.find(task => task.id === modalData.petTaskId)?.completed ? (
                      <>
                        <button
                          onClick={handleCompleteTask}
                          className="flex-1 px-4 py-2 bg-black text-white rounded-lg"
                        >
                          Update Task
                        </button>
                        <button
                          onClick={() => {
                            const task = dailyTasks.find(t => t.id === modalData.petTaskId);
                            if (task) {
                              handleUndoComplete(task);
                              setModalOpen(false);
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
                        >
                          Uncomplete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleCompleteTask}
                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg"
                      >
                        Complete Task
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
} 