import React, { useState, useEffect, useRef } from "react";
import { sendMessageToAI, ChatMessage, AIProvider } from "@/lib/ai";
import { Send, Plus, MessageSquare, Menu, X, Wand2, ArrowLeft } from "lucide-react";
import { useTodayLog } from "@/hooks/useDailyLogs";
import { useUserStats } from "@/hooks/useUserStats";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export default function AIChatbot({ onClose }: { onClose: () => void }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context data for the AI
  const { data: todayLog } = useTodayLog();
  const { data: stats } = useUserStats();

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("rabit-ai-threads");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse chat threads", e);
      }
    } else {
      createNewThread();
    }
  }, []);

  // Save to local storage whenever threads change
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem("rabit-ai-threads", JSON.stringify(threads));
    }
  }, [threads]);

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
    if (!input.trim() || !activeThreadId) return;

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
    
    // Optimistically add user message
    const newMessageObj: ChatMessage = { role: "user", content: userMessage };
    
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        // Auto-generate title for new threads based on first message
        const title = t.messages.length === 0 ? userMessage.slice(0, 30) + (userMessage.length > 30 ? "..." : "") : t.title;
        return { ...t, title, updatedAt: Date.now(), messages: [...t.messages, newMessageObj] };
      }
      return t;
    }));

    setIsLoading(true);

    try {
      // Build context for System Prompt
      const completedTasks = todayLog?.completed_habits?.length || 0;
      const systemPrompt: ChatMessage = {
        role: "system",
        content: `You are Rabit, a witty, motivating, and highly intelligent AI accountability partner for a productivity app called Vicissometer. 
        Context about the user right now: 
        - Current Streak: ${stats?.streak || 0} days
        - Total Coins: ${stats?.coins || 0}
        - Tasks completed today: ${completedTasks}
        Keep your responses concise, helpful, and formatted beautifully in markdown. Act like a friend who wants them to succeed.`
      };

      // Get history of the active thread (including the one we just added)
      const currentThread = threads.find(t => t.id === activeThreadId);
      const messageHistory = currentThread ? currentThread.messages : [];
      
      const apiMessages = [systemPrompt, ...messageHistory, newMessageObj];

      const reply = await sendMessageToAI(apiMessages, provider, apiKey, modelId);

      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, updatedAt: Date.now(), messages: [...t.messages, assistantMsg] };
        }
        return t;
      }));

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to get AI response.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end md:justify-center p-0 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-[90vh] md:h-[85vh] md:max-w-3xl flex flex-col relative overflow-hidden bg-background/90 md:bg-background/80 rounded-t-3xl md:rounded-3xl border-t md:border border-border/50 shadow-2xl glass-strong animate-in slide-in-from-bottom-10 duration-300">
        
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
              <span className="font-bold text-foreground flex items-center gap-1.5"><Wand2 className="w-4 h-4 text-primary" /> Rabit AI</span>
            <span className="text-[10px] text-muted-foreground">Powered by {localStorage.getItem("ai-provider") === "google" ? "Google AI Studio" : "OpenRouter"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={createNewThread}
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> New
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
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
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-sm shadow-md" 
                      : "bg-secondary/80 text-foreground rounded-bl-sm border border-border/50 shadow-sm"
                  )}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
                placeholder="Ask Rabit anything..."
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
    </div>
  );
}
