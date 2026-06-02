import { useAuth } from "@/contexts/useAuth";
import { useState } from "react";
import AccountCenter from "./AccountCenter";
import StreakWindow from "./StreakWindow";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStats } from "@/hooks/useUserStats";
import { Home, ClipboardList } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const { data: stats } = useUserStats();
  const [showAccount, setShowAccount] = useState(false);
  const [showStreak, setShowStreak] = useState(false);

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
      {/* ── Mobile: floating stat bubbles top-right ── */}
      <div className="md:hidden fixed top-0 right-0 z-40 flex flex-row items-center gap-2 pt-3 pr-3 pointer-events-none">
        {/* Coins bubble */}
        <span className="pointer-events-auto glass rounded-full px-3.5 py-1.5 text-sm font-semibold text-foreground whitespace-nowrap shadow-lg">
          🪙 {stats?.coins ?? 0}
        </span>
        {/* Streak bubble — tappable */}
        <button
          type="button"
          onClick={() => setShowStreak(true)}
          className="pointer-events-auto glass rounded-full px-3.5 py-1.5 text-sm font-semibold text-foreground whitespace-nowrap shadow-lg hover:bg-secondary/60 active:scale-95 transition-all"
        >
          🔥 {displayStreak}
        </button>
      </div>

      {/* ── Desktop: full glass navbar ── */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-40 justify-center px-3 mt-4 pointer-events-none">
        <div className="relative w-full max-w-[1060px] pointer-events-auto">
          <nav className="w-full flex items-center justify-between py-4 px-8 glass">

            {/* Left: Brand + Stats */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="glass rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap">
                  🪙 {stats?.coins ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => setShowStreak(true)}
                  className="glass rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 transition-colors"
                >
                  🔥 {displayStreak}
                </button>
              </div>
            </div>

            {/* Right: Avatar */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
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
          </nav>
        </div>
      </div>

      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
      {showAccount && <AccountCenter onClose={() => setShowAccount(false)} />}
    </>
  );
}
