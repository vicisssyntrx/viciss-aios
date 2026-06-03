import { useState } from "react";
import { RotateCcw, ListPlus } from "lucide-react";
import HabitCreation from "./HabitCreation";
import HabitEditList from "./HabitEditList";
import { createPortal } from "react-dom";

interface Props {
  onReset: () => void;
  disabled: boolean;
  hasHabits: boolean;
}

export default function BottomActionBar({ onReset, disabled, hasHabits }: Props) {
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
          <div className="relative w-full glass-strong rounded-t-2xl p-4 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
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

      {/* Action bar (inline; placed by parent) */}
      <div className="glass rounded-2xl px-3 py-3">
        <div className="flex items-center justify-center gap-4">
          {/* Add/Edit Habits */}
          <button
            onClick={() => setShowManage(true)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl h-12 font-medium transition-all ${
              !hasHabits
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 border border-primary/60 animate-pulse-subtle"
                : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            }`}
          >
            <ListPlus className="h-[20px] w-[20px]" />
            Add Habits
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl h-12 font-medium bg-white/5 border border-white/10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RotateCcw className="h-[18px] w-[18px]" />
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
