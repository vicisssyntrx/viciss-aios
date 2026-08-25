import { useHabits } from "@/hooks/useHabits";
import { Switch } from "@/components/ui/switch";
import { ClipboardList, LayoutList, Layers } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface Props {
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  viewOnly?: boolean; // past date — no toggling
}

export default function HabitList({ completedIds, onToggle, viewOnly = false }: Props) {
  const { data: habits, isLoading } = useHabits();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'stack' | 'deck'>(() => {
    const saved = localStorage.getItem("tasks-view-mode");
    return (saved === 'deck' || saved === 'vertical' || saved === 'horizontal') ? 'deck' : 'stack';
  });
  
  const [activeIndex, setActiveIndex] = useState(0);
  const isDragging = useRef(false);

  const cycleViewMode = () => {
    const next = viewMode === 'stack' ? 'deck' : 'stack';
    setViewMode(next);
    localStorage.setItem("tasks-view-mode", next);
  };

  const handleDeckDragEnd = (e: any, info: PanInfo) => {
    // If they swipe left/right/up/down significantly, move to next card
    if (Math.abs(info.offset.x) > 50 || Math.abs(info.offset.y) > 50) {
      if (!habits) return;
      setActiveIndex(prev => prev + 1);
    }
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
  const isDeck = effectiveViewMode === 'deck';

  return (
    <div className="space-y-2 flex flex-col h-full relative">
      <div className="flex flex-col items-start px-1 mb-8 gap-4 md:flex-row md:items-center md:justify-between md:mb-0 md:gap-0">
        <h3 className="-mt-4 md:mt-0 flex items-center gap-3 text-[3.8rem] leading-none font-black text-foreground md:text-sm md:font-normal md:uppercase md:tracking-wider md:text-muted-foreground">
          <ClipboardList className="w-12 h-12 md:hidden text-primary" />
          Tasks
        </h3>
        
        <button 
          onClick={cycleViewMode}
          className="md:hidden flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-full text-foreground/70 transition-colors text-sm font-semibold border border-border/50"
          title="Change View Style"
        >
          {effectiveViewMode === 'stack' && <><LayoutList className="w-4 h-4" /> Stack View</>}
          {effectiveViewMode === 'deck' && <><Layers className="w-4 h-4" /> 3D Deck</>}
        </button>
      </div>

      <div className={cn(
        "flex-1 min-h-0 relative",
        effectiveViewMode === 'stack' && "space-y-1.5",
        effectiveViewMode === 'deck' && "flex flex-col items-center justify-center min-h-[50vh] mt-4"
      )}>
        {effectiveViewMode === 'stack' && habits.map((h) => {
          const checked = completedIds.has(h.id);
          return (
            <div
              key={h.id}
              onClick={() => { if(!viewOnly) onToggle(h.id); }}
              className={cn(
                "rounded-2xl flex transition-all duration-300 ease-out relative select-none transform origin-center transform-gpu",
                checked ? "scale-[0.98]" : "scale-100 active:scale-[0.98]",
                "glass p-3.5 items-center gap-3 w-full text-left cursor-pointer",
                "!shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:!shadow-none",
                "dark:border dark:!border-white/20",
                checked ? "!border-primary/50 !bg-primary/10" : ""
              )}
            >
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
                  <Switch checked={checked} className="data-[state=checked]:bg-primary scale-100" />
                </div>
              )}
            </div>
          );
        })}

        {isDeck && (
          <AnimatePresence>
            {habits.map((h, i) => {
              const checked = completedIds.has(h.id);
              
              // Calculate infinite continuous offset
              let offset = (i - (activeIndex % habits.length));
              if (offset < 0) offset += habits.length;
              
              // Only render cards that are on top or slightly behind (limit to 4 cards for performance/visuals)
              if (offset > 3) return null;

              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ 
                    opacity: 1 - offset * 0.2, 
                    y: offset * 25, 
                    scale: 1 - offset * 0.05,
                    zIndex: 50 - offset,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  drag={offset === 0 && !viewOnly ? true : false}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  onDragStart={() => {
                    isDragging.current = true;
                  }}
                  onDragEnd={(e, info) => {
                    setTimeout(() => {
                      isDragging.current = false;
                    }, 50);
                    handleDeckDragEnd(e, info);
                  }}
                  onTap={(e) => {
                    if (isDragging.current) return;
                    if (viewOnly || offset !== 0) return;
                    onToggle(h.id);
                  }}
                  className={cn(
                    "absolute w-[calc(100vw-64px)] aspect-[3/4] max-h-[420px] max-w-[320px] rounded-3xl flex flex-col justify-center items-center text-center p-6 cursor-pointer touch-none no-sound",
                    "bg-card border border-border dark:border-white/20",
                    offset === 0 ? "!shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:!shadow-[0_30px_60px_rgba(0,0,0,0.95),0_0_20px_rgba(255,255,255,0.03)]" : "!shadow-md dark:!shadow-[0_15px_30px_rgba(0,0,0,0.4)]",
                    checked ? "!border-2 !border-primary !bg-primary !shadow-[inset_0_0_30px_rgba(255,255,255,0.2),0_0_40px_rgba(var(--primary),0.8)] ring-4 ring-primary/50 scale-[0.95]" : ""
                  )}
                >
                  <span className="text-6xl mb-6 drop-shadow-xl pointer-events-none">{h.emoji}</span>
                  <h4 className={cn("font-black text-3xl mb-3 px-4 leading-tight pointer-events-none", checked ? "text-primary-foreground" : "text-foreground")}>{h.name}</h4>
                  {h.outcome_name && (
                    <p className={cn("text-sm font-semibold uppercase tracking-wider pointer-events-none", checked ? "text-primary-foreground/90" : "text-muted-foreground")}>
                      {h.outcome_emoji} {h.outcome_name}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        
        {/* No longer need the "All caught up" state since it loops infinitely */}
      </div>
    </div>
  );
}
