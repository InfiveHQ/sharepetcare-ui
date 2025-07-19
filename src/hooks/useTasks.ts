import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useData } from "@/contexts/data-context";

// Cache for tasks to prevent disappearing data
let tasksCache: { id: string; name: string; icon?: string; default_time?: string; default_user?: string }[] = [];

// Helper functions for localStorage persistence
const getCachedTasks = (): { id: string; name: string; icon?: string; default_time?: string; default_user?: string }[] => {
  try {
    const cached = localStorage.getItem('tasks');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const setCachedTasks = (tasks: { id: string; name: string; icon?: string; default_time?: string; default_user?: string }[]) => {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to cache tasks:', error);
  }
};

export function useTasks() {
  const [tasks, setTasks] = useState<{ id: string; name: string; icon?: string; default_time?: string; default_user?: string }[]>(tasksCache);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useData();

  // Initialize with cached data if available
  useEffect(() => {
    const cachedTasks = getCachedTasks();
    if (cachedTasks.length > 0) {
      console.log("Loading cached tasks:", cachedTasks.length);
      setTasks(cachedTasks);
      tasksCache = cachedTasks;
      setLoading(false);
    } else {
      console.log("No cached tasks found");
    }
  }, []);

  const fetchTasks = async () => {
    console.log("Fetching tasks from Supabase");
    
    const { data, error } = await supabase
      .from("tasks")
      .select("id, name, icon, default_time, default_user")
      .order("name");

    if (error) {
      console.error("Error fetching tasks:", error.message);
    } else {
      console.log("Tasks fetched from Supabase:", data?.length);
      
      // Update cache and localStorage
      tasksCache = data || [];
      setCachedTasks(data || []);
      
      setTasks(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  return { tasks, loading, refresh: fetchTasks };
}
