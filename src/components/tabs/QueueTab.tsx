import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, RotateCcw, Trash2, Clock, CheckCircle, AlertCircle, PlayCircle, Brain, Zap } from 'lucide-react';
import { useProcessingQueue } from '@/hooks/useProcessingQueue';
import PageSuggestionsPanel from '@/components/knowledgeBase/PageSuggestionsPanel';
import QueueDetailsModal from '@/components/queue/QueueDetailsModal';
import QueueResultsModal from '@/components/queue/QueueResultsModal';
import EnhancedProgressBar from '@/components/queue/EnhancedProgressBar';

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

const QueueTab = () => {
  const [processingAll, setProcessingAll] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const { queueItems, loading, updateQueueStatus, deleteQueueItem, getQueueStats, forceRestartQueueProcessing, refreshQueue, restartEntireBatch } = useProcessingQueue();

  const openDetailsModal = (item: any) => {
    setSelectedQueueItem(item);
    setShowDetailsModal(true);
  };

  const openResultsModal = (item: any) => {
    setSelectedQueueItem(item);
    setShowResultsModal(true);
  };

  const stats = getQueueStats();

  const getEstimatedTime = (item: any) => {
    if (item.status === 'completed') return 'Completed';
    if (item.status === 'error') return 'Failed';
    if (item.status === 'pending') return 'In queue';
    if (item.status === 'processing') {
      if (item.estimated_completion) {
        const now = new Date();
        const estimated = new Date(item.estimated_completion);
        const diffMs = estimated.getTime() - now.getTime();
        
        if (diffMs <= 0) return 'Finishing up...';
        
        const diffMins = Math.ceil(diffMs / (1000 * 60));
        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} remaining`;
        
        const diffHours = Math.ceil(diffMins / 60);
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
      }
      return 'Processing...';
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading queue...</span>
        </div>
      </div>
    );
  }

  if (showSuggestions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowSuggestions(false)}
          >
            ← Back to Queue
          </Button>
        </div>
        <PageSuggestionsPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Processing Queue</h2>
          <p className="text-muted-foreground">Manage OCR processing batches and monitor progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSuggestions(true)}>
            <Brain className="h-4 w-4 mr-2" />
            View Suggestions
          </Button>
          <Button variant="outline">
            <Pause className="h-4 w-4 mr-2" />
            Pause All
          </Button>
          <Button 
            className="bg-gradient-primary hover:bg-primary-hover shadow-primary"
            onClick={() => setProcessingAll(!processingAll)}
          >
            <Play className="h-4 w-4 mr-2" />
            {processingAll ? 'Stop Processing' : 'Start Processing'}
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
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
                <p className="text-2xl font-bold">{stats.processing}</p>
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
                <p className="text-2xl font-bold">{stats.completed}</p>
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
                <p className="text-2xl font-bold">{stats.error}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {queueItems.map((item) => (
          <Card key={item.id} className="group hover:shadow-card transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <CardTitle className="text-lg">{item.batch_name}</CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <CardDescription>{item.kb_sources?.title || 'Unknown Source'}</CardDescription>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.status === 'processing' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => updateQueueStatus(item.id, 'paused')}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => updateQueueStatus(item.id, 'processing')}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status === 'error' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => updateQueueStatus(item.id, 'pending')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status === 'completed' && item.processed_pages < item.total_pages && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => forceRestartQueueProcessing(item.id)}
                      title="Force restart processing for remaining pages"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteQueueItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enhanced Progress Bar */}
              <EnhancedProgressBar queueItem={item} />

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(item.created_at).toLocaleDateString()} at{' '}
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Files</p>
                  <p className="font-medium">{item.total_pages} pages</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{getEstimatedTime(item)}</p>
                </div>
              </div>

              {/* Error Message */}
              {item.error_message && (
                <div className="p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm text-destructive">{item.error_message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {item.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateQueueStatus(item.id, 'processing')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                )}
                {item.status === 'processing' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateQueueStatus(item.id, 'paused')}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                {item.status === 'error' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateQueueStatus(item.id, 'pending')}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
                {item.status === 'completed' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openResultsModal(item)}
                    >
                      View Results
                    </Button>
                    {item.processed_pages < item.total_pages && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => forceRestartQueueProcessing(item.id)}
                        className="flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        Force Restart
                      </Button>
                    )}
                  </>
                )}
                {(item.status === 'error' || item.status === 'completed') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => restartEntireBatch(item.id)}
                    className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    title="Restart entire batch from scratch - clears all data"
                  >
                    <Square className="h-4 w-4" />
                    Restart Entire Batch
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openDetailsModal(item)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {queueItems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No items in queue</h3>
                <p className="text-muted-foreground">Upload some files to start processing</p>
              </div>
              <Button className="bg-gradient-primary">
                Go to Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <QueueDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        queueItem={selectedQueueItem}
        onRefresh={refreshQueue}
      />
      
      <QueueResultsModal
        open={showResultsModal}
        onOpenChange={setShowResultsModal}
        queueItem={selectedQueueItem}
      />
    </div>
  );
};

export default QueueTab;