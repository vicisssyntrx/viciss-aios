import { useState } from "react";
import { useUserStats } from "@/hooks/useUserStats";
import { Shield, Zap } from "lucide-react";
import ShieldShop from "./ShieldShop";
import PowerUpOverlay from "./PowerUpOverlay";

export default function MobileBoostCards() {
  const { data: stats } = useUserStats();
  const [showShields, setShowShields] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setShowShields(true)}
          className="glass rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] min-h-[110px] group"
        >
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold absolute top-3 left-4">Shields</span>
          <div className="relative flex items-center justify-center mt-5">
            <Shield className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] group-hover:drop-shadow-[0_0_12px_rgba(var(--primary),0.8)] transition-all" />
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <span className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{stats?.shields ?? 0}</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowPowerUps(true)}
          className="glass rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02] min-h-[110px] group"
        >
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold absolute top-3 left-4">Power-Ups</span>
          <div className="relative flex items-center justify-center mt-5">
            <Zap className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] group-hover:drop-shadow-[0_0_12px_rgba(var(--primary),0.8)] transition-all" />
            <div className="absolute inset-0 flex items-center justify-center pt-3">
              <span className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{stats?.power_ups ?? 0}</span>
            </div>
          </div>
        </button>
      </div>

      {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
      {showPowerUps && <PowerUpOverlay onClose={() => setShowPowerUps(false)} />}
    </>
  );
}
