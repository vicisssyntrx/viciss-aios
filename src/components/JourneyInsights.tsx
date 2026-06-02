import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { todayYmdLocal } from "@/lib/date";
import { useMemo, useState, useEffect } from "react";
import { parseISO, differenceInDays } from "date-fns";


interface JourneyInsightsProps {
  activeTab?: string;
}

export default function JourneyInsights({ activeTab }: JourneyInsightsProps) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const [isFlipped, setIsFlipped] = useState(false);

  // Trigger autoflip effect once per session / refresh / tab change for 5 seconds
  useEffect(() => {
    if (activeTab === "dash" || !activeTab) {
      setIsFlipped(false);
      const toRoadmapTimer = setTimeout(() => {
        setIsFlipped(true);
        const backToInsightsTimer = setTimeout(() => {
          setIsFlipped(false);
        }, 5000);
        return () => clearTimeout(backToInsightsTimer);
      }, 5000);
      return () => clearTimeout(toRoadmapTimer);
    }
  }, [activeTab]);
  
  const denseLogs = getDenseLogs(logs, stats?.start_date);

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return "1.0000x";
    // Show 4 decimal places so values like 1.0302 are not rounded to 1.03
    return value.toFixed(4) + "x";
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
  const maxGrowth = formatGrowth(Math.pow(1.01, totalProgramDays));
  const progressPercent = Math.min(100, Math.max(0, (completedDays / totalProgramDays) * 100));

  const nextGrowth = useMemo(() => {
    const current = stats?.current_growth ?? 1.0;
    return formatGrowth(current * 1.01);
  }, [stats?.current_growth]);

  const items = [
    { label: "Growth", value: formatGrowth(stats?.current_growth), colorClass: "text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" },
    { label: "Completed", value: <><span className="text-[#4ade80]">{completedDays}</span><span className="text-foreground text-sm md:text-base ml-1 font-medium">/ {totalProgramDays}</span></>, colorClass: "" },
    { label: "Missed", value: missedDays, colorClass: "text-[#f87171]" },
    { label: "Completion", value: `${completionRate}%`, colorClass: "text-foreground" },
  ];

  return (
    <div className="space-y-2 group [perspective:1000px]">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Journey Insights</h3>
      </div>
      
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className={`relative w-full transition-transform duration-700 [transform-style:preserve-3d] cursor-pointer ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front Face */}
        <div className="glass rounded-2xl p-4 md:p-5 min-h-[96px] flex flex-col justify-center [backface-visibility:hidden]">
          <div className="grid grid-cols-4 gap-3 md:gap-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <p className={`text-xl md:text-2xl font-bold ${item.colorClass}`}>{item.value}</p>
              <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-1">{item.label}</p>
            </div>
          ))}
          </div>
        </div>

        {/* Back Face - Road Map */}
        <div className="absolute inset-0 glass rounded-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-b from-[#e8ecec] to-[#cdd9d6] dark:from-[#111615] dark:to-[#1a2321]">
          <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Background Hills */}
            <path d="M0,80 Q60,40 140,65 T280,55 T400,75 L400,120 L0,120 Z" fill="currentColor" className="text-[#dae5e1] dark:text-[#17201e]" />
            <path d="M0,95 Q100,70 190,85 T340,65 T400,80 L400,120 L0,120 Z" fill="currentColor" className="text-[#c1cfcb] dark:text-[#1c2624]" />
            
            {/* Tapered Winding Road */}
            <path d="M-40,120 C80,120 160,90 220,80 C280,70 340,75 380,60 L380,57 C340,72 280,67 220,77 C160,87 80,105 0,120 Z" fill="#2c3b38" />
            
            {/* Dashed Center Line */}
            <path d="M-20,120 C80,112.5 160,88.5 220,78.5 C280,68.5 340,73.5 380,58.5" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,4" className="opacity-70" />

            {/* Nearest Board (Present GF) */}
            <g transform="translate(130, 60)">
              {/* Poles */}
              <rect x="6" y="24" width="2" height="18" fill="#475569" />
              <rect x="32" y="24" width="2" height="18" fill="#475569" />
              {/* Board */}
              <rect x="0" y="0" width="40" height="24" rx="2" fill="#1e293b" className="shadow-lg" />
              <rect x="0" y="0" width="40" height="24" rx="2" fill="none" stroke="#334155" strokeWidth="1" />
              <text x="20" y="9" fontSize="4.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">PRESENT</text>
              <text x="20" y="18" fontSize="7.5" fill="#fbbf24" textAnchor="middle" fontWeight="bold" className="drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]">
                {formatGrowth(stats?.current_growth)}
              </text>
            </g>

            {/* Midground Board (Next GF) */}
            <g transform="translate(230, 48) scale(0.75)">
              <rect x="6" y="24" width="2" height="18" fill="#475569" />
              <rect x="32" y="24" width="2" height="18" fill="#475569" />
              <rect x="0" y="0" width="40" height="24" rx="2" fill="#1e293b" />
              <rect x="0" y="0" width="40" height="24" rx="2" fill="none" stroke="#334155" strokeWidth="1" />
              <text x="20" y="9" fontSize="4.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">NEXT</text>
              <text x="20" y="18" fontSize="7.5" fill="#4ade80" textAnchor="middle" fontWeight="bold" className="drop-shadow-[0_0_4px_rgba(74,222,128,0.5)]">
                {nextGrowth}
              </text>
            </g>

            {/* Distant Goal Marker */}
            <g transform="translate(365, 42) scale(0.4)">
              <rect x="6" y="24" width="2" height="18" fill="#475569" />
              <rect x="32" y="24" width="2" height="18" fill="#475569" />
              <rect x="0" y="0" width="40" height="24" rx="2" fill="#1e293b" />
              <rect x="0" y="0" width="40" height="24" rx="2" fill="none" stroke="#334155" strokeWidth="1" />
              <text x="20" y="9" fontSize="4.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">MAX GOAL</text>
              <text x="20" y="18" fontSize="7.5" fill="#f8fafc" textAnchor="middle" fontWeight="bold">
                {maxGrowth}
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
