import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

type TaskOption = { id: string; name: string };

export function useTasks() {
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase.from("tasks").select("id, name");
      if (!error && data) {
        setTasks(data.map((t) => ({ id: t.id, name: t.name })));
      }
      setLoading(false);
    }

    fetchTasks();
  }, []);

  return { tasks, loading };
}
