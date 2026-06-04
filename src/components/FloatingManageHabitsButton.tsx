import { useState } from "react";
import { PenLine } from "lucide-react";
import HabitCreation from "./HabitCreation";
import HabitEditList from "./HabitEditList";
import { createPortal } from "react-dom";

export default function FloatingManageHabitsButton() {
  const [showManage, setShowManage] = useState(false);

  return (
    <>
      {/* Manage Habits Sheet */}
      {showManage && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowManage(false)}
          />
          <div className="relative w-full bg-card text-card-foreground border-t border-border shadow-2xl rounded-t-2xl p-4 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Mobile Pull Bar */}
            <div className="sm:hidden w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-foreground">Manage Habits</h3>
              <button
                onClick={() => setShowManage(false)}
                className="text-muted-foreground hover:text-foreground text-2xl leading-none px-2"
              >
                ×
              </button>
            </div>
            <HabitCreation />
            <HabitEditList />
          </div>
        </div>,
        document.body
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowManage(true)}
        className="fixed bottom-[110px] md:bottom-16 right-6 md:right-[max(2rem,calc(50%-38rem))] z-40 flex items-center justify-center rounded-full h-14 w-14 shadow-2xl glass hover:scale-105 active:scale-95 transition-all group"
        aria-label="Manage Habits"
      >
        <PenLine className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] group-hover:drop-shadow-[0_0_12px_rgba(var(--primary),0.8)] transition-all" />
      </button>
    </>
  );
}
