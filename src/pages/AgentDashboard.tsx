import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Plus, 
  Terminal, 
  CheckCircle2, 
  ChevronRight, 
  Trash2, 
  RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentTask {
  id: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
}

interface Agent {
  id: string;
  name: string;
  status: "active" | "idle";
  phase: string;
  currentAction: string;
  progress: number;
  tasks: AgentTask[];
  logs: string[];
}

const LOCAL_STORAGE_KEY = "vicissometer-agents-stack";

const initialAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Agent 1",
    status: "active",
    phase: "Coding",
    currentAction: "Optimizing glassmorphism CSS rendering and animations...",
    progress: 85,
    tasks: [
      { id: "t-1", description: "Design customizable start and end dates with 365-day defaults", status: "completed" },
      { id: "t-2", description: "Integrate time frame columns into Supabase user_stats schemas", status: "completed" },
      { id: "t-3", description: "Rescale Journey Insights and Outcome Cards progress equations", status: "completed" },
      { id: "t-4", description: "Optimize backdrop-filters and shadows for buttery-smooth scrolling", status: "in-progress" },
      { id: "t-5", description: "Verify production build and confirm push to GitHub origin/main", status: "pending" }
    ],
    logs: [
      "[12:10:00] 📡 Agent 1 connection established successfully.",
      "[12:12:15] 🔍 Analyzing habit statistics & calendar models...",
      "[12:15:30] 📝 Formulated timeframe SQL migration script.",
      "[12:20:45] ⚙️ Updated Supabase typescript types inside types.ts.",
      "[12:35:10] 💻 Injected End Date picker popovers into AccountCenter.tsx.",
      "[12:45:00] 📦 Timeframe logic production build compiled successfully."
    ]
  },
  {
    id: "agent-2",
    name: "Agent 2",
    status: "idle",
    phase: "Idle",
    currentAction: "Idle. All habits and streaks verified.",
    progress: 100,
    tasks: [
      { id: "t-2-1", description: "Validate streak calendar logic for missing days", status: "completed" },
      { id: "t-2-2", description: "Audit RLS policies for active user sessions", status: "completed" }
    ],
    logs: [
      "[11:45:00] 📡 Agent 2 active.",
      "[11:50:30] 📋 Validated 28-day habits data consistency.",
      "[12:00:00] 📦 Synced locks with Vercel edge deployment."
    ]
  }
];

