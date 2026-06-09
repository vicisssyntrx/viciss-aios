import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import type { TablesInsert } from "@/integrations/supabase/types";

// Only logs in local development, becomes a no-op in production
const log = import.meta.env.DEV ? console.log.bind(console) : () => {};

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  outcome_name: string | null;
  outcome_emoji: string | null;
  reminder_time: string | null;
  sort_order: number;
  created_at: string;
}

export function useHabits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn("useHabits: user not authenticated");
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
      
      if (error) {
        console.error("useHabits query error:", error);
        throw error;
      }
      
      log("useHabits: fetched", data?.length ?? 0, "habits");
      return data as Habit[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habit: { name: string; emoji: string; outcome_name?: string; outcome_emoji?: string; reminder_time?: string }) => {
      if (!user) {
        throw new Error("You must be signed in to create habits.");
      }

      // We omit sort_order entirely; the Postgres trigger will assign it automatically.
      const newHabit: Partial<Habit> = {
        user_id: user.id,
        name: habit.name,
        emoji: habit.emoji,
        outcome_name: habit.outcome_name || null,
        outcome_emoji: habit.outcome_emoji || null,
        reminder_time: habit.reminder_time || null,
      };
      
      const { data, error } = await supabase
        .from("habits")
        .insert(newHabit as TablesInsert<"habits">)
        .select()
        .single();
      
      if (error) {
        console.error("useCreateHabit: insert error", error);
        throw error;
      }
      
      log("useCreateHabit: created habit", data?.id);
      return data as Habit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"], exact: false });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"], exact: false }),
  });
}
