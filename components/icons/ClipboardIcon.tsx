
import React from 'react';

const ClipboardIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25V4.5A2.25 2.25 0 0 1 9 2.25h1.5m3 4.5V7.5a2.25 2.25 0 0 0-2.25-2.25h-1.5a2.25 2.25 0 0 0-2.25 2.25v.75m3 4.5h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm-3-3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0-3h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0-3h.008v.008h-.008v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75H9.75v5.25H15V18s0-3 0-3H9.75v-2.25H9V12.75Z" />
    <path d="M9 1.5a2.25 2.25 0 0 1 2.25 2.25v1.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 5.25v-1.5A2.25 2.25 0 0 1 6.75 1.5h2.25Z" clipRule="evenodd" fill="currentColor" fillOpacity="0.1" />
    <path d="M6 12a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 12v7.5A2.25 2.25 0 0 1 15.75 21.75h-7.5A2.25 2.25 0 0 1 6 19.5v-7.5Z" clipRule="evenodd" fill="currentColor" fillOpacity="0.1"/>
  </svg>
);

export default ClipboardIcon;
