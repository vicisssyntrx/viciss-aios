import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState, useEffect } from "react";
import ThoughtOfDay from "./ThoughtOfDay";
import {
  format,
  parseISO,
  differenceInDays,
  isValid,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";

interface GrowthGraphProps {
  activeTab?: string;
}

export default function GrowthGraph({ activeTab }: GrowthGraphProps) {
  const { data: rawLogs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const [range, setRange] = useState<"week" | "month" | "all">("all");
  const [isFlipped, setIsFlipped] = useState(false);

  // Trigger autoflip effect once per session / refresh / tab change for 7 seconds
  useEffect(() => {
    if (activeTab === "dash" || !activeTab) {
      setIsFlipped(false);
      const toThoughtTimer = setTimeout(() => {
        setIsFlipped(true);
        const backToGraphTimer = setTimeout(() => {
          setIsFlipped(false);
        }, 7000);
        return () => clearTimeout(backToGraphTimer);
      }, 7000);
      return () => clearTimeout(toThoughtTimer);
    }
  }, [activeTab]);

  const safeLogs = useMemo(() => getDenseLogs(rawLogs, stats?.start_date) ?? [], [rawLogs, stats?.start_date]);

  const firstValidLog = useMemo(() => safeLogs.find((log) => isValid(parseISO(log.date))), [safeLogs]);
  const statsStart = useMemo(() => (stats?.start_date ? parseISO(stats.start_date) : null), [stats?.start_date]);
  const programStart = useMemo(() => {
    return statsStart && isValid(statsStart)
      ? statsStart
      : firstValidLog
        ? parseISO(firstValidLog.date)
        : new Date();
  }, [statsStart, firstValidLog]);

  const latestValidDate = useMemo(() => {
    const dates = safeLogs
      .map((l) => parseISO(l.date))
      .filter((d) => isValid(d))
      .sort((a, b) => a.getTime() - b.getTime());
    return dates.at(-1) ?? new Date();
  }, [safeLogs]);

  const { filteredLogs, labelFormat } = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const interval =
      range === "week"
        ? { start: weekStart, end: weekEnd }
        : range === "month"
          ? { start: monthStart, end: monthEnd }
          : null;

    const kept = interval
      ? safeLogs.filter((l) => {
          const d = parseISO(l.date);
          return isValid(d) && isWithinInterval(d, interval);
        })
      : safeLogs;

    return {
      filteredLogs: kept,
      labelFormat: range === "week" ? "EEE d" : "MMM d",
    };
  }, [safeLogs, range]);

  // Use stored growth_after from the DB for actual — this is the authoritative server-computed value.
  // For placeholder days (gaps filled by getDenseLogs that have no real log entry), carry forward
  // the last known growth value so the line stays flat rather than resetting to 1.0.
  const data = useMemo(() => {
    const sortedFiltered = [...filteredLogs]
      .map((l) => {
        const d = parseISO(l.date);
        return isValid(d) ? { ...l, _d: d } : null;
      })
      .filter((x): x is (typeof filteredLogs[number] & { _d: Date }) => !!x)
      .sort((a, b) => a._d.getTime() - b._d.getTime());

    if (sortedFiltered.length === 0) return [];

    // Find the last known growth_after before the filtered range starts (for carry-forward seed)
    const rangeStart = sortedFiltered[0]._d;
    const seedLog = [...safeLogs]
      .filter((l) => {
        const d = parseISO(l.date);
        return isValid(d) && d < rangeStart && (l as any).growth_after != null;
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())[0];

    let lastKnownActual: number = (seedLog as any)?.growth_after ?? 1.0;

    // Prepend a day-0 anchor so the graph always starts at a known baseline
    const firstDayNum = differenceInDays(sortedFiltered[0]._d, programStart);
    const anchor = firstDayNum > 0
      ? [{ day: 0, label: format(programStart, labelFormat), actual: 1.0, ideal: 1.0 }]
      : [];

    const points = sortedFiltered.map((l) => {
      const dayNum = Math.max(0, differenceInDays(l._d, programStart));
      // Ideal: 1.01^dayNum means "if you completed every day perfectly since day 0"
      const idealGrowth = Math.pow(1.01, dayNum + 1);
      // Use server-stored growth_after; fall back to last known if gap/placeholder day
      const storedAfter = (l as any).growth_after as number | null | undefined;
      const actualVal = storedAfter != null && storedAfter > 0 ? storedAfter : lastKnownActual;
      if (storedAfter != null && storedAfter > 0) lastKnownActual = storedAfter;

      return {
        day: dayNum,
        label: format(l._d, labelFormat),
        actual: Number(actualVal.toFixed(4)),
        ideal: Number(idealGrowth.toFixed(4)),
      };
    });

    return [...anchor, ...points];
  }, [safeLogs, filteredLogs, labelFormat, programStart]);

  if (!safeLogs.length) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground px-1">Growth</h3>
        <div className="glass rounded-2xl p-4">
          <div className="h-36 flex items-center justify-center text-muted-foreground text-base">
            Save your first day to see growth
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground px-1">Growth</h3>
      <div className="flip-card-container h-[264px] md:h-[276px]">
        <div className={`flip-card-inner h-full ${isFlipped ? "flipped" : ""}`}>
          
          {/* Front Side: Graph Card */}
          <div className="flip-card-front h-full">
            <div className="glass rounded-2xl p-3 md:p-5 h-full flex flex-col justify-between cursor-pointer" onClick={() => setIsFlipped(true)}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-y-2">
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {(["week", "month", "all"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRange(r)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        range === r
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground w-full sm:w-auto">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-primary inline-block" /> Actual</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-muted-foreground inline-block" /> Ideal</span>
                </div>
              </div>
              {data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  No data for this {range === "week" ? "week" : "month"} yet
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <XAxis
                        dataKey="day"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => String(v)}
                      />
                      <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin", "auto"]} width={44} />
                      <Tooltip
                        labelFormatter={(v, payload) => {
                          const first = payload?.[0]?.payload as { label?: string } | undefined;
                          return first?.label ? `${first.label} (Day ${v})` : `Day ${v}`;
                        }}
                        contentStyle={{ background: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8, color: "#fff", fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="ideal" stroke="hsl(0,0%,35%)" strokeDasharray="4 4" dot={false} strokeWidth={1} name="Ideal (1%/day)" />
                      <Line type="monotone" dataKey="actual" stroke="hsl(0,72%,51%)" dot={false} strokeWidth={2} name="Your Growth" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Back Side: Thought of the Day */}
          <div className="flip-card-back h-full">
            <ThoughtOfDay onFlipBack={() => setIsFlipped(false)} />
          </div>

        </div>
      </div>
    </div>
  );
}
