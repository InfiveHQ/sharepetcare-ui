import React from "react";

export default function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
} 