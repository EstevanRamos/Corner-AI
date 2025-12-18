import React from 'react';

interface LoadingOverlayProps {
  message?: string;
  subMessage?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = "Analyzing Fight Data", 
  subMessage = "Parsing strikes, grappling exchanges, and control time..." 
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-t-4 border-red-600 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-t-4 border-blue-600 rounded-full animate-spin reverse-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-heading text-xl text-white tracking-widest animate-pulse">
          AI
        </div>
      </div>
      <h2 className="text-2xl font-heading text-white tracking-widest mb-2">{message}</h2>
      <p className="text-slate-400 font-mono text-sm">{subMessage}</p>
      
      <div className="mt-8 grid grid-cols-3 gap-2 w-full max-w-md">
        <div className="h-1 bg-red-600 rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="h-1 bg-slate-600 rounded animate-pulse" style={{ animationDelay: '150ms' }}></div>
        <div className="h-1 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default LoadingOverlay;