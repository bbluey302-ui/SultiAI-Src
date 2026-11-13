import React from 'react';

interface LinkedInIconProps {
  className?: string;
  size?: number;
}

export const LinkedInIcon: React.FC<LinkedInIconProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      aria-label="LinkedIn"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.88 0-1.6.72-1.6 1.6 0 .88.72 1.6 1.6 1.6.89 0 1.61-.72 1.61-1.6 0-.88-.72-1.6-1.61-1.6Z" />
    </svg>
  );
};
