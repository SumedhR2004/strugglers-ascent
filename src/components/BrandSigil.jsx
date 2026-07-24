import React from 'react';

export const BrandSigil = ({ className = '', size = 'w-32 h-32' }) => (
  <svg 
    viewBox="0 0 100 130" 
    className={`${size} ${className}`} 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="6" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Central spine (representing the sword / core strength) */}
    <path d="M50 15 L50 115" />
    
    {/* Upper double-chevron pointing UP (representing the Ascension of the Struggler) */}
    <path d="M32 35 L50 20 L68 35" />
    <path d="M32 55 L50 40 L68 55" />
    
    {/* Center horizontal sword hilt/crossbar */}
    <path d="M25 65 L75 65" />
    
    {/* Runic down-angled stabilization wings */}
    <path d="M50 65 L30 88" />
    <path d="M50 65 L70 88" />

    {/* Outer runic crescent brackets protecting the seal */}
    <path d="M20 28 C8 48, 8 82, 24 102" />
    <path d="M80 28 C92 48, 92 82, 76 102" />
  </svg>
);

export default BrandSigil;
