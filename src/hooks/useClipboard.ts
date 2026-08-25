import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

export type ClipboardItem = {
  id: string;
  user_id: string;
  content_type: 'text' | 'code' | 'file';
  content: string; // text content, or URL for files
  file_name?: string; // Original name for files
  file_size?: number; // Size in bytes
  status: 'active' | 'recycled';
  created_at: string;
};

const MAX_ITEMS = 10;
const MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

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
        return { active: [], recycled: [], totalSize: 0 };
      }

      const items = (data as ClipboardItem[]) || [];
      const active: ClipboardItem[] = [];
      const recycled: ClipboardItem[] = [];
      let totalSize = 0;

      const now = new Date().getTime();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

      for (const item of items) {
        const itemTime = new Date(item.created_at).getTime();
        const age = now - itemTime;

        if (age > THIRTY_DAYS) {
          continue;
        }

        if (item.status === 'recycled' || age > ONE_DAY) {
          recycled.push(item);
        } else {
          active.push(item);
          if (item.file_size) {
            totalSize += item.file_size;
          }
        }
      }

      return { active, recycled, totalSize };
    },
    enabled: !!user,
  });

  // Enable Realtime Sync
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`clipboard-changes-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_clipboard',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Instantly refresh when another device makes a change
          queryClient.invalidateQueries({ queryKey: ["shared_clipboard"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const checkLimits = (newSize: number = 0) => {
    const activeCount = query.data?.active.length || 0;
    const currentTotalSize = query.data?.totalSize || 0;

    if (activeCount >= MAX_ITEMS) {
      throw new Error(`Clipboard limit reached (${MAX_ITEMS} items max). Please delete some items.`);
    }

    if (currentTotalSize + newSize > MAX_TOTAL_SIZE_BYTES) {
      throw new Error("Clipboard storage limit reached (100MB max total). Please delete some files.");
    }
  };

  const addMutation = useMutation({
    mutationFn: async (item: Pick<ClipboardItem, 'content_type' | 'content' | 'file_name'>) => {
      checkLimits();
      
      const { data, error } = await supabase
        .from("shared_clipboard")
        .insert([{ ...item, user_id: user!.id, status: 'active', file_size: 0 }])
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
      checkLimits(file.size);

      const fileNameStr = file.name || "upload";
      const fileExt = fileNameStr.includes('.') ? fileNameStr.split('.').pop() : 'bin';
      const uniqueId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      console.log(`[Storage] Attempting to upload ${fileName} (${file.size} bytes)...`);
      
      const { error: uploadError } = await supabase.storage
        .from("clipboard_files")
        .upload(filePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        console.error("[Storage] Upload failed:", uploadError);
        throw uploadError;
      }

      console.log(`[Storage] Upload successful! Getting public URL...`);
      const { data: { publicUrl } } = supabase.storage
        .from("clipboard_files")
        .getPublicUrl(filePath);

      const { data, error: insertError } = await supabase
        .from("shared_clipboard")
        .insert([{ 
          user_id: user!.id, 
          content_type: 'file', 
          content: publicUrl,
          file_name: file.name,
          file_size: file.size,
          status: 'active' 
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error("[Database] Failed to insert file record:", insertError);
        throw insertError;
      }
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
      // Must check limits again when restoring an item back to active
      const activeCount = query.data?.active.length || 0;
      if (activeCount >= MAX_ITEMS) {
        throw new Error(`Clipboard limit reached (${MAX_ITEMS} items max). Cannot restore.`);
      }

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
    totalSize: query.data?.totalSize || 0,
    maxItems: MAX_ITEMS,
    maxSizeBytes: MAX_TOTAL_SIZE_BYTES,
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
