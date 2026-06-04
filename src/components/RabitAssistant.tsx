import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useTodayLog } from "@/hooks/useDailyLogs";
import Lottie from "lottie-react";

// Placeholder Lottie for Option 3 (Premium)
const LOTTIE_URL = "https://assets9.lottiefiles.com/packages/lf20_jcikwtux.json"; 

export default function RabitAssistant() {
  const [mode, setMode] = useState(() => localStorage.getItem("rabit-mode") || "vector");
  const { data: todayLog } = useTodayLog();
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  
  // Track tasks completion to trigger chats
  const completedCount = todayLog?.completed_habits?.length || 0;
  const prevCompletedCount = useRef(completedCount);

  useEffect(() => {
    const handleStorageChange = () => {
      setMode(localStorage.getItem("rabit-mode") || "vector");
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

  // Eye tracking for vector mode
  // The pupils will move slightly based on where Rabit is dragged on screen
  const eyeX = useTransform(x, [-150, 150], [-4, 4]);
  const eyeY = useTransform(y, [-300, 300], [-4, 4]);

  if (mode === "off") return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      // Keep within bounds of the screen approximately
      dragConstraints={{ left: -20, right: window.innerWidth - 100, top: -400, bottom: -20 }}
      className="fixed z-[9999] cursor-grab active:cursor-grabbing touch-none"
      style={{ x, y, bottom: 120, right: 30 }}
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

      {/* Render selected mode */}
      <div className="w-20 h-20 relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
        {mode === "vector" && (
          <VectorRabit eyeX={eyeX} eyeY={eyeY} />
        )}
        
        {mode === "sprite" && (
          <SpriteRabit />
        )}

        {mode === "lottie" && (
          <LottieRabit />
        )}
      </div>
    </motion.div>
  );
}

// Option 1: Responsive Vector (Tracks eyes using Framer Motion)
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

// Option 2: Retro Sprite (Snappy static pose)
function SpriteRabit() {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f === 0 ? 1 : 0));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-card rounded-3xl border-4 border-foreground flex items-center justify-center shadow-inner relative overflow-hidden">
      {/* Snappy pixel-art style face */}
      <div className="absolute top-2 left-3 w-4 h-12 border-2 border-foreground rounded-full transform -rotate-12 bg-card" />
      <div className="absolute top-2 right-3 w-4 h-12 border-2 border-foreground rounded-full transform rotate-12 bg-card" />
      
      <div className="flex gap-3 mt-4">
        <div className="w-3 h-4 bg-foreground rounded-full" style={{ transform: frame ? 'scaleY(0.2)' : 'none' }} />
        <div className="w-3 h-4 bg-foreground rounded-full" style={{ transform: frame ? 'scaleY(0.2)' : 'none' }} />
      </div>
      <div className="absolute bottom-4 w-4 h-2 border-b-4 border-foreground rounded-full" />
    </div>
  );
}

// Option 3: Premium Lottie (Generic Placeholder)
function LottieRabit() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(LOTTIE_URL)
      .then(res => res.json())
      .then(setAnimationData)
      .catch(() => {});
  }, []);

  if (!animationData) {
    return (
      <div className="w-full h-full flex items-center justify-center glass rounded-full animate-pulse">
        <span className="text-xl">🐰</span>
      </div>
    );
  }

  return (
    <Lottie 
      animationData={animationData} 
      loop={true} 
      className="w-[120%] h-[120%] -ml-2 -mt-2 drop-shadow-xl" 
    />
  );
}
