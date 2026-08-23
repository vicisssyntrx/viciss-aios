import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useTodayLog } from "@/hooks/useDailyLogs"; 
import { useNotifications } from "@/hooks/useNotifications";
import { sendMessageToAI, AIProvider } from "@/lib/ai";

export default function RabbitAssistant() {
  const [enabled, setEnabled] = useState(() => (localStorage.getItem("rabbit-mode") || localStorage.getItem("rabit-mode") || "on") !== "off");
  const { data: todayLog } = useTodayLog();
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  
  // Track tasks completion to trigger chats
  const completedCount = todayLog?.completed_habits?.length || 0;
  const prevCompletedCount = useRef(completedCount);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setEnabled((localStorage.getItem("rabbit-mode") || localStorage.getItem("rabit-mode") || "on") !== "off");
    };
    window.addEventListener("rabbit-mode-changed", handleStorageChange);
    window.addEventListener("rabit-mode-changed", handleStorageChange);
    return () => {
      window.removeEventListener("rabbit-mode-changed", handleStorageChange);
      window.removeEventListener("rabit-mode-changed", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (completedCount > prevCompletedCount.current) {
      setChatMessage("Great job! Keep it up! 🥕");
      setTimeout(() => setChatMessage(null), 4000);
    }
    prevCompletedCount.current = completedCount;
  }, [completedCount]);

  const { sendNotification } = useNotifications();

  // "Cron job" background scheduler for reminders
  useEffect(() => {
    if (!enabled) return;

    const checkAndNotify = async () => {
      const lastNotified = parseInt(localStorage.getItem("rabbit-last-notified") || localStorage.getItem("rabit-last-notified") || "0");
      const twoHours = 2 * 60 * 60 * 1000;
      
      // Check if 2 hours have passed since last notification
      if (Date.now() - lastNotified < twoHours) return;

      const pendingTasks = (todayLog?.habits?.length || 0) - (todayLog?.completed_habits?.length || 0);
      if (pendingTasks <= 0) return; // No need to remind if all tasks done!

      const provider = (localStorage.getItem("ai-provider") || "openrouter") as AIProvider;
      const apiKey = provider === "google" ? localStorage.getItem("google-ai-key") : localStorage.getItem("openrouter-key");
      const modelId = provider === "google" ? localStorage.getItem("google-ai-model") : localStorage.getItem("openrouter-model");

      if (!apiKey || !modelId) return; // Can't send AI notifications if not configured

      try {
        const reply = await sendMessageToAI([
          { 
            role: "system", 
            content: `You are Rabbit, a witty AI accountability partner. The user has ${pendingTasks} pending tasks today. Write a SINGLE very short, punchy, and motivational push notification (under 15 words) to remind them.` 
          }
        ], provider, apiKey, modelId);
        
        await sendNotification("Rabbit Reminder 🥕", reply);
        localStorage.setItem("rabbit-last-notified", Date.now().toString());
        setChatMessage(reply);
        setTimeout(() => setChatMessage(null), 5000);
      } catch (e) {
        console.error("Scheduled AI notification failed:", e);
      }
    };

    // Check immediately on mount, then every 30 minutes
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [enabled, todayLog?.habits?.length, todayLog?.completed_habits?.length, sendNotification]);

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

  // Float animation for breathing effect
  useEffect(() => {
    if (!enabled) return;
    const float = animate(y, [0, -10, 0], {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    });
    return () => float.stop();
  }, [enabled, y]);

  // Eye tracking for vector mode (looks towards center based on docked edge)
  const eyeX = useMotionValue(0);
  const eyeY = useMotionValue(0);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      // Check which edge it's currently on (0 is right, large negative is left)
      const currentX = x.get();
      const isOnLeftEdge = currentX < -(window.innerWidth / 2);
      
      // 70% chance to look at center, 30% chance to dart randomly
      const lookAtCenter = Math.random() < 0.7;
      
      let targetX = 0;
      let targetY = 0;

      if (lookAtCenter) {
        // Look towards center of screen (left if docked right, right if docked left)
        targetX = isOnLeftEdge ? 6 : -6;
        targetY = -2; // Look slightly up towards center
      } else {
        // Random darting
        targetX = (Math.random() - 0.5) * 8;
        targetY = (Math.random() - 0.5) * 8;
      }
      
      animate(eyeX, targetX, { type: "spring", stiffness: 300, damping: 20 });
      animate(eyeY, targetY, { type: "spring", stiffness: 300, damping: 20 });
    }, 2000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [enabled, eyeX, eyeY, x]);

  if (!enabled) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={constraints}
      onDragStart={() => {
        isDragging.current = true;
      }}
      onDragEnd={(e, info) => {
        setTimeout(() => (isDragging.current = false), 150);
        // Snap to edges
        const currentX = x.get() + info.offset.x;
        const threshold = -(window.innerWidth / 2);
        
        if (currentX < threshold) {
          // Snap to left edge
          animate(x, -window.innerWidth + 100, { type: "spring", stiffness: 300, damping: 25 });
        } else {
          // Snap to right edge (origin 0)
          animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
        }
      }}
      onTap={() => {
        if (!isDragging.current) {
          window.dispatchEvent(new Event("open-ai-chat"));
        }
      }}
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
        <VectorRabbit eyeX={eyeX} eyeY={eyeY} />
      </div>
    </motion.div>
  );
}

// Vector Rabbit (Tracks eyes using Framer Motion)
function VectorRabbit({ eyeX, eyeY }: { eyeX: unknown; eyeY: unknown }) {
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
