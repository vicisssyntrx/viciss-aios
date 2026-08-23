import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

export type ClipboardItem = {
  id: string;
  user_id: string;
  content_type: 'text' | 'code' | 'file';
  content: string; // text content, or URL for files
  file_name?: string; // Original name for files
  status: 'active' | 'recycled';
  created_at: string;
};

export function useClipboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["shared_clipboard", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_clipboard")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn("Failed to fetch clipboard, table might not exist.", error);
        return { active: [], recycled: [] };
      }

      const items = data as ClipboardItem[];
      const active: ClipboardItem[] = [];
      const recycled: ClipboardItem[] = [];

      const now = new Date().getTime();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

      for (const item of items) {
        const itemTime = new Date(item.created_at).getTime();
        const age = now - itemTime;

        if (age > THIRTY_DAYS) {
          // Permanently deleted dynamically (should be handled by DB chron, but frontend ignores it)
          continue;
        }

        if (item.status === 'recycled' || age > ONE_DAY) {
          recycled.push(item);
        } else {
          active.push(item);
        }
      }

      return { active, recycled };
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (item: Pick<ClipboardItem, 'content_type' | 'content' | 'file_name'>) => {
      const { data, error } = await supabase
        .from("shared_clipboard")
        .insert([{ ...item, user_id: user!.id, status: 'active' }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared_clipboard"] });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      // 100MB limit enforcement on frontend (should also be enforced by bucket policy)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error("File exceeds 100MB limit.");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("clipboard_files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("clipboard_files")
        .getPublicUrl(filePath);

      // Now add the item
      const { data, error: insertError } = await supabase
        .from("shared_clipboard")
        .insert([{ 
          user_id: user!.id, 
          content_type: 'file', 
          content: publicUrl,
          file_name: file.name,
          status: 'active' 
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared_clipboard"] });
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shared_clipboard")
        .update({ status: 'recycled' })
        .eq("id", id)
        .eq("user_id", user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared_clipboard"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      // We also update created_at so it doesn't instantly auto-recycle again if it was > 24h old
      const { error } = await supabase
        .from("shared_clipboard")
        .update({ status: 'active', created_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared_clipboard"] });
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: async (item: ClipboardItem) => {
      // If it's a file, try to delete from storage first
      if (item.content_type === 'file' && item.content.includes('/clipboard_files/')) {
        try {
          const urlParts = item.content.split('/clipboard_files/');
          const path = urlParts[1];
          if (path) {
            await supabase.storage.from("clipboard_files").remove([path]);
          }
        } catch (e) {
          console.warn("Failed to delete file from storage", e);
        }
      }

      const { error } = await supabase
        .from("shared_clipboard")
        .delete()
        .eq("id", item.id)
        .eq("user_id", user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared_clipboard"] });
    },
  });

  return {
    activeItems: query.data?.active || [],
    recycledItems: query.data?.recycled || [],
    isLoading: query.isLoading,
    addItem: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    uploadFile: uploadFileMutation.mutateAsync,
    isUploading: uploadFileMutation.isPending,
    softDeleteItem: softDeleteMutation.mutateAsync,
    restoreItem: restoreMutation.mutateAsync,
    hardDeleteItem: hardDeleteMutation.mutateAsync,
  };
}
