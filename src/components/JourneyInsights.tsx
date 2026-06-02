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

  // peakY = where the ground surface sits — pushed low so values have room above
  const hills = [
    { label: "GROWTH",      value: formatGrowth(stats?.current_growth), color: "#fbbf24", peakX: 50,  peakY: 78 },
    { label: "PERFECT",     value: `${completedDays}/${totalProgramDays}`, color: "#4ade80", peakX: 150, peakY: 92 },
    { label: "ACTIVE DAYS", value: String(activeDays),                   color: "#60a5fa", peakX: 255, peakY: 83 },
    { label: "MISSED",      value: String(missedDays),                   color: "#f87171", peakX: 355, peakY: 98 },
  ];

  // Smooth terrain — peaks pushed to bottom third of the card
  const terrain = `
    M0,118
    C22,118 34,80 ${hills[0].peakX},${hills[0].peakY}
    C66,${hills[0].peakY} 78,110 102,110
    C126,110 134,${hills[1].peakY} ${hills[1].peakX},${hills[1].peakY}
    C166,${hills[1].peakY} 180,110 204,110
    C228,110 238,${hills[2].peakY} ${hills[2].peakX},${hills[2].peakY}
    C272,${hills[2].peakY} 284,110 308,110
    C332,110 342,${hills[3].peakY} ${hills[3].peakX},${hills[3].peakY}
    C368,${hills[3].peakY} 384,114 400,114
    L400,145 L0,145 Z
  `.trim();

  const terrainEdge = `
    M0,118
    C22,118 34,80 ${hills[0].peakX},${hills[0].peakY}
    C66,${hills[0].peakY} 78,110 102,110
    C126,110 134,${hills[1].peakY} ${hills[1].peakX},${hills[1].peakY}
    C166,${hills[1].peakY} 180,110 204,110
    C228,110 238,${hills[2].peakY} ${hills[2].peakX},${hills[2].peakY}
    C272,${hills[2].peakY} 284,110 308,110
    C332,110 342,${hills[3].peakY} ${hills[3].peakX},${hills[3].peakY}
    C368,${hills[3].peakY} 384,114 400,114
  `.trim();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Journey Insights</h3>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <svg
          viewBox="0 0 400 140"
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ display: "block", height: "140px" }}
        >
          {/* Background depth hill */}
          <path
            d="M0,122 Q80,104 160,116 T320,110 T400,118 L400,145 L0,145 Z"
            className="fill-[#14472e] dark:fill-[#081910]"
          />

          {/* Main terrain */}
          <path d={terrain} className="fill-[#1e6b40] dark:fill-[#0d2e1c]" />

          {/* Highlight edge */}
          <path
            d={terrainEdge}
            fill="none"
            className="stroke-[#2d9658] dark:stroke-[#165c30]"
            strokeWidth="1.5"
          />

          {/* Values + labels per hill */}
          {hills.map((h) => (
            <g key={h.label}>
              {/* Value — large, sits well above the hill peak */}
              <text
                x={h.peakX}
                y={h.peakY - 20}
                textAnchor="middle"
                fontSize="19"
                fontWeight="800"
                fill={h.color}
                fontFamily="inherit"
                style={{ filter: `drop-shadow(0 1px 8px ${h.color}99)` }}
              >
                {h.value}
              </text>
              {/* Label — immediately below the value, tight spacing */}
              <text
                x={h.peakX}
                y={h.peakY - 6}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                letterSpacing="0.6"
                fill="#64748b"
                fontFamily="inherit"
              >
                {h.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
