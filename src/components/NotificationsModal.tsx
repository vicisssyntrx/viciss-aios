import React, { useEffect } from "react";
import { X, BellRing, CheckCircle2, Trash2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export default function NotificationsModal({ onClose }: { onClose: () => void }) {
  const { logs, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    // Mark as read when the modal is unmounted or opened
    return () => {
      markAllAsRead();
    };
  }, [markAllAsRead]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end md:justify-center p-0 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-[85vh] md:h-[60vh] md:max-w-md flex flex-col relative overflow-hidden bg-background/90 rounded-t-3xl md:rounded-3xl border-t md:border border-border/50 shadow-2xl glass-strong animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="flex flex-none items-center justify-between p-4 border-b border-border/40 glass z-20">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button 
                onClick={clearAll}
                className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                title="Clear All"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          {logs.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 space-y-3">
              <BellRing className="w-12 h-12 text-primary" />
              <p className="text-sm font-medium">No notifications yet!</p>
            </div>
          ) : (
            logs.map(log => (
              <div 
                key={log.id} 
                className={cn(
                  "p-4 rounded-2xl border transition-colors",
                  log.read ? "bg-secondary/20 border-border/30" : "bg-primary/10 border-primary/30"
                )}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-bold text-sm text-foreground">{log.title}</h3>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{log.body}</p>
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  );
}
