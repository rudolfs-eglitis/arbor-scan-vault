import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Loader2, Zap, Eye, Database, Sparkles } from 'lucide-react';

interface ProcessingStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  startTime?: number;
}

interface EnhancedProgressBarProps {
  queueItem: {
    id: string;
    status: string;
    progress_percentage: number;
    processed_pages: number;
    total_pages: number;
    current_file?: string;
    current_page?: number;
    current_stage?: string;
    processing_speed?: number;
    estimated_completion?: string;
    started_at?: string;
  };
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: 'loading',
    name: 'Loading Image',
    icon: <Loader2 className="h-3 w-3" />,
    status: 'pending'
  },
  {
    id: 'ocr',
    name: 'Extracting Text',
    icon: <Eye className="h-3 w-3" />,
    status: 'pending'
  },
  {
    id: 'processing',
    name: 'Processing Content',
    icon: <Zap className="h-3 w-3" />,
    status: 'pending'
  },
  {
    id: 'saving',
    name: 'Saving Results',
    icon: <Database className="h-3 w-3" />,
    status: 'pending'
  },
  {
    id: 'suggestions',
    name: 'Generating Insights',
    icon: <Sparkles className="h-3 w-3" />,
    status: 'pending'
  }
];

const EnhancedProgressBar = ({ queueItem }: EnhancedProgressBarProps) => {
  const [stages, setStages] = useState<ProcessingStage[]>(PROCESSING_STAGES);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [processingSpeed, setProcessingSpeed] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

  // Smooth progress animation
  useEffect(() => {
    const target = queueItem.progress_percentage;
    const current = animatedProgress;
    const diff = target - current;
    
    if (Math.abs(diff) > 0.1) {
      const increment = diff * 0.1;
      const timer = setTimeout(() => {
        setAnimatedProgress(current + increment);
      }, 16); // 60fps
      
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(target);
    }
  }, [queueItem.progress_percentage, animatedProgress]);

  // Calculate processing speed and ETA
  useEffect(() => {
    if (queueItem.status === 'processing' && queueItem.started_at) {
      const startTime = new Date(queueItem.started_at).getTime();
      const now = Date.now();
      const elapsedMinutes = (now - startTime) / (1000 * 60);
      
      if (elapsedMinutes > 0 && queueItem.processed_pages > 0) {
        const speed = queueItem.processed_pages / elapsedMinutes;
        setProcessingSpeed(speed);
        
        const remainingPages = queueItem.total_pages - queueItem.processed_pages;
        const estimatedMinutes = remainingPages / speed;
        
        if (estimatedMinutes < 60) {
          setEstimatedTimeRemaining(`${Math.ceil(estimatedMinutes)} min`);
        } else {
          setEstimatedTimeRemaining(`${Math.ceil(estimatedMinutes / 60)} hr`);
        }
      }
    }
  }, [queueItem]);

  // Update stages based on current stage
  useEffect(() => {
    if (queueItem.current_stage && queueItem.status === 'processing') {
      setStages(prevStages => 
        prevStages.map(stage => {
          const stageIndex = PROCESSING_STAGES.findIndex(s => s.id === stage.id);
          const currentStageIndex = PROCESSING_STAGES.findIndex(s => s.id === queueItem.current_stage);
          
          if (stageIndex < currentStageIndex) {
            return { ...stage, status: 'completed' as const };
          } else if (stageIndex === currentStageIndex) {
            return { ...stage, status: 'processing' as const };
          } else {
            return { ...stage, status: 'pending' as const };
          }
        })
      );
    }
  }, [queueItem.current_stage]);

  const getStageIcon = (stage: ProcessingStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'processing':
        return <div className="animate-spin">{stage.icon}</div>;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStageColor = (stage: ProcessingStage) => {
    switch (stage.status) {
      case 'completed':
        return 'text-success';
      case 'processing':
        return 'text-primary';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (queueItem.status !== 'processing') {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{queueItem.processed_pages}/{queueItem.total_pages} pages • {queueItem.progress_percentage}%</span>
        </div>
        <Progress value={queueItem.progress_percentage} className="h-2" />
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4 space-y-4">
        {/* Main Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Overall Progress</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {queueItem.processed_pages}/{queueItem.total_pages} pages
              </span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(animatedProgress)}%
              </Badge>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={animatedProgress} 
              className="h-3 transition-all duration-300 ease-out" 
            />
            <div 
              className="absolute top-0 h-3 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, animatedProgress + 10)}%` }}
            />
          </div>
        </div>

        {/* Current File Processing */}
        {queueItem.current_file && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium">Currently Processing</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <div className="font-mono">{queueItem.current_file}</div>
              <div>Page {queueItem.current_page} of {queueItem.total_pages}</div>
            </div>
          </div>
        )}

        {/* Processing Stages */}
        {queueItem.current_stage && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Processing Stages</div>
            <div className="grid grid-cols-5 gap-1">
              {stages.map((stage, index) => (
                <div 
                  key={stage.id}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
                    stage.status === 'processing' 
                      ? 'bg-primary/10 border border-primary/20' 
                      : stage.status === 'completed'
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="mb-1">
                    {getStageIcon(stage)}
                  </div>
                  <div className={`text-xs text-center ${getStageColor(stage)}`}>
                    {stage.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Metrics */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Processing Speed</div>
            <div className="font-mono font-medium">
              {processingSpeed > 0 ? `${processingSpeed.toFixed(1)} pages/min` : 'Calculating...'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Time Remaining</div>
            <div className="font-mono font-medium">
              {estimatedTimeRemaining || 'Calculating...'}
            </div>
          </div>
        </div>

        {/* Activity Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <span>Active processing...</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedProgressBar;