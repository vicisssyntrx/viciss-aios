import { useDailyLogs, getDenseLogs } from "@/hooks/useDailyLogs";
import { X, Flame } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { parseISO } from "date-fns";
import { useUserStats } from "@/hooks/useUserStats";
import { createPortal } from "react-dom";
import { todayYmdLocal } from "@/lib/date";

interface Props { onClose: () => void; }

export default function StreakWindow({ onClose }: Props) {
  const { data: logs } = useDailyLogs();
  const { data: stats } = useUserStats();
  const today = todayYmdLocal();
  
  const denseLogs = getDenseLogs(logs, stats?.start_date);
  
  // Exclude today from ALL past-day modifiers. Today is still in progress —
  // it should show as a neutral outlined date in the calendar, not colored.
  const pastLogs = denseLogs.filter((l) => l.date !== today);

  const recoveredDays  = pastLogs.filter((l) => l.is_recovered).map((l) => parseISO(l.date));
  const shieldedDays   = pastLogs.filter((l) => l.shield_used && !l.is_recovered).map((l) => parseISO(l.date));
  const completedDays  = pastLogs.filter((l) => l.completed_count === l.total_count && l.total_count > 0 && !l.is_recovered && !l.shield_used).map((l) => parseISO(l.date));
  const gapDays        = pastLogs.filter((l) => l.completed_count < l.total_count && !l.shield_used && !l.is_recovered).map((l) => parseISO(l.date));

  // Today's live state for calendar coloring
  const todayLog = denseLogs.find((l) => l.date === today);
  const todayDate = parseISO(today);

  // Determine today's color based on current completion state
  const todayCompleted  = todayLog && todayLog.completed_count === todayLog.total_count && todayLog.total_count > 0 ? [todayDate] : [];
  // If today has no log yet or is not fully completed — show as outline only (no modifier)
  const todayOutline    = !todayLog || todayLog.completed_count < todayLog.total_count ? [todayDate] : [];

  const displayStreak = stats?.streak || 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div className="glass w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-3 sm:p-4 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Pull Bar */}
        <div className="sm:hidden w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#f97316] drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> 
            Streak Calendar
          </h2>
          <button onClick={onClose} className="popup-close"><X className="h-4 w-4" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Current streak: <span className="font-semibold text-foreground">{displayStreak}</span>
        </p>

        <div className="rounded-xl border border-border p-2 overflow-x-auto">
          <Calendar
            mode="single"
            selected={undefined}
            className="p-0 w-full"
            classNames={{
              months: "flex w-full flex-col",
              month: "w-full space-y-3",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              row: "flex w-full mt-2",
              head_cell: "w-full text-center text-muted-foreground text-sm",
              cell: "relative p-0 text-center w-full",
              day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 mx-auto",
              day_today: "ring-2 ring-primary ring-offset-1 ring-offset-background rounded-full",
            }}
            modifiers={{
              completed:     [...completedDays, ...todayCompleted],
              shielded:      shieldedDays,
              gap:           gapDays,
              recovered:     recoveredDays,
              todayOutline:  todayOutline,
            }}
            modifiersClassNames={{
              completed:    "bg-red-600 text-white hover:bg-red-600 focus:bg-red-600 rounded-full",
              shielded:     "bg-blue-600 text-white hover:bg-blue-600 focus:bg-blue-600 rounded-full",
              gap:          "bg-zinc-600 text-white hover:bg-zinc-600 focus:bg-zinc-600 rounded-full",
              recovered:    "bg-[#fbbf24] text-black hover:bg-[#f59e0b] focus:bg-[#f59e0b] rounded-full",
              todayOutline: "ring-2 ring-primary/60 ring-offset-1 ring-offset-background rounded-full",
            }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600 shrink-0" /> Completed</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-zinc-600 shrink-0" /> Gap</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-600 shrink-0" /> Shielded</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#fbbf24] shrink-0" /> Recovered</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-primary/60 shrink-0" /> Today</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
