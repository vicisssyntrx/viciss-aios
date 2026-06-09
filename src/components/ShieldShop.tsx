import { useUserStats } from "@/hooks/useUserStats";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Shield, Coins } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { createPortal } from "react-dom";
import StreakWindow from "./StreakWindow";

const SHOP_OPTIONS = [
  { shields: 1, cost: 50 },
  { shields: 2, cost: 100 },
  { shields: 3, cost: 150 },
];

interface Props { onClose: () => void; onPurchased?: () => void; }

export default function ShieldShop({ onClose, onPurchased }: Props) {
  const { data: stats } = useUserStats();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showStreak, setShowStreak] = useState(false);
  const [buying, setBuying] = useState(false);

  const buy = async (shields: number, cost: number) => {
    if (buying || !stats || !user) return;
    
    setBuying(true);
    try {
      // @ts-expect-error - buy_shields is a new RPC not yet in generated types
      const { data, error } = await supabase.rpc('buy_shields', { 
        p_count: shields, 
        p_cost: cost 
      });

      if (error) throw error;
      
      const response = data as { success: boolean; message: string };
      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(`Bought ${shields} shield${shields > 1 ? 's' : ''}!`);
      qc.invalidateQueries({ queryKey: ["user_stats"] });
      onPurchased?.();
    } catch (error) {
      toast.error("Purchase failed: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setBuying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div className="glass w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Pull Bar */}
        <div className="sm:hidden w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            Shield Shop
          </h2>
          <button onClick={onClose} className="popup-close"><X className="h-4 w-4" /></button>
        </div>
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-foreground">
            <Coins className="w-8 h-8 text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] inline-block align-bottom mr-1" /> {stats?.coins || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Your coins</p>
          <p className="text-lg font-semibold text-foreground mt-2 flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            {stats?.shields || 0} owned
          </p>
        </div>
        <div className="space-y-3">
          {SHOP_OPTIONS.map((opt) => {
            const canAfford = (stats?.coins || 0) >= opt.cost;
            return (
              <Button
                key={opt.shields}
                onClick={() => buy(opt.shields, opt.cost)}
                disabled={!canAfford || buying}
                variant={canAfford ? "default" : "secondary"}
                className={`w-full h-14 text-base ${canAfford ? "bg-primary text-primary-foreground" : ""}`}
              >
                {opt.shields} Shield{opt.shields > 1 ? "s" : ""} — {opt.cost} coins
              </Button>
            );
          })}
        </div>
        <Button type="button" variant="secondary" onClick={() => setShowStreak(true)} className="w-full mt-3">
          Open Streak Calendar
        </Button>
      </div>
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
    </div>,
    document.body
  );
}
