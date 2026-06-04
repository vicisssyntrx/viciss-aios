import { useAuth } from "@/contexts/useAuth";
import { useState } from "react";
import AccountCenter from "./AccountCenter";
import StreakWindow from "./StreakWindow";
import CoinsWindow from "./CoinsWindow";
import ShieldShop from "./ShieldShop";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStats } from "@/hooks/useUserStats";
import { Home, ClipboardList, Coins, Flame, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const { data: stats } = useUserStats();
  const [showAccount, setShowAccount] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showShieldShop, setShowShieldShop] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ||
    null;
  const initial = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";
  const displayStreak = stats?.streak || 0;

  return (
    <>
      {/* ── Mobile: sticky glass navbar — always visible ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-3 pt-3 pb-1">
        <nav className="w-full flex items-center justify-between py-3 px-5 glass !transform-none pointer-events-auto">
          <h1 className="text-lg font-bold tracking-tight text-foreground ml-1">
            Vicissometer
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCoins(true)}
              className="glass !transform-none rounded-full px-3 py-1 text-sm font-semibold text-foreground whitespace-nowrap flex items-center gap-1.5 hover:bg-secondary/60 active:scale-95 transition-all"
            >
              <Coins className="w-3.5 h-3.5 text-[#fbbf24] drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" /> {stats?.coins ?? 0}
            </button>
            <button
              type="button"
              onClick={() => setShowStreak(true)}
              className="glass !transform-none rounded-full px-3 py-1 text-sm font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-[#f97316] drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]" /> {displayStreak}
            </button>
          </div>
        </nav>
      </div>

      {/* ── Desktop: full glass navbar ── */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-40 justify-center px-3 mt-4 pointer-events-none">
        <div className="relative w-full max-w-[1060px] pointer-events-auto">
          <nav className="w-full flex items-center justify-between py-4 px-8 glass !transform-none !shadow-[0_12px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08),inset_1px_1px_0px_rgba(255,255,255,0.8),inset_-1px_-1px_0px_rgba(0,0,0,0.04)] dark:!shadow-[0_8px_32px_rgba(0,0,0,0.07),inset_1px_1px_0px_rgba(255,255,255,0.05),inset_-1px_-1px_0px_rgba(0,0,0,0.2)] dark:border dark:border-white/10">

            {/* Left: Brand */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Vicissometer
              </h1>
            </div>

            {/* Right: Stats & Avatar */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCoins(true)}
                  className="glass !transform-none rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap flex items-center gap-2 hover:bg-secondary/60 transition-colors"
                >
                  <Coins className="w-4 h-4 text-[#fbbf24] drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" /> {stats?.coins ?? 0}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStreak(true)}
                  className="glass !transform-none rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 transition-colors flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-[#f97316] drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]" /> {displayStreak}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("open-ai-chat"))}
                  className="glass !transform-none rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap flex items-center gap-2 hover:bg-secondary/60 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-foreground" /> AI
                </button>

                <button
                  onClick={() => setShowAccount(true)}
                  className="w-10 h-10 rounded-full overflow-hidden hover:opacity-90 transition-opacity flex-shrink-0"
                >
                <Avatar className="h-full w-full border border-primary/40 bg-primary/20">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                  <AvatarFallback className="text-primary font-semibold text-sm">{initial}</AvatarFallback>
                </Avatar>
              </button>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
      {showAccount && <AccountCenter onClose={() => setShowAccount(false)} />}
      {showCoins && <CoinsWindow onClose={() => setShowCoins(false)} onOpenShieldShop={() => setShowShieldShop(true)} />}
      {showShieldShop && <ShieldShop onClose={() => setShowShieldShop(false)} />}
    </>
  );
}
