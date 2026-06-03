import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Habit } from "./useHabits";
import type { DailyLog } from "./useDailyLogs";
import type { Json } from "@/integrations/supabase/types";
import { todayYmdLocal } from "@/lib/date";

interface SaveProgressResponse {
  success?: boolean;
  message?: string;
}

function parseSaveResponse(value: Json): SaveProgressResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const maybeSuccess = (value as Record<string, Json>).success;
  const maybeMessage = (value as Record<string, Json>).message;
  return {
    success: typeof maybeSuccess === "boolean" ? maybeSuccess : undefined,
    message: typeof maybeMessage === "string" ? maybeMessage : undefined,
  };
}

export function useSaveProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const saveProgress = async (
    habits: Habit[],
    completedIds: Set<string>,
    todayLog: DailyLog | null | undefined,
    dateOverride?: string,
    silent = false
  ) => {
    if (!user) return;

    const targetDate = dateOverride ?? todayYmdLocal();
    const total = habits.length;
    const completed = completedIds.size;

    if (total === 0) {
      toast.error("Add some habits first!");
      return;
    }

    // Past-day editing: just write the log with no stat changes.
    // The server RPC handles today's logic. For past days, do a simple upsert
    // with locked: false so it doesn't affect ongoing streak calculations.
    const isSavingToday = targetDate === todayYmdLocal();
    if (!isSavingToday) {
      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          {
            user_id: user.id,
            date: targetDate,
            completed_habits: Array.from(completedIds),
            completed_count: completed,
            total_count: total,
            shield_used: false,
            streak_after: 0,
            growth_before: 1.0,
            growth_after: 1.0,
            locked: false,
          },
          { onConflict: "user_id,date" }
        );
      if (error) {
        toast.error("Failed to save progress: " + error.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ["daily_logs"], exact: false });
      qc.invalidateQueries({ queryKey: ["daily_log_today"], exact: false });
      qc.invalidateQueries({ queryKey: ["daily_log_date"], exact: false });
      if (!silent) toast.success("Progress saved!");
      return true;
    }

    // Today: let the server compute everything.
    const { data, error: rpcError } = await supabase.rpc("save_daily_progress", {
      p_date: targetDate,
      p_completed_habits: Array.from(completedIds) as unknown as Json,
      p_completed_count: completed,
      p_total_count: total,
    });

    if (rpcError) {
      toast.error("Failed to save progress: " + rpcError.message);
      return;
    }

    const response = parseSaveResponse(data);
    if (!response.success) {
      toast.error(response.message || "Could not save progress");
      return;
    }

    await Promise.all([
      qc.invalidateQueries({ queryKey: ["user_stats"], exact: false }),
      qc.invalidateQueries({ queryKey: ["daily_logs"], exact: false }),
      qc.invalidateQueries({ queryKey: ["daily_log_today"], exact: false })
    ]);

    // Toast feedback
    const wasPreviouslyLocked = !!todayLog?.locked;
    if (completed === total) {
      // Only announce perfect day if it wasn't already locked, or if not silent
      if (!wasPreviouslyLocked) {
        toast.success("Perfect day! +10 coins 🪙");
      }
    } else {
      if (!silent) {
        if (completed === 0) toast.warning("Day saved. Streak may have reset.");
        else toast.success("Progress saved!");
      }
    }

    return true;
  };

  const resetProgress = async (
    todayLog: DailyLog | null | undefined,
    dateOverride?: string
  ) => {
    if (!user) return;
    const targetDate = dateOverride ?? todayYmdLocal();

    if (targetDate !== todayYmdLocal()) {
      toast.error("Can only fully reset today's progress.");
      return;
    }

    // Call a dedicated reset RPC (see Step 3 below) instead of two separate writes.
    const { data, error } = await supabase.rpc("reset_daily_progress", {
      p_date: targetDate,
    });

    if (error) {
      toast.error("Failed to reset: " + error.message);
      return false;
    }

    const response = parseSaveResponse(data);
    if (!response.success) {
      toast.error(response.message || "Reset failed");
      return false;
    }

    qc.invalidateQueries({ queryKey: ["user_stats"], exact: false });
    qc.invalidateQueries({ queryKey: ["daily_logs"], exact: false });
    qc.invalidateQueries({ queryKey: ["daily_log_today"], exact: false });

    toast.success("Today's progress has been fully reset.");
    return true;
  };

  return { saveProgress, resetProgress };
}
