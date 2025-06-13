import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Outer glow effect */}
        <div
          className={`animate-spin rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-sm ${sizeClasses[size]}`}
        ></div>
        {/* Main spinner */}
        <div
          className={`absolute inset-0 animate-spin rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 ${sizeClasses[size]}`}
          style={{
            backgroundClip: 'padding-box',
            maskImage: 'conic-gradient(from 0deg, transparent 0deg, black 90deg, black 360deg)',
            WebkitMaskImage: 'conic-gradient(from 0deg, transparent 0deg, black 90deg, black 360deg)'
          }}
        ></div>
      </div>
      {text && (
        <p className="mt-4 text-sm text-gray-300 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;