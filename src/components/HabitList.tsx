import { useHabits } from "@/hooks/useHabits";
import { Switch } from "@/components/ui/switch";

interface Props {
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  viewOnly?: boolean; // past date — no toggling
}

export default function HabitList({ completedIds, onToggle, viewOnly = false }: Props) {
  const { data: habits, isLoading } = useHabits();

  if (isLoading) return (
    <div className="glass rounded-xl p-4 text-center text-muted-foreground text-base">
      Loading habits...
    </div>
  );

  if (!habits?.length) return (
    <div className="glass rounded-xl p-6 text-center text-muted-foreground text-sm">
      No habits yet — tap <span className="text-primary font-semibold">Habits</span> below to add your first one!
    </div>
  );

  return (
    <div className="space-y-2">
      <h3 className="py-2 text-[4.5rem] leading-[0.85] font-black text-foreground md:text-sm md:font-normal md:uppercase md:tracking-wider md:text-muted-foreground px-1 mb-4 md:mb-0 md:py-0">Tasks</h3>
      <div className="space-y-1.5">
      {habits.map((h) => {
        const checked = completedIds.has(h.id);
        return (
          <button
            key={h.id}
            type="button"
            disabled={viewOnly}
            onClick={() => onToggle(h.id)}
            className={`glass rounded-xl p-3.5 flex items-center gap-3 transition-all w-full text-left ${
              checked ? "border border-primary/30 bg-primary/5" : ""
            }`}
          >
            <span className="text-2xl">{h.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-base truncate">{h.name}</p>
              {h.outcome_name && (
                <p className="text-sm text-muted-foreground">{h.outcome_emoji} {h.outcome_name}</p>
              )}
            </div>
            {viewOnly ? (
              <span className={`text-lg ${checked ? "opacity-100" : "opacity-30"}`}>
                {checked ? "✅" : "○"}
              </span>
            ) : (
              <Switch
                checked={checked}
                onCheckedChange={() => onToggle(h.id)}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-primary scale-100"
              />
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}
