import { useUserStats } from "@/hooks/useUserStats";
import { useState } from "react";
import ShieldShop from "./ShieldShop";
import StreakWindow from "./StreakWindow";
import PowerUpOverlay from "./PowerUpOverlay";
import { useIsMobile } from "@/hooks/use-mobile";
import { Coins, Flame, Shield, Zap } from "lucide-react";

const statItems = [
  { key: "coins", Icon: Coins, colorClass: "text-[#fbbf24] drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]" },
  { key: "streak", Icon: Flame, colorClass: "text-[#f97316] drop-shadow-[0_0_4px_rgba(249,115,22,0.3)]" },
  { key: "shields", Icon: Shield, colorClass: "text-primary drop-shadow-[0_0_4px_rgba(var(--primary),0.5)]" },
  { key: "power_ups", Icon: Zap, colorClass: "text-primary drop-shadow-[0_0_4px_rgba(var(--primary),0.5)]" },
] as const;

export default function StatsBar() {
  const { data: stats } = useUserStats();
  const isMobile = useIsMobile();
  const [showShields, setShowShields] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);

  const visibleItems = isMobile ? statItems.filter((s) => s.key === "coins" || s.key === "streak") : statItems;

  const handleClick = (key: (typeof statItems)[number]["key"]) => {
    if (key === "shields") setShowShields(true);
    if (key === "streak") setShowStreak(true);
    if (key === "power_ups") setShowPowerUps(true);
  };

  return (
    <>
      <div className={`flex items-center gap-1.5 px-1 ${isMobile ? "justify-between" : "justify-center"}`}>
        {visibleItems.map((s) => (
          <button
            key={s.key}
            onClick={() => handleClick(s.key)}
            className="flex-1 max-w-[180px] glass rounded-lg flex items-center justify-center gap-1.5 py-1.5 hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            <s.Icon className={`w-[14px] h-[14px] ${s.colorClass}`} />
            <span className="text-sm font-bold text-foreground leading-none">
              {stats ? stats[s.key] : 0}
            </span>
          </button>
        ))}
      </div>
      {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
      {showPowerUps && <PowerUpOverlay onClose={() => setShowPowerUps(false)} />}
    </>
  );
}
