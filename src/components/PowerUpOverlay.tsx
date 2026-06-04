import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { createPortal } from "react-dom";
import StreakWindow from "./StreakWindow";
import { todayYmdLocal } from "@/lib/date";

interface Props { onClose: () => void; onPurchased?: () => void; }

export default function PowerUpOverlay({ onClose, onPurchased }: Props) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showStreak, setShowStreak] = useState(false);
  const [recovering, setRecovering] = useState<string | null>(null);

  const denseLogs = getDenseLogs(logs, stats?.start_date);
  const today = todayYmdLocal();

  // Recoverable gaps = missed days (0 completions, no shield) OR shielded days — both lost growth
  // Partial days are also recoverable. Exclude today and already-recovered.
  const gaps = denseLogs.filter(
    (l) =>
      l.completed_count < l.total_count &&
      !l.is_recovered &&
      l.date !== today
  );

  // Separate into categories for display
  const shieldedGaps = gaps.filter((l) => l.shield_used && l.completed_count === 0);
  const missedGaps = gaps.filter((l) => !l.shield_used && l.completed_count === 0);
  const partialGaps = gaps.filter((l) => l.completed_count > 0 && l.completed_count < l.total_count);

  const recover = async (log: (typeof gaps)[number]) => {
    if (!user || !stats || stats.power_ups < 1) {
      toast.error("No power-ups available");
      return;
    }

    setRecovering(log.date);
    try {
      // Use the server-side RPC for atomic, historically accurate recovery
      const { data, error } = await supabase.rpc("recover_day_with_powerup", {
        p_date: log.date,
      } as any);

      if (error) {
        toast.error("Recovery failed: " + error.message);
        return;
      }

      const result = data as { success: boolean; message: string };
      if (!result.success) {
        toast.error(result.message || "Recovery failed");
        return;
      }

      qc.invalidateQueries({ queryKey: ["daily_logs"] });
      qc.invalidateQueries({ queryKey: ["user_stats"] });
      toast.success(`${log.shield_used ? "Shield day" : "Missed day"} recovered! +1% growth 🔥`);
      onPurchased?.();
    } finally {
      setRecovering(null);
    }
  };

  const renderGapGroup = (title: string, icon: React.ReactNode, list: typeof gaps) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
          {icon} {title}
        </p>
        <div className="space-y-2">
          {[...list].reverse().map((gap) => (
            <div key={gap.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{format(parseISO(gap.date), "MMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">
                  {gap.shield_used
                    ? "Shield used — no growth earned"
                    : gap.completed_count === 0
                    ? "Fully missed — no growth earned"
                    : `Partial (${gap.completed_count}/${gap.total_count} habits)`}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => recover(gap)}
                disabled={!stats || stats.power_ups < 1 || recovering === gap.date}
                className="bg-primary text-primary-foreground"
              >
                <Zap className="h-3 w-3 mr-1" />
                {recovering === gap.date ? "..." : "Recover"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4">
      <div className="glass w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            Power-Ups
          </h2>
          <button onClick={onClose} className="popup-close"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats?.power_ups || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{gaps.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Gaps Found</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-1">
          Recover missed, shielded, or partial days. Each uses 1 power-up and restores +1% growth.
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Earn 1 power-up for every 7 consecutive streak days.
        </p>

        <Button type="button" variant="secondary" onClick={() => setShowStreak(true)} className="w-full mb-4">
          Open Streak Calendar
        </Button>

        {gaps.length > 0 ? (
          <>
            {renderGapGroup("Shielded Days (0 growth earned)", <Shield className="h-3 w-3 text-blue-400" />, shieldedGaps)}
            {renderGapGroup("Missed Days (no shield)", <X className="h-3 w-3 text-red-500" />, missedGaps)}
            {renderGapGroup("Partial Days", <Zap className="h-3 w-3 text-primary" />, partialGaps)}
          </>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            No recoverable gaps found.
          </div>
        )}
      </div>
      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
    </div>,
    document.body
  );
}
