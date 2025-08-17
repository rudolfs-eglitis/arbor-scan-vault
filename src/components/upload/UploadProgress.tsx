import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Upload, X } from 'lucide-react';

interface FileProgress {
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  size: number;
}

interface UploadProgressProps {
  files: File[];
  onCancel: () => void;
  onProgress: (fileIndex: number, progress: number) => void;
  onComplete: () => void;
  onError: (error: string) => void;
  progressUpdater?: (updater: (fileIndex: number, progress: number, status?: 'pending' | 'uploading' | 'completed' | 'error') => void) => void;
}

export const UploadProgress = ({ 
  files, 
  onCancel, 
  onProgress, 
  onComplete, 
  onError,
  progressUpdater 
}: UploadProgressProps) => {
  const [fileProgresses, setFileProgresses] = useState<FileProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<string>('Calculating...');
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);

  // Expose the updateFileProgress function to parent via callback
  const updateFileProgress = (index: number, progress: number, status?: FileProgress['status']) => {
    setFileProgresses(prev => prev.map((file, i) => 
      i === index 
        ? { ...file, progress, status: status || file.status }
        : file
    ));
    
    onProgress(index, progress);
    
    if (progress === 100 && status === 'completed') {
      setCurrentFileIndex(prev => prev + 1);
    }
  };

  // Provide the update function to parent component
  useEffect(() => {
    if (progressUpdater) {
      progressUpdater(updateFileProgress);
    }
  }, [progressUpdater]);

  useEffect(() => {
    // Initialize file progress states
    const initialProgresses = files.map(file => ({
      name: file.name,
      progress: 0,
      status: 'pending' as const,
      size: file.size
    }));
    setFileProgresses(initialProgresses);
    setStartTime(Date.now());
  }, [files]);

  useEffect(() => {
    // Calculate overall progress and time estimates
    const totalFiles = fileProgresses.length;
    const completedFiles = fileProgresses.filter(f => f.status === 'completed').length;
    const currentProgress = fileProgresses.reduce((sum, file) => sum + file.progress, 0) / totalFiles;
    
    setOverallProgress(currentProgress);

    // Calculate time remaining
    if (currentProgress > 0) {
      const elapsedTime = (Date.now() - startTime) / 1000; // seconds
      const estimatedTotalTime = elapsedTime / (currentProgress / 100);
      const remainingTime = estimatedTotalTime - elapsedTime;
      
      if (remainingTime > 0) {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.floor(remainingTime % 60);
        setTimeRemaining(minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);
      } else {
        setTimeRemaining('Almost done...');
      }

      // Calculate upload speed (MB/s)
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const uploadedSize = (totalSize * currentProgress) / 100;
      const speed = uploadedSize / elapsedTime / (1024 * 1024); // MB/s
      setUploadSpeed(speed);
    }

    // Check if all files are completed
    if (completedFiles === totalFiles && totalFiles > 0) {
      onComplete();
    }
  }, [fileProgresses, startTime, files, onComplete]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: FileProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-primary animate-pulse" />;
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Uploading Files ({fileProgresses.filter(f => f.status === 'completed').length}/{files.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {uploadSpeed > 0 && `${uploadSpeed.toFixed(1)} MB/s`}
            </span>
            <span>Time remaining: {timeRemaining}</span>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {fileProgresses.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              {getStatusIcon(file.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={file.progress} 
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {Math.round(file.progress)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-muted-foreground">Total Size</p>
            <p className="font-semibold">
              {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Completed</p>
            <p className="font-semibold">
              {fileProgresses.filter(f => f.status === 'completed').length}/{files.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Speed</p>
            <p className="font-semibold">
              {uploadSpeed > 0 ? `${uploadSpeed.toFixed(1)} MB/s` : '--'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook to use the upload progress functionality
export const useUploadProgress = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);

  const startUpload = (files: File[]) => {
    setCurrentFiles(files);
    setIsUploading(true);
  };

  const cancelUpload = () => {
    setIsUploading(false);
    setCurrentFiles([]);
  };

  const completeUpload = () => {
    setIsUploading(false);
    setCurrentFiles([]);
  };

  return {
    isUploading,
    currentFiles,
    startUpload,
    cancelUpload,
    completeUpload
  };
};