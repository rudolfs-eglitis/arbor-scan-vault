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
  current_page?: number;
  current_file?: string;
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
            completed_at: new Date().toISOString(),
            current_page: null,
            current_file: null
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

      const startTime = Date.now();
      const totalPages = pages.length;

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        try {
          // Find corresponding image
          const image = images?.find(img => img.page === page.page_number);
          if (!image || !image.uri) {
            console.error(`[Queue ${queueId}] No image found for page ${page.page_number}`);
            await supabase
              .from('queue_pages')
              .update({ 
                status: 'error',
                error_message: `No image found for page ${page.page_number}`,
                processed_at: new Date().toISOString()
              })
              .eq('id', page.id);
            continue;
          }

          // Calculate progress and estimated time
          const progress = Math.round((i / totalPages) * 100);
          const elapsedMs = Date.now() - startTime;
          const avgTimePerPage = elapsedMs / Math.max(1, i);
          const remainingPages = totalPages - i;
          const estimatedRemainingMs = avgTimePerPage * remainingPages;
          const estimatedCompletion = new Date(Date.now() + estimatedRemainingMs);

          // Update queue with detailed progress
          const fileName = image.uri.split('/').pop() || `Page ${page.page_number}`;
          const { error: progressError } = await supabase
            .from('processing_queue')
            .update({ 
              current_page: page.page_number,
              current_file: fileName,
              progress_percentage: progress,
              estimated_completion: estimatedCompletion.toISOString()
            } as any)
            .eq('id', queueId);

          if (progressError) console.error('Error updating progress:', progressError);

          // Update page status to processing
          await supabase
            .from('queue_pages')
            .update({ status: 'processing' })
            .eq('id', page.id);

          console.log(`[Queue ${queueId}] Processing page ${page.page_number} (${i + 1}/${totalPages}) - ${fileName}`);

          // Call OCR function with the required imageUrl parameter
          const { data: ocrResult, error: ocrError } = await supabase.functions.invoke('process-openai-ocr', {
            body: {
              imageUrl: image.uri,
              sourceId: queueItem.source_id,
              page: page.page_number
            }
          });

          if (ocrError) {
            console.error(`[Queue ${queueId}] OCR Error for page ${page.page_number}:`, ocrError);
            await supabase
              .from('queue_pages')
              .update({ 
                status: 'error',
                error_message: ocrError.message || 'OCR processing failed',
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
              extracted_text: ocrResult?.extractedText || '',
              ocr_confidence: ocrResult?.confidence || 0
            })
            .eq('id', page.id);

          console.log(`[Queue ${queueId}] Successfully processed page ${page.page_number}`);

        } catch (pageError) {
          console.error(`[Queue ${queueId}] Error processing page ${page.page_number}:`, pageError);
          await supabase
            .from('queue_pages')
            .update({ 
              status: 'error',
              error_message: pageError.message || 'Unknown processing error',
              processed_at: new Date().toISOString()
            })
            .eq('id', page.id);
        }
      }

      // Check if all pages are done
      const { data: allPages } = await supabase
        .from('queue_pages')
        .select('status')
        .eq('queue_id', queueId);

      if (allPages && allPages.length > 0) {
        const pendingPages = allPages.filter(p => p.status === 'pending');
        const completedPages = allPages.filter(p => p.status === 'completed');
        const errorPages = allPages.filter(p => p.status === 'error');

        if (pendingPages.length === 0) {
          // All pages processed, determine final status
          let finalStatus: 'completed' | 'error' = 'completed';
          let toastTitle = 'Processing Complete';
          let toastDescription = `Successfully processed ${queueItem.batch_name}`;
          let toastVariant: 'default' | 'destructive' = 'default';

          if (errorPages.length > 0) {
            if (completedPages.length === 0) {
              // All pages failed
              finalStatus = 'error';
              toastTitle = 'Processing Failed';
              toastDescription = `All ${errorPages.length} pages failed to process. Please check your API key and try again.`;
              toastVariant = 'destructive';
            } else {
              // Some pages failed, some succeeded
              finalStatus = 'completed';
              toastTitle = 'Processing Completed with Errors';
              toastDescription = `${completedPages.length} pages succeeded, ${errorPages.length} pages failed. Check the logs for details.`;
              toastVariant = 'destructive';
            }
          }

          const { error: completeError } = await supabase
            .from('processing_queue')
            .update({ 
              status: finalStatus,
              completed_at: new Date().toISOString(),
              current_page: null,
              current_file: null,
              error_message: errorPages.length > 0 ? `${errorPages.length} pages failed to process` : null
            } as any)
            .eq('id', queueId);

          if (completeError) console.error('Error completing queue:', completeError);

          toast({
            title: toastTitle,
            description: toastDescription,
            variant: toastVariant,
          });
        }
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

  const restartQueueProcessing = async (queueId: string) => {
    try {
      console.log(`[Queue ${queueId}] Attempting to restart processing...`);
      
      // Check if queue has pending pages
      const { data: pendingPages, error: pagesError } = await supabase
        .from('queue_pages')
        .select('id, page_number')
        .eq('queue_id', queueId)
        .eq('status', 'pending');

      if (pagesError) throw pagesError;

      if (pendingPages && pendingPages.length > 0) {
        console.log(`[Queue ${queueId}] Found ${pendingPages.length} pending pages, restarting...`);
        
        // First update queue status to processing
        const { error: updateError } = await supabase
          .from('processing_queue')
          .update({ 
            status: 'processing',
            started_at: new Date().toISOString(),
            completed_at: null,
            error_message: null,
            current_page: null,
            current_file: null
          })
          .eq('id', queueId);

        if (updateError) throw updateError;

        // Refresh queue items to reflect status change
        await fetchQueueItems();
        
        console.log(`[Queue ${queueId}] Status updated to processing, starting OCR processing...`);
        
        // Start processing asynchronously
        setTimeout(() => {
          processQueueItem(queueId);
        }, 100);
        
        toast({
          title: 'Queue Restarted',
          description: `Processing ${pendingPages.length} pending pages`,
        });

        return true;
      } else {
        console.log(`[Queue ${queueId}] No pending pages found`);
        return false;
      }
    } catch (error) {
      console.error(`[Queue ${queueId}] Error restarting queue:`, error);
      toast({
        title: 'Error',
        description: 'Failed to restart queue processing',
        variant: 'destructive',
      });
      return false;
    }
  };

  const forceRestartQueueProcessing = async (queueId: string) => {
    try {
      console.log(`[Queue ${queueId}] Force restarting processing...`);
      
      // First, reset all failed and completed pages to pending for force restart
      const { error: resetPagesError } = await supabase
        .from('queue_pages')
        .update({ 
          status: 'pending',
          error_message: null,
          processed_at: null,
          extracted_text: null,
          ocr_confidence: null
        })
        .eq('queue_id', queueId)
        .in('status', ['error', 'completed']);

      if (resetPagesError) throw resetPagesError;

      // Reset queue progress and status
      const { error: updateError } = await supabase
        .from('processing_queue')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString(),
          completed_at: null,
          error_message: null,
          current_page: null,
          current_file: null,
          processed_pages: 0,
          progress_percentage: 0,
          estimated_completion: null
        })
        .eq('id', queueId);

      if (updateError) throw updateError;

      // Refresh queue items
      await fetchQueueItems();
      
      console.log(`[Queue ${queueId}] Force restart: All pages reset, starting processing...`);
      
      // Start processing immediately
      setTimeout(() => {
        processQueueItem(queueId);
      }, 100);
      
      toast({
        title: 'Queue Force Restarted',
        description: 'All pages reset and processing restarted',
      });

      return true;
    } catch (error) {
      console.error(`[Queue ${queueId}] Error force restarting queue:`, error);
      toast({
        title: 'Error',
        description: 'Failed to force restart queue processing',
        variant: 'destructive',
      });
      return false;
    }
  };

  const checkForPendingQueues = async () => {
    try {
      // Find completed queues that have pending pages
      const { data: completedQueues, error: queuesError } = await supabase
        .from('processing_queue')
        .select('id')
        .eq('status', 'completed');

      if (queuesError) throw queuesError;

      if (completedQueues && completedQueues.length > 0) {
        for (const queue of completedQueues) {
          const { data: pendingPages, error: pagesError } = await supabase
            .from('queue_pages')
            .select('id')
            .eq('queue_id', queue.id)
            .eq('status', 'pending');

          if (!pagesError && pendingPages && pendingPages.length > 0) {
            // Auto-restart this queue
            await restartQueueProcessing(queue.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for pending queues:', error);
    }
  };

  const retryQueuePages = async (queueId: string, pageIds?: string[]) => {
    try {
      let query = supabase.from('queue_pages').update({ 
        status: 'pending',
        error_message: null,
        processed_at: null
      });

      if (pageIds && pageIds.length > 0) {
        query = query.in('id', pageIds);
      } else {
        query = query.eq('queue_id', queueId).eq('status', 'error');
      }

      const { error } = await query;
      if (error) throw error;

      // Auto-restart the queue processing
      await restartQueueProcessing(queueId);
      await fetchQueueItems();

      const pageCount = pageIds ? pageIds.length : 'all failed';
      toast({
        title: 'Pages Retried',
        description: `${pageCount} pages queued for retry and processing restarted`,
      });
    } catch (error) {
      console.error('Error retrying pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry pages',
        variant: 'destructive',
      });
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
    restartQueueProcessing,
    forceRestartQueueProcessing,
    checkForPendingQueues,
    retryQueuePages,
    getQueueStats,
    refreshQueue: fetchQueueItems,
    refreshSuggestions: fetchSuggestions,
  };
};