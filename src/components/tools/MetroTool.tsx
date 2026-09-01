import { useState, useEffect } from "react";
import { Train, ArrowLeftRight, ChevronDown, Clock, Milestone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATIONS,
  Station,
  getTrainsBetween,
  getScheduleForDirection,
  timeToMinutes,
} from "@/data/metroSchedule";

const STORAGE_KEY_FROM = "metro-from-station";
const STORAGE_KEY_TO = "metro-to-station";

interface TrainInfo {
  fromTime: string;
  toTime: string;
  fromMinutes: number;
}

function useCurrentTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 10000); // update every 10s
    return () => clearInterval(iv);
  }, []);
  return now;
}

function formatCountdown(diffMins: number): string {
  if (diffMins < 1) return "Arriving";
  if (diffMins < 60) return `in ${diffMins}m`;
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  return `in ${h}h ${m > 0 ? `${m}m` : ""}`;
}

interface TrainCardProps {
  label: string;
  labelColor: string;
  badge?: string;
  train: TrainInfo | null;
  diffMins?: number;
  isPast?: boolean;
}

function TrainCard({ label, labelColor, badge, train, diffMins, isPast }: TrainCardProps) {
  if (!train) {
    return (
      <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/20 border border-border/20 opacity-50">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", labelColor)}>{label}</span>
        <span className="text-sm text-muted-foreground">No more trains today</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-300",
      isPast ? "bg-secondary/20 border-border/20 opacity-60" : "bg-secondary/40 border-border/30"
    )}>
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", labelColor)}>{label}</span>
        {badge && (
          <span className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full",
            isPast ? "bg-secondary/50 text-muted-foreground" : "bg-primary/20 text-primary"
          )}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-foreground tracking-tight">{train.fromTime}</span>
            <span className="text-[9px] text-muted-foreground/70 -mt-0.5">depart</span>
          </div>
          <div className="flex flex-col items-center px-2 opacity-40">
            <div className="h-px w-8 bg-muted-foreground" />
            <Train className="w-3 h-3 text-muted-foreground my-0.5" />
            <div className="h-px w-8 bg-muted-foreground" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-primary tracking-tight">{train.toTime}</span>
            <span className="text-[9px] text-muted-foreground/70 -mt-0.5">arrive</span>
          </div>
        </div>
        {!isPast && diffMins !== undefined && (
          <div className="flex flex-col items-end">
            <span className="text-sm font-black text-foreground">{formatCountdown(diffMins)}</span>
            <span className="text-[9px] text-muted-foreground">at your station</span>
          </div>
        )}
        {isPast && (
          <span className="text-[10px] text-muted-foreground italic">departed</span>
        )}
      </div>
    </div>
  );
}

interface StationSelectProps {
  value: Station;
  onChange: (s: Station) => void;
  label: string;
  excludeStation?: Station;
}

