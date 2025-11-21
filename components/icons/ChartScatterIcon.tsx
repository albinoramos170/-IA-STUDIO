import React from 'react';

const ChartScatterIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path d="M8.5 15.5 a 1 1 0 0 1 0 -2 a 1 1 0 0 1 0 2z" fill="currentColor" strokeWidth="0" />
      <path d="M12.5 11.5 a 1 1 0 0 1 0 -2 a 1 1 0 0 1 0 2z" fill="currentColor" strokeWidth="0" />
      <path d="M16.5 7.5 a 1 1 0 0 1 0 -2 a 1 1 0 0 1 0 2z" fill="currentColor" strokeWidth="0" />
      <path d="M10.5 8.5 a 1 1 0 0 1 0 -2 a 1 1 0 0 1 0 2z" fill="currentColor" strokeWidth="0" />
      <path d="M14.5 14.5 a 1 1 0 0 1 0 -2 a 1 1 0 0 1 0 2z" fill="currentColor" strokeWidth="0" />
    </svg>
);

export default ChartScatterIcon;
