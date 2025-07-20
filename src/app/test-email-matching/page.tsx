"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/utils/supabase";

export default function TestEmailMatchingPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);

  const testEmailMatching = async () => {
    if (!user) {
      setResult({ error: "No authenticated user" });
      return;
    }

    try {
      // Get all pet shares
      const { data: allShares, error: sharesError } = await supabase
        .from('pet_shares')
        .select('*');

      if (sharesError) {
        setResult({ error: "Failed to get pet shares", details: sharesError });
        return;
      }

      const userEmail = user.email;
             const analysis: any = {
         userEmail: userEmail,
         userEmailLength: userEmail?.length,
         userEmailCharCodes: userEmail ? Array.from(userEmail as string).map((c: string) => c.charCodeAt(0)) : [],
         allShares: allShares || [],
         matchingShares: [],
         nonMatchingShares: []
       };

      // Analyze each share
      if (allShares) {
        allShares.forEach((share, index) => {
          const shareEmail = share.shared_with_email;
          const exactMatch = shareEmail === userEmail;
          const caseInsensitiveMatch = shareEmail?.toLowerCase() === userEmail?.toLowerCase();
          const trimmedMatch = shareEmail?.trim() === userEmail?.trim();

          const shareAnalysis = {
            index,
            shareEmail,
            shareEmailLength: shareEmail?.length,
                         shareEmailCharCodes: shareEmail ? Array.from(shareEmail as string).map((c: string) => c.charCodeAt(0)) : [],
            exactMatch,
            caseInsensitiveMatch,
            trimmedMatch,
            difference: exactMatch ? null : {
              caseInsensitive: caseInsensitiveMatch,
              trimmed: trimmedMatch,
              userEmailLower: userEmail?.toLowerCase(),
              shareEmailLower: shareEmail?.toLowerCase(),
              userEmailTrimmed: userEmail?.trim(),
              shareEmailTrimmed: shareEmail?.trim()
            }
          };

          if (exactMatch) {
            analysis.matchingShares.push(shareAnalysis);
          } else {
            analysis.nonMatchingShares.push(shareAnalysis);
          }
        });
      }

      setResult(analysis);

    } catch (error) {
      setResult({ error: "Test failed", details: error });
    }
  };

  const fixEmailCase = async () => {
    if (!user || !result?.nonMatchingShares) {
      setResult({ error: "No non-matching shares to fix" });
      return;
    }

    try {
      const fixes = [];
      
      for (const shareAnalysis of result.nonMatchingShares) {
        if (shareAnalysis.caseInsensitiveMatch) {
          // Update the share to match the user's email exactly
          const { error: updateError } = await supabase
            .from('pet_shares')
            .update({ shared_with_email: user.email })
            .eq('id', shareAnalysis.share.id);

          if (updateError) {
            fixes.push({ 
              shareId: shareAnalysis.share.id, 
              error: updateError 
            });
          } else {
            fixes.push({ 
              shareId: shareAnalysis.share.id, 
              success: true,
              oldEmail: shareAnalysis.shareEmail,
              newEmail: user.email
            });
          }
        }
      }

      setResult({ 
        ...result, 
        fixes,
        message: "Email case fixes attempted"
      });

    } catch (error) {
      setResult({ error: "Fix failed", details: error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Email Matching</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="font-semibold">Current User:</h2>
          <p>Email: {user?.email || "Not authenticated"}</p>
        </div>

        <div className="space-x-4">
          <button 
            onClick={testEmailMatching}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test Email Matching
          </button>
          
          {result?.nonMatchingShares?.length > 0 && (
            <button 
              onClick={fixEmailCase}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Fix Email Case Issues
            </button>
          )}
        </div>

        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 