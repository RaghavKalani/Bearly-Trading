import React from 'react';

const BearLogo = ({ className = "w-16 h-16" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bear head */}
      <circle cx="100" cy="100" r="60" fill="#8B4513" />
      
      {/* Left ear */}
      <circle cx="70" cy="60" r="20" fill="#8B4513" />
      <circle cx="70" cy="60" r="12" fill="#D2691E" />
      
      {/* Right ear */}
      <circle cx="130" cy="60" r="20" fill="#8B4513" />
      <circle cx="130" cy="60" r="12" fill="#D2691E" />
      
      {/* Snout */}
      <ellipse cx="100" cy="110" rx="30" ry="25" fill="#D2691E" />
      
      {/* Left eye */}
      <circle cx="85" cy="90" r="6" fill="#000" />
      
      {/* Right eye */}
      <circle cx="115" cy="90" r="6" fill="#000" />
      
      {/* Nose */}
      <ellipse cx="100" cy="110" rx="8" ry="6" fill="#000" />
      
      {/* Mouth */}
      <path
        d="M 100 115 Q 90 125 85 120"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 100 115 Q 110 125 115 120"
        stroke="#000"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
};

export default BearLogo;
