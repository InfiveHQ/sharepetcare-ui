import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

type User = {
  id: string;
  name: string;
};

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("users").select("id, name");
      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    }

    fetchUsers();
  }, []);

  return { users, loading };
}
