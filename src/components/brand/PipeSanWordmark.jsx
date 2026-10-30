import React, { useId } from 'react';

// Logoul PipeSan redesenat vectorial pentru fundaluri închise:
// „Pi”/„San” deschise, „pe” și valul în alamă, cu strălucirea din logo.
function PipeSanWordmark({ className = '', glow = true }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 640 240"
      className={className}
      role="img"
      aria-label="PipeSan"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`brass-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F1D08F" />
          <stop offset="50%" stopColor="#D4A85A" />
          <stop offset="100%" stopColor="#8C6A2E" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {glow && (
        <g filter={`url(#glow-${id})`} opacity="0.55">
          <path d="M118 178 C 210 150, 300 168, 390 196 S 560 214, 610 168" fill="none" stroke="#D4A85A" strokeWidth="22" strokeLinecap="round" />
          <text x="20" y="140" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="150" letterSpacing="-4" fill="#D4A85A" opacity="0.35">PipeSan</text>
        </g>
      )}

      <text x="20" y="140" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="150" letterSpacing="-4">
        <tspan fill="#F6F4EF">Pi</tspan>
        <tspan fill={`url(#brass-${id})`}>pe</tspan>
        <tspan fill="#F6F4EF">San</tspan>
      </text>

      {/* valul de sub text, ca în logo */}
      <path d="M118 178 C 210 150, 300 168, 390 196 S 560 214, 610 168" fill="none" stroke={`url(#brass-${id})`} strokeWidth="10" strokeLinecap="round" />
      <path d="M140 196 C 190 184, 240 192, 280 214" fill="none" stroke="#F6F4EF" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export default PipeSanWordmark;
