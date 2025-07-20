"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const router = useRouter();

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
        result = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name: name || email.split('@')[0]
            }
          }
        });
        
        // For signup, we'll let the dashboard handle user record creation
        // This avoids timing issues with authentication
        if (result.data.user && !result.error) {
          console.log("Signup successful for:", result.data.user.email);
          
          // Check if email confirmation is required
          if (result.data.user.email_confirmed_at) {
            setSuccess("Account created successfully!");
          } else {
            // For development, try to sign in immediately after signup
            console.log("Attempting immediate sign in after signup...");
            const signInResult = await supabase.auth.signInWithPassword({ email, password });
            
            if (signInResult.error) {
              console.log("Immediate sign in failed:", signInResult.error);
              setSuccess("Account created successfully! Please check your email to confirm your account.");
            } else {
              console.log("Immediate sign in successful");
              setSuccess("Account created and signed in successfully!");
              // Clear form
              setEmail("");
              setPassword("");
              setName("");
              // Redirect to dashboard
              setTimeout(() => router.push('/dashboard'), 1500);
            }
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
          // Do not redirect to dashboard here; let the app state handle navigation
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