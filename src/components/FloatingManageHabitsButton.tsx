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
        className="fixed bottom-24 right-6 z-40 flex items-center justify-center rounded-2xl h-14 w-14 shadow-xl shadow-primary/30 bg-primary text-primary-foreground border-2 border-primary/20 hover:scale-105 active:scale-95 transition-all"
        aria-label="Manage Habits"
      >
        <PenLine className="h-6 w-6" />
      </button>
    </>
  );
}
