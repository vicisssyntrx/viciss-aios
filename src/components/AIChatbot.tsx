import React, { useState, useEffect, useRef } from "react";
import { sendMessageToAI, summarizeMemory, ChatMessage, AIProvider } from "@/lib/ai";
import { Send, Plus, MessageSquare, Menu, X, Wand2, Clock, Bot, Sparkles } from "lucide-react";
import { useTodayLog } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { useHabits, useCreateHabit, useDeleteHabit } from "@/hooks/useHabits";
import { useUpdateHabit } from "@/hooks/useUpdateHabit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { useQueryClient } from "@tanstack/react-query";

interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface ScheduledReminder {
  id: string;
  fireAt: number;
  title: string;
  body: string;
}

/** Parse a delay string like "30m", "2h", "1d" → milliseconds */
function parseDelay(delay: string): number {
  const match = delay.trim().match(/^(\d+(?:\.\d+)?)(m|h|d|s)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

function humanizeDelay(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

function saveReminders(reminders: ScheduledReminder[]) {
  localStorage.setItem("rabbit-scheduled-reminders", JSON.stringify(reminders));
}

function loadReminders(): ScheduledReminder[] {
  try {
    const saved = localStorage.getItem("rabbit-scheduled-reminders");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function AIChatbot({ onClose, isModal = false, isOpen = true }: { onClose?: () => void, isModal?: boolean, isOpen?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { sendNotification } = useNotifications();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [aiMemory, setAiMemory] = useState<string>("");
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const schedulerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Context data for the AI
  const { data: todayLog } = useTodayLog();
  const { data: stats } = useUserStats();
  const { data: habits } = useHabits();

  // Habit mutation hooks
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const updateHabit = useUpdateHabit();

  // ── Restore scheduled reminders on mount ──────────────────────────────────
  useEffect(() => {
    const stored = loadReminders();
    const now = Date.now();
    const stillPending = stored.filter(r => r.fireAt > now);
    
    // Purge expired ones
    if (stillPending.length !== stored.length) {
      saveReminders(stillPending);
    }
    setScheduledReminders(stillPending);

    // Re-arm timers for pending reminders
    stillPending.forEach(reminder => {
      const delay = reminder.fireAt - now;
      const timer = setTimeout(() => {
        sendNotification(reminder.title, reminder.body);
        setScheduledReminders(prev => {
          const next = prev.filter(r => r.id !== reminder.id);
          saveReminders(next);
          return next;
        });
        schedulerRefs.current.delete(reminder.id);
      }, delay);
      schedulerRefs.current.set(reminder.id, timer);
    });

    return () => {
      schedulerRefs.current.forEach(t => clearTimeout(t));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Schedule a new reminder ────────────────────────────────────────────────
  const scheduleReminder = (delayMs: number, title: string, body: string) => {
    const id = `reminder-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const fireAt = Date.now() + delayMs;
    const reminder: ScheduledReminder = { id, fireAt, title, body };

    setScheduledReminders(prev => {
      const next = [...prev, reminder];
      saveReminders(next);
      return next;
    });

    const timer = setTimeout(() => {
      sendNotification(title, body);
      setScheduledReminders(prev => {
        const next = prev.filter(r => r.id !== id);
        saveReminders(next);
        return next;
      });
      schedulerRefs.current.delete(id);
    }, delayMs);
    schedulerRefs.current.set(id, timer);
  };

  // ── Process action tags from Rabbit's reply ────────────────────────────────
  const processActions = async (rawReply: string): Promise<{ cleaned: string; actionFeedback: string }> => {
    const actionRegex = /<action\s+([^/]*)\s*\/>/gi;
    let actionFeedback = "";
    let match;

    while ((match = actionRegex.exec(rawReply)) !== null) {
      const attrsStr = match[1];
      const attrs: Record<string, string> = {};
      const attrRegex = /(\w+)="([^"]*)"/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2];
      }

      const type = attrs.type;

      try {
        if (type === "create_habit") {
          await createHabit.mutateAsync({
            name: attrs.name || "New Habit",
            emoji: attrs.emoji || "✅",
            outcome_name: attrs.outcome || undefined,
            outcome_emoji: attrs.outcome_emoji || undefined,
          });
          qc.invalidateQueries({ queryKey: ["habits"] });
          actionFeedback += `\n✅ Created habit: **${attrs.emoji || "✅"} ${attrs.name}**`;
        } else if (type === "delete_habit") {
          const habitToDelete = habits?.find(h => h.id === attrs.id || h.name.toLowerCase() === (attrs.name || "").toLowerCase());
          if (habitToDelete) {
            await deleteHabit.mutateAsync(habitToDelete.id);
            qc.invalidateQueries({ queryKey: ["habits"] });
            actionFeedback += `\n🗑️ Deleted habit: **${habitToDelete.emoji} ${habitToDelete.name}**`;
          }
        } else if (type === "update_habit") {
          const habitToUpdate = habits?.find(h => h.id === attrs.id || h.name.toLowerCase() === (attrs.name?.toLowerCase() || "NOMATCH"));
          if (habitToUpdate) {
            await updateHabit.mutateAsync({
              id: habitToUpdate.id,
              name: attrs.new_name || habitToUpdate.name,
              emoji: attrs.emoji || habitToUpdate.emoji,
              outcome_name: attrs.outcome || habitToUpdate.outcome_name,
              outcome_emoji: attrs.outcome_emoji || habitToUpdate.outcome_emoji,
            });
            qc.invalidateQueries({ queryKey: ["habits"] });
            actionFeedback += `\n✏️ Updated habit: **${attrs.emoji || habitToUpdate.emoji} ${attrs.new_name || habitToUpdate.name}**`;
          }
        }
      } catch (err: unknown) {
        console.error("Action execution failed:", err);
        actionFeedback += `\n⚠️ Action failed: ${(err as { message?: string })?.message || "Unknown error"}`;
      }
    }

    const cleaned = rawReply.replace(actionRegex, "").trim();
    return { cleaned, actionFeedback };
  };

  // Load from Supabase or fallback to local storage
  useEffect(() => {
    if (!isOpen) return;
    
    const loadThreads = async () => {
      let loaded = false;
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("ai_chat_threads, ai_memory")
            .eq("user_id", user.id)
            .single();
          
          if (!error && data) {
            if (data.ai_chat_threads) {
              const parsed = data.ai_chat_threads as unknown as ChatThread[];
              if (Array.isArray(parsed)) {
                setThreads(parsed);
                if (parsed.length > 0 && !activeThreadId) setActiveThreadId(parsed[0].id);
                loaded = true;
              }
            }
            if (data.ai_memory) {
              setAiMemory(data.ai_memory);
            }
          }
        } catch (e) {
          console.error("Failed to load threads from Supabase", e);
        }
      }

      if (!loaded) {
        const saved = localStorage.getItem("rabbit-ai-threads") || localStorage.getItem("rabit-ai-threads");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setThreads(parsed);
            if (parsed.length > 0 && !activeThreadId) setActiveThreadId(parsed[0].id);
            loaded = true;
          } catch (e) {
            console.error("Failed to parse chat threads", e);
          }
        }
      }
      
      if (!loaded && threads.length === 0) {
        createNewThread();
      }
    };
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen]);

  // Save to Supabase and local storage whenever threads change
  useEffect(() => {
    if (threads.length === 0) return;
    
    const saveThreads = async () => {
      const jsonStr = JSON.stringify(threads);
      localStorage.setItem("rabbit-ai-threads", jsonStr);
      
      if (user?.id) {
        try {
          await supabase
            .from("profiles")
            .update({ ai_chat_threads: JSON.parse(jsonStr) })
            .eq("user_id", user.id);
        } catch (e) {
          console.error("Failed to sync threads to Supabase", e);
        }
      }
    };
    
    // Debounce save to avoid too many writes
    const timeoutId = setTimeout(saveThreads, 1000);
    return () => clearTimeout(timeoutId);
  }, [threads, user]);

  // Scroll to bottom when active thread's messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threads, activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const createNewThread = () => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setShowHistory(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const provider = (localStorage.getItem("ai-provider") || "openrouter") as AIProvider;
    
    let apiKey = "";
    let modelId = "";

    if (provider === "google") {
      apiKey = localStorage.getItem("google-ai-key") || "";
      modelId = localStorage.getItem("google-ai-model") || "";
    } else {
      apiKey = localStorage.getItem("openrouter-key") || "";
      modelId = localStorage.getItem("openrouter-model") || "";
    }

    if (!apiKey) {
      toast.error(`Please add your ${provider === "google" ? "Google AI" : "OpenRouter"} API key in Profile settings first.`);
      return;
    }

    if (!modelId) {
      toast.error(`Please add a Model ID for ${provider === "google" ? "Google AI" : "OpenRouter"} in Profile settings first.`);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    
    let currentThreadId = activeThreadId;
    
    // Optimistically add user message
    const newMessageObj: ChatMessage = { role: "user", content: userMessage };
    
    if (!currentThreadId) {
      currentThreadId = Date.now().toString();
      const newThread: ChatThread = {
        id: currentThreadId,
        title: userMessage.slice(0, 30) + (userMessage.length > 30 ? "..." : ""),
        messages: [newMessageObj],
        updatedAt: Date.now(),
      };
      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(currentThreadId);
    } else {
      setThreads(prev => prev.map(t => {
        if (t.id === currentThreadId) {
          const title = t.messages.length === 0 ? userMessage.slice(0, 30) + (userMessage.length > 30 ? "..." : "") : t.title;
          return { ...t, title, updatedAt: Date.now(), messages: [...t.messages, newMessageObj] };
        }
        return t;
      }));
    }

    setIsLoading(true);

    try {
      // Build habit list context
      const habitList = habits?.map(h => `  - ID: ${h.id} | ${h.emoji} ${h.name}${h.outcome_name ? ` → ${h.outcome_emoji} ${h.outcome_name}` : ""}`).join("\n") || "  (none yet)";
      const completedTasks = todayLog?.completed_habits?.length || 0;

      const systemPrompt: ChatMessage = {
        role: "system",
        content: `You are Rabbit, a witty, motivating, and highly intelligent AI accountability partner for a productivity app called Viciss AIOS. 
        
Context about the user right now: 
- Current Streak: ${stats?.streak || 0} days
- Total Coins: ${stats?.coins || 0}
- Tasks completed today: ${completedTasks}
- User's current habits/tasks:
${habitList}
${aiMemory ? `\nLong-term Memories about the User:\n${aiMemory}\n` : ""}

Keep your responses concise, helpful, and formatted beautifully in markdown. Act like a friend who wants them to succeed.

ACTIONS YOU CAN TAKE:
1. NOTIFICATIONS: To send an instant push notification, output: <notify>notification text here</notify>
2. SCHEDULED REMINDERS: To schedule a future reminder, output: <schedule delay="30m" title="Reminder Title">Reminder body text</schedule>
   Valid delay formats: 30s, 5m, 2h, 1d (seconds/minutes/hours/days)
3. HABIT MANAGEMENT: To manage habits, output self-closing XML action tags:
   - Create: <action type="create_habit" name="Habit Name" emoji="💧" outcome="Outcome Name" outcome_emoji="🌊" />
   - Update: <action type="update_habit" id="habit-uuid-here" new_name="New Name" emoji="🔥" outcome="Updated Outcome" outcome_emoji="⚡" />
   - Delete: <action type="delete_habit" id="habit-uuid-here" />
   
   When updating or deleting, use the exact ID from the habit list above. You can include normal conversational text alongside these tags.
   IMPORTANT: Only use action tags when the user explicitly asks to create, change, or delete a habit/task/outcome.`
      };

      // Get history of the active thread (including the one we just added)
      const currentThread = threads.find(t => t.id === currentThreadId);
      const messageHistory = currentThread ? currentThread.messages : [];
      
      const apiMessages = [systemPrompt, ...messageHistory, newMessageObj];

      const rawReply = await sendMessageToAI(apiMessages, provider, apiKey, modelId);
      
      let finalContent = rawReply;
      let extraFeedback = "";

      // ── Process <notify> tags ──
      const notifyMatch = rawReply.match(/<notify>(.*?)<\/notify>/s);
      if (notifyMatch && notifyMatch[1]) {
        const notificationText = notifyMatch[1].trim();
        sendNotification("Rabbit says...", notificationText);
        finalContent = finalContent.replace(/<notify>.*?<\/notify>/s, "").trim();
      }

      // ── Process <schedule> tags ──
      const scheduleRegex = /<schedule\s+delay="([^"]+)"(?:\s+title="([^"]*)")?>(.*?)<\/schedule>/gs;
      let schedMatch;
      while ((schedMatch = scheduleRegex.exec(finalContent)) !== null) {
        const delay = schedMatch[1];
        const schedTitle = schedMatch[2] || "Rabbit Reminder 🥕";
        const body = schedMatch[3].trim();
        const delayMs = parseDelay(delay);
        if (delayMs > 0) {
          scheduleReminder(delayMs, schedTitle, body);
          extraFeedback += `\n⏰ Reminder scheduled in **${humanizeDelay(delayMs)}**: "${body}"`;
        }
      }
      finalContent = finalContent.replace(scheduleRegex, "").trim();

      // ── Process <action> tags ──
      const { cleaned, actionFeedback } = await processActions(finalContent);
      finalContent = cleaned;
      extraFeedback += actionFeedback;

      // Add any feedback lines
      if (extraFeedback) {
        finalContent = (finalContent ? finalContent + "\n\n---\n" : "") + extraFeedback.trim();
      }

      if (!finalContent) {
        finalContent = "Done! 🥕";
      }

      const assistantMsg: ChatMessage = { role: "assistant", content: finalContent };
      
      setThreads(prev => prev.map(t => {
        if (t.id === currentThreadId) {
          return { ...t, updatedAt: Date.now(), messages: [...t.messages, assistantMsg] };
        }
        return t;
      }));

      // Background Memory Summarization
      const userMessageCount = messageHistory.filter(m => m.role === "user").length + 1;
      if (userMessageCount % 5 === 0 && user?.id) {
        summarizeMemory(provider, apiKey, modelId, aiMemory, [...messageHistory, newMessageObj, assistantMsg])
          .then(async (newMemory) => {
            setAiMemory(newMemory);
            await supabase.from("profiles").update({ ai_memory: newMemory }).eq("user_id", user.id);
          })
          .catch(err => console.error("Background summarization failed:", err));
      }

    } catch (err: unknown) {
      console.error(err);
      toast.error((err as { message?: string })?.message || "Failed to get AI response.");
    } finally {
      setIsLoading(false);
    }
  };

  const innerContent = (
    <div className={cn(
      "w-full flex flex-col relative overflow-hidden bg-background/90 md:bg-background/80 shadow-2xl glass-strong border-border/50",
      isModal ? "h-[90vh] md:h-[85vh] md:max-w-3xl rounded-t-3xl md:rounded-3xl border-t md:border animate-in slide-in-from-bottom-10 duration-300" : "h-full rounded-3xl border animate-in fade-in zoom-in-95 duration-300"
    )}>
        
        {/* Header */}
        <div className="flex flex-none items-center justify-between p-4 border-b border-border/40 glass z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                Rabbit AI
              </span>
              <span className="text-[10px] text-muted-foreground">Powered by {localStorage.getItem("ai-provider") === "google" ? "Google AI Studio" : "OpenRouter"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Scheduled reminders indicator */}
            {scheduledReminders.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-primary text-[10px] font-semibold">
                <Clock className="w-3 h-3" />
                {scheduledReminders.length} scheduled
              </div>
            )}
            <button 
              onClick={createNewThread}
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> New
            </button>
            {isModal && onClose && (
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            )}
          </div>
        </div>

      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* History Sidebar / Drawer */}
        <div className={cn(
          "absolute inset-y-0 left-0 w-64 bg-background/95 backdrop-blur-md z-30 flex flex-col transition-transform duration-300 border-r border-border/50",
          showHistory ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 border-b border-border/30 flex items-center justify-between">
            <span className="font-bold text-sm text-foreground">Chat History</span>
            <button onClick={() => setShowHistory(false)} className="p-1 bg-secondary/50 rounded-full"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {threads.sort((a, b) => b.updatedAt - a.updatedAt).map(thread => (
              <button
                key={thread.id}
                onClick={() => { setActiveThreadId(thread.id); setShowHistory(false); }}
                className={cn(
                  "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors",
                  activeThreadId === thread.id ? "bg-primary/20 text-primary" : "hover:bg-secondary/40 text-foreground"
                )}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{thread.title}</p>
                  <p className="text-[10px] opacity-60 truncate">
                    {new Date(thread.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col w-full h-full">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeThread?.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                <Wand2 className="w-12 h-12 text-primary animate-pulse" />
                <p className="text-sm font-medium">How can I help you today?</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                  I can create habits, schedule reminders, send notifications, and track your progress — just ask!
                </p>
              </div>
            ) : (
              activeThread?.messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm prose prose-sm prose-p:my-0 prose-headings:my-0 prose-p:text-inherit prose-headings:text-inherit prose-strong:text-inherit prose-code:text-inherit prose-ul:text-inherit prose-ol:text-inherit prose-li:text-inherit prose-p:leading-relaxed prose-pre:bg-black/20 prose-pre:text-foreground",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-sm shadow-md" 
                      : "bg-secondary/80 text-foreground rounded-bl-sm border border-border/50 shadow-sm dark:prose-invert"
                  )}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-secondary/80 text-foreground rounded-bl-sm border border-border/50 flex items-center gap-2 shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-none p-3 bg-background/80 backdrop-blur-md border-t border-border/40">
            <div className="flex items-end gap-2 bg-secondary/50 rounded-2xl border border-border/50 p-1 pl-4 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-inner">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Rabbit anything... (create habits, set reminders, track progress)"
                className="flex-1 max-h-32 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none py-3"
                rows={1}
                style={{ minHeight: "44px" }}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-primary text-primary-foreground rounded-xl mb-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        </div>
      </div>
  );

  if (!isModal) {
    return innerContent;
  }

  return (
    <div className={cn("fixed inset-0 z-[100] flex flex-col items-center justify-end md:justify-center p-0 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300", !isOpen && "hidden")}>
      {innerContent}
    </div>
  );
}
