import { useState, useEffect } from "react";
import { Plus, Trash2, Grid, Search, Sparkles, Check, X, Edit2, Info } from "lucide-react";
import { toast } from "sonner";

interface AppShortcut {
  id: string;
  name: string;
  url: string; // legacy support
  scheme: string; // native deep link, e.g., capcut://
  webUrl: string; // web fallback URL
  playStoreId: string; // Play Store package name, e.g., com.lemon.lvoverseas
  category: string;
  bgColor: string;
  iconUrl?: string; // High-quality remote logo
  emoji?: string; // Fallback emoji
}

interface AppTemplate {
  name: string;
  category: string;
  scheme: string;
  webUrl: string;
  playStoreId: string;
  iconSlug: string; // slug for simpleicons/unavatar
  bgColor: string;
  emoji?: string;
}

const LOCAL_STORAGE_KEY = "vicissometer-apps-shortcuts";

const POPULAR_APPS_CATALOG: AppTemplate[] = [
  {
    name: "CapCut",
    category: "Creative",
    scheme: "capcut://",
    webUrl: "https://www.capcut.com",
    playStoreId: "com.lemon.lvoverseas",
    iconSlug: "capcut",
    bgColor: "from-blue-600/35 to-indigo-600/35",
    emoji: "🎬",
  },
  {
    name: "Wondershare Filmora",
    category: "Creative",
    scheme: "filmora://",
    webUrl: "https://filmora.wondershare.com",
    playStoreId: "com.wondershare.filmorago",
    iconSlug: "wondershare",
    bgColor: "from-teal-600/35 to-emerald-600/35",
    emoji: "🎥",
  },
  {
    name: "Notion",
    category: "Productivity",
    scheme: "notion://",
    webUrl: "https://www.notion.so",
    playStoreId: "notion.id",
    iconSlug: "notion",
    bgColor: "from-amber-600/35 to-orange-600/35",
    emoji: "📓",
  },
  {
    name: "Spotify",
    category: "Music",
    scheme: "spotify://",
    webUrl: "https://open.spotify.com",
    playStoreId: "com.spotify.music",
    iconSlug: "spotify",
    bgColor: "from-emerald-600/35 to-teal-600/35",
    emoji: "🎵",
  },
  {
    name: "YouTube",
    category: "Entertainment",
    scheme: "youtube://",
    webUrl: "https://www.youtube.com",
    playStoreId: "com.google.android.youtube",
    iconSlug: "youtube",
    bgColor: "from-rose-600/35 to-red-600/35",
    emoji: "📺",
  },
  {
    name: "WhatsApp",
    category: "Social",
    scheme: "whatsapp://",
    webUrl: "https://web.whatsapp.com",
    playStoreId: "com.whatsapp",
    iconSlug: "whatsapp",
    bgColor: "from-green-600/35 to-emerald-600/35",
    emoji: "💬",
  },
  {
    name: "Instagram",
    category: "Social",
    scheme: "instagram://",
    webUrl: "https://www.instagram.com",
    playStoreId: "com.instagram.android",
    iconSlug: "instagram",
    bgColor: "from-pink-600/35 to-rose-600/35",
    emoji: "📸",
  },
  {
    name: "Discord",
    category: "Social",
    scheme: "discord://",
    webUrl: "https://discord.com",
    playStoreId: "com.discord",
    iconSlug: "discord",
    bgColor: "from-indigo-600/35 to-violet-600/35",
    emoji: "👾",
  },
  {
    name: "Telegram",
    category: "Social",
    scheme: "tg://",
    webUrl: "https://web.telegram.org",
    playStoreId: "org.telegram.messenger",
    iconSlug: "telegram",
    bgColor: "from-sky-600/35 to-blue-600/35",
    emoji: "✈️",
  },
  {
    name: "Figma",
    category: "Creative",
    scheme: "figma://",
    webUrl: "https://www.figma.com",
    playStoreId: "com.figma.mirror",
    iconSlug: "figma",
    bgColor: "from-purple-600/35 to-pink-600/35",
    emoji: "🎨",
  },
  {
    name: "Canva",
    category: "Creative",
    scheme: "canva://",
    webUrl: "https://www.canva.com",
    playStoreId: "com.canva.editor",
    iconSlug: "canva",
    bgColor: "from-cyan-600/35 to-blue-600/35",
    emoji: "📐",
  },
  {
    name: "ChatGPT",
    category: "Productivity",
    scheme: "chatgpt://",
    webUrl: "https://chatgpt.com",
    playStoreId: "com.openai.chatgpt",
    iconSlug: "openai",
    bgColor: "from-emerald-600/35 to-green-600/35",
    emoji: "🤖",
  },
  {
    name: "Netflix",
    category: "Entertainment",
    scheme: "nflx://",
    webUrl: "https://www.netflix.com",
    playStoreId: "com.netflix.mediaclient",
    iconSlug: "netflix",
    bgColor: "from-rose-950/40 to-black/50",
    emoji: "🍿",
  },
  {
    name: "Microsoft Teams",
    category: "Productivity",
    scheme: "msteams://",
    webUrl: "https://teams.microsoft.com",
    playStoreId: "com.microsoft.teams",
    iconSlug: "microsoftteams",
    bgColor: "from-blue-600/35 to-violet-600/35",
    emoji: "👥",
  },
  {
    name: "Pinterest",
    category: "Entertainment",
    scheme: "pinterest://",
    webUrl: "https://www.pinterest.com",
    playStoreId: "com.pinterest",
    iconSlug: "pinterest",
    bgColor: "from-red-600/35 to-orange-600/35",
    emoji: "📌",
  },
  {
    name: "Steam",
    category: "Entertainment",
    scheme: "steam://",
    webUrl: "https://store.steampowered.com",
    playStoreId: "com.valvesoftware.android.steam.community",
    iconSlug: "steam",
    bgColor: "from-slate-600/35 to-slate-900/35",
    emoji: "🎮",
  },
];

