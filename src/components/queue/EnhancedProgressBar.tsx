import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2 } from 'lucide-react';

interface EnhancedProgressBarProps {
  queueItem: {
    id: string;
    status: string;
    progress_percentage: number;
    processed_pages: number;
    total_pages: number;
    current_page?: number;
  };
}

const EnhancedProgressBar = ({ queueItem }: EnhancedProgressBarProps) => {
  const getStatusDisplay = () => {
    if (queueItem.status === 'completed') {
      return (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          <span>Processing complete! All {queueItem.total_pages} images processed</span>
        </div>
      );
    }
    
    if (queueItem.status === 'processing') {
      const currentPage = queueItem.current_page || queueItem.processed_pages + 1;
      return (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Processing image {currentPage}/{queueItem.total_pages}</span>
        </div>
      );
    }
    
    if (queueItem.status === 'error') {
      return (
        <div className="text-sm text-destructive">
          Processing failed at image {queueItem.processed_pages + 1}/{queueItem.total_pages}
        </div>
      );
    }
    
    return (
      <div className="text-sm text-muted-foreground">
        Ready to process {queueItem.total_pages} images
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {getStatusDisplay()}
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{queueItem.processed_pages}/{queueItem.total_pages} • {queueItem.progress_percentage}%</span>
        </div>
        <Progress 
          value={queueItem.progress_percentage} 
          className="h-2 transition-all duration-300" 
        />
      </div>
    </div>
  );
};

export default EnhancedProgressBar;