import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import type { Json } from "@/integrations/supabase/types";
import { todayYmdLocal } from "@/lib/date";
import { eachDayOfInterval, format, parseISO } from "date-fns";

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  completed_habits: string[];
  completed_count: number;
  total_count: number;
  shield_used: boolean;
  streak_after: number;
  growth_before: number;
  growth_after: number;
  locked: boolean;
  is_recovered: boolean;
  created_at: string;
}

function normalizeCompletedHabits(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeLog(log: Omit<DailyLog, "completed_habits"> & { completed_habits: Json }): DailyLog {
  return {
    ...log,
    completed_habits: normalizeCompletedHabits(log.completed_habits),
  };
}

export function getDenseLogs(logs: DailyLog[] | undefined | null, startDateStr?: string): DailyLog[] {
  if (!logs || logs.length === 0) return [];
  const logMap = new Map(logs.map(l => [l.date, l]));
  const earliestDate = startDateStr || logs[0].date;
  const dense: DailyLog[] = [];
  
  try {
    const start = parseISO(earliestDate);
    const end = parseISO(todayYmdLocal());
    if (start <= end) {
      eachDayOfInterval({ start, end }).forEach(d => {
        const dStr = format(d, "yyyy-MM-dd");
        if (logMap.has(dStr)) {
          dense.push(logMap.get(dStr)!);
        } else {
          dense.push({
            id: `synthetic-${dStr}`,
            user_id: logs[0].user_id,
            date: dStr,
            completed_habits: [],
            completed_count: 0,
            total_count: 1,
            shield_used: false,
            streak_after: 0,
            growth_before: null as any,
            growth_after: null as any,
            locked: true,
            is_recovered: false,
            created_at: new Date().toISOString()
          });
        }
      });
    }
  } catch(e) {
    // Actually log the error so developers know why the graph is empty
    console.error('[getDenseLogs] Failed to parse dates or generate intervals:', e);
  }
  
  return dense;
}

export function useDailyLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data.map((row) => normalizeLog({ ...row, is_recovered: (row as any).is_recovered ?? false }));
    },
    enabled: !!user,
  });
}

export function useTodayLog(enabled = true) {
  const { user } = useAuth();
  const today = todayYmdLocal();
  return useQuery({
    queryKey: ["daily_log_today", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeLog({ ...data, is_recovered: (data as any).is_recovered ?? false }) : null;
    },
    enabled: !!user && enabled,
  });
}

export function useLogForDate(date: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_log_date", user?.id, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeLog({ ...data, is_recovered: (data as any).is_recovered ?? false }) : null;
    },
    enabled: !!user && !!date,
  });
}

export function useRefreshLogs() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["daily_logs"], exact: false });
    qc.invalidateQueries({ queryKey: ["daily_log_today"], exact: false });
    qc.invalidateQueries({ queryKey: ["daily_log_date"], exact: false });
  };
}
