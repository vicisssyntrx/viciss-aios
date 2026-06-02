import { useAuth } from "@/contexts/useAuth";
import { Link } from "react-router-dom";
import { Bell, LayoutDashboard, Bot, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AccountCenter from "./AccountCenter";
import StreakWindow from "./StreakWindow";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";

interface NavbarProps {
  activeTab?: "dash" | "agent" | "apps";
  setActiveTab?: (tab: "dash" | "agent" | "apps") => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { user } = useAuth();
  const { data: logs } = useDailyLogs();
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
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center px-1 sm:px-2 md:px-3 mt-2 sm:mt-3 md:mt-4 pointer-events-none">
        <div className="relative w-full max-w-[1060px] pointer-events-auto">
          <nav className="w-full flex items-center justify-between py-3.5 md:py-4 rounded-2xl px-5 sm:px-6 md:px-8"
            style={{
              position: "relative",
              background: "transparent",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "1.35rem",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 1px 1px 0px rgba(255,255,255,0.35), inset -1px -1px 0px rgba(0,0,0,0.2)",
            }}
          >
            <div className="flex items-center gap-1 flex-shrink-0">
              <h1 className="hidden sm:block text-lg sm:text-xl font-bold tracking-tight text-foreground mr-3">
                Vicissometer
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="glass rounded-full px-3.5 py-1.5 text-base sm:text-lg font-semibold text-foreground whitespace-nowrap">🪙 {stats?.coins ?? 0}</span>
                <button
                  type="button"
                  onClick={() => setShowStreak(true)}
                  className="glass rounded-full px-3.5 py-1.5 text-base sm:text-lg font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 transition-colors"
                >
                  🔥 {displayStreak}
                </button>
              </div>
            </div>
            {/* Desktop Centered Tabs with smooth liquid glass slide transition */}
            {activeTab && setActiveTab && (
              <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center p-0.5 bg-black/5 dark:bg-black/45 border border-black/5 dark:border-white/10 rounded-full w-[290px] overflow-hidden">
                {/* Smooth sliding pill backdrop */}
                <div 
                  className="absolute top-0.5 bottom-0.5 rounded-full bg-white/60 dark:bg-white/10 border border-black/5 dark:border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 ease-out"
                  style={{
                    left: activeTab === "dash" ? "2px" : activeTab === "agent" ? "calc(33.33% + 1px)" : "calc(66.66% + 1px)",
                    width: "calc(33.33% - 3px)",
                  }}
                />
                <button
                  onClick={() => setActiveTab("dash")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 select-none ${
                    activeTab === "dash" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground/75"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dash</span>
                </button>
                <button
                  onClick={() => setActiveTab("agent")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 select-none ${
                    activeTab === "agent" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground/75"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Agents</span>
                </button>
                <button
                  onClick={() => setActiveTab("apps")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 select-none ${
                    activeTab === "apps" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground/75"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Apps</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <button
                onClick={() => setShowAccount(true)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden hover:opacity-90 transition-opacity flex-shrink-0"
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
