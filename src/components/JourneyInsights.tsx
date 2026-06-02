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

  // Each hill: peakX = horizontal center, peakY = where ground surface is at that hill
  const hills = [
    { label: "Growth",      value: formatGrowth(stats?.current_growth), color: "#fbbf24", peakX: 50,  peakY: 52 },
    { label: "Perfect",     value: `${completedDays}/${totalProgramDays}`, color: "#4ade80", peakX: 150, peakY: 66 },
    { label: "Active Days", value: String(activeDays),                   color: "#60a5fa", peakX: 255, peakY: 58 },
    { label: "Missed",      value: String(missedDays),                   color: "#f87171", peakX: 355, peakY: 74 },
  ];

  // Smooth hill terrain path — hand-tuned beziers, no sharp transitions
  const terrainD = `
    M0,100
    C20,100 32,54 ${hills[0].peakX},${hills[0].peakY}
    C68,${hills[0].peakY} 80,82 102,82
    C124,82 132,${hills[1].peakY} ${hills[1].peakX},${hills[1].peakY}
    C168,${hills[1].peakY} 182,82 204,82
    C226,82 236,${hills[2].peakY} ${hills[2].peakX},${hills[2].peakY}
    C274,${hills[2].peakY} 286,82 308,82
    C330,82 340,${hills[3].peakY} ${hills[3].peakX},${hills[3].peakY}
    C370,${hills[3].peakY} 385,92 400,92
    L400,130 L0,130 Z
  `.trim();

  const terrainEdge = `
    M0,100
    C20,100 32,54 ${hills[0].peakX},${hills[0].peakY}
    C68,${hills[0].peakY} 80,82 102,82
    C124,82 132,${hills[1].peakY} ${hills[1].peakX},${hills[1].peakY}
    C168,${hills[1].peakY} 182,82 204,82
    C226,82 236,${hills[2].peakY} ${hills[2].peakX},${hills[2].peakY}
    C274,${hills[2].peakY} 286,82 308,82
    C330,82 340,${hills[3].peakY} ${hills[3].peakX},${hills[3].peakY}
    C370,${hills[3].peakY} 385,92 400,92
  `.trim();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Journey Insights</h3>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <svg
          viewBox="0 0 400 128"
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ display: "block", height: "128px" }}
        >
          {/* Background depth hill */}
          <path
            d="M0,108 Q80,88 160,100 T320,94 T400,100 L400,130 L0,130 Z"
            className="fill-[#14472e] dark:fill-[#081910]"
          />

          {/* Main terrain */}
          <path d={terrainD} className="fill-[#1e6b40] dark:fill-[#0d2e1c]" />

          {/* Soft lighter highlight along the top edge */}
          <path
            d={terrainEdge}
            fill="none"
            className="stroke-[#2d9658] dark:stroke-[#165c30]"
            strokeWidth="1.5"
          />

          {/* Values + labels grouped per hill */}
          {hills.map((h) => (
            <g key={h.label}>
              {/* Value — sits just above the hill peak */}
              <text
                x={h.peakX}
                y={h.peakY - 16}
                textAnchor="middle"
                fontSize="15"
                fontWeight="bold"
                fill={h.color}
                style={{ filter: `drop-shadow(0 1px 6px ${h.color}88)` }}
              >
                {h.value}
              </text>
              {/* Label — sits just below the value, close and tidy */}
              <text
                x={h.peakX}
                y={h.peakY - 3}
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                letterSpacing="0.5"
                fill="#94a3b8"
              >
                {h.label.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