export default function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string>("agent-1");
  const [isLoading, setIsLoading] = useState(true);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Initialize and load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setAgents(JSON.parse(saved));
      } catch (e) {
        setAgents(initialAgents);
      }
    } else {
      setAgents(initialAgents);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialAgents));
    }
    setIsLoading(false);
  }, []);

  // Poll agent-status.json to sync Agent 1's real-time state
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/agent-status.json?t=" + new Date().getTime());
        if (res.ok) {
          const json = await res.json();
          setAgents(prev => {
            const next = prev.map(a => {
              if (a.id === "agent-1") {
                return {
                  ...a,
                  status: json.status || a.status,
                  phase: json.phase || a.phase,
                  currentAction: json.currentAction || a.currentAction,
                  progress: json.progress ?? a.progress,
                  tasks: json.tasks || a.tasks,
                  logs: json.logs || a.logs
                };
              }
              return a;
            });
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        }
      } catch (err) {
        console.warn("Failed to fetch real-time agent status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll terminal logs to bottom on update
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [selectedId, agents]);

  const handleCreateAgent = () => {
    const nextNum = agents.length + 1;
    const newAgent: Agent = {
      id: `agent-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2)}`,
      name: `Agent ${nextNum}`,
      status: "idle",
      phase: "Idle",
      currentAction: "Ready and waiting for new habits or instructions...",
      progress: 100,
      tasks: [
        { id: `t-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2)}`, description: "Awaiting instructions...", status: "pending" }
      ],
      logs: [
        `[${new Date().toLocaleTimeString()}] 📡 Agent ${nextNum} initialized successfully.`
      ]
    };
    const updated = [...agents, newAgent];
    setAgents(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setSelectedId(newAgent.id);
    toast.success(`Agent ${nextNum} interface generated successfully!`);
  };

  const handleDeleteAgent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === "agent-1" || id === "agent-2") {
      toast.error("Core agents (Agent 1 and Agent 2) cannot be deleted.");
      return;
    }
    const updated = agents.filter(a => a.id !== id);
    setAgents(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (selectedId === id) {
      setSelectedId("agent-1");
    }
    toast.success("Agent removed from stack.");
  };

  const activeAgent = agents.find(a => a.id === selectedId) || agents[0];

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="animate-spin h-8 w-8 text-primary" />
        <p className="text-muted-foreground font-medium text-xs tracking-wider uppercase font-mono">Syncing Agents Stack...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[860px] grid grid-cols-1 md:grid-cols-12 gap-5 mt-2 animate-fade-in relative z-10 pb-20">
      
      {/* LEFT: Agents Stack Sidebar (md:col-span-4) */}
      <div className="md:col-span-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Agents Stack</h3>
          <button 
            onClick={handleCreateAgent}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-semibold text-foreground select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </div>

        <div className="space-y-2 max-h-[380px] md:max-h-[500px] overflow-y-auto pr-1">
          {agents.map(agent => {
            const isSelected = agent.id === selectedId;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedId(agent.id)}
                className={cn(
                  "glass rounded-xl p-3 flex items-start gap-3 cursor-pointer transition-all duration-300 relative group overflow-hidden border",
                  isSelected 
                    ? "bg-white/5 border-primary/45 shadow-[0_4px_16px_rgba(239,68,68,0.12)]" 
                    : "bg-transparent border-white/5 hover:border-white/20"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Bot className={cn(
                    "w-5 h-5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{agent.name}</span>
                    {agent.status === "active" && (
                      /* Static Orange Circle for active process */
                      <div className="h-2 w-2 rounded-full bg-[#f97316] shadow-[0_0_6px_rgba(249,115,22,0.6)] shrink-0" />
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{agent.phase}</p>
                  <p className="text-xs text-muted-foreground/80 truncate mt-1 leading-normal">{agent.currentAction}</p>
                </div>
                
                {/* Delete button (hidden for permanent Agents 1 & 2) */}
                {agent.id !== "agent-1" && agent.id !== "agent-2" && (
                  <button
                    onClick={(e) => handleDeleteAgent(agent.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity text-destructive shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Active Agent Details (md:col-span-8) */}
      <div className="md:col-span-8 space-y-4">
        {activeAgent ? (
          <>
            {/* Header / Active Progress */}
            <div className="glass rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    {activeAgent.name} Status Report
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">
                    State: {activeAgent.phase}
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/20">
                  {activeAgent.status}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground truncate">
                  🚀 {activeAgent.currentAction}
                </p>
                
                {/* Progress bar */}
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden p-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-orange-500 to-[#fbbf24] rounded-full transition-all duration-700 relative"
                    style={{ width: `${activeAgent.progress}%` }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[1px] rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                  <span>INIT</span>
                  <span className="text-primary font-bold text-xs">{activeAgent.progress}% COMPLETED</span>
                  <span>SYNCED</span>
                </div>
              </div>
            </div>

            {/* Checklist Tasks */}
            <div className="glass rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2.5 px-1">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Process Checklist</h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {activeAgent.tasks.filter(t => t.status === "completed").length}/{activeAgent.tasks.length} Resolved
                </span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {activeAgent.tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-xl border transition-all duration-200",
                      task.status === "completed" 
                        ? "bg-[#4ade80]/5 border-[#4ade80]/15 text-muted-foreground"
                        : task.status === "in-progress"
                        ? "bg-primary/5 border-primary/20 shadow-[0_2px_8px_rgba(239,68,68,0.06)] text-foreground font-medium"
                        : "bg-secondary/15 border-border/25 text-muted-foreground"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
                      ) : task.status === "in-progress" ? (
                        /* Static Orange Circle (lag-free, no fast blinking) */
                        <div className="h-3.5 w-3.5 rounded-full bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.6)] shrink-0 mt-0.5" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs leading-normal truncate",
                        task.status === "completed" ? "line-through opacity-70" : ""
                      )}>
                        {task.description}
                      </p>
                    </div>
                  </div>
                ))}

                {activeAgent.tasks.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground italic">
                    No active tasks currently registered.
                  </div>
                )}
              </div>
            </div>

            {/* Terminal logs */}
            <div className="glass rounded-2xl p-4 relative overflow-hidden group">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_70%,rgba(0,0,0,0.3)_100%)] z-20" />
              
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/20">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Detailed Terminal Logs</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shrink-0" />
                  <span className="text-[8px] font-mono text-[#4ade80] uppercase tracking-wider">Synced</span>
                </div>
              </div>

              <div 
                ref={terminalContainerRef}
                className="h-[140px] overflow-y-auto pr-1 font-mono text-[10px] leading-relaxed space-y-1.5 bg-[#070708] border border-border/30 rounded-xl p-3 text-muted-foreground scrollbar-none relative"
              >
                {activeAgent.logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-primary/70 select-none">&gt;&gt;</span>
                    <span className="text-foreground/95 whitespace-pre-wrap leading-normal">{log}</span>
                  </div>
                ))}

                <div className="flex gap-2 items-center text-primary/70 font-bold">
                  <span>&gt;&gt;</span>
                  <span className="w-2 h-3.5 bg-primary/70 animate-blink" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground text-xs italic">
            Select an agent from the stack to inspect details.
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 400ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  );
}
