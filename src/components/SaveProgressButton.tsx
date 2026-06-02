import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useState } from "react";

interface Props {
  onSave: () => Promise<boolean | undefined>;
  locked: boolean;
  disabled: boolean;
}

export default function SaveProgressButton({ onSave, locked, disabled }: Props) {
  const [saving, setSaving] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const handle = async () => {
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

  if (locked) {
    return (
      <div className="glass rounded-xl p-3.5 text-center text-muted-foreground text-base">
        ✅ Today's progress is saved and locked
      </div>
    );
  }

  return (
    <Button
      onClick={handle}
      disabled={disabled || locked || saving}
      className={`w-full h-14 rounded-[1.25rem] flex items-center justify-center font-bold text-lg transition-all duration-300 relative overflow-hidden ${
        locked
          ? "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
          : "bg-[#15803d] hover:bg-[#166534] text-white shadow-[0_8px_32px_rgba(21,128,61,0.4)]"
      } ${pulsing ? "scale-[1.02]" : ""}`}
    >
      <Save className="h-5 w-5 mr-2" />
      {saving ? "Saving..." : "Save Progress"}
    </Button>
  );
}
