"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { supabase } from "@/utils/supabase";

export default function DebugPage() {
  const { user, loading, userRecord } = useAuth();
  const { refreshTrigger } = useData();
  const [debugInfo, setDebugInfo] = useState<any>({});

  const runDebug = async () => {
    setDebugInfo({
      auth: {
        user: user ? { id: user.id, email: user.email } : null,
        loading,
        userRecord: userRecord ? { id: userRecord.id, name: userRecord.name } : null
      },
      data: {
        refreshTrigger
      }
    });

    // Test database connection
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      setDebugInfo(prev => ({
        ...prev,
        database: {
          connection: error ? 'failed' : 'success',
          error: error?.message
        }
      }));
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        database: {
          connection: 'failed',
          error: err
        }
      }));
    }
  };

  useEffect(() => {
    runDebug();
  }, [user, loading, userRecord, refreshTrigger]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-semibold text-blue-800">Auth Status:</h2>
          <pre className="text-sm text-blue-700 mt-2">
            {JSON.stringify(debugInfo.auth, null, 2)}
          </pre>
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h2 className="font-semibold text-green-800">Data Context:</h2>
          <pre className="text-sm text-green-700 mt-2">
            {JSON.stringify(debugInfo.data, null, 2)}
          </pre>
        </div>

        {debugInfo.database && (
          <div className={`border rounded p-4 ${
            debugInfo.database.connection === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h2 className={`font-semibold ${
              debugInfo.database.connection === 'success' 
                ? 'text-green-800' 
                : 'text-red-800'
            }`}>
              Database Connection: {debugInfo.database.connection}
            </h2>
            {debugInfo.database.error && (
              <pre className="text-sm mt-2">
                {JSON.stringify(debugInfo.database.error, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4">
        <h3 className="font-semibold mb-2">What to Look For:</h3>
        <ul className="text-sm space-y-1">
          <li>• Is the user authenticated? (should show user email)</li>
          <li>• Is loading stuck on true?</li>
          <li>• Is there a userRecord?</li>
          <li>• Is database connection working?</li>
        </ul>
      </div>
    </div>
  );
} 