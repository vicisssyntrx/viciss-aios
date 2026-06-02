import { useState, useEffect } from "react";
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
import MobileBoostCards from "@/components/MobileBoostCards";
import ShieldShop from "@/components/ShieldShop";
import PowerUpOverlay from "@/components/PowerUpOverlay";
import LoadingScreen from "@/components/LoadingScreen";
import AccountCenter from "@/components/AccountCenter";
import { Home, ClipboardList, User } from "lucide-react";
import { useLiquidPhysics } from "@/hooks/useLiquidPhysics";
import { useHabits } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useUserStats";
import { useTodayLog } from "@/hooks/useDailyLogs";
import { useSaveProgress } from "@/hooks/useSaveProgress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useMidnightInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Run immediately on mount to process any missed days while the app was closed
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

    // 2. Setup midnight timer for the current session
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

  return (
    <div className="relative min-h-screen">
      <LightLeakBackground />
      <ParticleBackground />
      <div className="relative z-10 flex flex-col min-h-screen pt-20 sm:pt-22 md:pt-24">
        <Navbar />

        <>
          <Greeting />

          <div className="flex-1 px-5 sm:px-6 pb-4 md:pb-6 mt-2">
            <div className="mx-auto w-full max-w-[860px] md:grid md:grid-cols-2 md:gap-4">

              {/* ── Mobile flow ── */}
              <div className="space-y-4 md:hidden pb-28">
                {mobileTab === "dash" && (
                  <>
                    <GrowthGraph />
                    <JourneyInsights />
                  </>
                )}

                {mobileTab === "tasks" && (
                  <>
                    {/* Compact Shields + Power-Ups row (Tasks header) */}
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => setShowShields(true)}
                        className="glass rounded-2xl p-3 flex items-center gap-3 relative transition-all active:scale-95"
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
                        className="glass rounded-2xl p-3 flex items-center gap-3 relative transition-all active:scale-95"
                      >
                        <span className="text-3xl leading-none">⚡</span>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Power-Ups</p>
                          <p className="text-xl font-black text-foreground">{stats?.power_ups ?? 0}</p>
                        </div>
                      </button>
                    </div>

                    <HabitList
                      completedIds={completedIds}
                      onToggle={toggleHabit}
                      viewOnly={false}
                    />

                    <div className="dashboard-rise rise-delay-2">
                      <BottomActionBar
                        onSave={handleSave}
                        onReset={handleReset}
                        disabled={!habits?.length || statsLoading || todayLogLoading || !!statsError || isTodayLocked}
                        hasHabits={!!habits?.length}
                      />
                    </div>
                    <div className="dashboard-rise rise-delay-3">
                      <OutcomeCards />
                    </div>
                    <div className="dashboard-rise rise-delay-4">
                      <MobileBoostCards />
                    </div>
                  </>
                )}

                {mobileTab === "account" && (
                  <AccountCenter isEmbedded={true} />
                )}
              </div>

              {/* ShieldShop + PowerUpOverlay modals (mobile/desktop fallback) */}
              {showShields && <ShieldShop onClose={() => setShowShields(false)} />}
              {showPowerUps && <PowerUpOverlay onClose={() => setShowPowerUps(false)} />}

              {/* ── Desktop left column — Habits + Actions + Shields/Power-Ups ── */}
              <div className="hidden md:block space-y-2">
                <HabitList
                  completedIds={completedIds}
                  onToggle={toggleHabit}
                  viewOnly={false}
                />
                <BottomActionBar
                  onSave={handleSave}
                  onReset={handleReset}
                  disabled={!habits?.length || statsLoading || todayLogLoading || !!statsError || isTodayLocked}
                  hasHabits={!!habits?.length}
                />
                <MobileBoostCards />
              </div>

              {/* ── Desktop right column — Growth + Insights + Becoming ── */}
              <div className="hidden md:block space-y-2">
                <GrowthGraph />
                <JourneyInsights />
                <OutcomeCards />
              </div>
            </div>

            <div className="mt-12 mb-8 flex flex-col items-center justify-center opacity-70 transition-opacity hover:opacity-100">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                Made with <span className="text-red-500 opacity-100 hover:scale-110 transition-transform duration-300">❤️</span> by <a href="https://linktr.ee/vicisssyntrx" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Viciss Syntrx</a>
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 tracking-widest font-mono uppercase">
                Vicissometer v0.0.2.6_6.2
              </p>
            </div>
          </div>
        </>
      </div>

      {/* Floating Telegram-style Bottom Tab Bar for mobile viewports */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[290px]">
        <div className="relative bottom-nav-bar flex items-center p-0.5 bg-black/5 dark:bg-black/55 border border-black/5 dark:border-white/10 rounded-full backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Sliding Pill Background Indicator */}
          <div 
            className="absolute top-0.5 bottom-0.5 rounded-full bg-white/70 bottom-nav-pill border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-300 ease-out"
            style={{
              left: mobileTab === "dash" ? "2px" : mobileTab === "tasks" ? "calc(33.33% + 1px)" : "calc(66.66% + 1px)",
              width: "calc(33.33% - 3px)",
            }}
          />
          {/* Tab 1: Dash */}
          <button
            onClick={() => setMobileTab("dash")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 select-none ${
              mobileTab === "dash" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground/75"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dash</span>
          </button>
          {/* Tab 2: Tasks */}
          <button
            onClick={() => setMobileTab("tasks")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 select-none ${
              mobileTab === "tasks" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground/75"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Tasks</span>
          </button>
          {/* Tab 3: Account */}
          <button
            onClick={() => setMobileTab("account")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 select-none ${
              mobileTab === "account" ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground/75"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>
      </div>

    </div>
  );
}
