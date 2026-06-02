import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { todayYmdLocal } from "@/lib/date";
import { useMemo, useState } from "react";
import { parseISO, differenceInDays } from "date-fns";
import { RotateCw } from "lucide-react";

export default function JourneyInsights() {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const [isFlipped, setIsFlipped] = useState(false);
  
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
  const maxGrowth = formatGrowth(Math.pow(1.01, totalProgramDays));
  const progressPercent = Math.min(100, Math.max(0, (completedDays / totalProgramDays) * 100));

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
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          title="Flip card"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div 
        className={`relative w-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
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
        <div className="absolute inset-0 glass rounded-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] bg-black/40 border border-primary/20">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            
            {/* 3D Road Container */}
            <div className="relative w-24 h-[150%] [transform:perspective(200px)_rotateX(60deg)_translateY(-20%)] -mt-10 opacity-70">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-primary/40 rounded-t-full shadow-[0_0_30px_rgba(239,68,68,0.4)]" />
              {/* Scrolling dashed line */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 w-1 h-[200%] -top-1/2 animate-road-scroll"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.7) 50%)',
                  backgroundSize: '100% 40px'
                }}
              />
            </div>

            {/* HUD Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-3">
              {/* Goal Marker */}
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="bg-background/50 px-2 py-0.5 rounded backdrop-blur-sm">🏁 Goal</span>
                <span className="text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{maxGrowth}</span>
              </div>

              {/* Player Progress Marker */}
              <div className="absolute w-full px-3 transition-all duration-1000 ease-out" style={{ bottom: `${Math.max(10, progressPercent)}%` }}>
                <div className="flex flex-col items-center animate-bounce duration-[2000ms]">
                  <span className="text-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10">🚗</span>
                  <div className="w-6 h-1.5 bg-black/40 rounded-full blur-[2px] -mt-1" />
                </div>
                <div className="absolute left-3 top-1 text-[10px] font-bold text-white bg-primary/80 px-1.5 rounded backdrop-blur-sm shadow-md">
                  {formatGrowth(stats?.current_growth)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
