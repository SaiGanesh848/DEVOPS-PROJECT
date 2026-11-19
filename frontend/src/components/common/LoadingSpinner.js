import React from 'react';

const LoadingSpinner = ({ size = 'lg', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600`}
      />
      {message && (
        <p className="mt-4 text-sm text-gray-500 font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
