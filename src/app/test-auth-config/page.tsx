"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function TestAuthConfigPage() {
  const [status, setStatus] = useState("Ready to test");
  const [results, setResults] = useState<any>({});

  const testAuthConfig = async () => {
    setStatus("Testing auth configuration...");
    setResults({});

    try {
      // Test 1: Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log("Environment variables:");
      console.log("URL:", url);
      console.log("Key exists:", !!key);
      console.log("Key length:", key?.length);

      // Test 2: Try to get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Session check:", { sessionData, sessionError });

      // Test 3: Try to get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log("User check:", { userData, userError });

      // Test 4: Check if we can access auth settings (this won't work with anon key, but worth trying)
      const { data: settingsData, error: settingsError } = await supabase
        .from('auth.users')
        .select('count')
        .limit(1);
      
      console.log("Settings check:", { settingsData, settingsError });

      setResults({
        env: {
          url: url,
          keyExists: !!key,
          keyLength: key?.length
        },
        session: {
          data: sessionData,
          error: sessionError
        },
        user: {
          data: userData,
          error: userError
        },
        settings: {
          data: settingsData,
          error: settingsError
        }
      });

      if (sessionError || userError) {
        setStatus("⚠️ Auth configuration issues detected");
      } else {
        setStatus("✅ Auth configuration looks good");
      }

    } catch (error) {
      console.error("Config test error:", error);
      setStatus("❌ Config test failed");
      setResults({ error: error });
    }
  };

  const testSimpleSignup = async () => {
    setStatus("Testing simple signup...");
    setResults({});

    try {
      const email = prompt("Enter your real email address:");
      if (!email) {
        setStatus("❌ No email provided");
        return;
      }

      const password = "testpassword123";
      console.log("Attempting signup with:", email);

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
      });

      console.log("Signup result:", { data, error });

      if (error) {
        setStatus("❌ Signup failed");
        setResults({
          error: error,
          errorDetails: {
            message: error.message,
            code: error.code
          }
        });
      } else {
        setStatus("✅ Signup successful");
        setResults({
          success: true,
          user: data.user,
          session: data.session,
          emailConfirmed: data.user?.email_confirmed_at,
          emailSent: !data.user?.email_confirmed_at
        });
      }

    } catch (error) {
      console.error("Simple signup error:", error);
      setStatus("❌ Simple signup failed");
      setResults({ error: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Configuration Test</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testAuthConfig}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Auth Configuration
        </button>
        
        <button 
          onClick={testSimpleSignup}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
        >
          Test Simple Signup
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-semibold text-blue-800">Status:</h2>
          <p className="text-blue-700">{status}</p>
        </div>

        {results.error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h2 className="font-semibold text-red-800">Error:</h2>
            <pre className="text-sm text-red-700">
              {JSON.stringify(results.error, null, 2)}
            </pre>
          </div>
        )}

        {results.env && (
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h2 className="font-semibold text-gray-800">Environment:</h2>
            <pre className="text-sm text-gray-700">
              {JSON.stringify(results.env, null, 2)}
            </pre>
          </div>
        )}

        {results.session && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h2 className="font-semibold text-yellow-800">Session:</h2>
            <pre className="text-sm text-yellow-700">
              {JSON.stringify(results.session, null, 2)}
            </pre>
          </div>
        )}

        {results.user && (
          <div className="bg-purple-50 border border-purple-200 rounded p-4">
            <h2 className="font-semibold text-purple-800">User:</h2>
            <pre className="text-sm text-purple-700">
              {JSON.stringify(results.user, null, 2)}
            </pre>
          </div>
        )}

        {results.success && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800">Success:</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(results.success, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-200 rounded p-4">
        <h3 className="font-semibold text-orange-800 mb-2">Next Steps:</h3>
        <ol className="text-sm text-orange-700 space-y-1">
          <li>1. Click "Test Auth Configuration" to check your Supabase setup</li>
          <li>2. Click "Test Simple Signup" with your real email</li>
          <li>3. Check if you receive a confirmation email</li>
          <li>4. If no email, check your Supabase dashboard settings</li>
        </ol>
      </div>
    </div>
  );
} 