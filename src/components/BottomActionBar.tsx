import { useState } from "react";
import { Save, RotateCcw, ListPlus } from "lucide-react";
import HabitCreation from "./HabitCreation";
import HabitEditList from "./HabitEditList";
import { createPortal } from "react-dom";

interface Props {
  onSave: () => Promise<boolean | undefined>;
  onReset: () => void;
  disabled: boolean;
  hasHabits: boolean;
}

export default function BottomActionBar({ onSave, onReset, disabled, hasHabits }: Props) {
  const [saving, setSaving] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await onSave();
      if (result) {
        setPulsing(true);
        setTimeout(() => setPulsing(false), 1500);
      }
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex items-center gap-2">
          {/* Add/Edit Habits (Left) */}
          <button
            onClick={() => setShowManage(true)}
            className={`flex-none flex items-center justify-center rounded-2xl h-12 w-12 transition-all ${
              !hasHabits
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 border border-primary/60 animate-pulse-subtle"
                : "glass text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <ListPlus className="h-[22px] w-[22px]" />
          </button>

          {/* Reset (Middle-left) */}
          <button
            onClick={onReset}
            disabled={saving}
            className="flex-none flex items-center justify-center glass rounded-2xl h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RotateCcw className="h-[22px] w-[22px]" />
          </button>

          {/* Save Progress (Right, fills space) */}
          <button
            onClick={handleSave}
            disabled={disabled || saving}
            className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              pulsing ? "animate-red-pulse" : ""
            }`}
          >
            <Save className="h-5 w-5" />
            {saving ? "Saving…" : "Save Progress"}
          </button>
        </div>
      </div>
    </>
  );
}
