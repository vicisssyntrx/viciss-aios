import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { createPortal } from "react-dom";
import StreakWindow from "./StreakWindow";
import { todayYmdLocal } from "@/lib/date";

interface Props { onClose: () => void; }

export default function PowerUpOverlay({ onClose }: Props) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showStreak, setShowStreak] = useState(false);

  const denseLogs = getDenseLogs(logs, stats?.start_date);
  const today = todayYmdLocal();
  // Recoverable days = fully missed (0 completions) OR partially completed, neither shielded nor recovered, and not today
  const gaps = denseLogs.filter(
    (l) => l.completed_count < l.total_count && !l.shield_used && !l.is_recovered && l.date !== today
  );

  const recover = async (log: (typeof gaps)[number]) => {
    if (!user || !stats || stats.power_ups < 1) {
      toast.error("No power-ups available");
      return;
    }
    
    // Buying a gap restores the historical compound chain permanently upwards.
    const recoveryGrowth = stats.current_growth * 1.01;
    
    // UPSERT with is_recovered=true (NOT completed_count=-1 which violates DB constraints)
    const { error: logErr } = await supabase
      .from("daily_logs")
      .upsert({
        user_id: user.id,
        date: log.date,
        completed_count: 0,
        total_count: log.total_count,
        shield_used: false,
        streak_after: 0,
        growth_before: stats.current_growth,
        growth_after: recoveryGrowth,
        locked: true,
        is_recovered: true,
      } as any, { onConflict: "user_id,date" });
      
    if (logErr) {
      toast.error(logErr.message);
      return;
    }

    const { error: statErr } = await supabase
      .from("user_stats")
      .update({
        power_ups: stats.power_ups - 1,
        current_growth: recoveryGrowth,
      })
      .eq("user_id", user.id);
      
    if (statErr) {
      toast.error(statErr.message);
      return;
    }
    
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success("Gap recovered! 🔥");
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4">
      <div className="glass w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">⚡ Power-Ups</h2>
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

        <p className="text-sm text-muted-foreground mb-4">
          Recover missed unshielded gaps. Each recovery uses 1 power-up.
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          You earn 1 power-up for every 7 consecutive streak days.
        </p>
        <Button type="button" variant="secondary" onClick={() => setShowStreak(true)} className="w-full mb-2">
          Open Streak Calendar
        </Button>
        {gaps.length > 0 ? (
          <div className="space-y-2">
            {[...gaps].reverse().map((gap) => (
              <div key={gap.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{format(parseISO(gap.date), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">Missed day</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => recover(gap)}
                  disabled={!stats || stats.power_ups < 1}
                  className="bg-primary text-primary-foreground"
                >
                  <Zap className="h-3 w-3 mr-1" /> Recover
                </Button>
              </div>
            ))}
          </div>
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
