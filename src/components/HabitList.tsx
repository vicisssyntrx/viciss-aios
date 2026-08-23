import { useHabits } from "@/hooks/useHabits";
import { Switch } from "@/components/ui/switch";
import { ClipboardList, LayoutList, GalleryVertical, GalleryHorizontal } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  viewOnly?: boolean; // past date — no toggling
}

export default function HabitList({ completedIds, onToggle, viewOnly = false }: Props) {
  const { data: habits, isLoading } = useHabits();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'stack' | 'vertical' | 'horizontal'>(() => {
    return (localStorage.getItem("tasks-view-mode") as any) || 'stack';
  });

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent, id: string) => {
    if (viewOnly) return;
    const deltaX = Math.abs(e.clientX - touchStartX.current);
    const deltaY = Math.abs(e.clientY - touchStartY.current);
    if (deltaX < 10 && deltaY < 10) {
      onToggle(id);
    }
  };

  const cycleViewMode = () => {
    const next = viewMode === 'stack' ? 'vertical' : viewMode === 'vertical' ? 'horizontal' : 'stack';
    setViewMode(next);
    localStorage.setItem("tasks-view-mode", next);
  };

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

  const effectiveViewMode = isMobile ? viewMode : 'stack';

  return (
    <div className="space-y-2 flex flex-col h-full relative">
      <div className="flex items-center justify-between px-1 mb-6 md:mb-0">
        <h3 className="pt-10 pb-2 flex items-center gap-3 text-[3.8rem] leading-none font-black text-foreground md:text-sm md:font-normal md:uppercase md:tracking-wider md:text-muted-foreground md:pt-0">
          <ClipboardList className="w-12 h-12 md:hidden text-primary" />
          Tasks
        </h3>
        
        <button 
          onClick={cycleViewMode}
          className="md:hidden mt-8 p-2.5 bg-secondary/50 hover:bg-secondary rounded-full text-foreground/70 transition-colors"
          title="Change View Style"
        >
          {effectiveViewMode === 'stack' && <LayoutList className="w-5 h-5" />}
          {effectiveViewMode === 'vertical' && <GalleryVertical className="w-5 h-5" />}
          {effectiveViewMode === 'horizontal' && <GalleryHorizontal className="w-5 h-5" />}
        </button>
      </div>

      <div className={cn(
        "flex-1 min-h-0",
        effectiveViewMode === 'stack' && "space-y-1.5",
        effectiveViewMode === 'vertical' && "overflow-y-auto snap-y snap-mandatory scroll-smooth space-y-4 pb-32 -mx-4 px-4 h-[60vh]",
        effectiveViewMode === 'horizontal' && "overflow-x-auto snap-x snap-mandatory scroll-smooth flex gap-4 pb-4 -mx-4 px-4 h-[60vh]"
      )}>
        {habits.map((h) => {
          const checked = completedIds.has(h.id);
          return (
            <div
              key={h.id}
              onPointerDown={handlePointerDown}
              onPointerUp={(e) => handlePointerUp(e, h.id)}
              className={cn(
                "rounded-2xl flex transition-all duration-300 ease-out relative select-none transform origin-center transform-gpu",
                checked ? "scale-[0.93]" : "scale-100 active:scale-[0.93]",
                effectiveViewMode === 'stack' ? "glass p-3.5 items-center gap-3 w-full text-left" : "bg-card shadow-xl border border-border/50 flex-col justify-center items-center text-center p-6 flex-shrink-0 snap-center",
                effectiveViewMode === 'vertical' ? "w-full aspect-square max-h-[380px] max-w-[380px] mx-auto" : "",
                effectiveViewMode === 'horizontal' ? "w-[calc(100vw-32px)] aspect-square max-h-[380px] max-w-[380px] mx-auto" : "",
                checked ? (effectiveViewMode === 'stack' ? "!border-primary/50 !bg-primary/10" : "!border-2 !border-primary !bg-primary shadow-[inset_0_0_30px_rgba(255,255,255,0.2),0_0_40px_rgba(var(--primary),0.8)] ring-4 ring-primary/50") : ""
              )}
            >
              {effectiveViewMode === 'stack' ? (
                <>
                  <span className="text-2xl">{h.emoji}</span>
                  <div className="flex-1 min-w-0 pointer-events-none">
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
                    <div className="pointer-events-none">
                      <Switch
                        checked={checked}
                        className="data-[state=checked]:bg-primary scale-100 pointer-events-none"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Large Card Layout for Swipers */}
                  <div className="flex flex-col items-center justify-center h-full w-full pointer-events-none">
                    <span className="text-6xl mb-6 drop-shadow-xl">{h.emoji}</span>
                    <h4 className="font-black text-3xl text-foreground mb-3 px-4 leading-tight text-center">{h.name}</h4>
                    {h.outcome_name && (
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center">
                        {h.outcome_emoji} {h.outcome_name}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
