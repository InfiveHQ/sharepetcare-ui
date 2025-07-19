"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function TestConnectionPage() {
  const [status, setStatus] = useState<string>("");
  const [details, setDetails] = useState<any>(null);

  const testConnection = async () => {
    setStatus("Testing connection...");
    setDetails(null);

    try {
      // Test 1: Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log("Environment variables:");
      console.log("URL:", url);
      console.log("Key exists:", !!key);
      console.log("Key length:", key?.length);

      // Test 2: Try a simple query
      const { data, error } = await supabase.from('tasks').select('count').limit(1);
      
      if (error) {
        setStatus("❌ Connection failed");
        setDetails({
          error: error.message,
          code: error.code,
          details: error.details
        });
      } else {
        setStatus("✅ Connection successful");
        setDetails({ data });
      }
    } catch (err) {
      setStatus("❌ Connection failed");
      setDetails({ error: err });
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <button 
        onClick={testConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Test Connection
      </button>

      {status && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Status: {status}</h2>
          {details && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-semibold mb-2">Common Solutions:</h3>
        <ul className="text-sm space-y-1">
          <li>• Check if your Supabase project is paused (free tier)</li>
          <li>• Verify environment variables in .env.local</li>
          <li>• Check internet connection</li>
          <li>• Try refreshing the page</li>
        </ul>
      </div>
    </div>
  );
} 