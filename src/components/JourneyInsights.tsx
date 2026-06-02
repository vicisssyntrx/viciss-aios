import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { todayYmdLocal } from "@/lib/date";
import { useMemo } from "react";
import { parseISO, differenceInDays } from "date-fns";

export default function JourneyInsights() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  
  const denseLogs = getDenseLogs(logs, stats?.start_date);

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return "1x";
    return Number(value.toFixed(2)).toString() + "x";
  };

  const totalDays = denseLogs.length || 0;
  const today = todayYmdLocal();
  const missedDays = denseLogs.filter((l) => l.completed_count === 0 && !l.shield_used && !(l as any).is_recovered && l.date !== today).length || 0;
  const completedDays = denseLogs.filter((l) => (l.completed_count === l.total_count && l.total_count > 0) || (l as any).is_recovered).length || 0;
  
  // Customizable timeframe calculation
  const totalProgramDays = useMemo(() => {
    if (stats?.start_date && stats?.end_date) {
      const start = parseISO(stats.start_date);
      const end = parseISO(stats.end_date);
      const diff = differenceInDays(end, start);
      return diff > 0 ? diff : 365;
    }
    return 365;
  }, [stats?.start_date, stats?.end_date]);

  const completionRate = totalProgramDays > 0 ? Math.round((completedDays / totalProgramDays) * 100) : 0;

  const items = [
    { label: "Growth", value: formatGrowth(stats?.current_growth), colorClass: "text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" },
    { label: "Completed", value: <><span className="text-[#4ade80]">{completedDays}</span><span className="text-foreground text-sm md:text-base ml-1 font-medium">/ {totalProgramDays}</span></>, colorClass: "" },
    { label: "Missed", value: missedDays, colorClass: "text-[#f87171]" },
    { label: "Completion", value: `${completionRate}%`, colorClass: "text-foreground" },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground px-1">Journey Insights</h3>
      <div className="glass rounded-2xl p-4 md:p-5 min-h-[96px] flex flex-col justify-center">
        <div className="grid grid-cols-4 gap-3 md:gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className={`text-xl md:text-2xl font-bold ${item.colorClass}`}>{item.value}</p>
            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-1">{item.label}</p>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
