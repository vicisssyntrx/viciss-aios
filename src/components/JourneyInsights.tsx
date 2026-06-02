import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { todayYmdLocal } from "@/lib/date";
import { useMemo } from "react";
import { parseISO, differenceInDays } from "date-fns";

interface JourneyInsightsProps {
  activeTab?: string;
}

export default function JourneyInsights({ activeTab: _activeTab }: JourneyInsightsProps) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();

  const denseLogs = getDenseLogs(logs, stats?.start_date);

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return "1.00x";
    return value.toFixed(2) + "x";
  };

  const today = todayYmdLocal();
  const missedDays = denseLogs.filter(
    (l) => l.completed_count === 0 && !l.shield_used && !(l as any).is_recovered && l.date !== today
  ).length || 0;
  const completedDays = denseLogs.filter(
    (l) => (l.completed_count === l.total_count && l.total_count > 0) || (l as any).is_recovered
  ).length || 0;
  const activeDays = denseLogs.filter(
    (l) => l.completed_count > 0 || (l as any).is_recovered
  ).length || 0;

  const totalProgramDays = useMemo(() => {
    if (stats?.start_date && stats?.end_date) {
      const start = parseISO(stats.start_date);
      const end = parseISO(stats.end_date);
      const diff = differenceInDays(end, start);
      return diff > 0 ? diff : 365;
    }
    return 365;
  }, [stats?.start_date, stats?.end_date]);

  const items = [
    { label: "Growth",      value: formatGrowth(stats?.current_growth), colorClass: "text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" },
    { label: "Perfect",     value: <><span className="text-[#4ade80]">{completedDays}</span><span className="text-foreground text-sm md:text-base ml-1 font-medium">/ {totalProgramDays}</span></>, colorClass: "" },
    { label: "Active Days", value: activeDays,  colorClass: "text-[#60a5fa]" },
    { label: "Missed",      value: missedDays,  colorClass: "text-[#f87171]" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Journey Insights</h3>
      </div>

      {/* Card — no flip, just stats + decorative ground strip */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Stats row */}
        <div className="p-4 md:p-5">
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {items.map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-xl md:text-2xl font-bold ${item.colorClass}`}>{item.value}</p>
                <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative ground strip — sits flush at the bottom, never overlaps stats */}
        <div className="relative h-7 overflow-hidden pointer-events-none select-none">
          <svg
            viewBox="0 0 400 28"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            {/* Rolling ground hills — dark green / light green via Tailwind sibling trick */}
            {/* Dark base layer */}
            <path
              d="M0,16 Q40,4 90,12 T190,8 T290,14 T400,6 L400,28 L0,28 Z"
              className="fill-[#1a3a2a] dark:fill-[#0d2018]"
            />
            {/* Mid layer with slightly lighter tone */}
            <path
              d="M0,22 Q60,10 130,18 T260,12 T400,18 L400,28 L0,28 Z"
              className="fill-[#22543d] dark:fill-[#102a1c]"
            />
            {/* Top highlight — lightest green strip */}
            <path
              d="M0,26 Q80,18 160,24 T320,20 T400,24 L400,28 L0,28 Z"
              className="fill-[#276749] dark:fill-[#163824]"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