const PRESET_GRADIENTS = [
  "from-blue-600/35 to-indigo-600/35",
  "from-emerald-600/35 to-teal-600/35",
  "from-rose-600/35 to-red-600/35",
  "from-amber-600/35 to-orange-600/35",
  "from-purple-600/35 to-pink-600/35",
  "from-cyan-600/35 to-blue-600/35",
  "from-violet-600/35 to-fuchsia-600/35",
  "from-lime-600/35 to-green-600/35",
];

const CATEGORIES = ["Creative", "Productivity", "Entertainment", "Music", "Social", "Tools", "Other"];

const getIconUrl = (slug: string) => {
  // Use unavatar.io (high reliability logo service) or simpleicons
  return `https://unavatar.io/simpleicons/${slug.toLowerCase().trim()}`;
};

export default function AppsDashboard() {
  const [apps, setApps] = useState<AppShortcut[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Modal / Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [scheme, setScheme] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [playStoreId, setPlayStoreId] = useState("");
  const [category, setCategory] = useState("Tools");
  const [selectedGradient, setSelectedGradient] = useState(PRESET_GRADIENTS[0]);
  const [iconUrl, setIconUrl] = useState("");
  const [emoji, setEmoji] = useState("🚀");
  const [useEmoji, setUseEmoji] = useState(false);

  // Template Search State
  const [templateSearch, setTemplateSearch] = useState("");
  const [showCatalog, setShowCatalog] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setApps(JSON.parse(saved));
      } catch (e) {
        initializeDefaultApps();
      }
    } else {
      initializeDefaultApps();
    }
  }, []);

  const initializeDefaultApps = () => {
    const defaults: AppShortcut[] = POPULAR_APPS_CATALOG.slice(0, 4).map((tpl, idx) => ({
      id: `default-${idx}`,
      name: tpl.name,
      url: tpl.webUrl,
      scheme: tpl.scheme,
      webUrl: tpl.webUrl,
      playStoreId: tpl.playStoreId,
      category: tpl.category,
      bgColor: tpl.bgColor,
      iconUrl: getIconUrl(tpl.iconSlug),
      emoji: tpl.emoji || "🚀",
    }));
    setApps(defaults);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
  };

  // Save to localStorage
  const saveToStorage = (updatedApps: AppShortcut[]) => {
    setApps(updatedApps);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedApps));
  };

  const handleOpenAdd = () => {
    setName("");
    setScheme("");
    setWebUrl("");
    setPlayStoreId("");
    setCategory("Tools");
    setIconUrl("");
    setEmoji("🚀");
    setUseEmoji(false);
    setSelectedGradient(PRESET_GRADIENTS[Math.floor(Math.random() * PRESET_GRADIENTS.length)]);
    setEditingAppId(null);
    setTemplateSearch("");
    setShowCatalog(true);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (app: AppShortcut) => {
    setName(app.name);
    setScheme(app.scheme || "");
    setWebUrl(app.webUrl || app.url || "");
    setPlayStoreId(app.playStoreId || "");
    setCategory(app.category);
    setIconUrl(app.iconUrl || "");
    setEmoji(app.emoji || "🚀");
    setUseEmoji(!app.iconUrl);
    setSelectedGradient(app.bgColor);
    setEditingAppId(app.id);
    setShowCatalog(false);
    setIsAddOpen(true);
  };

  const handleSelectTemplate = (tpl: AppTemplate) => {
    setName(tpl.name);
    setScheme(tpl.scheme);
    setWebUrl(tpl.webUrl);
    setPlayStoreId(tpl.playStoreId);
    setCategory(tpl.category);
    setIconUrl(getIconUrl(tpl.iconSlug));
    setEmoji(tpl.emoji || "🚀");
    setUseEmoji(false);
    setSelectedGradient(tpl.bgColor);
    setShowCatalog(false);
    toast.success(`Selected ${tpl.name}! Form auto-filled.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name for the app");
      return;
    }

    // Try to auto-derive icon URL if missing and not using emoji
    let finalIconUrl = iconUrl.trim();
    if (!finalIconUrl && !useEmoji) {
      finalIconUrl = getIconUrl(name.trim().toLowerCase().replace(/\s+/g, ""));
    }

    const updatedShortcut: Omit<AppShortcut, "id"> = {
      name: name.trim(),
      url: webUrl.trim() || scheme.trim(),
      scheme: scheme.trim(),
      webUrl: webUrl.trim(),
      playStoreId: playStoreId.trim(),
      category,
      bgColor: selectedGradient,
      iconUrl: useEmoji ? undefined : finalIconUrl,
      emoji: useEmoji ? (emoji.trim() || "🚀") : emoji,
    };

    if (editingAppId) {
      const updated = apps.map((app) =>
        app.id === editingAppId ? { ...app, ...updatedShortcut } : app
      );
      saveToStorage(updated);
      toast.success("Shortcut updated!");
    } else {
      const newApp: AppShortcut = {
        id: Date.now().toString(),
        ...updatedShortcut,
      };
      saveToStorage([...apps, newApp]);
      toast.success("New shortcut added!");
    }

    setIsAddOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = apps.filter((app) => app.id !== id);
    saveToStorage(updated);
    toast.success("Shortcut deleted");
  };

  const handleLaunch = (app: AppShortcut) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile && app.scheme) {
      // Deep link trigger for Mobile
      const start = Date.now();
      
      // Try to open deep link scheme
      window.location.href = app.scheme;
      
      // Fallback timer: if the app is NOT installed, standard browser stays on the page
      setTimeout(() => {
        // If we are still actively focused on this page after 1.5s, the app launch failed (not installed)
        if (document.hasFocus() || Date.now() - start < 1800) {
          toast.info(`Launching ${app.name} failed. Taking you to the Play Store/Web...`);
          if (app.playStoreId) {
            window.open(`https://play.google.com/store/apps/details?id=${app.playStoreId}`, "_blank", "noopener,noreferrer");
          } else if (app.webUrl) {
            window.open(app.webUrl, "_blank", "noopener,noreferrer");
          }
        }
      }, 1500);
    } else {
      // Desktop / Web Fallback
      const destUrl = app.scheme && !app.webUrl ? app.scheme : (app.webUrl || app.url);
      try {
        window.open(destUrl, "_blank", "noopener,noreferrer");
      } catch (e) {
        toast.error("Could not launch this shortcut. Launching Play Store fallback...");
        if (app.playStoreId) {
          window.open(`https://play.google.com/store/apps/details?id=${app.playStoreId}`, "_blank");
        }
      }
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredTemplates = POPULAR_APPS_CATALOG.filter((tpl) =>
    tpl.name.toLowerCase().includes(templateSearch.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-6">
      {/* Header card with glass style */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Apps Dock
              <span className="glass px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold tracking-wider text-primary/80 border border-primary/20">Local Dashboard</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            Type the name of any app, and let Viciss AIOS automatically find its logo, set up the smart mobile deep-link launcher, and direct fallbacks to the Play Store.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hover:opacity-95 shadow-[0_4px_16px_rgba(var(--primary),0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 select-none self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shortcut</span>
        </button>
      </div>

      {/* Control Bar: Search & Categories */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/10 dark:bg-black/45 border border-black/5 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 backdrop-blur-md transition-all"
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
          {["All", ...CATEGORIES].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                  isSelected
                    ? "bg-foreground text-background border-foreground font-bold shadow-md"
                    : "glass text-muted-foreground hover:text-foreground hover:bg-secondary/40 border-black/5 dark:border-white/5"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* App Drawer Grid — compact home screen style */}
      {filteredApps.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-2xl mb-4">🔮</div>
          <h3 className="font-semibold text-lg text-foreground mb-1">No shortcuts found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Start adding shortcuts to Wondershare Filmora, CapCut, Notion, YouTube, or your favorite mobile and desktop applications!
          </p>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First App Shortcut</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-3 gap-y-5">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleLaunch(app)}
              className="group relative flex flex-col items-center gap-1.5 cursor-pointer select-none"
            >
              {/* Icon bubble */}
              <div className={`relative w-14 h-14 rounded-[18px] bg-gradient-to-br ${app.bgColor} border border-white/20 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-[1.08] group-hover:shadow-lg active:scale-[0.93] transition-all duration-200 backdrop-blur-sm`}
                style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)" }}
              >
                {/* Gradient fill */}
                <div className={`absolute inset-0 bg-gradient-to-br ${app.bgColor} opacity-80`} />

                {/* Icon image / emoji */}
                {app.iconUrl ? (
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="relative z-10 w-9 h-9 object-contain drop-shadow select-none"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".icon-fallback") as HTMLElement | null;
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <span className={`icon-fallback relative z-10 text-2xl select-none ${app.iconUrl ? "hidden" : ""}`}>
                  {app.emoji || app.name[0]?.toUpperCase() || "🚀"}
                </span>

                {/* Edit / Delete — shown on hover (desktop) or always visible small dot (mobile) */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[18px] z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(app); }}
                    className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(app.id, e)}
                    className="p-1.5 rounded-full bg-red-500/30 hover:bg-red-500/50 text-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* App name label */}
              <span className="text-[10px] font-medium text-foreground/80 text-center leading-tight max-w-[56px] line-clamp-2 tracking-tight">
                {app.name}
              </span>
            </div>
          ))}

          {/* Add new shortcut tile */}
          <div
            onClick={handleOpenAdd}
            className="group flex flex-col items-center gap-1.5 cursor-pointer select-none"
          >
            <div className="w-14 h-14 rounded-[18px] border-2 border-dashed border-white/20 dark:border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 active:scale-95 transition-all duration-200">
              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight max-w-[56px]">Add</span>
          </div>
        </div>
      )}

      {/* Info / Guide Box */}
      <div className="glass rounded-3xl p-5 border border-white/10 bg-secondary/15 flex gap-3.5">
        <span className="text-xl select-none">💡</span>
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-semibold text-foreground">Play Store Integration & Remote Icons</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Search popular applications when adding a shortcut to automatically fetch their official brand logo and configure 
            automated redirects. If the selected app isn't installed on your device, the system triggers the <b>Play Store / App Store download page</b> automatically.
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 overflow-y-auto">
          <div className="w-full max-w-md glass rounded-3xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {editingAppId ? "Edit App Shortcut" : "Create App Shortcut"}
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Catalog / Search Database Panel (Only for New Shortcuts) */}
            {!editingAppId && showCatalog && (
              <div className="space-y-3 p-4 rounded-2xl bg-black/20 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Search App Catalog</span>
                  <button
                    onClick={() => setShowCatalog(false)}
                    className="text-[10px] text-muted-foreground underline hover:text-foreground transition"
                  >
                    Custom Configuration
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search CapCut, WhatsApp, Netflix..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/25 border border-white/5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                {/* Catalog Grid results */}
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                  {filteredTemplates.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/5 text-left transition text-xs font-medium"
                    >
                      <div className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                        <img
                          src={getIconUrl(tpl.iconSlug)}
                          alt=""
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const f = e.currentTarget.parentElement?.querySelector(".cat-fallback");
                            if (f) f.classList.remove("hidden");
                          }}
                        />
                        <span className="cat-fallback text-xs hidden">{tpl.emoji}</span>
                      </div>
                      <span className="truncate">{tpl.name}</span>
                    </button>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-[11px] text-muted-foreground">
                      No matching brand found. Click "Custom Configuration" below.
                    </div>
                  )}
                </div>
              </div>
            )}

            {!showCatalog && !editingAppId && (
              <button
                type="button"
                onClick={() => setShowCatalog(true)}
                className="w-full py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-semibold hover:bg-primary/20 transition flex items-center justify-center gap-1.5"
              >
                <span>🔍 Open Catalog Database</span>
              </button>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* App Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                  <span>App Name</span>
                  {name && !useEmoji && (
                    <span className="text-[10px] text-primary/80 lowercase italic font-mono">
                      auto-fetching: {getIconUrl(name.toLowerCase().replace(/\s+/g, ""))}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="e.g. CapCut, Notion, WhatsApp"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    // Proactively set logo search if catalog template wasn't explicitly selected
                    if (!editingAppId && !useEmoji) {
                      setIconUrl(getIconUrl(e.target.value.toLowerCase().replace(/\s+/g, "")));
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Native Scheme & Web URL */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <span>Mobile Scheme</span>
                    <Info className="w-3 h-3 opacity-60" title="Scheme to launch the native app, e.g., whatsapp:// or capcut://" />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. capcut://"
                    value={scheme}
                    onChange={(e) => setScheme(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/25 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Web Fallback URL</label>
                  <input
                    type="text"
                    placeholder="e.g. capcut.com"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/25 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Package ID & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <span>Play Store Package ID</span>
                    <Info className="w-3 h-3 opacity-60" title="Android Package ID for redirection, e.g. com.lemon.lvoverseas" />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. com.whatsapp"
                    value={playStoreId}
                    onChange={(e) => setPlayStoreId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/25 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/25 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-background">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Icon Mode Choice */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-black/15 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Icon Selection Mode</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUseEmoji(false)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                        !useEmoji ? "bg-primary text-primary-foreground" : "bg-black/30 text-muted-foreground"
                      }`}
                    >
                      Brand Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseEmoji(true)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                        useEmoji ? "bg-primary text-primary-foreground" : "bg-black/30 text-muted-foreground"
                      }`}
                    >
                      Emoji
                    </button>
                  </div>
                </div>

                {useEmoji ? (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Pick Emoji</label>
                    <input
                      type="text"
                      placeholder="🚀"
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/25 border border-white/10 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Logo URL (Internet Link)</label>
                    <input
                      type="text"
                      placeholder="e.g. unavatar.io/simpleicons/whatsapp"
                      value={iconUrl}
                      onChange={(e) => setIconUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/25 border border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* Color Gradient Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Card Aura color</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_GRADIENTS.map((grad) => (
                    <button
                      key={grad}
                      type="button"
                      onClick={() => setSelectedGradient(grad)}
                      className={`relative h-9 rounded-lg bg-gradient-to-br ${grad} border transition-all ${
                        selectedGradient === grad ? "border-primary scale-[1.05]" : "border-white/5 hover:border-white/20"
                      }`}
                    >
                      {selectedGradient === grad && (
                        <Check className="absolute inset-0 m-auto w-4 h-4 text-primary-foreground drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-secondary text-foreground font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {editingAppId ? "Save Changes" : "Create Shortcut"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
