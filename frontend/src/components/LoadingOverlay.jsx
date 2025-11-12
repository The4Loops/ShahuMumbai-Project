import React from 'react';

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-lg">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-300 rounded-full animate-spin border-t-transparent border-t-gray-800"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-800 rounded-full animate-ping"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;