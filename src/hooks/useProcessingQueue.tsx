import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QueueItem {
  id: string;
  source_id: string;
  batch_name: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'paused';
  total_pages: number;
  processed_pages: number;
  progress_percentage: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
  kb_sources?: {
    title: string;
    authors?: string[];
  };
}

interface PageSuggestion {
  id: string;
  page_id: string;
  suggestion_type: 'species' | 'defect' | 'fungus' | 'mitigation' | 'feature' | 'other';
  suggested_data: any;
  confidence_score?: number;
  target_table: string;
  status: string;
  notes?: string;
  created_at: string;
}

export const useProcessingQueue = () => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [suggestions, setSuggestions] = useState<PageSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQueueItems = async () => {
    try {
      const { data, error } = await supabase
        .from('processing_queue')
        .select(`
          *,
          kb_sources (
            title,
            authors
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueueItems(data || []);
    } catch (error) {
      console.error('Error fetching queue items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch processing queue',
        variant: 'destructive',
      });
    }
  };

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('page_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const updateQueueStatus = async (id: string, status: QueueItem['status']) => {
    try {
      const updates: any = { status };
      
      if (status === 'processing') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('processing_queue')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchQueueItems();
      toast({
        title: 'Success',
        description: `Queue item ${status}`,
      });
    } catch (error) {
      console.error('Error updating queue status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update queue status',
        variant: 'destructive',
      });
    }
  };

  const deleteQueueItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('processing_queue')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchQueueItems();
      toast({
        title: 'Success',
        description: 'Queue item deleted',
      });
    } catch (error) {
      console.error('Error deleting queue item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete queue item',
        variant: 'destructive',
      });
    }
  };

  const createQueueItem = async (sourceId: string, batchName: string, totalPages: number) => {
    try {
      const { data, error } = await supabase
        .from('processing_queue')
        .insert({
          source_id: sourceId,
          batch_name: batchName,
          total_pages: totalPages,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create queue pages for each page
      const pages = Array.from({ length: totalPages }, (_, i) => ({
        queue_id: data.id,
        page_number: i + 1,
        status: 'pending' as const
      }));

      const { error: pagesError } = await supabase
        .from('queue_pages')
        .insert(pages);

      if (pagesError) throw pagesError;

      await fetchQueueItems();
      toast({
        title: 'Success',
        description: 'Queue item created',
      });

      return data;
    } catch (error) {
      console.error('Error creating queue item:', error);
      toast({
        title: 'Error',
        description: 'Failed to create queue item',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getQueueStats = () => {
    const pending = queueItems.filter(item => item.status === 'pending').length;
    const processing = queueItems.filter(item => item.status === 'processing').length;
    const completed = queueItems.filter(item => item.status === 'completed').length;
    const error = queueItems.filter(item => item.status === 'error').length;

    return { pending, processing, completed, error };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchQueueItems(), fetchSuggestions()]);
      setLoading(false);
    };

    loadData();

    // Set up realtime subscription for queue updates
    const queueSubscription = supabase
      .channel('processing_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_queue'
        },
        () => {
          fetchQueueItems();
        }
      )
      .subscribe();

    const suggestionsSubscription = supabase
      .channel('page_suggestions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_suggestions'
        },
        () => {
          fetchSuggestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueSubscription);
      supabase.removeChannel(suggestionsSubscription);
    };
  }, []);

  return {
    queueItems,
    suggestions,
    loading,
    updateQueueStatus,
    deleteQueueItem,
    createQueueItem,
    getQueueStats,
    refreshQueue: fetchQueueItems,
    refreshSuggestions: fetchSuggestions,
  };
};