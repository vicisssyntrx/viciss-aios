import { useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthProvider";
import PwaInstallManager from "@/components/PwaInstallManager";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AgentDashboard from "./pages/AgentDashboard";
import NotFound from "./pages/NotFound";

// QueryClient is created once at the module level so it persists across re-renders.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // exponential backoff
      staleTime: 0, // 0 ensures data is ALWAYS refetched in background on load/focus
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days of cache memory
      refetchOnWindowFocus: true,  // syncs cross-device on tab switch
      refetchOnReconnect: true,
    },
  },
});

const CACHE_KEY = "vicissometer_react_query_cache";

// 1. Hydrate the query cache instantly from local storage on load
try {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const state = JSON.parse(cached);
    state.forEach((query: any) => {
      if (query.state && query.state.data !== undefined) {
        queryClient.setQueryData(query.queryKey, query.state.data, {
          updatedAt: query.state.dataUpdatedAt,
        });
      }
    });
  }
} catch (e) {
  console.warn("Failed to hydrate cache", e);
}

// 2. Persist query cache to local storage whenever it changes (debounced)
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" || event.type === "added" || event.type === "removed") {
    clearTimeout((window as any)._persisterTimeout);
    (window as any)._persisterTimeout = setTimeout(() => {
      const state = queryClient.getQueryCache().getAll().map(query => ({
        queryKey: query.queryKey,
        state: query.state,
      }));
      localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    }, 1000);
  }
});

function AppInner() {
  // Stable ref so the callback identity doesn't change across renders.
  const prevUserIdRef = useRef<string | null>(null);

  const handleAuthChange = useCallback((userId: string | null) => {
    // When the active user changes (logout or switch), blow away ALL cached
    // query data so the new user's data is fetched fresh from Supabase.
    if (prevUserIdRef.current !== userId) {
      // We only want to wipe the cache if we previously had an active user.
      // If we are just initializing from null (e.g., refresh or first login),
      // we shouldn't wipe the cache because Dashboard queries might already be in-flight!
      if (prevUserIdRef.current !== null) {
        queryClient.removeQueries(); // hard-remove to avoid showing old user data
        console.log("[Auth] User changed to", userId, "— cleared React Query cache");
      }
      prevUserIdRef.current = userId;
    }
  }, []);

  return (
    <AuthProvider onAuthChange={handleAuthChange}>
      <TooltipProvider>
        <Sonner />
        <PwaInstallManager />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
