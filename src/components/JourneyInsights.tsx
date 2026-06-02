import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { todayYmdLocal } from "@/lib/date";
import { useEffect, useMemo, useState } from "react";
import { parseISO, differenceInDays } from "date-fns";

interface JourneyInsightsProps {
  activeTab?: string;
}

export default function JourneyInsights({ activeTab }: JourneyInsightsProps) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-flip: show road side briefly, then flip back
  useEffect(() => {
    if (activeTab === "dash" || !activeTab) {
      setIsFlipped(false);
      const toRoad = setTimeout(() => {
        setIsFlipped(true);
        const toFront = setTimeout(() => setIsFlipped(false), 5000);
        return () => clearTimeout(toFront);
      }, 5000);
      return () => clearTimeout(toRoad);
    }
  }, [activeTab]);

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

  const maxGrowth = formatGrowth(Math.pow(1.01, totalProgramDays));
  const nextGrowth = useMemo(() => {
    const current = stats?.current_growth ?? 1.0;
    return formatGrowth(current * 1.01);
  }, [stats?.current_growth]);

  const items = [
    { label: "Growth", value: formatGrowth(stats?.current_growth), colorClass: "text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" },
    { label: "Perfect", value: <><span className="text-[#4ade80]">{completedDays}</span><span className="text-foreground text-sm md:text-base ml-1 font-medium">/ {totalProgramDays}</span></>, colorClass: "" },
    { label: "Active Days", value: activeDays, colorClass: "text-[#60a5fa]" },
    { label: "Missed", value: missedDays, colorClass: "text-[#f87171]" },
  ];

  // ── Shared 3D styles ──────────────────────────────────────────────────────
  const backfaceHidden: React.CSSProperties = {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden" as any,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Journey Insights</h3>
      </div>

      {/* Perspective wrapper — must be the direct parent of the flipping element */}
      <div style={{ perspective: "1200px", WebkitPerspective: "1200px" as any }}>
        {/* Flip container — rotateX for top-to-bottom flip */}
        <div
          onClick={() => setIsFlipped((f) => !f)}
          className="relative w-full cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d" as any,
            transition: "transform 700ms cubic-bezier(0.4,0,0.2,1)",
            transform: isFlipped ? "rotateX(180deg)" : "rotateX(0deg)",
          }}
        >
          {/* ── FRONT FACE ───────────────────────────────────────────────────── */}
          <div
            className="glass rounded-2xl p-4 md:p-5 min-h-[96px] flex flex-col justify-center"
            style={backfaceHidden}
          >
            <div className="grid grid-cols-4 gap-3 md:gap-4">
              {items.map((item) => (
                <div key={item.label} className="text-center">
                  <p className={`text-xl md:text-2xl font-bold ${item.colorClass}`}>{item.value}</p>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── BACK FACE — Road Map ─────────────────────────────────────────── */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-b from-[#1a2d28] to-[#0d1a16]"
            style={{
              ...backfaceHidden,
              // rotateX-based flip: back face needs rotateX(180deg)
              transform: "rotateX(180deg)",
            }}
          >
              {/* Road SVG — includes Goal badge in top-right corner */}
            <svg
              viewBox="0 0 400 120"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {/* Hills */}
              <path d="M0,80 Q60,40 140,65 T280,55 T400,75 L400,120 L0,120 Z" fill="#17201e" />
              <path d="M0,95 Q100,70 190,85 T340,65 T400,80 L400,120 L0,120 Z" fill="#1c2624" />

              {/* Road */}
              <path d="M-40,120 C80,120 160,90 220,80 C280,70 340,75 380,60 L380,57 C340,72 280,67 220,77 C160,87 80,105 0,120 Z" fill="#2c3b38" />

              {/* Dashed centre line */}
              <path
                d="M-20,120 C80,112.5 160,88.5 220,78.5 C280,68.5 340,73.5 380,58.5"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.7"
              />

              {/* PRESENT board — far left, large */}
              <g transform="translate(48, 60)">
                <rect x="7" y="28" width="2" height="22" fill="#475569" />
                <rect x="39" y="28" width="2" height="22" fill="#475569" />
                <rect x="0" y="0" width="48" height="28" rx="3" fill="#1e293b" />
                <rect x="0" y="0" width="48" height="28" rx="3" fill="none" stroke="#fbbf2466" strokeWidth="1" />
                <text x="24" y="10" fontSize="4.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">PRESENT</text>
                <text x="24" y="22" fontSize="9" fill="#fbbf24" textAnchor="middle" fontWeight="bold">
                  {formatGrowth(stats?.current_growth)}
                </text>
              </g>

              {/* NEXT board — mid */}
              <g transform="translate(215, 46) scale(0.80)">
                <rect x="7" y="28" width="2" height="22" fill="#475569" />
                <rect x="39" y="28" width="2" height="22" fill="#475569" />
                <rect x="0" y="0" width="48" height="28" rx="3" fill="#1e293b" />
                <rect x="0" y="0" width="48" height="28" rx="3" fill="none" stroke="#4ade8066" strokeWidth="1" />
                <text x="24" y="10" fontSize="4.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">NEXT</text>
                <text x="24" y="22" fontSize="9" fill="#4ade80" textAnchor="middle" fontWeight="bold">
                  {nextGrowth}
                </text>
              </g>

              {/* GOAL corner badge — top-right, compact with arrow pointing right */}
              {/* Dashed arrow line from road to badge */}
              <line x1="358" y1="62" x2="378" y2="18" stroke="#ffffff33" strokeWidth="0.8" strokeDasharray="2,2" />
              {/* Arrow head */}
              <polygon points="378,14 374,20 382,20" fill="#ffffff44" />
              {/* Badge background */}
              <rect x="340" y="2" width="58" height="12" rx="2" fill="#0f172a" />
              <rect x="340" y="2" width="58" height="12" rx="2" fill="none" stroke="#ffffff22" strokeWidth="0.8" />
              {/* Badge label */}
              <text x="369" y="8" fontSize="3.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" letterSpacing="0.3">GOAL GROWTH</text>
              <text x="369" y="12.5" fontSize="5.5" fill="#f8fafc" textAnchor="middle" fontWeight="bold">{maxGrowth}</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
