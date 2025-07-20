"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function CheckPetSharesPage() {
  const [shares, setShares] = useState<any>(null);

  const checkPetShares = async () => {
    try {
      const { data, error } = await supabase
        .from('pet_shares')
        .select('*');

      if (error) {
        setShares({ error });
      } else {
        setShares({ data });
      }
    } catch (error) {
      setShares({ error });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Check Pet Shares Table</h1>
      
      <button 
        onClick={checkPetShares}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Check Pet Shares
      </button>

      {shares && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Pet Shares Data:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(shares, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 