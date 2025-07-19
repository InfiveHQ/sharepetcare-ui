"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    console.log("Attempting auth:", isLogin ? "login" : "signup", email);

    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
        
        // If signup is successful, create a user record in the users table
        if (result.data.user && !result.error) {
          console.log("Auth successful, creating user record for:", result.data.user.id);
          
          // Add a longer delay to ensure auth is complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const userData = {
            id: result.data.user.id,
            email: result.data.user.email,
            name: name || email.split('@')[0] // Use provided name or email prefix as fallback
          };
          
          console.log("Attempting to insert user data:", userData);
          
          try {
                      // First check if user already exists by email
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id, name')
            .eq('email', result.data.user.email)
            .single();
          
          if (checkError && checkError.code !== 'PGRST116') {
            console.error("Error checking existing user:", checkError);
          }
          
          if (existingUser) {
            console.log("User already exists, updating with new auth ID:", existingUser);
            console.log("Current auth user ID:", result.data.user.id);
            console.log("Existing user ID:", existingUser.id);
            
            // Check if this is a placeholder user (created during sharing)
            // Placeholder users have UUIDs that don't match the auth user ID
            const isPlaceholder = existingUser.id !== result.data.user.id;
            console.log("Is placeholder user:", isPlaceholder);
            console.log("Existing user ID:", existingUser.id);
            console.log("Auth user ID:", result.data.user.id);
            
            if (isPlaceholder) {
              console.log("Updating placeholder user with real auth ID");
              
              // Test if we can update the ID field
              console.log("Testing ID update from", existingUser.id, "to", result.data.user.id);
              
              try {
                // First, update pet_shares to reference the new auth ID
                console.log("Updating pet_shares to reference new auth ID...");
                const { error: petSharesError } = await supabase
                  .from('pet_shares')
                  .update({ shared_with_id: result.data.user.id })
                  .eq('shared_with_id', existingUser.id);
                
                if (petSharesError) {
                  console.error("Failed to update pet_shares:", petSharesError);
                  setError(`Signup successful but pet sharing failed: ${petSharesError.message}`);
                  return;
                }
                
                console.log("Successfully updated pet_shares, now deleting placeholder user...");
                
                // Delete the placeholder user (now that pet_shares doesn't reference it)
                const { error: deleteError } = await supabase
                  .from('users')
                  .delete()
                  .eq('id', existingUser.id);
                
                if (deleteError) {
                  console.error("Failed to delete placeholder user:", deleteError);
                  setError(`Pet sharing updated but user cleanup failed: ${deleteError.message}`);
                  return;
                }
                
                console.log("Successfully deleted placeholder user, now creating new user record...");
                
                // Create a new user record with the correct auth ID
                const { error: createError } = await supabase
                  .from('users')
                  .insert({
                    id: result.data.user.id,
                    email: result.data.user.email,
                    name: name || email.split('@')[0],
                    updated_at: new Date().toISOString()
                  });

                if (createError) {
                  console.error("Failed to create new user record:", createError);
                  console.error("Create error details:", {
                    message: createError.message,
                    code: createError.code,
                    details: createError.details
                  });
                  setError(`Signup successful but profile creation failed: ${createError.message}`);
                } else {
                  console.log("Successfully created user and updated pet_shares");
                  setSuccess("Account created successfully!");
                  setEmail("");
                  setPassword("");
                  setName("");
                }
              } catch (error) {
                console.error("Unexpected error during update:", error);
                setError(`Signup successful but profile update failed: ${error}`);
              }
            } else {
              // Regular user update
              console.log("Regular user update (not placeholder)");
              const { data: updateData, error: updateError } = await supabase
                .from('users')
                .update({ 
                  id: result.data.user.id,
                  name: name || email.split('@')[0] // Update name if provided
                })
                .eq('email', result.data.user.email)
                .select();
              
              if (updateError) {
                console.error("Failed to update existing user:", updateError);
                console.error("Update error details:", {
                  message: updateError.message,
                  code: updateError.code,
                  details: updateError.details
                });
                
                // Log the full error object
                console.error("Full update error object:", JSON.stringify(updateError, null, 2));
                
                setError(`Signup successful but profile update failed: ${updateError.message}`);
              } else {
                console.log("Existing user updated successfully:", updateData);
              }
            }
          } else {
            // Create new user
            console.log("No existing user found, creating new user");
            const { data: insertData, error: userError } = await supabase
              .from('users')
              .insert([userData])
              .select();
            
            console.log("Insert result:", { insertData, userError });
            
            if (userError) {
              console.error("Failed to create user record:", userError);
              console.error("Error type:", typeof userError);
              console.error("Error keys:", Object.keys(userError || {}));
              console.error("Error details:", {
                message: userError?.message,
                code: userError?.code,
                details: userError?.details,
                hint: userError?.hint
              });
              
              // Log the full error object
              console.error("Full error object:", JSON.stringify(userError, null, 2));
              
              // Show error to user but don't fail signup
              setError(`Account created but profile setup failed: ${userError.message}`);
            } else {
              console.log("User record created successfully:", insertData);
            }
          }
          } catch (error) {
            console.error("Unexpected error creating user record:", error);
            setError("Account created but profile setup failed. Please contact support.");
          }
        }
      }
      
      console.log("Auth result:", result);
      
      if (result.error) {
        console.error("Auth error:", result.error);
        setError(result.error.message);
      } else if (result.data.user) {
        console.log("Auth successful:", result.data.user.email);
        
        // Only show success if we're not in signup mode OR if signup succeeded without user record errors
        if (isLogin || (!error || error === "")) {
          setSuccess(isLogin ? "Signed in successfully!" : "Account created successfully!");
          // Clear form
          setEmail("");
          setPassword("");
          setName("");
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Sign In" : "Sign Up"}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded-lg p-3"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg p-3"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-lg p-3"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-sm bg-green-50 p-3 rounded-lg">
              {success}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>
        
        <button
          type="button"
          className="w-full text-blue-600 underline mt-4"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setSuccess("");
            setName("");
          }}
        >
          {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
} 