import { useState } from "react";
import { Share2, ChefHat, Train, X, Copy, Check, ClipboardPaste } from "lucide-react";
import { cn } from "@/lib/utils";
import SharedClipboard from "@/components/SharedClipboard";
import MessMateTool from "@/components/tools/MessMateTool";
import MetroTool from "@/components/tools/MetroTool";
import { useClipboard } from "@/hooks/useClipboard";
import { toast } from "sonner";

type ToolKey = "shareit" | "messmate" | "metro" | null;

// ── Bottom Sheet wrapper ─────────────────────────────────────────────────────
function ToolSheet({
  open,
  onClose,
  title,
  icon,
  iconBg,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col justify-end md:justify-center md:items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full bg-background/95 backdrop-blur-xl border-t md:border md:rounded-3xl md:max-w-lg md:max-h-[85vh] shadow-2xl flex flex-col",
          "rounded-t-3xl max-h-[92vh] animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Pull bar */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-none">
          <div className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 flex-none">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
              {icon}
            </div>
            <span className="text-base font-black text-foreground">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({
  onClick,
  icon,
  iconBg,
  title,
  subtitle,
  children,
  accentClass,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accentClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left glass rounded-2xl p-4 flex flex-col gap-3 border border-border/30 hover:border-primary/30 active:scale-[0.98] transition-all duration-200 group relative overflow-hidden"
      )}
    >
      {/* Accent glow on hover */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300", accentClass)} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-none", iconBg)}>
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
        <span className="ml-auto text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          Open →
        </span>
      </div>

      {/* Preview */}
      <div className="border-t border-border/20 pt-2.5 w-full">
        {children}
      </div>
    </button>
  );
}

// ── Share It Preview ─────────────────────────────────────────────────────────
function ShareItPreview() {
  const { activeItems, isLoading } = useClipboard();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const latest = activeItems.slice(0, 3);

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <p className="text-[11px] text-muted-foreground animate-pulse">Loading clipboard...</p>
    );
  }

  if (latest.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground opacity-60">
        <ClipboardPaste className="w-4 h-4" />
        <p className="text-[11px]">Clipboard is empty — tap to add items</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {latest.map(item => (
        <div key={item.id} className="flex items-center gap-2 bg-secondary/30 rounded-xl px-2.5 py-1.5">
          <span className="flex-1 text-[11px] text-foreground/80 truncate font-mono">
            {item.content_type === "file" ? `📎 ${item.file_name}` : item.content}
          </span>
          {item.content_type !== "file" && (
            <button
              onClick={(e) => handleCopy(e, item.content, item.id)}
              className="p-1 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              {copiedId === item.id
                ? <Check className="w-3.5 h-3.5 text-green-400" />
                : <Copy className="w-3.5 h-3.5" />
              }
            </button>
          )}
        </div>
      ))}
      {activeItems.length > 3 && (
        <p className="text-[10px] text-muted-foreground text-right">+{activeItems.length - 3} more items</p>
      )}
    </div>
  );
}

// ── Main ToolsHub ────────────────────────────────────────────────────────────
export default function ToolsHub({ isMobile = false }: { isMobile?: boolean }) {
  const [openTool, setOpenTool] = useState<ToolKey>(null);
  const closeTool = () => setOpenTool(null);

  return (
    <div className={cn(isMobile ? "p-2 pt-4 w-full" : "space-y-4 h-full")}>
      {/* Page Title */}
      {isMobile && (
        <h3 className="mt-2 flex items-center gap-3 leading-none font-black px-1 text-foreground text-[3.8rem]">
          🧰 Tools
        </h3>
      )}

      <div className="space-y-3 mt-2">
        {/* Card 1: Share It */}
        <ToolCard
          onClick={() => setOpenTool("shareit")}
          icon={<Share2 className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/20"
          title="Share It"
          subtitle="Cross-device clipboard & file sync"
          accentClass="bg-blue-500"
        >
          <ShareItPreview />
        </ToolCard>

        {/* Card 2: NFSU Mess Mate */}
        <ToolCard
          onClick={() => setOpenTool("messmate")}
          icon={<ChefHat className="w-5 h-5 text-indigo-400" />}
          iconBg="bg-indigo-500/20"
          title="NFSU Mess Mate"
          subtitle="Live campus dining menu"
          accentClass="bg-indigo-500"
        >
          <MessMateTool compact />
        </ToolCard>

        {/* Card 3: AMD Metro */}
        <ToolCard
          onClick={() => setOpenTool("metro")}
          icon={<Train className="w-5 h-5 text-amber-400" />}
          iconBg="bg-amber-500/20"
          title="AMD Metro"
          subtitle="Ahmedabad–Gandhinagar rail schedule"
          accentClass="bg-amber-500"
        >
          <MetroTool compact />
        </ToolCard>
      </div>

      {/* ── Bottom Sheets ─────────────────────────────────────────────────── */}
      <ToolSheet
        open={openTool === "shareit"}
        onClose={closeTool}
        title="Share It"
        icon={<Share2 className="w-4 h-4 text-blue-400" />}
        iconBg="bg-blue-500/20"
      >
        <SharedClipboard isMobile />
      </ToolSheet>

      <ToolSheet
        open={openTool === "messmate"}
        onClose={closeTool}
        title="NFSU Mess Mate"
        icon={<ChefHat className="w-4 h-4 text-indigo-400" />}
        iconBg="bg-indigo-500/20"
      >
        <MessMateTool />
      </ToolSheet>

      <ToolSheet
        open={openTool === "metro"}
        onClose={closeTool}
        title="AMD Metro"
        icon={<Train className="w-4 h-4 text-amber-400" />}
        iconBg="bg-amber-500/20"
      >
        <MetroTool />
      </ToolSheet>
    </div>
  );
}
