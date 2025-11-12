import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function ErrorMessage({ message, onRetry, showRetry = true }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-red-600 mb-2">Something went wrong</h3>
      <p className="text-red-500 mb-6">{message}</p>
      {showRetry && onRetry && (
        <button 
          onClick={onRetry}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center mx-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
