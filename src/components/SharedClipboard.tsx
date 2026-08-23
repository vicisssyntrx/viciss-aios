import { useState, useRef } from "react";
import { useClipboard, ClipboardItem } from "@/hooks/useClipboard";
import { ClipboardPaste, Code, FileText, Trash, Copy, Check, Upload, Trash2, RefreshCcw, Download, File } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SharedClipboard({ isMobile = false }: { isMobile?: boolean }) {
  const { 
    activeItems, recycledItems, totalSize, maxItems, maxSizeBytes, isLoading, 
    addItem, isAdding, 
    uploadFile, isUploading,
    softDeleteItem, restoreItem, hardDeleteItem 
  } = useClipboard();
  
  const [content, setContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [view, setView] = useState<'active' | 'recycled'>('active');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdd = async () => {
    if (!content.trim()) return;
    try {
      let type: 'text' | 'code' = 'text';
      if (content.includes("const ") || content.includes("function") || content.includes("import ") || content.includes("<div")) {
        type = 'code';
      }
      
      await addItem({ content_type: type, content });
      setContent("");
      toast.success("Added to Shared Clipboard!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save. Make sure the database is updated.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 100MB.");
      return;
    }

    try {
      toast.loading("Uploading file...", { id: "upload" });
      await uploadFile(file);
      toast.success("File uploaded successfully!", { id: "upload" });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      toast.error(e.message || "Failed to upload file. Check storage configuration.", { id: "upload" });
    }
  };

  const items = view === 'active' ? activeItems : recycledItems;

  const renderItemActions = (item: ClipboardItem) => {
    if (view === 'active') {
      return (
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {item.content_type === 'file' ? (
            <a 
              href={item.content} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-1.5 hover:bg-primary/20 rounded-md text-foreground transition-colors"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
            </a>
          ) : (
            <button 
              onClick={() => handleCopy(item.content, item.id)}
              className="p-1.5 hover:bg-primary/20 rounded-md text-foreground transition-colors"
              title="Copy"
            >
              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
            </button>
          )}
          <button 
            onClick={() => {
              softDeleteItem(item.id).then(() => toast.success("Moved to Recycle Bin")).catch(() => toast.error("Failed to delete"));
            }}
            className="p-1.5 hover:bg-destructive/20 rounded-md text-destructive transition-colors"
            title="Delete (Move to Recycle Bin)"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // Recycle bin actions
    return (
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => {
            restoreItem(item.id).then(() => toast.success("Restored!")).catch(() => toast.error("Failed to restore"));
          }}
          className="p-1.5 hover:bg-green-500/20 rounded-md text-green-500 transition-colors flex items-center gap-1"
          title="Restore"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => {
            hardDeleteItem(item).then(() => toast.success("Permanently Deleted")).catch(() => toast.error("Failed to delete permanently"));
          }}
          className="p-1.5 hover:bg-destructive/20 rounded-md text-destructive transition-colors flex items-center gap-1"
          title="Permanently Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      isMobile ? "p-2 w-full pt-4" : "glass rounded-2xl p-4 sm:p-5 h-[320px]"
    )}>
      
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            {view === 'active' ? <ClipboardPaste className="w-4 h-4 text-primary" /> : <Trash2 className="w-4 h-4 text-destructive" />}
            {view === 'active' ? (isMobile ? "Share It" : "Shared Clipboard") : "Recycle Bin"}
          </h3>
          <button
            onClick={() => setView(view === 'active' ? 'recycled' : 'active')}
            className="text-xs font-semibold px-2 py-1 bg-secondary/50 hover:bg-secondary/80 rounded-md transition-colors"
          >
            {view === 'active' ? "View Recycle Bin" : "Back to Active"}
          </button>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 border-b border-border/20 pb-1">
          <span>Items: {activeItems.length}/{maxItems}</span>
          <span>Storage: {(totalSize / (1024 * 1024)).toFixed(1)}/{(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {view === 'active' && (
          <div className="relative">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste text, code, or links here..."
              className="w-full bg-secondary/40 border border-border/40 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none h-[80px] pb-10"
            />
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-2 left-2 p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="Upload File (Max 100MB)"
            >
              <Upload className={cn("w-4 h-4", isUploading && "animate-pulse text-primary")} />
            </button>

            <Button 
              size="sm" 
              onClick={handleAdd}
              disabled={isAdding || !content.trim()}
              className="absolute bottom-2 right-2 h-7 px-3 text-[10px] rounded-lg"
            >
              {isAdding ? "Saving..." : "Save"}
            </Button>
          </div>
        )}

        {view === 'recycled' && recycledItems.length > 0 && (
          <div className="text-xs text-muted-foreground bg-destructive/10 text-destructive/80 p-2 rounded-lg text-center flex items-center justify-between">
            <span>Items are auto-deleted after 30 days.</span>
            <button 
              onClick={() => {
                const p = recycledItems.map(item => hardDeleteItem(item));
                Promise.all(p).then(() => toast.success("Recycle Bin Emptied"));
              }}
              className="underline font-bold hover:text-destructive transition-colors"
            >
              Empty All
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-4">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4 animate-pulse">Loading clipboard...</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground opacity-60">
              {view === 'active' ? (
                <>
                  <ClipboardPaste className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs text-center px-4">Your shared clipboard is empty. Paste text or upload files to sync across devices.</p>
                </>
              ) : (
                <>
                  <Trash2 className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs text-center px-4">Recycle bin is empty.</p>
                </>
              )}
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className={cn("bg-secondary/30 border border-border/30 rounded-xl p-3 flex flex-col group relative overflow-hidden", view === 'recycled' && "opacity-70")}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    {item.content_type === 'code' && <Code className="w-3 h-3 text-blue-400" />}
                    {item.content_type === 'text' && <FileText className="w-3 h-3 text-orange-400" />}
                    {item.content_type === 'file' && <Upload className="w-3 h-3 text-green-400" />}
                    {item.content_type === 'file' ? 'FILE' : item.content_type}
                    
                    {/* Age indicator */}
                    <span className="ml-2 font-mono text-[8px] opacity-50">
                      {(() => {
                        const ageHrs = (new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
                        if (ageHrs < 1) return '< 1h';
                        if (ageHrs < 24) return `${Math.floor(ageHrs)}h`;
                        return `${Math.floor(ageHrs / 24)}d`;
                      })()}
                    </span>
                  </span>
                  
                  {renderItemActions(item)}
                </div>
                
                {item.content_type === 'file' ? (
                  <div className="text-xs font-semibold text-primary flex items-center gap-2">
                    <File className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.file_name || 'Uploaded File'}</span>
                    {item.file_size !== undefined && (
                      <span className="text-[10px] text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                        {(item.file_size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-foreground/90 whitespace-pre-wrap font-mono break-all relative">
                    {(() => {
                      const maxLines = isMobile ? 2 : 4;
                      const isLong = item.content.length > 200 || item.content.split('\n').length > maxLines;
                      const isExpanded = expandedItems.has(item.id);
                      
                      if (isLong && !isExpanded) {
                        // Provide a short preview based on length and lines
                        const charTruncated = item.content.length > 200 ? item.content.substring(0, 200) : item.content;
                        const lines = charTruncated.split('\n');
                        const preview = lines.length > maxLines ? lines.slice(0, maxLines).join('\n') : charTruncated;
                        
                        return (
                          <>
                            {preview}
                            <span className="opacity-60">... </span>
                            <button 
                              onClick={() => toggleExpand(item.id)}
                              className="text-primary font-bold hover:underline text-[11px]"
                            >
                              Read more
                            </button>
                          </>
                        );
                      }
                      
                      return (
                        <>
                          {item.content}
                          {isLong && isExpanded && (
                            <button 
                              onClick={() => toggleExpand(item.id)}
                              className="text-primary font-bold hover:underline text-[11px] block mt-1"
                            >
                              Show less
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
