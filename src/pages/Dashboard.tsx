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
import BottomActionBar from "@/components/BottomActionBar";
import ShieldShop from "@/components/ShieldShop";
import PowerUpOverlay from "@/components/PowerUpOverlay";
import LoadingScreen from "@/components/LoadingScreen";
import AccountCenter from "@/components/AccountCenter";
import AchievementToast, { AchievementType } from "@/components/AchievementToast";
import MobileBoostCards from "@/components/MobileBoostCards";
import { Home, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLiquidPhysics } from "@/hooks/useLiquidPhysics";
import { useHabits } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useUserStats";
import { useTodayLog } from "@/hooks/useDailyLogs";
import { useSaveProgress } from "@/hooks/useSaveProgress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useMidnightInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const initMissingDays = async () => {
      try {
        // @ts-ignore
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
        // @ts-ignore
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
  const [mobileTab, setMobileTab] = useState<"dash" | "tasks" | "account">("dash");

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
  const { saveProgress, resetProgress } = useSaveProgress();
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
  }, [stats?.streak, stats?.power_ups]);

  const toggleHabit = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasLocalEdits(true);
  };

  const handleSave = async () => {
    if (isTodayLocked) {
      toast.info("Today's progress is already saved.");
      return;
    }
    if (todayLogLoading) {
      toast.info("Please wait, checking today's status...");
      return;
    }
    if (statsLoading) {
      toast.info("Please wait, loading stats...");
      return;
    }
    if (!habits?.length) {
      toast.error("No habits found.");
      return;
    }
    return saveProgress(habits, completedIds, todayLog);
  };

  const handleReset = async () => {
    if (!stats || !user) return;
    setIsResetting(true);
    try {
      const success = await resetProgress(todayLog);
      if (success) {
        setCompletedIds(new Set());
        setHasLocalEdits(true);
      }
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) return <LoadingScreen message="Restoring your session…" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (isInitialLoad) return <LoadingScreen />;
  if (isResetting) return <LoadingScreen message="Resetting today's progress..." />;

  const isDash = mobileTab === "dash";
  const isTasks = mobileTab === "tasks";
  const isAccount = mobileTab === "account";

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

      <div key={sunriseKey} className="page-sunrise relative z-10 flex flex-col min-h-screen pt-4 md:pt-24">
        <Navbar />

        {/* ── Greeting ── */}
        <div className="hidden md:block">
          <Greeting />
        </div>
        {isDash && (
          <div className="md:hidden">
            <Greeting />
          </div>
        )}

        <div className="flex-1 px-4 sm:px-6 pb-4 md:pb-6 mt-2">
          <div className="mx-auto w-full max-w-[860px] md:grid md:grid-cols-2 md:gap-4">

            {/* ══════════ MOBILE ══════════ */}
            <div className="space-y-4 md:hidden pb-32">

              {/* Dash tab */}
              {isDash && (
                <>
                  <GrowthGraph />
                  <JourneyInsights />
                  <OutcomeCards />
                </>
              )}

              {/* Tasks tab */}
              {isTasks && (
                <>
                  {/* Shield + Power-Up quick-access row */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowShields(true)}
                      className="glass rounded-2xl p-3 flex items-center gap-3 active:scale-95 transition-all shadow-md"
                    >
                      <span className="text-3xl leading-none">🛡️</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Shields</p>
                        <p className="text-xl font-black text-foreground">{stats?.shields ?? 0}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPowerUps(true)}
                      className="glass rounded-2xl p-3 flex items-center gap-3 active:scale-95 transition-all shadow-md"
                    >
                      <span className="text-3xl leading-none">⚡</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Power-Ups</p>
                        <p className="text-xl font-black text-foreground">{stats?.power_ups ?? 0}</p>
                      </div>
                    </button>
                  </div>

                  <HabitList completedIds={completedIds} onToggle={toggleHabit} viewOnly={false} />

                  <BottomActionBar
                    onSave={handleSave}
                    onReset={handleReset}
                    disabled={!habits?.length || statsLoading || todayLogLoading || !!statsError || isTodayLocked}
                    hasHabits={!!habits?.length}
                  />
                </>
              )}

              {/* Account tab */}
              {isAccount && <AccountCenter isEmbedded={true} />}
            </div>

            {/* ══════════ DESKTOP ══════════ */}
            {/* Left column */}
            <div className="hidden md:block space-y-2">
              <HabitList completedIds={completedIds} onToggle={toggleHabit} viewOnly={false} />
              <BottomActionBar
                onSave={handleSave}
                onReset={handleReset}
                disabled={!habits?.length || statsLoading || todayLogLoading || !!statsError || isTodayLocked}
                hasHabits={!!habits?.length}
              />
              <MobileBoostCards />
            </div>

            {/* Right column */}
            <div className="hidden md:block space-y-2">
              <GrowthGraph />
              <JourneyInsights />
              <OutcomeCards />
            </div>
          </div>

          {/* Footer — pushed above bottom nav with enough margin */}
          <div className="mt-3 mb-24 md:mb-2 flex flex-col items-center justify-center opacity-60 transition-opacity hover:opacity-100">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              Made with <span className="text-red-500 hover:scale-110 transition-transform duration-300">❤️</span> by{" "}
              <a href="https://linktr.ee/vicisssyntrx" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                Viciss Syntrx
              </a>
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-1 tracking-widest font-mono uppercase">
              Vicissometer v0.0.2.6_6.2
            </p>
          </div>
        </div>
      </div>

      {/* ── Floating Mobile Tab Bar ─────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[400px]">
        <div className="flex items-stretch rounded-[22px] overflow-hidden floating-nav-pill w-full">
          {/* Tab 1: Dash */}
          <button
            onClick={() => setMobileTab("dash")}
            className="tg-tab flex-1 select-none py-2"
          >
            <div className={`tg-tab-icon-wrap ${isDash ? "tg-tab-active" : ""}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className={`tg-tab-label ${isDash ? "tg-label-active" : ""}`}>Dash</span>
          </button>

          {/* Tab 2: Tasks */}
          <button
            onClick={() => setMobileTab("tasks")}
            className="tg-tab flex-1 select-none py-2"
          >
            <div className={`tg-tab-icon-wrap ${isTasks ? "tg-tab-active" : ""}`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className={`tg-tab-label ${isTasks ? "tg-label-active" : ""}`}>Tasks</span>
          </button>

          {/* Tab 3: Profile */}
          <button
            onClick={() => setMobileTab("account")}
            className="tg-tab flex-1 select-none py-2"
          >
            <div className={`tg-tab-icon-wrap ${isAccount ? "tg-tab-active" : ""}`}>
              <Avatar className="w-6 h-6 border border-primary/40">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                <AvatarFallback className="text-primary font-semibold text-[10px] bg-primary/20">{initial}</AvatarFallback>
              </Avatar>
            </div>
            <span className={`tg-tab-label ${isAccount ? "tg-label-active" : ""}`}>Profile</span>
          </button>
        </div>
      </div>

    </div>
  );
}
