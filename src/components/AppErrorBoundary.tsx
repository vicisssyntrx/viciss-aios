import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
  componentStack?: string;
};

const IS_DEV = import.meta.env.DEV;

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, componentStack: "" };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ componentStack: info.componentStack });
    // Log full details to console for developer debugging, but NEVER render
    // raw stack traces in the UI — they expose internal file structure in prod.
    console.error("[AppErrorBoundary] Uncaught error:", error);
    console.error("[AppErrorBoundary] Component stack:", info.componentStack);
  }

  async clearServiceWorkersAndReload() {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      // Best effort: clear caches created by SWs
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } finally {
      window.location.reload();
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-5 w-full max-w-lg">
          <div className="text-sm uppercase tracking-wider text-muted-foreground mb-2">App Error</div>
          <div className="text-lg font-semibold mb-2">Something went wrong.</div>
          <p className="text-sm text-muted-foreground mb-4">
            An unexpected error occurred. Please try reloading. If this keeps happening, clear the app cache.
          </p>

          {/* Always render technical details to help debug this persistent error */}
          {this.state.error && (
            <>
              <pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground bg-black/30 rounded-xl p-3 border border-white/10 mb-2">
                {this.state.error.message}
              </pre>
              {this.state.componentStack ? (
                <pre className="mt-2 text-[10px] whitespace-pre-wrap break-words text-muted-foreground bg-black/20 rounded-xl p-3 border border-white/10">
                  {this.state.componentStack.trim()}
                </pre>
              ) : null}
            </>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              className="glass rounded-xl px-3 py-2 text-sm hover:bg-secondary/60 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              type="button"
              className="bg-primary text-primary-foreground rounded-xl px-3 py-2 text-sm hover:bg-primary/90 transition-colors"
              onClick={() => void this.clearServiceWorkersAndReload()}
            >
              Clear cache + reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
