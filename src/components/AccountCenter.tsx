import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { X, LogOut, Shield, Zap, RotateCcw, Bell, User, Calendar, Download, Moon, Compass, Waves, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ShieldShop from "./ShieldShop";
import PowerUpOverlay from "./PowerUpOverlay";

import type { TablesUpdate } from "@/integrations/supabase/types";
import { getInstallLabel, isMobileDevice, isRunningStandalone } from "@/lib/pwa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import LoadingScreen from "./LoadingScreen";

interface Props { onClose: () => void; }

export default function AccountCenter({ onClose }: Props) {
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
  const [installing, setInstalling] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const installLabel = useMemo(() => getInstallLabel(), []);
  const isInstalled = isRunningStandalone();
  const isMobile = isMobileDevice();

  const [bgStyle, setBgStyle] = useState(() => {
    return localStorage.getItem("vicissometer-bg-style") || "solid";
  });

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

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("vicissometer-theme") || "dark";
  });

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setThemeMode(newTheme);
    localStorage.setItem("vicissometer-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast.success(`${newTheme === "dark" ? "Dark" : "Light"} mode activated`);
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
    onClose();
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
    qc.invalidateQueries({ queryKey: ["user_stats"] });
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
    qc.invalidateQueries({ queryKey: ["user_stats"] });

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
    onClose();
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 sm:p-4">
      {resetting && <div className="fixed inset-0 z-[110]"><LoadingScreen message="Wiping account..." /></div>}
      <div className="glass rounded-2xl p-4 sm:p-5 w-full max-w-sm max-h-[92vh] overflow-y-auto z-10">
        <div className="relative mb-3">
          <button onClick={onClose} disabled={resetting} className="popup-close absolute right-0 top-0"><X className="h-4 w-4" /></button>
          <h1 className="text-2xl font-bold text-foreground text-center">Vicissometer</h1>
          <h2 className="text-xl font-bold text-foreground text-center">Account Centre</h2>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12 border border-primary/40 bg-primary/20">
            {currentAvatar ? <AvatarImage src={currentAvatar} alt="Profile" /> : null}
            <AvatarFallback className="text-primary text-xl font-bold">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-2">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary border-border h-10 text-base" placeholder="Display Name" />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarPicked(e.target.files?.[0])}
                />
                <Button type="button" variant="secondary" onClick={handleSelectAvatar} className="w-full h-10 text-sm">
                  Select Image (max 5 MB)
                </Button>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateProfile} className="bg-primary text-primary-foreground text-sm h-8">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)} className="text-sm h-8">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold text-foreground text-base truncate">{currentDisplayName}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                <button
                  onClick={() => {
                    setDisplayName(currentDisplayName);
                    setAvatarUrl(currentAvatar || "");
                    setEditingProfile(true);
                  }}
                  className="text-sm text-primary hover:underline mt-0.5"
                >
                  <User className="h-3 w-3 inline mr-1" />Edit Profile
                </button>
              </>
            )}
          </div>
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

          {/* Start Date */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl text-foreground text-base">
            <span className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /> Start Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-sm text-primary hover:underline">
                  {currentStartDate ? format(currentStartDate, "MMM d, yyyy") : "Set date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="end">
                <CalendarPicker
                  mode="single"
                  selected={currentStartDate}
                  onSelect={handleSetStartDate}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl text-foreground text-base">
            <span className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /> End Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-sm text-primary hover:underline">
                  {currentEndDate ? format(currentEndDate, "MMM d, yyyy") : "Set date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="end">
                <CalendarPicker
                  mode="single"
                  selected={currentEndDate}
                  onSelect={handleSetEndDate}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Theme Mode Selector */}
          <div className="p-3 space-y-2 border-t border-border/40 mt-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Theme Mode</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleThemeChange("light")}
                className={cn(
                  "flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all duration-300",
                  themeMode === "light" 
                    ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                    : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                )}
              >
                <Sun className="h-3.5 w-3.5" /> Light Mode
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={cn(
                  "flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all duration-300",
                  themeMode === "dark" 
                    ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                    : "bg-secondary/40 border-border/40 text-foreground hover:bg-secondary/70 hover:border-border"
                )}
              >
                <Moon className="h-3.5 w-3.5" /> Dark Mode
              </button>
            </div>
          </div>

          {/* Background Theme Selector */}
          <div className="p-3 space-y-2 border-t border-border/40 mt-1">
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
                <Moon className="h-4 w-4" /> Solid Theme
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
                <Compass className="h-4 w-4" /> Orbital Pulse
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
          </div>

          <hr className="border-border my-1" />

          <button onClick={handleResetDefaults} disabled={resetting} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive text-base">
            <RotateCcw className="h-5 w-5" /> {resetting ? "Resetting..." : "Reset All Data"}
          </button>

          <Button onClick={handleSignOut} variant="ghost" disabled={resetting} className="w-full justify-start text-destructive hover:text-destructive text-base h-10">
            <LogOut className="h-5 w-5 mr-3" /> Sign Out
          </Button>
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
    </div>
  );
}
