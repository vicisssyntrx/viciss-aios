import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://outgjulqkigbxaavcgww.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91dGdqdWxxa2lnYnhhYXZjZ3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDc2NTMsImV4cCI6MjA5MTgyMzY1M30.uDDets8BldKuvqodqpe4ppJUf3fiXw4xDtyRzHrCXD0';

// Proxy REST calls through Vercel edge to avoid HTTP/2 failures
// caused by ISP-level network equipment dropping direct connections
// to Supabase's US servers. Auth calls go direct (required for auth to work).
const proxyFetch = (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const urlStr = url.toString();
  const isRestCall = urlStr.includes('/rest/v1/');
  const isAuthCall = urlStr.includes('/auth/v1/');

  let finalUrl = urlStr;
  if (isRestCall) {
    finalUrl = urlStr.replace(`${SUPABASE_URL}/rest/`, '/supabase-rest/');
  } else if (isAuthCall) {
    finalUrl = urlStr.replace(`${SUPABASE_URL}/auth/v1/`, '/supabase-auth/');
  }

  // Only force cache bypass on REST data queries so mutations (add/edit/delete) reflect instantly.
  // Auth token refreshes, storage, and realtime should use default browser cache behavior.
  const fetchOptions = isRestCall
    ? { ...options, cache: 'no-store' as RequestCache }
    : options;

  return fetch(finalUrl, fetchOptions);
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: proxyFetch,
  },
});
