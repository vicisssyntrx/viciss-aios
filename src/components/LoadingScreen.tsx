import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(251, 191, 36, 0.12) 0%, hsl(var(--primary) / 0.08) 40%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-6 px-8 py-10 glass rounded-3xl w-80 shadow-2xl border border-white/10 dark:border-white/5 bg-background/40 backdrop-blur-xl"
      >
        {/* Logo / brand */}
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            className="logo-shimmer-container shadow-xl border border-white/20 dark:border-white/10"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 140, 
              damping: 12, 
              delay: 0.15 
            }}
          >
            <img 
              src="/icon-192.png" 
              alt="Viciss AIOS Logo" 
              className="w-20 h-20 rounded-2xl object-cover" 
            />
            <div className="logo-shimmer-shine" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-2xl font-black tracking-wider text-gold-gradient uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
          >
            Viciss AIOS
          </motion.h1>
        </div>

        {/* Outer Circular Loading Ring */}
        <div className="relative w-16 h-16 my-2">
          <svg
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "1.4s" }}
            viewBox="0 0 64 64"
            fill="none"
          >
            {/* Background thin track */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="3.5"
            />
            {/* Foreground glowing dash */}
            <path
              d="M32 4 A28 28 0 0 1 60 32"
              stroke="url(#spinner-gradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          {/* Inner breathing glow dot */}
          <span
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <motion.span 
              className="w-3.5 h-3.5 rounded-full bg-primary" 
              style={{
                boxShadow: "0 0 12px hsl(var(--primary))"
              }}
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </span>
        </div>

        {/* Cycling message with clean AnimatePresence transition */}
        <div className="h-6 flex items-center justify-center w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={displayMsg}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-xs font-semibold tracking-wide text-muted-foreground/90 text-center uppercase"
            >
              {displayMsg}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Sleek Golden-Primary glowing loadbar */}
        <div className="w-full h-1 rounded-full bg-secondary/50 overflow-hidden relative shadow-inner">
          <div
            className="h-full rounded-full origin-left"
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary)), #fbbf24)",
              boxShadow: "0 0 8px rgba(251,191,36,0.4)",
              animation: "loadBar 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />
        </div>
      </motion.div>

      {/* Keyframes injected inline so no extra CSS file is needed */}
      <style>{`
        .logo-shimmer-container {
          position: relative;
          overflow: hidden;
          border-radius: 1.25rem;
          width: 5rem;
          height: 5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-shimmer-shine {
          position: absolute;
          top: 0;
          left: -150%;
          width: 150%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.35) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-20deg);
          animation: shimmerSweep 3s infinite ease-in-out;
          animation-delay: 0.6s;
        }
        @keyframes shimmerSweep {
          0% { left: -150%; }
          50% { left: 150%; }
          100% { left: 150%; }
        }
        @keyframes loadBar {
          0%   { transform: scaleX(0);    margin-left: 0%; }
          50%  { transform: scaleX(0.75); margin-left: 0%; }
          100% { transform: scaleX(0);    margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
