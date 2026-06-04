import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useTodayLog } from "@/hooks/useDailyLogs"; 

export default function RabitAssistant() {
  const [enabled, setEnabled] = useState(() => (localStorage.getItem("rabit-mode") || "on") !== "off");
  const { data: todayLog } = useTodayLog();
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  
  // Track tasks completion to trigger chats
  const completedCount = todayLog?.completed_habits?.length || 0;
  const prevCompletedCount = useRef(completedCount);

  useEffect(() => {
    const handleStorageChange = () => {
      setEnabled((localStorage.getItem("rabit-mode") || "on") !== "off");
    };
    window.addEventListener("rabit-mode-changed", handleStorageChange);
    return () => window.removeEventListener("rabit-mode-changed", handleStorageChange);
  }, []);

  useEffect(() => {
    if (completedCount > prevCompletedCount.current) {
      setChatMessage("Great job! Keep it up! 🥕");
      setTimeout(() => setChatMessage(null), 4000);
    }
    prevCompletedCount.current = completedCount;
  }, [completedCount]);

  // Framer Motion Drag values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Dynamic constraints to limit movement with a gap on all sides
  const [constraints, setConstraints] = useState({ left: -300, right: 20, top: -500, bottom: 20 });

  useEffect(() => {
    const updateConstraints = () => {
      setConstraints({
        left: -window.innerWidth + 100,
        right: 20,
        top: -window.innerHeight + 180,
        bottom: 20
      });
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  // Eye tracking for vector mode
  const eyeX = useTransform(x, [-150, 150], [-4, 4]);
  const eyeY = useTransform(y, [-300, 300], [-4, 4]);

  if (!enabled) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={constraints}
      onTap={() => window.dispatchEvent(new Event("open-ai-chat"))}
      className="fixed z-[9999] cursor-grab active:cursor-grabbing touch-none bottom-[178px] md:bottom-[132px] right-3 md:right-[calc(max(2rem,calc(50%-38rem))-12px)]"
      style={{ x, y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Chat Bubble */}
      {chatMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          className="absolute bottom-full mb-3 right-0 w-[140px] p-3 rounded-2xl rounded-br-none glass-strong text-foreground text-xs font-medium shadow-2xl z-10 whitespace-pre-wrap"
        >
          {chatMessage}
        </motion.div>
      )}

      {/* Render Vector Mode */}
      <div className="w-20 h-20 relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
        <VectorRabit eyeX={eyeX} eyeY={eyeY} />
      </div>
    </motion.div>
  );
}

// Vector Rabbit (Tracks eyes using Framer Motion)
function VectorRabit({ eyeX, eyeY }: { eyeX: any; eyeY: any }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full text-foreground fill-current drop-shadow-md">
      {/* Ears */}
      <path d="M 35 45 C 20 10, 30 -10, 40 20 Z" />
      <path d="M 65 45 C 80 10, 70 -10, 60 20 Z" />
      {/* Head */}
      <circle cx="50" cy="65" r="28" className="fill-card stroke-foreground stroke-[4px]" />
      
      {/* Eyes Container */}
      <motion.g style={{ x: eyeX, y: eyeY }}>
        {/* Left Eye */}
        <circle cx="40" cy="58" r="4" />
        {/* Right Eye */}
        <circle cx="60" cy="58" r="4" />
      </motion.g>
      
      {/* Nose */}
      <path d="M 48 68 L 52 68 L 50 72 Z" />
    </svg>
  );
}
