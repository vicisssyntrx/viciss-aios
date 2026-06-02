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
import LoadingScreen from "@/components/LoadingScreen";
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

  useLiquidPhysics();
  const { data: habits, isLoading: habitsLoading, isFetched: habitsFetched } = useHabits();
  const { data: stats, isLoading: statsLoading, error: statsError } = useUserStats();
  const { data: todayLog, isLoading: todayLogLoading } = useTodayLog(habitsFetched);
  const { saveProgress, resetProgress } = useSaveProgress();
  const [isResetting, setIsResetting] = useState(false);
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
    <div className="relative min-h-screen bg-background">
      <LightLeakBackground />
      <ParticleBackground />
      <div className="relative z-10 flex flex-col min-h-screen pt-20 sm:pt-22 md:pt-24">
        <Navbar />

        <>
          <Greeting />

          <div className="flex-1 px-5 sm:px-6 pb-4 md:pb-6 mt-2">
            <div className="mx-auto w-full max-w-[860px] md:grid md:grid-cols-2 md:gap-4">

              {/* ── Mobile flow ── */}
              <div className="space-y-3 md:hidden">
                {/* Graph + Journey Insights: horizontal snap-scroll peek row */}
                <div
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1"
                  style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
                >
                  {/* Graph card — slightly narrower so Insights peeks */}
                  <div className="snap-start flex-shrink-0 w-[82vw] max-w-[340px]">
                    <GrowthGraph />
                  </div>
                  {/* Journey Insights card — peeks ~20px on the right */}
                  <div className="snap-start flex-shrink-0 w-[82vw] max-w-[340px] pr-4">
                    <JourneyInsights />
                  </div>
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
                <div className="dashboard-rise rise-delay-5">
                  <MobileBoostCards />
                </div>
              </div>

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
    </div>
  );
}
