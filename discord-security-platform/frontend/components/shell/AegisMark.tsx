export function AegisMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 2L28 7V15C28 22.5 22.8 27.8 16 30C9.2 27.8 4 22.5 4 15V7L16 2Z"
        fill="url(#aegis-grad)"
        stroke="#9B82FF"
        strokeWidth="1"
      />
      <path d="M16 8L21.5 11V15.5C21.5 19.5 19.2 22.5 16 24C12.8 22.5 10.5 19.5 10.5 15.5V11L16 8Z" fill="#0A0E1A" fillOpacity="0.5" />
      <defs>
        <linearGradient id="aegis-grad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9B82FF" />
          <stop offset="1" stopColor="#4FD1FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
