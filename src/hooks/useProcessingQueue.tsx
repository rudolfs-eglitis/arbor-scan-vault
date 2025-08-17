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
        // Start actual processing
        processQueueItem(id);
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

  const processQueueItem = async (queueId: string) => {
    try {
      // Get queue item details
      const { data: queueItem, error: queueError } = await supabase
        .from('processing_queue')
        .select('*, kb_sources(*)')
        .eq('id', queueId)
        .single();

      if (queueError) throw queueError;

      // Get all pending pages for this queue
      const { data: pages, error: pagesError } = await supabase
        .from('queue_pages')
        .select('*')
        .eq('queue_id', queueId)
        .eq('status', 'pending')
        .order('page_number');

      if (pagesError) throw pagesError;

      if (!pages || pages.length === 0) {
        // No pages to process, mark as completed
        await supabase
          .from('processing_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', queueId);
        return;
      }

      // Get images from storage for this source
      const { data: images, error: imagesError } = await supabase
        .from('kb_images')
        .select('*')
        .eq('source_id', queueItem.source_id)
        .order('page');

      if (imagesError) throw imagesError;

      // Process each page
      for (const page of pages) {
        try {
          // Find corresponding image
          const image = images?.find(img => img.page === page.page_number);
          if (!image) {
            console.warn(`No image found for page ${page.page_number}`);
            continue;
          }

          // Update page status to processing
          await supabase
            .from('queue_pages')
            .update({ status: 'processing' })
            .eq('id', page.id);

          // Call OCR function
          const { data: ocrResult, error: ocrError } = await supabase.functions.invoke('process-ocr', {
            body: {
              imageUrl: image.uri,
              sourceId: queueItem.source_id,
              page: page.page_number,
              caption: image.caption
            }
          });

          if (ocrError) {
            console.error('OCR Error:', ocrError);
            await supabase
              .from('queue_pages')
              .update({ 
                status: 'error',
                error_message: ocrError.message,
                processed_at: new Date().toISOString()
              })
              .eq('id', page.id);
            continue;
          }

          // Update page as completed
          await supabase
            .from('queue_pages')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString(),
              extracted_text: ocrResult.extractedText,
              ocr_confidence: ocrResult.confidence
            })
            .eq('id', page.id);

          console.log(`Processed page ${page.page_number} successfully`);

        } catch (pageError) {
          console.error(`Error processing page ${page.page_number}:`, pageError);
          await supabase
            .from('queue_pages')
            .update({ 
              status: 'error',
              error_message: pageError.message,
              processed_at: new Date().toISOString()
            })
            .eq('id', page.id);
        }
      }

      // Check if all pages are done
      const { data: remainingPages } = await supabase
        .from('queue_pages')
        .select('id')
        .eq('queue_id', queueId)
        .eq('status', 'pending');

      if (!remainingPages || remainingPages.length === 0) {
        // All pages processed, mark queue as completed
        await supabase
          .from('processing_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', queueId);

        toast({
          title: 'Processing Complete',
          description: `Successfully processed ${queueItem.batch_name}`,
        });
      }

    } catch (error) {
      console.error('Error processing queue item:', error);
      await supabase
        .from('processing_queue')
        .update({ 
          status: 'error',
          error_message: error.message
        })
        .eq('id', queueId);

      toast({
        title: 'Processing Failed',
        description: error.message,
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