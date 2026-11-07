
import React from 'react';

const BufferingLoader = ({ className = '' }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Outer ring */}
      <div className="w-4 h-4 border-2 border-gray-200 rounded-full"></div>
      
      {/* Main spinning ring */}
      <div className="absolute top-0 left-0 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      
      {/* Inner counter-spinning ring */}
      <div 
        className="absolute top-0.5 left-0.5 w-2 h-2 border border-blue-300 border-b-transparent rounded-full animate-spin"
        style={{
          animationDirection: 'reverse',
          animationDuration: '0.8s'
        }}
      ></div>
    </div>
  );
};


export default BufferingLoader
