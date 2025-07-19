"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

export default function TestDBPage() {
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [customUsers, setCustomUsers] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkDatabase = async () => {
    setLoading(true);
    
    try {
      console.log("Current authenticated user:", user);
      
      // Check custom users table
      const { data: customUsersData, error: customUsersError } = await supabase
        .from('users')
        .select('*');
      
      console.log("Custom users table:", { data: customUsersData, error: customUsersError });
      setCustomUsers(customUsersData || []);
      
      // Check pets table
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*');
      
      console.log("Pets table:", { data: petsData, error: petsError });
      setPets(petsData || []);
      
      // Check tasks table
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');
      
      console.log("Tasks table:", { data: tasksData, error: tasksError });
      setTasks(tasksData || []);
      
      // Try to get auth users (this might not work due to RLS)
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        console.log("Auth users:", { data: authData, error: authError });
        setAuthUsers(authData?.users || []);
      } catch (error) {
        console.log("Cannot access auth users (requires admin privileges):", error);
      }
      
    } catch (error) {
      console.error("Database check error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Test</h1>
      
      <button 
        onClick={checkDatabase}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-6 disabled:opacity-50"
      >
        {loading ? "Checking..." : "Check Database"}
      </button>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Custom Users Table ({customUsers.length} records)</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(customUsers, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Pets Table ({pets.length} records)</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(pets, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Tasks Table ({tasks.length} records)</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(tasks, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Auth Users (if accessible)</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authUsers, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 