function StationSelect({ value, onChange, label, excludeStation }: StationSelectProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-secondary/40 border border-border/40 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
      >
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{label}</span>
          <span className="truncate text-sm">{value}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-1 duration-150">
          {STATIONS.filter(s => s !== excludeStation).map(station => (
            <button
              key={station}
              onClick={() => { onChange(station); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors hover:bg-secondary/50",
                station === value ? "bg-primary/20 text-primary font-bold" : "text-foreground"
              )}
            >
              {station}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DirectionBlockProps {
  from: Station;
  to: Station;
  nowMins: number;
  isMain?: boolean;
}

function DirectionBlock({ from, to, nowMins, isMain = false }: DirectionBlockProps) {
  const schedule = getScheduleForDirection(from, to);
  const trains = getTrainsBetween(schedule, from, to);

  // Find previous, next, after-next
  const nextIdx = trains.findIndex(t => t.fromMinutes > nowMins);
  const prevTrain = nextIdx > 0 ? trains[nextIdx - 1] : nextIdx === -1 ? trains[trains.length - 1] : null;
  const nextTrain = nextIdx !== -1 ? trains[nextIdx] : null;
  const afterNextTrain = nextIdx !== -1 && nextIdx + 1 < trains.length ? trains[nextIdx + 1] : null;

  const nextDiff = nextTrain ? nextTrain.fromMinutes - nowMins : undefined;
  const afterNextDiff = afterNextTrain ? afterNextTrain.fromMinutes - nowMins : undefined;

  return (
    <div className={cn("rounded-2xl p-4 border", isMain ? "bg-secondary/30 border-border/40" : "bg-secondary/10 border-border/20")}>
      {/* Direction header */}
      <div className="flex items-center gap-2 mb-3">
        <Train className={cn("w-4 h-4", isMain ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-xs font-bold truncate", isMain ? "text-foreground" : "text-muted-foreground")}>
          {from}
        </span>
        <span className="text-muted-foreground/40">→</span>
        <span className={cn("text-xs font-bold truncate", isMain ? "text-primary" : "text-muted-foreground/80")}>
          {to}
        </span>
      </div>

      <div className="space-y-2">
        <TrainCard
          label="Previous"
          labelColor="text-muted-foreground"
          train={prevTrain}
          isPast={true}
        />
        <TrainCard
          label="Next Train"
          labelColor="text-primary"
          badge="🚇 Next"
          train={nextTrain}
          diffMins={nextDiff}
        />
        <TrainCard
          label="After Next"
          labelColor="text-muted-foreground"
          badge="Following"
          train={afterNextTrain}
          diffMins={afterNextDiff}
        />
      </div>
    </div>
  );
}

interface Props {
  compact?: boolean;
}

export default function MetroTool({ compact = false }: Props) {
  const now = useCurrentTime();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const [from, setFrom] = useState<Station>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FROM) as Station | null;
    return saved && STATIONS.includes(saved) ? saved : "APMC";
  });

  const [to, setTo] = useState<Station>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TO) as Station | null;
    return saved && STATIONS.includes(saved) ? saved : "GNLU";
  });

  // Persist selections
  const handleFromChange = (s: Station) => {
    if (s === to) setTo(from); // swap if same
    setFrom(s);
    localStorage.setItem(STORAGE_KEY_FROM, s);
  };

  const handleToChange = (s: Station) => {
    if (s === from) setFrom(to); // swap if same
    setTo(s);
    localStorage.setItem(STORAGE_KEY_TO, s);
  };

  const handleSwap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
    localStorage.setItem(STORAGE_KEY_FROM, to);
    localStorage.setItem(STORAGE_KEY_TO, from);
  };

  // Compact preview — show next train in each direction
  if (compact) {
    const fwdSchedule = getScheduleForDirection(from, to);
    const fwdTrains = getTrainsBetween(fwdSchedule, from, to);
    const revSchedule = getScheduleForDirection(to, from);
    const revTrains = getTrainsBetween(revSchedule, to, from);

    const nextFwd = fwdTrains.find(t => t.fromMinutes > nowMins);
    const nextRev = revTrains.find(t => t.fromMinutes > nowMins);

    return (
      <div className="flex flex-col gap-2 w-full text-[11px]">
        {/* Forward */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground truncate max-w-[120px]">{from} → {to}</span>
          {nextFwd ? (
            <div className="flex items-center gap-1.5 font-bold text-primary shrink-0">
              <Clock className="w-3 h-3" />
              {nextFwd.fromTime}
              <span className="text-muted-foreground font-normal text-[10px]">
                ({formatCountdown(nextFwd.fromMinutes - nowMins)})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-[10px]">No more today</span>
          )}
        </div>
        {/* Return */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground truncate max-w-[120px]">{to} → {from}</span>
          {nextRev ? (
            <div className="flex items-center gap-1.5 font-bold text-foreground shrink-0">
              <Clock className="w-3 h-3" />
              {nextRev.fromTime}
              <span className="text-muted-foreground font-normal text-[10px]">
                ({formatCountdown(nextRev.fromMinutes - nowMins)})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-[10px]">No more today</span>
          )}
        </div>
      </div>
    );
  }

  // Full tool view
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-none">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
          <Train className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">AMD Metro</h2>
          <p className="text-[10px] text-muted-foreground">Ahmedabad–Gandhinagar Metro Rail</p>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-secondary/40 rounded-full px-3 py-1">
          <Clock className="w-3 h-3 text-primary" />
          <span className="text-xs font-bold text-primary font-mono">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Station Selector */}
      <div className="flex items-center gap-2 mb-4 flex-none">
        <StationSelect
          label="From"
          value={from}
          onChange={handleFromChange}
          excludeStation={to}
        />
        <button
          onClick={handleSwap}
          className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95 shrink-0"
          title="Swap stations"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <StationSelect
          label="To"
          value={to}
          onChange={handleToChange}
          excludeStation={from}
        />
      </div>

      {/* Schedule Cards — scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
        {/* Main direction */}
        <DirectionBlock from={from} to={to} nowMins={nowMins} isMain />

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border/30" />
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" /> Return
          </span>
          <div className="flex-1 h-px bg-border/30" />
        </div>

        {/* Return direction */}
        <DirectionBlock from={to} to={from} nowMins={nowMins} />

        {/* Last train warning */}
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Milestone className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-400/80 leading-relaxed">
            Last train from APMC: <strong>20:45</strong> · From Gift City: <strong>21:00</strong>. w.e.f 18 May 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
