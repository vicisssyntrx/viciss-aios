import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { X, LogOut, Shield, Zap, RotateCcw, Bell, User, Calendar, Download, Moon, Compass, Waves, Sparkles, Sun, Monitor, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn, hexToHslString } from "@/lib/utils";
import ShieldShop from "./ShieldShop";
import PowerUpOverlay from "./PowerUpOverlay";

import type { TablesUpdate } from "@/integrations/supabase/types";
import { getInstallLabel, isMobileDevice, isRunningStandalone } from "@/lib/pwa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import LoadingScreen from "./LoadingScreen";
import { useNotifications } from "@/hooks/useNotifications";

interface Props { 
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function AccountCenter({ onClose, isEmbedded = false }: Props) {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [showShields, setShowShields] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState((user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url || "");
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const { permission, requestPermission } = useNotifications();
  const [installing, setInstalling] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const installLabel = useMemo(() => getInstallLabel(), []);
  const isInstalled = isRunningStandalone();
  const isMobile = isMobileDevice();

  const [bgStyle, setBgStyle] = useState(() => {
    return localStorage.getItem("vicissometer-bg-style") || "solid";
  });

  const [rabbitMode, setRabbitMode] = useState(() => localStorage.getItem("rabbit-mode") || localStorage.getItem("rabit-mode") || "on");

  const handleRabbitModeChange = (mode: string) => {
    setRabbitMode(mode);
    localStorage.setItem("rabbit-mode", mode);
    window.dispatchEvent(new Event("rabbit-mode-changed"));
    window.dispatchEvent(new Event("rabit-mode-changed"));
  };

  const [aiProvider, setAiProvider] = useState<"openrouter" | "google">(
    () => (localStorage.getItem("ai-provider") as "openrouter" | "google") || "openrouter"
  );
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem("openrouter-key") || "");
  const [openRouterModuleId, setOpenRouterModuleId] = useState(() => localStorage.getItem("openrouter-model") || "");
  const [googleKey, setGoogleKey] = useState(() => localStorage.getItem("google-ai-key") || "");
  const [googleModelId, setGoogleModelId] = useState(() => localStorage.getItem("google-ai-model") || "");

  const [tempProvider, setTempProvider] = useState(aiProvider);
  const [tempApiKey, setTempApiKey] = useState(aiProvider === "google" ? googleKey : openRouterKey);
  const [tempModelId, setTempModelId] = useState(aiProvider === "google" ? googleModelId : openRouterModuleId);

  // Sync temp inputs when provider tab changes
  const handleProviderSwitch = (provider: "openrouter" | "google") => {
    setTempProvider(provider);
    setTempApiKey(provider === "google" ? googleKey : openRouterKey);
    setTempModelId(provider === "google" ? googleModelId : openRouterModuleId);
  };

  const handleSaveAISettings = () => {
    setAiProvider(tempProvider);
    localStorage.setItem("ai-provider", tempProvider);

    if (tempProvider === "google") {
      setGoogleKey(tempApiKey);
      setGoogleModelId(tempModelId);
      localStorage.setItem("google-ai-key", tempApiKey);
      localStorage.setItem("google-ai-model", tempModelId);
    } else {
      setOpenRouterKey(tempApiKey);
      setOpenRouterModuleId(tempModelId);
      localStorage.setItem("openrouter-key", tempApiKey);
      localStorage.setItem("openrouter-model", tempModelId);
    }
    toast.success("AI Settings Saved!");
  };

  const handleResetAISettings = () => {
    setTempApiKey("");
    setTempModelId("");
    if (tempProvider === "google") {
      setGoogleKey("");
      setGoogleModelId("");
      localStorage.removeItem("google-ai-key");
      localStorage.removeItem("google-ai-model");
    } else {
      setOpenRouterKey("");
      setOpenRouterModuleId("");
      localStorage.removeItem("openrouter-key");
      localStorage.removeItem("openrouter-model");
    }
    toast.success(`${tempProvider === "google" ? "Google AI" : "OpenRouter"} Settings Reset!`);
  };

  const [orbitStyle, setOrbitStyle] = useState(() => {
    return localStorage.getItem("vicissometer-orbit-style") || "red-blue";
  });

  const [customPulseColor, setCustomPulseColor] = useState(() => {
    return localStorage.getItem("vicissometer-pulse-color") || "#ef4444";
  });

  const [quoteInput, setQuoteInput] = useState("");

  const handleBgChange = (newStyle: string) => {
    setBgStyle(newStyle);
    localStorage.setItem("vicissometer-bg-style", newStyle);
    window.dispatchEvent(new Event("vicissometer-bg-changed"));
    toast.success(`Background style changed to ${
      newStyle === "solid" 
        ? "Solid Theme" 
        : newStyle === "pulse" 
          ? "Horizon Pulse" 
          : newStyle === "orbit-static"
            ? "Orbital Pulse"
            : "Moving Orbits"
    }`);
  };

  const handleOrbitStyleChange = (style: "red-blue" | "red-blue-yellow") => {
    setOrbitStyle(style);
    localStorage.setItem("vicissometer-orbit-style", style);
    window.dispatchEvent(new Event("vicissometer-bg-changed"));
    toast.success(`Moving Orbits layout changed!`);
  };

  const handlePulseColorChange = (hexColor: string) => {
    setCustomPulseColor(hexColor);
    localStorage.setItem("vicissometer-pulse-color", hexColor);
    window.dispatchEvent(new Event("vicissometer-bg-changed"));
  };

  const [customPrimaryColor, setCustomPrimaryColor] = useState(() => {
    return localStorage.getItem("vicissometer-primary-color") || "#ef4444";
  });

  const handlePrimaryColorChange = (hexColor: string) => {
    setCustomPrimaryColor(hexColor);
    localStorage.setItem("vicissometer-primary-color", hexColor);
    document.documentElement.style.setProperty("--primary", hexToHslString(hexColor));
    document.documentElement.style.setProperty("--ring", hexToHslString(hexColor));
    window.dispatchEvent(new Event("vicissometer-primary-changed"));
  };

  const handleBulkImportQuotes = () => {
    if (!quoteInput.trim()) {
      toast.error("Please enter some quotes first.");
      return;
    }

    try {
      // Regex parsing for bulk quote input: ["quote" - Author],["quote" - Author]...
      const matches = [...quoteInput.matchAll(/\[\s*"([^"]+)"\s*-\s*([^\]]+)\]/g)];
      if (matches.length === 0) {
        toast.error("Invalid format. Please use: [\"quote\" - Author],[\"quote\" - Author]");
        return;
      }

      if (matches.length > 366) {
        toast.error("You can import a maximum of 366 quotes.");
        return;
      }

      const imported = matches.map(m => ({
        text: m[1].trim(),
        author: m[2].trim()
      }));

      localStorage.setItem("vicissometer-quotes", JSON.stringify(imported));
      toast.success(`Successfully imported ${imported.length} quotes!`);
      setQuoteInput("");
    } catch (e) {
      toast.error("Failed to parse quote string. Please double-check formatting.");
    }
  };

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("vicissometer-theme") || "dark";
  });

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setThemeMode(newTheme);
    localStorage.setItem("vicissometer-theme", newTheme);
    const isDark = newTheme === "dark" || (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast.success(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`);
  };

  // Fetch current start_date
  const { data: stats } = useQuery({
    queryKey: ["user_stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_stats").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch profile row (display_name/avatar_url)
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

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const currentStartDate = startDate || (stats?.start_date ? new Date(stats.start_date + "T00:00:00") : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const currentEndDate = endDate || (stats?.end_date ? new Date(stats.end_date + "T00:00:00") : undefined);

  const handleSignOut = async () => {
    await signOut();
    onClose?.();
  };

  const handleUpdateProfile = async () => {
    const nextAvatar = avatarUrl.trim() || null;
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName, avatar_url: nextAvatar },
    });
    if (error) { toast.error(error.message); return; }
    if (user) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName, avatar_url: nextAvatar })
        .eq("user_id", user.id);
    }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile updated!");
    setEditingProfile(false);
  };

  const handleSelectAvatar = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarPicked = async (file?: File) => {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max size is 5MB.");
      return;
    }

    try {
      toast.loading("Uploading avatar...", { id: "avatar-upload" });

      const fileExt = file.name.split('.').pop();
      // Path: {user_id}/{random_uuid}.{ext}
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // 3. Update local state
      setAvatarUrl(publicUrl);

      // 4. Update auth metadata with the short URL
      const { error: authError } = await supabase.auth.updateUser({ 
        data: { avatar_url: publicUrl } 
      });

      if (authError) throw authError;

      // 5. Update profiles table for instant cross-device sync
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      qc.invalidateQueries({ queryKey: ["profile"] });

      toast.success("Avatar updated successfully!", { id: "avatar-upload" });
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      toast.error("Failed to upload avatar: " + error.message, { id: "avatar-upload" });
    }
  };

  const handleSetStartDate = async (date: Date | undefined) => {
    if (!date || !user) return;
    setStartDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    
    // Default end date is start date + 365 days
    const defaultEndDate = new Date(date.getTime() + 365 * 24 * 60 * 60 * 1000);
    const endDateStr = format(defaultEndDate, "yyyy-MM-dd");
    setEndDate(defaultEndDate);

    const update: TablesUpdate<"user_stats"> = { 
      start_date: dateStr,
      end_date: endDateStr 
    };
    const { error } = await supabase.from("user_stats").update(update).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    
    // Invalidate user stats and logs to force dynamic recalculation on Growth Graph
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["daily_log_today"] });
    qc.invalidateQueries({ queryKey: ["daily_log_date"] });
    
    toast.success(`Program start set to ${format(date, "MMM d, yyyy")} (Default End: ${format(defaultEndDate, "MMM d, yyyy")})`);
  };

  const handleSetEndDate = async (date: Date | undefined) => {
    if (!date || !user) return;

    if (currentStartDate && date <= currentStartDate) {
      toast.error("End Date must be after Start Date");
      return;
    }

    setEndDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const update: TablesUpdate<"user_stats"> = { end_date: dateStr };
    const { error } = await supabase.from("user_stats").update(update).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    
    // Invalidate user stats and logs to force dynamic recalculation on Growth Graph
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["daily_log_today"] });
    qc.invalidateQueries({ queryKey: ["daily_log_date"] });

    const durationDays = currentStartDate 
      ? Math.round((date.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24)) 
      : 365;
    toast.success(`Program timeframe customized to ${durationDays} days! (Ends ${format(date, "MMM d, yyyy")})`);
  };

  const handleResetDefaults = () => {
    setResetToken("");
    setShowResetDialog(true);
  };
  
  const confirmResetData = async () => {
    if (!user) return;
    if (resetToken.toUpperCase() !== "RESET") {
      toast.error("You must type RESET to confirm data deletion.");
      return;
    }
    setShowResetDialog(false);
    setResetting(true);
    const { error: logDeleteError } = await supabase.from("daily_logs").delete().eq("user_id", user.id);
    if (logDeleteError) {
      toast.error(logDeleteError.message);
      setResetting(false);
      return;
    }
    const { error: habitDeleteError } = await supabase.from("habits").delete().eq("user_id", user.id);
    if (habitDeleteError) {
      toast.error(habitDeleteError.message);
      setResetting(false);
      return;
    }
    const { error: statResetError } = await supabase.from("user_stats").update({
      coins: 0, streak: 0, shields: 0, power_ups: 0, current_growth: 1.0,
    }).eq("user_id", user.id);
    if (statResetError) {
      toast.error(statResetError.message);
      setResetting(false);
      return;
    }
    qc.invalidateQueries({ queryKey: ["daily_logs"] });
    qc.invalidateQueries({ queryKey: ["habits"] });
    qc.invalidateQueries({ queryKey: ["user_stats"] });
    toast.success("All data reset to defaults!");
    setResetting(false);
    onClose?.();
  };

  const handleInstallApp = async () => {
    const installPrompt = window.__vicissInstallPromptEvent;
    if (!installPrompt) {
      if (isMobile) {
        toast.info("Use Chrome menu > Add to Home screen to install");
      } else {
        toast.info("Use your browser install icon in the address bar");
      }
      return;
    }

    setInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success(`${installLabel} started`);
      } else {
        toast.info("Install dismissed");
      }
    } catch {
      toast.error("Install prompt not available");
    } finally {
      setInstalling(false);
    }
  };

  if (showShields) return <ShieldShop onClose={() => setShowShields(false)} />;
  if (showPowerUps) return <PowerUpOverlay onClose={() => setShowPowerUps(false)} />;

  const currentDisplayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";
  const currentAvatar =
    profile?.avatar_url ||
    (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ||
    null;
  const initial = currentDisplayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  const content = (
    <>
      <div 
        className={cn("relative w-full max-w-sm flex flex-col items-center select-none mx-auto mt-8 sm:mt-0 pt-[5rem] sm:pt-[5.5rem]", !isEmbedded && "max-h-[88vh] overflow-y-auto no-scrollbar")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar */}
        {!isEmbedded && <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-30" />}
        
        {/* Large Centered Avatar */}
        <div 
          className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-full overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),0_12px_24px_-8px_rgba(0,0,0,0.6)] border-4 border-background bg-secondary/80 flex items-center justify-center cursor-pointer group hover:scale-[1.02] active:scale-95 transition-all duration-300"
          onClick={() => {
            if (!editingProfile) {
              setDisplayName(currentDisplayName);
              setAvatarUrl(currentAvatar || "");
              setEditingProfile(true);
            }
          }}
        >
          <Avatar className="h-full w-full rounded-full">
            {currentAvatar ? <AvatarImage src={currentAvatar} alt="Profile" className="object-cover h-full w-full rounded-full" /> : null}
            <AvatarFallback className="text-primary text-3xl font-black bg-primary/10 flex items-center justify-center rounded-full">{initial}</AvatarFallback>
          </Avatar>
          
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <User className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Scrollable Container for Cards */}
        <div className="w-full z-10 flex flex-col space-y-4 pb-8 sm:pb-4">
          
          {/* Card 1: Profile & Core Settings */}
          <div className="glass w-full rounded-3xl sm:rounded-2xl p-4 sm:p-5 pt-[5.5rem] sm:pt-[6.5rem] flex flex-col relative">
            {!isEmbedded && onClose && (
              <button 
                onClick={onClose} 
                disabled={resetting} 
                className="popup-close absolute right-4 top-4 hover:bg-secondary/60 p-1.5 rounded-full transition-colors z-30 animate-fade-in"
              >
                <X className="h-4 w-4 text-foreground/80" />
              </button>
            )}

            <div className="text-center mt-3 mb-4 border-b border-border/40 pb-4">
              {editingProfile ? (
                <div className="space-y-3 max-w-[260px] mx-auto">
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    className="bg-secondary/50 border-border/60 h-10 text-center text-base" 
                    placeholder="Display Name" 
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarPicked(e.target.files?.[0])}
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleSelectAvatar} 
                    className="w-full h-10 text-sm glass hover:bg-secondary/80 font-semibold"
                  >
                    Upload Avatar Image
                  </Button>
                  <div className="flex gap-2 justify-center pt-1">
                    <Button size="sm" onClick={handleUpdateProfile} className="bg-primary text-primary-foreground font-semibold px-4 h-8">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)} className="h-8 text-muted-foreground hover:text-foreground">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="font-extrabold text-foreground text-xl tracking-tight truncate max-w-[240px]">
                    {currentDisplayName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate max-w-[240px] mt-0.5">
                    {user?.email}
                  </p>
                  <button
                    onClick={() => {
                      setDisplayName(currentDisplayName);
                      setAvatarUrl(currentAvatar || "");
                      setEditingProfile(true);
                    }}
                    className="text-xs font-bold text-primary hover:underline mt-2.5 flex items-center gap-1.5 bg-primary/10 px-3.5 py-1.5 rounded-full active:scale-95 transition-all duration-300"
                  >
                    <User className="h-3 w-3" /> Edit Profile
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <button onClick={() => setShowShields(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground text-base">
                <Shield className="h-5 w-5 text-primary" /> Shield Shop
              </button>
              <button onClick={() => setShowPowerUps(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground text-base">
                <Zap className="h-5 w-5 text-primary" /> Power-Up Recovery
              </button>
              {!isInstalled && (
                <button
                  onClick={handleInstallApp}
                  disabled={installing}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-colors text-foreground text-base disabled:opacity-60"
                >
                  <Download className="h-5 w-5 text-primary" />
                  {installing ? "Preparing install..." : installLabel}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Virtual Assistant */}
          <div className="glass w-full rounded-2xl p-4 sm:p-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" /> Virtual Assistant (Rabbit)
              </span>
              <Switch 
                checked={rabbitMode === "vector"} 
                onCheckedChange={(checked) => handleRabbitModeChange(checked ? "vector" : "off")} 
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> Allow Notifications
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">Get scheduled reminders from Rabbit</span>
              </div>
              <Switch 
                checked={permission === "granted"} 
                disabled={permission === "denied" || permission === "granted"}
                onCheckedChange={async (checked) => {
                  if (checked && permission !== "granted") {
                    await requestPermission();
                  }
                }} 
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex bg-secondary/30 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleProviderSwitch("openrouter")}
                  className={cn(
                    "flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-colors",
                    tempProvider === "openrouter" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  OpenRouter
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderSwitch("google")}
                  className={cn(
                    "flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-colors",
                    tempProvider === "google" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Google Studio
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  {tempProvider === "google" ? "Google AI API Key" : "OpenRouter API Key"}
                </span>
                <Input 
                  type="password"
                  placeholder={tempProvider === "google" ? "AIzaSy..." : "sk-or-v1-..."}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="h-8 text-xs bg-secondary/40 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Model ID</span>
                <Input 
                  type="text"
                  placeholder={tempProvider === "google" ? "e.g. gemini-2.5-flash" : "e.g. meta-llama/llama-3-8b-instruct:free"}
                  value={tempModelId}
                  onChange={(e) => setTempModelId(e.target.value)}
                  className="h-8 text-xs bg-secondary/40 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/50"
                />
              </div>
              
              <div className="flex gap-2 pt-1">
                <Button 
                  onClick={handleSaveAISettings}
                  className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                >
                  Save
                </Button>
                <Button 
                  onClick={handleResetAISettings}
                  variant="outline"
                  className="flex-1 h-8 text-xs border-destructive text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  Reset
                </Button>
              </div>

              <p className="text-[9px] text-muted-foreground leading-tight">
                Required for AI chat. Model settings will automatically apply when active provider is selected and saved.
              </p>
            </div>
          </div>

          {/* Card 3: Theme & Background Style */}
          <div className="glass w-full rounded-2xl p-4 sm:p-5 flex flex-col">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Theme Mode</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 p-2 rounded-xl text-[10px] sm:text-xs font-medium border transition-all duration-300",
                    themeMode === "light" 
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                      : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                  )}
                >
                  <Sun className="h-3.5 w-3.5" /> Light
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 p-2 rounded-xl text-[10px] sm:text-xs font-medium border transition-all duration-300",
                    themeMode === "dark" 
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                      : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                  )}
                >
                  <Moon className="h-3.5 w-3.5" /> Dark
                </button>
                <button
                  onClick={() => handleThemeChange("system")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 p-2 rounded-xl text-[10px] sm:text-xs font-medium border transition-all duration-300",
                    themeMode === "system" 
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                      : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" /> System
                </button>
              </div>
              
              <div className="pt-2 pb-2 flex items-center justify-between border-b border-border/40">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Primary Color</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border border-border shadow-inner" 
                    style={{ backgroundColor: customPrimaryColor }} 
                  />
                  <input 
                    type="color" 
                    value={customPrimaryColor} 
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    className="w-8 h-8 opacity-0 absolute cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Background Style</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleBgChange("solid")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all duration-300",
                    bgStyle === "solid" 
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                      : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                  )}
                >
                  <Moon className="h-4 w-4" /> Solid
                </button>
                <button
                  onClick={() => handleBgChange("pulse")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all duration-300",
                    bgStyle === "pulse" 
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                      : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                  )}
                >
                  <Sparkles className="h-4 w-4" /> Horizon Pulse
                </button>
                <button
                  onClick={() => handleBgChange("orbit-static")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all duration-300",
                    bgStyle === "orbit-static" 
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                      : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                  )}
                >
                  <Compass className="h-4 w-4" /> Orbital
                </button>
                <button
                  onClick={() => handleBgChange("orbit-moving")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all duration-300",
                    bgStyle === "orbit-moving" 
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                      : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                  )}
                >
                  <Waves className="h-4 w-4" /> Moving Orbits
                </button>
              </div>

              {bgStyle === "orbit-moving" && (
                <div className="mt-3 p-2.5 rounded-xl bg-secondary/30 border border-border/30 space-y-2 animate-in slide-in-from-top-1 duration-200">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Orbit Color Palette</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleOrbitStyleChange("red-blue")}
                      className={cn(
                        "p-1.5 rounded-lg text-[10px] font-semibold border transition-all",
                        orbitStyle === "red-blue"
                          ? "bg-primary/20 border-primary text-foreground"
                          : "bg-transparent border-border/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      🔴 🔵 Red & Blue
                    </button>
                    <button
                      onClick={() => handleOrbitStyleChange("red-blue-yellow")}
                      className={cn(
                        "p-1.5 rounded-lg text-[10px] font-semibold border transition-all",
                        orbitStyle === "red-blue-yellow"
                          ? "bg-primary/20 border-primary text-foreground"
                          : "bg-transparent border-border/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      🔴 🔵 🟡 3-Color
                    </button>
                  </div>
                </div>
              )}

              {(bgStyle === "pulse" || bgStyle === "orbit-static") && (
                <div className="mt-3 p-2.5 rounded-xl bg-secondary/30 border border-border/30 flex items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-200">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Pulse Glow Color</span>
                    <span className="text-[10px] text-muted-foreground/60">Tap swatch to pick</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customPulseColor}
                      onChange={(e) => handlePulseColorChange(e.target.value)}
                      className="w-8 h-8 rounded-md cursor-pointer border-none bg-transparent"
                    />
                    <button
                      onClick={() => handlePulseColorChange("#ef4444")}
                      className="text-[9px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Advanced & Account */}
          <div className="glass w-full rounded-2xl p-4 sm:p-5 flex flex-col">
            <div className="space-y-2 mb-4 text-center flex flex-col items-center">
              <div className="w-full flex items-center justify-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Import Bulk Quotes</span>
                <span className="text-[9px] text-muted-foreground/50 font-semibold">(Max 366)</span>
              </div>
              <textarea
                value={quoteInput}
                onChange={(e) => setQuoteInput(e.target.value)}
                placeholder='["Habits build character." - Author]'
                className="w-full h-16 text-xs bg-secondary/40 border border-border/40 rounded-xl p-2 text-center focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none font-mono"
              />
              <Button
                onClick={handleBulkImportQuotes}
                className="w-full h-8 text-[11px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                Import Quote Pool
              </Button>
            </div>

            <hr className="border-border/40 my-2" />

            <div className="w-full flex items-center justify-between p-2 rounded-xl text-foreground text-base">
              <span className="flex items-center gap-3"><Calendar className="h-4 w-4 text-primary" /> Start Date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-sm text-primary hover:underline">
                    {currentStartDate ? format(currentStartDate, "MMM d, yyyy") : "Set date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="end">
                  <CalendarPicker mode="single" selected={currentStartDate} onSelect={handleSetStartDate} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full flex items-center justify-between p-2 rounded-xl text-foreground text-base">
              <span className="flex items-center gap-3"><Calendar className="h-4 w-4 text-primary" /> End Date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-sm text-primary hover:underline">
                    {currentEndDate ? format(currentEndDate, "MMM d, yyyy") : "Set date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="end">
                  <CalendarPicker mode="single" selected={currentEndDate} onSelect={handleSetEndDate} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            <hr className="border-border/40 my-2" />

            <button onClick={handleResetDefaults} disabled={resetting} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive text-base mt-1">
              <RotateCcw className="h-4 w-4" /> {resetting ? "Resetting..." : "Reset All Data"}
            </button>

            <Button onClick={handleSignOut} variant="ghost" disabled={resetting} className="w-full justify-start text-destructive hover:text-destructive text-base h-10 mt-1 px-3">
              <LogOut className="h-4 w-4 mr-3" /> Sign Out
            </Button>

            {/* App branding */}
            <div className="mt-4 pt-3 border-t border-border/30 flex flex-col items-center gap-0.5 opacity-50">
              <p className="text-sm font-bold tracking-tight text-foreground">Vicissometer</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono tracking-widest uppercase">v0.0.2.6_6.4 • June 4, 2026</p>
            </div>
          </div>

        </div>
      </div>
      

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="glass border-destructive/30 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Reset All Data?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80 space-y-4">
              <p>This action is <strong>irreversible</strong> and will permanently wipe all your habits, stats, streaks, and historical data from the server.</p>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">Type RESET to confirm</label>
                <Input
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="RESET"
                  className="bg-secondary/50 border-destructive/50 focus-visible:ring-destructive uppercase"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between items-center w-full sm:flex-row mt-4">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto h-10 bg-secondary border-none hover:bg-secondary/80">Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => { 
                    e.preventDefault(); 
                    confirmResetData(); 
                }} 
                className="w-full sm:w-auto mt-2 sm:mt-0 h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (isEmbedded) {
    return (
      <div className="relative w-full">
        {resetting && <div className="fixed inset-0 z-[110]"><LoadingScreen message="Wiping account..." /></div>}
        {content}
      </div>
    );
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      {resetting && <div className="fixed inset-0 z-[110]"><LoadingScreen message="Wiping account..." /></div>}
      {content}
    </div>,
    document.body
  );
}
