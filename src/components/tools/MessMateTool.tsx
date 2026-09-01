import { useState, useEffect, useCallback } from "react";
import { ChefHat, RefreshCw, Wifi, Clock, AlertCircle } from "lucide-react";
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

// ── Fallback Menu Data (Full weekly NFSU Mess Schedule) ──────────────────────
const FALLBACK_MENU: DayMenu[] = [
  {
    day: "Monday",
    breakfast: [
      { name: "Poha", tags: ["Veg"] },
      { name: "Daliya", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
      { name: "Bread jam", tags: ["Veg"] },
    ],
    lunch: [
      { name: "Corn capsicum", tags: ["Veg"] },
      { name: "Sukhi bhaji", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Dahi", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
    snacks: [
      { name: "Dabeli", tags: ["Veg"] },
      { name: "Ketchup", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
    ],
    dinner: [
      { name: "Aloo gilodi", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Chaas", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
      { name: "Salad", tags: ["Veg"] },
    ],
  },
  {
    day: "Tuesday",
    breakfast: [
      { name: "Aloo paratha", tags: ["Veg"] },
      { name: "Dahi", tags: ["Veg"] },
      { name: "Daliya", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
      { name: "Bread jam", tags: ["Veg"] },
    ],
    lunch: [
      { name: "Loki chana", tags: ["Veg"] },
      { name: "Rajma", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Dahi", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
    snacks: [
      { name: "Noodles", tags: ["Veg"] },
      { name: "Ketchup", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
    ],
    dinner: [
      { name: "Hyderabadi sabji", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Chaas", tags: ["Veg"] },
      { name: "Salad", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
  },
  {
    day: "Wednesday",
    breakfast: [
      { name: "Dal pakwan", tags: ["Veg"] },
      { name: "Chutney", tags: ["Veg"] },
      { name: "Daliya", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
      { name: "Bread jam", tags: ["Veg"] },
    ],
    lunch: [
      { name: "Aloo ravaiya", tags: ["Veg"] },
      { name: "Safed choli", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Dahi", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
    snacks: [
      { name: "Methi gota", tags: ["Veg"] },
      { name: "Kadi", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
    ],
    dinner: [
      { name: "Paneer", tags: ["Veg"] },
      { name: "Dal tadka", tags: ["Veg"] },
      { name: "Jeera rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Papad", tags: ["Veg"] },
      { name: "Salad", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
      { name: "Halwa", tags: ["Veg"] },
    ],
  },
  {
    day: "Thursday",
    breakfast: [
      { name: "Methi thepla", tags: ["Veg"] },
      { name: "Daliya", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
      { name: "Bread jam", tags: ["Veg"] },
    ],
    lunch: [
      { name: "Aloo palak", tags: ["Veg"] },
      { name: "Desi chana", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Dahi", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
    snacks: [
      { name: "Pani puri", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
    ],
    dinner: [
      { name: "Dal bati", tags: ["Veg"] },
      { name: "Aloo matar sabji", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Salad", tags: ["Veg"] },
      { name: "Chaas", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
  },
  {
    day: "Friday",
    breakfast: [
      { name: "Upma", tags: ["Veg"] },
      { name: "Daliya", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
      { name: "Bread jam", tags: ["Veg"] },
    ],
    lunch: [
      { name: "Mix flower", tags: ["Veg"] },
      { name: "Safed vatana", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Dahi", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
    snacks: [
      { name: "Aloo matar sandwich", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
    ],
    dinner: [
      { name: "Chole", tags: ["Veg"] },
      { name: "Pulao", tags: ["Veg"] },
      { name: "Rayta", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
      { name: "Salad", tags: ["Veg"] },
    ],
  },
  {
    day: "Saturday",
    breakfast: [
      { name: "Veg paratha", tags: ["Veg"] },
      { name: "Daliya", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Bread jam", tags: ["Veg"] },
    ],
    lunch: [
      { name: "Cabbage matar sabji", tags: ["Veg"] },
      { name: "Mung masala", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Dahi", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
    snacks: [
      { name: "Bared pakoda", tags: ["Veg"] },
      { name: "Ketchup", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
    ],
    dinner: [
      { name: "Gilodi", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Chaas", tags: ["Veg"] },
      { name: "Salad", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
  },
  {
    day: "Sunday",
    breakfast: [
      { name: "Dosa", tags: ["Veg"] },
      { name: "Sambar", tags: ["Veg"] },
      { name: "Chutney", tags: ["Veg"] },
      { name: "Daliya", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
      { name: "Bread jam", tags: ["Veg"] },
    ],
    lunch: [
      { name: "Soyawadi", tags: ["Veg"] },
      { name: "Mix beans", tags: ["Veg"] },
      { name: "Dal", tags: ["Veg"] },
      { name: "Rice", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Dahi", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
    ],
    snacks: [
      { name: "Pani puri", tags: ["Veg"] },
      { name: "Masala", tags: ["Veg"] },
      { name: "Tea", tags: ["Veg"] },
      { name: "Coffee", tags: ["Veg"] },
      { name: "Milk", tags: ["Veg"] },
    ],
    dinner: [
      { name: "Sev tamatar", tags: ["Veg"] },
      { name: "Kadi", tags: ["Veg"] },
      { name: "Khichdi", tags: ["Veg"] },
      { name: "Roti", tags: ["Veg"] },
      { name: "Salad", tags: ["Veg"] },
      { name: "Aachar", tags: ["Veg"] },
      { name: "Chaas", tags: ["Veg"] },
    ],
  },
];

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
  const [menuData, setMenuData] = useState<DayMenu[]>(FALLBACK_MENU);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(new Date());
  const [isLive, setIsLive] = useState(true);
  const [activeMealTab, setActiveMealTab] = useState<MealKey>("breakfast");

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    let fetched = false;

    // Strategy 1: Direct fetch
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      if (res.ok) {
        const data: DayMenu[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMenuData(data);
          setIsLive(true);
          setLastFetched(new Date());
          fetched = true;
        }
      }
    } catch {
      // Direct fetch failed (likely CORS on browser client)
    }

    // Strategy 2: AllOrigins CORS proxy
    if (!fetched) {
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(API_URL)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const data: DayMenu[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMenuData(data);
            setIsLive(true);
            setLastFetched(new Date());
            fetched = true;
          }
        }
      } catch {
        // Proxy failed
      }
    }

    // Strategy 3: CorsProxy.io
    if (!fetched) {
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(API_URL)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const data: DayMenu[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMenuData(data);
            setIsLive(true);
            setLastFetched(new Date());
            fetched = true;
          }
        }
      } catch {
        // Proxy failed
      }
    }

    // Fallback: Use full built-in weekly schedule
    if (!fetched) {
      setMenuData(FALLBACK_MENU);
      setIsLive(true);
      setLastFetched(new Date());
    }
    
    setLoading(false);
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
  const todayMenu = menuData?.find(d => d.day === today) ?? FALLBACK_MENU.find(d => d.day === today);

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
    const items = todayMenu?.[mealKey] ?? [];
    const label = meals.find(m => m.key === mealKey)?.label ?? "";
    const emoji = meals.find(m => m.key === mealKey)?.emoji ?? "🍽️";

    return (
      <div className="flex flex-col gap-2 w-full">
        {loading && !todayMenu ? (
          <div className="flex items-center gap-2 animate-pulse text-xs text-muted-foreground">
            <ChefHat className="w-4 h-4 animate-spin" /> Fetching menu...
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
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400 font-semibold">Mess Menu Active</span>
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
        {loading && !todayMenu ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <ChefHat className="w-10 h-10 text-indigo-400 animate-bounce" />
            <p className="text-sm text-muted-foreground animate-pulse">Fetching fresh menu...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
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
