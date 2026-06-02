import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/useAuth";
import { Navigate } from "react-router-dom";
import { LayoutDashboard, Bot, Grid } from "lucide-react";
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
import AgentDashboard from "./AgentDashboard";
import AppsDashboard from "./AppsDashboard";
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
      // Midnight: auto-apply shields to yesterday if missed/partial and shields are available
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
  const [activeTab, setActiveTab] = useState<"dash" | "agent" | "apps">("dash");
  
  useLiquidPhysics();
  const { data: habits, isLoading: habitsLoading, isFetched: habitsFetched } = useHabits();
  const { data: stats, isLoading: statsLoading, error: statsError } = useUserStats();
  // Delay today's log fetch until habits query has resolved — staggers the HTTP/2 burst
  const { data: todayLog, isLoading: todayLogLoading } = useTodayLog(habitsFetched);
  const { saveProgress, resetProgress } = useSaveProgress();
  const [isResetting, setIsResetting] = useState(false);
  useMidnightInvalidation();

  // Show a full-screen loader while the first data fetch is in flight.
  // We only wait for the absolute essentials (habits and stats) to prevent infinite loops.
  // todayLog can load in the background (graph/checkboxes will pop in).
  const queriesLoading = habitsLoading || statsLoading;
  const [timedOut, setTimedOut] = useState(false);
  
  useEffect(() => {
    // Only start the timeout once, on mount.
    const t = setTimeout(() => setTimedOut(true), 10000); // 10s safety buffer
    return () => clearTimeout(t);
  }, []);

  const isInitialLoad = queriesLoading && !timedOut;

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  
  // A day is only locked if the DB says it's locked AND the total amount of habits hasn't changed
  // AND the user hasn't toggled any existing checkboxes locally.
  const completedHabitsArr = (todayLog?.completed_habits || []) as string[];
  const completedIdsMatch = completedIds.size === completedHabitsArr.length && 
    completedHabitsArr.every((id: string) => completedIds.has(id));

  const isTodayLocked = !!todayLog?.locked && habits?.length === todayLog?.total_count && completedIdsMatch;

  // Seed local checkbox state from today's log unless user has started editing.
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
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "dash" ? (
          <>
            <Greeting />

            <div className="flex-1 px-5 sm:px-6 pb-4 md:pb-6 mt-2">
              <div className="mx-auto w-full max-w-[860px] md:grid md:grid-cols-2 md:gap-4">
                {/* Mobile flow */}
                <div className="space-y-3 md:hidden">
                  <div className="dashboard-rise rise-delay-1">
                    <GrowthGraph />
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
                    <JourneyInsights />
                  </div>
                  <div className="dashboard-rise rise-delay-5">
                    <MobileBoostCards />
                  </div>
                </div>

                {/* Desktop left column — Habits + Actions + Shields/Power-Ups */}
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

                {/* Desktop right column — Growth + Insights + Becoming */}
                <div className="hidden md:block space-y-2">
                  <GrowthGraph />
                  <JourneyInsights />
                  <OutcomeCards />
                </div>
              </div>

              <div className="mt-12 mb-24 md:mb-4 flex flex-col items-center justify-center opacity-70 transition-opacity hover:opacity-100">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  Made with <span className="text-red-500 opacity-100 hover:scale-110 transition-transform duration-300">❤️</span> by <a href="https://linktr.ee/vicisssyntrx" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Viciss Syntrx</a>
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 tracking-widest font-mono uppercase">
                  Vicissometer v0.0.2.6_6.2
                </p>
              </div>
            </div>
          </>
        ) : activeTab === "agent" ? (
          <div className="flex-1 px-5 sm:px-6 pb-4 mt-6 md:mt-8">
            <AgentDashboard />

            <div className="mt-6 mb-24 md:mb-4 flex flex-col items-center justify-center opacity-70 transition-opacity hover:opacity-100">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                Made with <span className="text-red-500 opacity-100 hover:scale-110 transition-transform duration-300">❤️</span> by <a href="https://linktr.ee/vicisssyntrx" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Viciss Syntrx</a>
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 tracking-widest font-mono uppercase">
                Vicissometer v0.0.2.6_6.2
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 px-5 sm:px-6 pb-4 mt-6 md:mt-8">
            <AppsDashboard />

            <div className="mt-6 mb-24 md:mb-4 flex flex-col items-center justify-center opacity-70 transition-opacity hover:opacity-100">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                Made with <span className="text-red-500 opacity-100 hover:scale-110 transition-transform duration-300">❤️</span> by <a href="https://linktr.ee/vicisssyntrx" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Viciss Syntrx</a>
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 tracking-widest font-mono uppercase">
                Vicissometer v0.0.2.6_6.2
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Liquid Glass Tab Bar for Mobile — pill shape with animated sliding indicator */}
      <div className="sm:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[88%] max-w-[420px]">
        <div
          className="bottom-nav-bar relative flex items-center p-1.5 rounded-full"
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            background: "rgba(0,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.22), inset 1px 1px 0px rgba(255,255,255,0.35), inset -1px -1px 0px rgba(0,0,0,0.12)",
          }}
        >
          {/* Animated sliding glass pill indicator */}
          <div
            className="bottom-nav-pill absolute top-1.5 bottom-1.5 rounded-full pointer-events-none"
            style={{
              left: activeTab === "dash" ? "6px" : activeTab === "agent" ? "calc(33.33% + 3px)" : "calc(66.66% + 3px)",
              width: "calc(33.33% - 6px)",
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              transition: "left 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />

          {/* Tab 1: Dash */}
          <button
            onClick={() => setActiveTab("dash")}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full relative z-10 transition-all duration-300 select-none ${
              activeTab === "dash" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 transition-all duration-300 ${activeTab === "dash" ? "scale-110" : "scale-100"}`} />
            <span className={`text-[10px] tracking-wide mt-0.5 font-bold transition-all duration-300 ${activeTab === "dash" ? "opacity-100" : "opacity-50"}`}>Dash</span>
          </button>

          {/* Tab 2: Agents */}
          <button
            onClick={() => setActiveTab("agent")}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full relative z-10 transition-all duration-300 select-none ${
              activeTab === "agent" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Bot className={`w-5 h-5 transition-all duration-300 ${activeTab === "agent" ? "scale-110" : "scale-100"}`} />
            <span className={`text-[10px] tracking-wide mt-0.5 font-bold transition-all duration-300 ${activeTab === "agent" ? "opacity-100" : "opacity-50"}`}>Agents</span>
          </button>

          {/* Tab 3: Apps */}
          <button
            onClick={() => setActiveTab("apps")}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full relative z-10 transition-all duration-300 select-none ${
              activeTab === "apps" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Grid className={`w-5 h-5 transition-all duration-300 ${activeTab === "apps" ? "scale-110" : "scale-100"}`} />
            <span className={`text-[10px] tracking-wide mt-0.5 font-bold transition-all duration-300 ${activeTab === "apps" ? "opacity-100" : "opacity-50"}`}>Apps</span>
          </button>
        </div>
      </div>

    </div>
  );
}
