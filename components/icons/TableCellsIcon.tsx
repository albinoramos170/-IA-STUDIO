
import React from 'react';

const TableCellsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h.008v.008h-.008v-.008Zm17.25 0h.008v.008h-.008v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 4.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125.504 1.125 1.125v-1.5c0-.621-.504-1.125-1.125-1.125m-17.25 0h.008v.008h-.008V4.5Zm17.25 0h.008v.008h-.008V4.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 10.5h17.25M3.375 15h17.25" />
  </svg>
);

export default TableCellsIcon;
