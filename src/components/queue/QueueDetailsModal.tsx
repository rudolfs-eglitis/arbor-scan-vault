import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, AlertCircle, PlayCircle, RotateCcw, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProcessingQueue } from '@/hooks/useProcessingQueue';

interface QueuePage {
  id: string;
  page_number: number;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'paused';
  processed_at?: string;
  error_message?: string;
  ocr_confidence?: number;
  extracted_text?: string;
}

interface QueueDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queueItem: any;
  onRefresh?: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'processing':
      return <PlayCircle className="h-4 w-4 text-primary animate-pulse" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-warning" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'processing':
      return 'bg-primary text-primary-foreground';
    case 'pending':
      return 'bg-warning text-warning-foreground';
    case 'completed':
      return 'bg-success text-success-foreground';
    case 'error':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const QueueDetailsModal = ({ open, onOpenChange, queueItem, onRefresh }: QueueDetailsModalProps) => {
  const [pages, setPages] = useState<QueuePage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { forceRestartQueueProcessing, restartQueueProcessing } = useProcessingQueue();

  const fetchPages = async () => {
    if (!queueItem) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('queue_pages')
        .select('*')
        .eq('queue_id', queueItem.id)
        .order('page_number');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch queue pages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const retryPage = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from('queue_pages')
        .update({ 
          status: 'pending',
          error_message: null,
          processed_at: null
        })
        .eq('id', pageId);

      if (error) throw error;
      
      // Restart queue processing using the correct function
      const success = await restartQueueProcessing(queueItem.id);
      
      await fetchPages();
      onRefresh?.();
      toast({
        title: 'Success',
        description: success ? 'Page queued for retry and processing restarted' : 'Page queued for retry',
      });
    } catch (error) {
      console.error('Error retrying page:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry page',
        variant: 'destructive',
      });
    }
  };


  const retryAllErrorPages = async () => {
    try {
      const errorPages = pages.filter(p => p.status === 'error');
      if (errorPages.length === 0) return;

      const { error } = await supabase
        .from('queue_pages')
        .update({ 
          status: 'pending',
          error_message: null,
          processed_at: null
        })
        .in('id', errorPages.map(p => p.id));

      if (error) throw error;
      
      const success = await restartQueueProcessing(queueItem.id);
      await fetchPages();
      onRefresh?.();
      
      toast({
        title: 'Success',
        description: `${errorPages.length} pages queued for retry${success ? ' and processing restarted' : ''}`,
      });
    } catch (error) {
      console.error('Error retrying all error pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry pages',
        variant: 'destructive',
      });
    }
  };

  const handleForceRestart = async () => {
    if (!queueItem) return;
    
    try {
      const success = await forceRestartQueueProcessing(queueItem.id);
      if (success) {
        await fetchPages();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error force restarting:', error);
    }
  };

  useEffect(() => {
    if (open && queueItem) {
      fetchPages();
    }
  }, [open, queueItem]);

  const pageStats = pages.reduce((acc, page) => {
    acc[page.status] = (acc[page.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Queue Details: {queueItem?.batch_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Queue Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Queue Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(queueItem?.status)}
                  <Badge className={getStatusColor(queueItem?.status)}>
                    {queueItem?.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-medium">{queueItem?.kb_sources?.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {queueItem?.created_at ? new Date(queueItem.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-medium">
                  {queueItem?.processed_pages}/{queueItem?.total_pages} pages ({queueItem?.progress_percentage}%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Page Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{pageStats.pending || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{pageStats.processing || 0}</p>
                    <p className="text-sm text-muted-foreground">Processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{pageStats.completed || 0}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{pageStats.error || 0}</p>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Message */}
          {queueItem?.error_message && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Queue Error</p>
                    <p className="text-sm text-muted-foreground">{queueItem.error_message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pages List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Page Processing Status</CardTitle>
              <div className="flex gap-2">
                {pageStats.pending > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleForceRestart}
                    className="flex items-center gap-2"
                  >
                    <PlayCircle className="h-3 w-3" />
                    Process Pending ({pageStats.pending})
                  </Button>
                )}
                {pageStats.pending > 0 && queueItem?.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleForceRestart}
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-3 w-3" />
                    Force Restart
                  </Button>
                )}
                {pageStats.error > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryAllErrorPages}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Retry All Errors ({pageStats.error})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading pages...</span>
                  </div>
                ) : pages.length === 0 ? (
                  <div className="text-center text-muted-foreground p-8">
                    No pages found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(page.status)}
                          <div>
                            <p className="font-medium">Page {page.page_number}</p>
                            {page.processed_at && (
                              <p className="text-xs text-muted-foreground">
                                Processed: {new Date(page.processed_at).toLocaleString()}
                              </p>
                            )}
                            {page.ocr_confidence && (
                              <p className="text-xs text-muted-foreground">
                                Confidence: {Math.round(page.ocr_confidence * 100)}%
                              </p>
                            )}
                          </div>
                        </div>
                         <div className="flex items-center gap-2">
                           <Badge className={getStatusColor(page.status)} variant="secondary">
                             {page.status}
                           </Badge>
                           {page.status === 'error' && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => retryPage(page.id)}
                             >
                               <RotateCcw className="h-3 w-3 mr-1" />
                               Retry
                             </Button>
                           )}
                           {page.status === 'pending' && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => retryPage(page.id)}
                             >
                               <PlayCircle className="h-3 w-3 mr-1" />
                               Process
                             </Button>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Error Details */}
          {pages.some(p => p.error_message) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {pages
                      .filter(p => p.error_message)
                      .map((page) => (
                        <div key={page.id} className="p-2 bg-destructive/10 rounded">
                          <p className="font-medium text-sm">Page {page.page_number}:</p>
                          <p className="text-sm text-destructive">{page.error_message}</p>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QueueDetailsModal;