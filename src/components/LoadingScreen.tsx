import { useEffect, useState } from "react";

const MESSAGES = [
  "Connecting to Supabase…",
  "Loading your habits…",
  "Calculating your growth…",
  "Almost there…",
];

interface Props {
  /** Optional message override */
  message?: string;
}

export default function LoadingScreen({ message }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  // Cycle through messages every 1.4 s for visual feedback
  useEffect(() => {
    if (message) return; // static message — no cycling
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 1400);
    return () => clearInterval(id);
  }, [message]);

  const displayMsg = message ?? MESSAGES[msgIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Subtle radial glow behind the logo */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(0 72% 20% / 0.35) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 py-10 glass rounded-2xl w-72 shadow-2xl">
        {/* Logo / brand */}
        <div className="flex flex-col items-center gap-3">
          <img src="/icon-192.png" alt="Viciss AIOS Logo" className="w-16 h-16 rounded-2xl shadow-lg" />
          <h1 className="text-xl font-bold tracking-tight text-gold-gradient">
            Viciss AIOS
          </h1>
        </div>

        {/* Spinner */}
        <div className="relative w-14 h-14">
          {/* Outer ring */}
          <svg
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "1.2s" }}
            viewBox="0 0 56 56"
            fill="none"
          >
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="hsl(var(--border))"
              strokeWidth="3"
            />
            <path
              d="M28 4 A24 24 0 0 1 52 28"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          {/* Inner pulse dot */}
          <span
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </span>
        </div>

        {/* Cycling message */}
        <p className="text-sm text-muted-foreground text-center animate-in fade-in duration-500">
          {displayMsg}
        </p>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary origin-left"
            style={{
              animation: "loadBar 2.8s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Keyframes injected inline so no extra CSS file is needed */}
      <style>{`
        @keyframes loadBar {
          0%   { transform: scaleX(0);    margin-left: 0%; }
          50%  { transform: scaleX(0.7);  margin-left: 0%; }
          100% { transform: scaleX(0);    margin-left: 100%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
