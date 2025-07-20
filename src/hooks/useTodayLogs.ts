import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";

type TaskLog = {
  id: string;
  notes?: string;
  date_time: string;
  pet_id: string;
  task_id: string;
  user_id: string;
};

export function useTodayLogs() {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { refreshTrigger } = useData();
  const { user } = useAuth();

  const fetchLogs = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("task_logs")
      .select(`
        id, 
        notes, 
        date_time,
        pet_id,
        task_id,
        user_id
      `)
      .gte("date_time", today.toISOString())
      .order("date_time", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setLogs(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    } else {
      setLoading(false);
      setLogs([]);
    }
  }, [refreshTrigger, user]);

  return { logs, loading, error, refresh: fetchLogs };
}
