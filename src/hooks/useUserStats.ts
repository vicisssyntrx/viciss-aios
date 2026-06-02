import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

export interface UserStats {
  id: string;
  user_id: string;
  coins: number;
  streak: number;
  shields: number;
  power_ups: number;
  current_growth: number;
  updated_at: string;
  start_date: string;
  end_date: string | null;
}

export function useUserStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user stats:", error);
        throw error;
      }
      
      // If no data exists yet (e.g., trigger is lagging behind auth), return default fallback
      if (!data) {
        return {
          id: 'temp-fallback-id',
          user_id: user.id,
          coins: 0,
          streak: 0,
          shields: 0,
          power_ups: 0,
          current_growth: 1.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          start_date: new Date().toISOString().split('T')[0],
          end_date: null
        } as unknown as UserStats;
      }

      return data as UserStats;
    },
    enabled: !!user?.id,
  });
}

export function useRefreshStats() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["user_stats"], exact: false });
}
