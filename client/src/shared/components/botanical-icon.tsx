import React from "react";

interface BotanicalIconProps {
  className?: string;
  size?: number;
}

export function BotanicalIcon({ className = "", size = 48 }: BotanicalIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Delicate botanical central stem */}
      <path d="M50 115 C50 90, 52 50, 46 15" />
      
      {/* Top leaflet */}
      <path d="M46 15 C44 8, 48 4, 52 7 C55 10, 52 14, 46 15" />
      
      {/* Left upper leaf */}
      <path d="M48 35 C38 28, 30 32, 34 38 C38 42, 45 40, 48 37" />
      
      {/* Right upper leaf */}
      <path d="M49 48 C58 40, 68 44, 64 52 C60 56, 52 54, 49 50" />
      
      {/* Left middle leaf */}
      <path d="M49 68 C36 60, 28 66, 32 74 C36 78, 45 74, 49 70" />
      
      {/* Right lower leaf */}
      <path d="M50 85 C62 76, 72 82, 68 90 C64 96, 54 92, 50 88" />
    </svg>
  );
}

