import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, BookOpen, Upload, FileText, CheckCircle } from 'lucide-react';
import { AddSourceForm } from './AddSourceForm';
import { ImageUploadZone } from './ImageUploadZone';
import { ChunkReviewPanel } from './ChunkReviewPanel';

type ImportStep = 'source' | 'upload' | 'review' | 'complete';

interface ImportProgress {
  totalImages: number;
  processedImages: number;
  totalChunks: number;
  reviewedChunks: number;
}

export const KnowledgeBaseImport = () => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('source');
  const [sourceId, setSourceId] = useState<string>('');
  const [progress, setProgress] = useState<ImportProgress>({
    totalImages: 0,
    processedImages: 0,
    totalChunks: 0,
    reviewedChunks: 0,
  });

  const steps = [
    {
      id: 'source' as ImportStep,
      title: 'Register Source',
      description: 'Add book/document metadata',
      icon: BookOpen,
      completed: !!sourceId,
    },
    {
      id: 'upload' as ImportStep,
      title: 'Upload Images',
      description: 'Scan and process page images',
      icon: Upload,
      completed: progress.processedImages > 0 && progress.processedImages === progress.totalImages,
    },
    {
      id: 'review' as ImportStep,
      title: 'Review Chunks',
      description: 'Verify and edit extracted text',
      icon: FileText,
      completed: progress.reviewedChunks > 0 && progress.reviewedChunks === progress.totalChunks,
    },
    {
      id: 'complete' as ImportStep,
      title: 'Complete',
      description: 'Import finished',
      icon: CheckCircle,
      completed: currentStep === 'complete',
    },
  ];

  const handleSourceCreated = (id: string) => {
    setSourceId(id);
    setCurrentStep('upload');
  };

  const handleImageProgress = (total: number, completed: number) => {
    setProgress(prev => ({
      ...prev,
      totalImages: total,
      processedImages: completed,
      totalChunks: completed, // Each image creates one chunk initially
    }));

    if (completed === total && total > 0) {
      // Auto-advance to review when all images are processed
      setTimeout(() => setCurrentStep('review'), 1000);
    }
  };

  const handleReviewProgress = (reviewed: number, total: number) => {
    setProgress(prev => ({
      ...prev,
      reviewedChunks: reviewed,
    }));

    if (reviewed === total && total > 0) {
      setCurrentStep('complete');
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'source':
        return <AddSourceForm onSourceCreated={handleSourceCreated} />;
      
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Upload Page Images</h2>
              <p className="text-muted-foreground">
                Upload scanned pages or photos of the book pages. Each image will be processed with OCR.
              </p>
            </div>
            <ImageUploadZone 
              sourceId={sourceId} 
              onProgress={handleImageProgress}
            />
            {progress.totalImages > 0 && (
              <div className="flex justify-center">
                <Button
                  onClick={() => setCurrentStep('review')}
                  disabled={progress.processedImages !== progress.totalImages}
                >
                  Continue to Review
                </Button>
              </div>
            )}
          </div>
        );
      
      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Review Extracted Text</h2>
              <p className="text-muted-foreground">
                Review and correct the OCR-extracted text before finalizing the import.
              </p>
            </div>
            <ChunkReviewPanel
              sourceId={sourceId}
              onProgress={handleReviewProgress}
            />
          </div>
        );
      
      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
              <p className="text-muted-foreground">
                Successfully imported {progress.totalImages} pages and {progress.totalChunks} text chunks.
                The content is now available in the knowledge base.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => {
                  setCurrentStep('source');
                  setSourceId('');
                  setProgress({ totalImages: 0, processedImages: 0, totalChunks: 0, reviewedChunks: 0 });
                }}
                variant="outline"
              >
                Import Another Source
              </Button>
              <Button>
                View Knowledge Base
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Knowledge Base Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.completed || currentStep === step.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-muted-foreground/25 text-muted-foreground'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3 text-left min-w-0">
                  <p className={`text-sm font-medium ${
                    currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-4" />
                )}
              </div>
            ))}
          </div>

          {/* Progress Stats */}
          {(progress.totalImages > 0 || progress.totalChunks > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-md">
                <p className="text-2xl font-bold">{progress.totalImages}</p>
                <p className="text-xs text-muted-foreground">Total Images</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-md">
                <p className="text-2xl font-bold">{progress.processedImages}</p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-md">
                <p className="text-2xl font-bold">{progress.totalChunks}</p>
                <p className="text-xs text-muted-foreground">Text Chunks</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-md">
                <p className="text-2xl font-bold">{progress.reviewedChunks}</p>
                <p className="text-xs text-muted-foreground">Reviewed</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div>
        {getStepContent()}
      </div>
    </div>
  );
};