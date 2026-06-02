import { useAuth } from "@/contexts/useAuth";
import { useState } from "react";
import AccountCenter from "./AccountCenter";
import StreakWindow from "./StreakWindow";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStats } from "@/hooks/useUserStats";
import { Home, ClipboardList } from "lucide-react";

interface NavbarProps {
  desktopTab?: "dash" | "tasks";
  onDesktopTabChange?: (tab: "dash" | "tasks") => void;
}

export default function Navbar({ desktopTab, onDesktopTabChange }: NavbarProps) {
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

  const tabs: { key: "dash" | "tasks"; label: string; icon: React.ReactNode }[] = [
    { key: "dash", label: "Dash", icon: <Home className="w-4 h-4" /> },
    { key: "tasks", label: "Tasks", icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center px-1 sm:px-2 md:px-3 mt-2 sm:mt-3 md:mt-4 pointer-events-none">
        <div className="relative w-full max-w-[1060px] pointer-events-auto">
          <nav className="w-full flex items-center justify-between py-3.5 md:py-4 px-5 sm:px-6 md:px-8 glass">

            {/* Left: Brand + Stats */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Brand name — desktop only */}
              <h1 className="hidden md:block text-lg sm:text-xl font-bold tracking-tight text-foreground mr-3">
                Vicissometer
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="glass rounded-full px-3.5 py-1.5 text-base sm:text-lg font-semibold text-foreground whitespace-nowrap">
                  🪙 {stats?.coins ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => setShowStreak(true)}
                  className="glass rounded-full px-3.5 py-1.5 text-base sm:text-lg font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 transition-colors"
                >
                  🔥 {displayStreak}
                </button>
              </div>
            </div>

            {/* Centre: Dash / Tasks tabs — desktop only */}
            {onDesktopTabChange && (
              <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-0.5 p-1 glass rounded-full">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => onDesktopTabChange(tab.key)}
                      className={`
                        relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold
                        transition-all duration-300 ease-out select-none
                        ${desktopTab === tab.key
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                        }
                      `}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right: Avatar — desktop only */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              {/* Hidden on mobile — avatar is in the bottom nav instead */}
              <button
                onClick={() => setShowAccount(true)}
                className="hidden md:flex w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden hover:opacity-90 transition-opacity flex-shrink-0"
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
