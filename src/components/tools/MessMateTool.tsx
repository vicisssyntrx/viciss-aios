import { useState, useEffect, useCallback } from "react";
import { ChefHat, RefreshCw, Wifi, WifiOff, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Meal time windows ────────────────────────────────────────────────────────
const MEAL_WINDOWS = [
  { key: "breakfast", label: "Breakfast", emoji: "🍳", start: 7 * 60,      end: 10 * 60 },
  { key: "lunch",     label: "Lunch",     emoji: "🍛", start: 12 * 60,     end: 15 * 60 },
  { key: "snacks",    label: "Snacks",    emoji: "🥪", start: 17 * 60,     end: 18 * 60 + 30 },
  { key: "dinner",    label: "Dinner",    emoji: "🌙", start: 19 * 60 + 30, end: 22 * 60 },
] as const;
type MealKey = "breakfast" | "lunch" | "snacks" | "dinner";

type MenuItem = { name: string; tags: string[] };
type DayMenu = {
  day: string;
  breakfast: MenuItem[];
  lunch: MenuItem[];
  snacks: MenuItem[];
  dinner: MenuItem[];
};

function getCurrentMealKey(): MealKey | null {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const w of MEAL_WINDOWS) {
    if (mins >= w.start && mins < w.end) return w.key as MealKey;
  }
  return null;
}

function getNextMealKey(): { key: MealKey; label: string; emoji: string; startsAt: string } | null {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const w of MEAL_WINDOWS) {
    if (mins < w.start) {
      const h = Math.floor(w.start / 60);
      const m = w.start % 60;
      return {
        key: w.key as MealKey,
        label: w.label,
        emoji: w.emoji,
        startsAt: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      };
    }
  }
  return null;
}

function getTodayDayName(): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
}

const API_URL = "https://nfsu-mess-mate.vercel.app/api/menu";

interface Props {
  compact?: boolean;
}

export default function MessMateTool({ compact = false }: Props) {
  const [menuData, setMenuData] = useState<DayMenu[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [activeMealTab, setActiveMealTab] = useState<MealKey>("breakfast");

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DayMenu[] = await res.json();
      setMenuData(data);
      setIsLive(true);
      setLastFetched(new Date());
    } catch (e) {
      console.error("Mess Mate fetch error:", e);
      setError("Could not connect. Showing offline menu.");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchMenu, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMenu]);

  // Set initial meal tab to current meal or next meal
  useEffect(() => {
    const cur = getCurrentMealKey();
    if (cur) {
      setActiveMealTab(cur);
    } else {
      const nxt = getNextMealKey();
      if (nxt) setActiveMealTab(nxt.key);
    }
  }, []);

  const today = getTodayDayName();
  const todayMenu = menuData?.find(d => d.day === today) ?? null;

  const currentMeal = getCurrentMealKey();
  const nextMeal = getNextMealKey();

  const meals: { key: MealKey; label: string; emoji: string }[] = [
    { key: "breakfast", label: "Breakfast", emoji: "🍳" },
    { key: "lunch", label: "Lunch", emoji: "🍛" },
    { key: "snacks", label: "Snacks", emoji: "🥪" },
    { key: "dinner", label: "Dinner", emoji: "🌙" },
  ];

  // ── Compact preview card ─────────────────────────────────────────────────
  if (compact) {
    const mealKey = currentMeal ?? nextMeal?.key ?? "lunch";
    const meal = MEAL_WINDOWS.find(m => m.key === mealKey);
    const items = todayMenu?.[mealKey] ?? [];
    const label = meals.find(m => m.key === mealKey)?.label ?? "";
    const emoji = meals.find(m => m.key === mealKey)?.emoji ?? "🍽️";

    return (
      <div className="flex flex-col gap-2 w-full">
        {loading ? (
          <div className="flex items-center gap-2 animate-pulse text-xs text-muted-foreground">
            <ChefHat className="w-4 h-4 animate-spin" /> Fetching menu...
          </div>
        ) : error ? (
          <div className="flex items-center gap-1.5 text-xs text-destructive/80">
            <WifiOff className="w-3.5 h-3.5" /> Offline
          </div>
        ) : items.length === 0 ? (
          <span className="text-xs text-muted-foreground">No data for today</span>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{emoji}</span>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{label}</span>
              {currentMeal ? (
                <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">Now Serving</span>
              ) : nextMeal ? (
                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">Next at {nextMeal.startsAt}</span>
              ) : null}
            </div>
            <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2">
              {items.map(i => i.name.trim()).join(" · ")}
            </p>
          </>
        )}
      </div>
    );
  }

  // ── Full tool view ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">NFSU Mess Mate</h2>
            <div className="flex items-center gap-1.5">
              {isLive ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-400 font-semibold">Live Menu</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-destructive" />
                  <span className="text-[10px] text-destructive font-semibold">Offline</span>
                </>
              )}
              {lastFetched && (
                <span className="text-[9px] text-muted-foreground/60 ml-1">
                  · {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={fetchMenu}
          disabled={loading}
          className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4 text-foreground", loading && "animate-spin")} />
        </button>
      </div>

      {/* Today label */}
      <div className="flex items-center justify-between mb-3 flex-none">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{today}'s Menu</span>
        </div>
        {currentMeal ? (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold animate-pulse">
            🍽️ Serving Now
          </span>
        ) : nextMeal ? (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
            Next: {nextMeal.emoji} {nextMeal.label} at {nextMeal.startsAt}
          </span>
        ) : (
          <span className="text-[10px] bg-secondary/50 text-muted-foreground px-2 py-1 rounded-full font-semibold">
            Mess closed for today
          </span>
        )}
      </div>

      {/* Meal Tabs */}
      <div className="flex bg-secondary/30 rounded-xl p-1 mb-4 gap-1 flex-none">
        {meals.map(meal => (
          <button
            key={meal.key}
            onClick={() => setActiveMealTab(meal.key)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 flex flex-col items-center gap-0.5",
              activeMealTab === meal.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              currentMeal === meal.key && activeMealTab !== meal.key && "ring-1 ring-green-400/50"
            )}
          >
            <span className="text-sm">{meal.emoji}</span>
            <span className="hidden sm:block">{meal.label}</span>
          </button>
        ))}
      </div>

      {/* Meal Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <ChefHat className="w-10 h-10 text-indigo-400 animate-bounce" />
            <p className="text-sm text-muted-foreground animate-pulse">Fetching fresh menu...</p>
          </div>
        ) : error && !menuData ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <AlertCircle className="w-8 h-8 text-destructive/60" />
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            {error && (
              <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                {error}
              </div>
            )}
            
            {todayMenu ? (
              <div className="space-y-2">
                {(todayMenu[activeMealTab] || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/20 hover:bg-secondary/50 transition-colors animate-in fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <span className="text-lg">
                      {item.tags.includes("Non-Veg") ? "🍖" : "🟢"}
                    </span>
                    <span className="text-sm font-medium text-foreground">{item.name.trim()}</span>
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className={cn(
                          "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                          tag === "Non-Veg"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ))}

                {(todayMenu[activeMealTab] || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <span className="text-4xl block mb-3">🍽️</span>
                    <p className="text-sm">No items listed for this meal</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <span className="text-4xl block mb-3">📅</span>
                <p className="text-sm">No menu data for {today}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
