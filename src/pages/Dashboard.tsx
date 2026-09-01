/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/useAuth";
import { Navigate } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";
import LightLeakBackground from "@/components/LightLeakBackground";
import Navbar from "@/components/Navbar";
import Greeting from "@/components/Greeting";
import HabitList from "@/components/HabitList";
import OutcomeCards from "@/components/OutcomeCards";
import GrowthGraph from "@/components/GrowthGraph";
import JourneyInsights from "@/components/JourneyInsights";
import FloatingManageHabitsButton from "@/components/FloatingManageHabitsButton";
import ShieldShop from "@/components/ShieldShop";
import PowerUpOverlay from "@/components/PowerUpOverlay";
import LoadingScreen from "@/components/LoadingScreen";
import AccountCenter from "@/components/AccountCenter";
import AchievementToast, { AchievementType } from "@/components/AchievementToast";
import MobileBoostCards from "@/components/MobileBoostCards";
import RabbitAssistant from "@/components/RabbitAssistant";
import AIChatbot from "@/components/AIChatbot";
import ToolsHub from "@/components/tools/ToolsHub";
import { Home, ClipboardList, Shield, Zap, Sparkles, Monitor, LayoutGrid } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLiquidPhysics } from "@/hooks/useLiquidPhysics";
import { useHabits } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useUserStats";
import { useTodayLog } from "@/hooks/useDailyLogs";
import { useSaveProgress } from "@/hooks/useSaveProgress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function useMidnightInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const initMissingDays = async () => {
      try {
        // @ts-expect-error - RPC call definition missing in types
        await supabase.rpc('finalize_missed_days');
        queryClient.invalidateQueries({ queryKey: ["user_stats"] });
        queryClient.invalidateQueries({ queryKey: ["daily_logs"] });
      } catch (e) {
        console.warn('[init] finalize_missed_days failed:', e);
      }
    };
    initMissingDays();

    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime() -
      now.getTime();

    const timer = setTimeout(async () => {
      try {
        // @ts-expect-error - RPC call definition missing in types
        await supabase.rpc('finalize_missed_days');
      } catch (e) {
        console.warn('[midnight] finalize_missed_days failed:', e);
      }
      queryClient.invalidateQueries();
    }, msUntilMidnight + 1000);

    return () => clearTimeout(timer);
  }, [queryClient]);
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [mobileTab, setMobileTab] = useState<"dash" | "tasks" | "chat" | "account" | "edits" | "tools">(() => {
    return (localStorage.getItem("viciss-mobile-tab") as any) || "tasks";
  });
  const [desktopView, setDesktopView] = useState<"dash" | "edits">("dash");

  useEffect(() => {
    localStorage.setItem("viciss-mobile-tab", mobileTab);
  }, [mobileTab]);

  // Theme state and MutationObserver to sync theme with edits tracker iframe
  const [initialTheme] = useState(() => document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Send real-time theme updates to edits tracker iframe via postMessage
  useEffect(() => {
    const iframes = document.querySelectorAll("iframe[title='Viciss Edits Tracker']");
    iframes.forEach((iframe) => {
      const win = (iframe as HTMLIFrameElement).contentWindow;
      if (win) {
        win.postMessage({ type: "viciss-theme-change", theme: isDark ? "dark" : "light" }, "*");
      }
    });
  }, [isDark]);

  const iframeSrc = `https://viciss-edits-tracker.vercel.app/?theme=${initialTheme}`;

  useEffect(() => {
    setIframeLoading(true);
  }, [mobileTab, desktopView]);

  useEffect(() => {
    const handleOpenEdits = () => {
      setDesktopView("edits");
      setMobileTab("edits");
    };
    const handleGoToDash = () => {
      setDesktopView("dash");
      setMobileTab("dash");
    };
    window.addEventListener("open-edits-tracker", handleOpenEdits);
    window.addEventListener("go-to-dash", handleGoToDash);
    return () => {
      window.removeEventListener("open-edits-tracker", handleOpenEdits);
      window.removeEventListener("go-to-dash", handleGoToDash);
    };
  }, []);

  // Achievement animation queue
  const [achievementQueue, setAchievementQueue] = useState<AchievementType[]>([]);
  const pushAchievement = (a: AchievementType) =>
    setAchievementQueue((q) => [...q, a]);
  const dismissAchievement = () =>
    setAchievementQueue((q) => q.slice(1));

  // Track previous streak to detect new streak increments
  const prevStreakRef = useRef<number | null>(null);
  const prevPowerUpsRef = useRef<number | null>(null);

  // Fetch profile for avatar in bottom nav
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

  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ||
    null;
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initial = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  useLiquidPhysics();
  const { data: habits, isLoading: habitsLoading, isFetched: habitsFetched } = useHabits();
  const { data: stats, isLoading: statsLoading, error: statsError } = useUserStats();
  const { data: todayLog, isLoading: todayLogLoading } = useTodayLog(habitsFetched);
  const { saveProgress } = useSaveProgress();
  const [isResetting, setIsResetting] = useState(false);
  const [showShields, setShowShields] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  useMidnightInvalidation();

  const queriesLoading = habitsLoading || statsLoading;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const isInitialLoad = queriesLoading && !timedOut;

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  const completedHabitsArr = (todayLog?.completed_habits || []) as string[];
  const completedIdsMatch = completedIds.size === completedHabitsArr.length &&
    completedHabitsArr.every((id: string) => completedIds.has(id));

  const isTodayLocked = !!todayLog?.locked && habits?.length === todayLog?.total_count && completedIdsMatch;

  useEffect(() => {
    if (hasLocalEdits) return;
    if (todayLog?.completed_habits) setCompletedIds(new Set(todayLog.completed_habits));
    else if (todayLog === null) setCompletedIds(new Set());
  }, [todayLog, hasLocalEdits]);

  // ── Detect streak increase → queue celebration ─────────────────────────────
  useEffect(() => {
    if (!stats) return;
    const currentStreak = stats.streak ?? 0;
    const currentPowerUps = stats.power_ups ?? 0;

    // Only fire when streak actually increases (not on first load)
    if (prevStreakRef.current !== null && currentStreak > prevStreakRef.current) {
      // Always show streak animation
      pushAchievement({ kind: "streak", streak: currentStreak });

      // If newly crossed a 7-day multiple AND power-ups increased → bonus animation
      if (
        currentStreak > 0 &&
        currentStreak % 7 === 0 &&
        prevPowerUpsRef.current !== null &&
        currentPowerUps > prevPowerUpsRef.current
      ) {
        pushAchievement({ kind: "powerup_earned", powerUps: currentPowerUps });
      }
    }

    prevStreakRef.current = currentStreak;
    prevPowerUpsRef.current = currentPowerUps;
  }, [stats, stats?.streak, stats?.power_ups]);

  const toggleHabit = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasLocalEdits(true);
  };

  // Auto-save logic
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only auto-save if we actually made local edits
    if (!hasLocalEdits) return;
    if (!habits?.length) return;
    if (statsLoading || todayLogLoading) return;

    const timer = setTimeout(async () => {
      // Auto save after 600ms of inactivity to prevent spam.
      // Capture the exact state we are saving
      const idsBeingSaved = new Set(completedIds);
      
      // Pass silent = true to avoid success toast spam, unless it's a perfect day
      await saveProgress(habits, idsBeingSaved, todayLog, undefined, true);
      
      // Only clear the local edits flag if the user hasn't toggled anything else while saving
      setCompletedIds((currentIds) => {
        const isSame = currentIds.size === idsBeingSaved.size && 
          [...currentIds].every(id => idsBeingSaved.has(id));
        
        if (isSame) {
          setHasLocalEdits(false);
        }
        return currentIds;
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [completedIds, hasLocalEdits, habits, todayLog, statsLoading, todayLogLoading, saveProgress]);

  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true);
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenChat);
  }, []);

  // ── Sunrise animation: replay on mount + every time tab becomes visible ──
  const [sunriseKey, setSunriseKey] = useState(0);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setSunriseKey((k) => k + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  if (loading) return <LoadingScreen message="Restoring your session…" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (isInitialLoad) return <LoadingScreen />;
  if (isResetting) return <LoadingScreen message="Resetting today's progress..." />;

  const isDash = mobileTab === "dash";
  const isTasks = mobileTab === "tasks";
  const isTools = mobileTab === "tools";
  const isChat = mobileTab === "chat";
  const isAccount = mobileTab === "account";
  const isEdits = mobileTab === "edits";

  return (
    <div className="relative min-h-screen">
      <LightLeakBackground />
      <ParticleBackground />

      {/* Achievement animations — always rendered on top */}
      <AchievementToast queue={achievementQueue} onDismiss={dismissAchievement} />

      {/* ShieldShop / PowerUpOverlay modals */}
      {showShields && (
        <ShieldShop
          onClose={() => setShowShields(false)}
          onPurchased={() => pushAchievement({ kind: "shield_purchased" })}
        />
      )}
      {showPowerUps && (
        <PowerUpOverlay
          onClose={() => setShowPowerUps(false)}
          onPurchased={() => pushAchievement({ kind: "powerup_purchased" })}
        />
      )}

      <Navbar />
      <div key={sunriseKey} className="page-sunrise relative z-10 flex flex-col min-h-screen pt-[4.5rem] md:pt-[5.5rem]">

        {/* ── Greeting ── */}
        {desktopView === "dash" && (
          <div className="hidden md:block">
            <Greeting />
          </div>
        )}
        {isDash && (
          <div className="md:hidden">
            <Greeting />
          </div>
        )}

        <div className="flex-1 px-4 sm:px-6 pb-4 md:pb-6 mt-2">
          <div className={`mx-auto w-full md:grid md:grid-cols-[1fr_1.18fr_1fr] md:gap-6 ${desktopView === "edits" ? "max-w-[1250px]" : "max-w-[1180px]"}`}>

            {/* ══════════ MOBILE ══════════ */}
            <div 
              key={mobileTab} 
              className={cn(
                "md:hidden animate-in fade-in slide-in-from-bottom-6 duration-300 ease-out w-full max-w-full",
                (isChat || isEdits || isTools) ? "h-[calc(100vh-175px)] pb-4 overflow-hidden" : "space-y-4 pb-32"
              )}
            >
              {/* ── Dash tab ── */}
              {isDash && (
                <>
                  <GrowthGraph activeTab={mobileTab} />
                  <JourneyInsights activeTab={mobileTab} />
                  
                  <OutcomeCards />
                  
                  {/* Shield + Power-Up quick-access row below outcomes */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowShields(true)}
                      className="glass rounded-2xl py-4 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                    >
                      <Shield className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Shields</p>
                      <p className="text-2xl font-black text-foreground leading-none">{stats?.shields ?? 0}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPowerUps(true)}
                      className="glass rounded-2xl py-4 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                    >
                      <Zap className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Power-Ups</p>
                      <p className="text-2xl font-black text-foreground leading-none">{stats?.power_ups ?? 0}</p>
                    </button>
                  </div>
                </>
              )}

              {/* Tasks tab */}
              {isTasks && (
                <div className="px-2 pb-32">
                  <HabitList completedIds={completedIds} onToggle={toggleHabit} viewOnly={false} />
                </div>
              )}

              {/* Rabbit AI Chat tab */}
              {isChat && (
                <div className="h-[calc(100vh-175px)] overflow-hidden">
                  <AIChatbot isModal={false} />
                </div>
              )}

              {/* Account tab */}
              {isAccount && <AccountCenter isEmbedded={true} />}

              {/* Tools tab */}
              {isTools && (
                <div className="h-[calc(100vh-175px)] overflow-y-auto no-scrollbar pb-32">
                  <ToolsHub isMobile={true} />
                </div>
              )}
            </div>

            {/* ══════════ DESKTOP ══════════ */}
            {desktopView === "dash" ? (
              <>
                {/* Left column */}
                <div className="hidden md:block space-y-2">
                  <HabitList completedIds={completedIds} onToggle={toggleHabit} viewOnly={false} />
                </div>

                {/* Middle column */}
                <div className="hidden md:block space-y-2">
                  <GrowthGraph activeTab="dash" />
                  <JourneyInsights activeTab="dash" />
                  <OutcomeCards />
                </div>

                {/* Right column */}
                <div className="hidden md:block space-y-2">
                  <ToolsHub isMobile={false} />
                </div>
              </>
            ) : (
              <div className="hidden md:block md:col-span-3 space-y-3 mt-2 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setDesktopView("dash")}
                    className="glass rounded-xl px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Home className="w-4 h-4 text-primary" /> Back to Dashboard
                  </button>
                </div>
                <div className="relative h-[calc(100vh-170px)]">
                  <iframe 
                    src={iframeSrc} 
                    className="w-full h-full border-0 rounded-xl shadow-lg" 
                    title="Viciss Edits Tracker" 
                    onLoad={() => setIframeLoading(false)}
                  />
                  {iframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md rounded-xl z-20 animate-in fade-in duration-300">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="mt-4 text-sm font-semibold text-muted-foreground animate-pulse uppercase tracking-wider">Loading Studio Workspace...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer — desktop only */}
          <div className="hidden md:flex mt-4 mb-2 flex-col items-center justify-center opacity-60 transition-opacity hover:opacity-100 gap-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              Made with <span className="text-red-500 hover:scale-110 transition-transform duration-300">❤️</span> by{" "}
              <a href="https://linktr.ee/vicisssyntrx" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                Viciss Syntrx
              </a>
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono tracking-widest uppercase">v0.0.2.6.8.23</p>
          </div>
        </div>
      </div>

      {/* ── Floating Mobile Tab Bar (5 Tabs with Center Rabbit AI) ─────────────────────────── */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[370px]">
        <div className="flex items-stretch rounded-full overflow-hidden floating-nav-pill w-full px-1 py-0.5 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.6)] border border-white/10">
          {/* Tab 1: Dash */}
          <button
            onClick={() => setMobileTab("dash")}
            className="tg-tab flex-1 select-none py-1.5"
          >
            <div className={`tg-tab-icon-wrap ${isDash ? "tg-tab-active" : ""}`}>
              <Home className="w-5.5 h-5.5" />
            </div>
            <span className={`tg-tab-label ${isDash ? "tg-label-active" : ""}`}>Dash</span>
          </button>

          {/* Tab 2: Tasks */}
          <button
            onClick={() => setMobileTab("tasks")}
            className="tg-tab flex-1 select-none py-1.5"
          >
            <div className={`tg-tab-icon-wrap ${isTasks ? "tg-tab-active" : ""}`}>
              <ClipboardList className="w-5.5 h-5.5" />
            </div>
            <span className={`tg-tab-label ${isTasks ? "tg-label-active" : ""}`}>Tasks</span>
          </button>

          {/* Tab 3: Rabbit AI (Centre) */}
          <button
            onClick={() => setMobileTab("chat")}
            className="tg-tab flex-1 select-none py-1.5"
          >
            <div className={`tg-tab-icon-wrap ${isChat ? "tg-tab-active" : ""}`}>
              <Sparkles className="w-5.5 h-5.5 text-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.6)]" />
            </div>
            <span className={`tg-tab-label ${isChat ? "tg-label-active" : ""}`}>Rabbit AI</span>
          </button>

          {/* Tab 4: Tools */}
          <button
            onClick={() => setMobileTab("tools")}
            className="tg-tab flex-1 select-none py-1.5"
          >
            <div className={`tg-tab-icon-wrap ${isTools ? "tg-tab-active" : ""}`}>
              <LayoutGrid className="w-5.5 h-5.5" />
            </div>
            <span className={`tg-tab-label ${isTools ? "tg-label-active" : ""}`}>Tools</span>
          </button>

          {/* Tab 5: Profile */}
          <button
            onClick={() => setMobileTab("account")}
            className="tg-tab flex-1 select-none py-1.5"
          >
            <div className={`tg-tab-icon-wrap ${isAccount ? "tg-tab-active" : ""}`}>
              <Avatar className="h-[24px] w-[24px] border border-primary/40 shrink-0">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" className="object-cover rounded-full h-full w-full" /> : null}
                <AvatarFallback className="text-primary font-bold text-[9px] bg-primary/20 flex items-center justify-center rounded-full w-full h-full">{initial}</AvatarFallback>
              </Avatar>
            </div>
            <span className={`tg-tab-label ${isAccount ? "tg-label-active" : ""}`}>Profile</span>
          </button>
        </div>
      </div>

      <AIChatbot isModal={true} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      {isTasks && <FloatingManageHabitsButton />}
    </div>
  );
}
