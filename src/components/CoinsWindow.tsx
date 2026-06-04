import { X, Coins, Shield } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface Props { 
  onClose: () => void;
  onOpenShieldShop: () => void;
}

export default function CoinsWindow({ onClose, onOpenShieldShop }: Props) {
  const { data: stats } = useUserStats();

  const handleOpenShieldShop = () => {
    onClose();
    onOpenShieldShop();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div 
        className="glass w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar */}
        <div className="sm:hidden w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            Your Coins
          </h2>
          <button onClick={onClose} className="popup-close"><X className="h-4 w-4" /></button>
        </div>
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)] border border-yellow-500/30">
              <Coins className="w-12 h-12 text-[#fbbf24] drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            </div>
          </div>
          <p className="text-5xl font-black text-foreground drop-shadow-md">
            {stats?.coins || 0}
          </p>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mt-2">Available Coins</p>
        </div>

        <div className="space-y-3">
          <Button 
            type="button" 
            onClick={handleOpenShieldShop} 
            className="w-full h-14 text-base font-bold bg-primary text-primary-foreground flex items-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Open Shield Shop
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
