export function GeminiIcon({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gemini-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9B72F2" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        fill="url(#gemini-grad)"
        d="M12 1.5c.4 4.6 4.4 8.6 9 9-4.6.4-8.6 4.4-9 9-.4-4.6-4.4-8.6-9-9 4.6-.4 8.6-4.4 9-9z"
      />
    </svg>
  );
}
