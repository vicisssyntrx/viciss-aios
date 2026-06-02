import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Grid, Search, Sparkles, Check, X, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface AppShortcut {
  id: string;
  name: string;
  url: string;
  emoji: string;
  category: string;
  bgColor: string; // Tailwind/custom CSS gradient class or hex
}

const LOCAL_STORAGE_KEY = "vicissometer-apps-shortcuts";

const initialApps: AppShortcut[] = [
  {
    id: "capcut",
    name: "CapCut",
    url: "https://www.capcut.com",
    emoji: "🎬",
    category: "Creative",
    bgColor: "from-blue-600/35 to-indigo-600/35",
  },
  {
    id: "notion",
    name: "Notion",
    url: "https://www.notion.so",
    emoji: "📓",
    category: "Productivity",
    bgColor: "from-amber-600/35 to-orange-600/35",
  },
  {
    id: "spotify",
    name: "Spotify",
    url: "spotify:",
    emoji: "🎵",
    category: "Music",
    bgColor: "from-emerald-600/35 to-teal-600/35",
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com",
    emoji: "📺",
    category: "Entertainment",
    bgColor: "from-rose-600/35 to-red-600/35",
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

export default function AppsDashboard() {
  const [apps, setApps] = useState<AppShortcut[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Modal / Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [emoji, setEmoji] = useState("🚀");
  const [category, setCategory] = useState("Tools");
  const [selectedGradient, setSelectedGradient] = useState(PRESET_GRADIENTS[0]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setApps(JSON.parse(saved));
      } catch (e) {
        setApps(initialApps);
      }
    } else {
      setApps(initialApps);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialApps));
    }
  }, []);

  // Save to localStorage
  const saveToStorage = (updatedApps: AppShortcut[]) => {
    setApps(updatedApps);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedApps));
  };

  const handleOpenAdd = () => {
    setName("");
    setUrl("");
    setEmoji("🚀");
    setCategory("Tools");
    setSelectedGradient(PRESET_GRADIENTS[Math.floor(Math.random() * PRESET_GRADIENTS.length)]);
    setEditingAppId(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (app: AppShortcut) => {
    setName(app.name);
    setUrl(app.url);
    setEmoji(app.emoji);
    setCategory(app.category);
    setSelectedGradient(app.bgColor);
    setEditingAppId(app.id);
    setIsAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast.error("Please fill in both Name and URL/Shortcut Path");
      return;
    }

    // Format URL if it doesn't look like a protocol or web URL
    let formattedUrl = url.trim();
    if (!formattedUrl.includes("://") && !formattedUrl.endsWith(":") && !formattedUrl.startsWith("mailto:") && !formattedUrl.startsWith("tel:")) {
      // If it looks like a domain, prepend https://
      if (formattedUrl.includes(".") && !formattedUrl.includes(" ")) {
        formattedUrl = "https://" + formattedUrl;
      }
    }

    if (editingAppId) {
      // Edit existing
      const updated = apps.map((app) =>
        app.id === editingAppId
          ? { ...app, name: name.trim(), url: formattedUrl, emoji: emoji.trim() || "🚀", category, bgColor: selectedGradient }
          : app
      );
      saveToStorage(updated);
      toast.success("Shortcut updated!");
    } else {
      // Create new
      const newApp: AppShortcut = {
        id: Date.now().toString(),
        name: name.trim(),
        url: formattedUrl,
        emoji: emoji.trim() || "🚀",
        category,
        bgColor: selectedGradient,
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

  const handleLaunch = (url: string) => {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error("Could not launch this shortcut. Check the format.");
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-6">
      {/* Header card with glass style */}
      <div
        className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 1px 1px 0px rgba(255,255,255,0.2)",
        }}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Apps Dock
              <span className="glass px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold tracking-wider text-primary/80 border border-primary/20">Local Dashboard</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            Instantly launch and control all your desktop, web, or custom deep-link applications. Add customized local shortcuts accessible on both desktop and mobile version.
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

        {/* Category filters (horizontal scrollable on mobile) */}
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

      {/* Grid of Shortcut Cards */}
      {filteredApps.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-2xl mb-4">🔮</div>
          <h3 className="font-semibold text-lg text-foreground mb-1">No shortcuts found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {searchQuery || selectedCategory !== "All"
              ? "Try adjusting your search query or switching categories."
              : "Start adding shortcuts to Wondershare Filmora, CapCut, Notion, YouTube, or your favorite mobile and desktop applications!"}
          </p>
          {!searchQuery && selectedCategory === "All" && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First App Shortcut</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleLaunch(app.url)}
              className="group relative flex flex-col items-center justify-between p-5 rounded-2xl cursor-pointer overflow-hidden border transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "rgba(0,0,0,0.15)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15), inset 1px 1px 0px rgba(255,255,255,0.06)",
              }}
            >
              {/* Dynamic colored background glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${app.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />

              {/* Action Buttons for Custom shortcuts */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(app);
                  }}
                  className="p-1.5 rounded-lg bg-black/45 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 border border-white/5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit Shortcut"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDelete(app.id, e)}
                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                  title="Delete Shortcut"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Emoji Badge with premium glass container */}
              <div className="relative mt-2 mb-4 w-14 h-14 rounded-2xl bg-white/5 dark:bg-white/10 border border-white/15 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {app.emoji}
              </div>

              {/* Text Info */}
              <div className="text-center w-full space-y-1">
                <h4 className="font-semibold text-sm text-foreground tracking-tight truncate px-1">
                  {app.name}
                </h4>
                <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase font-mono bg-white/5 dark:bg-black/20 px-2 py-0.5 rounded-full inline-block">
                  {app.category}
                </p>
              </div>

              {/* Launch Link Indicator at bottom */}
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-primary opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform translate-y-0 sm:translate-y-1 sm:group-hover:translate-y-0">
                <span>Launch</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info / Guide Box */}
      <div className="glass rounded-3xl p-5 border border-white/10 bg-secondary/15 flex gap-3.5">
        <span className="text-xl select-none">💡</span>
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-semibold text-foreground">Deep Links & Local Applications Guide</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You can add custom URLs for websites (e.g. <code>youtube.com</code>), or custom deep links / protocol handlers to trigger local apps on desktop or mobile. 
            For example: Notion (<code>notion://</code>), Spotify (<code>spotify:</code>), Mail (<code>mailto:someone@example.com</code>), or custom system links.
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div
            className="w-full max-w-md glass rounded-3xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.35), inset 1px 1px 0px rgba(255,255,255,0.25)",
            }}
          >
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* App Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">App Name</label>
                <input
                  type="text"
                  placeholder="e.g. CapCut, Notion, Photoshop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* URL or Deep Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">URL / Shortcut Link</label>
                <input
                  type="text"
                  placeholder="e.g. capcut.com, notion://, spotify:"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Emoji & Category row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Emoji Icon</label>
                  <input
                    type="text"
                    placeholder="e.g. 🚀, 🎬, 📓"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/25 border border-white/10 text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
