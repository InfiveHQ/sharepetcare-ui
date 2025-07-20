"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

export default function TestSignupFlowPage() {
  const [status, setStatus] = useState("Ready to test");
  const [results, setResults] = useState<any>({});
  const { user, userRecord, loading } = useAuth();

  const testSignupFlow = async () => {
    setStatus("Testing signup flow...");
    setResults({});

    try {
      // Test 1: Check current auth state
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      console.log("Current user:", currentUser);
      console.log("User error:", userError);

      // Test 2: Check if user record exists
      if (currentUser) {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        console.log("Existing user check:", { existingUser, checkError });

        setResults({
          currentUser: {
            id: currentUser.id,
            email: currentUser.email,
            emailConfirmed: currentUser.email_confirmed_at
          },
          userRecord: existingUser,
          userRecordError: checkError
        });

        if (existingUser) {
          setStatus("✅ User record exists");
        } else {
          setStatus("⚠️ User authenticated but no user record");
        }
      } else {
        setStatus("❌ No authenticated user");
        setResults({ error: "No authenticated user" });
      }

    } catch (error) {
      console.error("Test error:", error);
      setStatus("❌ Test failed");
      setResults({ error: error });
    }
  };

  const testManualUserCreation = async () => {
    if (!user) {
      setStatus("❌ No authenticated user to create record for");
      return;
    }

    setStatus("Testing manual user creation...");

    try {
      const userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      };

      console.log("Attempting to create user record:", userData);

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      console.log("Create result:", { newUser, createError });

      if (createError) {
        setStatus("❌ Failed to create user record");
        setResults({
          error: createError,
          errorDetails: {
            message: createError.message,
            code: createError.code,
            details: createError.details,
            hint: createError.hint
          }
        });
      } else {
        setStatus("✅ User record created successfully!");
        setResults({
          success: true,
          newUser
        });
      }

    } catch (error) {
      console.error("Manual creation error:", error);
      setStatus("❌ Manual creation failed");
      setResults({ error: error });
    }
  };

  const testSignup = async () => {
    setStatus("Testing signup...");
    setResults({});

    try {
      // Use a real email for testing
      const testEmail = prompt("Enter a real email address for testing:");
      if (!testEmail) {
        setStatus("❌ No email provided");
        return;
      }
      
      const testPassword = "testpassword123";

      console.log("Attempting signup with:", testEmail);

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
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
          emailSent: data.user?.email_confirmed_at ? false : true
        });

        // Try to sign in immediately after signup
        if (!data.user?.email_confirmed_at) {
          console.log("Attempting immediate sign in...");
          const signInResult = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
          });
          
          console.log("Immediate sign in result:", signInResult);
          
          if (signInResult.error) {
            console.log("Immediate sign in failed:", signInResult.error);
            setResults((prev: any) => ({
              ...prev,
              immediateSignIn: {
                success: false,
                error: signInResult.error
              }
            }));
          } else {
            console.log("Immediate sign in successful");
            setResults((prev: any) => ({
              ...prev,
              immediateSignIn: {
                success: true,
                session: signInResult.data.session
              }
            }));
          }
        }
      }

    } catch (error) {
      console.error("Signup test error:", error);
      setStatus("❌ Signup test failed");
      setResults({ error: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Signup Flow Test</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testSignupFlow}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Current State
        </button>
        
        <button 
          onClick={testManualUserCreation}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
        >
          Test Manual User Creation
        </button>
        
        <button 
          onClick={testSignup}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 ml-2"
        >
          Test Signup
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-semibold text-blue-800">Status:</h2>
          <p className="text-blue-700">{status}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h2 className="font-semibold text-gray-800">Auth Context:</h2>
          <div className="text-sm space-y-2">
            <div><strong>Loading:</strong> {loading ? "Yes" : "No"}</div>
            <div><strong>User:</strong> {user ? "Yes" : "No"}</div>
            <div><strong>User Record:</strong> {userRecord ? "Yes" : "No"}</div>
          </div>
        </div>

        {results.error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h2 className="font-semibold text-red-800">Error:</h2>
            <pre className="text-sm text-red-700">
              {JSON.stringify(results.error, null, 2)}
            </pre>
          </div>
        )}

        {results.errorDetails && (
          <div className="bg-orange-50 border border-orange-200 rounded p-4">
            <h2 className="font-semibold text-orange-800">Error Details:</h2>
            <pre className="text-sm text-orange-700">
              {JSON.stringify(results.errorDetails, null, 2)}
            </pre>
          </div>
        )}

        {results.success && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800">Success:</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(results.newUser, null, 2)}
            </pre>
          </div>
        )}

        {results.currentUser && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h2 className="font-semibold text-yellow-800">Current User:</h2>
            <pre className="text-sm text-yellow-700">
              {JSON.stringify(results.currentUser, null, 2)}
            </pre>
          </div>
        )}

        {results.userRecord && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-800">User Record:</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(results.userRecord, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6 bg-purple-50 border border-purple-200 rounded p-4">
        <h3 className="font-semibold text-purple-800 mb-2">Instructions:</h3>
        <ol className="text-sm text-purple-700 space-y-1">
          <li>1. Go to the main page and sign up with a new email</li>
          <li>2. Check your email and confirm your account (if required)</li>
          <li>3. Sign in with your credentials</li>
          <li>4. Come back to this page and click "Test Current State"</li>
          <li>5. If no user record exists, click "Test Manual User Creation"</li>
        </ol>
      </div>
    </div>
  );
} 