import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://outgjulqkigbxaavcgww.supabase.co';

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/supabase-rest/': {
        target: `${supabaseUrl}/rest/`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-rest\//, ''),
      },
      '/supabase-auth/': {
        target: `${supabaseUrl}/auth/v1/`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-auth\//, ''),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  };
});
