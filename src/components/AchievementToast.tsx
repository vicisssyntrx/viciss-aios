import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AchievementType =
  | { kind: "streak"; streak: number }
  | { kind: "powerup_earned"; powerUps: number }
  | { kind: "powerup_purchased" }
  | { kind: "shield_purchased" };

interface Props {
  queue: AchievementType[];
  onDismiss: () => void; // called after each card is closed — parent pops queue[0]
}

// ─── Confetti burst via canvas ────────────────────────────────────────────────
function useConfetti(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#ffffff"];
    particles.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      life: 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.life > 0.01);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.angle += p.spin;
        p.life -= 0.008;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return canvasRef;
}

type Particle = {
  x: number; y: number; vx: number; vy: number;
  color: string; w: number; h: number;
  angle: number; spin: number; life: number;
};

// ─── Individual achievement card content ──────────────────────────────────────
function AchievementCard({ item, onClose }: { item: AchievementType; onClose: () => void }) {
  const confettiRef = useConfetti(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  const cfg = (() => {
    switch (item.kind) {
      case "streak":
        return {
          emoji: "🔥",
          title: item.streak % 7 === 0 && item.streak > 0
            ? `${item.streak}-Day Streak!`
            : `${item.streak} Day Streak!`,
          subtitle:
            item.streak % 7 === 0 && item.streak > 0
              ? "Perfect week! You've unlocked a ⚡ Power-Up!"
              : item.streak >= 30
              ? "Legendary! You're unstoppable!"
              : item.streak >= 14
              ? "Two weeks strong. You're a machine!"
              : item.streak >= 7
              ? "One full week! Keep the fire burning!"
              : "Streak extended! Every day counts.",
          color: "from-orange-500 to-red-600",
          glow: "shadow-[0_0_60px_rgba(239,68,68,0.6)]",
          btnColor: "bg-orange-500 hover:bg-orange-400",
        };
      case "powerup_earned":
        return {
          emoji: "⚡",
          title: "Power-Up Unlocked!",
          subtitle: `7-day streak bonus! You now have ${item.powerUps} power-up${item.powerUps !== 1 ? "s" : ""}. Use them to recover missed days.`,
          color: "from-yellow-500 to-orange-500",
          glow: "shadow-[0_0_60px_rgba(234,179,8,0.6)]",
          btnColor: "bg-yellow-500 hover:bg-yellow-400",
        };
      case "powerup_purchased":
        return {
          emoji: "⚡",
          title: "Power-Up Purchased!",
          subtitle: "Spend wisely — each power-up recovers one missed day.",
          color: "from-blue-500 to-violet-600",
          glow: "shadow-[0_0_60px_rgba(59,130,246,0.6)]",
          btnColor: "bg-blue-500 hover:bg-blue-400",
        };
      case "shield_purchased":
        return {
          emoji: "🛡️",
          title: "Shield Activated!",
          subtitle: "Your streak is protected for one missed day.",
          color: "from-sky-500 to-blue-600",
          glow: "shadow-[0_0_60px_rgba(14,165,233,0.6)]",
          btnColor: "bg-sky-500 hover:bg-sky-400",
        };
    }
  })();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Confetti canvas */}
      <canvas
        ref={confettiRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ transition: "opacity 350ms", opacity: visible ? 1 : 0 }}
        onClick={close}
      />

      {/* Card */}
      <div
        className={`
          relative z-10 bg-card text-card-foreground border border-border shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full
          ${cfg.glow}
          transition-all duration-350 ease-out
        `}
        style={{
          transform: visible ? "scale(1) translateY(0)" : "scale(0.7) translateY(40px)",
          opacity: visible ? 1 : 0,
          transition: "transform 350ms cubic-bezier(0.34,1.56,0.64,1), opacity 350ms ease",
        }}
      >
        {/* Emoji pulse ring */}
        <div className={`relative mb-4`}>
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${cfg.color} opacity-30 animate-ping`}
            style={{ animationDuration: "1.2s" }}
          />
          <div
            className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center text-5xl shadow-xl`}
          >
            {cfg.emoji}
          </div>
        </div>

        <h2 className="text-2xl font-black text-foreground mb-2 leading-tight">{cfg.title}</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{cfg.subtitle}</p>

        <button
          onClick={close}
          className={`w-full py-3 rounded-2xl text-white font-bold text-base ${cfg.btnColor} transition-all active:scale-95 shadow-lg`}
        >
          {item.kind === "streak" && item.streak % 7 === 0 ? "Claim Reward 🎁" : "Let's Go! 💪"}
        </button>
      </div>
    </div>
  );
}

// ─── Exported queue manager ────────────────────────────────────────────────────
export default function AchievementToast({ queue, onDismiss }: Props) {
  if (queue.length === 0) return null;
  const current = queue[0];
  return createPortal(
    <AchievementCard key={`${current.kind}-${JSON.stringify(current)}`} item={current} onClose={onDismiss} />,
    document.body
  );
}
