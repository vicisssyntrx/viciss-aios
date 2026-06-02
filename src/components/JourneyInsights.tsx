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

  // Hill peaks [x, peakY] — vary heights for visual depth
  // peakY is lower number = taller hill (SVG coords)
  const hills = [
    {
      label: "GROWTH",
      value: formatGrowth(stats?.current_growth),
      color: "#fbbf24",
      glow: "rgba(251,191,36,0.6)",
      peakX: 50,
      peakY: 34,   // tallest
    },
    {
      label: "PERFECT",
      value: `${completedDays}/${totalProgramDays}`,
      color: "#4ade80",
      glow: "rgba(74,222,128,0.6)",
      peakX: 152,
      peakY: 46,   // medium-tall
    },
    {
      label: "ACTIVE DAYS",
      value: String(activeDays),
      color: "#60a5fa",
      glow: "rgba(96,165,250,0.6)",
      peakX: 258,
      peakY: 40,   // medium
    },
    {
      label: "MISSED",
      value: String(missedDays),
      color: "#f87171",
      glow: "rgba(248,113,113,0.6)",
      peakX: 362,
      peakY: 52,   // shortest
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Journey Insights</h3>
      </div>

      {/* Full landscape card */}
      <div className="glass rounded-2xl overflow-hidden" style={{ minHeight: "110px" }}>
        <svg
          viewBox="0 0 400 110"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          style={{ display: "block", minHeight: "110px" }}
        >
          {/* ── Background sky gradient ── */}
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            {hills.map((h) => (
              <radialGradient key={h.label + "-glow"} id={`glow-${h.label}`} cx="50%" cy="80%" r="50%">
                <stop offset="0%" stopColor={h.glow} stopOpacity="0.25" />
                <stop offset="100%" stopColor={h.glow} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* ── Far background hills (depth layer) ── */}
          <path
            d="M0,75 Q50,55 100,68 T200,60 T300,65 T400,58 L400,110 L0,110 Z"
            className="fill-[#1a3d2b] dark:fill-[#0a1f12]"
            opacity="0.5"
          />

          {/* ── Main ground — single continuous terrain ── */}
          <path
            d={`M0,85
              Q25,80  ${hills[0].peakX},${hills[0].peakY}
              Q${hills[0].peakX + 50},${hills[0].peakY + 16} ${(hills[0].peakX + hills[1].peakX) / 2},${Math.max(hills[0].peakY, hills[1].peakY) + 6}
              Q${hills[1].peakX - 30},${hills[1].peakY + 10} ${hills[1].peakX},${hills[1].peakY}
              Q${hills[1].peakX + 50},${hills[1].peakY + 14} ${(hills[1].peakX + hills[2].peakX) / 2},${Math.max(hills[1].peakY, hills[2].peakY) + 4}
              Q${hills[2].peakX - 30},${hills[2].peakY + 8}  ${hills[2].peakX},${hills[2].peakY}
              Q${hills[2].peakX + 50},${hills[2].peakY + 16} ${(hills[2].peakX + hills[3].peakX) / 2},${Math.max(hills[2].peakY, hills[3].peakY) + 4}
              Q${hills[3].peakX - 30},${hills[3].peakY + 10} ${hills[3].peakX},${hills[3].peakY}
              Q${hills[3].peakX + 30},${hills[3].peakY + 12} 400,80
              L400,110 L0,110 Z`}
            className="fill-[#1e5c38] dark:fill-[#0d2e1c]"
          />

          {/* ── Highlight edge (lighter top of ground) ── */}
          <path
            d={`M0,85
              Q25,80  ${hills[0].peakX},${hills[0].peakY}
              Q${hills[0].peakX + 50},${hills[0].peakY + 16} ${(hills[0].peakX + hills[1].peakX) / 2},${Math.max(hills[0].peakY, hills[1].peakY) + 6}
              Q${hills[1].peakX - 30},${hills[1].peakY + 10} ${hills[1].peakX},${hills[1].peakY}
              Q${hills[1].peakX + 50},${hills[1].peakY + 14} ${(hills[1].peakX + hills[2].peakX) / 2},${Math.max(hills[1].peakY, hills[2].peakY) + 4}
              Q${hills[2].peakX - 30},${hills[2].peakY + 8}  ${hills[2].peakX},${hills[2].peakY}
              Q${hills[2].peakX + 50},${hills[2].peakY + 16} ${(hills[2].peakX + hills[3].peakX) / 2},${Math.max(hills[2].peakY, hills[3].peakY) + 4}
              Q${hills[3].peakX - 30},${hills[3].peakY + 10} ${hills[3].peakX},${hills[3].peakY}
              Q${hills[3].peakX + 30},${hills[3].peakY + 12} 400,80`}
            fill="none"
            className="stroke-[#29784a] dark:stroke-[#14422a]"
            strokeWidth="1.2"
          />

          {/* ── Glow halos on each peak ── */}
          {hills.map((h) => (
            <ellipse
              key={h.label + "-halo"}
              cx={h.peakX}
              cy={h.peakY + 2}
              rx="28"
              ry="10"
              fill={`url(#glow-${h.label})`}
            />
          ))}

          {/* ── Value labels — sitting just above each hill peak ── */}
          {hills.map((h) => (
            <text
              key={h.label + "-val"}
              x={h.peakX}
              y={h.peakY - 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill={h.color}
              style={{ filter: `drop-shadow(0 0 4px ${h.glow})` }}
            >
              {h.value}
            </text>
          ))}

          {/* ── Category labels — at the very bottom ── */}
          {hills.map((h) => (
            <text
              key={h.label + "-lbl"}
              x={h.peakX}
              y={104}
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="bold"
              letterSpacing="0.4"
              fill="#94a3b8"
            >
              {h.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
