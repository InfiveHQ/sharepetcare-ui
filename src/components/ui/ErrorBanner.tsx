import React from "react";

export default function ErrorBanner({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-4 my-4">
      <span className="font-semibold">{error}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
} 