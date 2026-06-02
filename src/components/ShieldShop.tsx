import { useUserStats } from "@/hooks/useUserStats";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Shield } from "lucide-react";
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
      // @ts-ignore - buy_shields is a new RPC not yet in generated types
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
    } catch (error: any) {
      toast.error("Purchase failed: " + error.message);
    } finally {
      setBuying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4">
      <div className="glass w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">🛡️ Shield Shop</h2>
          <button onClick={onClose} className="popup-close"><X className="h-4 w-4" /></button>
        </div>
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-foreground">🪙 {stats?.coins || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Your coins</p>
          <p className="text-lg font-semibold text-foreground mt-2">🛡️ {stats?.shields || 0} owned</p>
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
