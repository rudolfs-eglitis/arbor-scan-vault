import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, RotateCcw, Trash2, Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

const mockQueueItems = [
  {
    id: '1',
    batchName: 'Tree Biology Ch. 1-3',
    sourceTitle: 'Tree Biology and Arboriculture',
    status: 'processing',
    progress: 65,
    totalFiles: 45,
    processedFiles: 29,
    createdAt: '2024-01-15T10:30:00Z',
    estimatedTime: '5 mins remaining',
  },
  {
    id: '2',
    batchName: 'ISA Study Guide Batch 1',
    sourceTitle: 'ISA Arborist Certification Study Guide',
    status: 'pending',
    progress: 0,
    totalFiles: 30,
    processedFiles: 0,
    createdAt: '2024-01-15T11:15:00Z',
    estimatedTime: 'In queue',
  },
  {
    id: '3',
    batchName: 'Urban Trees Research',
    sourceTitle: 'Urban Tree Growth Response to Climate Change',
    status: 'completed',
    progress: 100,
    totalFiles: 18,
    processedFiles: 18,
    createdAt: '2024-01-15T09:00:00Z',
    estimatedTime: 'Completed',
  },
  {
    id: '4',
    batchName: 'Tree Biology Ch. 4-6',
    sourceTitle: 'Tree Biology and Arboriculture',
    status: 'error',
    progress: 25,
    totalFiles: 50,
    processedFiles: 12,
    createdAt: '2024-01-15T08:45:00Z',
    estimatedTime: 'Failed',
  },
];

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

  const pendingCount = mockQueueItems.filter(item => item.status === 'pending').length;
  const processingCount = mockQueueItems.filter(item => item.status === 'processing').length;
  const completedCount = mockQueueItems.filter(item => item.status === 'completed').length;
  const errorCount = mockQueueItems.filter(item => item.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Processing Queue</h2>
          <p className="text-muted-foreground">Manage OCR processing batches and monitor progress</p>
        </div>
        <div className="flex gap-2">
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
                <p className="text-2xl font-bold">{pendingCount}</p>
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
                <p className="text-2xl font-bold">{processingCount}</p>
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
                <p className="text-2xl font-bold">{completedCount}</p>
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
                <p className="text-2xl font-bold">{errorCount}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {mockQueueItems.map((item) => (
          <Card key={item.id} className="group hover:shadow-card transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <CardTitle className="text-lg">{item.batchName}</CardTitle>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <CardDescription>{item.sourceTitle}</CardDescription>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.status === 'processing' && (
                    <Button variant="ghost" size="sm">
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status === 'pending' && (
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status === 'error' && (
                    <Button variant="ghost" size="sm">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{item.processedFiles}/{item.totalFiles} files • {item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(item.createdAt).toLocaleDateString()} at{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Files</p>
                  <p className="font-medium">{item.totalFiles} pages</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{item.estimatedTime}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {item.status === 'pending' && (
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                )}
                {item.status === 'processing' && (
                  <Button variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                {item.status === 'error' && (
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
                {item.status === 'completed' && (
                  <Button variant="outline" size="sm">
                    View Results
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockQueueItems.length === 0 && (
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
    </div>
  );
};

export default QueueTab;