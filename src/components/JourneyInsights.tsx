import { useDailyLogs, getDenseLogs, computeDeterministicGrowth } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { todayYmdLocal } from "@/lib/date";
import { useMemo } from "react";
import { parseISO, differenceInCalendarDays } from "date-fns";

export default function JourneyInsights() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  
  const denseLogs = getDenseLogs(logs, stats?.start_date);
  const { finalGrowth } = useMemo(() => computeDeterministicGrowth(denseLogs), [denseLogs]);

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return "1.0000x";
    return Number(value.toFixed(4)).toString() + "x";
  };

  const today = todayYmdLocal();
  const missedDays = denseLogs.filter((l) => l.completed_count === 0 && !l.shield_used && !(l as any).is_recovered && l.date !== today).length || 0;
  const completedDays = denseLogs.filter((l) => (l.completed_count === l.total_count && l.total_count > 0) || (l as any).is_recovered).length || 0;
  
  // Customizable timeframe calculation
  const totalProgramDays = useMemo(() => {
    if (stats?.start_date && stats?.end_date) {
      const start = parseISO(stats.start_date);
      const end = parseISO(stats.end_date);
      const diff = differenceInCalendarDays(end, start);
      return diff > 0 ? diff : 365;
    }
    return 365;
  }, [stats?.start_date, stats?.end_date]);

  // Days elapsed from start_date up to and including today
  const elapsedDays = useMemo(() => {
    if (!stats?.start_date) return 0;
    const start = parseISO(stats.start_date);
    const todayDate = parseISO(today);
    const diff = differenceInCalendarDays(todayDate, start) + 1; // +1 to include today
    return Math.max(1, diff);
  }, [stats?.start_date, today]);

  // Completion % = perfect/recovered days ÷ days elapsed so far (not total program days)
  const journeyCompletionPct = useMemo(() => {
    const pct = Math.round((completedDays / elapsedDays) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [completedDays, elapsedDays]);

  const items = [
    { label: "Growth", value: formatGrowth(finalGrowth), colorClass: "text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" },
    { label: "Perfect", value: <><span className="text-[#4ade80]">{completedDays}</span><span className="text-foreground text-sm md:text-lg ml-1 font-bold">/ {totalProgramDays}</span></>, colorClass: "" },
    { label: "Missed", value: missedDays, colorClass: "text-[#f87171]" },
    { label: "Completed", value: `${journeyCompletionPct}%`, colorClass: "text-foreground" },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground px-1">Journey Insights</h3>
      <div className="glass rounded-2xl p-4 md:p-5 min-h-[96px] flex flex-col justify-center">
        <div className="flex items-center">
          <div className="flex-shrink-0 pr-2 md:pr-4 text-center">
            <p className={`text-xl md:text-3xl font-black ${items[0].colorClass}`}>{items[0].value}</p>
            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-1">{items[0].label}</p>
          </div>
          <div className="w-px h-12 md:h-14 bg-border/40 mx-2 md:mx-4 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-3 gap-1 md:gap-3 pl-1 md:pl-2">
            {items.slice(1).map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-lg md:text-2xl font-black ${item.colorClass}`}>{item.value}</p>
                <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
