import { useHabits } from "@/hooks/useHabits";
import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { useMemo } from "react";
import { parseISO, differenceInCalendarDays, addYears, subDays } from "date-fns";

export default function OutcomeCards() {
  const { data: habits } = useHabits();
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const safeHabits = useMemo(() => habits ?? [], [habits]);

  const outcomes = useMemo(() => {
    const grouped = new Map<
      string,
      { emoji: string; habits: typeof safeHabits }
    >();
    for (const h of safeHabits) {
      const key = h.outcome_name || "General";
      if (!grouped.has(key)) grouped.set(key, { emoji: h.outcome_emoji || "🎯", habits: [] });
      grouped.get(key)!.habits.push(h);
    }
    return grouped;
  }, [safeHabits]);

  const overallRatio = useMemo(() => {
    const denseLogs = getDenseLogs(logs, stats?.start_date);
    
    let totalProgramDays = 365;
    if (stats?.start_date && stats?.end_date) {
      const start = parseISO(stats.start_date);
      const end = parseISO(stats.end_date);
      const diff = differenceInCalendarDays(end, start);
      if (diff > 0) totalProgramDays = diff;
    }

    const completedDays = denseLogs.filter(
      (l) => (l.completed_count === l.total_count && l.total_count > 0) || (l as Record<string, unknown>).is_recovered
    ).length || 0;
    
    return totalProgramDays > 0 ? Math.min(100, Math.round((completedDays / totalProgramDays) * 100)) : 0;
  }, [logs, stats?.start_date, stats?.end_date]);

  if (!safeHabits.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground px-1">Outcomes</h3>
      <div className="grid grid-cols-2 gap-2">
        {Array.from(outcomes.entries()).map(([name, o]) => {
          return (
            <div key={name} className="glass flex flex-col justify-center rounded-xl p-3 md:p-4 h-full min-h-[72px]">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xl leading-none shrink-0">{o.emoji}</span>
                <p className="font-semibold text-foreground text-sm sm:text-base truncate flex-1 ml-1">{name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary shrink-0 leading-none w-[34px] text-right">{overallRatio}%</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${overallRatio}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
