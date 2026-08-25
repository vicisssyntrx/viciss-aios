import { useAuth } from "@/contexts/useAuth";
import { useState, useEffect, useRef } from "react";
import AccountCenter from "./AccountCenter";
import StreakWindow from "./StreakWindow";
import CoinsWindow from "./CoinsWindow";
import ShieldShop from "./ShieldShop";
import PowerUpOverlay from "./PowerUpOverlay";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationsModal from "./NotificationsModal";
import { useUserStats } from "@/hooks/useUserStats";
import { Coins, Flame, Sparkles, Bell, Monitor, Shield, Zap } from "lucide-react";

// Premium Golden Trace Animation Component
function NavbarGoldTrace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationPhase, setAnimationPhase] = useState<"drawing" | "fading" | "done">("drawing");

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const updateDimensions = () => {
      setDimensions({
        width: parent.clientWidth,
        height: parent.clientHeight,
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(parent);

    // Animation timeline
    // 2.2s drawing (steady start, extremely slow crawl at ending), then fade out
    const fadeTimer = setTimeout(() => {
      setAnimationPhase("fading");
    }, 2200);

    const doneTimer = setTimeout(() => {
      setAnimationPhase("done");
    }, 3200);

    return () => {
      observer.disconnect();
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (animationPhase === "done") return null;

  const { width: W, height: H } = dimensions;
  if (!W || !H) return <div ref={containerRef} className="absolute inset-0" />;

  const R = 21.6; // Matches glass border-radius (1.35rem * 16px)
  const S = 1.0; // Stroke offset (thin stroke)
  
  const X_start = W / 2;
  const Y_top = S / 2;
  const Y_bottom = H - S / 2;
  const Y_mid = H / 2;
  const X_left = S / 2;
  const X_right = W - S / 2;

  // Tracing paths: emerging from center top/bottom and meeting on right/left center
  const paths = [
    // Top-Right: Top-center -> right -> corner turn -> right-center
    `M ${X_start} ${Y_top} L ${X_right - R} ${Y_top} A ${R} ${R} 0 0 1 ${X_right} ${Y_top + R} L ${X_right} ${Y_mid}`,
    // Top-Left: Top-center -> left -> corner turn -> left-center
    `M ${X_start} ${Y_top} L ${X_left + R} ${Y_top} A ${R} ${R} 0 0 0 ${X_left} ${Y_top + R} L ${X_left} ${Y_mid}`,
    // Bottom-Right: Bottom-center -> right -> corner turn -> right-center
    `M ${X_start} ${Y_bottom} L ${X_right - R} ${Y_bottom} A ${R} ${R} 0 0 0 ${X_right} ${Y_bottom - R} L ${X_right} ${Y_mid}`,
    // Bottom-Left: Bottom-center -> left -> corner turn -> left-center
    `M ${X_start} ${Y_bottom} L ${X_left + R} ${Y_bottom} A ${R} ${R} 0 0 1 ${X_left} ${Y_bottom - R} L ${X_left} ${Y_mid}`,
  ];

  const L_total = (W / 2) + (H / 2) + R * (Math.PI / 2 - 2);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-50 overflow-visible"
      style={{
        opacity: animationPhase === "fading" ? 0 : 1,
        transition: "opacity 1.0s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      <svg className="w-full h-full overflow-visible">
        {paths.map((d, index) => (
          <g key={index}>
            {/* Layer 1: Very subtle reflection glow backing */}
            <path
              d={d}
              fill="none"
              stroke="#d97706"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.15}
              style={{
                filter: "blur(1px)",
                strokeDasharray: L_total,
                strokeDashoffset: L_total,
                animation: `navbar-gold-draw-${Math.round(L_total)} 2.2s cubic-bezier(0.3, 0.6, 0.0, 1.0) forwards`,
              }}
            />
            {/* Layer 2: Clean, thin, professional golden outline */}
            <path
              d={d}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={1.2}
              strokeLinecap="round"
              opacity={0.95}
              style={{
                strokeDasharray: L_total,
                strokeDashoffset: L_total,
                animation: `navbar-gold-draw-${Math.round(L_total)} 2.2s cubic-bezier(0.3, 0.6, 0.0, 1.0) forwards`,
              }}
            />
          </g>
        ))}

        {/* Left Sparkles: Tiny golden bursts at meeting point (opacity 0 initially, triggers at exactly 2.2s when lines meet) */}
        <g transform={`translate(${X_left}, ${Y_mid})`}>
          {/* Central impact friction flash */}
          <circle r={1} fill="#fffdf0" style={{ opacity: 0, filter: "blur(0.5px)", animation: "sparkle-flash 0.4s ease-out 2.2s both" }} />
          {/* Flying sparks */}
          <circle r={1.5} fill="#fbbf24" style={{ opacity: 0, animation: "sparkle-left-1 0.5s cubic-bezier(0.25, 1, 0.50, 1) 2.2s both" }} />
          <circle r={1.2} fill="#f59e0b" style={{ opacity: 0, animation: "sparkle-left-2 0.5s cubic-bezier(0.25, 1, 0.50, 1) 2.2s both" }} />
          <circle r={1.0} fill="#fffdf0" style={{ opacity: 0, animation: "sparkle-left-3 0.5s cubic-bezier(0.25, 1, 0.50, 1) 2.2s both" }} />
        </g>

        {/* Right Sparkles: Tiny golden bursts at meeting point (opacity 0 initially, triggers at exactly 2.2s when lines meet) */}
        <g transform={`translate(${X_right}, ${Y_mid})`}>
          {/* Central impact friction flash */}
          <circle r={1} fill="#fffdf0" style={{ opacity: 0, filter: "blur(0.5px)", animation: "sparkle-flash 0.4s ease-out 2.2s both" }} />
          {/* Flying sparks */}
          <circle r={1.5} fill="#fbbf24" style={{ opacity: 0, animation: "sparkle-right-1 0.5s cubic-bezier(0.25, 1, 0.50, 1) 2.2s both" }} />
          <circle r={1.2} fill="#f59e0b" style={{ opacity: 0, animation: "sparkle-right-2 0.5s cubic-bezier(0.25, 1, 0.50, 1) 2.2s both" }} />
          <circle r={1.0} fill="#fffdf0" style={{ opacity: 0, animation: "sparkle-right-3 0.5s cubic-bezier(0.25, 1, 0.50, 1) 2.2s both" }} />
        </g>
      </svg>
      <style>{`
        @keyframes navbar-gold-draw-${Math.round(L_total)} {
          from { stroke-dashoffset: ${L_total}px; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes sparkle-flash {
          0% { transform: scale(0.1); opacity: 0; }
          20% { opacity: 0.9; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes sparkle-left-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { opacity: 0.95; }
          100% { transform: translate(-14px, -8px) scale(0.1); opacity: 0; }
        }
        @keyframes sparkle-left-2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { opacity: 0.95; }
          100% { transform: translate(-16px, 4px) scale(0.1); opacity: 0; }
        }
        @keyframes sparkle-left-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { opacity: 0.95; }
          100% { transform: translate(-10px, -2px) scale(0.1); opacity: 0; }
        }
        @keyframes sparkle-right-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { opacity: 0.95; }
          100% { transform: translate(14px, -8px) scale(0.1); opacity: 0; }
        }
        @keyframes sparkle-right-2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { opacity: 0.95; }
          100% { transform: translate(16px, 4px) scale(0.1); opacity: 0; }
        }
        @keyframes sparkle-right-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          15% { opacity: 0.95; }
          100% { transform: translate(10px, -2px) scale(0.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const { data: stats } = useUserStats();
  const [showAccount, setShowAccount] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showShieldShop, setShowShieldShop] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [showRainbow, setShowRainbow] = useState(true);
  const [rainbowFade, setRainbowFade] = useState(false);

  useEffect(() => {
    const fadeTimeout = setTimeout(() => {
      setRainbowFade(true);
    }, 3500); // Start fade out after 3.5s

    const removeTimeout = setTimeout(() => {
      setShowRainbow(false);
    }, 4500); // Fully unmount after 4.5s

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  const [isFirstLoad, setIsFirstLoad] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("viciss_navbar_animated");
    }
    return false;
  });

  const mobileLogoRef = useRef<HTMLImageElement>(null);
  const desktopLogoRef = useRef<HTMLImageElement>(null);
  const [mobileLogoStyle, setMobileLogoStyle] = useState<React.CSSProperties>({});
  const [desktopLogoStyle, setDesktopLogoStyle] = useState<React.CSSProperties>({});
  const [mobileTextVisible, setMobileTextVisible] = useState(false);
  const [desktopTextVisible, setDesktopTextVisible] = useState(false);

  useEffect(() => {
    if (!isFirstLoad) {
      setMobileLogoStyle({ transform: 'none', position: 'relative', zIndex: 50 });
      setDesktopLogoStyle({ transform: 'none', position: 'relative', zIndex: 50 });
      setMobileTextVisible(true);
      setDesktopTextVisible(true);
      return;
    }

    try {
      sessionStorage.setItem("viciss_navbar_animated", "true");
    } catch (e) {
      console.error(e);
    }

    const isMobile = window.innerWidth < 768;
    const targetRef = isMobile ? mobileLogoRef : desktopLogoRef;
    const setStyle = isMobile ? setMobileLogoStyle : setDesktopLogoStyle;
    const setTextVis = isMobile ? setMobileTextVisible : setDesktopTextVisible;
    
    if (isMobile) {
      setDesktopLogoStyle({ transform: 'none', position: 'relative', zIndex: 50 });
      setDesktopTextVisible(true);
    } else {
      setMobileLogoStyle({ transform: 'none', position: 'relative', zIndex: 50 });
      setMobileTextVisible(true);
    }

    const timer = setTimeout(() => {
      const el = targetRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0) {
        setStyle({ transform: 'none', position: 'relative', zIndex: 50 });
        setTextVis(true);
        return;
      }

      const logoCenterX = rect.left + rect.width / 2;
      const logoCenterY = rect.top + rect.height / 2;

      const screenCenterX = window.innerWidth / 2;
      const screenCenterY = window.innerHeight / 2;

      const deltaX = screenCenterX - logoCenterX;
      const deltaY = screenCenterY - logoCenterY;
      const scale = 64 / rect.width;

      setStyle({
        transform: `translate(${deltaX}px, ${deltaY}px) scale(${scale})`,
        transition: 'none',
        position: 'relative',
        zIndex: 50,
      });

      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setStyle({
            transform: 'translate(0px, 0px) scale(1)',
            transition: 'transform 850ms cubic-bezier(0.19, 1, 0.22, 1)',
            position: 'relative',
            zIndex: 50,
          });
          
          setTimeout(() => {
            setTextVis(true);
          }, 300); // Start text fade-in mid-flight
        });
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [isFirstLoad]);

  const mobileWritingStyle: React.CSSProperties = isFirstLoad
    ? { animation: 'write-iciss 1000ms cubic-bezier(0.4, 0, 0.2, 1) 650ms both' }
    : {};
  const mobileAiosStyle: React.CSSProperties = isFirstLoad
    ? { animation: 'blur-fade-in 500ms cubic-bezier(0.25, 1, 0.5, 1) 1650ms both' }
    : {};

  const desktopWritingStyle: React.CSSProperties = isFirstLoad
    ? { animation: 'write-iciss 1000ms cubic-bezier(0.4, 0, 0.2, 1) 650ms both' }
    : {};
  const desktopAiosStyle: React.CSSProperties = isFirstLoad
    ? { animation: 'blur-fade-in 500ms cubic-bezier(0.25, 1, 0.5, 1) 1650ms both' }
    : {};

  const { unreadCount } = useNotifications();

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
      {/* ── Mobile: sticky glass navbar — always visible ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-3 pt-3 pb-1">
        <nav className="relative w-full flex items-center justify-between py-3 px-5 glass !transform-none pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/5">
          <NavbarGoldTrace />
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity ml-1"
            onClick={() => window.dispatchEvent(new Event("go-to-dash"))}
          >
            <img 
              ref={mobileLogoRef}
              src="/icon-192.png" 
              alt="Viciss AIOS Logo" 
              className="w-[22px] h-[22px] object-contain flex-shrink-0" 
              style={mobileLogoStyle}
            />
            <div className="flex items-baseline -ml-[3px] overflow-hidden select-none">
              <span 
                className="text-[21px] font-bold text-gold-gradient font-handwritten whitespace-nowrap"
                style={mobileWritingStyle}
              >
                iciss
              </span>
              <span 
                className="ml-1.5 text-[18px] font-bold uppercase tracking-wider text-gold-gradient whitespace-nowrap"
                style={mobileAiosStyle}
              >
                AIOS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCoins(true)}
              className="glass !transform-none rounded-full px-3 py-1 text-sm font-semibold text-foreground whitespace-nowrap flex items-center gap-1.5 hover:bg-secondary/60 active:scale-95 transition-all"
            >
              <Coins className="w-3.5 h-3.5 text-[#fbbf24] drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" /> {stats?.coins ?? 0}
            </button>
            <button
              type="button"
              onClick={() => setShowStreak(true)}
              className="glass !transform-none rounded-full px-3 py-1 text-sm font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-[#f97316] drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]" /> {displayStreak}
            </button>
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="glass relative !transform-none rounded-full w-8 h-8 flex items-center justify-center hover:bg-secondary/60 transition-colors"
            >
              <Bell className="w-4 h-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* ── Desktop: full glass navbar ── */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-40 justify-center px-3 mt-4 pointer-events-none">
        <div className="relative w-full max-w-[1060px] pointer-events-auto">
          <nav className="relative w-full flex items-center justify-between py-4 px-8 glass !transform-none !shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5">
            <NavbarGoldTrace />

            {/* Left: Brand */}
            <div className="flex items-center flex-shrink-0">
              <div 
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.dispatchEvent(new Event("go-to-dash"))}
              >
                <img 
                  ref={desktopLogoRef}
                  src="/icon-192.png" 
                  alt="Viciss AIOS Logo" 
                  className="w-[26px] h-[26px] object-contain flex-shrink-0" 
                  style={desktopLogoStyle}
                />
                <div className="flex items-baseline -ml-[4px] overflow-hidden select-none">
                  <span 
                    className="text-[26px] font-bold text-gold-gradient font-handwritten whitespace-nowrap"
                    style={desktopWritingStyle}
                  >
                    iciss
                  </span>
                  <span 
                    className="ml-2 text-[21px] font-bold uppercase tracking-widest text-gold-gradient whitespace-nowrap"
                    style={desktopAiosStyle}
                  >
                    AIOS
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Stats & Avatar */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCoins(true)}
                  className="glass !transform-none rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap flex items-center gap-2 hover:bg-secondary/60 transition-colors"
                >
                  <Coins className="w-4 h-4 text-[#fbbf24] drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" /> {stats?.coins ?? 0}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStreak(true)}
                  className="glass !transform-none rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 transition-colors flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-[#f97316] drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]" /> {displayStreak}
                </button>
                <button
                  type="button"
                  onClick={() => setShowShieldShop(true)}
                  className="glass !transform-none rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 transition-colors flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-primary drop-shadow-[0_0_4px_rgba(var(--primary),0.5)]" /> {stats?.shields ?? 0}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPowerUps(true)}
                  className="glass !transform-none rounded-full px-3.5 py-1.5 text-lg font-semibold text-foreground whitespace-nowrap hover:bg-secondary/60 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-primary drop-shadow-[0_0_4px_rgba(var(--primary),0.5)]" /> {stats?.power_ups ?? 0}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotifications(true)}
                  className="glass relative !transform-none rounded-full w-10 h-10 flex items-center justify-center hover:bg-secondary/60 transition-colors"
                >
                  <Bell className="w-5 h-5 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
                  )}
                </button>

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
            </div>
          </nav>
        </div>
      </div>

      {showStreak && <StreakWindow onClose={() => setShowStreak(false)} />}
      {showAccount && <AccountCenter onClose={() => setShowAccount(false)} />}
      {showCoins && <CoinsWindow onClose={() => setShowCoins(false)} onOpenShieldShop={() => setShowShieldShop(true)} />}
      {showShieldShop && <ShieldShop onClose={() => setShowShieldShop(false)} />}
      {showPowerUps && <PowerUpOverlay onClose={() => setShowPowerUps(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');

        .font-handwritten {
          font-family: 'Caveat', cursive, sans-serif;
        }

        @keyframes write-iciss {
          0% {
            clip-path: inset(0 100% 0 0);
          }
          100% {
            clip-path: inset(0 0% 0 0);
          }
        }

        @keyframes blur-fade-in {
          0% {
            filter: blur(8px);
            opacity: 0;
          }
          100% {
            filter: blur(0px);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
