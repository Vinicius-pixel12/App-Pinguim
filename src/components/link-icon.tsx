import React from "react";

export function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      className={className}
      fill="white"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.977 15.516a4.984 4.984 0 0 1 0-7.068l3.478-3.478a4.984 4.984 0 1 1 7.07 7.07l-1.883 1.884" />
      <path d="M14.023 8.484a4.984 4.984 0 0 1 0 7.068l-3.478 3.478a4.984 4.984 0 1 1-7.07-7.07l1.883-1.884" />
    </svg>
  );
}
