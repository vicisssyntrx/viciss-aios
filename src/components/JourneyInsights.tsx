import { useDailyLogs, getDenseLogs, computeDeterministicGrowth } from "@/hooks/useDailyLogs";
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
  const { finalGrowth } = useMemo(() => computeDeterministicGrowth(denseLogs), [denseLogs]);

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

  // Hill definitions — peakX and peakY (SVG coords, low Y = tall hill)
  const hills = [
    { label: "GROWTH",      value: formatGrowth(finalGrowth), color: "#fbbf24", peakX: 50,  peakY: 72 },
    { label: "PERFECT",     value: `${completedDays}/${totalProgramDays}`, color: "#4ade80", peakX: 152, peakY: 88 },
    { label: "ACTIVE DAYS", value: String(activeDays),                   color: "#60a5fa", peakX: 258, peakY: 80 },
    { label: "MISSED",      value: String(missedDays),                   color: "#f87171", peakX: 358, peakY: 94 },
  ];

  // Valley Y between adjacent hills
  const v = (a: number, b: number) => Math.max(a, b) + 20;

  // Smooth terrain path through all 4 peaks
  const terrainPath = `
    M0,118
    C22,118 34,74 ${hills[0].peakX},${hills[0].peakY}
    C66,${hills[0].peakY} 78,${v(hills[0].peakY, hills[1].peakY)} 101,${v(hills[0].peakY, hills[1].peakY)}
    C124,${v(hills[0].peakY, hills[1].peakY)} 132,${hills[1].peakY} ${hills[1].peakX},${hills[1].peakY}
    C172,${hills[1].peakY} 184,${v(hills[1].peakY, hills[2].peakY)} 205,${v(hills[1].peakY, hills[2].peakY)}
    C226,${v(hills[1].peakY, hills[2].peakY)} 238,${hills[2].peakY} ${hills[2].peakX},${hills[2].peakY}
    C278,${hills[2].peakY} 290,${v(hills[2].peakY, hills[3].peakY)} 308,${v(hills[2].peakY, hills[3].peakY)}
    C326,${v(hills[2].peakY, hills[3].peakY)} 342,${hills[3].peakY} ${hills[3].peakX},${hills[3].peakY}
    C374,${hills[3].peakY} 390,110 400,110
    L400,150 L0,150 Z
  `.trim();

  const edgePath = terrainPath.replace(/L400,150 L0,150 Z/, "");

  // Background depth layer path — gentler, lower hills
  const bgPath = `
    M0,125 Q60,108 120,118 T240,112 T360,118 T400,120 L400,150 L0,150 Z
  `.trim();

  // Deepest shadow layer
  const shadowPath = `
    M0,132 Q80,122 160,128 T320,124 T400,130 L400,150 L0,150 Z
  `.trim();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Journey Insights</h3>
      </div>

      {/* Card: fixed height, overflow-hidden to clip SVG to rounded corners */}
      <div
        className="glass rounded-2xl overflow-hidden w-full"
        style={{ height: "148px" }}
      >
        <svg
          viewBox="0 0 400 148"
          preserveAspectRatio="xMidYMid slice"
          className="block w-full h-full"
        >
          {/* ── Deepest shadow (darkest, furthest back) ── */}
          <path d={shadowPath} className="fill-[#091a0f] dark:fill-[#04100a]" />

          {/* ── Mid background hills (depth layer) ── */}
          <path d={bgPath} className="fill-[#12331d] dark:fill-[#071509]" />

          {/* ── Main terrain (foreground hills) ── */}
          <path d={terrainPath} className="fill-[#1e6b40] dark:fill-[#0d2e1c]" />

          {/* ── Soft highlight edge ── */}
          <path
            d={edgePath}
            fill="none"
            className="stroke-[#2d9658] dark:stroke-[#14422a]"
            strokeWidth="1.2"
          />

          {/* ── Value + label grouped per hill ── */}
          {hills.map((h) => (
            <g key={h.label}>
              {/* Value — large bold, sits above peak */}
              <text
                x={h.peakX}
                y={h.peakY - 22}
                textAnchor="middle"
                fontSize="22"
                fontWeight="800"
                fill={h.color}
                fontFamily="inherit"
                style={{ filter: `drop-shadow(0 1px 10px ${h.color}bb)` }}
              >
                {h.value}
              </text>
              {/* Label — just below the value, 14px gap */}
              <text
                x={h.peakX}
                y={h.peakY - 6}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                letterSpacing="0.5"
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
