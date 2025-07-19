// src/components/pet-care-modal.tsx
"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTasks } from "@/hooks/useTasks";
import { usePets } from "@/hooks/usePets";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { supabase } from "@/utils/supabase";
import { DialogTitle } from "@radix-ui/react-dialog";

type TaskLog = {
  task_id: string;
  pet_id: string;
  user_id: string;
  notes: string;
  date_time: string;
};

export default function PetCareModal() {
  const [open, setOpen] = useState(false);
  const { tasks, refresh: refreshTasks } = useTasks();
  const { pets } = usePets();
  const { user } = useAuth();
  const { triggerRefresh } = useData();
  const [formData, setFormData] = useState<TaskLog>({
    task_id: "",
    pet_id: "",
    user_id: user?.id || "",
    notes: "",
    date_time: new Date().toISOString().slice(0, 16),
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Refresh tasks when modal opens
  useEffect(() => {
    if (open) {
      refreshTasks();
    }
  }, [open, refreshTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to log a task' });
      return;
    }

    const { error } = await supabase.from("task_logs").insert([{
      ...formData,
      user_id: user.id
    }]);
    
    if (error) {
      console.error("Failed to submit task log:", error.message);
      setMessage({ type: 'error', text: `Failed to log task: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Task logged successfully!' });
      setTimeout(() => {
        setOpen(false);
        setFormData({
          task_id: "",
          pet_id: "",
          user_id: user.id,
          notes: "",
          date_time: new Date().toISOString().slice(0, 16),
        });
        triggerRefresh();
        setMessage(null);
      }, 1500);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="bg-black text-white font-bold rounded-xl py-4 text-lg w-full shadow-md"
        >
          + Log Task
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-white p-6 rounded-t-2xl z-50">
          <DialogTitle className="text-lg font-bold">New Task Log</DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
            
            <div>
              <label className="block text-sm">Pet</label>
              <select
                className="w-full border rounded p-2"
                value={formData.pet_id}
                onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                required
              >
                <option value="">Select a pet</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm">Task</label>
              <select
                className="w-full border rounded p-2"
                value={formData.task_id}
                onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                required
              >
                <option value="">Select a task</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm">Date & Time</label>
              <input
                type="datetime-local"
                className="w-full border rounded p-2"
                value={formData.date_time}
                onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm">Notes</label>
              <textarea
                className="w-full border rounded p-2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <button type="submit" className="bg-black text-white px-4 py-2 rounded w-full">
              Submit
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
