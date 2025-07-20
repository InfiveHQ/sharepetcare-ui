"use client";

import { useState, useEffect } from "react";
import { useTodayLogs } from "@/hooks/useTodayLogs";
import { useData } from "@/contexts/data-context";
import { supabase } from "@/utils/supabase";
import { usePets } from "@/hooks/usePets";

type LogWithDetails = {
  id: string;
  notes?: string;
  date_time: string;
  pet_id: string;
  task_id: string;
  user_id: string;
  pet_name?: string;
  task_name?: string;
  user_name?: string;
};

export default function DailyLog() {
  const { logs, loading, error } = useTodayLogs();
  const { refreshTrigger } = useData();
  const { pets } = usePets();
  const [logsWithDetails, setLogsWithDetails] = useState<LogWithDetails[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch additional details for the logs
  useEffect(() => {
    const fetchDetails = async () => {
      // Only include logs for pets the user has access to (owned, shared with, or shared by)
      const allowedPetIds = pets.map(p => p.id);
      const filteredLogs = logs.filter(log => allowedPetIds.includes(log.pet_id));
      if (filteredLogs.length === 0) {
        setLogsWithDetails([]);
        return;
      }

      setDetailsLoading(true);
      
      try {
        // Get unique IDs
        const petIds = [...new Set(filteredLogs.map(log => log.pet_id))];
        const taskIds = [...new Set(filteredLogs.map(log => log.task_id))];
        const userIds = [...new Set(filteredLogs.map(log => log.user_id))];

        // Fetch pets, tasks, and users
        const [petsResult, tasksResult, usersResult] = await Promise.all([
          supabase.from('pets').select('id, name').in('id', petIds),
          supabase.from('tasks').select('id, name').in('id', taskIds),
          supabase.from('users').select('id, name').in('id', userIds)
        ]);

        const pets = petsResult.data || [];
        const tasks = tasksResult.data || [];
        const users = usersResult.data || [];

        // Combine the data
        const logsWithDetails = filteredLogs.map(log => ({
          ...log,
          pet_name: pets.find(p => p.id === log.pet_id)?.name || 'Unknown Pet',
          task_name: tasks.find(t => t.id === log.task_id)?.name || 'Unknown Task',
          user_name: users.find(u => u.id === log.user_id)?.name || 'Unknown User'
        }));

        setLogsWithDetails(logsWithDetails);
      } catch (err) {
        console.error('Error fetching log details:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [logs, pets, refreshTrigger]);

  if (loading || detailsLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <h2 className="text-lg font-semibold mb-4">Today's Log</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <h2 className="text-lg font-semibold mb-4">Today's Log</h2>
        <div className="text-red-500">Error loading logs: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border">
      <h2 className="text-lg font-semibold mb-4">Today's Log</h2>
      
      {logsWithDetails.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No tasks completed today yet.
        </div>
      ) : (
        <div className="space-y-3">
          {logsWithDetails
            .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
            .map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 min-w-[60px]">
                {new Date(log.date_time).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {log.pet_name}: {log.task_name}
                </div>
                {log.notes && (
                  <div className="text-sm text-gray-700 italic">
                    "{log.notes}"
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 min-w-[80px] sm:text-right">
                {log.user_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 