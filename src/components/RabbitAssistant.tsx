import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useTodayLog } from "@/hooks/useDailyLogs"; 
import { useNotifications } from "@/hooks/useNotifications";
import { sendMessageToAI, AIProvider } from "@/lib/ai";
import { Bot, Sparkles } from "lucide-react";

export default function RabbitAssistant() {
  const [enabled, setEnabled] = useState(() => (localStorage.getItem("rabbit-mode") || localStorage.getItem("rabit-mode") || "on") !== "off");
  const { data: todayLog } = useTodayLog();
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Track tasks completion to trigger chats
  const completedCount = todayLog?.completed_habits?.length || 0;
  const prevCompletedCount = useRef(completedCount);
  const isDragging = useRef(false);

  // Monitor DOM for open modals / sheets / dialogs to move AI assistant to top
  useEffect(() => {
    const checkModal = () => {
      const modal = document.querySelector(
        ".fixed.inset-0:not(.pointer-events-none), [role='dialog'], .popup-close"
      );
      setIsModalOpen(!!modal);
    };

    const interval = setInterval(checkModal, 350);
    checkModal();
    return () => clearInterval(interval);
  }, []);

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
      setChatMessage("Great job! Keep it up! ⚡");
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
            content: `You are Viciss AI Assistant. The user has ${pendingTasks} pending tasks today. Write a SINGLE very short, punchy, and motivational push notification (under 15 words) to remind them.` 
          }
        ], provider, apiKey, modelId);
        
        await sendNotification("AI Assistant Reminder ⚡", reply);
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
    const float = animate(y, [0, -8, 0], {
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
      const currentX = x.get();
      const isOnLeftEdge = currentX < -(window.innerWidth / 2);
      
      const lookAtCenter = Math.random() < 0.7;
      
      let targetX = 0;
      let targetY = 0;

      if (lookAtCenter) {
        targetX = isOnLeftEdge ? 6 : -6;
        targetY = -2;
      } else {
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
          animate(x, -window.innerWidth + 100, { type: "spring", stiffness: 300, damping: 25 });
        } else {
          animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
        }
      }}
      onTap={() => {
        if (!isDragging.current) {
          window.dispatchEvent(new Event("open-ai-chat"));
        }
      }}
      className={`fixed z-[9999] cursor-grab active:cursor-grabbing touch-none transition-all duration-500 ease-out ${
        isModalOpen 
          ? "top-16 right-3 md:top-20 md:right-[calc(max(2rem,calc(50%-38rem))-12px)]" 
          : "bottom-[178px] md:bottom-[132px] right-3 md:right-[calc(max(2rem,calc(50%-38rem))-12px)]"
      }`}
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

      {/* Render Vector AI Bot Mode */}
      <div className="w-16 h-16 md:w-20 md:h-20 relative drop-shadow-[0_10px_25px_rgba(var(--primary),0.35)] group">
        <VectorAIBot eyeX={eyeX} eyeY={eyeY} />
      </div>
    </motion.div>
  );
}

// Vector AI Bot (Modern glowing AI orb/bot with eye tracking)
function VectorAIBot({ eyeX, eyeY }: { eyeX: unknown; eyeY: unknown }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="aiGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Outer Pulse Halo */}
      <circle cx="50" cy="50" r="46" fill="url(#aiGlow)" className="animate-pulse" />

      {/* Antenna Spark */}
      <circle cx="50" cy="14" r="4" fill="currentColor" className="text-primary animate-ping opacity-75" />
      <circle cx="50" cy="14" r="3" fill="currentColor" className="text-primary" />
      <line x1="50" y1="18" x2="50" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary" />

      {/* Main Bot Body / Sphere */}
      <circle cx="50" cy="56" r="30" className="fill-card stroke-primary stroke-[3px] shadow-2xl" />

      {/* Visor Screen */}
      <rect x="28" y="44" width="44" height="24" rx="12" fill="url(#visorGrad)" className="stroke-primary/40 stroke-[2px]" />

      {/* Eye Tracking Group */}
      <motion.g style={{ x: eyeX, y: eyeY }}>
        {/* Left Glowing Cyan Eye */}
        <circle cx="41" cy="56" r="4" fill="currentColor" className="text-primary" />
        <circle cx="42" cy="55" r="1.5" fill="#ffffff" />
        
        {/* Right Glowing Cyan Eye */}
        <circle cx="59" cy="56" r="4" fill="currentColor" className="text-primary" />
        <circle cx="60" cy="55" r="1.5" fill="#ffffff" />
      </motion.g>

      {/* Futuristic Mouth / Wave Line */}
      <path d="M 44 63 Q 50 66 56 63" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/70" />
    </svg>
  );
}
